import React from 'react';
import katex from 'katex';

const INLINE_MATH_RE = /\$([^$]+?)\$/g;

function renderSegments(text) {
  const parts = [];
  let lastIndex = 0;
  let match;

  INLINE_MATH_RE.lastIndex = 0;
  while ((match = INLINE_MATH_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    try {
      const html = katex.renderToString(match[1], {
        throwOnError: false,
        displayMode: false,
      });
      parts.push({ type: 'math', html });
    } catch {
      parts.push({ type: 'text', value: match[0] });
    }
    lastIndex = INLINE_MATH_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

/**
 * Renders text with inline LaTeX math ($...$) using KaTeX.
 * Falls back to raw text if KaTeX can't parse an expression.
 */
const MathText = ({ children, className = '' }) => {
  if (!children || typeof children !== 'string') {
    return <span className={className}>{children}</span>;
  }

  if (!INLINE_MATH_RE.test(children)) {
    return <span className={className}>{children}</span>;
  }

  const segments = renderSegments(children);

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.type === 'math' ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />
        ) : (
          <React.Fragment key={i}>{seg.value}</React.Fragment>
        )
      )}
    </span>
  );
};

export default MathText;
