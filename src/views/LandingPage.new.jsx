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
          <div className="w-9 h-9 rounded-sm bg-sage-pale flex items-center justify-center text-base mb-3">
            &#129504;
          </div>
          <h3 className="font-display text-[15px] font-medium mb-1.5">Reasoning visible</h3>
          <p className="text-xs text-muted leading-relaxed">
            Every explanation students give reveals how they think &mdash; not just whether they got the answer right.
          </p>
        </div>
        <div className="bg-white p-8">
          <div className="w-9 h-9 rounded-sm bg-amber-pale flex items-center justify-center text-base mb-3">
            &#128202;
          </div>
          <h3 className="font-display text-[15px] font-medium mb-1.5">Instant class insights</h3>
          <p className="text-xs text-muted leading-relaxed">
            After each task, see which students understood, who's confused, and exactly where their thinking breaks.
          </p>
        </div>
        <div className="bg-white p-8">
          <div className="w-9 h-9 rounded-sm bg-sky-pale flex items-center justify-center text-base mb-3">
            &#127919;
          </div>
          <h3 className="font-display text-[15px] font-medium mb-1.5">Targeted next steps</h3>
          <p className="text-xs text-muted leading-relaxed">
            AI-generated groupings and recommended interventions &mdash; ready to act on the same day students complete tasks.
          </p>
        </div>
      </div>
    </div>
  );
}
