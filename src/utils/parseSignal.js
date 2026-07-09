/**
 * parseSignal.js — v5.0 Signal Tag Parser
 *
 * Parses the hidden HTML comment signal tags that Zippy appends to every message.
 * Format: <!-- ZIPPY_MOVE:<MOVE_ID> PHASE:<N> [MISCONCEPTION:<Mi>] [SIGNAL:<VALUE>] -->
 */

const VALID_MOVE_IDS = new Set([
  // Phase 1
  'PRESENT_CONTEXT', 'INVITE_EXPLANATION', 'REQUEST_STEP_BY_STEP',
  // Phase 2
  'INTRODUCE_MISCONCEPTION', 'PROBE_REASONING', 'FOLLOW_WRONG_PATH', 'ACKNOWLEDGE_CORRECTION',
  // Phase 3
  'ASK_PATTERN_RECOGNITION', 'PROBE_PATTERN_REASON',
  // Phase 4
  'ASK_GENERALIZATION', 'PROBE_BOUNDARY',
  // Phase 5
  'PRESENT_TRANSFER', 'PROBE_TRANSFER_WHY', 'CLOSING_SUMMARY',
  // Any phase
  'EXPRESS_CONFUSION',
]);

const VALID_SIGNALS = new Set([
  // Misconception probe
  'CORRECTED', 'IDENTIFIED', 'SHARED',
  // Pattern probe
  'EXPLAINED', 'MISSED',
  // Generalization
  'FULL', 'PARTIAL', 'EXAMPLE_ONLY', 'INCORRECT',
  // Inference
  'YES', 'NO',
]);

const SIGNAL_TAG_REGEX = /<!--\s*ZIPPY_MOVE:(\S+)\s+PHASE:(\d+)(?:\s+MISCONCEPTION:(\S+))?(?:\s+SIGNAL:(\S+))?\s*-->/;

/**
 * Parse a signal tag from a raw LLM response.
 *
 * @param {string} rawText - The full text of the LLM response (may contain visible text + signal comment)
 * @returns {{ visibleText: string, signal: { move: string, phase: number, misconception?: string, signal?: string } | null }}
 */
export function parseSignal(rawText) {
  if (typeof rawText !== 'string') {
    return { visibleText: '', signal: null };
  }

  const match = rawText.match(SIGNAL_TAG_REGEX);

  if (!match) {
    return { visibleText: rawText.trim(), signal: null };
  }

  const [fullMatch, moveId, phaseStr, misconception, signalValue] = match;

  // Strip the signal tag from the visible text
  const visibleText = rawText.replace(fullMatch, '').trim();

  // Validate MOVE_ID
  if (!VALID_MOVE_IDS.has(moveId)) {
    return { visibleText, signal: null };
  }

  const phase = parseInt(phaseStr, 10);

  // Validate phase range
  if (phase < 1 || phase > 5) {
    return { visibleText, signal: null };
  }

  // Build the signal object immutably
  const signal = { move: moveId, phase };

  // MISCONCEPTION must only appear in Phase 2
  if (misconception) {
    if (phase === 2 && /^M\d+$/.test(misconception)) {
      return {
        visibleText,
        signal: { ...signal, misconception, ...(signalValue && VALID_SIGNALS.has(signalValue) ? { signal: signalValue } : {}) },
      };
    }
    // Misconception outside Phase 2 or invalid format — malformed
    return { visibleText, signal: null };
  }

  // Validate SIGNAL value if present
  if (signalValue) {
    if (!VALID_SIGNALS.has(signalValue)) {
      return { visibleText, signal: null };
    }
    return { visibleText, signal: { ...signal, signal: signalValue } };
  }

  return { visibleText, signal };
}

export default parseSignal;
