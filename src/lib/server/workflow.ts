import { createId, now } from './db';
import type { WorkflowPhase, WorkflowRun, WorkflowStep, WorkflowType } from './schema';

/*
 * Bounded AI workflow engine.
 *
 * A "loop" is not a chatbot and not an open-ended agent. It is a state machine
 * that advances at most `maxSteps` times, records a traceable step each time,
 * and terminates the moment it converges OR its controller reports no further
 * safe improvement. Two independent termination guarantees (the hard step cap
 * and the null-return from `advance`) mean it can never run unbounded.
 *
 * Loops end by handing an editable result to a human: no external action
 * (send RFQ, accept quote, issue PO) happens from inside a loop.
 */
export const DEFAULT_MAX_STEPS = 6;
export const HARD_STEP_CEILING = 12;

export type LoopController<S> = {
  maxSteps: number;
  /**
   * Apply one reasoning step. Return the new state plus a trace step, or null
   * when the loop has converged / has no further safe improvement to make.
   */
  advance: (state: S, stepIndex: number) => { state: S; step: Omit<WorkflowStep, 'index' | 'at'> } | null;
};

export type LoopResult<S> = { state: S; steps: WorkflowStep[]; converged: boolean };

export function runLoop<S>(initialState: S, controller: LoopController<S>): LoopResult<S> {
  const maxSteps = Math.min(Math.max(1, controller.maxSteps), HARD_STEP_CEILING);
  let state = initialState;
  const steps: WorkflowStep[] = [];
  let converged = false;
  for (let index = 0; index < maxSteps; index += 1) {
    const outcome = controller.advance(state, index);
    if (!outcome) { converged = true; break; }
    state = outcome.state;
    steps.push({ ...outcome.step, index, at: now() });
  }
  return { state, steps, converged };
}

/** Assemble a persistable run record from a completed loop. */
export function buildRun<S>(input: {
  workspaceId: string;
  type: WorkflowType;
  entityId?: string;
  createdByUserId?: string;
  maxSteps: number;
  state: S;
  steps: WorkflowStep[];
  openItems: string[];
  score?: number;
}): WorkflowRun {
  const timestamp = now();
  const awaitStep: WorkflowStep = {
    index: input.steps.length,
    phase: 'await_approval' as WorkflowPhase,
    summary: input.openItems.length
      ? `Prepared a refined draft with ${input.openItems.length} item(s) needing your input. Awaiting human approval.`
      : 'Draft is complete and internally consistent. Awaiting human approval before any external action.',
    at: timestamp,
  };
  return {
    id: createId('wfr'),
    workspaceId: input.workspaceId,
    type: input.type,
    entityId: input.entityId,
    status: 'awaiting_approval',
    step: input.steps.length,
    maxSteps: input.maxSteps,
    score: input.score,
    state: input.state,
    steps: [...input.steps, awaitStep],
    openItems: input.openItems,
    createdByUserId: input.createdByUserId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
