import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * StudentDashboard -- Screen 7 from the design prototype.
 * Top bar with Cognality logo (amber mark), welcome greeting, assignment cards.
 */

// oklch color tokens matching the design
const colors = {
  zippy: 'oklch(60% 0.18 15)',
  zippyDeep: 'oklch(42% 0.15 15)',
  zippyPale: 'oklch(97% 0.03 15)',
  amber: 'oklch(64% 0.13 55)',
  amberDeep: 'oklch(47% 0.12 55)',
  amberPale: 'oklch(97% 0.03 75)',
  sage: 'oklch(49% 0.08 162)',
  sageDeep: 'oklch(35% 0.07 162)',
  sagePale: 'oklch(96% 0.025 162)',
  ink: 'oklch(17% 0.01 170)',
  inkSoft: 'oklch(30% 0.01 170)',
  muted: 'oklch(55% 0.015 170)',
  border: 'oklch(90% 0.012 170)',
  surface: 'oklch(97% 0.007 170)',
  white: '#ffffff',
  studentBg: 'oklch(98.5% 0.008 15)',
};

function CognalityLogo({ markColor }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: markColor }}
      >
        <svg viewBox="0 0 15 15" fill="none" className="w-[15px] h-[15px]">
          <circle cx="7.5" cy="7.5" r="5.5" stroke="white" strokeWidth="1.4" />
          <path d="M4.5 8Q7.5 4.5 10.5 8" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <span className="font-display text-sm font-medium" style={{ letterSpacing: '-0.01em' }}>
        Cognality
      </span>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="10" height="9" rx="1.5" stroke={colors.muted} strokeWidth="1.2" />
      <path d="M4 1v2M8 1v2M1 5h10" stroke={colors.muted} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

function JoinClassCard() {
  const { token } = useAuth();
  const [code, setCode] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  const inputRefs = useRef([]);

  const handleChange = (index, char) => {
    if (char.length > 1) char = char[0];
    const newCode = code.split('').concat(Array(6).fill('')).slice(0, 6);
    newCode[index] = char.toUpperCase();
    const joined = newCode.join('');
    setCode(joined);
    if (char && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(pasted);
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleJoin = async () => {
    if (code.replace(/\s/g, '').length < 6) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/classes/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteCode: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(`Joined ${data.className || 'class'}!`);
        setTimeout(() => { setShowInput(false); setStatus(null); setCode(''); }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Invalid code');
      }
    } catch {
      setStatus('error');
      setMessage('Could not connect to server');
    }
  };

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer transition-all"
        style={{
          background: colors.white,
          border: `1.5px dashed ${colors.border}`,
          color: colors.muted,
          fontSize: '13px',
          fontWeight: 500,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.zippy; e.currentTarget.style.color = colors.zippyDeep; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.muted; }}
      >
        <span style={{ fontSize: '16px' }}>+</span>
        Join another class
      </button>
    );
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: colors.white,
        border: `1.5px solid ${colors.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium" style={{ color: colors.ink }}>
          Enter your class code
        </span>
        <button
          onClick={() => { setShowInput(false); setCode(''); setStatus(null); }}
          className="text-[11px] transition-colors"
          style={{ color: colors.muted }}
        >
          Cancel
        </button>
      </div>
      <div className="flex gap-[6px] justify-center mb-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="text"
            maxLength={1}
            value={code[i] || ''}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className="text-center font-semibold font-body outline-none transition-all"
            style={{
              width: '40px', height: '48px',
              border: `1.5px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '20px',
              color: colors.ink,
            }}
            onFocus={(e) => { e.target.style.borderColor = colors.zippy; e.target.style.boxShadow = `0 0 0 3px oklch(60% 0.18 15 / 0.12)`; }}
            onBlur={(e) => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = 'none'; }}
          />
        ))}
      </div>
      {status === 'success' && (
        <p className="text-center text-[12px] mb-2" style={{ color: colors.sage }}>{message}</p>
      )}
      {status === 'error' && (
        <p className="text-center text-[12px] mb-2" style={{ color: 'oklch(57% 0.12 28)' }}>{message}</p>
      )}
      <button
        onClick={handleJoin}
        disabled={code.replace(/\s/g, '').length < 6}
        className="w-full py-2.5 text-white text-[13px] font-medium transition-colors disabled:opacity-40"
        style={{
          background: colors.zippy,
          borderRadius: '8px',
          border: 'none',
          cursor: code.replace(/\s/g, '').length >= 6 ? 'pointer' : 'default',
        }}
      >
        Join class →
      </button>
    </div>
  );
}

