import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { AppStateProvider, useAppState } from './contexts/AppStateContext';
import AppRouter from './AppRouter';
import Toast from './components/ui/Toast';
import ConfirmModal from './components/ui/ConfirmModal';

function AppToast() {
  const { toast, dismissToast } = useAppState();
  return <Toast message={toast.message} visible={toast.visible} onDismiss={dismissToast} />;
}

function AppConfirmModal() {
  const { confirmModal, dismissConfirmModal } = useAppState();
  return (
    <ConfirmModal
      show={confirmModal.show}
      title={confirmModal.title}
      message={confirmModal.message}
      onConfirm={confirmModal.onConfirm}
      onCancel={dismissConfirmModal}
    />
  );
}

function AppInner() {
  return (
    <AppStateProvider>
      <AppRouter />
      <AppToast />
      <AppConfirmModal />
    </AppStateProvider>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter basename="/app">
          <AppInner />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
