import React from 'react';

/**
 * ParentDashboard -- Screen 10 from the design prototype.
 * Sky-blue tinted background, child progress timeline,
 * teacher note, and parent-facing summary.
 */

const colors = {
  sky: 'oklch(52% 0.1 240)',
  skyDeep: 'oklch(40% 0.1 240)',
  skyPale: 'oklch(96% 0.025 240)',
  sage: 'oklch(49% 0.08 162)',
  sageLight: 'oklch(62% 0.08 162)',
  sagePale: 'oklch(96% 0.025 162)',
  amber: 'oklch(64% 0.13 55)',
  amberPale: 'oklch(97% 0.03 75)',
  ink: 'oklch(17% 0.01 170)',
  inkSoft: 'oklch(30% 0.01 170)',
  muted: 'oklch(55% 0.015 170)',
  border: 'oklch(90% 0.012 170)',
  white: '#ffffff',
};

// Mock data matching the design prototype
const MOCK_TIMELINE = [
  {
    title: 'Unit Rates \u2014 7.RP.A.2',
    sub: 'Apr 28 \u00b7 12 exchanges with Zippy',
    score: '88%',
    scoreColor: colors.sage,
    iconBg: colors.sagePale,
    iconColor: colors.sage,
    iconType: 'target',
  },
  {
    title: 'Adding Integers \u2014 7.NS.A.1',
    sub: 'Apr 21 \u00b7 9 exchanges with Zippy',
    score: '79%',
    scoreColor: colors.sage,
    iconBg: colors.sagePale,
    iconColor: colors.sage,
    iconType: 'lines',
  },
  {
    title: 'Percents \u2014 7.RP.A.3',
    sub: 'Apr 14 \u00b7 7 exchanges with Zippy',
    score: '64%',
    scoreColor: colors.amber,
    iconBg: colors.amberPale,
    iconColor: colors.amber,
    iconType: 'check',
  },
];

function TimelineIcon({ type, bg, color }) {
  if (type === 'target') {
    return (
      <div
        className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8h12M8 2v12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.5" />
        </svg>
      </div>
    );
  }
  if (type === 'lines') {
    return (
      <div
        className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 8h8M2 5h12M2 11h12" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  // check
  return (
    <div
      className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: bg }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.4" />
        <path d="M5.5 8.5l2 2 4-4" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

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

const ParentDashboard = ({ currentUser, assignments, getBadge, onViewFeedback, onLogout }) => {
  const childName = 'Alex M.';
  const grade = '7th Grade Math';

  return (
    <div className="min-h-screen font-body" style={{ background: colors.skyPale }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3.5"
        style={{ background: colors.white, borderBottom: `1px solid ${colors.border}` }}
      >
        <CognalityLogo markColor={colors.sky} />
        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: colors.skyPale,
            border: `1px solid oklch(52% 0.1 240 / 0.3)`,
            color: colors.sky,
          }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-semibold"
            style={{ background: `linear-gradient(135deg, ${colors.sky}, ${colors.skyDeep})` }}
          >
            AM
          </div>
          {childName} &middot; {grade}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Latest summary card */}
        <div
          className="rounded-[20px] p-6 mb-5"
          style={{
            background: colors.white,
            border: `1.5px solid ${colors.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="font-display text-[1.1rem] font-medium"
              style={{ letterSpacing: '-0.02em', margin: 0 }}
            >
              Alex&apos;s latest: Unit Rates
            </div>
            <div
              className="font-display text-[1.75rem] font-medium"
              style={{ color: colors.sage, letterSpacing: '-0.03em' }}
            >
              88%
            </div>
          </div>
          <div
            className="text-[12.5px] leading-[1.75] p-4 rounded-lg"
            style={{
              color: colors.inkSoft,
              background: colors.skyPale,
              borderLeft: `3px solid ${colors.sky}`,
            }}
          >
            <strong className="font-semibold" style={{ color: colors.sky }}>
              In plain language:
            </strong>{' '}
            Alex showed a strong understanding of unit rates -- explaining not just the procedure but the{' '}
            <em>meaning</em> behind dividing to find "per 1" of something. They even made a connection that
            wasn&apos;t required, about how the rate can go in two directions. This is advanced thinking for this
            standard.
          </div>
        </div>

        {/* Progress this month */}
        <div
          className="font-display text-[1.1rem] font-medium mb-4"
          style={{ letterSpacing: '-0.02em' }}
        >
          Progress this month
        </div>

        <div className="flex flex-col gap-2">
          {MOCK_TIMELINE.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-4 rounded-lg transition-shadow hover:shadow-soft"
              style={{
                background: colors.white,
                border: `1.5px solid ${colors.border}`,
              }}
            >
              <TimelineIcon type={item.iconType} bg={item.iconBg} color={item.iconColor} />
              <div className="flex-1">
                <div
                  className="text-[12.5px] font-semibold mb-0.5"
                  style={{ color: colors.ink, letterSpacing: '-0.01em' }}
                >
                  {item.title}
                </div>
                <div className="text-[11px]" style={{ color: colors.muted }}>
                  {item.sub}
                </div>
              </div>
              <div
                className="font-display text-[1.3rem] font-medium"
                style={{ color: item.scoreColor, letterSpacing: '-0.02em' }}
              >
                {item.score}
              </div>
            </div>
          ))}
        </div>

        {/* Teacher note */}
        <div
          className="mt-5 rounded-[12px] p-5"
          style={{
            background: colors.white,
            border: `1.5px solid ${colors.border}`,
          }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-[0.07em] mb-2"
            style={{ color: colors.muted }}
          >
            A note from Ms. Rivera
          </div>
          <div
            className="text-[12.5px] leading-[1.75] italic"
            style={{ color: colors.inkSoft }}
          >
            &ldquo;Alex&apos;s reasoning has improved noticeably since we started using Cognality -- they&apos;re
            getting better at explaining their thinking, not just getting the right answer. The unit rate work this
            week was particularly strong.&rdquo;
          </div>
          <div className="text-[11px] mt-2" style={{ color: colors.muted, fontStyle: 'normal' }}>
            Ms. Rivera &middot; 7th Grade Math, Period 3
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-5">
          <button
            className="px-4 py-[7px] rounded-lg text-xs font-medium text-white transition-all hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${colors.sky} 0%, ${colors.skyDeep} 100%)`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              letterSpacing: '-0.01em',
            }}
          >
            Message Ms. Rivera
          </button>
          <button
            className="px-4 py-[7px] rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'transparent',
              color: colors.muted,
              border: `1px solid ${colors.border}`,
            }}
          >
            Download report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
