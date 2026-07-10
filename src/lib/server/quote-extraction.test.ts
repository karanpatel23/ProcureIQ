import { expect, it } from 'vitest';
import { runQuoteExtraction } from './quote-extraction';

it('keeps local extraction compatible with structured quote schema', async () => {
  const result = await runQuoteExtraction('Supplier: Atlas Components\nQuote #Q-100\nTotal: $1,240.00\nPayment terms: Net 30\nLead time: 12 days', 'Atlas Components');
  expect(result.provider).toBe('local');
  expect(result.parsed.supplierName.value).toContain('Atlas');
  expect(result.parsed.totalPrice.value).toBe(1240);
  expect(result.parsed.lineItems[0].unitPrice.confidence).toBeGreaterThan(0);
});

it('preserves uncertainty instead of inventing values for missing fields', () => {
  const result = runQuoteExtraction('We can supply the brackets you asked about. Will confirm pricing next week.');
  expect(result.parsed.totalPrice.value).toBeNull();
  expect(result.parsed.totalPrice.confidence).toBeLessThan(50);
  expect(result.parsed.paymentTerms.value).toBeNull();
  expect(result.parsed.validUntil.value).toBeNull();
  expect(result.parsed.quoteConfidence).toBeLessThan(60);
});

it('reports low overall confidence when the supplier cannot be identified', () => {
  const result = runQuoteExtraction('Total: $500');
  expect(result.parsed.supplierName.value).toBeNull();
  expect(result.parsed.quoteConfidence).toBeLessThan(60);
});

// Regression: a "Unit price $..." line before "Total: $..." must not be
// mistaken for the quote total (caught by the autopilot end-to-end test).
import { it as regressionIt, expect as regressionExpect } from 'vitest';
import { runQuoteExtraction as extractForRegression } from './quote-extraction';
regressionIt('prefers the labeled total over an earlier unit price', () => {
  const text = 'Supplier: Acme Metals\nItem: Bracket, Qty 10, Unit price $2,000.00, Extended $20,000.00\nTotal: $20,000.00\nLead time: 10 days';
  regressionExpect(extractForRegression(text).parsed.totalPrice.value).toBe(20000);
});
