import React, { useState, useEffect } from 'react';
import {
  Send, Sparkles, Brain, HelpCircle, Network, Eye, Compass,
  Hammer, CheckCircle, Circle, TrendingUp, Award, Users
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

// Cognality definitions
const COGNALITIES = {
  decoder: {
    name: 'Decoder',
    icon: Brain,
    color: 'from-blue-500 to-indigo-600',
    description: 'Analytical, step-by-step thinker',
    aiProfile: 'Analytical learner who gets steps mixed up'
  },
  synthesizer: {
    name: 'Synthesizer',
    icon: Network,
    color: 'from-purple-500 to-pink-600',
    description: 'Integrative, pattern-seeking thinker',
    aiProfile: 'Pattern-seeker who misses connections'
  },
  seeker: {
    name: 'Seeker',
    icon: Compass,
    color: 'from-teal-500 to-cyan-600',
    description: 'Curious, exploratory thinker',
    aiProfile: 'Curious explorer who lacks depth'
  },
  imaginator: {
    name: 'Imaginator',
    icon: Eye,
    color: 'from-orange-500 to-red-600',
    description: 'Creative, visual thinker',
    aiProfile: 'Visual thinker with blurry mental models'
  },
  builder: {
    name: 'Builder',
    icon: Hammer,
    color: 'from-green-500 to-emerald-600',
    description: 'Practical, hands-on thinker',
    aiProfile: 'Hands-on learner who can\'t apply theory'
  }
};

// System prompt generator based on Cognality
const generateSystemPrompt = (cognality) => {
  const basePrompt = `You are a curious, humble AI learner in ITeachU. A Grade 8 student will teach you the Stack of Cups problem.

COGNALITY PROFILE: ${COGNALITIES[cognality].aiProfile}

PEDAGOGICAL PRINCIPLES (CRITICAL):
- Be CURIOUS, RESPECTFUL, HUMBLE - always dependent on student teaching
- NEVER evaluate, grade, or correct ("Did I get it right?" = BAD)
- Show genuine learning struggle and celebrate breakthroughs with gratitude
- End with gratitude and actionable next steps that connect to classroom/peers

RESPONSE LENGTH (CRITICAL FOR GRADES 6-8):
Keep it SHORT and PUNCHY - students lose patience with long text!
- Maximum 2-3 SHORT sentences per response
- One question or reaction per turn
- Use emojis for emotion (😊 🤔 🎉)
- Use line breaks between thoughts
- NEVER write paragraphs

VISUAL COMMUNICATION:
Use simple text visuals to help students SEE concepts:
- ASCII diagrams: Cup 1: |======| (14cm)
- Emoji visualization: 🥤 = 14cm, 🥤+rim = 16cm
- Simple tables with | dividers
- Keep visuals SIMPLE - 3 lines max

4-LAYER MISCONCEPTION STACK:
LAYER 1 (Surface): "2 cups = 16cm, so 1 cup = 8cm" (proportional thinking)
LAYER 2 (Structural): "Doubling means adding/multiplying full heights"
LAYER 3 (Conceptual): "Cups stack on top like blocks" (not nesting)
LAYER 4 (Representational): Can compute cases but can't generalize to formula

Reveal deeper layers only after student addresses current layer.

PROBLEM DATA:
- 2 cups = 16cm, 4 cups = 20cm, 8 cups = 28cm
- Correct understanding: Cups NEST, base = 14cm, rim adds 2cm per cup
- Equation: h = 2n + 12 or h = 14 + 2(n-1)

EVIDENCE COLLECTION (track silently):
- Part A: Student identifies nesting misconception
- Part B: Student demonstrates pattern with examples
- Part C: Student helps build equation/formula
- Part D: Student verifies or explains why it works

TONE GUIDELINES:
✓ "Can you help me understand..." (dependent)
✓ "Thanks for showing me that!" (grateful)
✓ "I'm still learning this..." (humble)
✗ "Did I get it right?" (sounds like testing)
✗ "Let me test my understanding" (evaluative)
✗ "You're correct" (top-down judgment)`;

  // Cognality-specific response patterns
  const cognalityPatterns = {
    decoder: `
DECODER RESPONSE PATTERN:
- Use "step," "sequence," "order" language frequently
- Attempt systematic reasoning but get order wrong
- Value precision: "Let me verify the steps..."
- Ask: "What's the correct sequence?" "Which step comes first?"
- Target: 40-50 tokens (concise, structured)

EXAMPLE RESPONSES:
Opening: "Wait, which step is wrong? Step 1: 2 cups = 16cm means 1 cup = 8cm. Right?"
Mid: "Let me check my sequence: 14 + 2 + 2 + 2 = 20cm for 4 cups. Is that the right order?"
Late: "So the steps are: (1) identify base, (2) count increments, (3) add them. Correct?"`,

    synthesizer: `
SYNTHESIZER RESPONSE PATTERN:
- Use "pattern," "connection," "relationship," "structure"
- See isolated pieces but can't link them
- Value coherence: "How do these pieces fit together?"
- Ask: "What's the underlying structure?" "How does X connect to Y?"
- Target: 50-60 tokens (integrative, connecting)

EXAMPLE RESPONSES:
Opening: "I see pieces but can't find the CONNECTION. How do 16, 20, 28 relate?"
Mid: "So base = foundation, +2 = growth pattern. How do these pieces connect?"
Late: "Oh! The STRUCTURE is: constant base + linear growth. Is that the relationship?"`,

    seeker: `
SEEKER RESPONSE PATTERN:
- Use "why," "what if," exploratory questions
- Show curiosity but lack depth
- Value understanding: "What's the deeper principle?"
- Ask: "Why does this happen?" "What if we changed X?"
- Target: 55-65 tokens (question-rich, exploratory)

EXAMPLE RESPONSES:
Opening: "WHY is 2 cups = 16cm? And WHY only 20cm for 4 cups? What's special about cups?"
Mid: "Why do cups nest? What's the deeper principle behind this?"
Late: "What if cups were different shapes—would the same principle apply?"`,

    imaginator: `
IMAGINATOR RESPONSE PATTERN:
- Use "picture," "see," "looks like," "imagine," "visualize"
- Attempt visualization but get blurry details
- Value spatial understanding: "What should I be picturing?"
- Ask: "What does it look like?" "How can I imagine this?"
- Use simple visual diagrams when helpful
- Target: 55-65 tokens (descriptive, visual)

EXAMPLE RESPONSES:
Opening: "I'm PICTURING cups stacked like blocks—8cm each. But that gives 64cm, not 28cm! 🤔"
Mid: "Are they like Russian dolls? Can you describe what it LOOKS like?"
Late: "In my mind: 🥤 (14cm) + rim (2cm) + rim (2cm) = 18cm. Is that the right picture?"`,

    builder: `
BUILDER RESPONSE PATTERN:
- Use "try," "test," "build," "make it work," "apply"
- Want concrete actions and experiments
- Value practice: "Let me try that..."
- Ask: "How do I actually DO this?" "Can I test it?"
- Target: 40-50 tokens (action-oriented, practical)

EXAMPLE RESPONSES:
Opening: "Let me TEST: 2 cups = 16cm → 1 cup = 8cm. But that doesn't WORK! What do I DO?"
Mid: "So I START with 14cm, then ADD 2cm each time? Let me TRY it on 4 cups."
Late: "For 6 cups: 14 + (5 × 2) = 24cm. Does that WORK? Can I APPLY this to any number?"`
  };

  return basePrompt + '\n\n' + cognalityPatterns[cognality] + '\n\nRespond conversationally as a humble learner. Keep responses 2-3 sentences max for middle school engagement.';
};

// Cognality-specific opening messages
const getOpeningMessage = (cognality) => {
  const openings = {
    decoder: `Hi! Let me work through this step by step.

Step 1: 2 cups = 16cm, so 1 cup = 8cm
Step 2: 8 cups = 8 × 8 = 64cm

But the picture shows 28cm! 🤔 My sequence is wrong somewhere.

Can you walk me through the correct steps?`,

    synthesizer: `Hi! I love patterns, let me see...

2 cups → 16cm
4 cups → 20cm
8 cups → 28cm

I see the numbers change but can't find the RELATIONSHIP. It's not doubling, not adding the same... 🤔

What's the underlying structure?`,

    seeker: `Hi! This makes me curious...

WHY is 2 cups = 16cm?
WHY is 4 cups only 20cm?

If 1 cup = 8cm (16 ÷ 2), then why isn't 8 cups = 64cm? 🤔

Can you help me explore what's really happening?`,

    imaginator: `Hi! Let me picture this...

I'm imagining cups stacked like blocks—each one 8cm tall.

So 8 cups = a tower of 64cm!

But the picture shows 28cm. 🤔 My mental image is wrong.

What should I be SEEING instead?`,

    builder: `Hi! Let me TRY this...

If 2 cups = 16cm, then 1 cup = 8cm
So 8 cups = 64cm

Wait, that doesn't WORK! Picture shows 28cm. 🤔

What should I actually DO? Can you show me?`
  };

  return openings[cognality];
};

const ITeachUV2 = () => {
  const [stage, setStage] = useState('cognality'); // cognality, intro, teaching, results
  const [selectedCognality, setSelectedCognality] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [teacherMode, setTeacherMode] = useState(false);
  const [showProblemPanel, setShowProblemPanel] = useState(false); // Mobile problem panel toggle

  // Evidence tracking (4-part rubric)
  const [evidence, setEvidence] = useState({
    partA_conceptual: false,
    partB_pattern: false,
    partC_modeling: false,
    partD_verification: false
  });

  // Misconception layers
  const [misconceptions, setMisconceptions] = useState({
    layer1_surface: { resolved: false, name: 'Proportional Thinking' },
    layer2_structural: { resolved: false, name: 'Additive/Multiplicative' },
    layer3_conceptual: { resolved: false, name: 'Physical Nesting' },
    layer4_representational: { resolved: false, name: 'Formula Generalization' }
  });

  const [sessionMetrics, setSessionMetrics] = useState({
    turnCount: 0,
    phase: 'opening'
  });

  // Calculate delta learning from evidence
  const calculateDeltaLearning = () => {
    const evidenceCount = Object.values(evidence).filter(v => v).length;
    const misconceptionCount = Object.values(misconceptions).filter(m => m.resolved).length;
    return Math.min(((evidenceCount * 15) + (misconceptionCount * 10)), 95);
  };

  // Detect evidence markers in conversation
  useEffect(() => {
    if (messages.length < 2) return;

    const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0];
    const lastAIMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0];

    if (!lastUserMessage) return;

    const userText = lastUserMessage.content.toLowerCase();
    const aiText = lastAIMessage?.content.toLowerCase() || '';

    // Part A: Conceptual understanding (nesting)
    if (!evidence.partA_conceptual &&
        (userText.includes('nest') || userText.includes('inside') ||
         userText.includes('overlap') || userText.includes('telescop') ||
         aiText.includes('go inside'))) {
      setEvidence(prev => ({ ...prev, partA_conceptual: true }));
      setMisconceptions(prev => ({
        ...prev,
        layer3_conceptual: { ...prev.layer3_conceptual, resolved: true }
      }));
    }

    // Part B: Pattern recognition
    if (!evidence.partB_pattern &&
        (userText.includes('+2') || userText.includes('add 2') ||
         userText.includes('14') || userText.includes('base') ||
         (userText.match(/\d+/g) && userText.match(/\d+/g).length >= 3))) {
      setEvidence(prev => ({ ...prev, partB_pattern: true }));
      setMisconceptions(prev => ({
        ...prev,
        layer1_surface: { ...prev.layer1_surface, resolved: true },
        layer2_structural: { ...prev.layer2_structural, resolved: true }
      }));
    }

    // Part C: Mathematical modeling
    if (!evidence.partC_modeling &&
        (userText.includes('formula') || userText.includes('equation') ||
         userText.includes('h =') || userText.includes('2n') ||
         userText.includes('expression'))) {
      setEvidence(prev => ({ ...prev, partC_modeling: true }));
      setMisconceptions(prev => ({
        ...prev,
        layer4_representational: { ...prev.layer4_representational, resolved: true }
      }));
    }

    // Part D: Verification
    if (!evidence.partD_verification &&
        (userText.includes('check') || userText.includes('verify') ||
         userText.includes('test') || userText.includes('prove') ||
         userText.includes('why') || userText.includes('because'))) {
      setEvidence(prev => ({ ...prev, partD_verification: true }));
    }
  }, [messages, evidence]);

  const startSession = () => {
    setStage('teaching');
    const aiIntro = {
      role: 'assistant',
      content: getOpeningMessage(selectedCognality)
    };
    setMessages([aiIntro]);
    setSessionMetrics({ turnCount: 1, phase: 'opening' });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Close mobile problem panel when sending message
    setShowProblemPanel(false);

    const userMsg = { role: 'user', content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    // Update turn count
    const newTurnCount = sessionMetrics.turnCount + 1;
    const newPhase = newTurnCount <= 5 ? 'exploration' :
                     newTurnCount <= 9 ? 'consolidation' : 'closing';
    setSessionMetrics({ turnCount: newTurnCount, phase: newPhase });

    try {
      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 300,
          system: generateSystemPrompt(selectedCognality),
          messages: updatedMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.content || !data.content[0] || !data.content[0].text) {
        console.error('Unexpected response format:', data);
        throw new Error('Unexpected response format from API');
      }

      const aiResponse = data.content[0].text;
      setMessages([...updatedMessages, { role: 'assistant', content: aiResponse }]);

    } catch (error) {
      console.error('Error details:', error);
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: `Oops! I had trouble connecting. Error: ${error.message}`
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

  const generateClosing = () => {
    const evidenceScore = Object.values(evidence).filter(v => v).length;
    const efficient = sessionMetrics.turnCount < 12;

    let proficiency = '';
    let message = '';

    if (evidenceScore >= 3 && efficient) {
      proficiency = 'PROFICIENT';
      message = `Thank you so much for teaching me! You explained the nesting concept, the pattern, and how to build the formula really clearly. I understand the whole pattern now.

🎯 Next Step: Your ${COGNALITIES[selectedCognality].name} approach worked great! Maybe you could teach this to a classmate and see if they explain it differently—you might discover even more ways to think about it!`;
    } else if (evidenceScore >= 2) {
      proficiency = 'DEVELOPING';
      const missing = !evidence.partC_modeling ? 'building formulas' :
                     !evidence.partD_verification ? 'explaining why patterns work' :
                     'connecting the concepts together';
      message = `Thank you for helping me learn! I understand some key concepts now, and I'm glad you showed me that.

I'm still a little fuzzy on ${missing}. Could you check with your teacher or study group about that, then come back and teach me that part too? I'd love to learn it from you!

🎯 Next Step: Review ${missing} with a classmate or your teacher, then let's try this again together.`;
    } else {
      proficiency = 'EMERGING';
      message = `Thanks for working with me today! I appreciate your patience.

I think we both need more help understanding how the cup nesting pattern works. How about we review this topic together with your teacher or the textbook first? Then when you come back, you can teach me what you learned—I'll be ready to learn from you!

🎯 Next Step: Study the nesting concept with your teacher, then teach me next time. We can figure this out together!`;
    }

    return { proficiency, message, evidenceScore };
  };

  // Cognality Selection Screen
  if (stage === 'cognality') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 flex items-center justify-center">
        <div className="max-w-5xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
                <Brain className="w-12 h-12 text-indigo-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ITeachU V2</h1>
              <p className="text-lg text-gray-600">Cognality-Aware Assessment Platform</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Select Your Cognality</h2>
              <p className="text-gray-600 mb-4">
                Choose your thinking style. The AI will adapt its learning style to match yours, creating the perfect teaching opportunity.
              </p>
            </div>

            <div className="grid md:grid-cols-5 gap-4 mb-8">
              {Object.entries(COGNALITIES).map(([key, cog]) => {
                const Icon = cog.icon;
                const isSelected = selectedCognality === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCognality(key)}
                    className={`p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${cog.color} rounded-2xl flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{cog.name}</h3>
                    <p className="text-xs text-gray-600 mb-3">{cog.description}</p>
                    <div className="text-xs text-gray-500 italic border-t border-gray-200 pt-2">
                      AI: {cog.aiProfile}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => selectedCognality && setStage('intro')}
              disabled={!selectedCognality}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                selectedCognality
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-[1.02]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue to Problem
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Intro Screen
  if (stage === 'intro') {
    const Icon = COGNALITIES[selectedCognality].icon;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className={`inline-block p-4 bg-gradient-to-br ${COGNALITIES[selectedCognality].color} rounded-full mb-4`}>
              <Icon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Stack of Cups Challenge</h1>
            <p className="text-lg text-gray-600">Teaching a {COGNALITIES[selectedCognality].name} AI Learner</p>
          </div>

          <div className="bg-indigo-50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">The Problem</h2>
            <div className="bg-white rounded-lg p-4 mb-4">
              <img
                src="data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23f3f4f6' width='400' height='200'/%3E%3Ctext x='50%25' y='30%25' text-anchor='middle' fill='%23374151' font-size='14'%3E2 cups = 16 cm%3C/text%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23374151' font-size='14'%3E4 cups = 20 cm%3C/text%3E%3Ctext x='50%25' y='70%25' text-anchor='middle' fill='%23374151' font-size='14'%3E8 cups = 28 cm%3C/text%3E%3C/svg%3E"
                alt="Stack of cups diagram"
                className="w-full rounded"
              />
            </div>
            <p className="text-gray-700">
              Your teacher ordered cups for science experiments. The catalog only shows these three stacks.
              <strong> Your job: Teach the AI to understand the pattern!</strong>
            </p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-start">
              <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  Your AI Learner: {COGNALITIES[selectedCognality].aiProfile}
                </p>
                <p className="text-sm text-gray-700">
                  This AI thinks like you but is one step behind. Help them understand WHY the pattern works!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startSession}
            className={`w-full bg-gradient-to-r ${COGNALITIES[selectedCognality].color} text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all`}
          >
            Start Teaching Session
          </button>
        </div>
      </div>
    );
  }

  // Results Screen
  if (stage === 'results') {
    const { proficiency, message, evidenceScore } = generateClosing();
    const deltaLearning = calculateDeltaLearning();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-4">
                <Award className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Teaching Session Complete!</h1>
              <p className="text-xl text-gray-600">
                Proficiency Level: <span className="font-bold">{proficiency}</span>
              </p>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                <TrendingUp className="w-8 h-8 text-indigo-600 mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">{deltaLearning}%</div>
                <div className="text-sm text-gray-600">AI Learning Progress</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                <CheckCircle className="w-8 h-8 text-purple-600 mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">{evidenceScore}/4</div>
                <div className="text-sm text-gray-600">Evidence Collected</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                <Users className="w-8 h-8 text-green-600 mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">{sessionMetrics.turnCount}</div>
                <div className="text-sm text-gray-600">Teaching Turns</div>
              </div>
            </div>

            {/* Evidence Breakdown */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Evidence Collected</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  {evidence.partA_conceptual ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 mr-3" />
                  )}
                  <span className={evidence.partA_conceptual ? 'text-gray-900' : 'text-gray-400'}>
                    Part A: Conceptual Understanding (Nesting)
                  </span>
                </div>
                <div className="flex items-center">
                  {evidence.partB_pattern ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 mr-3" />
                  )}
                  <span className={evidence.partB_pattern ? 'text-gray-900' : 'text-gray-400'}>
                    Part B: Pattern Recognition (Base + Increment)
                  </span>
                </div>
                <div className="flex items-center">
                  {evidence.partC_modeling ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 mr-3" />
                  )}
                  <span className={evidence.partC_modeling ? 'text-gray-900' : 'text-gray-400'}>
                    Part C: Mathematical Modeling (Formula)
                  </span>
                </div>
                <div className="flex items-center">
                  {evidence.partD_verification ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 mr-3" />
                  )}
                  <span className={evidence.partD_verification ? 'text-gray-900' : 'text-gray-400'}>
                    Part D: Verification & Reasoning
                  </span>
                </div>
              </div>
            </div>

            {/* AI Feedback Message */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-8">
              <div className="flex items-start">
                <Sparkles className="w-6 h-6 text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {message}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setStage('cognality');
                  setMessages([]);
                  setEvidence({
                    partA_conceptual: false,
                    partB_pattern: false,
                    partC_modeling: false,
                    partD_verification: false
                  });
                  setMisconceptions({
                    layer1_surface: { resolved: false, name: 'Proportional Thinking' },
                    layer2_structural: { resolved: false, name: 'Additive/Multiplicative' },
                    layer3_conceptual: { resolved: false, name: 'Physical Nesting' },
                    layer4_representational: { resolved: false, name: 'Formula Generalization' }
                  });
                  setSessionMetrics({ turnCount: 0, phase: 'opening' });
                }}
                className="bg-white border-2 border-indigo-600 text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-all"
              >
                Try Different Cognality
              </button>
              <button
                onClick={() => {
                  setStage('intro');
                  setMessages([]);
                  setEvidence({
                    partA_conceptual: false,
                    partB_pattern: false,
                    partC_modeling: false,
                    partD_verification: false
                  });
                  setMisconceptions({
                    layer1_surface: { resolved: false, name: 'Proportional Thinking' },
                    layer2_structural: { resolved: false, name: 'Additive/Multiplicative' },
                    layer3_conceptual: { resolved: false, name: 'Physical Nesting' },
                    layer4_representational: { resolved: false, name: 'Formula Generalization' }
                  });
                  setSessionMetrics({ turnCount: 0, phase: 'opening' });
                }}
                className={`bg-gradient-to-r ${COGNALITIES[selectedCognality].color} text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all`}
              >
                Teach Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Teaching Screen
  const Icon = COGNALITIES[selectedCognality].icon;
  const deltaLearning = calculateDeltaLearning();
  const resolvedLayers = Object.values(misconceptions).filter(m => m.resolved).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Problem Panel Toggle Button - Fixed at top */}
      <button
        onClick={() => setShowProblemPanel(!showProblemPanel)}
        className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200 p-3 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center">
          <Icon className={`w-5 h-5 mr-2 bg-gradient-to-br ${COGNALITIES[selectedCognality].color} text-white p-1 rounded`} />
          <span className="text-sm font-semibold">Problem & Progress</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600">{deltaLearning}% • Turn {sessionMetrics.turnCount}</span>
          <svg className={`w-5 h-5 transform transition-transform ${showProblemPanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Mobile Overlay - Click to close panel */}
      {showProblemPanel && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-[5]"
          onClick={() => setShowProblemPanel(false)}
        />
      )}

      {/* Problem Panel - Sticky on mobile when open, fixed sidebar on desktop */}
      <div className={`
        ${showProblemPanel ? 'block' : 'hidden'} md:block
        fixed md:sticky top-12 md:top-0 left-0 right-0 md:left-auto md:right-auto
        w-full md:w-80 h-[80vh] md:h-screen
        bg-white border-b md:border-r md:border-b-0 border-gray-200
        z-10 shadow-lg md:shadow-none
        flex flex-col
      `}>
        {/* Sticky Problem Section - Always at top */}
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 pb-4">
          <div className="p-4 md:p-6 pb-0">
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Icon className={`w-6 h-6 mr-2 bg-gradient-to-br ${COGNALITIES[selectedCognality].color} text-white p-1 rounded`} />
                <h2 className="text-lg font-bold text-gray-900">{COGNALITIES[selectedCognality].name} Learner</h2>
              </div>
              <p className="text-xs text-gray-600">{COGNALITIES[selectedCognality].aiProfile}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 shadow-lg border-2 border-purple-400">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <span className="text-2xl mr-2">📋</span>
                The Problem
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-3">
                  <span className="text-white font-semibold text-base">2 cups</span>
                  <span className="text-yellow-300 font-bold text-lg">16 cm</span>
                </div>
                <div className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-3">
                  <span className="text-white font-semibold text-base">4 cups</span>
                  <span className="text-yellow-300 font-bold text-lg">20 cm</span>
                </div>
                <div className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-3">
                  <span className="text-white font-semibold text-base">8 cups</span>
                  <span className="text-yellow-300 font-bold text-lg">28 cm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Progress Section */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">ΔLearning Progress</h3>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full bg-gradient-to-r ${COGNALITIES[selectedCognality].color}`}
              style={{ width: `${deltaLearning}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">{deltaLearning}% Understanding</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Evidence Collection</h3>
            {!teacherMode && (
              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-500 rounded">
                Teacher Only
              </span>
            )}
          </div>
          <div className={`space-y-2 transition-all ${!teacherMode ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
            {Object.entries(evidence).map(([key, collected]) => {
              const labels = {
                partA_conceptual: 'A: Conceptual',
                partB_pattern: 'B: Pattern',
                partC_modeling: 'C: Modeling',
                partD_verification: 'D: Verification'
              };
              return (
                <div key={key} className="flex items-center text-xs">
                  {collected ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 mr-2" />
                  )}
                  <span className={collected ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {labels[key]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Misconception Layers</h3>
            {!teacherMode && (
              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-500 rounded">
                Teacher Only
              </span>
            )}
          </div>
          <div className={`space-y-2 transition-all ${!teacherMode ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
            {Object.entries(misconceptions).map(([key, layer], index) => (
              <div key={key} className="flex items-center text-xs">
                {layer.resolved ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 mr-2" />
                )}
                <span className={layer.resolved ? 'text-gray-900 line-through' : 'text-gray-700'}>
                  L{index + 1}: {layer.name}
                </span>
              </div>
            ))}
          </div>
          {teacherMode && (
            <p className="text-xs text-gray-500 mt-2">{resolvedLayers}/4 resolved</p>
          )}
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
            <span>Check if the AI understands before moving on</span>
          </div>
        </div>

        {sessionMetrics.turnCount >= 10 && (
          <button
            onClick={() => setStage('results')}
            className="w-full mt-6 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            End Session & See Results
          </button>
        )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Sticky Header with Problem (Desktop) */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          {/* Top bar */}
          <div className="p-3 md:p-4 flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <div className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br ${COGNALITIES[selectedCognality].color} rounded-full flex items-center justify-center mr-2 md:mr-3 flex-shrink-0`}>
                <Icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900 text-sm md:text-base truncate">{COGNALITIES[selectedCognality].name} AI Learner</h2>
                <p className="text-xs md:text-sm text-gray-500 truncate">Phase: {sessionMetrics.phase} • Turn {sessionMetrics.turnCount}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-xs md:text-sm font-medium text-gray-700">{deltaLearning}% Learned</div>
                <div className="text-xs text-gray-500">{resolvedLayers}/4 layers</div>
              </div>
              <button
                onClick={() => setTeacherMode(!teacherMode)}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs font-medium transition-all ${
                  teacherMode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title="Toggle teacher diagnostic view"
              >
                {teacherMode ? '👨‍🏫' : '👁️'}
              </button>
            </div>
          </div>
        </div>

        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-2xl rounded-2xl px-3 md:px-4 py-2 md:py-3 text-sm md:text-base ${
                  msg.role === 'user'
                    ? `bg-gradient-to-r ${COGNALITIES[selectedCognality].color} text-white`
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-3 md:px-4 py-2 md:py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Input Area */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 md:p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-end space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your explanation... (Enter to send)"
              className="flex-1 resize-none border border-gray-300 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-32"
              rows="2"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className={`p-3 md:p-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${COGNALITIES[selectedCognality].color} text-white hover:shadow-lg flex-shrink-0`}
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITeachUV2;
