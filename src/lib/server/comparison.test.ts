import { describe, expect, it } from 'vitest';
import { buildRfqComparison } from './comparison';
import { emptyDatabase } from './schema';

it('scores approved supplier quotes and flags missing terms', () => {
  const db = emptyDatabase();
  const workspaceId = 'wsp_test';
  db.suppliers.push({ id: 'sup_fast', workspaceId, name: 'Fast Supply', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
  db.suppliers.push({ id: 'sup_low', workspaceId, name: 'Low Cost Metals', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
  db.rfqs.push({ id: 'rfq_1', workspaceId, createdByUserId: 'usr_1', title: 'Pump assemblies', supplierIds: ['sup_fast', 'sup_low'], status: 'draft', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
  db.rfqItems.push({ id: 'rfi_1', workspaceId, rfqId: 'rfq_1', itemName: 'Pump', quantity: 10, unit: 'ea', createdAt: '2026-01-01T00:00:00.000Z' });
  db.supplierQuotes.push({ id: 'quote_fast', workspaceId, rfqId: 'rfq_1', supplierId: 'sup_fast', status: 'accepted', extractionStatus: 'approved', currency: 'USD', confidenceScore: 94, reviewedFields: { totalPrice: { value: 1200 }, estimatedLeadTime: { value: '4 days' }, paymentTerms: { value: 'Net 30' }, freightTerms: { value: 'Included' }, validUntil: { value: '2099-01-01' } }, createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' });
  db.supplierQuotes.push({ id: 'quote_low', workspaceId, rfqId: 'rfq_1', supplierId: 'sup_low', status: 'accepted', extractionStatus: 'approved', currency: 'USD', confidenceScore: 55, reviewedFields: { totalPrice: { value: 1000 }, estimatedLeadTime: { value: '20 days' }, validUntil: { value: '' } }, createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' });
  db.quoteLineItems.push({ id: 'qli_1', workspaceId, supplierQuoteId: 'quote_fast', rfqItemId: 'rfi_1', description: 'Pump', quantity: 10, unitPrice: 120, createdAt: '2026-01-02T00:00:00.000Z' });
  db.quoteLineItems.push({ id: 'qli_2', workspaceId, supplierQuoteId: 'quote_low', rfqItemId: 'rfi_1', description: 'Pump', quantity: 10, unitPrice: 100, createdAt: '2026-01-02T00:00:00.000Z' });

  const comparison = buildRfqComparison(db, db.rfqs[0]);
  expect(comparison.quotes).toHaveLength(2);
  expect(comparison.recommendation?.lowestCost.supplierName).toBe('Low Cost Metals');
  expect(comparison.quotes.find((quote) => quote.supplierName === 'Low Cost Metals')?.risks.map((risk) => risk.code)).toContain('missing_payment_terms');
  expect(comparison.recommendation?.overall.supplierName).toBe('Fast Supply');
});
