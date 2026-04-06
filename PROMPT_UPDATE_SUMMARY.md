# ITeachU Prompt Update Summary

---

## Date: April 6, 2026

## Overview
Major refactor of the assessment pipeline and UI reporting layer. This update introduces a fully structured evidence-extraction pipeline between the Zippy conversation and the evaluator LLM, replaces the legacy 4-category competency rubric with a phase-aligned Cognitive Breakdown Report, and ships two new role-specific report components (TeacherReport, StudentReport) that consume the new evaluation schema.

---

## System Descriptions (Current State)

### `src/utils/zippyPrompt.js` — Zippy System Prompt Generator v5.0

Generates Zippy's full system prompt from a parsed task object (`parseMarkdown` output).

**Character:** Zippy is a curious, humble middle-school AI learner. The student is the teacher. Zippy never evaluates, corrects, or instructs — it only asks questions, makes honest mistakes, and reflects on what it is taught.

**5-Phase Conversation Protocol:**
1. **Phase 1 — Opening:** Zippy introduces itself, frames its confusion using the task's `studentPrompt`, and invites the student to explain.
2. **Phase 2 — Misconception Probing:** Zippy voices each misconception (M1, M2…) as its own confused reasoning, one at a time. A 2-turn micro-loop handles correction (ACKNOWLEDGE_CORRECTION), vague pushback (PROBE_REASONING), or acceptance (FOLLOW_WRONG_PATH).
3. **Phase 3 — Pattern Recognition:** Zippy surfaces the task's pattern prompt as a puzzle it just noticed.
4. **Phase 4 — Generalization:** Zippy poses the generalization question as genuine curiosity.
5. **Phase 5 — Inference & Transfer:** Zippy presents a new-context challenge, then closes with a warm summary of only what the student explicitly taught it.

**Silent Signalling Protocol:** Every Zippy message ends with exactly one HTML comment:
```
<!-- ZIPPY_MOVE:<MOVE_ID> PHASE:<N> [MISCONCEPTION:<Mi>] [SIGNAL:<VALUE>] -->
```
These comments are invisible to the student and consumed by `conversationEvents.js`.

**"I Don't Know" Escalation:** Three-strike protocol — phase-specific low-pressure probe → anchor to what they know → graceful close. Never reveals the answer at any strike level.

---

### `src/utils/conversationEvents.js` — Evidence Extraction Pipeline

Sits between the raw Zippy conversation transcript and the evaluator LLM. Transforms a raw message array into a structured `ConversationEventLog`.

**Pipeline stages:**
1. `parseTranscript()` — strips HTML comments, tracks current phase, produces `TurnRecord[]`.
2. `extractZippyMoves()` — parses Zippy's silent HTML comments into `ZippyMoveEvent[]` with `moveId`, `phase`, `misconceptionId`, and `signalValue`.
3. `ruleBasedScreening()` — deterministic regex rules fire on student turns (e.g. `RULE_DIRECT_CORRECTION`, `RULE_DISENGAGE`, `RULE_BECAUSE_JUSTIFICATION`) and produce `RuleSignal[]` with `confidence: 1.0`.
4. `buildLLMExtractionPrompt()` — assembles a prompt for a second Claude call that maps every student turn to one or more `CognitiveEvent` records using the canonical `COGNITIVE_MOVES` taxonomy. The LLM can confirm, upgrade, or override rule signals.
5. `assembleEventLog()` — merges LLM output with rule signals, aggregates Zippy's phase signals into `misconceptionLog`, `patternSignal`, `generalizationSignal`, `inferenceSignal`, computes `sessionQuality` (`thin` / `adequate` / `rich`), and builds a `studentTurns` array of verbatim student text for evidence verification.

**Output — `ConversationEventLog`:** `{ sessionId, taskId, taskTitle, turns, zippyMoves, cognitiveEvents, phaseSummary, misconceptionLog, patternSignal, generalizationSignal, inferenceSignal, studentTurns, sessionQuality }`. This is the sole input to `generateEvaluatorPrompt()`.

---

### `src/utils/evaluatorPrompt.js` — Evaluator System Prompt Generator v3.0

Generates the system prompt for a dedicated evaluator LLM call. Input is a `ConversationEventLog`; output is a **Cognitive Breakdown Report** JSON.

**Replaces:** the legacy 4-category competency rubric (conceptArticulation, logicCoherence, misconceptionCorrection, cognitiveResilience) and numeric totalScore.

**Framework:** Every section follows Evidence → Interpretation → Diagnosis → Action (E→I→D→A).

