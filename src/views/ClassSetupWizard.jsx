import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const GRADE_OPTIONS = [
  'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
  'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

const SUBJECT_OPTIONS = ['Math', 'ELA', 'Science', 'Social Studies'];

const INITIAL_STUDENTS = [
  { initials: 'AM', name: 'Alex M.' },
  { initials: 'JT', name: 'Jamie T.' },
  { initials: 'PL', name: 'Priya L.' },
  { initials: 'OW', name: 'Omar W.' },
  { initials: 'CJ', name: 'Casey J.' },
  { initials: 'RN', name: 'Rohan N.' },
  { initials: 'ZB', name: 'Zoe B.' },
  { initials: 'DK', name: 'Danny K.' },
];

export default function ClassSetupWizard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [className, setClassName] = useState('7th Grade Math \u2014 Period 3');
  const [grade, setGrade] = useState('Grade 7');
  const [subject, setSubject] = useState('Math');
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [inviteCode] = useState('ZPPY42');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const copyCode = async () => {
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
        navigate('/assign', { replace: true });
      } else {
        console.warn('Class creation API not available, proceeding to dashboard');
        navigate('/assign', { replace: true });
      }
    } catch {
      console.warn('Class creation API not reachable, proceeding to dashboard');
      navigate('/assign', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const step1Done = className.trim().length > 0;
  const step2Done = step1Done && grade && subject;

  return (
    <div className="min-h-screen bg-surface font-body flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-[580px]" style={{ padding: '2.75rem' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="text-muted mb-2 font-semibold uppercase"
            style={{ fontSize: '10px', letterSpacing: '0.08em' }}
          >
            Getting started &middot; Step 1 of 2
          </div>
          <h2
            className="font-display font-normal"
            style={{ fontSize: '1.6rem', letterSpacing: '-0.03em' }}
          >
            Set up your class
          </h2>
          <p className="text-muted mt-1.5" style={{ fontSize: '13px' }}>
            You can always add more students later
          </p>
        </div>

        {/* Progress steps — 3 bars: done/current/pending */}
        <div className="flex gap-1.5 mb-8">
          <div
            className="flex-1 rounded-sm bg-sage"
            style={{ height: '3px' }}
          />
          <div
            className="flex-1 rounded-sm bg-sage-light"
            style={{ height: '3px' }}
          />
          <div
            className="flex-1 rounded-sm bg-border"
            style={{ height: '3px' }}
          />
        </div>

        {/* Class name + grade — 2 col grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label
              className="block text-ink-soft font-semibold uppercase mb-1"
              style={{ fontSize: '11px', letterSpacing: '0.05em' }}
            >
              Class name
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full bg-white text-ink font-body focus:outline-none transition-colors"
              style={{
                padding: '9px 12px',
                border: '1.5px solid',
                borderColor: '#d8e4e0',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4a7c6f';
                e.target.style.boxShadow = '0 0 0 3px oklch(49% 0.08 162 / 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d8e4e0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <label
              className="block text-ink-soft font-semibold uppercase mb-1"
              style={{ fontSize: '11px', letterSpacing: '0.05em' }}
            >
              Grade level
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-white text-ink font-body focus:outline-none transition-colors"
              style={{
                padding: '9px 12px',
                border: '1.5px solid #d8e4e0',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label
            className="block text-ink-soft font-semibold uppercase mb-1"
            style={{ fontSize: '11px', letterSpacing: '0.05em' }}
          >
            Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-white text-ink font-body focus:outline-none transition-colors"
            style={{
              padding: '9px 12px',
              border: '1.5px solid #d8e4e0',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Add students */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label
              className="text-ink-soft font-semibold uppercase"
              style={{ fontSize: '11px', letterSpacing: '0.05em' }}
            >
              Add students
            </label>
            <span className="text-muted" style={{ fontSize: '11px' }}>
              Or import from Google Classroom
            </span>
          </div>
          <div
            className="flex flex-wrap gap-1.5 bg-surface"
            style={{
              padding: '1rem',
              border: '1.5px solid #d8e4e0',
              borderRadius: '8px',
              minHeight: '80px',
            }}
          >
            {students.map((s) => (
              <div
                key={s.initials}
                className="flex items-center gap-1.5 bg-white text-ink-soft"
                style={{
                  border: '1px solid #d8e4e0',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 400,
                }}
              >
                <div
                  className="bg-sage-pale text-sage-deep flex items-center justify-center font-semibold"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    fontSize: '9px',
                  }}
                >
                  {s.initials}
                </div>
                {s.name}
              </div>
            ))}
            {/* Dashed "+ Add" chip */}
            <div
              className="flex items-center text-muted cursor-pointer"
              style={{
                border: '1px dashed #d8e4e0',
                borderRadius: '20px',
                padding: '4px 10px',
                fontSize: '11.5px',
              }}
            >
              + Add
            </div>
          </div>
        </div>

        {/* Invitation code box */}
        <div
          className="flex items-center"
          style={{
            marginTop: '1.25rem',
            padding: '1rem 1.125rem',
            background: '#e8f2ef',
            borderRadius: '8px',
            gap: '10px',
            border: '1.5px solid oklch(62% 0.08 162 / 0.3)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2L12 8h6l-5 3.6 1.9 6L10 14l-4.9 3.6L7 11.6 2 8h6z"
              stroke="#4a7c6f"
              strokeWidth="1.3"
              fill="none"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <div className="text-sage-deep font-semibold" style={{ fontSize: '12px' }}>
              Student invitation code:{' '}
              <strong style={{ fontSize: '14px', letterSpacing: '0.05em' }}>
                {inviteCode}
              </strong>
            </div>
            <div className="text-muted" style={{ fontSize: '11px', marginTop: '1px' }}>
              Share this with students to join your class
            </div>
          </div>
          <button
            onClick={copyCode}
            className="text-muted font-medium transition-colors"
            style={{
              marginLeft: 'auto',
              fontSize: '11px',
              background: 'transparent',
              border: '1px solid #d8e4e0',
              borderRadius: '8px',
              padding: '7px 16px',
              cursor: 'pointer',
            }}
          >
            {codeCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {error && (
          <p className="text-xs text-coral mt-2">{error}</p>
        )}

        {/* Finish setup button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !className.trim()}
          className="w-full text-white font-medium transition-all disabled:opacity-50"
          style={{
            marginTop: '1.25rem',
            padding: '11px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #4a7c6f 0%, #2d5249 100%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          {submitting ? 'Setting up...' : 'Finish setup \u2014 go to dashboard \u2192'}
        </button>
      </div>
    </div>
  );
}
