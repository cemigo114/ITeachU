import React from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({
  value,
  onChange,
  onSend,
  placeholder = 'Type your message...',
  disabled = false,
  loading = false,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading && value.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-neutral-200 bg-white p-4 rounded-b-2xl">
      <div className="flex gap-3 items-end">
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          className="flex-1 px-4 py-3 border border-neutral-300 rounded-xl bg-neutral-50 text-neutral-900 font-body
            placeholder:text-neutral-400 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white
            hover:border-neutral-400
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={onSend}
          disabled={loading || !value.trim()}
          className="flex-shrink-0 p-3 bg-teal-600 text-white rounded-xl
            hover:bg-teal-700 active:bg-teal-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-soft hover:shadow-card
            focus-ring"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
