/**
 * conversationEvents.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The evidence extraction layer between a Zippy conversation and the Evaluator.
 *
 * Responsibilities:
 *   1. Define the canonical event schema for every turn in a student–Zippy session.
 *   2. Define the full taxonomy of ZIPPY MOVES and EXPECTED COGNITIVE MOVES.
 *   3. Parse Zippy's silent signals (HTML comments) into structured ZippyMove events.
 *   4. Run rule-based pre-screening on student turns (fast, deterministic).
 *   5. Build the LLM extraction prompt that maps each student turn to a CognitiveEvent.
 *   6. Merge rule output + LLM output into a final ConversationEventLog.
 *
 * Data flow:
 *   raw transcript
 *     → parseTranscript()          → TurnRecord[]
 *     → extractZippyMoves()        → ZippyMoveEvent[] (from HTML comments)
 *     → ruleBasedScreening()       → RuleSignal[]     (fast regex / keyword rules)
 *     → buildLLMExtractionPrompt() → string           (sent to Claude API)
 *     → mergeLLMAndRuleSignals()   → ConversationEventLog
 *
 * The ConversationEventLog is the sole input to generateEvaluatorPrompt().
 * ─────────────────────────────────────────────────────────────────────────────
 */


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — TAXONOMY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ZIPPY_MOVES
 * All actions Zippy can take in a conversation, keyed by move ID.
 * Each move has a phase, a cognitive demand it is designed to elicit,
 * and the expected student response category.
 *
 * These are the labels Zippy embeds in its silent HTML comments.
 */
export const ZIPPY_MOVES = {
  // Phase 1 ─ Opening
  PRESENT_CONTEXT:        { phase: 1, label: 'Present Context',            elicits: 'ARTICULATE_CONCEPT' },
  INVITE_EXPLANATION:     { phase: 1, label: 'Invite Explanation',          elicits: 'ARTICULATE_CONCEPT' },
  REQUEST_STEP_BY_STEP:   { phase: 1, label: 'Request Step-by-Step',        elicits: 'SEQUENCE_REASONING' },

  // Phase 2 ─ Misconception Probing
  INTRODUCE_MISCONCEPTION: { phase: 2, label: 'Introduce Misconception',    elicits: 'DETECT_ERROR' },
  PROBE_REASONING:         { phase: 2, label: 'Probe Reasoning',            elicits: 'EXPLAIN_REASONING' },
  FOLLOW_WRONG_PATH:       { phase: 2, label: 'Follow Wrong Path',          elicits: 'DETECT_ERROR' },
  ACKNOWLEDGE_CORRECTION:  { phase: 2, label: 'Acknowledge Correction',     elicits: null },   // Zippy reaction, no demand

  // Phase 3 ─ Pattern Recognition
  ASK_PATTERN_RECOGNITION: { phase: 3, label: 'Ask Pattern Recognition',   elicits: 'IDENTIFY_PATTERN' },
  PROBE_PATTERN_REASON:    { phase: 3, label: 'Probe Pattern Reason',       elicits: 'EXPLAIN_PATTERN' },

  // Phase 4 ─ Generalization
  ASK_GENERALIZATION:      { phase: 4, label: 'Ask Generalization',         elicits: 'FORM_RULE' },
  PROBE_BOUNDARY:          { phase: 4, label: 'Probe Boundary Condition',   elicits: 'TEST_RULE' },

  // Phase 5 ─ Inference & Transfer
  PRESENT_TRANSFER:        { phase: 5, label: 'Present Transfer Scenario',  elicits: 'APPLY_RULE' },
  PROBE_TRANSFER_WHY:      { phase: 5, label: 'Probe Transfer Reasoning',   elicits: 'EXPLAIN_TRANSFER' },

  // Any phase ─ Meta moves
  EXPRESS_CONFUSION:       { phase: null, label: 'Express Confusion',       elicits: 'CLARIFY_CONCEPT' },
  CLOSING_SUMMARY:         { phase: 5,    label: 'Closing Summary',         elicits: null },
};

/**
 * COGNITIVE_MOVES
 * All cognitive operations a student can perform in a turn.
 * These are the labels the extraction engine assigns to student turns.
 *
 * Each entry defines:
 *   description — what the student is doing
 *   phase       — which phase(s) it primarily belongs to (null = any)
 *   quality     — possible quality levels for this move
 */
