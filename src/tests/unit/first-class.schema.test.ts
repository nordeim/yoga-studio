import { describe, it, expect } from 'vitest';
import { firstClassSchema } from '@/lib/first-class-validation';

/**
 * Unit tests for the First-Class-Free Zod schema.
 *
 * Per PAD §8.2, the schema is a priority test surface. These tests
 * guard the validation boundary: any change to the field rules
 * (min/max lengths, email format, enum values, honeypot) must
 * update or break a test here.
 */
describe('firstClassSchema', () => {
  const validInput = {
    name: 'Iris Perrin',
    email: 'iris@stillwater.yoga',
    preferredDay: 'Weekday morning',
    notes: 'Looking forward to it.',
    company: '',
  };

  describe('happy path', () => {
    it('accepts a fully valid submission', () => {
      const result = firstClassSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('accepts submission without optional notes', () => {
      const { notes, ...withoutNotes } = validInput;
      const result = firstClassSchema.safeParse(withoutNotes);
      expect(result.success).toBe(true);
    });

    it('accepts empty string for notes', () => {
      const result = firstClassSchema.safeParse({ ...validInput, notes: '' });
      expect(result.success).toBe(true);
    });
  });

  describe('name validation', () => {
    it('rejects a name shorter than 2 characters', () => {
      const result = firstClassSchema.safeParse({ ...validInput, name: 'A' });
      expect(result.success).toBe(false);
    });

    it('rejects a name longer than 80 characters', () => {
      const result = firstClassSchema.safeParse({
        ...validInput,
        name: 'A'.repeat(81),
      });
      expect(result.success).toBe(false);
    });

    it('trims whitespace before length validation', () => {
      const result = firstClassSchema.safeParse({ ...validInput, name: '  Iris  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Iris');
      }
    });
  });

  describe('email validation', () => {
    it('rejects an invalid email format', () => {
      const result = firstClassSchema.safeParse({ ...validInput, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('rejects an email longer than 160 characters', () => {
      const longEmail = 'a'.repeat(150) + '@example.com';
      const result = firstClassSchema.safeParse({ ...validInput, email: longEmail });
      expect(result.success).toBe(false);
    });
  });

  describe('preferredDay validation', () => {
    it('rejects an invalid preferred day', () => {
      const result = firstClassSchema.safeParse({
        ...validInput,
        preferredDay: 'Never on a Sunday',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('notes validation', () => {
    it('rejects notes longer than 500 characters', () => {
      const result = firstClassSchema.safeParse({
        ...validInput,
        notes: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('honeypot (company field)', () => {
    it('accepts an empty company field (human submission)', () => {
      const result = firstClassSchema.safeParse({ ...validInput, company: '' });
      expect(result.success).toBe(true);
    });

    it('rejects a non-empty company field (bot detected)', () => {
      const result = firstClassSchema.safeParse({
        ...validInput,
        company: 'Spam Bot LLC',
      });
      expect(result.success).toBe(false);
    });
  });
});
