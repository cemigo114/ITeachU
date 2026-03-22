import React from 'react';
import { ArrowLeft } from 'lucide-react';

const roleColorStyles = {
  teacher: 'bg-brand-600',
  student: 'bg-teal-600',
  parent: 'bg-plum-600',
  default: 'bg-brand-600',
};

const PageHeader = ({
  title,
  subtitle,
  role = 'default',
  onBack,
  actions,
  children,
  className = '',
}) => {
  return (
    <header className={`${roleColorStyles[role]} text-white shadow-card ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors focus-ring"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm mt-0.5 opacity-80">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
        {children}
      </div>
    </header>
  );
};

export default PageHeader;