export const COGNITIVE_MOVES = {
  // Concept / explanation
  ARTICULATE_CONCEPT:  {
    description: 'Student states what the concept is, in their own words',
    phase: [1, 2],
    quality: ['PRECISE', 'PARTIAL', 'VAGUE', 'INCORRECT'],
  },
  SEQUENCE_REASONING:  {
    description: 'Student walks through a step-by-step process',
    phase: [1, 2],
    quality: ['COMPLETE', 'PARTIAL', 'MISSING_STEPS', 'INCORRECT'],
  },
  EXPLAIN_REASONING:   {
    description: 'Student explains WHY something is true or false',
    phase: [2, 3],
    quality: ['JUSTIFIED', 'ASSERTED_WITHOUT_REASON', 'CIRCULAR', 'INCORRECT'],
  },
  CLARIFY_CONCEPT:     {
    description: 'Student rephrases or elaborates when Zippy expresses confusion',
    phase: [1, 2, 3],
    quality: ['IMPROVES_CLARITY', 'SAME_LEVEL', 'REDUCES_CLARITY'],
  },

  // Error detection
  DETECT_ERROR:        {
    description: 'Student recognises that Zippy\'s reasoning is wrong',
    phase: [2],
    quality: ['IMMEDIATE', 'AFTER_PROMPT', 'MISSED'],
  },
  CORRECT_ERROR:       {
    description: 'Student provides the correct reasoning to replace Zippy\'s error',
    phase: [2],
    quality: ['WITH_JUSTIFICATION', 'WITHOUT_JUSTIFICATION', 'PARTIALLY_CORRECT'],
  },
  ACCEPT_ERROR:        {
    description: 'Student agrees with or does not challenge Zippy\'s wrong reasoning',
    phase: [2],
    quality: ['ACTIVE_AGREEMENT', 'PASSIVE_NON_CORRECTION'],
  },

  // Pattern recognition
  IDENTIFY_PATTERN:    {
    description: 'Student spots a structural regularity across examples',
    phase: [3],
    quality: ['STRUCTURAL', 'SURFACE_FEATURE', 'INCORRECT'],
  },
  EXPLAIN_PATTERN:     {
    description: 'Student explains the generative mechanism behind a pattern',
    phase: [3],
    quality: ['MECHANISTIC', 'DESCRIPTIVE_ONLY', 'INCORRECT'],
  },

  // Generalization
  FORM_RULE:           {
    description: 'Student proposes a general rule that goes beyond specific examples',
    phase: [4],
    quality: ['CORRECT_WITH_BOUNDARIES', 'CORRECT_NO_BOUNDARIES', 'OVER_GENERALIZED', 'INCORRECT'],
  },
  TEST_RULE:           {
    description: 'Student checks whether a proposed rule holds at edge cases',
    phase: [4],
    quality: ['SPONTANEOUS', 'PROMPTED', 'NOT_ATTEMPTED'],
  },

  // Inference & transfer
  APPLY_RULE:          {
    description: 'Student applies a known rule to a new, unfamiliar context',
    phase: [5],
    quality: ['CORRECT', 'PARTIAL', 'INCORRECT'],
  },
  EXPLAIN_TRANSFER:    {
    description: 'Student explains why the rule works in the new context',
    phase: [5],
    quality: ['FULL', 'SURFACE', 'ABSENT'],
  },

  // Meta
  SELF_CORRECT:        {
    description: 'Student revises their own previous statement unprompted',
    phase: null,
    quality: ['SPONTANEOUS', 'AFTER_ZIPPY_SIGNAL'],
  },
  DISENGAGE:           {
    description: 'Student gives a minimal, off-task, or avoidant response',
    phase: null,
    quality: ['BRIEF', 'OFF_TOPIC', 'NO_RESPONSE'],
  },
};


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — EVENT SCHEMA (TypeScript-style JSDoc)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} TurnRecord
 * @property {number}  turnIndex   - 0-based position in conversation
 * @property {'zippy'|'student'} speaker
 * @property {string}  text        - Visible message text (HTML comments stripped)
 * @property {string}  rawText     - Full text including HTML comments
 * @property {number}  phase       - Current phase (1–5) at time of this turn
 */

