/**
 * StudentReport.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Student-facing session recap. Short, warm, actionable.
 *
 * Design principles:
 *   - No diagnostic language ("misconception", "breakpoint", "signal")
 *   - Lead with what the student got RIGHT before surfacing what to work on
 *   - One focus area — not a list of problems
 *   - One next step — a single concrete thing they can do
 *   - Link to next Zippy session via onStartNextSession callback
 *
 * Props:
 *   evaluation       {object}  — Cognitive Breakdown Report JSON (same shape as TeacherReport)
 *   studentName      {string}  — student's first name
 *   taskTitle        {string}  — e.g. "Exponents vs Multiplication"
 *   onStartNextSession {fn}    — called when student clicks "Practice with Zippy"
 *   onViewBadges       {fn}    — called when student clicks their badge/streak area
 */

import React, { useState, useEffect } from 'react';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Derive a plain-English "what you did well" line from the evaluation.
 * Avoids all diagnostic terminology.
 */
function deriveStrengths(evaluation) {
  if (evaluation.thinSession) {
    return [`You showed up and gave it a shot — that always counts.`];
  }

  const strengths = [];
  const ma = evaluation.misconceptionAnalysis;
  const pa = evaluation.patternRecognitionAnalysis;
  const ga = evaluation.generalizationAnalysis;
  const ia = evaluation.inferenceTransferAnalysis;

  const corrected = ma?.items?.filter(i => i.signal === 'CORRECTED') || [];
  if (corrected.length > 0) {
    strengths.push(
      corrected.length === 1
        ? `You caught a tricky error in Zippy's thinking and explained why it was wrong.`
        : `You caught ${corrected.length} errors in Zippy's thinking and explained them clearly.`
    );
  }

  if (['STRUCTURAL', 'PROCEDURAL'].includes(pa?.interpretation?.label)) {
    strengths.push(`You spotted a pattern across the examples, not just individual answers.`);
  }

  if (['CORRECT_WITH_BOUNDARIES', 'CORRECT_NO_BOUNDARIES'].includes(ga?.interpretation?.label)) {
    strengths.push(`You came up with a general rule — that's real mathematical thinking.`);
  }

  if (['FULL_TRANSFER', 'PARTIAL_TRANSFER'].includes(ia?.interpretation?.label)) {
    strengths.push(`You applied what you learned to a brand-new problem Zippy threw at you.`);
  }

  return strengths.length > 0
    ? strengths
    : [`You worked through the whole session and helped Zippy understand your thinking.`];
}

/**
 * Derive a single focus area in plain student language.
 * Reads directly from phase signals and evidence — avoids teacher-addressed language.
 */
function deriveFocus(evaluation) {
  const ma = evaluation.misconceptionAnalysis;
  const pa = evaluation.patternRecognitionAnalysis;
  const ga = evaluation.generalizationAnalysis;
  const ia = evaluation.inferenceTransferAnalysis;

  // Thin session: student didn't share enough thinking
  if (evaluation.thinSession) {
    return {
      heading: `Keep the conversation going`,
      body: `Next time, try sharing your thinking even if you're not sure — even a guess helps Zippy (and you!) figure out what's going on.`,
    };
  }

  // Accepted a misconception — most concrete and important to surface
  const shared = ma?.items?.find(i => i.signal === 'SHARED');
  if (shared) {
    // Use the student's actual words from evidence if available, otherwise the misconception title
    const whatHappened = shared.evidence
      ? `When you heard Zippy's idea about "${shared.title?.toLowerCase() || 'this'}", you went along with it — but that reasoning has a mistake in it.`
      : `When Zippy suggested "${shared.title?.toLowerCase()}", you agreed — but that idea isn't quite right.`;
    return {
      heading: `Something to look at again`,
      body: `${whatHappened} This is a really common mix-up, and worth revisiting before your next session.`,
    };
  }

  // Pattern not seen
  if (pa?.interpretation?.label === 'MISSED') {
    return {
      heading: `Spotting patterns`,
      body: `When Zippy asked about the pattern in the examples, it was hard to see. Try lining up a few examples side by side and asking: what changes? what stays the same?`,
    };
  }

  // Generalization off track
  if (['INCORRECT_RULE', 'OVER_GENERALISED'].includes(ga?.interpretation?.label)) {
    return {
      heading: `Refining your rule`,
      body: `The general rule you came up with is close, but it doesn't quite hold in every case. Think about: when does this rule NOT work?`,
    };
  }

  // Transfer didn't land
  if (ia?.interpretation?.label === 'NO_TRANSFER') {
    return {
      heading: `Applying what you know`,
      body: `You worked through the examples well, but when Zippy switched to a new situation, it was harder to use the same idea. That's the trickiest step — practicing with different examples will help.`,
    };
  }

  // Partial transfer — acknowledge partial success
  if (ia?.interpretation?.label === 'PARTIAL_TRANSFER') {
    return {
      heading: `Almost there`,
      body: `You were on the right track with the new problem, but there's a bit more to it. Try explaining your reasoning out loud — it often helps you catch the missing piece.`,
    };
  }

  return null;
}

