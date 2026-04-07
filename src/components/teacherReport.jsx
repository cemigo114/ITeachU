/**
 * TeacherReport.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Concise teacher-facing feedback report.
 * Consumes the v3 Cognitive Breakdown Report JSON from generateEvaluatorPrompt().
 *
 * Design goals:
 *   - Readable in ≤30 seconds
 *   - Misconception-first: the most prominent thing a teacher sees
 *   - Breakpoint bar replaces four collapsed sections
 *   - Evidence chat bubbles give proof without needing to read raw transcripts
 *   - Action panel surfaces exactly what the teacher needs to do tomorrow
 *
 * Props:
 *   evaluation  {object}  — Cognitive Breakdown Report JSON
 *   studentName {string}  — optional, defaults to "Student"
 *   onAssignTask    {fn}  — callback for "Assign follow-up task" button
 *   onProbeDeeper   {fn}  — callback for "Ask Zippy to probe deeper"
 *   onAddNote       {fn}  — callback for "Add teacher note"
 */

import React from 'react';

// ─── Signal display metadata ───────────────────────────────────────────────

const SIGNAL_META = {
  // Misconception
  CORRECTED:               { label: 'Corrected',        bg: 'bg-teal-100',   text: 'text-teal-800',  dot: 'bg-teal-500'  },
  IDENTIFIED:              { label: 'Identified',       bg: 'bg-amber-100',  text: 'text-amber-800', dot: 'bg-amber-500' },
  SHARED:                  { label: 'Accepted error',   bg: 'bg-red-100',    text: 'text-red-800',   dot: 'bg-red-500'   },
  // Interpretation classifications
  FULL_CORRECTION:         { label: 'Full correction',  bg: 'bg-teal-100',   text: 'text-teal-800',  dot: 'bg-teal-500'  },
  SURFACE_CORRECTION:      { label: 'Surface fix',      bg: 'bg-amber-100',  text: 'text-amber-800', dot: 'bg-amber-500' },
  PASSIVE_NON_CORRECTION:  { label: 'Missed error',     bg: 'bg-red-100',    text: 'text-red-800',   dot: 'bg-red-500'   },
  // Pattern
  STRUCTURAL:              { label: 'Structural',       bg: 'bg-teal-100',   text: 'text-teal-800',  dot: 'bg-teal-500'  },
  PROCEDURAL:              { label: 'Procedural',       bg: 'bg-amber-100',  text: 'text-amber-800', dot: 'bg-amber-500' },
  SURFACE_FEATURE:         { label: 'Surface only',     bg: 'bg-amber-100',  text: 'text-amber-700', dot: 'bg-amber-400' },
  MISSED:                  { label: 'Missed',           bg: 'bg-red-100',    text: 'text-red-800',   dot: 'bg-red-500'   },
  OVER_GENERALISED:        { label: 'Over-generalised', bg: 'bg-amber-100',  text: 'text-amber-800', dot: 'bg-amber-500' },
  // Generalization
  CORRECT_WITH_BOUNDARIES: { label: 'Full rule',        bg: 'bg-teal-100',   text: 'text-teal-800',  dot: 'bg-teal-500'  },
  CORRECT_NO_BOUNDARIES:   { label: 'Partial rule',     bg: 'bg-teal-100',   text: 'text-teal-700',  dot: 'bg-teal-400'  },
  PARTIAL:                 { label: 'Partial',          bg: 'bg-amber-100',  text: 'text-amber-800', dot: 'bg-amber-500' },
  EXAMPLE_SPECIFIC:        { label: 'Example only',     bg: 'bg-amber-100',  text: 'text-amber-700', dot: 'bg-amber-400' },
  INCORRECT_RULE:          { label: 'Incorrect rule',   bg: 'bg-red-100',    text: 'text-red-800',   dot: 'bg-red-500'   },
  // Transfer
  FULL_TRANSFER:           { label: 'Full transfer',    bg: 'bg-teal-100',   text: 'text-teal-800',  dot: 'bg-teal-500'  },
  PARTIAL_TRANSFER:        { label: 'Partial transfer', bg: 'bg-amber-100',  text: 'text-amber-800', dot: 'bg-amber-500' },
  NO_TRANSFER:             { label: 'No transfer',      bg: 'bg-red-100',    text: 'text-red-800',   dot: 'bg-red-500'   },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function Chip({ label: key }) {
  const m = SIGNAL_META[key] || { label: key, bg: 'bg-neutral-100', text: 'text-neutral-700', dot: 'bg-neutral-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// Breakpoint node — one of the four phases
function BpNode({ label, outcome, active }) {
  // outcome: 'pass' | 'fail' | 'partial' | 'unreached'
  const styles = {
    pass:      { ring: 'ring-teal-400',  bg: 'bg-teal-50',    icon: '✓', iconColor: 'text-teal-600' },
    fail:      { ring: 'ring-red-400',   bg: 'bg-red-50',     icon: '✕', iconColor: 'text-red-600'  },
    partial:   { ring: 'ring-amber-400', bg: 'bg-amber-50',   icon: '~', iconColor: 'text-amber-600'},
    unreached: { ring: 'ring-neutral-200', bg: 'bg-neutral-50', icon: '·', iconColor: 'text-neutral-400' },
  };
  const s = styles[outcome] || styles.unreached;
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div className={`w-10 h-10 rounded-full ring-2 ${s.ring} ${s.bg} flex items-center justify-center font-bold text-base ${s.iconColor}`}>
        {s.icon}
      </div>
      <span className="text-xs text-neutral-600 text-center leading-tight max-w-[64px]">{label}</span>
    </div>
  );
}

// Derive breakpoint outcome from signal label
function outcomeFromSignal(signal) {
  if (!signal) return 'unreached';
  if (['CORRECTED', 'STRUCTURAL', 'CORRECT_WITH_BOUNDARIES', 'CORRECT_NO_BOUNDARIES', 'FULL_TRANSFER', 'FULL_CORRECTION'].includes(signal)) return 'pass';
  if (['SHARED', 'MISSED', 'INCORRECT_RULE', 'NO_TRANSFER', 'PASSIVE_NON_CORRECTION'].includes(signal)) return 'fail';
  return 'partial';
}

// Thin-session notice
function ThinSessionBanner() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
      <span className="text-base mt-0.5">⚠️</span>
      <span>Not enough data from this session for a full diagnosis. Results below are based on limited evidence — treat them as tentative.</span>
    </div>
  );
}