/**
 * @typedef {Object} ZippyMoveEvent
 * @property {number}   turnIndex
 * @property {string}   moveId        - Key from ZIPPY_MOVES
 * @property {string}   moveLabel     - Human-readable label
 * @property {number}   phase
 * @property {string|null} misconceptionId  - e.g. "M1", "M2" (Phase 2 only)
 * @property {string|null} signalValue - e.g. "CORRECTED", "SHARED", "EXPLAINED"
 * @property {string|null} elicits     - Expected cognitive move ID
 */

/**
 * @typedef {Object} RuleSignal
 * @property {number}   turnIndex
 * @property {string}   ruleId
 * @property {string}   ruleLabel
 * @property {boolean}  triggered
 * @property {string}   evidence    - The matched text fragment
 * @property {number}   confidence  - 0.0–1.0 (rules are deterministic: 1.0 or 0.0)
 */

/**
 * @typedef {Object} CognitiveEvent
 * @property {number}   turnIndex
 * @property {string}   cognitiveMove   - Key from COGNITIVE_MOVES
 * @property {string}   quality         - Quality level from COGNITIVE_MOVES[move].quality
 * @property {string}   evidence        - Verbatim quote or close paraphrase from student turn
 * @property {string}   interpretation  - 1-sentence evaluator inference
 * @property {number}   confidence      - 0.0–1.0 (LLM self-rated)
 * @property {'rule'|'llm'|'merged'} source
 */

/**
 * @typedef {Object} ConversationEventLog
 * @property {string}   sessionId
 * @property {string}   taskId
 * @property {string}   taskTitle
 * @property {TurnRecord[]}      turns
 * @property {ZippyMoveEvent[]}  zippyMoves
 * @property {CognitiveEvent[]}  cognitiveEvents
 * @property {Object}            phaseSummary     - Keyed by phase number (1–5)
 * @property {Object}            misconceptionLog - Keyed by misconception ID (M1, M2…)
 * @property {string}            patternSignal    - From Zippy's Phase 3 comment
 * @property {string}            generalizationSignal  - From Zippy's Phase 4 comment
 * @property {string}            inferenceSignal  - From Zippy's Phase 5 comment
 * @property {StudentTurnSummary[]} studentTurns  - Raw student turns for evidence display
 * @property {'thin'|'adequate'|'rich'} sessionQuality - Data richness for UI empty-state handling
 */

/**
 * @typedef {Object} StudentTurnSummary
 * @property {number}  turnIndex
 * @property {number}  phase
 * @property {string}  text       - Verbatim visible student text (HTML comments stripped)
 * @property {boolean} highlight  - true if a cognitive event on this turn has quality indicating
 *                                  a misconception moment (PASSIVE_NON_CORRECTION, INCORRECT, MISSED)
 */


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — TRANSCRIPT PARSER
// ═══════════════════════════════════════════════════════════════════════════════

const HTML_COMMENT_RE = /<!--([\s\S]*?)-->/g;
const PHASE_COMMENT_RE = /PHASE:(\d)/;
const MISCONCEPTION_COMMENT_RE = /M(\d+)\s+(CORRECTED|IDENTIFIED|SHARED)/;
const PATTERN_COMMENT_RE = /PATTERN:\s*(EXPLAINED|IDENTIFIED|MISSED)/;
const GENERALIZATION_COMMENT_RE = /GENERALIZATION:\s*(FULL|PARTIAL|EXAMPLE_ONLY|INCORRECT|OVER_GENERALISED)/;
const INFERENCE_COMMENT_RE = /INFERENCE:\s*(YES|PARTIAL|NO)/;

