import React from 'react';

const variantStyles = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-soft hover:shadow-card',
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300',
  outline: 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50 active:bg-brand-100',
  ghost: 'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
  danger: 'bg-coral-500 text-white hover:bg-coral-600 active:bg-coral-700',
};

const roleStyles = {
  teacher: 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800',
  student: 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800',
  parent: 'bg-plum-600 hover:bg-plum-700 active:bg-plum-800',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-base gap-2',
  lg: 'px-7 py-3.5 text-lg gap-2.5',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  role,
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  const colorStyles = role
    ? `${roleStyles[role]} text-white shadow-soft hover:shadow-card`
    : variantStyles[variant];

  return (
    <button
      className={`${baseStyles} ${colorStyles} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {icon && !loading && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
};

export default Button;