// ─── Section A: Misconception Diagnosis ────────────────────────────────────

/**
 * Find the best-matching raw student turn for a misconception item.
 * Priority: highlightReason mention of the misconception ID > word overlap > indexed fallback.
 */
function bestQuoteForMisconception(item, idx, phase2Turns) {
  if (!phase2Turns.length) return item.evidence || null;

  // 1. highlightReason contains the misconception ID (e.g. "M1", "accepted misconception M1")
  const byReason = phase2Turns.find(t =>
    t.highlightReason && t.highlightReason.toUpperCase().includes(`M${idx + 1}`)
  );
  if (byReason) return byReason.text;

  // 2. Word-overlap between item.evidence and each raw student turn
  if (item.evidence) {
    const evWords = new Set(
      item.evidence.toLowerCase().split(/\W+/).filter(w => w.length > 3)
    );
    if (evWords.size > 0) {
      let best = null, bestScore = 0;
      for (const t of phase2Turns) {
        const words = t.text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const overlap = words.filter(w => evWords.has(w)).length;
        const score = overlap / evWords.size;
        if (score > bestScore) { bestScore = score; best = t; }
      }
      if (best && bestScore > 0.15) return best.text;
    }
  }

  // 3. Indexed fallback
  return phase2Turns[idx]?.text || item.evidence || null;
}