**Four diagnostic sections:**
1. **Misconception Analysis** — one entry per Mᵢ with `signal` (CORRECTED/IDENTIFIED/SHARED), verbatim `evidence`, `interpretation.classification` (FULL_CORRECTION / SURFACE_CORRECTION / PASSIVE_NON_CORRECTION), `diagnosis.rootCause`, and `action`.
2. **Pattern Recognition Analysis** — `interpretation.label` (STRUCTURAL / PROCEDURAL / SURFACE_FEATURE / MISSED / OVER_GENERALISED), `interpretation.justification`, and a required `finding` sentence ("Student [label] → indicates [interpretation].").
3. **Generalization Analysis** — `interpretation.label` (CORRECT_WITH_BOUNDARIES / CORRECT_NO_BOUNDARIES / PARTIAL / EXAMPLE_SPECIFIC / INCORRECT_RULE / OVER_GENERALISED), `interpretation.justification`, `reasoningMode`.
4. **Inference & Transfer Analysis** — `interpretation.label` (FULL_TRANSFER / PARTIAL_TRANSFER / NO_TRANSFER), `interpretation.justification`, `transferQuality`.

**Causal chain:** Required paragraph connecting all four sections with explicit causal language.

**Instructional Priority:** Single highest-priority target — `priorityTarget`, `whyRoot`, `recommendedNextExperience`, `teacherPrompt` (ready-to-use question), `transferRiskTopics[]`.

**`studentEvidence[]`:** Verbatim student turns forwarded into the output JSON for the UI to display as raw quotes, with `highlight` and `highlightReason` fields.

**Conflict resolution:** If a Zippy signal contradicts a `cognitiveEvent` with confidence ≥ 0.8, the cognitive event wins.

---

### `src/components/teacherReport.jsx` — TeacherReport Component

Teacher-facing report consuming the Cognitive Breakdown Report JSON.

**Sections:**
- **Misconception Check:** One row per misconception. If `signal === CORRECTED` or `IDENTIFIED`: compact layout (title + chip + raw student quote). If `signal === SHARED`: two-column layout with the student's raw quote (found via `highlightReason` ID match or word-overlap search against `studentEvidence` phase-2 turns), root cause in amber callout, and instructional action. Root cause is hidden when the student corrected the misconception.
- **Where Thinking Breaks:** Four breakpoint nodes (Misconception / Pattern / Generalisation / Transfer) with pass/partial/fail/unreached icons. Below the nodes: one-sentence summary per phase using `pa.finding` (Pattern), `ga.interpretation.justification` (Generalisation), `ia.interpretation.justification` (Transfer).
- **Proof from the Interaction:** Up to 3 highlighted student turns from `studentEvidence`, sorted by `highlight` flag then chronological order.
- **What to Do Next:** `priorityTarget` headline, `recommendedNextExperience`, `teacherPrompt` in a sky callout, `transferRiskTopics` as pills.

**Removed:** Priority Action sidebar (moved to What to Do Next inside the report), ActionPanel with buttons (Assign follow-up task, Ask Zippy to probe deeper, Add teacher note).

---

### `src/components/StudentReport.jsx` — StudentReport Component

Student-facing session recap. No diagnostic language ("misconception", "breakpoint", "signal").

**Sections:**
- **Header:** Emoji + personalised headline ("Great job!", "Nice work!", "Keep it up!") derived from how many misconceptions were corrected.
- **What You Did Well:** Animated strength items derived from phase signals. If `thinSession: true`, shows a single honest fallback line.
- **Your Skills This Session:** Four skill bars (Spotting errors / Seeing patterns / Making rules / Applying ideas) with scores from phase signals. MISSED → 0, NO_TRANSFER → 0, INCORRECT_RULE → 0. Bars are hidden entirely when `thinSession: true`.
- **Something to Look At Again (FocusCard):** Derived from actual phase outcomes, not the teacher-addressed `recommendedNextExperience`. Priority order: `thinSession` → SHARED misconception (using `item.evidence` for specificity) → MISSED pattern → INCORRECT/OVER_GENERALISED rule → NO_TRANSFER → PARTIAL_TRANSFER.
- **Can You Answer This? (ChallengeCard):** Tap-to-reveal self-challenge from `teacherPrompt` (stripped of "Try asking:" prefix). Hidden when `thinSession: true`.
- **Ready for Your Next Challenge?:** Dark CTA card with `onStartNextSession` callback and first `transferRiskTopics` entry as preview.

---

## UI Routing Changes

