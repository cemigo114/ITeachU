import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { generateZippyPrompt } from '../utils/zippyPrompt';
import { generateZippyPromptES } from '../utils/zippyPromptES';
import tasksData from '../data/tasks.json';
import TeachingSession from './TeachingSession';

const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const TASKS = Object.fromEntries(
  Object.entries(tasksData.tasks).map(([id, task]) => [snakeToCamel(id), task])
);

const getTaskField = (task, field, language = 'en') => {
  if (language === 'es' && task[`${field}ES`]) return task[`${field}ES`];
  return task[field];
};

const getTaskSystemPrompt = (taskKey, language = 'en') => {
  const task = TASKS[taskKey];
  if (!task) return '';
  const gen = language === 'es' ? generateZippyPromptES : generateZippyPrompt;
  return gen({
    title: getTaskField(task, 'title', language),
    problemStatement: task.problemStatement,
    teachingPrompt: task.teachingPrompt,
    targetConcepts: task.targetConcepts,
    correctSolutionPathway: task.correctSolutionPathway,
    misconceptions: task.misconceptions,
    studentCognality: 'Decoder',
  });
};

const detectEvidence = (messageContent, currentEvidence) => {
  const lower = messageContent.toLowerCase();
  const newEvidence = {};
  if (!currentEvidence.usedExamples && (lower.includes('example') || lower.includes('for instance') || lower.includes('like when')))
    newEvidence.usedExamples = true;
  if (!currentEvidence.definedTerms && (lower.includes('means') || lower.includes('is when') || lower.includes('defined as') || lower.match(/\b(is|are)\s+(a|an|the)/)))
    newEvidence.definedTerms = true;
  if (!currentEvidence.checkedUnderstanding && (lower.includes('understand') || lower.includes('make sense') || lower.includes('see how') || lower.includes('get it')))
    newEvidence.checkedUnderstanding = true;
  if (!currentEvidence.explainedWhy && (lower.includes('because') || lower.includes('reason') || lower.includes('why') || lower.includes("that's because")))
    newEvidence.explainedWhy = true;
  return newEvidence;
};

/**
 * TeachingSessionWrapper — route-based wrapper around the existing
 * TeachingSession component. Manages all chat state that was previously
 * in App.jsx and passes it through as props.
 */
export default function TeachingSessionWrapper() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  // Resolve the task from the task bank
  const taskKey = taskId
    ? taskId.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
    : null;
  const task = taskKey ? TASKS[taskKey] : null;

  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState(() => {
    if (task) {
      return [{ role: 'assistant', content: getTaskField(task, 'aiIntro', 'en') }];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [progress, setProgress] = useState({
    turnCount: 0,
    evidenceCollected: {
      usedExamples: false,
      definedTerms: false,
      checkedUnderstanding: false,
      explainedWhy: false,
    },
  });

  const completeChatTurn = async (conversationAfterUser, lastUserContent, { isEdit = false } = {}) => {
    setLoading(true);
    try {
      if (!task) throw new Error('Task not found');
      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          system: getTaskSystemPrompt(taskKey, language),
          messages: conversationAfterUser.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
          sessionId,
          taskMetadata: {
            title: getTaskField(task, 'title', language),
            problemStatement: task.problemStatement,
            teachingPrompt: task.teachingPrompt,
            targetConcepts: task.targetConcepts,
            correctSolutionPathway: task.correctSolutionPathway,
            misconceptions: task.misconceptions,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'parse error' }));
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(err)}`);
      }

      const data = await response.json();
      if (data.sessionId && !sessionId) setSessionId(data.sessionId);

      if (data.content && data.content[0]) {
        const aiMessage = { role: 'assistant', content: data.content[0].text };
        setMessages([...conversationAfterUser, aiMessage]);

        const isSessionComplete =
          aiMessage.content.includes('Thanks so much for teaching me today') ||
          aiMessage.content.includes('Thanks for teaching me today');

        if (isSessionComplete) {
          setProgress({
            turnCount: conversationAfterUser.length,
            evidenceCollected: {
              usedExamples: true,
              definedTerms: true,
              checkedUnderstanding: true,
              explainedWhy: true,
            },
          });
        } else {
          setProgress((prev) => {
            const newEvidence = detectEvidence(lastUserContent, prev.evidenceCollected);
            return {
              turnCount: isEdit ? prev.turnCount : prev.turnCount + 1,
              evidenceCollected: { ...prev.evidenceCollected, ...newEvidence },
            };
          });
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Chat error:', error);
      let errorMessage = "Oops! I had trouble connecting. Can you try explaining that again?";
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = "I couldn't reach the server. Please check if the backend is running.";
      } else if (error.message.includes('API Error: 500')) {
        errorMessage = 'The server encountered an error. Please check backend logs.';
      }
      setMessages([...conversationAfterUser, { role: 'assistant', content: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = useCallback(async (textOverride) => {
    const messageText = (textOverride || input).trim();
    if (!messageText || loading) return;
    const userMessage = { role: 'user', content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    await completeChatTurn(updatedMessages, messageText, { isEdit: false });
  }, [input, loading, messages, sessionId, task, taskKey, language]);

  const editUserMessage = useCallback(async (messageIndex, newContent) => {
    const trimmed = newContent.trim();
    if (!trimmed || loading) return;
    if (messages[messageIndex]?.role !== 'user') return;
    const updatedMessages = [
      ...messages.slice(0, messageIndex),
      { role: 'user', content: trimmed },
    ];
    setMessages(updatedMessages);
    await completeChatTurn(updatedMessages, trimmed, { isEdit: true });
  }, [loading, messages, sessionId, task, taskKey, language]);

  const completeSession = useCallback(() => {
    if (!sessionId) {
      alert('Error: Session tracking failed. Please try your last message again.');
      return;
    }
    // Navigate to review
    navigate(`/review/${taskId}`, { replace: true });
  }, [sessionId, taskId, navigate]);

  const handleBack = useCallback(() => {
    navigate('/student');
  }, [navigate]);

  return (
    <TeachingSession
      task={task}
      messages={messages}
      input={input}
      setInput={setInput}
      loading={loading}
      onSendMessage={sendMessage}
      onEditUserMessage={editUserMessage}
      onCompleteSession={completeSession}
      onBack={handleBack}
      progress={progress}
      language={language}
      setLanguage={setLanguage}
      getTaskField={getTaskField}
    />
  );
}
