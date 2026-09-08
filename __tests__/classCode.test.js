import { describe, it, expect } from 'vitest';
import {
  generateClassCode,
  isValidClassCodeFormat,
  normalizeClassCode,
  generateUniqueClassCode,
} from '../src/utils/classCode.js';

describe('classCode', () => {
  describe('generateClassCode', () => {
    it('produces an XXX-XXX code in the valid format', () => {
      for (let i = 0; i < 50; i++) {
        expect(isValidClassCodeFormat(generateClassCode())).toBe(true);
      }
    });

    it('never uses confusable characters 0 O 1 I', () => {
      for (let i = 0; i < 50; i++) {
        expect(generateClassCode()).not.toMatch(/[01OI]/);
      }
    });

    it('is deterministic given a seeded rand', () => {
      const rand = () => 0; // always first alphabet char -> 'A'
      expect(generateClassCode(rand)).toBe('AAA-AAA');
    });
  });

  describe('isValidClassCodeFormat', () => {
    it('accepts a well-formed code', () => {
      expect(isValidClassCodeFormat('K7P-2QM')).toBe(true);
    });

    it('rejects missing hyphen, wrong length, and bad chars', () => {
      expect(isValidClassCodeFormat('K7P2QM')).toBe(false);
      expect(isValidClassCodeFormat('K7-2QM')).toBe(false);
      expect(isValidClassCodeFormat('K7P-2Q0')).toBe(false); // 0 not in alphabet
      expect(isValidClassCodeFormat('k7p-2qm')).toBe(false); // lowercase
    });
  });

  describe('normalizeClassCode', () => {
    it('uppercases and re-inserts the hyphen from 6 raw chars', () => {
      expect(normalizeClassCode('k7p2qm')).toBe('K7P-2QM');
      expect(normalizeClassCode('K7P-2QM')).toBe('K7P-2QM');
      expect(normalizeClassCode(' k7p 2qm ')).toBe('K7P-2QM');
    });

    it('leaves non-6-char input hyphen-free (partial typing)', () => {
      expect(normalizeClassCode('k7p')).toBe('K7P');
      expect(normalizeClassCode('')).toBe('');
    });

    it('tolerates null/undefined', () => {
      expect(normalizeClassCode(null)).toBe('');
      expect(normalizeClassCode(undefined)).toBe('');
    });
  });

  describe('generateUniqueClassCode', () => {
    it('returns the first non-colliding code', async () => {
      const taken = new Set(['AAA-AAA']);
      let call = 0;
      // rand is called once per character: first 6 chars -> 'AAA-AAA' (taken),
      // next 6 -> 'BBB-BBB' (free). 1/32 floors to alphabet index 1 = 'B'.
      const rand = () => (call++ < 6 ? 0 : 1 / 32);
      const code = await generateUniqueClassCode((c) => Promise.resolve(taken.has(c)), rand);
      expect(code).toBe('BBB-BBB');
    });

    it('throws after 10 collisions', async () => {
      await expect(
        generateUniqueClassCode(() => Promise.resolve(true))
      ).rejects.toThrow(/unique class code/);
    });
  });
});