const StudentDashboard = ({
  currentUser,
  assignments,
  getBadge,
  onStartTeaching,
  onViewFeedback,
  onBrowseTasks,
  onLogout,
}) => {
  const studentAssignments = assignments.filter((a) => a.studentId === currentUser.id);
  const pendingAssignments = studentAssignments.filter(
    (a) => a.status === 'assigned' || a.status === 'in_progress'
  );
  const completedAssignments = studentAssignments.filter((a) => a.status === 'completed');
  const firstName = (currentUser?.name ?? 'Student').split(' ')[0];

  return (
    <div className="min-h-screen font-body" style={{ background: colors.studentBg }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3.5"
        style={{ background: colors.white, borderBottom: `1px solid ${colors.border}` }}
      >
        <CognalityLogo markColor={colors.amber} />
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white font-semibold"
            style={{ background: `linear-gradient(135deg, ${colors.zippy}, ${colors.zippyDeep})` }}
          >
            {firstName[0]}{(currentUser?.name ?? '').split(' ').slice(-1)[0]?.[0] || ''}
          </div>
          <span className="text-[13px] font-medium">{currentUser?.name ?? 'Student'}</span>
        </div>
      </div>

      {/* Welcome section */}
      <div className="text-center pt-10 pb-5 px-6">
        <h2
          className="font-display text-2xl font-normal"
          style={{ letterSpacing: '-0.03em', color: colors.ink }}
        >
          Good morning, {firstName}
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: colors.muted }}>
          You have {pendingAssignments.length} assignment{pendingAssignments.length !== 1 ? 's' : ''} waiting
        </p>
      </div>

      {/* Join another class */}
      <div className="px-6 mb-4 max-w-lg mx-auto">
        <JoinClassCard />
      </div>

      {/* Active assignments */}
      <div className="px-6">
        {pendingAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="rounded-[20px] overflow-hidden mb-4"
            style={{
              background: colors.white,
              border: `1.5px solid ${colors.border}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{
                background: `linear-gradient(135deg, ${colors.zippy} 0%, ${colors.zippyDeep} 100%)`,
              }}
            >
              <h3
                className="font-display text-[14.5px] font-medium text-white"
                style={{ letterSpacing: '-0.02em' }}
              >
                {assignment.taskTitle || 'Help Zippy understand this topic'}
              </h3>
              <span
                className="text-[10px] font-semibold text-white px-2.5 py-1 rounded-[5px]"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                {assignment.status === 'in_progress' ? 'In Progress' : 'New'}
              </span>
            </div>

            {/* Card body */}
            <div className="p-5">
              <div className="flex items-center gap-1.5 text-[11px] mb-2" style={{ color: colors.muted }}>
                <CalendarIcon />
                Due April 30 · From Ms. Rivera
              </div>
              <div
                className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-[5px] mb-2.5"
                style={{
                  color: colors.zippyDeep,
                  background: colors.zippyPale,
                }}
              >
                {assignment.standard || '7.RP.A.2'} — Proportional Relationships
              </div>
              <p
                className="text-[12.5px] leading-[1.7] mb-4"
                style={{ color: colors.inkSoft }}
              >
                Zippy is learning about this topic but keeps getting confused. Your job is to explain it step by step. The better you explain it, the more Zippy understands — and the better we can understand how <em>you</em> think.
              </p>
              <div className="flex gap-2">
                <button
                  className="px-4 py-[7px] rounded-lg text-xs font-medium text-white transition-all hover:brightness-110"
                  style={{
                    background: `linear-gradient(135deg, ${colors.zippy}, ${colors.zippyDeep})`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    letterSpacing: '-0.01em',
                  }}
                  onClick={() => onStartTeaching(assignment)}
                >
                  {assignment.status === 'in_progress' ? 'Continue task \u2192' : 'Start task \u2192'}
                </button>
                <button
                  className="px-4 py-[7px] rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: 'transparent',
                    color: colors.muted,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  Preview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completed section */}
      {completedAssignments.length > 0 && (
        <div className="px-6 pt-3">
          <div
            className="text-[10px] font-bold tracking-[0.07em] mb-2"
            style={{ color: colors.muted }}
          >
            COMPLETED
          </div>
          {completedAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-[20px] overflow-hidden mb-4 opacity-65"
              style={{
                background: colors.white,
                border: `1.5px solid ${colors.border}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {/* Completed card header (sage gradient) */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{
                  background: `linear-gradient(135deg, ${colors.sage}, ${colors.sageDeep})`,
                }}
              >
                <h3
                  className="font-display text-[14.5px] font-medium text-white"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {assignment.taskTitle || 'Completed task'}
                </h3>
                <span
                  className="text-[10px] font-semibold text-white px-2.5 py-1 rounded-[5px]"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  Done · {assignment.completedDate || 'Apr 21'}
                </span>
              </div>

              {/* Completed card body */}
              <div className="p-5">
                <div
                  className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-[5px] mb-2.5"
                  style={{
                    color: colors.sageDeep,
                    background: colors.sagePale,
                  }}
                >
                  {assignment.standard || '7.NS.A.1'}
                </div>
                <p
                  className="text-[11.5px] leading-[1.7] mb-3"
                  style={{ color: colors.inkSoft }}
                >
                  You explained the topic to Zippy -- great work!
                </p>
                <button
                  className="px-4 py-[7px] rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: 'transparent',
                    color: colors.muted,
                    border: `1px solid ${colors.border}`,
                  }}
                  onClick={() => onViewFeedback(assignment)}
                >
                  Review your work &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
