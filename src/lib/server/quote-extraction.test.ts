import { expect, it } from 'vitest';
import { runQuoteExtraction } from './quote-extraction';

it('keeps local extraction compatible with structured quote schema', async () => {
  const result = await runQuoteExtraction('Supplier: Atlas Components\nQuote #Q-100\nTotal: $1,240.00\nPayment terms: Net 30\nLead time: 12 days', 'Atlas Components');
  expect(result.provider).toBe('local');
  expect(result.parsed.supplierName.value).toContain('Atlas');
  expect(result.parsed.totalPrice.value).toBe(1240);
  expect(result.parsed.lineItems[0].unitPrice.confidence).toBeGreaterThan(0);
});
