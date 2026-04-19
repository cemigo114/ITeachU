import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const Toast = ({ message, visible, onDismiss }) => {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-teal-600 text-white px-5 py-3.5 rounded-2xl shadow-elevated animate-slide-up max-w-sm"
    >
      <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden />
      <p className="text-sm font-medium font-body flex-1">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="p-0.5 rounded-lg hover:bg-white/20 active:bg-white/30 transition-colors focus-ring flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
