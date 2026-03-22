import React, { useState, useEffect } from 'react';
import { Award, Info } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

/**
 * StandardBadge Component
 * Shows CCSS standard code with tooltip showing full description
 */
const StandardBadge = ({ standardId, standardCode }) => {
  const [standard, setStandard] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (standardId) {
      fetch(API_ENDPOINTS.standardById(standardId))
        .then(res => res.json())
        .then(data => setStandard(data))
        .catch(err => console.error('Error fetching standard:', err));
    }
  }, [standardId]);

  if (!standard && !standardCode) return null;

  const code = standard?.code || standardCode;
  const description = standard?.description;

  return (
    <div className="inline-block relative">
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-sm font-medium cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Award className="w-3.5 h-3.5" />
        <span>CCSS {code}</span>
        {description && <Info className="w-3 h-3 opacity-60" />}
      </div>

      {showTooltip && description && (
        <div className="absolute z-50 w-80 p-4 bg-neutral-900 text-white text-sm rounded-xl shadow-dramatic bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="font-display font-semibold mb-2">CCSS.MATH.{code}</div>
          <div className="text-neutral-200 leading-relaxed">{description}</div>

          {standard?.domain && (
            <div className="mt-3 pt-3 border-t border-neutral-700 text-xs text-neutral-400">
              <div><strong>Domain:</strong> {standard.domain}</div>
              {standard.cluster && (
                <div className="mt-1"><strong>Cluster:</strong> {standard.cluster}</div>
              )}
            </div>
          )}

          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-neutral-900"></div>
        </div>
      )}
    </div>
  );
};

export default StandardBadge;
