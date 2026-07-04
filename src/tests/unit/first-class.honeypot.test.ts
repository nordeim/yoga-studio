import { describe, it, expect } from 'vitest';
import { firstClassSchema } from '@/lib/first-class-validation';

/**
 * Unit tests for the honeypot field behavior.
 *
 * Per PAD §6.4, the honeypot (`company` field) is the primary
 * bot-detection mechanism. Bots fill every input; humans don't.
 * The schema must reject any submission where `company` is non-empty.
 *
 * These tests are separated from the schema tests because the
 * honeypot is a security control, not just a validation rule —
 * a regression here would re-open the form to automated spam.
 */
describe('honeypot field (company)', () => {
  const validBase = {
    name: 'Iris Perrin',
    email: 'iris@stillwater.yoga',
    preferredDay: 'Weekday morning',
    notes: '',
  };

  it('accepts when company is an empty string (human)', () => {
    const result = firstClassSchema.safeParse({ ...validBase, company: '' });
    expect(result.success).toBe(true);
  });

  it('accepts when company is undefined (field omitted)', () => {
    const result = firstClassSchema.safeParse({ ...validBase });
    expect(result.success).toBe(true);
  });

  it('rejects when company contains a short string (bot)', () => {
    const result = firstClassSchema.safeParse({ ...validBase, company: 'bot' });
    expect(result.success).toBe(false);
  });

  it('rejects when company contains a long string (bot)', () => {
    const result = firstClassSchema.safeParse({
      ...validBase,
      company: 'Spam-Bot-Inc-International-LLC',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when company contains only whitespace (bot that trimmed)', () => {
    // The company field uses .max(0) without .trim(), so whitespace counts.
    // If the bot fills it with spaces, it should still be rejected.
    const result = firstClassSchema.safeParse({ ...validBase, company: '   ' });
    expect(result.success).toBe(false);
  });
});
