import { describe, expect, it } from 'vitest';
import { runRfqBuilderLoop, type RfqLoopState } from './rfq-loop';
import { runLoop, HARD_STEP_CEILING } from './workflow';

const WORKSPACE = 'wsp_test';

describe('bounded loop engine', () => {
  it('never exceeds maxSteps even if the controller always wants to continue', () => {
    let calls = 0;
    const { steps } = runLoop({ n: 0 }, {
      maxSteps: 4,
      advance: (state) => { calls += 1; return { state: { n: state.n + 1 }, step: { phase: 'refine', summary: 'tick' } }; },
    });
    expect(steps).toHaveLength(4);
    expect(calls).toBe(4);
  });

  it('clamps runaway maxSteps to the hard ceiling', () => {
    const { steps } = runLoop({ n: 0 }, {
      maxSteps: 9999,
      advance: (state) => ({ state: { n: state.n + 1 }, step: { phase: 'refine', summary: 'tick' } }),
    });
    expect(steps.length).toBeLessThanOrEqual(HARD_STEP_CEILING);
  });

  it('terminates early when the controller reports convergence (null)', () => {
    const { steps, converged } = runLoop({ n: 0 }, {
      maxSteps: 8,
      advance: (state, i) => (i < 2 ? { state: { n: state.n + 1 }, step: { phase: 'refine', summary: 'tick' } } : null),
    });
    expect(steps).toHaveLength(2);
    expect(converged).toBe(true);
  });
});

describe('RFQ Builder Loop', () => {
  function weakDraft(): RfqLoopState {
    return { title: '', description: '', items: [{ itemName: 'Stainless steel bracket', description: '' }], supplierCount: 1 };
  }

  it('safely derives a title from the first item and infers a unit — never fabricating specs', () => {
    const out = runRfqBuilderLoop({ workspaceId: WORKSPACE, draft: weakDraft() });
    expect(out.refinedState.title).toBe('Stainless steel bracket — request for quote');
    expect(out.refinedState.items?.[0].unit).toBe('ea');
    // It must NOT invent a specification for the item.
    expect(out.refinedState.items?.[0].description ?? '').toBe('');
  });

  it('surfaces commercial gaps as open items instead of inventing them', () => {
    const out = runRfqBuilderLoop({ workspaceId: WORKSPACE, draft: weakDraft() });
    const joined = out.openItems.map((o) => o.field).join(' ');
    expect(joined).toContain('items[0].quantity'); // missing quantity stays a human decision
    expect(out.openItems.some((o) => o.field === 'neededBy')).toBe(true);
    expect(out.readyToSend).toBe(false);
  });

  it('records a traceable, bounded trace and ends awaiting human approval', () => {
    const out = runRfqBuilderLoop({ workspaceId: WORKSPACE, draft: weakDraft(), maxSteps: 6 });
    expect(out.run.status).toBe('awaiting_approval');
    expect(out.run.step).toBeLessThanOrEqual(6);
    // Last step is the approval gate; earlier steps carry phases + confidence.
    expect(out.run.steps.at(-1)?.phase).toBe('await_approval');
    expect(out.run.steps.some((s) => s.phase === 'self_review')).toBe(true);
    expect(out.run.steps.every((s) => typeof s.index === 'number' && typeof s.at === 'string')).toBe(true);
  });

  it('generates supplier-ready language from whatever is present', () => {
    const out = runRfqBuilderLoop({ workspaceId: WORKSPACE, draft: weakDraft() });
    expect(out.supplierReadyDraft).toContain('Stainless steel bracket');
    expect(out.supplierReadyDraft.toLowerCase()).toContain('quote');
  });

  it('marks a complete, specific RFQ ready with no open warnings', () => {
    const strong: RfqLoopState = {
      title: 'Conveyor guard brackets — RFQ',
      description: 'Guard brackets for a food-grade washdown conveyor; must resist corrosion.',
      neededBy: '2099-01-01',
      deliveryLocation: 'Cleveland, OH',
      supplierCount: 3,
      items: [{ itemName: 'Guard bracket', description: '304 stainless, 3mm, bead-blast finish', quantity: 20, unit: 'ea' }],
    };
    const out = runRfqBuilderLoop({ workspaceId: WORKSPACE, draft: strong });
    expect(out.readyToSend).toBe(true);
    expect(out.score).toBeGreaterThanOrEqual(80);
    expect(out.openItems.filter((o) => o.severity === 'warning')).toHaveLength(0);
  });

  it('does not mutate the caller-supplied draft object', () => {
    const draft = weakDraft();
    runRfqBuilderLoop({ workspaceId: WORKSPACE, draft });
    expect(draft.title).toBe('');
    expect(draft.items?.[0].unit).toBeUndefined();
  });
});