// Maps Zippy's short signal tokens → evaluator prompt's canonical label vocabulary
const GENERALIZATION_SIGNAL_MAP = {
  FULL:            'CORRECT_WITH_BOUNDARIES',
  PARTIAL:         'CORRECT_NO_BOUNDARIES',
  EXAMPLE_ONLY:    'EXAMPLE_SPECIFIC',
  INCORRECT:       'INCORRECT_RULE',
  OVER_GENERALISED:'OVER_GENERALISED',
};
const INFERENCE_SIGNAL_MAP = {
  YES:     'FULL_TRANSFER',
  PARTIAL: 'PARTIAL_TRANSFER',
  NO:      'NO_TRANSFER',
};
const ZIPPY_MOVE_COMMENT_RE = /ZIPPY_MOVE:\s*(\w+)/;

/**
 * Extract all HTML comment signals from a raw text string.
 * Returns an array of signal strings.
 */
function extractComments(rawText) {
  const signals = [];
  let m;
  const re = new RegExp(HTML_COMMENT_RE.source, 'g');
  while ((m = re.exec(rawText)) !== null) {
    signals.push(m[1].trim());
  }
  return signals;
}

/**
 * Parse raw transcript array into TurnRecord[].
 *
 * Expects rawTranscript as:
 *   [ { speaker: 'zippy'|'student', text: string }, … ]
 *
 * Speaker detection falls back to heuristics if not provided.
 */
