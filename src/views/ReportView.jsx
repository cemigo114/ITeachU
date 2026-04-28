import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STUDENT_ROWS = [
  { initials: 'AM', name: 'Alex M.', reasoning: 88, label: '88% reasoning', status: 'Strong', statusType: 'complete' },
  { initials: 'PL', name: 'Priya L.', reasoning: 74, label: '74%', status: 'Proficient', statusType: 'complete' },
  { initials: 'OW', name: 'Omar W.', reasoning: 52, label: '52%', status: 'Developing', statusType: 'partial', amber: true },
  { initials: 'CJ', name: 'Casey J.', reasoning: 48, label: '48%', status: 'Developing', statusType: 'partial', amber: true },
  { initials: 'JT', name: 'Jamie T.', reasoning: 0, label: 'Not started', status: 'Pending', statusType: 'pending', pending: true },
];

function StatusBadge({ status, type }) {
  const styles = {
    complete: { background: '#e8f2ef', color: '#2d5249' },
    partial: { background: '#fdf3e7', color: '#a05f20' },
    pending: { background: '#f5f8f6', color: '#7a8c85', border: '1px solid #d8e4e0' },
  };

  const s = styles[type] || styles.complete;

  return (
    <span
      style={{
        fontSize: '10.5px',
        padding: '3px 9px',
        borderRadius: '5px',
        fontWeight: 600,
        ...s,
      }}
    >
      {status}
    </span>
  );
}