### `src/views/FeedbackView.jsx`
- Added `StudentReport` import; accepts `currentUser` prop from App.jsx.
- When `userRole === 'student'` and evaluation exists: renders `StudentReport` (student's first name, task title, `onBackToDashboard` as next-session callback).
- Other roles fall back to `TeacherReport`.

### `src/views/TeacherFeedbackView.jsx`
- Replaced `EvaluationBreakdown` with `TeacherReport`.

### `src/views/StudentDetailView.jsx`
- Replaced `EvaluationBreakdown` with `TeacherReport`.
- Removed "Priority Action" sidebar card (now inside TeacherReport as "What to Do Next").

### `src/App.jsx`
- Passes `currentUser` to `FeedbackView` so `StudentReport` can personalise the headline.

---

## Files Modified

| File | Change |
|---|---|
| `src/utils/zippyPrompt.js` | v5.0 — event-tagged phases, silent HTML comment signalling protocol |
| `src/utils/zippyPromptES.js` | Spanish equivalent updated to match v5.0 structure |
| `src/utils/conversationEvents.js` | New — full evidence extraction pipeline |
| `src/utils/evaluatorPrompt.js` | v3.0 — replaced 4-category rubric with E→I→D→A Cognitive Breakdown Report |
| `src/components/teacherReport.jsx` | New — TeacherReport component (was EvaluationBreakdown) |
| `src/components/StudentReport.jsx` | New — StudentReport component |
| `src/views/FeedbackView.jsx` | Routes to StudentReport for student role |
| `src/views/TeacherFeedbackView.jsx` | Uses TeacherReport |
| `src/views/StudentDetailView.jsx` | Uses TeacherReport; removed Priority Action sidebar |
| `src/App.jsx` | Passes currentUser to FeedbackView |
| `.env` | PORT changed to 3010, VITE_API_URL updated to localhost:3010 |

---

## Date: December 23, 2025

## Overview
Updated the ITeachU application with new comprehensive system prompts based on the Alpha specification files:
- `ITeachU_Prompt.pdf` (Zippy AI protégé character)
- `evaluator_prompt.pdf` (Backend evaluation rubric)

---

## Changes Made

### 1. New Zippy System Prompt Generator (`src/utils/zippyPrompt.js`)

**Created:** Comprehensive prompt generator function that implements the 5-phase conversation flow.

**Key Features:**
- **Character**: Zippy - engaging, friendly middle schooler learner
- **5-Phase Conversation Flow**:
  1. Ask for Concept Clarification
  2. Parse Question Into Steps
  3. Misconception Probing (one at a time, critical!)
  4. Metacognitive Reflection
  5. Close With Gratitude
- **Global Constraints**: Never correct, never reveal backend data, stay in character
- **Responsibilities**: Safety-first, privacy protection, help-seeking encouragement
- **Special Features**: 988 crisis line protocol, PII warnings, help abuse detection

### 2. Updated Task Configurations (`src/App.jsx`)

**Modified Both Tasks:**

#### Stack of Cups Challenge
- Added `problemStatement`: Full problem description
- Added `teachingPrompt`: Learning goal for Zippy
- Added `targetConcepts`: ['Linear patterns', 'Nesting structures', 'Function notation', 'Rate of change']
- Added `correctSolutionPathway`: Detailed correct solution
- Added `misconceptions`: 4 ordered common misconceptions

#### Smoothie Recipe Ratios
- Added same metadata structure for ratio/proportion task
- Added `misconceptions`: 4 ordered common misconceptions about ratio scaling

### 3. Updated API Integration (`src/App.jsx`)

**Modified `sendMessage` function (lines 391-403):**
- Changed from sending system prompt as first user message
- Now properly sends `system` parameter in API request
- Uses `getTaskSystemPrompt()` helper function to generate prompt dynamically

**Added Helper Function:**
```javascript
const getTaskSystemPrompt = (taskKey) => {
  const task = TASKS[taskKey];
  if (!task) return '';

  return generateZippyPrompt({
    title: task.title,
    problemStatement: task.problemStatement,
    teachingPrompt: task.teachingPrompt,
    targetConcepts: task.targetConcepts,
    correctSolutionPathway: task.correctSolutionPathway,
    misconceptions: task.misconceptions
  });
};
```

---

## Backend Evaluation System

### Current State
- Backend server exists at `server.js`
- Has `/api/teacher/conversations` endpoint (line 65-77)
- Currently only returns conversation metadata
- **Evaluation logic NOT YET IMPLEMENTED** (see comment line 73)

### Required Backend Implementation

**Location:** `server.js` line 73

**Evaluator Rubric (from evaluator_prompt.pdf):**

#### 4 Categories (weighted):
1. **Concept Articulation** (30%) - Precise terminology and variable definitions
2. **Logic Coherence** (30%) - Internal consistency of reasoning
3. **Misconception Correction** (30%) - Ability to identify and correct errors
4. **Cognitive Resilience** (10%) - Independence and persistence

#### Scoring:
- Each category: 1-4 rating
- Weighted total: 0-100 scale
- Formula: `(C1 × 0.30) + (C2 × 0.30) + (C3 × 0.30) + (C4 × 0.10) × 25`

#### Output Format:
```javascript
{
  categoryScores: {
    conceptArticulation: 3,  // 1-4
    logicCoherence: 4,        // 1-4
    misconceptionCorrection: 3, // 1-4
    cognitiveResilience: 3    // 1-4
  },
  justifications: {
    conceptArticulation: "Student explained nesting concept clearly with examples...",
    logicCoherence: "Reasoning was sequential and internally consistent...",
    misconceptionCorrection: "Corrected proportional thinking misconception...",
    cognitiveResilience: "Persisted through confusion and revised thinking..."
  },
  totalScore: 82.5  // 0-100
}
```

### Implementation Steps for Backend:

1. **Create evaluator prompt template** in `server.js` or separate file
2. **Add evaluation function** that:
   - Takes conversation transcript + task metadata
   - Calls Claude API with evaluator system prompt
   - Parses structured output
   - Returns scores and justifications
3. **Update `/api/teacher/conversations` endpoint** to:
   - Run evaluation on each logged conversation
   - Return evaluation results alongside metadata
4. **Consider adding separate endpoint**: `/api/teacher/evaluate/:conversationId`

---

## Testing Instructions

### 1. Start Backend Server
```bash
cd /Users/yuchenfama/Documents/claude-code/cognality/ITeachU
node server.js
```

### 2. Start Frontend Dev Server
```bash
cd /Users/yuchenfama/Documents/claude-code/cognality/ITeachU
npm run dev
```

### 3. Test the New Prompt
1. Open browser to `http://localhost:3000`
2. Select "Stack of Cups Challenge" task
3. Start teaching Zippy
4. Observe new behavior:
   - Phase 1: Zippy asks you to clarify the concept
   - Phase 2: Zippy asks for your step-by-step approach
   - Phase 3: Zippy introduces misconceptions one at a time
   - Phase 4: Zippy reflects on what was learned
   - Phase 5: Zippy closes with gratitude

### 4. Verify Safety Features
- Try sharing PII → Zippy should warn you
- Try giving low-effort responses ("I don't know" repeatedly) → Zippy should end conversation
- Check that Zippy never breaks character

---

## Files Modified

1. ✅ **Created**: `src/utils/zippyPrompt.js` (New)
2. ✅ **Modified**: `src/App.jsx` (Lines 1-403)
   - Added import for `generateZippyPrompt`
   - Updated task configurations with new metadata
   - Added `getTaskSystemPrompt()` helper
   - Fixed API integration to use `system` parameter

---

## Files NOT Modified (Future Work)

1. ❌ **Backend**: `server.js` - Needs evaluator implementation
2. ⚠️ **Component**: `src/components/ITeachUV2.jsx` - Still uses old `generateSystemPrompt()` with Cognality profiles (may need update if used)

---

## Known Issues / Notes

1. **ITeachUV2 Component**: Uses different system prompt generator with "Cognality" profiles. May need to be updated or deprecated in favor of new App.jsx flow.

2. **Task Metadata**: Currently hardcoded in App.jsx. Consider moving to JSON files or database for easier management.

3. **Backend Evaluation**: Critical feature not yet implemented. Teacher dashboard cannot show rubric scores until backend evaluator is built.

4. **Session Storage**: Currently uses localStorage. May want to sync with backend for teacher visibility.

---

## Next Steps (Priority Order)

### High Priority
1. **Test the updated app** with actual students
2. **Implement backend evaluator** using evaluator_prompt.pdf spec
3. **Update teacher dashboard** to display evaluation scores

### Medium Priority
4. **Update or deprecate** ITeachUV2.jsx component's prompt system
5. **Move task metadata** to external JSON files
6. **Add more tasks** following new metadata structure

### Low Priority
7. **Add authentication** to `/api/teacher/conversations` endpoint
8. **Persist conversations** to database instead of in-memory
9. **Add real-time evaluation** feedback for teachers

---

## Reference Files

- **Source Prompts**:
  - `/Users/yuchenfama/Documents/claude-code/cognality/ITeachU/alpha/ITeachU_Prompt.pdf`
  - `/Users/yuchenfama/Documents/claude-code/cognality/ITeachU/alpha/evaluator_prompt.pdf`

- **Updated Code**:
  - `/Users/yuchenfama/Documents/claude-code/cognality/ITeachU/src/utils/zippyPrompt.js`
  - `/Users/yuchenfama/Documents/claude-code/cognality/ITeachU/src/App.jsx`

---

## Questions or Issues?

Contact the development team or refer to:
- Claude Code documentation
- ITeachU repository: `/Users/yuchenfama/Documents/claude-code/cognality/ITeachU`
- Alpha spec folder: `/Users/yuchenfama/Documents/claude-code/cognality/ITeachU/alpha/`
