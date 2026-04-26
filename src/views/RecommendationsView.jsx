import React from 'react';

/**
 * RecommendationsView — placeholder for the teacher "Recommendations" view.
 * Will be built out in a later phase with student groupings and
 * AI-generated instructional next steps.
 */
export default function RecommendationsView() {
  return (
    <div className="p-6 font-body">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-muted mb-4">
          Recommendations view coming soon.
        </p>
        <div className="bg-white border border-border rounded p-6 text-center">
          <div className="text-4xl mb-3">&#128161;</div>
          <h3 className="font-display text-lg font-medium text-ink mb-1">
            Recommendations
          </h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            AI-generated student groupings by misconception type, with root
            cause analysis and targeted next-step recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
