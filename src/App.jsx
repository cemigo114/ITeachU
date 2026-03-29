import React, { useState, useEffect } from 'react';
import { Target, Users, Award, BarChart3, MessageSquare } from 'lucide-react';
import { API_ENDPOINTS } from './config/api';
import { generateZippyPrompt } from './utils/zippyPrompt';
import { generateZippyPromptES } from './utils/zippyPromptES';
import { t } from './utils/translations';
import StandardBadge from './components/StandardBadge';
import {
  hasResumableSession,
} from './utils/sessionStorage';
import tasksData from './data/tasks.json';
import { MOCK_STUDENTS, MOCK_ASSIGNMENTS, EVALUATION_CATEGORIES } from './data/mockData';

import LandingPage from './views/LandingPage';
import LoginView from './views/LoginView';
import TeacherDashboard from './views/TeacherDashboard';
import TeacherBrowseTasks from './views/TeacherBrowseTasks';
import TeacherTaskDetail from './views/TeacherTaskDetail';
import TeacherAssignTask from './views/TeacherAssignTask';
import TeacherReviewAssignments from './views/TeacherReviewAssignments';
import TeacherFeedbackView from './views/TeacherFeedbackView';
import StudentDetailView from './views/StudentDetailView';
import StudentDashboard from './views/StudentDashboard';
import BrowseTasksStudent from './views/BrowseTasksStudent';
import TeachingSession from './views/TeachingSession';
import FeedbackView from './views/FeedbackView';
import ParentDashboard from './views/ParentDashboard';

// ---------- Data & Helpers ----------

const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const TASKS = Object.fromEntries(
  Object.entries(tasksData.tasks).map(([id, task]) => [snakeToCamel(id), task])
);

const EXAMPLE_TASKS = Object.values(tasksData.tasks);

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

// ---------- App Component ----------

