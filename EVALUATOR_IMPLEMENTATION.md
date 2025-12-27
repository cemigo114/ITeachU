# Backend Evaluator Implementation

## Date: December 24, 2024

## Overview
Implemented the complete backend evaluation system based on the `evaluator_prompt.pdf` specification. The evaluator assesses student-AI Protégé conversations using a 4-category competency rubric.

---

## Files Created/Modified

### 1. Created: `src/utils/evaluatorPrompt.js`

**Purpose:** Generates the system prompt for the LLM Evaluator

**Key Features:**
- Implements the complete evaluator role and instructions from the PDF
- Defines 4 evaluation categories with weights:
  1. **Concept Articulation** (30%)
  2. **Logic Coherence** (30%)
  3. **Misconception Correction** (30%)
  4. **Cognitive Off-loading Resilience** (10%)
- Specifies 1-4 rating scale with detailed criteria for each category
- Enforces strict JSON output format

**Function:**
```javascript
export const generateEvaluatorPrompt = () => {
  // Returns the complete evaluator system prompt
}
```

### 2. Modified: `server.js`

**Changes:**
1. **Import evaluator prompt generator** (line 6)
   ```javascript
   import { generateEvaluatorPrompt } from './src/utils/evaluatorPrompt.js';
   ```

2. **Added evaluation cache** (line 18)
   ```javascript
   const evaluationCache = new Map(); // conversationId -> evaluation result
   ```

3. **Updated conversation logging** (lines 48-55)
   - Now stores `system` prompt
   - Now stores `taskMetadata` for evaluation context

4. **Added `evaluateConversation()` function** (lines 76-192)
   - Takes conversation log and ID
   - Formats transcript for evaluator
   - Calls Claude API with evaluator prompt
   - Parses JSON evaluation response
   - Caches results to avoid re-evaluation
   - Returns evaluation with scores and justifications

5. **Updated `/api/teacher/conversations` endpoint** (lines 195-228)
   - Now `async` to support evaluations
   - Evaluates all conversations in parallel
   - Returns evaluation results alongside metadata

### 3. Modified: `src/App.jsx`

**Change:** (lines 403-411)
Added `taskMetadata` to API request body:
```javascript
taskMetadata: {
  title: task.title,
  problemStatement: task.problemStatement,
  teachingPrompt: task.teachingPrompt,
  targetConcepts: task.targetConcepts,
  correctSolutionPathway: task.correctSolutionPathway,
  misconceptions: task.misconceptions
}
```

---

## How It Works

### Conversation Flow:

1. **Student chats with Zippy** (frontend)
   - Frontend sends message with task metadata
   - Backend proxies to Claude API
   - Backend logs conversation + task metadata

2. **Teacher views dashboard** (frontend → backend)
   - Frontend calls `/api/teacher/conversations`
   - Backend evaluates each logged conversation
   - Backend returns scores + justifications

3. **Evaluation Process** (backend)
   ```
   Conversation Log → Format Transcript → Build Evaluation Request
   → Call Claude API with Evaluator Prompt → Parse JSON Response
   → Cache Result → Return to Teacher Dashboard
   ```

### Evaluation Output Format:

```javascript
{
  "categoryScores": {
    "conceptArticulation": 3,         // 1-4
    "logicCoherence": 4,               // 1-4
    "misconceptionCorrection": 3,      // 1-4
    "cognitiveResilience": 3           // 1-4
  },
  "justifications": {
    "conceptArticulation": "Student explained nesting concept clearly with examples...",
    "logicCoherence": "Reasoning was sequential and internally consistent...",
    "misconceptionCorrection": "Corrected proportional thinking misconception...",
    "cognitiveResilience": "Persisted through confusion and revised thinking..."
  },
  "totalScore": 82.5  // 0-100 scale
}
```

### Scoring Formula:

```
Total Score = ((C1 × 0.30) + (C2 × 0.30) + (C3 × 0.30) + (C4 × 0.10)) × 25
```

Where C1-C4 are the category scores (1-4).

---

## API Endpoints

### `GET /api/teacher/conversations`

**Response:**
```json
{
  "count": 5,
  "conversations": [
    {
      "id": 0,
      "timestamp": "2024-12-24T10:30:00.000Z",
      "turnCount": 8,
      "taskTitle": "Stack of Cups Challenge",
      "evaluation": {
        "categoryScores": {
          "conceptArticulation": 3,
          "logicCoherence": 4,
          "misconceptionCorrection": 3,
          "cognitiveResilience": 3
        },
        "justifications": {
          "conceptArticulation": "...",
          "logicCoherence": "...",
          "misconceptionCorrection": "...",
          "cognitiveResilience": "..."
        },
        "totalScore": 82.5,
        "error": false
      }
    }
    // ... more conversations
  ]
}
```

---

## Testing Instructions

### 1. Restart Backend Server

The backend code has changed, so restart the server:

```bash
# In Terminal 1
cd /Users/yuchenfama/Documents/claude-code/cognality/ITeachU
# Kill the old server (Ctrl+C)
npm run server
```

You should see:
```
🚀 Proxy server running on http://localhost:3002
📊 Backend assessment enabled - logs hidden from frontend
```

### 2. Test Student Conversation

1. Open browser to `http://localhost:3000`
2. Log in as "Student"
3. Select "Stack of Cups Challenge"
4. Have a conversation with Zippy (at least 4-5 exchanges)
5. Try to:
   - Explain the concept
   - Correct Zippy's misconceptions
   - Show your reasoning

### 3. Check Backend Console

Watch the backend terminal for logs like:
```
📊 Conversation logged for backend assessment (1 total)
```

### 4. View Teacher Dashboard

**Option A: Via Browser Console**
```javascript
fetch('http://localhost:3002/api/teacher/conversations')
  .then(r => r.json())
  .then(console.log)
```

**Option B: Via curl**
```bash
curl http://localhost:3002/api/teacher/conversations | jq
```

**Expected Output:**
```
📊 Teacher dashboard requested: 1 conversations to evaluate
🔍 Evaluating conversation 0...
✅ Evaluation complete for conversation 0: 82.5/100
```

You should see evaluation results with:
- Category scores (1-4 for each)
- Justifications (evidence-based text)
- Total score (0-100)

### 5. Test Caching

Call the teacher endpoint again - you should see:
```
📋 Using cached evaluation for conversation 0
```

This avoids re-evaluating the same conversation.

---

## Key Features Implemented

✅ **4-Category Rubric**
- Concept Articulation (30%)
- Logic Coherence (30%)
- Misconception Correction (30%)
- Cognitive Resilience (10%)

✅ **Evidence-Based Evaluation**
- Evaluator cites specific evidence from transcript
- No invented evidence
- 1-3 sentence justifications per category

✅ **Structured Output**
- JSON format with scores and justifications
- Weighted total score (0-100)
- Error handling for invalid responses

✅ **Performance Optimization**
- Evaluation caching (avoids redundant API calls)
- Parallel evaluation of multiple conversations
- Async/await throughout

✅ **Task Context**
- Task metadata included in evaluation
- Target concepts, correct solution, misconceptions
- Helps evaluator assess based on task goals

---

## Known Limitations

1. **In-Memory Storage**
   - Conversations stored in memory (lost on server restart)
   - Production should use database (MongoDB, PostgreSQL, etc.)

2. **No Authentication**
   - Teacher endpoint is public
   - Production needs auth middleware

3. **Evaluation Cost**
   - Each evaluation costs ~1-2K tokens
   - Cache mitigates this, but first evaluation is expensive

4. **No Real-Time Evaluation**
   - Evaluations only run when teacher dashboard is accessed
   - Could implement background evaluation job

---

## Future Enhancements

### High Priority
1. **Database Integration**
   - Store conversations and evaluations in database
   - Enable historical analysis

2. **Teacher Dashboard UI**
   - Build frontend view for `/api/teacher/conversations`
   - Display scores, justifications, conversation replay

3. **Authentication**
   - Add teacher login
   - Secure teacher endpoints

### Medium Priority
4. **Real-Time Evaluation**
   - Evaluate conversations as they complete
   - Background job or event-driven

5. **Evaluation Analytics**
   - Average scores by task
   - Student progress over time
   - Misconception patterns

6. **Export Functionality**
   - Export evaluations as CSV/PDF
   - Teacher reports

---

## Evaluation Rubric Reference

### Category 1: Concept Articulation (30%)
- 4 = Strong: Accurate, appropriate language, clear understanding
- 3 = Adequate: Core idea correct, minor imprecision
- 2 = Emerging: Partial/fragmented, vague/inconsistent
- 1 = Weak: Misrepresents or cannot explain

### Category 2: Logic Coherence (30%)
- 4 = Strong: Clear, sequential, internally consistent
- 3 = Adequate: Mostly coherent, minor gaps
- 2 = Emerging: Noticeable gaps, jumps, contradictions
- 1 = Weak: Disorganized, inconsistent, illogical

### Category 3: Misconception Correction (30%)
- 4 = Strong: Consistently recognizes and explains why incorrect
- 3 = Adequate: Corrects most, may miss subtle issues
- 2 = Emerging: Identifies some, accepts/overlooks others
- 1 = Weak: Rarely identifies, accepts incorrect reasoning

### Category 4: Cognitive Resilience (10%)
- 4 = Strong: Persists, revises thinking, engages constructively
- 3 = Adequate: Maintains engagement, some support needed
- 2 = Emerging: Hesitation/frustration, limited re-engagement
- 1 = Weak: Disengages, gives up quickly, avoids confusion

---

## Questions or Issues?

If you encounter any issues:
1. Check backend server console for error messages
2. Check browser console for API errors
3. Verify API key is set in `.env` file
4. Ensure both servers are running (ports 3000 and 3002)

For implementation questions, refer to:
- `src/utils/evaluatorPrompt.js` - Evaluator prompt specification
- `server.js` lines 76-192 - Evaluation logic
- `alpha/evaluator_prompt.pdf` - Original specification
