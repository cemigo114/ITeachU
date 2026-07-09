import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  function getPostLoginRoute(role) {
    if (role === 'teacher') return '/assign';
    if (role === 'student') return '/student';
    return '/parent';
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError('');
    try {
      const { user } = await login(credentialResponse.credential, null, 'login');
      navigate(getPostLoginRoute(user.role), { replace: true });
    } catch (err) {
      if (err.message?.includes('No account found')) {
        setError('No account found. Please sign up first.');
      } else {
        setError(err.message || 'Login failed');
      }
    }
  }

  return (
    <div className="min-h-screen bg-surface font-body flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg border border-border p-8 shadow-card">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-sage rounded-sm flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 16 16" fill="none" className="w-5 h-5">
              <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5" />
              <path d="M5 8.5 Q8 5 11 8.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-medium text-ink">Welcome back</h1>
          <p className="text-sm text-muted mt-1">Sign in to Cognality</p>
        </div>

        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google sign-in failed')}
          text="signin_with"
          width="100%"
          size="large"
          shape="rectangular"
          theme="outline"
        />

        {error && (
          <p className="text-xs text-coral mt-3">{error}</p>
        )}

        <p className="text-center text-xs text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-sage font-medium hover:text-sage-deep">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
