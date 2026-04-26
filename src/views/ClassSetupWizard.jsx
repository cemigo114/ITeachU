import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const GRADE_OPTIONS = [
  'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
  'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

const SUBJECT_OPTIONS = ['Math', 'ELA', 'Science', 'Social Studies'];

export default function ClassSetupWizard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('Grade 7');
  const [subject, setSubject] = useState('Math');
  const [inviteCode, setInviteCode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const copyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback: no clipboard API
    }
  };

  const handleSubmit = async () => {
    if (!className.trim()) {
      setError('Please enter a class name');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: className.trim(),
          grade,
          subject,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.inviteCode) {
          setInviteCode(data.inviteCode);
        }
      } else {
        // If API is not ready yet, just navigate
        console.warn('Class creation API not available, proceeding to dashboard');
        navigate('/assign', { replace: true });
      }
    } catch {
      // API might not exist yet — proceed anyway
      console.warn('Class creation API not reachable, proceeding to dashboard');
      navigate('/assign', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const step1Done = className.trim().length > 0;
  const step2Done = step1Done && grade && subject;
  const step3Done = !!inviteCode;

  return (
    <div className="min-h-screen bg-surface font-body flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-[580px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[11px] text-muted uppercase tracking-wider mb-2">
            Getting started &middot; Step 1 of 2
          </div>
          <h2 className="font-display text-2xl font-normal">Set up your class</h2>
          <p className="text-[13px] text-muted mt-1.5">
            You can always add more students later
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex gap-1.5 mb-8">
          <div className={`flex-1 h-1 rounded-sm ${step1Done ? 'bg-sage' : 'bg-border'}`} />
          <div className={`flex-1 h-1 rounded-sm ${step2Done ? 'bg-sage' : step1Done ? 'bg-sage-light' : 'bg-border'}`} />
          <div className={`flex-1 h-1 rounded-sm ${step3Done ? 'bg-sage' : 'bg-border'}`} />
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-border p-6 space-y-5">
          {/* Class name + grade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink-soft uppercase tracking-wide mb-1">
                Class name
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="7th Grade Math - Period 3"
                className="w-full px-3 py-2.5 border border-border rounded-sm text-[13px] font-body text-ink focus:outline-none focus:border-sage transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-soft uppercase tracking-wide mb-1">
                Grade level
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-sm text-[13px] font-body text-ink focus:outline-none focus:border-sage transition-colors bg-white"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-medium text-ink-soft uppercase tracking-wide mb-1">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-sm text-[13px] font-body text-ink focus:outline-none focus:border-sage transition-colors bg-white"
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Invitation code */}
          <div>
            <label className="block text-[11px] font-medium text-ink-soft uppercase tracking-wide mb-1.5">
              Student invitation code
            </label>
            <div className="bg-sage-pale border border-sage-light/30 rounded-sm p-4">
              {inviteCode ? (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-sage/10 flex items-center justify-center">
                    <span className="text-lg">🔗</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-lg font-semibold text-sage-deep tracking-widest">
                      {inviteCode}
                    </div>
                    <div className="text-[11px] text-muted mt-0.5">
                      Share this code with students to join your class
                    </div>
                  </div>
                  <button
                    onClick={copyCode}
                    className="px-4 py-2 text-xs font-medium border border-sage-light rounded-sm bg-white text-sage-deep hover:bg-sage-pale transition-colors"
                  >
                    {codeCopied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-[13px] text-ink-soft">
                    A unique invitation code will be generated when you create the class.
                  </p>
                  <p className="text-[11px] text-muted mt-1">
                    Share the code with your students so they can join your class after signing up.
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs text-coral">{error}</p>
          )}

          {/* Submit */}
          {inviteCode ? (
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="w-full bg-sage hover:bg-sage-deep text-white py-3 rounded-sm text-sm font-medium transition-colors"
            >
              Go to dashboard →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !className.trim()}
              className="w-full bg-sage hover:bg-sage-deep text-white py-3 rounded-sm text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating class...' : 'Create class & get invitation code →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
