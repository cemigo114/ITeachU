import React from 'react';
import { t } from '../utils/translations';

/**
 * Real-time teaching progress bar showing estimated proficiency
 * Based on weighted_total score (0-100) with EMERGING/DEVELOPING/PROFICIENT thresholds
 */
const TeachingProgressBar = ({ turnCount, evidenceCollected, language = 'en' }) => {
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

  // Determine proficiency level color
  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const progressColor = getProgressColor(estimatedScore);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="text-sm font-semibold text-gray-700 mb-3">{t(language, 'progress')}</div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className={`h-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${estimatedScore}%` }}
        ></div>
      </div>
    </div>
  );
};

export default TeachingProgressBar;
