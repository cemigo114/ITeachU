import React, { useState, useEffect } from 'react';
import { AlertCircle, Play, Trash2 } from 'lucide-react';
import {
  loadSession,
  clearSession,
  createSession,
  updateSessionProgress,
  hasResumableSession,
  getSessionSummary,
  saveSession
} from '../utils/sessionStorage';

/**
 * Session Manager Component
 * Handles session persistence, resume prompts, and state management
 */
const SessionManager = ({ children, taskId, taskTitle }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // Check for resumable session on mount
  useEffect(() => {
    if (hasResumableSession()) {
      setShowResumePrompt(true);
    }
  }, []);

  // Initialize new session
  const startNewSession = () => {
    const newSession = createSession(taskId, taskTitle, 'Zippy');
    setCurrentSession(newSession);
    saveSession(newSession);
    setShowResumePrompt(false);
    return newSession;
  };

  // Resume existing session
  const resumeSession = () => {
    const session = loadSession();
    setCurrentSession(session);
    setShowResumePrompt(false);
    return session;
  };

  // Discard old session and start fresh
  const startFreshSession = () => {
    clearSession();
    startNewSession();
    setShowResumePrompt(false);
  };

  // Update session with new message
  const addMessage = async (message, evidence = {}) => {
    if (!currentSession) {
      console.error('No active session');
      return;
    }

    const updatedSession = updateSessionProgress(currentSession, message, evidence);
    setCurrentSession(updatedSession);
    await saveSession(updatedSession); // Syncs to backend
    return updatedSession;
  };

  // End session
  const endSession = () => {
    clearSession();
    setCurrentSession(null);
  };

  // Resume prompt UI
  const ResumePrompt = () => {
    if (!showResumePrompt) return null;

    const summary = getSessionSummary();

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Resume Session?</h3>
              <p className="text-sm text-gray-600">
                You have an unfinished teaching session
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Task:</span>
              <span className="font-semibold">{summary.taskTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress:</span>
              <span className="font-semibold">{summary.turnCount} messages</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Started:</span>
              <span className="font-semibold">
                {new Date(summary.startedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resumeSession}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 font-semibold"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
            <button
              onClick={startFreshSession}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Pass session management functions to children
  return (
    <>
      <ResumePrompt />
      {children({
        currentSession,
        startNewSession,
        addMessage,
        endSession,
        hasSession: !!currentSession
      })}
    </>
  );
};

export default SessionManager;
