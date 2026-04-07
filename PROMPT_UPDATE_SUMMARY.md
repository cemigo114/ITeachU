# ITeachU Prompt Update Summary

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
