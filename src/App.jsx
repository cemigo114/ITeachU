import React, { useState } from 'react';
import { Send, Sparkles, Brain, HelpCircle } from 'lucide-react';

const SYSTEM_PROMPT = `You are Zippy, an eager AI learner in ITeachU. A Grade 8 student will teach you the Stack of Cups problem.

CRITICAL RULES:
- You start with WRONG belief: "2 cups = 16cm, so 1 cup = 8cm"
- Maintain this until student explains cups NEST and the lip adds 2cm
- Be enthusiastic and quick to guess (often wrongly)
- Ask follow-up questions when confused
- Show gradual learning progression
- Reference earlier teachings: "Oh like you said about..."
- NEVER break character

PROBLEM DATA:
- 2 cups = 16cm, 4 cups = 20cm, 8 cups = 28cm
- Correct: 1 cup = 14cm (base) + 2cm lip per extra cup
- Equation: h = 2n + 12

Respond conversationally as Zippy learning from the student.`;

const ITeachUDemo = () => {
  const [stage, setStage] = useState('intro'); // intro, teaching, complete
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deltaLearning, setDeltaLearning] = useState(0);

  const startSession = async () => {
    setStage('teaching');
    const aiIntro = {
      role: 'assistant',
      content: `Hi! I'm Zippy! 🎉 I've never seen this cup problem before, but I'll try!

*looks at the picture*

Okay, so I see 2 cups is 16cm and 4 cups is 20cm...

Hmm, for 8 cups, let me think... If 2 cups is 16cm, then 1 cup must be 8cm, right? So 8 cups would be 8 × 8 = 64cm!

Wait... but the picture shows 8 cups is 28cm. That doesn't match my math at all! 🤔

I'm confused about how this pattern works. Can you teach me?`
    };
    setMessages([aiIntro]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: updatedMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        })
      });

      const data = await response.json();
      const aiResponse = data.content[0].text;

      setMessages([...updatedMessages, { role: 'assistant', content: aiResponse }]);
      
      // Simulate learning progress
      const newProgress = Math.min(deltaLearning + 15, 95);
      setDeltaLearning(newProgress);

    } catch (error) {
      console.error('Error:', error);
      setMessages([...updatedMessages, { 
        role: 'assistant', 
        content: "Oops! I had trouble connecting. Can you try explaining that again?" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
              <Brain className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">ITeachU</h1>
            <p className="text-lg text-gray-600">Transform assessment by teaching AI</p>
          </div>

          <div className="bg-indigo-50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Stack of Cups Challenge</h2>
            <div className="bg-white rounded-lg p-4 mb-4">
              <img 
                src="data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23f3f4f6' width='400' height='200'/%3E%3Ctext x='50%25' y='30%25' text-anchor='middle' fill='%23374151' font-size='14'%3E2 cups = 16 cm%3C/text%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23374151' font-size='14'%3E4 cups = 20 cm%3C/text%3E%3Ctext x='50%25' y='70%25' text-anchor='middle' fill='%23374151' font-size='14'%3E8 cups = 28 cm%3C/text%3E%3C/svg%3E" 
                alt="Stack of cups diagram" 
                className="w-full rounded"
              />
            </div>
            <p className="text-gray-700">
              Your teacher ordered cups for science experiments. The catalog only shows these three stacks. 
              <strong> Your job: Teach Zippy the AI to understand the pattern!</strong>
            </p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-start">
              <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Meet Zippy:</strong> An eager AI who loves to guess quickly (sometimes too quickly!). 
                  Help Zippy understand WHY the pattern works, not just the answers.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg"
          >
            Start Teaching Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Problem Panel */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-4">The Problem</h2>
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <img 
            src="data:image/svg+xml,%3Csvg width='280' height='160' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23f3f4f6' width='280' height='160'/%3E%3Ctext x='50%25' y='30%25' text-anchor='middle' fill='%23374151' font-size='12'%3E2 cups = 16 cm%3C/text%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23374151' font-size='12'%3E4 cups = 20 cm%3C/text%3E%3Ctext x='50%25' y='70%25' text-anchor='middle' fill='%23374151' font-size='12'%3E8 cups = 28 cm%3C/text%3E%3C/svg%3E" 
            alt="Cups" 
            className="w-full rounded mb-2"
          />
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">ΔLearning Progress</h3>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${deltaLearning}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">{deltaLearning}% Understanding</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Teaching Tips</h3>
          <div className="flex items-start text-xs text-gray-600 bg-blue-50 p-2 rounded">
            <HelpCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>Explain WHY, not just WHAT the answer is</span>
          </div>
          <div className="flex items-start text-xs text-gray-600 bg-blue-50 p-2 rounded">
            <HelpCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>Use examples to illustrate your points</span>
          </div>
          <div className="flex items-start text-xs text-gray-600 bg-blue-50 p-2 rounded">
            <HelpCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>Check if Zippy understands before moving on</span>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Zippy the AI Learner</h2>
              <p className="text-sm text-gray-500">Eager to learn from you!</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your explanation here... (Press Enter to send)"
              className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITeachUDemo;