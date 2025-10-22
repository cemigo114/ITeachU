# Phase 1 Integration Guide

## Files Created

### 1. `/db-schema-phase1.sql`
Database schema for:
- AI Prompt Templates (reduce duplication)
- Task Collections (organize many tasks)
- Task Content Variants (A/B testing & updates)
- Modified task_ai_configs to use templates

### 2. `/src/utils/sessionStorage.js`
localStorage utilities for session persistence:
- `saveSession(sessionData)` - Auto-saves during conversation
- `loadSession()` - Restore on page load
- `createSession(taskId, title, personality)` - Start new session
- `updateSessionProgress(session, newMessage, evidence)` - Track progress
- `archiveSession(sessionData)` - Save to history on completion
- `hasResumableSession()` - Check if can resume
- `getSessionSummary()` - Get resume prompt data

## MVP Integration Steps

### Step 1: Add Session Persistence to Chat

Update your chat message handler to save after each message:

```javascript
const handleSendMessage = async () => {
  const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };

  // Update session with new message
  const updatedSession = updateSessionProgress(currentSession, userMessage, {
    usedExamples: input.includes('example') || input.includes('like'),
    definedTerms: input.includes('means') || input.includes('called'),
    checkedUnderstanding: input.includes('understand?') || input.includes('make sense?'),
    explainedWhy: input.includes('because') || input.includes('reason')
  });

  setCurrentSession(updatedSession);
  setMessages(updatedSession.messages);

  // ... rest of AI call logic

  const aiMessage = { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() };
  const finalSession = updateSessionProgress(updatedSession, aiMessage);
  setCurrentSession(finalSession);
  setMessages(finalSession.messages);
};
```

### Step 2: Add Resume Prompt UI

Add this to your student dashboard:

```javascript
{showResumePrompt && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-2">Resume Session?</h3>
      <p className="text-gray-600 mb-4">
        You have an unfinished session:
        <br/><strong>{getSessionSummary().taskTitle}</strong>
        <br/>Started {new Date(getSessionSummary().startedAt).toLocaleString()}
        <br/>{getSessionSummary().turnCount} messages
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => {
            const session = loadSession();
            setCurrentSession(session);
            setMessages(session.messages);
            setView('teachingSession');
            setShowResumePrompt(false);
          }}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Resume
        </button>
        <button
          onClick={() => {
            clearSession();
            setShowResumePrompt(false);
          }}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Start Fresh
        </button>
      </div>
    </div>
  </div>
)}
```

### Step 3: Initialize Session on Task Start

When student clicks "Start Task":

```javascript
const handleStartTask = (task) => {
  // Create new session
  const newSession = createSession(task.id, task.title, 'Zippy');
  setCurrentSession(newSession);

  // Add initial AI message
  const initialMessage = {
    role: 'assistant',
    content: task.aiIntro,
    timestamp: new Date().toISOString()
  };

  const updatedSession = updateSessionProgress(newSession, initialMessage);
  setCurrentSession(updatedSession);
  setMessages(updatedSession.messages);

  setView('teachingSession');
};
```

### Step 4: Archive Session on Completion

When session ends:

```javascript
const handleEndSession = () => {
  if (currentSession) {
    archiveSession(currentSession);
    setCurrentSession(null);
    setMessages([]);
  }
  setView('studentDashboard');
};
```

## Task Collections - Mock Data

Create `/src/data/taskCollections.json`:

```json
{
  "collections": [
    {
      "id": "grade-8-stats",
      "title": "Grade 8 - Statistics & Probability",
      "type": "unit",
      "tasks": [
        {
          "id": "stack_of_cups",
          "order": 1,
          "required": true
        },
        {
          "id": "scatter_plots_intro",
          "order": 2,
          "required": true
        }
      ]
    },
    {
      "id": "grade-6-ratios",
      "title": "Grade 6 - Ratios & Proportions",
      "type": "unit",
      "tasks": [
        {
          "id": "smoothie_recipe",
          "order": 1,
          "required": true
        }
      ]
    }
  ]
}
```

## Template System - Quick Example

Instead of storing full prompts for each task, use templates:

```javascript
// Template
const INTRO_TEMPLATE = `
Hi! I'm Zippy! 🎉

I see {{data_point_1}} and {{data_point_2}}.

If {{incorrect_reasoning}}, but that doesn't match! 🤔

Can you help me figure out what's happening?
`;

// Task-specific variables
const stackOfCupsVars = {
  data_point_1: "2 cups = 16cm",
  data_point_2: "4 cups = 20cm",
  incorrect_reasoning: "1 cup = 8cm, so 8 cups = 64cm"
};

// Compose at runtime
const aiIntro = INTRO_TEMPLATE
  .replace('{{data_point_1}}', stackOfCupsVars.data_point_1)
  .replace('{{data_point_2}}', stackOfCupsVars.data_point_2)
  .replace('{{incorrect_reasoning}}', stackOfCupsVars.incorrect_reasoning);
```

## Benefits

### Session Persistence
✅ Students can refresh page without losing progress
✅ Survives browser crashes
✅ Auto-clears stale sessions (24hr)
✅ Keeps last 10 completed sessions in history

### Template System
✅ Update prompts globally without touching tasks
✅ 80% less storage
✅ A/B test prompt variations
✅ Version control prompts separately

### Task Collections
✅ Browse by unit/grade level
✅ Track progress through curriculum
✅ Assign entire units at once
✅ Show prerequisites

## Next Steps (Not Implemented Yet)

1. Connect localStorage to backend when server exists
2. Implement actual template rendering (use Handlebars or Mustache)
3. Build task collection browser UI
4. Add task content variants for A/B testing

## Testing

Test session persistence:
1. Start a task as student
2. Send 2-3 messages
3. Refresh page
4. Should show "Resume session?" prompt
5. Click Resume - conversation should restore
6. Click Start Fresh - localStorage cleared

Check DevTools > Application > Local Storage to see:
- `iteachu_active_session` - Current session
- `iteachu_sessions_history` - Completed sessions (max 10)
