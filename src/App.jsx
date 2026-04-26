import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './AppRouter';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter basename="/app">
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
