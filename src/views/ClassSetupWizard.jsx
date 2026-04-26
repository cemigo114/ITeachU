import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const GRADE_OPTIONS = [
  'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
  'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

const SUBJECT_OPTIONS = ['Math', 'ELA', 'Science', 'Social Studies'];

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ClassSetupWizard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('Grade 7');
  const [subject, setSubject] = useState('Math');
  const [students, setStudents] = useState([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [inviteCode, setInviteCode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const addStudent = useCallback(() => {
    const trimmed = newStudentName.trim();
    if (!trimmed) return;
    if (students.includes(trimmed)) return;
    setStudents((prev) => [...prev, trimmed]);
    setNewStudentName('');
  }, [newStudentName, students]);

  const removeStudent = useCallback((name) => {
    setStudents((prev) => prev.filter((s) => s !== name));
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addStudent();
    }
  };

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
          students: students.map((name) => ({ name })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.inviteCode) {
          setInviteCode(data.inviteCode);
        }
        // Small delay so user can see invite code, then navigate
        setTimeout(() => {
          navigate('/assign', { replace: true });
        }, inviteCode ? 0 : 1500);
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

  // Compute step progress
  const step1Done = className.trim().length > 0;
  const step2Done = step1Done && grade && subject;

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
          <div className="flex-1 h-1 rounded-sm bg-border" />
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

          {/* Add students */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-ink-soft uppercase tracking-wide">
                Add students
              </label>
              <span className="text-[11px] text-muted">
                Or import from Google Classroom
              </span>
            </div>
            <div className="border border-border rounded-sm p-3 bg-surface min-h-[80px] flex flex-wrap gap-1.5 items-start">
              {students.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-1.5 bg-white border border-border rounded-full px-2.5 py-1 text-[11px] text-ink-soft"
                >
                  <div className="w-[18px] h-[18px] rounded-full bg-sage-pale flex items-center justify-center text-[9px] text-sage-deep font-medium">
                    {getInitials(name)}
                  </div>
                  {name}
                  <button
                    onClick={() => removeStudent(name)}
                    className="text-muted hover:text-ink text-[10px] ml-0.5"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="+ Add student"
                  className="border-none bg-transparent text-[11px] font-body text-ink-soft placeholder:text-muted focus:outline-none w-24"
                />
                {newStudentName.trim() && (
                  <button
                    onClick={addStudent}
                    className="text-[10px] text-sage font-medium hover:text-sage-deep"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Invite code */}
          {inviteCode && (
            <div className="bg-sage-pale rounded-sm p-4 flex items-center gap-2.5">
              <span className="text-xl">&#128279;</span>
              <div className="flex-1">
                <div className="text-xs font-medium text-sage-deep">
                  Student invitation code: <strong>{inviteCode}</strong>
                </div>
                <div className="text-[11px] text-muted">
                  Share this code with students to join your class
                </div>
              </div>
              <button
                onClick={copyCode}
                className="px-3 py-1.5 text-[11px] border border-border rounded-sm bg-white text-muted hover:border-sage-light hover:text-sage-deep transition-colors"
              >
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-coral">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-sage hover:bg-sage-deep text-white py-3 rounded-sm text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? 'Setting up...' : 'Finish setup \u2014 go to dashboard \u2192'}
          </button>
        </div>
      </div>
    </div>
  );
}
