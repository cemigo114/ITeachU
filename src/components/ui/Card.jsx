import React from 'react';

const variantStyles = {
  default: 'bg-white rounded-2xl shadow-soft border border-neutral-200/60',
  elevated: 'bg-white rounded-2xl shadow-card',
  interactive: 'bg-white rounded-2xl shadow-soft border border-neutral-200/60 card-interactive cursor-pointer hover:border-brand-300',
  flat: 'bg-neutral-50 rounded-2xl border border-neutral-200/60',
};

const Card = ({
  children,
  variant = 'default',
  accent,
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const padStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const accentStyles = accent ? `accent-${accent}` : '';

  const isInteractive = variant === 'interactive' || onClick;
  const resolvedVariant = isInteractive && variant === 'default' ? 'interactive' : variant;

  return (
    <div
      className={`${variantStyles[resolvedVariant]} ${padStyles[padding]} ${accentStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); }} : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
