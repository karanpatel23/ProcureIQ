import { describe, expect, it } from 'vitest';
import { leadRequestSchema, rfqSchema, signupSchema } from './validation';

describe('validation schemas', () => {
  it('requires strong signup inputs', () => {
    expect(signupSchema.safeParse({ name: 'A', email: 'bad', password: 'short' }).success).toBe(false);
    expect(signupSchema.safeParse({ name: 'Avery Buyer', email: 'avery@example.com', password: 'long-enough-password' }).success).toBe(true);
  });

  it('validates RFQs with at least one line item', () => {
    const result = rfqSchema.safeParse({ title: 'Valve package', supplierIds: [], items: [{ itemName: 'Valve', quantity: 4 }] });
    expect(result.success).toBe(true);
    expect(rfqSchema.safeParse({ title: 'No lines', supplierIds: [], items: [] }).success).toBe(false);
  });

  it('validates customer-intent lead requests', () => {
    expect(leadRequestSchema.safeParse({ type: 'demo', name: 'Jordan', workEmail: 'jordan@industrial.example', company: 'North Plant', currentTools: 'Email and ERP' }).success).toBe(true);
    expect(leadRequestSchema.safeParse({ type: 'demo', name: 'Jordan', workEmail: 'not-email', company: 'North Plant' }).success).toBe(false);
  });
});
