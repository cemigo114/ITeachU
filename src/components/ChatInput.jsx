import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Mic, Upload } from 'lucide-react';
import { motion } from 'motion/react';

const ChatInput = ({
  value,
  onChange,
  onSend,
  onVoiceTranscript,
  placeholder = 'Explain to Zippy... (type, draw, or speak)',
  disabled = false,
  loading = false,
  isRevising = false,
  onCancelRevision,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const interimRef = useRef('');

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final && onVoiceTranscript) {
        onVoiceTranscript(final.trim(), false);
      }
      if (interim && onVoiceTranscript) {
        interimRef.current = interim;
        onVoiceTranscript(interim.trim(), true);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    return recognition;
  }, [onVoiceTranscript]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = initRecognition();
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, initRecognition]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading && value.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={toggleRecording}
          disabled={disabled}
          className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-[#FF6B4A] hover:bg-[#FF6B4A]/90 animate-pulse shadow-lg'
              : 'border-2 border-gray-300 hover:border-gray-400 bg-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Mic className={`h-4 w-4 md:h-5 md:w-5 ${isRecording ? 'text-white' : 'text-gray-600'}`} />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={isRevising ? 'Type your revision...' : placeholder}
            disabled={disabled || loading}
            className="w-full h-12 md:h-14 px-4 md:px-6 pr-12 md:pr-14 rounded-full border-2 border-gray-300 focus:border-[#00A896] focus:ring-2 focus:ring-[#00A896]/20 outline-none text-sm md:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={onSend}
            disabled={loading || !value.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 rounded-full bg-[#00A896] hover:bg-[#00A896]/90 disabled:opacity-50 disabled:cursor-not-allowed p-0 flex items-center justify-center transition-colors"
          >
            <Send className="h-3 w-3 md:h-4 md:w-4 text-white" />
          </button>
        </div>

        <button
          disabled={disabled}
          className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-gray-300 flex-shrink-0 flex items-center justify-center hover:border-gray-400 bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
        </button>
      </div>

      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-sm text-[#FF6B4A]"
        >
          <div className="w-2 h-2 bg-[#FF6B4A] rounded-full animate-pulse" />
          <span className="font-medium">Listening...</span>
        </motion.div>
      )}

      {isRevising && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div className="flex-1 text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200">
            ✏️ Revising — type your updated explanation above
          </div>
          <button
            onClick={onCancelRevision}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            cancel
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ChatInput;
