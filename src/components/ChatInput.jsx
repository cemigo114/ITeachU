import React, { useState } from 'react';
import { Send, Mic, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ChatInput = ({
  value,
  onChange,
  onSend,
  placeholder = 'Type your message...',
  disabled = false,
  loading = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading && value.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="bg-white border-t border-neutral-200 shadow-lg flex-shrink-0">
      <div className="p-4 md:px-8 md:py-5">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={handleVoiceToggle}
                  className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    isRecording
                      ? 'bg-coral-500 hover:bg-coral-600 animate-pulse shadow-lg'
                      : 'border-2 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  <Mic className={`h-4 w-4 md:h-5 md:w-5 ${isRecording ? 'text-white' : 'text-neutral-600'}`} />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled || loading}
                    className="w-full h-12 md:h-14 px-4 md:px-6 pr-12 md:pr-14 rounded-full border-2 border-neutral-300
                      focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none
                      text-sm md:text-base transition-all font-body
                      disabled:opacity-50 disabled:cursor-not-allowed
                      placeholder:text-neutral-400"
                  />
                  <button
                    onClick={onSend}
                    disabled={loading || !value.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 rounded-full
                      bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center transition-all duration-200 shadow-soft"
                  >
                    <Send className="h-3 w-3 md:h-4 md:w-4 text-white" />
                  </button>
                </div>

                <button
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-neutral-300 flex-shrink-0
                    flex items-center justify-center hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-200"
                >
                  <Upload className="h-4 w-4 md:h-5 md:w-5 text-neutral-600" />
                </button>
              </div>

              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 text-sm text-coral-500"
                >
                  <div className="w-2 h-2 bg-coral-500 rounded-full animate-pulse" />
                  <span className="font-medium">Listening...</span>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
