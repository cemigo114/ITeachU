import React from 'react';

export default function ComingSoonBadge({ feature, compact = false }) {
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-amber-deep font-medium"
        style={{ fontSize: '9px', background: 'oklch(97% 0.03 75)', border: '1px solid oklch(64% 0.13 55 / 0.3)' }}
      >
        <span style={{ fontSize: '8px' }}>&#9679;</span>
        Preview
      </span>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-sm"
      style={{ background: 'oklch(97% 0.03 75)', border: '1px solid oklch(64% 0.13 55 / 0.25)' }}
    >
      <span style={{ fontSize: '12px' }}>&#128679;</span>
      <span className="text-amber-deep font-medium" style={{ fontSize: '11px' }}>
        Coming soon: {feature}
      </span>
      <span className="text-muted" style={{ fontSize: '10px' }}>
        — showing sample data
      </span>
    </div>
  );
}
