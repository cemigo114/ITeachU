import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';

// Public views
import LandingPage from './views/LandingPage.new';
import SignupPage from './views/SignupPage';
import LoginPage from './views/LoginPage';

// Protected views — teacher
import ClassSetupWizard from './views/ClassSetupWizard';
import AssignView from './views/AssignView';
import ReportView from './views/ReportView';
import RecommendationsView from './views/RecommendationsView';

// Protected views — student
import StudentDashboard from './views/StudentDashboard';
import TeachingSessionWrapper from './views/TeachingSessionWrapper';
import StudentReviewView from './views/StudentReviewView';

// Protected views — parent
import ParentDashboard from './views/ParentDashboard';

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes with AppShell layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/setup" element={<ClassSetupWizard />} />
        <Route path="/assign" element={<AssignView />} />
        <Route path="/report" element={<ReportView />} />
        <Route path="/recommendations" element={<RecommendationsView />} />
        <Route path="/student" element={<StudentDashboardWrapper />} />
        <Route path="/review/:taskId" element={<StudentReviewView />} />
        <Route path="/parent" element={<ParentDashboardWrapper />} />
      </Route>

      {/* Teaching session — full-screen, outside AppShell */}
      <Route
        path="/teach/:taskId"
        element={
          <ProtectedRoute>
            <TeachingSessionWrapper />
          </ProtectedRoute>
        }
      />

      {/* Catch-all — redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Wrapper to pass stub props to existing StudentDashboard
 * until it is refactored to fetch its own data.
 */
function StudentDashboardWrapper() {
  const stubProps = {
    currentUser: null, // will use AuthContext internally later
    assignments: [],
    getBadge: () => ({ name: 'Getting Started', icon: '\uD83C\uDF31', color: 'bg-neutral-500' }),
    onStartTeaching: () => {},
    onViewFeedback: () => {},
    onBrowseTasks: () => {},
    onLogout: () => {},
  };

  return <StudentDashboard {...stubProps} />;
}

/**
 * Wrapper to pass stub props to existing ParentDashboard
 * until it is refactored to fetch its own data.
 */
function ParentDashboardWrapper() {
  const stubProps = {
    currentUser: null,
    assignments: [],
    getBadge: () => ({ name: 'Getting Started', icon: '\uD83C\uDF31', color: 'bg-neutral-500' }),
    onViewFeedback: () => {},
    onLogout: () => {},
  };

  return <ParentDashboard {...stubProps} />;
}