function MisconceptionSection({ ma, studentEvidence }) {
  if (!ma?.items?.length) return null;

  const phase2Turns = (studentEvidence || [])
    .filter(t => t.phase === 2)
    .sort((a, b) => a.turnIndex - b.turnIndex);

  const studentFixed = (signal) => signal === 'CORRECTED' || signal === 'IDENTIFIED';

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-neutral-100">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Misconception check</p>
      </div>

      <div className="divide-y divide-neutral-100">
        {ma.items.map((item, idx) => {
          const fixed = studentFixed(item.signal);
          const quote = bestQuoteForMisconception(item, idx, phase2Turns);

          return (
            <div key={item.id} className={`px-5 py-4 space-y-2 ${fixed ? '' : 'grid grid-cols-5 gap-0'}`}>
              {fixed ? (
                /* Corrected — compact */
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-semibold text-neutral-900 text-sm">{item.title}</span>
                    <Chip label={item.signal} />
                  </div>
                  {quote && <p className="text-xs text-neutral-500 italic">"{quote}"</p>}
                </div>
              ) : (
                /* Failed — show root cause and action */
                <>
                  <div className="col-span-3 space-y-2 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-neutral-900 text-sm">{item.title}</span>
                      <Chip label={item.signal} />
                    </div>
                    {quote && (
                      <div className="bg-neutral-100 rounded-lg px-3 py-2">
                        <span className="text-xs text-neutral-400 font-medium">Student said: </span>
                        <span className="text-xs text-neutral-700 italic">"{quote}"</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 border-l border-neutral-100 pl-4 flex flex-col gap-2">
                    {item.diagnosis?.rootCause && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-amber-800 mb-0.5">Root cause</p>
                        <p className="text-xs text-amber-900 leading-snug">{item.diagnosis.rootCause}</p>
                      </div>
                    )}
                    {item.action && (
                      <p className="text-xs text-neutral-500 leading-relaxed">🎯 {item.action}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section B: Breakpoint Bar ─────────────────────────────────────────────

function BreakpointBar({ evaluation }) {
  const pa = evaluation.patternRecognitionAnalysis;
  const ga = evaluation.generalizationAnalysis;
  const ia = evaluation.inferenceTransferAnalysis;
  const ma = evaluation.misconceptionAnalysis;

  const miscItems = ma?.items || [];
  const miscOutcome = miscItems.length === 0 ? 'unreached'
    : miscItems.every(i => i.signal === 'CORRECTED') ? 'pass'
    : miscItems.some(i => i.signal === 'SHARED') ? 'fail'
    : 'partial';

  // One sentence: prefer the evaluator's pre-built `finding` field, then justification
  const oneSentence = (text) => {
    if (!text) return null;
    const s = text.split(/(?<=[.!?])\s+/)[0].trim();
    return s.length > 120 ? s.slice(0, 117) + '…' : s;
  };

  const phases = [
    {
      label: 'Misconception',
      outcome: miscOutcome,
      summary: null, // covered in full by MisconceptionSection above
    },
    {
      label: 'Pattern',
      outcome: outcomeFromSignal(pa?.interpretation?.label),
      // evaluator emits `finding` as "Student [label] → indicates [interp]."
      summary: oneSentence(pa?.finding || pa?.interpretation?.justification),
    },
    {
      label: 'Generalisation',
      outcome: outcomeFromSignal(ga?.interpretation?.label),
      summary: oneSentence(ga?.interpretation?.justification),
    },
    {
      label: 'Transfer',
      outcome: outcomeFromSignal(ia?.interpretation?.label),
      summary: oneSentence(ia?.interpretation?.justification),
    },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-4 shadow-sm space-y-4">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Where thinking breaks</p>

      {/* Node row */}
      <div className="flex items-start justify-between gap-2">
        {phases.map((n, i) => (
          <React.Fragment key={n.label}>
            <BpNode label={n.label} outcome={n.outcome} />
            {i < phases.length - 1 && (
              <div className="flex-1 h-0.5 bg-neutral-200 mt-5 mx-1" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* One-sentence summaries for phases 2–4 */}
      <div className="space-y-1.5">
        {phases.filter(p => p.summary).map(p => (
          <div key={p.label} className="flex items-start gap-2">
            <span className="text-xs font-semibold text-neutral-400 w-24 shrink-0 pt-px">{p.label}</span>
            <p className="text-xs text-neutral-600 leading-relaxed">{p.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section C: Evidence Highlights ────────────────────────────────────────

function EvidenceSection({ studentEvidence }) {
  if (!studentEvidence?.length) return null;

  // Show max 3 turns; prefer highlighted ones
  const sorted = [...studentEvidence].sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0));
  const displayed = sorted.slice(0, 3).sort((a, b) => a.turnIndex - b.turnIndex);

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-neutral-100">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Proof from the interaction</p>
      </div>
      <div className="px-5 py-4 space-y-2">
        {displayed.map((turn) => (
          <div
            key={turn.turnIndex}
            className={`rounded-xl px-3 py-2.5 text-sm max-w-[85%] ${
              turn.highlight
                ? 'bg-yellow-50 border border-yellow-300 text-neutral-800'
                : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-neutral-500">
                Phase {turn.phase}
              </span>
              {turn.highlight && turn.highlightReason && (
                <span className="text-xs text-amber-700 bg-yellow-100 px-1.5 py-0.5 rounded-full">
                  {turn.highlightReason}
                </span>
              )}
            </div>
            <p className="leading-relaxed">"{turn.text}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section D: What to Do Next ────────────────────────────────────────────

function WhatToDoNext({ ip }) {
  if (!ip?.priorityTarget) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-4 shadow-sm space-y-3">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">What to do next</p>
      <p className="font-semibold text-neutral-900 text-sm">{ip.priorityTarget}</p>
      {ip.recommendedNextExperience && (
        <p className="text-xs text-neutral-600 leading-relaxed">{ip.recommendedNextExperience}</p>
      )}
      {ip.teacherPrompt && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg px-3 py-2.5">
          <p className="text-xs font-semibold text-sky-700 mb-0.5">Try asking:</p>
          <p className="text-xs text-sky-900 leading-relaxed">
            {ip.teacherPrompt.replace(/^Try asking:\s*/i, '')}
          </p>
        </div>
      )}
      {ip.transferRiskTopics?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-neutral-400">Will affect:</span>
          {ip.transferRiskTopics.map(t => (
            <span key={t} className="text-xs bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const TeacherReport = ({
  evaluation,
  studentName = 'Student',
}) => {
  if (!evaluation) return null;

  const { thinSession, misconceptionAnalysis: ma, instructionalPriority: ip, studentEvidence } = evaluation;

  return (
    <div className="max-w-2xl mx-auto space-y-3 font-sans">

      {/* Header */}
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-semibold text-neutral-900 text-base">{studentName}</h2>
        {evaluation.taskTitle && (
          <span className="text-xs text-neutral-500">{evaluation.taskTitle}</span>
        )}
      </div>

      {/* Thin session warning */}
      {thinSession && <ThinSessionBanner />}

      {/* A — Misconception diagnosis */}
      <MisconceptionSection ma={ma} studentEvidence={studentEvidence} />

      {/* B — Breakpoint bar with phase summaries */}
      <BreakpointBar evaluation={evaluation} />

      {/* C — Evidence highlights */}
      <EvidenceSection studentEvidence={studentEvidence} />

      {/* D — What to do next */}
      <WhatToDoNext ip={ip} />

    </div>
  );
};

export default TeacherReport;
