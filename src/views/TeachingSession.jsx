import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Check, Globe, ChevronDown, MessageCircle, Eye, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { t } from '../utils/translations';
import { WhiteboardPanel } from '../components/WhiteboardPanel';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import { useThinkingChunks } from '../hooks/useThinkingChunks';
import { useZippyPerception } from '../hooks/useZippyPerception';
import LanguageSelector from '../components/LanguageSelector';

// Design tokens from prototype
const colors = {
  zippy: 'oklch(60% 0.18 15)',
  zippyDeep: 'oklch(42% 0.15 15)',
  zippyPale: 'oklch(97% 0.03 15)',
  sage: 'oklch(49% 0.08 162)',
  sageDeep: 'oklch(35% 0.07 162)',
  ink: 'oklch(17% 0.01 170)',
  inkSoft: 'oklch(30% 0.01 170)',
  muted: 'oklch(55% 0.015 170)',
  border: 'oklch(90% 0.012 170)',
  white: '#ffffff',
  studentBg: 'oklch(98.5% 0.008 15)',
};

function TaskCard({ title, subtitle }) {
  return (
    <div className="flex-shrink-0 px-4 pt-3 pb-2.5 border-b border-gray-100 bg-white">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0 text-xl shadow-sm">
          🤖
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight truncate" style={{ color: colors.ink }}>{title}</p>
          <p className="text-xs italic mt-0.5" style={{ color: colors.muted }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

const TeachingSession = ({
  task,
  messages,
  input,
  setInput,
  loading,
  onSendMessage,
  onEditUserMessage,
  onCompleteSession,
  onBack,
  progress,
  language,
  setLanguage,
  getTaskField,
}) => {
  const tl = (key) => t(language, key);

  const [whiteboardItems, setWhiteboardItems] = useState([]);
  const [drawingStrokes, setDrawingStrokes] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [selectedItemForRevision, setSelectedItemForRevision] = useState(null);
  const [revisionCount, setRevisionCount] = useState(0);

  const [localZippyExtras, setLocalZippyExtras] = useState([]);
  const [currentZippyMood, setCurrentZippyMood] = useState('confused');
  const [showThinkingDots, setShowThinkingDots] = useState(false);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribingWords, setTranscribingWords] = useState([]);

  const [isCompleted, setIsCompleted] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [completionFlash, setCompletionFlash] = useState(false);

  const messagesEndRef = useRef(null);
  const whiteboardEndRef = useRef(null);

  const perception = useZippyPerception(whiteboardItems, drawingStrokes, isTranscribing);
  const thinkingChunks = useThinkingChunks(
    drawingStrokes, whiteboardItems, isTranscribing,
    { inactivityDelay: 10000, enabled: !isCompleted }
  );

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant) setCurrentZippyMood(detectMood(lastAssistant.content));
  }, [messages]);

  const prevLoadingRef = useRef(loading);
  useEffect(() => {
    if (prevLoadingRef.current && !loading) setShowThinkingDots(false);
    prevLoadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (perception.isListening) setCurrentZippyMood('listening');
  }, [perception.isListening]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, localZippyExtras, showThinkingDots]);

  function detectMood(content) {
    const lower = (content || '').toLowerCase();
    if (lower.includes('!') && (lower.includes('oh') || lower.includes('wow') || lower.includes('get it'))) return 'excited';
    if (lower.includes('?') || lower.includes('confused')) return 'curious';
    if (lower.includes('hmm') || lower.includes('think')) return 'thinking';
    return 'curious';
  }

  const handleEditUserMessage = useCallback(async (messageIndex, newContent) => {
    setLocalZippyExtras([]);
    await onEditUserMessage(messageIndex, newContent);
  }, [onEditUserMessage]);

  const handleShareWithZippy = () => {
    const chunk = thinkingChunks.captureThinkingChunk();
    if (!chunk) return;

    const drawingIds = chunk.drawings.map(d => d.id);
    const textIds = chunk.textItems.map(ti => ti.id);
    setDrawingStrokes(prev => prev.map(s => drawingIds.includes(s.id) ? { ...s, wasCaptured: true } : s));
    setWhiteboardItems(prev => prev.map(i => textIds.includes(i.id) ? { ...i, wasCaptured: true } : i));

    setShowThinkingDots(true);
    setCurrentZippyMood('thinking');

    setTimeout(() => {
      const contextMsg = perception.generateContextualMessage();
      setShowThinkingDots(false);
      if (contextMsg) {
        setCurrentZippyMood(contextMsg.mood);
        setLocalZippyExtras(prev => [...prev, { id: `ctx-${Date.now()}`, ...contextMsg, content: contextMsg.text }]);
        if (contextMsg.referencedDrawingId) {
          perception.highlightDrawing(contextMsg.referencedDrawingId);
          setTimeout(() => perception.clearHighlight(), 5000);
        }
      } else {
        const fallback = [
          { text: "Interesting! Can you tell me more about how you're thinking about this?", mood: 'curious' },
          { text: "I see what you're showing me. How does this connect to the problem?", mood: 'thinking' },
          { text: "This is helpful! Can you explain one more part?", mood: 'curious' },
        ];
        const r = fallback[Math.floor(Math.random() * fallback.length)];
        setCurrentZippyMood(r.mood);
        setLocalZippyExtras(prev => [...prev, { id: Date.now().toString(), ...r, content: r.text, timestamp: new Date() }]);
      }
    }, 1200);
  };

  const handleTextSubmit = () => {
    if (!input.trim()) return;
    const currentInput = input;

    if (selectedItemForRevision) {
      const newItem = {
        id: Date.now().toString(),
        type: 'text',
        content: `${currentInput} (revised)`,
        isActive: true,
        revisionNumber: revisionCount + 1,
        revisedFrom: selectedItemForRevision,
      };
      setWhiteboardItems(prev => [
        ...prev.map(it => it.id === selectedItemForRevision ? { ...it, isActive: false } : it),
        newItem,
      ]);
      setRevisionCount(c => c + 1);
      setSelectedItemForRevision(null);
    }

    setShowThinkingDots(true);
    setCurrentZippyMood('thinking');

    onSendMessage(currentInput);
  };

  const handleVoiceTranscript = (transcript, isInterim) => {
    if (isInterim) {
      const t = transcript.trim();
      if (!t) {
        setIsTranscribing(false);
        setTranscribingWords([]);
        return;
      }
      setIsTranscribing(true);
      setTranscribingWords(t.split(/\s+/).filter(Boolean));
    } else {
      setTranscribingWords([]);
      setIsTranscribing(false);

      if (!transcript.trim()) return;

      setShowThinkingDots(true);
      setCurrentZippyMood('thinking');
      onSendMessage(transcript);
    }
  };

  const handleReviseItem = (itemId) => {
    setSelectedItemForRevision(itemId);
    const item = whiteboardItems.find(i => i.id === itemId);
    if (item) setInput(item.content.replace(' (revised)', ''));
  };

  const handleEraseItem = (itemId) => {
    setWhiteboardItems(prev =>
      prev.map(item => item.id === itemId ? { ...item, isActive: false } : item)
    );
  };

  const getActiveContent = () => [
    ...whiteboardItems.filter(i => i.isActive),
    ...drawingStrokes.filter(s => s.isActive),
  ];

  const handleCompleted = () => {
    setCompletionFlash(true);
    setTimeout(() => {
      setCompletionFlash(false);
      setIsCompleted(true);
      setCurrentZippyMood('excited');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFE16B', '#00A896', '#0A4D8C', '#FF6B4A'],
      });
      setLocalZippyExtras(prev => [...prev, {
        id: `done-${Date.now()}`,
        text: tl('completedZippyMessage'),
        content: tl('completedZippyMessage'),
        mood: 'excited',
        timestamp: new Date(),
      }]);
      setTimeout(() => setShowPostOptions(true), 600);
    }, 700);
  };

  const handleContinueExplaining = () => { setIsCompleted(false); setShowPostOptions(false); };
  const handleReviewThinking = () => { setShowHistory(true); setIsCompleted(false); setShowPostOptions(false); };
  const handleNewProblem = () => {
    setWhiteboardItems([]); setDrawingStrokes([]);
    setRevisionCount(0); setIsCompleted(false); setShowPostOptions(false);
    setCurrentZippyMood('confused');
    setLocalZippyExtras([]);
  };

  if (!task) {
    return (
      <div className="min-h-screen font-body flex items-center justify-center p-6" style={{ background: colors.studentBg }}>
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-card p-8">
          <h2 className="text-2xl font-display font-bold mb-2" style={{ color: colors.zippy }}>Task Not Found</h2>
          <p className="mb-6" style={{ color: colors.muted }}>We could not load this task. Try returning to your dashboard.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 text-white rounded-xl transition-colors"
            style={{ background: colors.sage }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden font-body" style={{ background: colors.studentBg }}>

      {/* ====== ZIPPY HEADER ====== */}
      <div
        className="flex items-center gap-3 px-6 py-3.5 flex-shrink-0"
        style={{ background: colors.white, borderBottom: `1px solid ${colors.border}` }}
      >
        {/* Zippy avatar */}
        <div
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${colors.zippy} 0%, ${colors.zippyDeep} 100%)`,
            boxShadow: `0 2px 8px oklch(60% 0.18 15 / 0.35)`,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="3" y="7" width="16" height="11" rx="3" fill="white" opacity="0.25"/>
            <rect x="3" y="7" width="16" height="11" rx="3" stroke="white" strokeWidth="1.3"/>
            <circle cx="8" cy="12" r="2" fill="white"/>
            <circle cx="14" cy="12" r="2" fill="white"/>
            <rect x="9" y="4" width="4" height="4" rx="1" fill="white" opacity="0.5"/>
            <rect x="10.5" y="3" width="1" height="2" fill="white" opacity="0.5"/>
          </svg>
        </div>

        {/* Zippy info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold" style={{ letterSpacing: '-0.01em' }}>Zippy</h3>
          <span className="text-[11px]" style={{ color: colors.muted }}>
            Your AI learning buddy &middot; a little confused today
          </span>
        </div>

        {/* Task chip */}
        <div
          className="hidden sm:block ml-auto rounded-lg px-3 py-1.5 text-[11px] font-semibold flex-shrink-0"
          style={{
            background: colors.zippyPale,
            border: '1px solid oklch(60% 0.18 15 / 0.3)',
            color: colors.zippyDeep,
          }}
        >
          {task.standard || '7.RP.A.2'} &middot; {getTaskField(task, 'title', language) || 'Unit Rate'}
        </div>

        {/* Back / Language */}
        <div className="flex items-center gap-2 ml-2">
          <LanguageSelector language={language} setLanguage={setLanguage} />
          <button
            onClick={onBack}
            className="text-xs transition-colors px-2 py-1 rounded"
            style={{ color: colors.muted }}
          >
            &larr; Back
          </button>
        </div>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Chat Panel — takes majority of space */}
        <div className="bg-white border-b md:border-b-0 md:border-r flex-1 flex flex-col"
          style={{ borderColor: colors.border }}
        >
          <div className="overflow-y-auto p-4 space-y-3 h-40 md:h-auto md:flex-1" style={{ minHeight: 0 }}>
            <AnimatePresence>
              {messages.map((m, i) => (
                m.role === 'user' ? (
                  <ChatBubble
                    key={`msg-user-${i}`}
                    role="user"
                    message={{ content: m.content }}
                    messageIndex={i}
                    onEditSave={handleEditUserMessage}
                    editDisabled={loading || isCompleted}
                    labels={{
                      you: tl('you'),
                      editMessage: tl('editMessage'),
                      saveEdit: tl('saveEdit'),
                      cancelEdit: tl('cancelEdit'),
                    }}
                  />
                ) : (
                  <ChatBubble
                    key={`msg-asst-${i}`}
                    role="assistant"
                    message={{ content: m.content }}
                    mood={detectMood(m.content)}
                    labels={{ learningMoment: tl('learningMomentLabel') }}
                  />
                )
              ))}
              {localZippyExtras.map((message) => (
                <ChatBubble
                  key={message.id}
                  role="assistant"
                  message={message}
                  mood={message.mood || currentZippyMood}
                  labels={{ learningMoment: tl('learningMomentLabel') }}
                />
              ))}
            </AnimatePresence>

            {showThinkingDots && <ChatBubble isTyping />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Right Panel: Whiteboard (locked) + Input */}
        <div className="hidden md:flex flex-col overflow-hidden flex-shrink-0" style={{ width: '340px' }}>

          {/* Whiteboard — locked with "Coming soon" overlay */}
          <div className="flex-1 relative overflow-hidden" style={{ background: colors.studentBg }}>
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <WhiteboardPanel
                whiteboardItems={whiteboardItems}
                showHistory={showHistory}
                isCompleted={isCompleted}
                isTranscribing={isTranscribing}
                transcribingWords={transcribingWords}
                onReviseItem={handleReviseItem}
                onEraseTextItem={handleEraseItem}
                drawingStrokes={drawingStrokes}
                onDrawingStrokesChange={setDrawingStrokes}
                whiteboardEndRef={whiteboardEndRef}
                t={tl}
                highlightedDrawingId={perception.highlightedDrawingId}
                showShareButton={false}
                isActivelyWorking={false}
                onShareWithZippy={() => {}}
              />
            </div>
            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.06)' }}
                >
                  <Lock className="w-5 h-5" style={{ color: colors.muted }} />
                </div>
                <p className="text-sm font-medium" style={{ color: colors.inkSoft }}>
                  Canvas
                </p>
                <p className="text-xs mt-1 px-8" style={{ color: colors.muted }}>
                  Coming soon
                </p>
              </div>
            </div>
          </div>

          {/* Input Panel */}
          <div className="flex-shrink-0" style={{ background: colors.white, borderTop: `1px solid ${colors.border}` }}>
            <div className="p-4 md:px-8 md:py-5">

              {/* Post-completion options */}
              <AnimatePresence>
                {showPostOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="mb-4 rounded-2xl overflow-hidden border shadow-lg max-w-4xl mx-auto"
                    style={{
                      borderColor: `oklch(49% 0.08 162 / 0.3)`,
                      background: `linear-gradient(135deg, oklch(96% 0.025 162 / 0.5) 0%, oklch(97% 0.03 75 / 0.5) 100%)`,
                    }}
                  >
                    <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid oklch(49% 0.08 162 / 0.2)` }}>
                      <motion.div
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-md" style={{ background: colors.sage }}>
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </div>
                      </motion.div>
                      <p className="text-sm font-medium" style={{ color: colors.ink }}>Great thinking -- what would you like to do next?</p>
                    </div>
                    <div className="p-3 flex flex-col sm:flex-row gap-2">
                      {[
                        { label: tl('continueExplaining'), sub: 'Add more to your explanation', icon: <MessageCircle className="h-4 w-4" />, color: colors.sage, handler: handleContinueExplaining, delay: 0.15 },
                        { label: tl('reviewThinking'), sub: 'Look back at what you wrote', icon: <Eye className="h-4 w-4" />, color: colors.zippy, handler: handleReviewThinking, delay: 0.22 },
                        { label: tl('newProblem'), sub: 'Try a fresh challenge', icon: <Sparkles className="h-4 w-4" />, color: colors.amber, handler: handleNewProblem, delay: 0.29 },
                      ].map(opt => (
                        <motion.button
                          key={opt.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: opt.delay }}
                          onClick={opt.handler}
                          className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border transition-all duration-200 group shadow-sm text-left hover:shadow-md"
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

              {/* Input controls */}
              <div className="max-w-4xl mx-auto">
                <AnimatePresence>
                  {!showPostOptions && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <ChatInput
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onSend={handleTextSubmit}
                        onVoiceTranscript={handleVoiceTranscript}
                        placeholder={tl('placeholder')}
                        voiceRecordingHint={tl('tapMicWhenDone')}
                        disabled={loading || isCompleted}
                        loading={loading}
                        isRevising={!!selectedItemForRevision}
                        onCancelRevision={() => { setSelectedItemForRevision(null); setInput(''); }}
                      />

                      {!isTranscribing && getActiveContent().length === 0 && !messages.some(m => m.role === 'user') && (
                        <p className="text-center text-xs mt-3" style={{ color: colors.muted }}>{tl('hint')}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Complete task button */}
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
                  <AnimatePresence mode="wait">
                    {!isCompleted ? (
                      <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <motion.button
                          onClick={handleCompleted}
                          disabled={(!messages.some(m => m.role === 'user') && getActiveContent().length === 0) || completionFlash}
                          whileHover={(messages.some(m => m.role === 'user') || getActiveContent().length > 0) ? { scale: 1.01 } : {}}
                          whileTap={(messages.some(m => m.role === 'user') || getActiveContent().length > 0) ? { scale: 0.98 } : {}}
                          className="w-full h-12 md:h-14 rounded-2xl flex items-center justify-center gap-3 text-white shadow-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            background: completionFlash
                              ? colors.sage
                              : `linear-gradient(135deg, ${colors.zippy}, ${colors.zippyDeep})`,
                            boxShadow: `0 2px 8px oklch(60% 0.18 15 / 0.3)`,
                          }}
                        >
                          <AnimatePresence mode="wait">
                            {completionFlash ? (
                              <motion.div key="f" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" strokeWidth={3} />
                              </motion.div>
                            ) : (
                              <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-6 h-6 rounded-full border-2 border-white/50 flex items-center justify-center">
                                <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <span className="text-base font-medium tracking-wide">
                            {completionFlash ? 'Nice work!' : 'Complete task \u2014 review your work \u2192'}
                          </span>
                        </motion.button>
                        <p className="text-xs text-center mt-2" style={{ color: colors.muted }}>{tl('completedSubtitle')}</p>
                      </motion.div>
                    ) : (
                      <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 py-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: colors.sage }}>
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: colors.sage }}>Completed</span>
                        <button onClick={() => { setIsCompleted(false); setShowPostOptions(false); }} className="ml-2 text-xs underline underline-offset-2" style={{ color: colors.muted }}>undo</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TeachingSession;
