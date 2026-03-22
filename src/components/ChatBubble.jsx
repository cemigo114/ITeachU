import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2 } from 'lucide-react';
import LumoMascot from './LumoMascot';

const ChatBubble = ({ message, emotion, isTyping = false, index = 0 }) => {
  if (isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex gap-3 items-start"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex-shrink-0"
        >
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden shadow-lg border-2 border-teal-500">
            <LumoMascot emotion="thinking" size="small" />
          </div>
        </motion.div>
        <div className="flex-1">
          <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-lg border border-neutral-200 inline-block">
            <div className="flex gap-1.5">
              {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay }}
                  className="w-2.5 h-2.5 bg-brand-600 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.05 }}
      className={`flex gap-3 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: index * 0.05 }}
          className="flex-shrink-0"
        >
          <motion.div
            animate={emotion === 'excited' ? { rotate: [0, -8, 8, -4, 4, 0] } : { rotate: 0 }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.5, delay: index * 0.05 + 0.1 }}
          >
            <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden shadow-lg border-2 transition-colors ${
              emotion === 'excited' ? 'border-coral-500' : 'border-teal-500'
            }`}>
              <LumoMascot emotion={emotion || 'curious'} size="small" />
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
        <motion.div
          initial={{ opacity: 0, x: isUser ? 10 : -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 20, delay: index * 0.05 + 0.1 }}
          className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg border ${
            isUser
              ? 'bg-teal-600 text-white rounded-br-sm border-teal-500'
              : emotion === 'excited'
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-orange-100 rounded-tl-sm'
                : 'bg-white border-neutral-200 rounded-tl-sm'
          }`}
        >
          <p className={`whitespace-pre-wrap text-[0.9375rem] leading-relaxed font-body ${
            isUser ? 'text-white' : 'text-neutral-800'
          }`}>
            {message.content}
          </p>
        </motion.div>

        {!isUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: index * 0.05 + 0.2 }}
            className="flex-shrink-0 self-center"
          >
            <button className="bg-brand-600 hover:bg-brand-700 text-white shadow-md h-8 w-8 rounded-full flex items-center justify-center transition-colors">
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatBubble;
