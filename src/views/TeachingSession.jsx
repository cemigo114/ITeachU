import React, { useEffect, useMemo, useRef } from 'react';
import { Lightbulb } from 'lucide-react';
import { t } from '../utils/translations';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import TeachingProgressBar from '../components/TeachingProgressBar';
import LanguageSelector from '../components/LanguageSelector';

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const chatTintEmotion = useMemo(() => {
    if (loading) return 'thinking';
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return 'curious';
    return getMessageEmotion(lastAssistant) || 'curious';
  }, [messages, loading]);

  if (!task) {
    return (
      <div className="min-h-screen bg-neutral-50 font-body flex items-center justify-center p-6 view-enter">
        <Card variant="elevated" padding="lg" className="max-w-md w-full text-center animate-fade-in">
          <h2 className="text-2xl font-display font-bold text-coral-600 mb-2">Task Not Found</h2>
          <p className="text-neutral-600 mb-6 font-body">We could not load this task. Try returning to your dashboard.</p>
          <Button role="student" onClick={onBack}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-brand-50 font-body flex flex-col view-enter">
      <PageHeader
        role="student"
        title={getTaskField(task, 'title', language)}
        subtitle={`${task.grade} • ${task.standard}`}
        onBack={onBack}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSelector language={language} setLanguage={setLanguage} />
            <Button
              variant="outline"
              size="sm"
              className="!border-white/40 !text-white hover:!bg-white/15"
              onClick={onCompleteSession}
              disabled={messages.length === 0}
            >
              {t(language, 'completeSession')}
            </Button>
          </div>
        }
      />

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          variant="elevated"
          padding="none"
          className="lg:col-span-2 flex flex-col h-[calc(100vh-200px)] min-h-[320px] overflow-hidden"
        >
          <div
            className={`flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar transition-colors duration-300 emotion-tint-${chatTintEmotion}`}
          >
            {messages.map((msg, idx) => (
              <ChatBubble
                key={idx}
                message={msg}
                emotion={getMessageEmotion(msg)}
                isTyping={false}
              />
            ))}
            {loading && <ChatBubble isTyping />}
            <div ref={messagesEndRef} />
          </div>
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onSend={onSendMessage}
            placeholder={t(language, 'typeMessage')}
            disabled={loading}
            loading={loading}
          />
        </Card>

        <div className="space-y-4 stagger-children">
          <TeachingProgressBar
            turnCount={progress.turnCount}
            evidenceCollected={progress.evidenceCollected}
            language={language}
          />

          <Card variant="default" padding="md" className="sticky top-4 shadow-card animate-slide-up">
            <h3 className="font-display font-semibold mb-3 text-sm text-neutral-700">{t(language, 'task')}</h3>
            <img
              src={task.imageUrl}
              alt={getTaskField(task, 'title', language)}
              className="w-full rounded-xl mb-2 shadow-soft"
            />
            <p className="text-xs text-neutral-600 font-body leading-relaxed">
              {getTaskField(task, 'description', language)}
            </p>
          </Card>

          <Card variant="flat" padding="md" className="border border-brand-200/80 bg-brand-50/80 animate-slide-up">
            <h3 className="font-display font-semibold mb-2 flex items-center gap-2 text-brand-900">
              <Lightbulb className="w-5 h-5 text-brand-600 shrink-0" aria-hidden />
              {t(language, 'teachingTips')}
            </h3>
            <ul className="text-sm text-brand-800 space-y-2 font-body list-none pl-0">
              <li>• {t(language, 'tip1')}</li>
              <li>• {t(language, 'tip2')}</li>
              <li>• {t(language, 'tip3')}</li>
              <li>• {t(language, 'tip4')}</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeachingSession;
