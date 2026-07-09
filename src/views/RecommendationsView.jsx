import React from 'react';
import { useNavigate } from 'react-router-dom';

const GROUPS = [
  {
    id: 'a',
    title: 'Group A \u2014 Ratio direction confusion',
    tag: 'Misconception',
    tagStyle: { background: '#fbeee9', color: '#c4604a' },
    borderColor: '#c4604a',
    buttonLabel: 'Assign targeted task \u2192',
    students: [
      { initials: 'OW', name: 'Omar W.' },
      { initials: 'CJ', name: 'Casey J.' },
      { initials: 'DK', name: 'Danny K.' },
      { initials: 'RN', name: 'Rohan N.' },
    ],
    rootCause:
      'These students can perform the division but consistently invert the ratio. When explaining to Zippy, they said "you just divide the two numbers" without specifying direction \u2014 suggesting memorized procedure without conceptual grounding.',
    rootCauseLabel: 'Where thinking breaks:',
    recommendation:
      'Re-teach with real-world context where the wrong ratio direction produces a nonsensical answer \u2014 this forces conceptual reasoning over procedure.',
  },
  {
    id: 'b',
    title: 'Group B \u2014 Procedural without justification',
    tag: 'Cognitive gap',
    tagStyle: { background: '#fdf3e7', color: '#a05f20' },
    borderColor: '#d4853a',
    buttonLabel: 'Assign stretch task \u2192',
    students: [
      { initials: 'ZB', name: 'Zoe B.' },
      { initials: 'JT', name: 'Jamie T.' },
    ],
    rootCause:
      'These students get correct answers but struggle to explain their reasoning beyond "I just know." Their explanations are brief and circular. This is a communication challenge, not a content gap.',
    rootCauseLabel: 'Where thinking breaks:',
    recommendation:
      'Assign tasks requiring multi-step verbal justification. Focus on sentence starters: "I know this because\u2026" and "This means that\u2026" Pair with a Group A student for peer explanation practice.',
  },
  {
    id: 'c',
    title: 'Group C \u2014 Strong conceptual understanding',
    tag: 'Extend',
    tagStyle: { background: '#e8f2ef', color: '#2d5249' },
    borderColor: '#4a7c6f',
    buttonLabel: 'Assign extension \u2192',
    students: [
      { initials: 'AM', name: 'Alex M.' },
      { initials: 'PL', name: 'Priya L.' },
    ],
    rootCause:
      "Both students gave multi-step explanations, used real-world analogies unprompted, and self-corrected Zippy's intentional errors. They are ready for more complex ratio work.",
    rootCauseLabel: 'Evidence of strength:',
    recommendation:
      'Move to proportional reasoning in multi-step word problems (7.RP.A.3). Consider using these students as near-peer tutors for Group A.',
  },
];

function TargetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="flex-shrink-0"
      style={{ marginTop: '1px' }}
    >
      <circle cx="7" cy="7" r="6" stroke="#4a7c6f" strokeWidth="1.3" />
      <circle cx="7" cy="7" r="3" stroke="#4a7c6f" strokeWidth="1.3" />
      <circle cx="7" cy="7" r="1" fill="#4a7c6f" />
    </svg>
  );
}

export default function RecommendationsView() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Topbar actions row */}
      <div
        className="bg-white border-b border-border flex items-center justify-end"
        style={{ padding: '0.5rem 1.5rem' }}
      >
        <span className="text-muted" style={{ fontSize: '11px' }}>
          Based on: Unit Rate &middot; Apr 28
        </span>
      </div>

      {/* Main content */}
      <div style={{ padding: '1.5rem' }}>
        {/* Intro paragraph */}
        <p
          className="text-muted"
          style={{
            fontSize: '12.5px',
            marginBottom: '1.5rem',
            lineHeight: 1.7,
          }}
        >
          Students have been grouped by the nature of their reasoning gaps. Each
          group includes the likely root cause and a recommended instructional
          next step.
        </p>

        {/* Group cards */}
        {GROUPS.map((group) => (
          <div
            key={group.id}
            className="bg-white transition-shadow"
            style={{
              border: '1.5px solid #d8e4e0',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '12px',
              borderLeftWidth: '4px',
              borderLeftColor: group.borderColor,
            }}
          >
            {/* Header: title + tag + button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div>
                <div
                  className="text-ink"
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '4px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {group.title}
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '3px 9px',
                    borderRadius: '5px',
                    fontWeight: 600,
                    ...group.tagStyle,
                  }}
                >
                  {group.tag}
                </span>
              </div>
              <button
                onClick={() => navigate('/assign')}
                className="text-muted font-medium transition-colors"
                style={{
                  fontSize: '11px',
                  background: 'transparent',
                  border: '1px solid #d8e4e0',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                {group.buttonLabel}
              </button>
            </div>

            {/* Student chips */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {group.students.map((s) => (
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
                    className="flex items-center justify-center font-semibold"
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#e8f2ef',
                      color: '#2d5249',
                      fontSize: '9px',
                    }}
                  >
                    {s.initials}
                  </div>
                  {s.name}
                </div>
              ))}
            </div>

            {/* Root cause */}
            <div
              className="text-muted"
              style={{
                fontSize: '12px',
                background: '#f5f8f6',
                borderLeft: '3px solid #d8e4e0',
                padding: '10px 12px',
                borderRadius: '0 8px 8px 0',
                marginBottom: '10px',
                lineHeight: 1.65,
              }}
            >
              <strong className="text-ink-soft" style={{ fontWeight: 600 }}>
                {group.rootCauseLabel}
              </strong>{' '}
              {group.rootCause}
            </div>

            {/* Recommended next step */}
            <div
              className="text-sage-deep"
              style={{
                fontSize: '12px',
                background: '#e8f2ef',
                padding: '10px 12px',
                borderRadius: '8px',
                lineHeight: 1.65,
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}
            >
              <TargetIcon />
              <span>
                <strong style={{ fontWeight: 600 }}>Recommended:</strong>{' '}
                {group.recommendation}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
