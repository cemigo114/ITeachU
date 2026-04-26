import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

const ROLES = [
  { key: 'teacher', icon: '\uD83D\uDC69\u200D\uD83C\uDFEB', label: 'Teacher' },
  { key: 'student', icon: '\uD83C\uDF92', label: 'Student' },
  { key: 'parent', icon: '\uD83D\uDC64', label: 'Parent' },
];

const roleCardClasses = {
  teacher: 'border-sage bg-sage-pale',
  student: 'border-amber bg-amber-pale',
  parent: 'border-sky bg-sky-pale',
};

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  function getPostLoginRoute(role) {
    if (role === 'teacher') return '/setup';
    if (role === 'student') return '/student';
    return '/parent';
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError('');
    setSubmitting(true);
    try {
      const user = await login(credentialResponse.credential, selectedRole);
      navigate(getPostLoginRoute(user.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleError() {
    setError('Google sign-in was cancelled or failed. Please try again.');
  }

  async function handleEmailSignup(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please fill in all fields');
      return;
    }
    // For now, email signup just navigates (backend email auth not yet implemented)
    setError('Email signup coming soon. Please use Google sign-in.');
  }

  return (
    <div className="min-h-screen font-body">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Left panel — dark */}
        <div className="relative bg-ink p-10 md:p-12 flex flex-col justify-center overflow-hidden">
          <div
            className="absolute -top-16 -left-16 w-[300px] h-[300px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(74,124,111,0.25), transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <h2 className="font-display text-3xl font-light text-white leading-snug mb-4">
              Built for how <em className="italic text-sage-light">classrooms</em> actually work
            </h2>
            <p className="text-[13px] text-white/50 leading-relaxed mt-4">
              Cognality connects teachers, students, and parents around the same evidence
              &mdash; a student's reasoning, in their own words.
            </p>
            <div className="mt-8 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-sage-light flex-shrink-0" />
                Teachers assign tasks &amp; view class insights
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber flex-shrink-0" />
                Students teach Zippy to show their thinking
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-sky flex-shrink-0" />
                Parents see progress without jargon
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — white */}
        <div className="bg-white p-10 md:p-12 flex flex-col justify-center">
          <h3 className="font-display text-xl font-medium mb-1">Create your account</h3>
          <p className="text-[13px] text-muted mb-8">Choose your role to get started</p>

          {/* Role picker */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {ROLES.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setSelectedRole(key)}
                className={`border-[1.5px] rounded p-4 text-center cursor-pointer transition-all ${
                  selectedRole === key
                    ? roleCardClasses[key]
                    : 'border-border hover:border-sage-light'
                }`}
              >
                <div className="text-[22px] mb-1.5">{icon}</div>
                <div className="text-xs font-medium text-ink-soft">{label}</div>
              </button>
            ))}
          </div>

          {/* Google login */}
          <div className="mb-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="continue_with"
              width="100%"
              size="large"
              shape="rectangular"
              theme="outline"
            />
          </div>

          {/* Divider */}
          <div className="relative text-center text-[11px] text-muted my-3">
            <span className="bg-white px-3 relative z-10">or</span>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSignup} className="space-y-3 mt-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-soft uppercase tracking-wide mb-1">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ms. Rivera"
                className="w-full px-3 py-2.5 border border-border rounded-sm text-[13px] font-body text-ink bg-white focus:outline-none focus:border-sage transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-soft uppercase tracking-wide mb-1">
                School email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="w-full px-3 py-2.5 border border-border rounded-sm text-[13px] font-body text-ink bg-white focus:outline-none focus:border-sage transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-coral py-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-sage hover:bg-sage-deep text-white py-2.5 rounded-sm text-sm font-medium transition-colors disabled:opacity-50"
            >
              {selectedRole === 'teacher' && 'Create teacher account \u2192'}
              {selectedRole === 'student' && 'Join class \u2192'}
              {selectedRole === 'parent' && 'Access parent view \u2192'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
