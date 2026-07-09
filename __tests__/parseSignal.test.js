import { describe, it, expect } from 'vitest';
import { parseSignal } from '../src/utils/parseSignal.js';

describe('parseSignal', () => {
  describe('basic parsing', () => {
    it('should parse a Phase 1 signal tag', () => {
      const raw = 'Hi! I need help with this problem!\n<!-- ZIPPY_MOVE:PRESENT_CONTEXT PHASE:1 -->';
      const result = parseSignal(raw);

      expect(result.visibleText).toBe('Hi! I need help with this problem!');
      expect(result.signal).toEqual({ move: 'PRESENT_CONTEXT', phase: 1 });
    });

    it('should parse a Phase 2 signal with misconception', () => {
      const raw = 'So if we add 9 to both sides...\n<!-- ZIPPY_MOVE:INTRODUCE_MISCONCEPTION PHASE:2 MISCONCEPTION:M1 -->';
      const result = parseSignal(raw);

      expect(result.visibleText).toBe('So if we add 9 to both sides...');
      expect(result.signal).toEqual({
        move: 'INTRODUCE_MISCONCEPTION',
        phase: 2,
        misconception: 'M1',
      });
    });

    it('should parse a Phase 2 signal with misconception and signal value', () => {
      const raw = 'Thanks for showing me that!\n<!-- ZIPPY_MOVE:ACKNOWLEDGE_CORRECTION PHASE:2 MISCONCEPTION:M2 SIGNAL:CORRECTED -->';
      const result = parseSignal(raw);

      expect(result.visibleText).toBe('Thanks for showing me that!');
      expect(result.signal).toEqual({
        move: 'ACKNOWLEDGE_CORRECTION',
        phase: 2,
        misconception: 'M2',
        signal: 'CORRECTED',
      });
    });

    it('should parse Phase 3 signal with SIGNAL value (phase advance)', () => {
      const raw = 'I wonder if this always works...\n<!-- ZIPPY_MOVE:ASK_GENERALIZATION PHASE:4 SIGNAL:EXPLAINED -->';
      const result = parseSignal(raw);

      expect(result.signal).toEqual({
        move: 'ASK_GENERALIZATION',
        phase: 4,
        signal: 'EXPLAINED',
      });
    });

    it('should parse Phase 5 closing summary', () => {
      const raw = 'Thank you SO much! Today you taught me...\n<!-- ZIPPY_MOVE:CLOSING_SUMMARY PHASE:5 SIGNAL:YES -->';
      const result = parseSignal(raw);

      expect(result.signal).toEqual({
        move: 'CLOSING_SUMMARY',
        phase: 5,
        signal: 'YES',
      });
    });
  });

  describe('all valid MOVE_IDs', () => {
    const validMoves = [
      'PRESENT_CONTEXT', 'INVITE_EXPLANATION', 'REQUEST_STEP_BY_STEP',
      'INTRODUCE_MISCONCEPTION', 'PROBE_REASONING', 'FOLLOW_WRONG_PATH', 'ACKNOWLEDGE_CORRECTION',
      'ASK_PATTERN_RECOGNITION', 'PROBE_PATTERN_REASON',
      'ASK_GENERALIZATION', 'PROBE_BOUNDARY',
      'PRESENT_TRANSFER', 'PROBE_TRANSFER_WHY', 'CLOSING_SUMMARY',
      'EXPRESS_CONFUSION',
    ];

    validMoves.forEach(move => {
      it(`should accept MOVE_ID: ${move}`, () => {
        const phase = move === 'EXPRESS_CONFUSION' ? 3 : 1;
        const raw = `Text <!-- ZIPPY_MOVE:${move} PHASE:${phase} -->`;
        const result = parseSignal(raw);
        expect(result.signal).not.toBeNull();
        expect(result.signal.move).toBe(move);
      });
    });
  });

  describe('all valid SIGNAL values', () => {
    const validSignals = [
      'CORRECTED', 'IDENTIFIED', 'SHARED',
      'EXPLAINED', 'MISSED',
      'FULL', 'PARTIAL', 'EXAMPLE_ONLY', 'INCORRECT',
      'YES', 'NO',
    ];

    validSignals.forEach(sig => {
      it(`should accept SIGNAL: ${sig}`, () => {
        const raw = `Text <!-- ZIPPY_MOVE:ASK_GENERALIZATION PHASE:4 SIGNAL:${sig} -->`;
        const result = parseSignal(raw);
        expect(result.signal).not.toBeNull();
        expect(result.signal.signal).toBe(sig);
      });
    });
  });

  describe('validation and edge cases', () => {
    it('should return null signal for invalid MOVE_ID', () => {
      const raw = 'Text <!-- ZIPPY_MOVE:INVALID_MOVE PHASE:1 -->';
      const result = parseSignal(raw);

      expect(result.visibleText).toBe('Text');
      expect(result.signal).toBeNull();
    });

    it('should return null signal for invalid SIGNAL value', () => {
      const raw = 'Text <!-- ZIPPY_MOVE:PRESENT_CONTEXT PHASE:1 SIGNAL:INVALID -->';
      const result = parseSignal(raw);

      expect(result.signal).toBeNull();
    });

    it('should return null signal for phase out of range (0)', () => {
      const raw = 'Text <!-- ZIPPY_MOVE:PRESENT_CONTEXT PHASE:0 -->';
      const result = parseSignal(raw);
      expect(result.signal).toBeNull();
    });

    it('should return null signal for phase out of range (6)', () => {
      const raw = 'Text <!-- ZIPPY_MOVE:PRESENT_CONTEXT PHASE:6 -->';
      const result = parseSignal(raw);
      expect(result.signal).toBeNull();
    });

    it('should reject MISCONCEPTION outside Phase 2', () => {
      const raw = 'Text <!-- ZIPPY_MOVE:PRESENT_CONTEXT PHASE:1 MISCONCEPTION:M1 -->';
      const result = parseSignal(raw);
      expect(result.signal).toBeNull();
    });

    it('should reject invalid misconception format', () => {
      const raw = 'Text <!-- ZIPPY_MOVE:INTRODUCE_MISCONCEPTION PHASE:2 MISCONCEPTION:XYZ -->';
      const result = parseSignal(raw);
      expect(result.signal).toBeNull();
    });

    it('should return visible text and null signal when no tag present', () => {
      const raw = 'Just a normal message without any signal tags.';
      const result = parseSignal(raw);

      expect(result.visibleText).toBe('Just a normal message without any signal tags.');
      expect(result.signal).toBeNull();
    });

    it('should handle empty string', () => {
      const result = parseSignal('');
      expect(result.visibleText).toBe('');
      expect(result.signal).toBeNull();
    });

    it('should handle null input', () => {
      const result = parseSignal(null);
      expect(result.visibleText).toBe('');
      expect(result.signal).toBeNull();
    });

    it('should handle undefined input', () => {
      const result = parseSignal(undefined);
      expect(result.visibleText).toBe('');
      expect(result.signal).toBeNull();
    });

    it('should strip the signal tag from visible text cleanly', () => {
      const raw = 'Hello there!\n\n<!-- ZIPPY_MOVE:PRESENT_CONTEXT PHASE:1 -->\n';
      const result = parseSignal(raw);
      expect(result.visibleText).toBe('Hello there!');
    });

    it('should handle multiline visible text with signal at end', () => {
      const raw = `I see! So you're saying we need to multiply both sides?

That's really interesting, can you show me how that works?
<!-- ZIPPY_MOVE:PROBE_REASONING PHASE:2 MISCONCEPTION:M1 -->`;
      const result = parseSignal(raw);

      expect(result.visibleText).toContain('multiply both sides');
      expect(result.visibleText).toContain('show me how that works');
      expect(result.signal).toEqual({
        move: 'PROBE_REASONING',
        phase: 2,
        misconception: 'M1',
      });
    });

    it('should handle extra whitespace in signal tag', () => {
      const raw = 'Text <!--   ZIPPY_MOVE:PRESENT_CONTEXT   PHASE:1   -->';
      const result = parseSignal(raw);
      expect(result.signal).toEqual({ move: 'PRESENT_CONTEXT', phase: 1 });
    });
  });

  describe('EXPRESS_CONFUSION works in any phase', () => {
    [1, 2, 3, 4, 5].forEach(phase => {
      it(`should accept EXPRESS_CONFUSION in phase ${phase}`, () => {
        const raw = `I'm confused! <!-- ZIPPY_MOVE:EXPRESS_CONFUSION PHASE:${phase} -->`;
        const result = parseSignal(raw);
        expect(result.signal).toEqual({ move: 'EXPRESS_CONFUSION', phase });
      });
    });
  });

  describe('FOLLOW_WRONG_PATH with SHARED signal', () => {
    it('should parse correctly', () => {
      const raw = 'Yeah that makes sense to me too!\n<!-- ZIPPY_MOVE:FOLLOW_WRONG_PATH PHASE:2 MISCONCEPTION:M3 SIGNAL:SHARED -->';
      const result = parseSignal(raw);

      expect(result.signal).toEqual({
        move: 'FOLLOW_WRONG_PATH',
        phase: 2,
        misconception: 'M3',
        signal: 'SHARED',
      });
    });
  });
});
