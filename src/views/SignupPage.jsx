import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

function TeacherIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="16" width="20" height="9" rx="2" className="fill-[--sage-pale] stroke-[--sage-light]" strokeWidth="1"/>
      <circle cx="14" cy="10" r="5" className="fill-[--sage-pale] stroke-[--sage]" strokeWidth="1.5"/>
      <rect x="12" y="3" width="4" height="5" rx="1" className="fill-[--sage]"/>
    </svg>
  );
}

function StudentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="6" y="13" width="16" height="12" rx="2" className="fill-surface stroke-border" strokeWidth="1.3"/>
      <rect x="9" y="13" width="10" height="7" rx="1" className="fill-border"/>
      <path d="M10 8l4-4 4 4" className="stroke-muted" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="12" y="18" width="4" height="7" className="fill-surface"/>
    </svg>
  );
}

function ParentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="11" cy="9" r="4" className="fill-surface stroke-border" strokeWidth="1.3"/>
      <circle cx="19" cy="11" r="3" className="fill-surface stroke-border" strokeWidth="1.3"/>
      <path d="M4 24c0-4 3.1-7 7-7s7 3 7 7" className="stroke-border" strokeWidth="1.3" fill="none"/>
      <path d="M18 17c2.8.5 6 2.8 6 7" className="stroke-border" strokeWidth="1.3" fill="none"/>
    </svg>
  );
}

