import { expect, it } from 'vitest';
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

it('compares realistic supplier data without inventing missing quote details', () => {
  const db = emptyDatabase();
  const workspaceId = 'wsp_realistic';
  const createdAt = '2026-03-01T00:00:00.000Z';
  db.suppliers.push(
    { id: 'sup_northline', workspaceId, name: 'Northline Metals', status: 'active', createdAt, updatedAt: createdAt },
    { id: 'sup_atlas', workspaceId, name: 'Atlas Components', status: 'active', createdAt, updatedAt: createdAt },
    { id: 'sup_kinetic', workspaceId, name: 'Kinetic Supply', status: 'active', createdAt, updatedAt: createdAt },
  );
  db.rfqs.push({ id: 'rfq_guard', workspaceId, createdByUserId: 'usr_ops', title: 'Conveyor Guard Bracket Package', neededBy: '2026-04-05', supplierIds: ['sup_northline', 'sup_atlas', 'sup_kinetic'], status: 'sent', createdAt, updatedAt: createdAt });
  db.rfqItems.push(
    { id: 'rfi_guard', workspaceId, rfqId: 'rfq_guard', itemName: 'Guard bracket', quantity: 100, unit: 'ea', createdAt },
    { id: 'rfi_fastener', workspaceId, rfqId: 'rfq_guard', itemName: 'Fastener kit', quantity: 100, unit: 'kit', createdAt },
  );
  db.supplierQuotes.push(
    { id: 'quote_northline', workspaceId, rfqId: 'rfq_guard', supplierId: 'sup_northline', status: 'accepted', extractionStatus: 'approved', currency: 'USD', confidenceScore: 91, reviewedFields: { totalPrice: { value: 18750 }, estimatedLeadTime: { value: '14 days' }, paymentTerms: { value: 'Net 30' }, freightTerms: { value: 'Included' }, validUntil: { value: '2099-05-01' }, notes: { value: 'Standard packaging included.' } }, createdAt, updatedAt: createdAt },
    { id: 'quote_atlas', workspaceId, rfqId: 'rfq_guard', supplierId: 'sup_atlas', status: 'accepted', extractionStatus: 'approved', currency: 'USD', confidenceScore: 72, reviewedFields: { totalPrice: { value: 16200 }, estimatedLeadTime: { value: '21 days' }, paymentTerms: { value: 'Net 15' }, validUntil: { value: '2099-04-20' }, notes: { value: 'Freight excluded and expedited packaging not included.' } }, createdAt, updatedAt: createdAt },
    { id: 'quote_kinetic', workspaceId, rfqId: 'rfq_guard', supplierId: 'sup_kinetic', status: 'accepted', extractionStatus: 'approved', currency: 'USD', confidenceScore: 58, reviewedFields: { totalPrice: { value: 20400 }, estimatedLeadTime: { value: '7 days' }, freightTerms: { value: 'Prepaid and add' }, validUntil: { value: '' } }, createdAt, updatedAt: createdAt },
  );
  db.quoteLineItems.push(
    { id: 'qli_north_guard', workspaceId, supplierQuoteId: 'quote_northline', rfqItemId: 'rfi_guard', description: 'Guard bracket', quantity: 100, unitPrice: 165, createdAt },
    { id: 'qli_north_fastener', workspaceId, supplierQuoteId: 'quote_northline', rfqItemId: 'rfi_fastener', description: 'Fastener kit', quantity: 100, unitPrice: 22.5, createdAt },
    { id: 'qli_atlas_guard', workspaceId, supplierQuoteId: 'quote_atlas', rfqItemId: 'rfi_guard', description: 'Guard bracket', quantity: 100, unitPrice: 162, createdAt },
    { id: 'qli_kinetic_guard', workspaceId, supplierQuoteId: 'quote_kinetic', rfqItemId: 'rfi_guard', description: 'Guard bracket', quantity: 100, unitPrice: 181, createdAt },
    { id: 'qli_kinetic_fastener', workspaceId, supplierQuoteId: 'quote_kinetic', rfqItemId: 'rfi_fastener', description: 'Fastener kit', quantity: 100, unitPrice: 23, createdAt },
  );

  const comparison = buildRfqComparison(db, db.rfqs[0]);
  const atlasRisks = comparison.quotes.find((quote) => quote.supplierName === 'Atlas Components')?.risks.map((risk) => risk.code);
  const kineticRisks = comparison.quotes.find((quote) => quote.supplierName === 'Kinetic Supply')?.risks.map((risk) => risk.code);

  expect(comparison.quotes).toHaveLength(3);
  expect(comparison.recommendation?.lowestCost.supplierName).toBe('Atlas Components');
  expect(comparison.recommendation?.fastest.supplierName).toBe('Kinetic Supply');
  expect(comparison.recommendation?.overall.supplierName).toBe('Northline Metals');
  expect(atlasRisks).toEqual(expect.arrayContaining(['missing_freight', 'notes_exclusions', 'missing_item']));
  expect(kineticRisks).toEqual(expect.arrayContaining(['missing_payment_terms', 'missing_validity', 'low_confidence']));
  expect(comparison.recommendation?.reasons.join(' ')).toContain('Review all risk flags');
});
