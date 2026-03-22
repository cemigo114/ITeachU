import React from 'react';
import LumoMascot from './LumoMascot';

const ChatBubble = ({ message, emotion, isTyping = false }) => {
  if (isTyping) {
    return (
      <div className="flex gap-3 items-start animate-fade-in">
        <div className="flex-shrink-0 w-[44px] h-[44px]">
          <LumoMascot emotion="thinking" size="small" />
        </div>
        <div className="bg-neutral-100 rounded-2xl rounded-bl-md px-4 py-3">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 items-start ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      {!isUser && (
        <div className="flex-shrink-0 w-[44px] h-[44px]">
          <LumoMascot emotion={emotion || 'curious'} size="small" />
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-teal-600 text-white rounded-br-md'
          : 'bg-neutral-100 text-neutral-900 rounded-bl-md'
      }`}>
        <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed font-body">{message.content}</p>
      </div>
    </div>
  );
};

export default ChatBubble;
