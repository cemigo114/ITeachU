import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * StudentReviewView -- Screen 9 from the design prototype.
 * Post-teaching review showing reasoning score, exchange count,
 * evidence items, and next step recommendation.
 */

const colors = {
  zippy: 'oklch(60% 0.18 15)',
  zippyDeep: 'oklch(42% 0.15 15)',
  amber: 'oklch(64% 0.13 55)',
  amberDeep: 'oklch(47% 0.12 55)',
  amberPale: 'oklch(97% 0.03 75)',
  sage: 'oklch(49% 0.08 162)',
  sageLight: 'oklch(62% 0.08 162)',
  sageDeep: 'oklch(35% 0.07 162)',
  sagePale: 'oklch(96% 0.025 162)',
  coral: 'oklch(57% 0.12 28)',
  ink: 'oklch(17% 0.01 170)',
  inkSoft: 'oklch(30% 0.01 170)',
  inkDark: 'oklch(14% 0.018 170)',
  muted: 'oklch(55% 0.015 170)',
  border: 'oklch(90% 0.012 170)',
  white: '#ffffff',
};

// Mock data matching the design prototype exactly
const MOCK_REVIEW = {
  taskTitle: 'Unit Rates',
  standard: '7.RP.A.2',
  completedDate: 'April 28',
  reasoningScore: 88,
  exchanges: 12,
  keyIdeas: 3,
  summary:
    'You explained that unit rate means finding the cost per 1 item by dividing, and went further to explain the inverse relationship. That\'s a strong conceptual grasp!',
  evidence: [
    {
      type: 'strength',
      quote:
        '"You put the \'per 1\' thing on the bottom" \u2014 you clearly understood the role of the denominator in a ratio, not just the algorithm.',
    },
    {
      type: 'strength',
      quote:
        'You independently connected $1.60/apple to 0.63 apples/$1 \u2014 showing you understand ratios can be expressed in both directions.',
    },
    {
      type: 'gap',
      quote:
        'When Zippy asked about non-whole quotients you hesitated slightly before rounding. Practice with fractions as unit rates will strengthen this.',
    },
  ],
  nextStep:
    'Try the "Percent \u2014 Finding the Whole" task next \u2014 it builds on this same idea of working backwards with ratios.',
};

export default function StudentReviewView() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const review = MOCK_REVIEW;

  return (
    <div className="min-h-screen font-body" style={{ background: colors.white }}>
      {/* Dark header */}
      <div
        className="relative overflow-hidden px-6 pt-9 pb-7"
        style={{ background: colors.inkDark }}
      >
        {/* Glow effect */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-60px',
            right: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, oklch(64% 0.13 55 / 0.2), transparent 70%)',
          }}
        />

        <h2
          className="font-display text-[1.4rem] font-normal text-white mb-1 relative"
          style={{ letterSpacing: '-0.03em' }}
        >
          Your work on {review.taskTitle}
        </h2>
        <p className="text-xs relative" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {review.standard} &middot; Completed {review.completedDate}
        </p>

        {/* Score row */}
        <div className="flex gap-6 mt-5 relative">
          <div className="text-center">
            <div
              className="font-display text-[2.2rem] font-medium text-white leading-none"
              style={{ letterSpacing: '-0.03em' }}
            >
              {review.reasoningScore}
              <span className="text-[1.1rem] font-light">%</span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Reasoning score
            </div>
          </div>

          <div className="w-px mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

          <div className="text-center">
            <div
              className="font-display text-[2.2rem] font-medium leading-none"
              style={{ letterSpacing: '-0.03em', color: colors.sageLight }}
            >
              {review.exchanges}
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Exchanges
            </div>
          </div>

          <div className="w-px mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

          <div className="text-center">
            <div
              className="font-display text-[2.2rem] font-medium leading-none"
              style={{ letterSpacing: '-0.03em', color: colors.amber }}
            >
              {review.keyIdeas}
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Key ideas
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="p-5">
        {/* Summary callout */}
        <div
          className="rounded-r-lg p-3.5 mb-5 text-[12.5px] leading-[1.65]"
          style={{
            background: 'oklch(14% 0.018 170 / 0.04)',
            borderLeft: `3px solid ${colors.sage}`,
            color: colors.sageDeep,
          }}
        >
          <strong className="font-semibold">What Zippy learned from you:</strong>{' '}
          {review.summary}
        </div>

        {/* Evidence items */}
        {review.evidence.map((item, idx) => (
          <div
            key={idx}
            className="rounded-lg p-4 mb-2"
            style={{
              background: colors.white,
              border: `1.5px solid ${colors.border}`,
            }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-[0.06em] mb-1.5"
              style={{
                color: item.type === 'strength' ? colors.sage : colors.coral,
              }}
            >
              {item.type === 'strength' ? 'Strength' : 'Room to grow'}
            </div>
            <div
              className="text-[12.5px] italic leading-[1.65] pl-2.5"
              style={{
                color: colors.inkSoft,
                borderLeft: `3px solid ${colors.border}`,
              }}
            >
              {item.quote}
            </div>
          </div>
        ))}

        {/* Next step callout */}
        <div
          className="mt-4 p-4 rounded-lg text-[12.5px] leading-[1.65]"
          style={{
            background: colors.amberPale,
            border: '1px solid oklch(64% 0.13 55 / 0.2)',
            color: colors.amberDeep,
          }}
        >
          <strong className="font-semibold">Your next step:</strong> {review.nextStep}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            className="px-4 py-[7px] rounded-lg text-xs font-medium text-white transition-all hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${colors.amber} 0%, ${colors.amberDeep} 100%)`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
              letterSpacing: '-0.01em',
            }}
          >
            Try recommended task
          </button>
          <button
            className="px-4 py-[7px] rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'transparent',
              color: colors.muted,
              border: `1px solid ${colors.border}`,
            }}
            onClick={() => navigate('/student')}
          >
            Back to assignments
          </button>
        </div>
      </div>
    </div>
  );
}
