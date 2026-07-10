import { describe, expect, it } from 'vitest';
import { parseIntakeRequest } from './intake';

describe('intake parser', () => {
  it('parses a plain-English request into structured items', () => {
    const parsed = parseIntakeRequest('We need 20 guard brackets and 50 M8 hex bolts for the line rebuild. Deliver to Plant 2, Cleveland. Needed by 2026-08-01.');
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ itemName: expect.stringContaining('guard brackets'), quantity: 20 }),
      expect.objectContaining({ itemName: expect.stringContaining('M8 hex bolts'), quantity: 50 }),
    ]));
    expect(parsed.neededBy).toBe('2026-08-01');
    expect(parsed.deliveryLocation).toContain('Plant 2');
    expect(parsed.missing).toHaveLength(0);
  });

  it('parses bulleted email-style lists with units', () => {
    const parsed = parseIntakeRequest('Hi team,\nPlease order:\n- 12 boxes nitrile gloves\n- 4 rolls shrink wrap\nThanks');
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]).toMatchObject({ quantity: 12, unit: 'boxes' });
    expect(parsed.items[1]).toMatchObject({ quantity: 4, unit: 'rolls' });
  });

  it('parses "item xN" ordering and month-name dates', () => {
    const parsed = parseIntakeRequest('Steel shims x40 needed by Aug 1 for maintenance');
    expect(parsed.items[0]).toMatchObject({ itemName: expect.stringContaining('Steel shims'), quantity: 40 });
    expect(parsed.neededBy).toMatch(/\d{4}-08-01/);
  });

  it('names the gaps instead of inventing values', () => {
    const parsed = parseIntakeRequest('Please buy 5 safety harnesses when you get a chance');
    expect(parsed.items).toHaveLength(1);
    expect(parsed.missing.join(' ')).toContain('need-by');
    expect(parsed.missing.join(' ')).toContain('delivery');
    expect(parsed.neededBy).toBeUndefined();
  });

  it('reports when nothing parseable exists rather than guessing', () => {
    const parsed = parseIntakeRequest('hello can you help with the thing we discussed');
    expect(parsed.items).toHaveLength(0);
    expect(parsed.missing[0]).toContain('No line items');
  });
});
