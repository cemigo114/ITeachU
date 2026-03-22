import React from 'react';
import { t } from '../utils/translations';

const TeachingProgressBar = ({ turnCount, evidenceCollected, language = 'en' }) => {
  const calculateEstimatedScore = () => {
    if (!evidenceCollected) return 0;
    const evidenceCount = Object.values(evidenceCollected).filter(Boolean).length;
    const baseScore = evidenceCount * 20;
    let turnBonus = 0;
    if (turnCount > 0 && turnCount <= 12) turnBonus = 20;
    else if (turnCount <= 15) turnBonus = 10;
    return Math.min(100, baseScore + turnBonus);
  };

  const estimatedScore = calculateEstimatedScore();

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-teal-600';
    if (score >= 60) return 'bg-coral-400';
    return 'bg-coral-500';
  };

  const getLabel = (score) => {
    if (score >= 80) return 'Proficient';
    if (score >= 60) return 'Developing';
    return 'Emerging';
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-200/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-display font-semibold text-neutral-700">
          {t(language, 'progress')}
        </span>
        {estimatedScore > 0 && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            estimatedScore >= 80 ? 'bg-teal-100 text-teal-700' :
            estimatedScore >= 60 ? 'bg-coral-100 text-coral-700' :
            'bg-neutral-100 text-neutral-600'
          }`}>
            {getLabel(estimatedScore)}
          </span>
        )}
      </div>

      <div className="relative h-2.5 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColor(estimatedScore)}`}
          style={{ width: `${estimatedScore}%` }}
        />
      </div>

      {estimatedScore > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {Object.entries(evidenceCollected || {}).map(([key, collected]) => (
            <span
              key={key}
              className={`text-xs px-2 py-0.5 rounded-full transition-all duration-300 ${
                collected
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeachingProgressBar;
