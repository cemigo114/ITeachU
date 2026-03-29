import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, Globe, ChevronDown, MessageCircle, Eye, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { t } from '../utils/translations';
import { WhiteboardPanel } from '../components/WhiteboardPanel';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import { useThinkingChunks } from '../hooks/useThinkingChunks';
import { useZippyPerception } from '../hooks/useZippyPerception';
import LanguageSelector from '../components/LanguageSelector';

function TaskCard({ title, subtitle }) {
  return (
    <div className="flex-shrink-0 px-4 pt-3 pb-2.5 border-b border-gray-100 bg-white">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0 text-xl shadow-sm">
          🥤
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#0A4D8C] leading-tight truncate">{title}</p>
          <p className="text-xs text-gray-400 italic mt-0.5">{subtitle}</p>
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
    { inactivityDelay: 2000, enabled: !isCompleted }
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
      setIsTranscribing(true);
      setTranscribingWords(transcript.split(' '));
    } else {
      setTranscribingWords([]);
      setIsTranscribing(false);

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
      <div className="min-h-screen bg-neutral-50 font-body flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-card p-8">
          <h2 className="text-2xl font-display font-bold text-coral-600 mb-2">Task Not Found</h2>
          <p className="text-neutral-600 mb-6">We could not load this task. Try returning to your dashboard.</p>
          <button onClick={onBack} className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A4D8C] to-[#00A896] px-4 md:px-8 py-4 md:py-5 shadow-lg relative flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-white/80 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-white">{getTaskField(task, 'title', language)}</h1>
            <p className="text-xs md:text-sm text-white/90">{`${task.grade} • ${task.standard}`}</p>
          </div>
        </div>
        <div className="absolute top-4 right-4 md:top-5 md:right-8">
          <LanguageSelector language={language} setLanguage={setLanguage} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Zippy Sidebar */}
        <div className="bg-white border-b md:border-b-0 md:border-r border-gray-200 shadow-md flex-shrink-0 md:w-80 lg:w-96 flex flex-col">
          <TaskCard
            title={getTaskField(task, 'title', language)}
            subtitle={`Help Zippy understand ${task.standard}`}
          />

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
                  />
                )
              ))}
              {localZippyExtras.map((message) => (
                <ChatBubble
                  key={message.id}
                  role="assistant"
                  message={message}
                  mood={message.mood || currentZippyMood}
                />
              ))}
            </AnimatePresence>

            {showThinkingDots && <ChatBubble isTyping />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Right Panel: Whiteboard + Input */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Whiteboard */}
          <div className="flex-1 flex flex-col overflow-hidden">
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
              showShareButton={thinkingChunks.showShareButton}
              isActivelyWorking={thinkingChunks.isActivelyWorking}
              onShareWithZippy={handleShareWithZippy}
            />
          </div>

          {/* Input Panel */}
          <div className="bg-white border-t border-gray-200 shadow-lg flex-shrink-0">
            <div className="p-4 md:px-8 md:py-5">

              {/* Post-completion options */}
              <AnimatePresence>
                {showPostOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="mb-4 rounded-2xl overflow-hidden border border-[#00A896]/30 shadow-lg max-w-4xl mx-auto"
                    style={{ background: 'linear-gradient(135deg, #f0fafa 0%, #e8f4ff 100%)' }}
                  >
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#00A896]/20">
                      <motion.div
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                      >
                        <div className="w-7 h-7 rounded-full bg-[#00A896] flex items-center justify-center shadow-md">
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </div>
                      </motion.div>
                      <p className="text-sm text-[#0A4D8C] font-medium">Great thinking — what would you like to do next?</p>
                    </div>
                    <div className="p-3 flex flex-col sm:flex-row gap-2">
                      {[
                        { label: tl('continueExplaining'), sub: 'Add more to your explanation', icon: <MessageCircle className="h-4 w-4" />, color: '#0A4D8C', handler: handleContinueExplaining, delay: 0.15 },
                        { label: tl('reviewThinking'), sub: 'Look back at what you wrote', icon: <Eye className="h-4 w-4" />, color: '#00A896', handler: handleReviewThinking, delay: 0.22 },
                        { label: tl('newProblem'), sub: 'Try a fresh challenge', icon: <Sparkles className="h-4 w-4" />, color: '#FF6B4A', handler: handleNewProblem, delay: 0.29 },
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
                        disabled={loading || isCompleted}
                        loading={loading}
                        isRevising={!!selectedItemForRevision}
                        onCancelRevision={() => { setSelectedItemForRevision(null); setInput(''); }}
                      />

                      {!isTranscribing && getActiveContent().length === 0 && !messages.some(m => m.role === 'user') && (
                        <p className="text-center text-xs text-gray-400 mt-3">{tl('hint')}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Completed Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <AnimatePresence mode="wait">
                    {!isCompleted ? (
                      <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <motion.button
                          onClick={handleCompleted}
                          disabled={(!messages.some(m => m.role === 'user') && getActiveContent().length === 0) || completionFlash}
                          whileHover={(messages.some(m => m.role === 'user') || getActiveContent().length > 0) ? { scale: 1.01 } : {}}
                          whileTap={(messages.some(m => m.role === 'user') || getActiveContent().length > 0) ? { scale: 0.98 } : {}}
                          className={`w-full h-12 md:h-14 rounded-2xl flex items-center justify-center gap-3 text-white shadow-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${completionFlash ? 'bg-[#00A896]' : 'bg-[#0A4D8C] hover:bg-[#0A4D8C]/90 active:bg-[#083d70]'}`}
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
                            {completionFlash ? 'Nice work!' : tl('completed')}
                          </span>
                        </motion.button>
                        <p className="text-xs text-center text-gray-400 mt-2">{tl('completedSubtitle')}</p>
                      </motion.div>
                    ) : (
                      <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 py-2">
                        <div className="w-5 h-5 rounded-full bg-[#00A896] flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm text-[#00A896] font-medium">Completed</span>
                        <button onClick={() => { setIsCompleted(false); setShowPostOptions(false); }} className="ml-2 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">undo</button>
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
