import React from 'react';

const variantStyles = {
  default: 'bg-neutral-100 text-neutral-700',
  brand: 'bg-brand-100 text-brand-700',
  teal: 'bg-teal-100 text-teal-700',
  coral: 'bg-coral-100 text-coral-700',
  plum: 'bg-plum-100 text-plum-700',
  success: 'bg-teal-100 text-teal-700',
  warning: 'bg-coral-100 text-coral-700',
  info: 'bg-brand-100 text-brand-700',
};

const statusStyles = {
  completed: 'bg-teal-100 text-teal-700',
  in_progress: 'bg-coral-100 text-coral-800',
  pending: 'bg-neutral-100 text-neutral-600',
  assigned: 'bg-brand-100 text-brand-700',
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
