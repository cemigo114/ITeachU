import React from 'react';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-neutral-700 font-body">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-neutral-900 font-body
            placeholder:text-neutral-400 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-coral-500 focus:ring-coral-500/30 focus:border-coral-500' : 'border-neutral-300 hover:border-neutral-400'}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-coral-600 font-body">{error}</p>
      )}
    </div>
  );
};

const Select = ({
  label,
  value,
  onChange,
  children,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-neutral-700 font-body">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 font-body
          transition-all duration-200 cursor-pointer appearance-none
          focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
          hover:border-neutral-400
          disabled:opacity-50 disabled:cursor-not-allowed"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export { Input, Select };
export default Input;