const App = () => {
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [language, setLanguage] = useState('en');
  const [view, setView] = useState('landing');

  const [activeStep, setActiveStep] = useState(0);
  const [showStepDetail, setShowStepDetail] = useState(false);
  const [mascotEmotion, setMascotEmotion] = useState('happy');

  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState(null);
  const [selectedStudentsForAssignment, setSelectedStudentsForAssignment] = useState([]);

  const [activeAssignment, setActiveAssignment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const [progress, setProgress] = useState({
    turnCount: 0,
    evidenceCollected: { usedExamples: false, definedTerms: false, checkedUnderstanding: false, explainedWhy: false },
  });

  const [currentSession, setCurrentSession] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS);
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [evaluationData, setEvaluationData] = useState(null);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [collectionView, setCollectionView] = useState('all');

  // ---------- Effects ----------

  useEffect(() => {
    if (hasResumableSession() && userRole === 'student') setShowResumePrompt(true);
  }, [userRole]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_ENDPOINTS.chat.replace('/api/chat', '/api/standards')}`);
        if (r.ok) console.log('✅ Backend API is reachable');
        else console.warn('⚠️ Backend API returned error:', r.status);
      } catch (e) { console.error('❌ Cannot reach backend API:', e.message); }
    })();
  }, []);

  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant' && activeAssignment) {
      const taskKey = activeAssignment.taskId.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      const task = TASKS[taskKey];
      if (task) setMessages([{ role: 'assistant', content: getTaskField(task, 'aiIntro', language) }]);
    }
  }, [language]);

  useEffect(() => {
    if (userRole === 'teacher' && view === 'teacherReviewAssignments') fetchEvaluations();
  }, [userRole, view]);

  useEffect(() => {
    const interval = setInterval(() => setActiveStep((p) => (p + 1) % howItWorksSteps.length), 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const emotions = ['happy', 'curious', 'excited', 'confident', 'encouraging', 'listening'];
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % emotions.length; setMascotEmotion(emotions[i]); }, 500);
    return () => clearInterval(interval);
  }, []);

  // ---------- Handlers ----------

  const fetchEvaluations = async () => {
    setLoadingEvaluations(true);
    try {
      const r = await fetch(API_ENDPOINTS.teacherConversations);
      if (!r.ok) throw new Error('Failed to fetch evaluations');
      setEvaluationData(await r.json());
    } catch (e) { console.error('❌ Error fetching evaluations:', e); setEvaluationData(null); }
    finally { setLoadingEvaluations(false); }
  };

  const handleLogin = (role, user) => {
    setUserRole(role);
    setCurrentUser(user);
    if (role === 'teacher') setView('teacherDashboard');
    else if (role === 'student') setView('studentDashboard');
    else if (role === 'parent') setView('parentDashboard');
  };

  const handleCreateAssignment = () => {
    if (!selectedTaskForAssignment || selectedStudentsForAssignment.length === 0) {
      alert('Please select a task and at least one student');
      return;
    }
    const newAssignments = selectedStudentsForAssignment.map((studentId) => {
      const student = MOCK_STUDENTS.find(s => s.id === studentId);
      return {
        id: assignments.length + studentId,
        studentId: student.id, studentName: student.name,
        taskId: selectedTaskForAssignment.id || selectedTaskForAssignment.slug,
        taskTitle: selectedTaskForAssignment.title,
        status: 'assigned', completedDate: null, messages: [],
      };
    });
    setAssignments([...assignments, ...newAssignments]);
    setSelectedTaskForAssignment(null);
    setSelectedStudentsForAssignment([]);
    setView('teacherDashboard');
    alert(`Task "${selectedTaskForAssignment.title}" assigned to ${selectedStudentsForAssignment.length} student(s)!`);
  };

  const startTeachingSession = (assignment) => {
    setActiveAssignment(assignment);
    setSessionId(null);
    setProgress({ turnCount: 0, evidenceCollected: { usedExamples: false, definedTerms: false, checkedUnderstanding: false, explainedWhy: false } });
    const taskKey = assignment.taskId.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    const task = TASKS[taskKey];
    if (!task) { console.error(`Task not found: ${assignment.taskId}`); return; }
    setMessages([{ role: 'assistant', content: getTaskField(task, 'aiIntro', language) }]);
    setView('teaching');
  };

  const completeChatTurn = async (conversationAfterUser, lastUserContent, { isEdit = false } = {}) => {
    setLoading(true);
    try {
      const taskKey = activeAssignment.taskId.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      const task = TASKS[taskKey];
      if (!task) throw new Error(`Task not found: ${activeAssignment.taskId}`);
      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929', max_tokens: 1024,
          system: getTaskSystemPrompt(taskKey, language),
          messages: conversationAfterUser.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
          sessionId,
          taskMetadata: { title: getTaskField(task, 'title', language), problemStatement: task.problemStatement, teachingPrompt: task.teachingPrompt, targetConcepts: task.targetConcepts, correctSolutionPathway: task.correctSolutionPathway, misconceptions: task.misconceptions },
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
        const isSessionComplete = aiMessage.content.includes('Thanks so much for teaching me today') || aiMessage.content.includes('Thanks for teaching me today');
        if (isSessionComplete) {
          setProgress({ turnCount: conversationAfterUser.length, evidenceCollected: { usedExamples: true, definedTerms: true, checkedUnderstanding: true, explainedWhy: true } });
        } else {
          setProgress(prev => {
            const newEvidence = detectEvidence(lastUserContent, prev.evidenceCollected);
            return {
              turnCount: isEdit ? prev.turnCount : prev.turnCount + 1,
              evidenceCollected: { ...prev.evidenceCollected, ...newEvidence },
            };
          });
        }
      } else throw new Error('Invalid response format');
    } catch (error) {
      console.error('❌ Error:', error);
      let errorMessage = "Oops! I had trouble connecting. Can you try explaining that again?";
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))
        errorMessage = "I couldn't reach the server. Please check if the backend is running.";
      else if (error.message.includes('API Error: 500'))
        errorMessage = 'The server encountered an error. Please check backend logs.';
      setMessages([...conversationAfterUser, { role: 'assistant', content: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (textOverride) => {
    const messageText = (textOverride || input).trim();
    if (!messageText || loading) return;
    const userMessage = { role: 'user', content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    await completeChatTurn(updatedMessages, messageText, { isEdit: false });
  };

  const editUserMessage = async (messageIndex, newContent) => {
    const trimmed = newContent.trim();
    if (!trimmed || loading) return;
    if (messages[messageIndex]?.role !== 'user') return;
    const updatedMessages = [...messages.slice(0, messageIndex), { role: 'user', content: trimmed }];
    setMessages(updatedMessages);
    await completeChatTurn(updatedMessages, trimmed, { isEdit: true });
  };

  const completeSession = () => {
    if (!sessionId) { alert('Error: Session tracking failed. Please try your last message again.'); return; }
    setAssignments(assignments.map(a =>
      a.id === activeAssignment.id
        ? { ...a, status: 'completed', completedDate: new Date().toISOString().split('T')[0], messages, sessionId }
        : a
    ));
    setView('feedback');
    fetchEvaluations();
  };

  const getBadge = (totalScore) => {
    if (totalScore >= 85) return { name: 'Master Teacher', icon: '🏆', color: 'bg-yellow-500' };
    if (totalScore >= 70) return { name: 'Great Explainer', icon: '⭐', color: 'bg-brand-500' };
    if (totalScore >= 50) return { name: 'Good Helper', icon: '👍', color: 'bg-teal-500' };
    return { name: 'Getting Started', icon: '🌱', color: 'bg-neutral-500' };
  };

  const howItWorksSteps = [
    { id: 'T1', title: 'Teacher chooses a task (< 5 mins, real time feedback)', icon: '🧑‍🏫', role: 'Teacher', color: 'indigo', description: 'Select from curriculum-aligned tasks designed to assess deeper understanding', illustration: <Target className="w-16 h-16 text-brand-600" /> },
    { id: 'T2', title: 'Teacher assigns to student(s)', icon: '📝', role: 'Teacher', color: 'indigo', description: 'Assign tasks to individual students or groups with one click', illustration: <Users className="w-16 h-16 text-brand-600" /> },
    { id: 'S1', title: 'Student collaborates with AI solving problems', icon: '🎓', role: 'Student', color: 'green', description: 'Students work alongside AI to solve problems, demonstrating their understanding', illustration: <Award className="w-16 h-16 text-teal-600" /> },
    { id: 'S2', title: 'Student builds evidence and confidence', icon: '📚', role: 'Student', color: 'green', description: 'Evidence of understanding is collected automatically as students teach', illustration: <BarChart3 className="w-16 h-16 text-teal-600" /> },
    { id: 'All', title: 'Everyone gets feedback & recommendation', icon: '💬', role: 'All', color: 'purple', description: 'Teachers, parents, and students receive actionable insights and next steps', illustration: <MessageSquare className="w-16 h-16 text-plum-600" /> },
  ];

  // ---------- View Router ----------

  if (view === 'landing') {
    return <LandingPage mascotEmotion={mascotEmotion} activeStep={activeStep} setActiveStep={setActiveStep} showStepDetail={showStepDetail} setShowStepDetail={setShowStepDetail} howItWorksSteps={howItWorksSteps} onNavigateLogin={() => setView('login')} onLogin={(role, user) => { setView('login'); setTimeout(() => handleLogin(role, user), 100); }} />;
  }

  if (view === 'login') {
    return <LoginView mascotEmotion={mascotEmotion} onLogin={handleLogin} />;
  }

  if (view === 'teacherDashboard') {
    return <TeacherDashboard currentUser={currentUser} assignments={assignments} onLogout={() => { setUserRole(null); setView('login'); }} onNavigate={setView} getBadge={getBadge} EXAMPLE_TASKS={EXAMPLE_TASKS} />;
  }

  if (view === 'teacherBrowseTasks') {
    return <TeacherBrowseTasks EXAMPLE_TASKS={EXAMPLE_TASKS} onBack={() => setView('teacherDashboard')} onViewDetail={(task) => { setSelectedTaskForDetail(task); setView('teacherTaskDetail'); }} onAssignTask={(task) => { setSelectedTaskForAssignment(task); setView('teacherAssignTask'); }} searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedGrade={selectedGrade} setSelectedGrade={setSelectedGrade} selectedDomain={selectedDomain} setSelectedDomain={setSelectedDomain} showFilters={showFilters} setShowFilters={setShowFilters} collectionView={collectionView} setCollectionView={setCollectionView} />;
  }

  if (view === 'teacherTaskDetail' && selectedTaskForDetail) {
    return <TeacherTaskDetail task={selectedTaskForDetail} onBack={() => setView('teacherBrowseTasks')} onAssign={() => { setSelectedTaskForAssignment(selectedTaskForDetail); setView('teacherAssignTask'); }} />;
  }

  if (view === 'teacherAssignTask') {
    return <TeacherAssignTask selectedTask={selectedTaskForAssignment} setSelectedTask={setSelectedTaskForAssignment} TASKS={TASKS} MOCK_STUDENTS={MOCK_STUDENTS} selectedStudents={selectedStudentsForAssignment} setSelectedStudents={setSelectedStudentsForAssignment} onCreateAssignment={handleCreateAssignment} onBack={() => setView('teacherDashboard')} />;
  }

  if (view === 'teacherReviewAssignments') {
    return <TeacherReviewAssignments assignments={assignments} evaluationData={evaluationData} loadingEvaluations={loadingEvaluations} onRefreshEvaluations={fetchEvaluations} getBadge={getBadge} onSelectStudent={(a) => { setSelectedStudentForDetail(a); setView('studentDetail'); }} onBack={() => setView('teacherDashboard')} EVALUATION_CATEGORIES={EVALUATION_CATEGORIES} />;
  }

  if (view === 'teacherFeedback' && selectedAssignmentForReview) {
    return <TeacherFeedbackView assignment={selectedAssignmentForReview} evaluationData={evaluationData} loadingEvaluations={loadingEvaluations} getBadge={getBadge} onBack={() => setView('teacherReviewAssignments')} EVALUATION_CATEGORIES={EVALUATION_CATEGORIES} />;
  }

  if (view === 'studentDetail' && selectedStudentForDetail) {
    return <StudentDetailView student={selectedStudentForDetail} evaluationData={evaluationData} loadingEvaluations={loadingEvaluations} getBadge={getBadge} onBack={() => setView('teacherReviewAssignments')} onViewFeedback={(s) => { setSelectedAssignmentForReview(s); setView('teacherFeedback'); }} EVALUATION_CATEGORIES={EVALUATION_CATEGORIES} />;
  }

  if (view === 'studentDashboard') {
    return <StudentDashboard currentUser={currentUser} assignments={assignments} getBadge={getBadge} onStartTeaching={startTeachingSession} onViewFeedback={(a) => { setSelectedAssignmentForReview(a); setView('feedback'); }} onBrowseTasks={() => setView('browseTasks')} onLogout={() => { setUserRole(null); setView('login'); }} />;
  }

  if (view === 'browseTasks') {
    return <BrowseTasksStudent currentUser={currentUser} onBack={() => setView('studentDashboard')} onStartTeaching={startTeachingSession} />;
  }

  if (view === 'teaching' && activeAssignment) {
    const taskKey = activeAssignment.taskId.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    const task = TASKS[taskKey];
    return <TeachingSession task={task} messages={messages} input={input} setInput={setInput} loading={loading} onSendMessage={sendMessage} onEditUserMessage={editUserMessage} onCompleteSession={completeSession} onBack={() => setView('studentDashboard')} progress={progress} language={language} setLanguage={setLanguage} getTaskField={getTaskField} />;
  }

  if (view === 'feedback') {
    const assignment = selectedAssignmentForReview || activeAssignment;
    return <FeedbackView assignment={assignment} evaluationData={evaluationData} userRole={userRole} getBadge={getBadge} onFetchEvaluations={fetchEvaluations} onBackToDashboard={() => {
      if (userRole === 'student') setView('studentDashboard');
      else if (userRole === 'teacher') setView('teacherDashboard');
      else if (userRole === 'parent') setView('parentDashboard');
    }} EVALUATION_CATEGORIES={EVALUATION_CATEGORIES} />;
  }

  if (view === 'parentDashboard') {
    return <ParentDashboard currentUser={currentUser} assignments={assignments} getBadge={getBadge} onViewFeedback={(a) => { setSelectedAssignmentForReview(a); setView('feedback'); }} onLogout={() => { setUserRole(null); setView('login'); }} />;
  }

  return null;
};

export default App;