/**
 * Turn the teacher-prompt into a student-friendly self-challenge.
 * Only surfaced when the session had enough data to produce a reliable prompt.
 */
function deriveChallenge(evaluation) {
  if (evaluation.thinSession) return null;
  const raw = evaluation.instructionalPriority?.teacherPrompt || '';
  return raw.replace(/^Try asking:\s*/i, '').trim() || null;
}

// ─── Sub-components ────────────────────────────────────────────────────────

/** Animated check icon for strength items */
function StrengthItem({ text, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="flex items-start gap-3 transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(6px)' }}
    >
      <div className="mt-0.5 w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="#0d9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-sm text-neutral-700 leading-relaxed">{text}</p>
    </div>
  );
}

/** The "what to work on" card */
function FocusCard({ focus }) {
  if (!focus) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-base">🔍</span>
        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">{focus.heading}</p>
      </div>
      <p className="text-sm text-amber-900 leading-relaxed">{focus.body}</p>
    </div>
  );
}

/** The self-challenge question */
function ChallengeCard({ question }) {
  const [revealed, setRevealed] = useState(false);
  if (!question) return null;
  return (
    <div className="bg-sky-50 border border-sky-200 rounded-2xl px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">💬</span>
        <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide">Can you answer this?</p>
      </div>
      {revealed ? (
        <p className="text-sm text-sky-900 leading-relaxed font-medium">{question}</p>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="text-sm text-sky-700 font-semibold underline underline-offset-2 hover:text-sky-900 transition-colors"
        >
          Tap to reveal your challenge question →
        </button>
      )}
    </div>
  );
}

