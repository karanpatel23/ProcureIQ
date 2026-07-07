import { analyzeRfq, type RfqAdvisorInput, type RfqSuggestion } from './rfq-advisor';
import { runLoop, type LoopController } from './workflow';
import { generateRfqEmailDraft } from './rfq-email';
import type { WorkflowRun } from './schema';
import { buildRun } from './workflow';

/*
 * RFQ Builder Loop.
 *
 * Turns the one-shot advisor into a bounded reasoning loop: understand the
 * draft, self-review it, apply only SAFE deterministic improvements (never
 * fabricating commercial facts), re-review, and repeat until the request is
 * supplier-ready or no further safe improvement remains. Anything the AI
 * cannot safely infer (quantities, deadlines, real specifications) is surfaced
 * as an "open item" for the human — inferred, never invented.
 *
 * The loop ends by handing the human an editable, refined draft plus the full
 * reasoning trace. It never sends anything.
 */
export type RfqLoopItem = { itemName?: string; description?: string; quantity?: number; unit?: string };
export type RfqLoopState = RfqAdvisorInput & { items?: RfqLoopItem[] };

// Suggestion codes the loop can resolve on its own, safely and reversibly.
const AUTO_FIXABLE = new Set(['title_missing', 'item_unit']);

function firstItemName(state: RfqLoopState): string | undefined {
  return state.items?.find((item) => item.itemName && item.itemName.trim())?.itemName?.trim();
}

/** Apply one safe improvement for the given suggestion. Returns the changed field, or null. */
function applyFix(state: RfqLoopState, suggestion: RfqSuggestion): string | null {
  if (suggestion.code === 'title_missing') {
    const derived = firstItemName(state);
    if (!derived) return null;
    state.title = `${derived} — request for quote`;
    return 'title';
  }
  if (suggestion.code === 'item_unit') {
    // field looks like "items[2].unit"
    const match = /items\[(\d+)\]/.exec(suggestion.field);
    const index = match ? Number(match[1]) : -1;
    const item = state.items?.[index];
    if (!item || item.unit) return null;
    item.unit = 'ea'; // safe default unit of measure; low confidence, user-editable
    return `items[${index}].unit`;
  }
  return null;
}

function buildController(maxSteps: number): LoopController<RfqLoopState> {
  return {
    maxSteps,
    advance(state, stepIndex) {
      const advice = analyzeRfq(state);
      const fixable = advice.suggestions.filter((s) => AUTO_FIXABLE.has(s.code));

      // First pass records the understanding + initial self-review even if nothing is fixable.
      if (stepIndex === 0) {
        const changed: string[] = [];
        for (const suggestion of fixable) {
          const field = applyFix(state, suggestion);
          if (field) changed.push(field);
        }
        return {
          state,
          step: {
            phase: 'self_review',
            summary: changed.length
              ? `Reviewed the draft (score ${advice.score}); safely improved ${changed.join(', ')}.`
              : `Reviewed the draft (score ${advice.score}); no changes safe to auto-apply.`,
            confidence: changed.length ? 0.6 : 0.9,
            missingFields: advice.suggestions.filter((s) => s.severity === 'warning').map((s) => s.field),
            changed: changed.length ? changed : undefined,
          },
        };
      }

      // Subsequent passes: only continue if there is still something safe to change.
      if (fixable.length === 0) return null;
      const changed: string[] = [];
      for (const suggestion of fixable) {
        const field = applyFix(state, suggestion);
        if (field) changed.push(field);
      }
      if (changed.length === 0) return null; // no progress → converged (prevents spin)
      return {
        state,
        step: {
          phase: 'refine',
          summary: `Applied further safe improvements: ${changed.join(', ')}.`,
          confidence: 0.6,
          changed,
        },
      };
    },
  };
}

export type RfqLoopOutput = {
  run: WorkflowRun;
  refinedState: RfqLoopState;
  openItems: Array<{ field: string; message: string; suggestion?: string; severity: 'info' | 'warning' }>;
  supplierReadyDraft: string;
  score: number;
  readyToSend: boolean;
};

export function runRfqBuilderLoop(input: {
  workspaceId: string;
  createdByUserId?: string;
  entityId?: string;
  draft: RfqLoopState;
  maxSteps?: number;
}): RfqLoopOutput {
  const maxSteps = input.maxSteps ?? 6;
  // Deep-clone so the loop's mutations never leak into the caller's object.
  const initial: RfqLoopState = JSON.parse(JSON.stringify(input.draft ?? {}));

  const { state, steps } = runLoop(initial, buildController(maxSteps));

  // Final self-review after all safe fixes are applied.
  const advice = analyzeRfq(state);
  const openItems = advice.suggestions
    .filter((s) => !AUTO_FIXABLE.has(s.code) || s.severity === 'warning')
    .map((s) => ({ field: s.field, message: s.message, suggestion: s.suggestion, severity: s.severity }));

  // Generate supplier-ready language (safe framing, not fabricated specs).
  const supplierReadyDraft = generateRfqEmailDraft({
    rfq: {
      id: 'preview',
      workspaceId: input.workspaceId,
      createdByUserId: input.createdByUserId ?? '',
      title: state.title || 'Request for quote',
      description: state.description,
      neededBy: state.neededBy,
      deliveryLocation: state.deliveryLocation,
      supplierIds: [],
      status: 'draft',
      createdAt: '',
      updatedAt: '',
    },
    items: (state.items ?? []).map((item, index) => ({
      id: `preview_${index}`,
      workspaceId: input.workspaceId,
      rfqId: 'preview',
      itemName: item.itemName || `Item ${index + 1}`,
      description: item.description,
      quantity: item.quantity ?? 0,
      unit: item.unit,
      createdAt: '',
    })),
    suppliers: [],
    workspaceName: 'your team',
  });

  const run = buildRun({
    workspaceId: input.workspaceId,
    type: 'rfq_builder',
    entityId: input.entityId,
    createdByUserId: input.createdByUserId,
    maxSteps,
    state,
    steps,
    openItems: openItems.map((o) => o.message),
    score: advice.score,
  });

  return { run, refinedState: state, openItems, supplierReadyDraft, score: advice.score, readyToSend: advice.readyToSend };
}
