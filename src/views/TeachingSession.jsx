import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, Globe, ChevronDown, Check, MessageCircle, Eye, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { t } from '../utils/translations';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import TeachingProgressBar from '../components/TeachingProgressBar';
import LumoMascot from '../components/LumoMascot';

const getEmotionFromContent = (content) => {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('?') || lowerContent.includes('confused')) return 'confused';
  if (lowerContent.includes('!') && (lowerContent.includes('oh') || lowerContent.includes('wow'))) return 'excited';
  if (lowerContent.includes('thank') || lowerContent.includes('helpful')) return 'encouraging';
  if (lowerContent.includes('hmm') || lowerContent.includes('let me think')) return 'thinking';
  if (lowerContent.includes('i understand') || lowerContent.includes('makes sense')) return 'confident';
  if (lowerContent.includes('can you') || lowerContent.includes('explain')) return 'listening';
  return 'curious';
};

const getMessageEmotion = (msg) => (msg.role === 'assistant' ? getEmotionFromContent(msg.content) : null);

const LANGUAGES = [
  { code: 'en', name: 'English', emoji: '🇬🇧' },
  { code: 'es', name: 'Español', emoji: '🇪🇸' },
];

const TeachingSession = ({
  task,
  messages,
  input,
  setInput,
  loading,
  onSendMessage,
  onCompleteSession,
  onBack,
  progress,
  language,
  setLanguage,
  getTaskField,
}) => {
  const messagesEndRef = useRef(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [completionFlash, setCompletionFlash] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const chatTintEmotion = useMemo(() => {
    if (loading) return 'thinking';
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return 'curious';
    return getMessageEmotion(lastAssistant) || 'curious';
  }, [messages, loading]);

  const handleCompleted = () => {
    setCompletionFlash(true);
    setTimeout(() => {
      setCompletionFlash(false);
      setIsCompleted(true);
      setTimeout(() => setShowPostOptions(true), 600);
    }, 700);
    onCompleteSession();
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-neutral-50 font-body flex items-center justify-center p-6 view-enter">
        <Card variant="elevated" padding="lg" className="max-w-md w-full text-center animate-fade-in">
          <h2 className="text-2xl font-display font-bold text-coral-600 mb-2">Task Not Found</h2>
          <p className="text-neutral-600 mb-6 font-body">We could not load this task. Try returning to your dashboard.</p>
          <Button role="student" onClick={onBack}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col overflow-hidden">

      {/* Header — matching Figma's gradient bar */}
      <div className="bg-gradient-to-r from-[#0A4D8C] to-[#00A896] px-4 md:px-8 py-4 md:py-5 shadow-lg relative flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-white truncate">
              {getTaskField(task, 'title', language)}
            </h1>
            <p className="text-xs md:text-sm text-white/90">
              {task.grade} • {task.standard}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {/* Language Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full h-9 px-3 flex items-center gap-1.5 transition-colors text-sm font-medium"
              >
                <Globe className="h-4 w-4" />
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showLanguageDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden z-50"
                  >
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setShowLanguageDropdown(false); }}
                        className={`w-full px-4 py-2.5 text-left hover:bg-neutral-100 transition-colors flex items-center gap-3 ${
                          language === lang.code ? 'bg-brand-50 text-brand-700 font-medium' : 'text-neutral-700'
                        }`}
                      >
                        <span className="text-lg">{lang.emoji}</span>
                        <span className="text-sm">{lang.name}</span>
                        {language === lang.code && <span className="ml-auto text-teal-600">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={onBack}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full h-9 px-4 text-sm font-medium transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area — Figma responsive layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Lumo Chat Panel — Left sidebar on desktop, top panel on mobile */}
        <div className="bg-white border-b md:border-b-0 md:border-r border-neutral-200 shadow-md flex-shrink-0 md:w-80 lg:w-96">
          <div className={`overflow-y-auto p-4 space-y-3 h-44 md:h-full custom-scrollbar transition-colors duration-300 emotion-tint-${chatTintEmotion}`}>
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <ChatBubble
                  key={idx}
                  message={msg}
                  emotion={getMessageEmotion(msg)}
                  isTyping={false}
                  index={idx}
                />
              ))}
            </AnimatePresence>
            {loading && <ChatBubble isTyping />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Whiteboard/Content + Input Panel — Right area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Content Area (task + progress) */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-4">
              {/* Task image + description in whiteboard style */}
              <div
                className="bg-white rounded-2xl shadow-2xl border-2 border-neutral-200 relative overflow-hidden"
                style={{
                  backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              >
                <div className="p-6 md:p-8 space-y-6">
                  {/* Task header */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-card border border-neutral-200">
                      <img
                        src={task.imageUrl}
                        alt={getTaskField(task, 'title', language)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-display font-bold text-neutral-900">
                        {getTaskField(task, 'title', language)}
                      </h2>
                      <p
                        className="text-neutral-600 mt-2 leading-relaxed"
                        style={{
                          fontFamily: "'Kalam', cursive",
                          fontSize: '18px',
                          lineHeight: '2',
                        }}
                      >
                        {getTaskField(task, 'description', language)}
                      </p>
                    </div>
                  </div>

                  {/* Teaching tips in handwriting style */}
                  <div className="border-t border-neutral-200 pt-6">
                    <h3 className="font-display font-semibold mb-3 flex items-center gap-2 text-brand-800">
                      <Lightbulb className="w-5 h-5 text-brand-600 shrink-0" aria-hidden />
                      {t(language, 'teachingTips')}
                    </h3>
                    <ul
                      className="text-brand-700 space-y-1 list-none pl-0"
                      style={{
                        fontFamily: "'Kalam', cursive",
                        fontSize: '16px',
                        lineHeight: '2',
                      }}
                    >
                      <li>• {t(language, 'tip1')}</li>
                      <li>• {t(language, 'tip2')}</li>
                      <li>• {t(language, 'tip3')}</li>
                      <li>• {t(language, 'tip4')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <TeachingProgressBar
                turnCount={progress.turnCount}
                evidenceCollected={progress.evidenceCollected}
                language={language}
              />
            </div>
          </div>

          {/* Input Panel — Below content, matching Figma's bottom bar */}
          <div className="flex-shrink-0">
            {/* Post-completion panel */}
            <AnimatePresence>
              {showPostOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="mx-4 md:mx-8 mb-2 rounded-2xl overflow-hidden border border-teal-500/30 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #f0fafa 0%, #e8f4ff 100%)' }}
                >
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-teal-500/20">
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                    >
                      <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center shadow-md">
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      </div>
                    </motion.div>
                    <p className="text-sm text-brand-700 font-medium">Great thinking — what would you like to do next?</p>
                  </div>
                  <div className="p-3 flex flex-col sm:flex-row gap-2">
                    {[
                      { label: 'Continue Explaining', sub: 'Add more to your explanation', icon: <MessageCircle className="h-4 w-4" />, color: '#0A4D8C', handler: () => { setIsCompleted(false); setShowPostOptions(false); }, delay: 0.15 },
                      { label: 'Review Thinking', sub: 'Look back at what you wrote', icon: <Eye className="h-4 w-4" />, color: '#00A896', handler: () => { setIsCompleted(false); setShowPostOptions(false); }, delay: 0.22 },
                      { label: 'View Feedback', sub: 'See your results', icon: <Sparkles className="h-4 w-4" />, color: '#FF6B4A', handler: onBack, delay: 0.29 },
                    ].map(opt => (
                      <motion.button
                        key={opt.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: opt.delay }}
                        onClick={opt.handler}
                        className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border transition-all duration-200 group shadow-sm text-left hover:shadow-card"
                        style={{ borderColor: `${opt.color}30`, color: opt.color }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors" style={{ backgroundColor: `${opt.color}15` }}>
                          {opt.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{opt.label}</p>
                          <p className="text-xs opacity-60 truncate">{opt.sub}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-40" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showPostOptions && (
              <ChatInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onSend={onSendMessage}
                placeholder={t(language, 'typeMessage')}
                disabled={loading || isCompleted}
                loading={loading}
              />
            )}

            {/* Completed button */}
            <div className="px-4 md:px-8 pb-4">
              <div className="max-w-4xl mx-auto border-t border-neutral-200 pt-4">
                <AnimatePresence mode="wait">
                  {!isCompleted ? (
                    <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <motion.button
                        onClick={handleCompleted}
                        disabled={messages.length === 0 || completionFlash}
                        whileHover={messages.length > 0 ? { scale: 1.01 } : {}}
                        whileTap={messages.length > 0 ? { scale: 0.98 } : {}}
                        className={`w-full h-12 md:h-14 rounded-2xl flex items-center justify-center gap-3 text-white shadow-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                          completionFlash
                            ? 'bg-teal-600'
                            : 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {completionFlash ? (
                            <motion.div key="f" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                              className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center"
                            >
                              <Check className="h-4 w-4 text-white" strokeWidth={3} />
                            </motion.div>
                          ) : (
                            <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="w-6 h-6 rounded-full border-2 border-white/50 flex items-center justify-center"
                            >
                              <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <span className="text-base font-medium tracking-wide">
                          {completionFlash ? 'Nice work!' : t(language, 'completeSession')}
                        </span>
                      </motion.button>
                      <p className="text-xs text-center text-neutral-400 mt-2">
                        Tap when you're done teaching Lumo
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 py-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-teal-600 font-medium">Completed</span>
                      <button
                        onClick={() => { setIsCompleted(false); setShowPostOptions(false); }}
                        className="ml-2 text-xs text-neutral-400 hover:text-neutral-600 underline underline-offset-2"
                      >
                        undo
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeachingSession;
