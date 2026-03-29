import React, { useState, useEffect } from 'react';
import { Volume2, Pencil, User } from 'lucide-react';
import { motion } from 'motion/react';
import LumoMascot from './LumoMascot';

const ChatBubble = ({
  message,
  mood = 'curious',
  isTyping = false,
  role = 'assistant',
  messageIndex,
  onEditSave,
  editDisabled = false,
  labels = {},
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message?.content || message?.text || '');

  useEffect(() => {
    if (!isEditing) setDraft(message?.content || message?.text || '');
  }, [message?.content, message?.text, isEditing]);

  if (isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex gap-3 items-start"
      >
        <div className="flex-shrink-0">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden shadow-lg border-2 border-[#00A896]">
            <LumoMascot emotion="thinking" size="small" />
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-lg border border-gray-200 inline-block">
            <div className="flex gap-1.5">
              {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay }}
                  className="w-2.5 h-2.5 bg-[#0A4D8C] rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (role === 'user') {
    const text = message.content || message.text;
    const handleSave = async () => {
      const next = draft.trim();
      if (!next || next === text) {
        setIsEditing(false);
        setDraft(text);
        return;
      }
      if (onEditSave) await onEditSave(messageIndex, next);
      setIsEditing(false);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="flex gap-3 items-start flex-row-reverse"
      >
        <div className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-[#0A4D8C] to-[#00A896] flex items-center justify-center text-white shadow-md border-2 border-white" title={labels.you || 'You'}>
          <User className="h-5 w-5 md:h-5 md:w-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col items-end gap-1.5">
          <div className="rounded-2xl rounded-tr-sm p-3 shadow-md border border-[#00A896]/25 bg-gradient-to-br from-[#e6f7f4] to-[#d8f0ff] max-w-[95%]">
            {isEditing ? (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={Math.min(6, Math.max(2, Math.ceil(draft.length / 48)))}
                  className="w-full text-sm md:text-base text-gray-800 leading-relaxed bg-white/80 rounded-lg border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-[#00A896]/30 resize-y min-h-[3rem]"
                  disabled={editDisabled}
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setDraft(text); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    {labels.cancelEdit || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={editDisabled || !draft.trim()}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#00A896] text-white hover:bg-[#00A896]/90 disabled:opacity-50"
                  >
                    {labels.saveEdit || 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm md:text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{text}</p>
            )}
          </div>
          {!isEditing && onEditSave != null && (
            <button
              type="button"
              onClick={() => { setDraft(text); setIsEditing(true); }}
              disabled={editDisabled}
              className="flex items-center gap-1 text-xs text-[#0A4D8C]/80 hover:text-[#0A4D8C] disabled:opacity-40"
            >
              <Pencil className="h-3 w-3" />
              {labels.editMessage || 'Edit'}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  const isExcited = mood === 'excited';

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

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
        <motion.div
          animate={isExcited ? { rotate: [0, -8, 8, -4, 4, 0] } : { rotate: 0 }}
          transition={{ type: 'tween', ease: 'easeInOut', duration: 0.5 }}
        >
          <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden shadow-lg border-2 transition-colors ${isExcited ? 'border-[#FF6B4A]' : 'border-[#00A896]'}`}>
            <LumoMascot emotion={mood || 'curious'} size="small" />
          </div>
        </motion.div>
      </motion.div>

      <div className="flex-1 flex items-start gap-2">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.1 }}
          className={`flex-1 rounded-2xl rounded-tl-sm p-3 shadow-lg border ${isExcited ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-orange-100' : 'bg-white border-gray-200'}`}
        >
          <p className="text-sm md:text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{message.content || message.text}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
          className="flex-shrink-0 self-center"
        >
          <button
            type="button"
            onClick={() => handleSpeak(message.content || message.text)}
            className="bg-[#0A4D8C] hover:bg-[#0A4D8C]/90 text-white shadow-md h-8 w-8 rounded-full flex items-center justify-center transition-colors"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ChatBubble;
