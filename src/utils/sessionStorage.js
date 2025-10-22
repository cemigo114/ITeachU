/**
 * Simple localStorage utilities for session persistence
 * MVP - No encryption, just basic save/restore
 */

const SESSION_KEY = 'iteachu_active_session';
const SESSIONS_HISTORY_KEY = 'iteachu_sessions_history';

/**
 * Save current teaching session to localStorage AND backend
 */
export const saveSession = async (sessionData) => {
  try {
    const session = {
      ...sessionData,
      lastUpdated: new Date().toISOString()
    };

    // Save to localStorage (immediate)
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Sync to backend (async, non-blocking)
    try {
      await fetch('http://localhost:3002/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          sessionData: session
        })
      });
    } catch (backendError) {
      // Non-critical: Continue even if backend fails
      console.warn('Backend sync failed (localStorage still saved):', backendError.message);
    }

    return true;
  } catch (error) {
    console.error('Error saving session:', error);
    return false;
  }
};

/**
 * Load active session from localStorage
 */
export const loadSession = () => {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;

    const session = JSON.parse(data);

    // Check if session is stale (older than 24 hours)
    const lastUpdated = new Date(session.lastUpdated);
    const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate > 24) {
      clearSession(); // Auto-clear stale sessions
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
};

/**
 * Clear active session
 */
export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing session:', error);
    return false;
  }
};

/**
 * Archive completed session to history
 */
export const archiveSession = (sessionData) => {
  try {
    const history = getSessionHistory();

    const archivedSession = {
      ...sessionData,
      completedAt: new Date().toISOString()
    };

    // Keep only last 10 sessions to avoid localStorage limits
    const updatedHistory = [archivedSession, ...history].slice(0, 10);

    localStorage.setItem(SESSIONS_HISTORY_KEY, JSON.stringify(updatedHistory));
    clearSession(); // Remove from active

    return true;
  } catch (error) {
    console.error('Error archiving session:', error);
    return false;
  }
};

/**
 * Get session history
 */
export const getSessionHistory = () => {
  try {
    const data = localStorage.getItem(SESSIONS_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading session history:', error);
    return [];
  }
};

/**
 * Create new session object
 */
export const createSession = (taskId, taskTitle, personality = 'Zippy') => {
  return {
    sessionId: crypto.randomUUID(),
    taskId,
    taskTitle,
    personality,
    messages: [],
    progress: {
      turnCount: 0,
      checkpointsReached: [],
      deltaLearning: 0,
      evidenceCollected: {
        usedExamples: false,
        definedTerms: false,
        checkedUnderstanding: false,
        explainedWhy: false
      }
    },
    startedAt: new Date().toISOString()
  };
};

/**
 * Update session progress
 */
export const updateSessionProgress = (session, newMessage, evidence = {}) => {
  const updatedSession = {
    ...session,
    messages: [...session.messages, newMessage],
    progress: {
      ...session.progress,
      turnCount: session.progress.turnCount + 1,
      evidenceCollected: {
        ...session.progress.evidenceCollected,
        ...evidence
      }
    }
  };

  saveSession(updatedSession);
  return updatedSession;
};

/**
 * Check if there's a resumable session
 */
export const hasResumableSession = () => {
  const session = loadSession();
  return session !== null && session.messages.length > 0;
};

/**
 * Get session summary for "Resume" prompt
 */
export const getSessionSummary = () => {
  const session = loadSession();
  if (!session) return null;

  return {
    taskTitle: session.taskTitle,
    personality: session.personality,
    turnCount: session.progress.turnCount,
    startedAt: session.startedAt,
    lastUpdated: session.lastUpdated
  };
};
