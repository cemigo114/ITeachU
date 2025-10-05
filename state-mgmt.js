// Session state stored in memory/DB
{
  sessionId: "uuid",
  studentId: "student_123",
  taskId: "stack_of_cups",
  personality: "zippy",
  
  // Conversation context
  messages: [...],  // Full history for Claude API
  
  // Computed state (not sent to LLM)
  metrics: {
    deltaLearning: 0-100,
    turnsElapsed: 0,
    misconceptionsCorrected: [],
    clarificationsRequested: 0,
    evidenceCapture: {
      usedExamples: false,
      definedTerms: false,
      checkedUnderstanding: false,
      explainedWhy: false
    }
  },
  
  // Checkpoint for assessment
  preTeachingSnapshot: {...},
  postTeachingSnapshot: null
}