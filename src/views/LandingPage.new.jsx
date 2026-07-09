import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen font-body">
      {/* Hero */}
      <div className="relative bg-ink overflow-hidden">
        {/* Gradient overlays */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 60%, rgba(74,124,111,0.3), transparent 60%), radial-gradient(ellipse at 75% 30%, rgba(212,133,58,0.15), transparent 50%)',
          }}
        />

        <div className="relative z-10 max-w-[640px] mx-auto px-6 py-20 md:py-24 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 bg-white/[0.08] border border-white/[0.15] rounded-full px-3 py-1 text-[11px] text-white/70 tracking-wide mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-light" />
            Formative assessment &middot; AI era
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-[3.5rem] font-light text-white leading-[1.1] tracking-tight mb-5">
            See how your students <em className="italic text-sage-light">actually</em> think
          </h1>

          {/* Subhead */}
          <p className="text-base text-white/60 leading-relaxed mb-10">
            Students teach a confused AI named Zippy to solve math problems.
            You watch their reasoning unfold &mdash; not just their answers.
          </p>

          {/* CTAs */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              to="/signup"
              className="bg-sage hover:bg-sage-deep text-white px-7 py-3.5 rounded-sm text-sm font-medium transition-colors"
            >
              Get started free &rarr;
            </Link>
            <button className="bg-white/[0.08] text-white/80 px-7 py-3.5 rounded-sm text-sm border border-white/[0.15] hover:bg-white/[0.12] transition-colors">
              &#9654; Watch 2-min demo
            </button>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-border bg-border gap-px">
        <div className="bg-white p-8">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center mb-3" style={{ background: 'oklch(96% 0.025 162)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="oklch(49% 0.08 162)" strokeWidth="1.5"/>
              <circle cx="7" cy="10" r="1.2" fill="oklch(49% 0.08 162)"/>
              <circle cx="10" cy="10" r="1.2" fill="oklch(49% 0.08 162)"/>
              <circle cx="13" cy="10" r="1.2" fill="oklch(49% 0.08 162)"/>
            </svg>
          </div>
          <h3 className="font-display text-[15px] font-medium mb-1.5">Reasoning made visible</h3>
          <p className="text-xs text-muted leading-relaxed">
            Every explanation a student gives reveals how they actually think — not just whether they got the answer right.
          </p>
        </div>
        <div className="bg-white p-8">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center mb-3" style={{ background: 'oklch(97% 0.03 75)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="13" width="4" height="5" rx="1" fill="oklch(64% 0.13 55)"/>
              <rect x="8" y="9" width="4" height="9" rx="1" fill="oklch(64% 0.13 55)"/>
              <rect x="14" y="5" width="4" height="13" rx="1" fill="oklch(64% 0.13 55)"/>
            </svg>
          </div>
          <h3 className="font-display text-[15px] font-medium mb-1.5">Instant class insights</h3>
          <p className="text-xs text-muted leading-relaxed">
            After each task, see which students understood, who's confused, and exactly where their thinking breaks.
          </p>
        </div>
        <div className="bg-white p-8">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center mb-3" style={{ background: 'oklch(96% 0.025 240)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="oklch(52% 0.1 240)" strokeWidth="1.5"/>
              <circle cx="10" cy="10" r="4" stroke="oklch(52% 0.1 240)" strokeWidth="1.5"/>
              <circle cx="10" cy="10" r="1.5" fill="oklch(52% 0.1 240)"/>
            </svg>
          </div>
          <h3 className="font-display text-[15px] font-medium mb-1.5">Targeted next steps</h3>
          <p className="text-xs text-muted leading-relaxed">
            AI-generated groupings and recommended interventions — ready to act on the same day students complete tasks.
          </p>
        </div>
      </div>
    </div>
  );
}