export default function ReportView() {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState('unit_rate');

  return (
    <div>
      {/* Topbar actions row — inside the content area to avoid modifying AppShell */}
      <div
        className="bg-white border-b border-border flex items-center justify-end gap-2"
        style={{ padding: '0.5rem 1.5rem' }}
      >
        <select
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
          className="bg-white text-ink font-body"
          style={{
            width: 'auto',
            fontSize: '12px',
            padding: '6px 10px',
            border: '1.5px solid #d8e4e0',
            borderRadius: '8px',
          }}
        >
          <option value="unit_rate">Unit Rate &mdash; 7.RP.A.2 (Apr 28)</option>
        </select>
        <button
          className="text-muted font-medium transition-colors flex items-center gap-1.5"
          style={{
            fontSize: '11px',
            background: 'transparent',
            border: '1px solid #d8e4e0',
            borderRadius: '8px',
            padding: '7px 16px',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v7M2 5.5l3.5 3.5L9 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 9.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Export
        </button>
      </div>

      {/* Main content */}
      <div style={{ padding: '1.5rem' }}>
        {/* Metric cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '1.5rem',
          }}
        >
          {/* Completed */}
          <div
            className="bg-white relative overflow-hidden"
            style={{
              border: '1.5px solid #d8e4e0',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <div
              className="text-muted font-semibold uppercase"
              style={{ fontSize: '10px', letterSpacing: '0.06em', marginBottom: '8px' }}
            >
              Completed
            </div>
            <div
              className="font-display text-ink"
              style={{ fontSize: '2.25rem', fontWeight: 500, lineHeight: 1, letterSpacing: '-0.03em' }}
            >
              6<span className="text-muted" style={{ fontSize: '1.1rem', fontWeight: 300 }}>/8</span>
            </div>
            <div className="text-muted" style={{ fontSize: '11px', marginTop: '6px' }}>
              2 students pending
            </div>
            {/* Bottom accent bar */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #4a7c6f, #6b9e8f)',
              }}
            />
          </div>

          {/* Class avg reasoning */}
          <div
            className="bg-white relative overflow-hidden"
            style={{
              border: '1.5px solid #d8e4e0',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <div
              className="text-muted font-semibold uppercase"
              style={{ fontSize: '10px', letterSpacing: '0.06em', marginBottom: '8px' }}
            >
              Class avg. reasoning
            </div>
            <div
              className="font-display text-sage"
              style={{ fontSize: '2.25rem', fontWeight: 500, lineHeight: 1, letterSpacing: '-0.03em' }}
            >
              72<span style={{ fontSize: '1rem', fontWeight: 300 }}>%</span>
            </div>
            <div className="text-muted" style={{ fontSize: '11px', marginTop: '6px' }}>
              <span className="text-sage font-medium" style={{ fontSize: '11px' }}>&uarr; 8 pts</span>{' '}
              vs last task
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #4a7c6f, #6b9e8f)',
              }}
            />
          </div>

          {/* Most common gap */}
          <div
            className="bg-white relative overflow-hidden"
            style={{
              border: '1.5px solid #d8e4e0',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <div
              className="text-muted font-semibold uppercase"
              style={{ fontSize: '10px', letterSpacing: '0.06em', marginBottom: '8px' }}
            >
              Most common gap
            </div>
            <div
              className="font-display text-ink"
              style={{
                fontSize: '1.05rem',
                fontWeight: 500,
                lineHeight: 1.3,
                paddingTop: '6px',
                letterSpacing: '-0.03em',
              }}
            >
              Unit &divide;<br />direction
            </div>
            <div className="text-muted" style={{ fontSize: '11px', marginTop: '6px' }}>
              4 of 6 students
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #a05f20, #d4853a)',
              }}
            />
          </div>
        </div>

        {/* AI class summary */}
        <div
          className="relative overflow-hidden"
          style={{
            background: 'oklch(14% 0.018 170)',
            borderRadius: '8px',
            padding: '1rem 1.125rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Glow effect */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '-20px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, oklch(49% 0.08 162 / 0.3), transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            className="relative"
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#6b9e8f',
              marginBottom: '6px',
              textTransform: 'uppercase',
            }}
          >
            AI class summary
          </div>
          <div
            className="relative"
            style={{
              fontSize: '12.5px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7,
              fontWeight: 300,
            }}
          >
            Most students understand that unit rate involves dividing, but{' '}
            <strong style={{ color: 'white', fontWeight: 500 }}>4 of 6</strong> struggle to
            explain <em>which</em> quantity to divide by which. This suggests a procedural
            understanding without conceptual grounding in the meaning of the ratio&rsquo;s direction.
          </div>
        </div>

        {/* Individual students heading */}
        <h3
          className="font-display text-ink"
          style={{
            fontSize: '1rem',
            fontWeight: 500,
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
          }}
        >
          Individual students{' '}
          <span className="text-muted" style={{ fontSize: '11px', fontWeight: 400 }}>
            &mdash; click any row to review
          </span>
        </h3>

        {/* Student rows */}
        {STUDENT_ROWS.map((student) => (
          <div
            key={student.initials}
            onClick={() => navigate('/report/student')}
            className="cursor-pointer transition-all bg-white"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              border: '1.5px solid #d8e4e0',
              borderRadius: '8px',
              marginBottom: '7px',
              opacity: student.pending ? 0.55 : 1,
              pointerEvents: student.pending ? 'none' : 'auto',
            }}
          >
            {/* Avatar */}
            <div
              className="flex items-center justify-center font-semibold flex-shrink-0"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: student.pending ? '#f5f8f6' : '#e8f2ef',
                color: student.pending ? '#7a8c85' : '#2d5249',
                fontSize: '11px',
                letterSpacing: 0,
              }}
            >
              {student.initials}
            </div>

            {/* Name */}
            <div
              className={student.pending ? 'text-muted' : 'text-ink'}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                flex: 1,
                letterSpacing: '-0.01em',
              }}
            >
              {student.name}
            </div>

            {/* Progress bar */}
            <div style={{ flex: 1, maxWidth: '110px' }}>
              <div
                style={{
                  height: '6px',
                  background: '#d8e4e0',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: '3px',
                    width: `${student.reasoning}%`,
                    background: student.amber
                      ? 'linear-gradient(90deg, #a05f20, #d4853a)'
                      : 'linear-gradient(90deg, #4a7c6f, #6b9e8f)',
                    transition: 'width 0.6s cubic-bezier(0.22,0.61,0.36,1)',
                  }}
                />
              </div>
              <div className="text-muted" style={{ fontSize: '10px', marginTop: '3px' }}>
                {student.label}
              </div>
            </div>

            {/* Status badge */}
            <StatusBadge status={student.status} type={student.statusType} />
          </div>
        ))}
      </div>
    </div>
  );
}