/** Skill bar — shows progress across the four phases in student-friendly language */
function SkillBar({ evaluation }) {
  // If the session was too thin, signals are unreliable — hide the bars
  if (evaluation.thinSession) return null;

  const ma = evaluation.misconceptionAnalysis;
  const pa = evaluation.patternRecognitionAnalysis;
  const ga = evaluation.generalizationAnalysis;
  const ia = evaluation.inferenceTransferAnalysis;

  const skills = [
    {
      label: 'Spotting errors',
      emoji: '🧹',
      score: (() => {
        const items = ma?.items || [];
        if (!items.length) return 0;
        const corrected = items.filter(i => i.signal === 'CORRECTED').length;
        return Math.round((corrected / items.length) * 100);
      })(),
    },
    {
      label: 'Seeing patterns',
      emoji: '🔎',
      score: { STRUCTURAL: 100, PROCEDURAL: 70, SURFACE_FEATURE: 40, OVER_GENERALISED: 30, MISSED: 0 }[pa?.interpretation?.label] ?? 0,
    },
    {
      label: 'Making rules',
      emoji: '📐',
      score: { CORRECT_WITH_BOUNDARIES: 100, CORRECT_NO_BOUNDARIES: 75, PARTIAL: 50, EXAMPLE_SPECIFIC: 25, INCORRECT_RULE: 0, OVER_GENERALISED: 20 }[ga?.interpretation?.label] ?? 0,
    },
    {
      label: 'Applying ideas',
      emoji: '🚀',
      score: { FULL_TRANSFER: 100, PARTIAL_TRANSFER: 55, NO_TRANSFER: 0 }[ia?.interpretation?.label] ?? 0,
    },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-4 space-y-3">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Your skills this session</p>
      <div className="space-y-2.5">
        {skills.map(skill => (
          <div key={skill.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{skill.emoji}</span>
                <span className="text-xs font-medium text-neutral-700">{skill.label}</span>
              </div>
              <span className="text-xs text-neutral-400">{skill.score}%</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${skill.score}%`,
                  background: skill.score >= 75 ? '#0d9488' : skill.score >= 45 ? '#f59e0b' : '#f87171',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Next session CTA */
function NextSessionCard({ onStartNextSession, transferRiskTopics }) {
  const topic = transferRiskTopics?.[0];
  return (
    <div className="bg-neutral-900 rounded-2xl px-5 py-5 space-y-3">
      <div className="space-y-1">
        <p className="text-white font-semibold text-sm">Ready for your next challenge?</p>
        {topic && (
          <p className="text-neutral-400 text-xs">Next up: {topic}</p>
        )}
      </div>
      <button
        onClick={onStartNextSession}
        className="w-full bg-white text-neutral-900 text-sm font-semibold rounded-xl py-2.5 hover:bg-neutral-100 active:scale-95 transition-all"
      >
        Practice with Zippy →
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const StudentReport = ({
  evaluation,
  studentName = 'You',
  taskTitle,
  onStartNextSession = () => {},
  onViewBadges = () => {},
}) => {
  if (!evaluation) return null;

  const title = taskTitle || evaluation.taskTitle || 'Today\'s session';
  const strengths = deriveStrengths(evaluation);
  const focus = deriveFocus(evaluation);
  const challenge = deriveChallenge(evaluation);
  const ip = evaluation.instructionalPriority;

  // Count what the student got right for the headline
  const miscItems = evaluation.misconceptionAnalysis?.items || [];
  const correctedCount = miscItems.filter(i => i.signal === 'CORRECTED').length;
  const totalMisc = miscItems.length;

  const headlineEmoji = correctedCount === totalMisc && totalMisc > 0 ? '🎉' : correctedCount > 0 ? '👍' : '💪';
  const headlineText = correctedCount === totalMisc && totalMisc > 0
    ? `Great job, ${studentName}!`
    : correctedCount > 0
    ? `Nice work, ${studentName}!`
    : `Keep it up, ${studentName}!`;

  return (
    <div className="max-w-sm mx-auto space-y-3 font-sans">

      {/* Header */}
      <div className="px-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{headlineEmoji}</span>
          <h2 className="font-bold text-neutral-900 text-lg">{headlineText}</h2>
        </div>
        <p className="text-xs text-neutral-500 pl-8">{title}</p>
      </div>

      {/* What you did well */}
      <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-4 space-y-3">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">What you did well</p>
        <div className="space-y-2.5">
          {strengths.map((s, i) => (
            <StrengthItem key={i} text={s} delay={i * 120} />
          ))}
        </div>
      </div>

      {/* Skill bars */}
      <SkillBar evaluation={evaluation} />

      {/* Focus area — only if something to improve */}
      {focus && <FocusCard focus={focus} />}

      {/* Self-challenge question */}
      {challenge && <ChallengeCard question={challenge} />}

      {/* Next session */}
      <NextSessionCard
        onStartNextSession={onStartNextSession}
        transferRiskTopics={ip?.transferRiskTopics}
      />

    </div>
  );
};

export default StudentReport;