export function parseTranscript(rawTranscript) {
  let currentPhase = 1;
  return rawTranscript.map((turn, i) => {
    const signals = extractComments(turn.text);

    // Advance phase tracker
    for (const sig of signals) {
      const pm = sig.match(PHASE_COMMENT_RE);
      if (pm) currentPhase = parseInt(pm[1], 10);
    }

    const cleanText = turn.text.replace(HTML_COMMENT_RE, '').trim();

    return {
      turnIndex: i,
      speaker: turn.speaker || (i % 2 === 0 ? 'zippy' : 'student'),
      text: cleanText,
      rawText: turn.text,
      phase: currentPhase,
    };
  });
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — ZIPPY MOVE EXTRACTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse all Zippy turns and extract ZippyMoveEvent[] from HTML comments.
 * Falls back to phase-based move inference when explicit ZIPPY_MOVE comments are absent.
 */
export function extractZippyMoves(turns) {
  const events = [];

  for (const turn of turns) {
    if (turn.speaker !== 'zippy') continue;
    const signals = extractComments(turn.rawText);

    let moveId = null;
    let misconceptionId = null;
    let signalValue = null;

    for (const sig of signals) {
      // Explicit move tag
      const zm = sig.match(ZIPPY_MOVE_COMMENT_RE);
      if (zm && ZIPPY_MOVES[zm[1]]) { moveId = zm[1]; continue; }

      // Misconception signal
      const mm = sig.match(MISCONCEPTION_COMMENT_RE);
      if (mm) {
        misconceptionId = `M${mm[1]}`;
        signalValue = mm[2]; // CORRECTED | IDENTIFIED | SHARED
        if (!moveId) moveId = signalValue === null ? 'INTRODUCE_MISCONCEPTION' : 'PROBE_REASONING';
        continue;
      }

      // Pattern signal
      if (PATTERN_COMMENT_RE.test(sig)) {
        const pm = sig.match(PATTERN_COMMENT_RE);
        signalValue = pm[1];
        if (!moveId) moveId = 'ASK_PATTERN_RECOGNITION';
        continue;
      }

      // Generalization signal
      if (GENERALIZATION_COMMENT_RE.test(sig)) {
        const gm = sig.match(GENERALIZATION_COMMENT_RE);
        signalValue = gm[1];
        if (!moveId) moveId = 'ASK_GENERALIZATION';
        continue;
      }

      // Inference signal
      if (INFERENCE_COMMENT_RE.test(sig)) {
        const im = sig.match(INFERENCE_COMMENT_RE);
        signalValue = im[1];
        if (!moveId) moveId = 'PRESENT_TRANSFER';
        continue;
      }
    }

    // Phase-based fallback inference when no comment is present
    if (!moveId) {
      moveId = {
        1: turn.turnIndex === 0 ? 'PRESENT_CONTEXT' : 'INVITE_EXPLANATION',
        2: 'INTRODUCE_MISCONCEPTION',
        3: 'ASK_PATTERN_RECOGNITION',
        4: 'ASK_GENERALIZATION',
        5: 'PRESENT_TRANSFER',
      }[turn.phase] || 'EXPRESS_CONFUSION';
    }

    const moveSpec = ZIPPY_MOVES[moveId] || { label: moveId, elicits: null };

    events.push({
      turnIndex: turn.turnIndex,
      moveId,
      moveLabel: moveSpec.label,
      phase: turn.phase,
      misconceptionId: misconceptionId || null,
      signalValue: signalValue || null,
      elicits: moveSpec.elicits || null,
    });
  }

  return events;
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — RULE-BASED SCREENER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deterministic rules that fire on student turn text.
 * Each rule produces a RuleSignal with confidence=1.0 when triggered.
 *
 * Rules are intentionally conservative: they only fire when a pattern is
 * unambiguous. The LLM handles everything nuanced.
 */
const RULES = [
  {
    id: 'RULE_DIRECT_CORRECTION',
    label: 'Direct Error Correction',
    pattern: /\b(no[,\s]|that'?s\s+wrong|not right|actually[,\s]|wait[,\s]|that'?s\s+not|incorrect)\b/i,
    cognitiveMove: 'DETECT_ERROR',
    quality: 'IMMEDIATE',
    note: 'Student used explicit disagreement language',
  },
  {
    id: 'RULE_SELF_CORRECT',
    label: 'Self-Correction',
    pattern: /\b(wait[,\s]|actually[,\s]|i\s+mean[,\s]|i\s+was\s+wrong|let\s+me\s+re(think|do)|i\s+made\s+a\s+mistake)\b/i,
    cognitiveMove: 'SELF_CORRECT',
    quality: 'SPONTANEOUS',
    note: 'Student revised their own previous statement',
  },
  {
    id: 'RULE_BECAUSE_JUSTIFICATION',
    label: 'Causal Justification',
    pattern: /\b(because|since|so\s+that|that'?s\s+why|the\s+reason|due\s+to)\b/i,
    cognitiveMove: 'EXPLAIN_REASONING',
    quality: 'JUSTIFIED',
    note: 'Student provided a causal explanation',
  },
  {
    id: 'RULE_ALWAYS_NEVER_SOMETIMES',
    label: 'Boundary Condition Language',
    pattern: /\b(always|never|sometimes|not\s+always|only\s+when|except\s+(when|if)|in\s+some\s+cases)\b/i,
    cognitiveMove: 'FORM_RULE',
    quality: 'CORRECT_WITH_BOUNDARIES',
    note: 'Student used quantified boundary language',
  },
  {
    id: 'RULE_VAGUE_AGREEMENT',
    label: 'Vague Agreement with Zippy',
    pattern: /^\s*(yeah|yep|yes|ok|okay|sure|right|mhm|uh[\s-]huh|i\s+guess|i\s+think\s+so)[\s.!]*$/i,
    cognitiveMove: 'ACCEPT_ERROR',
    quality: 'PASSIVE_NON_CORRECTION',
    note: 'Student gave minimal agreement without correction',
  },
  {
    id: 'RULE_DEFINITION_ATTEMPT',
    label: 'Definition Attempt',
    pattern: /\b(means?|is\s+when|is\s+defined\s+as|stands?\s+for|refers?\s+to|is\s+basically)\b/i,
    cognitiveMove: 'ARTICULATE_CONCEPT',
    quality: 'PARTIAL',  // LLM upgrades to PRECISE if warranted
    note: 'Student attempted to define a concept',
  },
  {
    id: 'RULE_EXAMPLE_ONLY',
    label: 'Example-Only Response',
    // Fires when the student gives ONLY numbers/expressions without explanation prose
    pattern: /^[\s\d\^×*+\-=()$.,]+$/,
    cognitiveMove: 'ARTICULATE_CONCEPT',
    quality: 'VAGUE',
    note: 'Student response was numeric/symbolic only, no prose explanation',
  },
  {
    id: 'RULE_DISENGAGE',
    label: 'Disengagement Signal',
    pattern: /^[\s.!?]*$|^\s*(idk|i\s+don'?t\s+know|no\s+idea|not\s+sure|can\s+we\s+skip|pass)\s*[.!?]*\s*$/i,
    cognitiveMove: 'DISENGAGE',
    quality: 'BRIEF',
    note: 'Student gave a minimal or off-task response',
  },
];

/**
 * Run all rules against a single student turn.
 * Returns RuleSignal[] for rules that fired.
 */
export function ruleBasedScreening(turns) {
  const signals = [];

  for (const turn of turns) {
    if (turn.speaker !== 'student') continue;

    for (const rule of RULES) {
      const match = turn.text.match(rule.pattern);
      if (match) {
        signals.push({
          turnIndex: turn.turnIndex,
          ruleId: rule.id,
          ruleLabel: rule.label,
          triggered: true,
          evidence: match[0].trim(),
          cognitiveMove: rule.cognitiveMove,
          quality: rule.quality,
          note: rule.note,
          confidence: 1.0,
          source: 'rule',
        });
      }
    }
  }

  return signals;
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — LLM EXTRACTION PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build the prompt sent to Claude to extract CognitiveEvents from the transcript.
 *
 * The prompt supplies:
 *   - The full COGNITIVE_MOVES taxonomy (so the LLM uses canonical labels)
 *   - The full turn log with Zippy move labels and expected cognitive moves
 *   - Rule signals already fired (so the LLM can corroborate or override)
 *   - Task metadata (misconceptions, target concepts) for grounding
 *   - Strict JSON output schema
 *
 * @param {TurnRecord[]}     turns
 * @param {ZippyMoveEvent[]} zippyMoves
 * @param {RuleSignal[]}     ruleSignals
 * @param {Object}           taskMeta    - { taskTitle, ccssCode, misconceptions[], targetConcepts[] }
 * @returns {string} The full extraction prompt
 */
export function buildLLMExtractionPrompt(turns, zippyMoves, ruleSignals, taskMeta) {
  // Build a compressed turn table for the LLM
  const zippyMoveByTurn = Object.fromEntries(zippyMoves.map(zm => [zm.turnIndex, zm]));
  const rulesByTurn = ruleSignals.reduce((acc, r) => {
    (acc[r.turnIndex] = acc[r.turnIndex] || []).push(r);
    return acc;
  }, {});

  const turnTable = turns.map(t => {
    const zm = zippyMoveByTurn[t.turnIndex];
    const rules = rulesByTurn[t.turnIndex] || [];
    return {
      turn: t.turnIndex,
      phase: t.phase,
      speaker: t.speaker,
      text: t.text,
      ...(zm ? { zippyMove: zm.moveId, elicits: zm.elicits, misconceptionId: zm.misconceptionId, signal: zm.signalValue } : {}),
      ...(rules.length ? { ruleSignals: rules.map(r => ({ ruleId: r.ruleId, cognitiveMove: r.cognitiveMove, quality: r.quality, evidence: r.evidence })) } : {}),
    };
  });

  const cognitiveMovesCatalog = Object.entries(COGNITIVE_MOVES).map(([id, spec]) =>
    `  ${id}: "${spec.description}" | quality options: [${spec.quality.join(', ')}]`
  ).join('\n');

  const misconceptionsCatalog = (taskMeta.misconceptions || []).map((m, i) =>
    `  M${i + 1}: ${m.title || `Misconception ${i+1}`} (type: ${m.type || 'unknown'}) — ${m.description}`
  ).join('\n');

  return `You are an evidence extraction engine for a student–AI tutoring assessment system.

Your job: read every STUDENT turn in the conversation log below and assign it one or more
CognitiveEvent records using the exact labels from the COGNITIVE MOVES CATALOG.

## TASK CONTEXT
Task: ${taskMeta.taskTitle || 'Unknown'} (${taskMeta.ccssCode || ''})
Target concepts: ${(taskMeta.targetConcepts || []).join(', ')}

Known misconceptions in this task:
${misconceptionsCatalog || '  (none)'}

## COGNITIVE MOVES CATALOG
${cognitiveMovesCatalog}

## CONVERSATION LOG (JSON)
${JSON.stringify(turnTable, null, 2)}

## EXTRACTION RULES

1. For EVERY student turn, produce AT LEAST ONE CognitiveEvent.
2. If a rule signal already fired on a turn (see ruleSignals), you may:
   - CONFIRM it (keep cognitiveMove and quality as-is, set source: "merged"),
   - UPGRADE quality if the full context warrants a higher rating,
   - OVERRIDE it if the full context clearly contradicts the rule (set source: "llm", explain in interpretation).
3. You may produce MULTIPLE CognitiveEvents for one turn if multiple moves co-occur
   (e.g., student detects error AND explains reasoning in the same turn).
4. evidence must be a verbatim quote or close paraphrase from the student's text — never invented.
5. interpretation is a single sentence stating what the evidence means cognitively.
6. confidence is your self-rated certainty (0.0–1.0). Flag anything below 0.7.
7. Pay special attention to:
   - Turns where Zippy's elicits field is DETECT_ERROR: did the student actually detect it?
   - Turns where Zippy's signal is SHARED: what exactly did the student say that indicated agreement?
   - Phase 3/4/5 turns: be precise about quality (STRUCTURAL vs SURFACE_FEATURE, etc.)

## OUTPUT

Respond with a valid JSON object only. No markdown fences, no preamble.

{
  "cognitiveEvents": [
    {
      "turnIndex": <number>,
      "cognitiveMove": "<COGNITIVE_MOVE_ID>",
      "quality": "<quality level>",
      "evidence": "<verbatim or close paraphrase>",
      "interpretation": "<1-sentence meaning>",
      "confidence": <0.0–1.0>,
      "source": "rule" | "llm" | "merged"
    }
  ],
  "extractionNotes": "<Optional: flag any turns where evidence was ambiguous or confidence is low>"
}`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — MERGE + EVENT LOG ASSEMBLY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Merge LLM-extracted CognitiveEvents with rule signals, de-duplicate, and
 * assemble the final ConversationEventLog.
 *
 * LLM output takes precedence over raw rule signals when both exist for the
 * same turn and cognitive move (the LLM has already been instructed to corroborate
 * or override rules).
 *
 * @param {TurnRecord[]}     turns
 * @param {ZippyMoveEvent[]} zippyMoves
 * @param {CognitiveEvent[]} llmCognitiveEvents   - parsed from LLM response
 * @param {RuleSignal[]}     ruleSignals
 * @param {Object}           sessionMeta  - { sessionId, taskId, taskTitle }
 * @param {Object}           taskMeta     - { misconceptions[] }
 * @returns {ConversationEventLog}
 */
export function assembleEventLog(turns, zippyMoves, llmCognitiveEvents, ruleSignals, sessionMeta, taskMeta) {
  // Build cognitive events: start from LLM output, backfill uncovered student turns from rules
  const coveredTurns = new Set(llmCognitiveEvents.map(e => e.turnIndex));
  const ruleOnlyEvents = ruleSignals
    .filter(r => !coveredTurns.has(r.turnIndex))
    .map(r => ({
      turnIndex: r.turnIndex,
      cognitiveMove: r.cognitiveMove,
      quality: r.quality,
      evidence: r.evidence,
      interpretation: r.note,
      confidence: r.confidence,
      source: 'rule',
    }));

  const allCognitiveEvents = [...llmCognitiveEvents, ...ruleOnlyEvents]
    .sort((a, b) => a.turnIndex - b.turnIndex);

  // Aggregate Zippy silent signals
  const misconceptionLog = {};
  let patternSignal = null;
  let generalizationSignal = null;
  let inferenceSignal = null;

  for (const zm of zippyMoves) {
    if (zm.misconceptionId && zm.signalValue) {
      misconceptionLog[zm.misconceptionId] = zm.signalValue; // last write wins
    }
    if (zm.moveId === 'ASK_PATTERN_RECOGNITION' && zm.signalValue) patternSignal = zm.signalValue;
    if (zm.moveId === 'ASK_GENERALIZATION' && zm.signalValue)
      generalizationSignal = GENERALIZATION_SIGNAL_MAP[zm.signalValue] || zm.signalValue;
    if (zm.moveId === 'PRESENT_TRANSFER' && zm.signalValue)
      inferenceSignal = INFERENCE_SIGNAL_MAP[zm.signalValue] || zm.signalValue;
  }

  // Phase summaries: group cognitive events by phase
  const phaseSummary = {};
  for (const event of allCognitiveEvents) {
    const turn = turns.find(t => t.turnIndex === event.turnIndex);
    const phase = turn?.phase ?? 'unknown';
    if (!phaseSummary[phase]) phaseSummary[phase] = [];
    phaseSummary[phase].push(event);
  }

  // Build StudentTurnSummary[] — verbatim student turns forwarded to the evaluator
  // for evidence verification without requiring it to trust extraction paraphrases.
  const highlightQualities = new Set([
    'PASSIVE_NON_CORRECTION', 'INCORRECT', 'MISSED', 'ACTIVE_AGREEMENT',
    'VAGUE', 'BRIEF', 'OFF_TOPIC',
  ]);
  const highlightedTurns = new Set(
    allCognitiveEvents
      .filter(e => highlightQualities.has(e.quality))
      .map(e => e.turnIndex)
  );
  const studentTurns = turns
    .filter(t => t.speaker === 'student')
    .map(t => ({
      turnIndex: t.turnIndex,
      phase: t.phase,
      text: t.text,
      highlight: highlightedTurns.has(t.turnIndex),
    }));

  // Compute session quality for UI empty-state handling
  const highConfidenceCount = allCognitiveEvents.filter(e => e.confidence >= 0.7).length;
  const sessionQuality =
    allCognitiveEvents.length === 0 ? 'thin' :
    highConfidenceCount < 3        ? 'thin' :
    highConfidenceCount < 6        ? 'adequate' : 'rich';

  return {
    sessionId: sessionMeta.sessionId,
    taskId: sessionMeta.taskId,
    taskTitle: sessionMeta.taskTitle || taskMeta?.taskTitle || '',
    turns,
    zippyMoves,
    cognitiveEvents: allCognitiveEvents,
    phaseSummary,
    misconceptionLog,
    patternSignal,
    generalizationSignal,
    inferenceSignal,
    studentTurns,
    sessionQuality,
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — MAIN EXTRACTION ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Full pipeline: raw transcript → ConversationEventLog.
 *
 * Steps:
 *   1. parseTranscript
 *   2. extractZippyMoves
 *   3. ruleBasedScreening
 *   4. buildLLMExtractionPrompt → caller sends to Claude API → parse response
 *   5. assembleEventLog
 *
 * Because step 4 requires an async API call, this function returns the prompt
 * string and a resolver function. The caller is responsible for the API call.
 *
 * Usage:
 *   const { turns, zippyMoves, ruleSignals, llmPrompt, resolve } =
 *     prepareExtraction(rawTranscript, taskMeta, sessionMeta);
 *
 *   const llmResponse = await callClaudeAPI(llmPrompt);   // caller's responsibility
 *   const eventLog = resolve(llmResponse);
 *
 * @param {Array}  rawTranscript  - [{ speaker, text }, …]
 * @param {Object} taskMeta       - from parseMarkdown()
 * @param {Object} sessionMeta    - { sessionId, taskId, taskTitle }
 * @returns {{ turns, zippyMoves, ruleSignals, llmPrompt, resolve }}
 */
export function prepareExtraction(rawTranscript, taskMeta, sessionMeta) {
  const turns      = parseTranscript(rawTranscript);
  const zippyMoves = extractZippyMoves(turns);
  const ruleSignals = ruleBasedScreening(turns);
  const llmPrompt  = buildLLMExtractionPrompt(turns, zippyMoves, ruleSignals, taskMeta);

  function resolve(llmRawResponse) {
    let llmCognitiveEvents = [];
    try {
      const parsed = JSON.parse(
        llmRawResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      );
      llmCognitiveEvents = parsed.cognitiveEvents || [];
    } catch (err) {
      console.error('[conversationEvents] Failed to parse LLM extraction response:', err);
      // Degrade gracefully: use rule signals only
    }

    return assembleEventLog(turns, zippyMoves, llmCognitiveEvents, ruleSignals, sessionMeta, taskMeta);
  }

  return { turns, zippyMoves, ruleSignals, llmPrompt, resolve };
}

export default {
  ZIPPY_MOVES,
  COGNITIVE_MOVES,
  parseTranscript,
  extractZippyMoves,
  ruleBasedScreening,
  buildLLMExtractionPrompt,
  assembleEventLog,
  prepareExtraction,
};
