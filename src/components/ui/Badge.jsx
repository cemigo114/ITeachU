import React from 'react';

const variantStyles = {
  default: 'bg-surface text-ink-soft',
  brand: 'bg-sage-pale text-sage-deep',
  teal: 'bg-sage-pale text-sage-deep',
  coral: 'bg-coral-pale text-coral',
  plum: 'bg-plum-100 text-plum-700',
  success: 'bg-sage-pale text-sage-deep',
  warning: 'bg-coral-pale text-coral',
  info: 'bg-sage-pale text-sage-deep',
};

const statusStyles = {
  completed: 'bg-sage-pale text-sage-deep',
  in_progress: 'bg-amber-pale text-amber-deep',
  pending: 'bg-surface text-muted',
  assigned: 'bg-sage-pale text-sage-deep',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-sm',
};

const Badge = ({
  children,
  variant = 'default',
  status,
  size = 'md',
  icon,
  className = '',
}) => {
  const colorStyles = status ? statusStyles[status] || statusStyles.pending : variantStyles[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${colorStyles} ${sizeStyles[size]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children || (status && status.replace('_', ' '))}
    </span>
  );
};

export default Badge;