function CodeInput({ length = 6, color = 'sage', value, onChange }) {
  const inputRefs = useRef([]);

  const handleChange = (index, char) => {
    if (char.length > 1) char = char[0];
    const newValue = value.split('');
    newValue[index] = char.toUpperCase();
    onChange(newValue.join(''));
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    const nextEmpty = Math.min(pasted.length, length - 1);
    inputRefs.current[nextEmpty]?.focus();
  };

  const focusColor = {
    sage: 'focus:border-sage focus:ring-sage/15',
    amber: 'focus:border-amber focus:ring-amber/15',
    sky: 'focus:border-sky focus:ring-sky/15',
  }[color];

  return (
    <div className="flex gap-[7px] justify-center mb-6">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="text"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`w-[46px] h-[54px] border-[1.5px] border-border rounded-sm text-center text-[22px] font-semibold font-body text-ink outline-none transition-all ring-0 focus:ring-[3px] ${focusColor}`}
        />
      ))}
    </div>
  );
}

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [inviteCode, setInviteCode] = useState('');
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

  async function joinClassWithCode(token) {
    if (!inviteCode.trim()) return;
    try {
      await fetch(`${API_BASE_URL}/api/classes/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      });
    } catch (err) {
      console.warn('Class join failed:', err.message);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError('');
    setSubmitting(true);
    try {
      if (selectedRole === 'student' && inviteCode.replace(/\s/g, '').length < 6) {
        setError('Please enter your 6-letter class code');
        setSubmitting(false);
        return;
      }
      const result = await login(credentialResponse.credential, selectedRole, 'signup');
      if (result.existing) {
        navigate('/login', { replace: true });
        return;
      }
      if ((selectedRole === 'student' || selectedRole === 'parent') && inviteCode.trim()) {
        await joinClassWithCode(result.token);
      }
      navigate(getPostLoginRoute(result.user.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  const roleCards = [
    { key: 'teacher', label: 'Teacher', Icon: TeacherIcon, selectedClass: 'border-sage bg-sage-pale shadow-[0_0_0_3px_rgba(74,124,111,0.1)]' },
    { key: 'student', label: 'Student', Icon: StudentIcon, selectedClass: 'border-amber bg-amber-pale shadow-[0_0_0_3px_rgba(212,133,58,0.1)]' },
    { key: 'parent', label: 'Parent', Icon: ParentIcon, selectedClass: 'border-sky bg-sky-pale shadow-[0_0_0_3px_rgba(58,122,184,0.1)]' },
  ];

  return (
    <div className="min-h-screen font-body">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Left panel */}
        <div className="relative bg-ink p-10 md:p-12 flex flex-col justify-center overflow-hidden">
          <div className="absolute -top-20 -left-20 w-[320px] h-[320px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(74,124,111,0.2), transparent 70%)' }} />
          <div className="relative z-10">
            <h2 className="font-display text-[1.9rem] font-light text-white leading-[1.25] tracking-tight mb-4">
              Built for how <em className="italic text-sage-light">classrooms</em> actually work
            </h2>
            <p className="text-[13px] text-white/45 leading-[1.75] font-light mt-4 mb-7">
              Cognality connects teachers, students, and parents around the same evidence — a student's reasoning, in their own words.
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-sage-light flex-shrink-0" />
                Teachers assign tasks & view class insights
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

        {/* Right panel */}
        <div className="bg-white p-10 md:px-10 md:py-12 flex flex-col justify-center max-w-lg mx-auto w-full">
          <h3 className="font-display text-2xl font-medium tracking-tight mb-1">Create your account</h3>
          <p className="text-[13px] text-muted mb-7">Choose your role to get started</p>

          {/* Role picker */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {roleCards.map(({ key, label, Icon, selectedClass }) => (
              <button
                key={key}
                onClick={() => { setSelectedRole(key); setError(''); }}
                className={`border-[1.5px] rounded-[14px] p-4 text-center cursor-pointer transition-all ${
                  selectedRole === key ? selectedClass : 'border-border hover:border-sage-light hover:shadow-soft'
                }`}
              >
                <div className="mb-2 flex justify-center"><Icon /></div>
                <div className="text-xs font-semibold text-ink-soft tracking-tight">{label}</div>
              </button>
            ))}
          </div>

          {/* Teacher fields */}
          {selectedRole === 'teacher' && (
            <div>
              <div className="mb-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed')}
                  text="continue_with"
                  width="100%"
                  size="large"
                  shape="rectangular"
                  theme="outline"
                />
              </div>
              <div className="relative text-center text-[11px] text-muted my-3">
                <span className="bg-white px-3 relative z-10">or</span>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2" />
              </div>
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-ink-soft uppercase tracking-[0.05em] mb-1.5">Full name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Rivera"
                  className="w-full px-3 py-2.5 border-[1.5px] border-border rounded-sm text-[13px] font-body text-ink bg-white outline-none focus:border-sage focus:ring-[3px] focus:ring-sage/10 transition-all" />
              </div>
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-ink-soft uppercase tracking-[0.05em] mb-1.5">School email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.edu"
                  className="w-full px-3 py-2.5 border-[1.5px] border-border rounded-sm text-[13px] font-body text-ink bg-white outline-none focus:border-sage focus:ring-[3px] focus:ring-sage/10 transition-all" />
              </div>
              <button onClick={() => setError('Email signup coming soon. Please use Google sign-in.')}
                className="w-full bg-sage hover:bg-sage-deep text-white py-2.5 rounded-sm text-sm font-medium transition-colors">
                Create teacher account →
              </button>
            </div>
          )}

          {/* Student fields */}
          {selectedRole === 'student' && (
            <div>
              <p className="text-xs text-muted mb-4">Enter the 6-letter code your teacher gave you</p>
              <CodeInput length={6} color="amber" value={inviteCode} onChange={setInviteCode} />
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-ink-soft uppercase tracking-[0.05em] mb-1.5">Your name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alex M."
                  className="w-full px-3 py-2.5 border-[1.5px] border-border rounded-sm text-[13px] font-body text-ink bg-white outline-none focus:border-amber focus:ring-[3px] focus:ring-amber/10 transition-all" />
              </div>
              <div className="mb-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed')}
                  text="continue_with"
                  width="100%"
                  size="large"
                  shape="rectangular"
                  theme="outline"
                />
              </div>
              <button onClick={() => setError('Email signup coming soon. Please use Google sign-in.')}
                className="w-full bg-amber hover:bg-amber-deep text-white py-2.5 rounded-sm text-sm font-medium transition-colors">
                Join class →
              </button>
            </div>
          )}

          {/* Parent fields */}
          {selectedRole === 'parent' && (
            <div>
              <p className="text-xs text-muted mb-4">Enter the code your child's teacher sent home</p>
              <CodeInput length={6} color="sky" value={inviteCode} onChange={setInviteCode} />
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-ink-soft uppercase tracking-[0.05em] mb-1.5">Your name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="J. Martinez"
                  className="w-full px-3 py-2.5 border-[1.5px] border-border rounded-sm text-[13px] font-body text-ink bg-white outline-none focus:border-sky focus:ring-[3px] focus:ring-sky/10 transition-all" />
              </div>
              <div className="mb-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed')}
                  text="continue_with"
                  width="100%"
                  size="large"
                  shape="rectangular"
                  theme="outline"
                />
              </div>
              <button onClick={() => setError('Email signup coming soon. Please use Google sign-in.')}
                className="w-full bg-sky hover:opacity-90 text-white py-2.5 rounded-sm text-sm font-medium transition-colors">
                Access parent view →
              </button>
            </div>
          )}

          {error && <p className="text-xs text-coral mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
}
