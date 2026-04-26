import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import { useAppState } from './contexts/AppStateContext';
import { useAuth } from './contexts/AuthContext';

import LandingPage from './views/LandingPage.new';
import SignupPage from './views/SignupPage';
import LoginPage from './views/LoginPage';
import ClassSetupWizard from './views/ClassSetupWizard';
import TeacherDashboard from './views/TeacherDashboard';
import TeacherBrowseTasks from './views/TeacherBrowseTasks';
import TeacherTaskDetail from './views/TeacherTaskDetail';
import TeacherAssignTask from './views/TeacherAssignTask';
import TeacherReviewAssignments from './views/TeacherReviewAssignments';
import TeacherFeedbackView from './views/TeacherFeedbackView';
import StudentDetailView from './views/StudentDetailView';
import StudentDashboard from './views/StudentDashboard';
import ParentDashboard from './views/ParentDashboard';
import FeedbackView from './views/FeedbackView';
import TeachingSessionWrapper from './views/TeachingSessionWrapper';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/setup" element={<ClassSetupWizard />} />
        <Route path="/dashboard" element={<TeacherDashboardWired />} />
        <Route path="/assign" element={<BrowseTasksWired />} />
        <Route path="/assign/detail" element={<TaskDetailWired />} />
        <Route path="/assign/create" element={<AssignTaskWired />} />
        <Route path="/report" element={<ReviewAssignmentsWired />} />
        <Route path="/report/student" element={<StudentDetailWired />} />
        <Route path="/report/feedback" element={<FeedbackWired />} />
        <Route path="/student" element={<StudentDashboardWired />} />
        <Route path="/feedback" element={<StudentFeedbackWired />} />
        <Route path="/parent" element={<ParentDashboardWired />} />
      </Route>

      <Route path="/teach/:taskId" element={<ProtectedRoute><TeachingSessionWrapper /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function TeacherDashboardWired() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assignments, getBadge, EXAMPLE_TASKS } = useAppState();
  return (
    <TeacherDashboard
      currentUser={user}
      assignments={assignments}
      onLogout={() => navigate('/')}
      onNavigate={(view) => {
        const map = { teacherBrowseTasks: '/assign', teacherReviewAssignments: '/report' };
        navigate(map[view] || '/dashboard');
      }}
      getBadge={getBadge}
      EXAMPLE_TASKS={EXAMPLE_TASKS}
    />
  );
}

function BrowseTasksWired() {
  const navigate = useNavigate();
  const s = useAppState();
  return (
    <TeacherBrowseTasks
      EXAMPLE_TASKS={s.EXAMPLE_TASKS}
      onBack={() => navigate('/dashboard')}
      onViewDetail={(task) => { s.setSelectedTaskForDetail(task); navigate('/assign/detail'); }}
      onAssignTask={(task) => { s.setSelectedTaskForAssignment(task); navigate('/assign/create'); }}
      searchQuery={s.searchQuery} setSearchQuery={s.setSearchQuery}
      selectedGrade={s.selectedGrade} setSelectedGrade={s.setSelectedGrade}
      selectedDomain={s.selectedDomain} setSelectedDomain={s.setSelectedDomain}
      showFilters={s.showFilters} setShowFilters={s.setShowFilters}
      collectionView={s.collectionView} setCollectionView={s.setCollectionView}
    />
  );
}

function TaskDetailWired() {
  const navigate = useNavigate();
  const { selectedTaskForDetail, setSelectedTaskForAssignment } = useAppState();
  if (!selectedTaskForDetail) return <Navigate to="/assign" replace />;
  return (
    <TeacherTaskDetail
      task={selectedTaskForDetail}
      onBack={() => navigate('/assign')}
      onAssign={() => { setSelectedTaskForAssignment(selectedTaskForDetail); navigate('/assign/create'); }}
    />
  );
}

function AssignTaskWired() {
  const navigate = useNavigate();
  const s = useAppState();
  return (
    <TeacherAssignTask
      selectedTask={s.selectedTaskForAssignment}
      setSelectedTask={s.setSelectedTaskForAssignment}
      TASKS={s.TASKS}
      MOCK_STUDENTS={s.MOCK_STUDENTS}
      selectedStudents={s.selectedStudentsForAssignment}
      setSelectedStudents={s.setSelectedStudentsForAssignment}
      onCreateAssignment={s.handleCreateAssignment}
      onBack={() => navigate('/assign')}
    />
  );
}

function ReviewAssignmentsWired() {
  const navigate = useNavigate();
  const s = useAppState();
  return (
    <TeacherReviewAssignments
      assignments={s.assignments}
      evaluationData={s.evaluationData}
      loadingEvaluations={s.loadingEvaluations}
      onRefreshEvaluations={s.fetchEvaluations}
      getBadge={s.getBadge}
      onSelectStudent={(a) => { s.setSelectedStudentForDetail(a); navigate('/report/student'); }}
      onBack={() => navigate('/dashboard')}
      EVALUATION_CATEGORIES={s.EVALUATION_CATEGORIES}
    />
  );
}

function StudentDetailWired() {
  const navigate = useNavigate();
  const s = useAppState();
  if (!s.selectedStudentForDetail) return <Navigate to="/report" replace />;
  return (
    <StudentDetailView
      student={s.selectedStudentForDetail}
      evaluationData={s.evaluationData}
      loadingEvaluations={s.loadingEvaluations}
      getBadge={s.getBadge}
      onBack={() => navigate('/report')}
      onViewFeedback={(st) => { s.setSelectedAssignmentForReview(st); navigate('/report/feedback'); }}
      EVALUATION_CATEGORIES={s.EVALUATION_CATEGORIES}
    />
  );
}

function FeedbackWired() {
  const navigate = useNavigate();
  const s = useAppState();
  if (!s.selectedAssignmentForReview) return <Navigate to="/report" replace />;
  return (
    <TeacherFeedbackView
      assignment={s.selectedAssignmentForReview}
      evaluationData={s.evaluationData}
      loadingEvaluations={s.loadingEvaluations}
      getBadge={s.getBadge}
      onBack={() => navigate('/report')}
      EVALUATION_CATEGORIES={s.EVALUATION_CATEGORIES}
    />
  );
}

function StudentDashboardWired() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const s = useAppState();
  return (
    <StudentDashboard
      currentUser={user || { name: 'Student', id: 1 }}
      assignments={s.assignments}
      getBadge={s.getBadge}
      onStartTeaching={(assignment) => navigate(`/teach/${assignment.taskId}`)}
      onViewFeedback={(a) => { s.setSelectedAssignmentForReview(a); navigate('/feedback'); }}
      onBrowseTasks={() => navigate('/assign')}
      onLogout={() => navigate('/')}
    />
  );
}

function StudentFeedbackWired() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const s = useAppState();
  return (
    <FeedbackView
      assignment={s.selectedAssignmentForReview}
      evaluationData={s.evaluationData}
      userRole={user?.role || 'student'}
      getBadge={s.getBadge}
      onFetchEvaluations={s.fetchEvaluations}
      onBackToDashboard={() => navigate('/student')}
      EVALUATION_CATEGORIES={s.EVALUATION_CATEGORIES}
    />
  );
}

function ParentDashboardWired() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const s = useAppState();
  return (
    <ParentDashboard
      currentUser={user || { name: 'Parent', id: 'parent_1', childId: 1 }}
      assignments={s.assignments}
      getBadge={s.getBadge}
      onViewFeedback={(a) => { s.setSelectedAssignmentForReview(a); navigate('/feedback'); }}
      onLogout={() => navigate('/')}
    />
  );
}
