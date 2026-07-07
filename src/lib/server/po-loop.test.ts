import { describe, expect, it } from 'vitest';
import { runPoGenerationLoop, type PoLoopInput } from './po-loop';

const WORKSPACE = 'wsp_test';
const base: PoLoopInput = { poTotal: 1000, poSubtotal: 900, poTaxes: 60, poFreight: 40, poLineCount: 2, selectedQuoteTotal: 1000, rfqItemCount: 2, supplierEmail: 'a@x.com', paymentTerms: 'Net 30' };

describe('PO Generation Loop', () => {
  it('passes a clean PO that reconciles with the quote and RFQ', () => {
    const out = runPoGenerationLoop({ workspaceId: WORKSPACE, po: base });
    expect(out.readyToApprove).toBe(true);
    expect(out.openItems.filter((o) => o.severity === 'warning')).toHaveLength(0);
    expect(out.run.type).toBe('po_generation');
    expect(out.run.status).toBe('awaiting_approval'); // never auto-approves
  });

  it('flags a PO total that drifted from the approved quote', () => {
    const out = runPoGenerationLoop({ workspaceId: WORKSPACE, po: { ...base, poTotal: 1500, poSubtotal: 1400 } });
    expect(out.openItems.some((o) => /does not match the approved quote/.test(o.message))).toBe(true);
    expect(out.readyToApprove).toBe(false);
  });

  it('flags broken PO arithmetic (subtotal + tax + freight != total)', () => {
    const out = runPoGenerationLoop({ workspaceId: WORKSPACE, po: { ...base, poSubtotal: 500 } });
    expect(out.openItems.some((o) => /does not equal the stated total/.test(o.message))).toBe(true);
  });

  it('flags incomplete line coverage vs the RFQ', () => {
    const out = runPoGenerationLoop({ workspaceId: WORKSPACE, po: { ...base, poLineCount: 1, rfqItemCount: 3 } });
    expect(out.openItems.some((o) => /covers 1 of 3/.test(o.message))).toBe(true);
  });

  it('notes a missing supplier email as a send limitation (info, not a blocker)', () => {
    const out = runPoGenerationLoop({ workspaceId: WORKSPACE, po: { ...base, supplierEmail: undefined } });
    const item = out.openItems.find((o) => o.field === 'supplierEmail');
    expect(item?.severity).toBe('info');
    expect(out.readyToApprove).toBe(true); // info alone does not block approval
  });

  it('records a bounded trace ending awaiting approval', () => {
    const out = runPoGenerationLoop({ workspaceId: WORKSPACE, po: base });
    expect(out.run.steps.length).toBeLessThanOrEqual(3);
    expect(out.run.steps.at(-1)?.phase).toBe('await_approval');
  });
});
