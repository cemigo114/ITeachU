import React from 'react';

/**
 * Real-time teaching progress bar showing estimated proficiency
 * Based on weighted_total score (0-100) with EMERGING/DEVELOPING/PROFICIENT thresholds
 */
const TeachingProgressBar = ({ turnCount, evidenceCollected }) => {
  // Calculate estimated score (0-100) based on real-time evidence
  const calculateEstimatedScore = () => {
    if (!evidenceCollected) return 0;

    // Count evidence flags (max 4)
    const evidenceCount = Object.values(evidenceCollected).filter(Boolean).length;

    // Base score from evidence: each flag ≈ 20 points (max 80)
    const baseScore = evidenceCount * 20;

    // Turn efficiency bonus (max 20 points)
    let turnBonus = 0;
    if (turnCount > 0 && turnCount <= 12) {
      turnBonus = 20; // Proficient pace
    } else if (turnCount <= 15) {
      turnBonus = 10; // Developing pace
    }

    // Cap at 100
    return Math.min(100, baseScore + turnBonus);
  };

  const estimatedScore = calculateEstimatedScore();

  // Determine proficiency level
  const getProficiencyLevel = (score) => {
    if (score >= 80) return { level: 'PROFICIENT', color: 'bg-green-600', textColor: 'text-green-700' };
    if (score >= 60) return { level: 'DEVELOPING', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: 'EMERGING', color: 'bg-orange-500', textColor: 'text-orange-700' };
  };

  const proficiency = getProficiencyLevel(estimatedScore);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Teaching Progress</span>
          <span className={`text-xs font-bold px-2 py-1 rounded ${proficiency.textColor} bg-opacity-10 ${proficiency.color.replace('bg-', 'bg-opacity-10 bg-')}`}>
            {proficiency.level}
          </span>
        </div>
        <span className="text-lg font-bold text-gray-800">{estimatedScore}/100</span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        {/* Threshold markers */}
        <div className="absolute top-0 left-[60%] w-px h-full bg-gray-400 z-10" title="Developing: 60"></div>
        <div className="absolute top-0 left-[80%] w-px h-full bg-gray-400 z-10" title="Proficient: 80"></div>

        {/* Progress fill */}
        <div
          className={`h-full transition-all duration-500 ${proficiency.color}`}
          style={{ width: `${estimatedScore}%` }}
        ></div>
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>0 - Emerging</span>
        <span>60 - Developing</span>
        <span>80 - Proficient</span>
      </div>

      {/* Evidence indicators */}
      {evidenceCollected && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries({
            usedExamples: 'Used Examples',
            definedTerms: 'Defined Terms',
            checkedUnderstanding: 'Checked Understanding',
            explainedWhy: 'Explained Why'
          }).map(([key, label]) => (
            <div
              key={key}
              className={`text-xs px-2 py-1 rounded-full ${
                evidenceCollected[key]
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {evidenceCollected[key] ? '✓' : '○'} {label}
            </div>
          ))}
        </div>
      )}

      {/* Turn count */}
      <div className="mt-2 text-xs text-gray-500">
        Turn {turnCount} {turnCount <= 12 && '• On track for Proficient'}
      </div>
    </div>
  );
};

export default TeachingProgressBar;
