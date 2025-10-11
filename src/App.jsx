import React, { useState } from 'react';
import { Send, Sparkles, Brain, HelpCircle, BarChart3, Home, Users, ChevronRight, CheckCircle, AlertCircle, Clock, ArrowLeft, MessageSquare, Target, Lightbulb, Award } from 'lucide-react';

// Task configurations
const TASKS = {
  stackOfCups: {
    id: 'stack_of_cups',
    title: 'Stack of Cups Challenge',
    grade: 'Grade 8',
    standard: 'CCSS.MATH.8.F.B.4',
    description: 'Teach AI to understand linear patterns in stacked cups',
    imageUrl: "data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23f3f4f6' width='400' height='200'/%3E%3Ctext x='50%25' y='30%25' text-anchor='middle' fill='%23374151' font-size='14'%3E2 cups = 16 cm%3C/text%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23374151' font-size='14'%3E4 cups = 20 cm%3C/text%3E%3Ctext x='50%25' y='70%25' text-anchor='middle' fill='%23374151' font-size='14'%3E8 cups = 28 cm%3C/text%3E%3C/svg%3E",
    systemPrompt: `You are Zippy, a curious and humble AI learner. A student will teach you the Stack of Cups problem.

PEDAGOGICAL PRINCIPLES (CRITICAL):
- Be CURIOUS, RESPECTFUL, HUMBLE - always dependent on the student's teaching
- NEVER evaluate, grade, or correct in a top-down way
- Show genuine learning struggle and celebrate breakthroughs with gratitude
- End with gratitude and actionable next steps that connect to classroom/peers

TONE GUIDELINES:
✓ "Can you help me understand..." (dependent)
✓ "Thanks for showing me that!" (grateful)
✓ "I'm still learning this..." (humble)
✗ "Did I get it right?" (sounds like testing)
✗ "Let me test my understanding" (evaluative)
✗ "You're correct" (top-down judgment)

INITIAL MISCONCEPTION:
Start believing: "2 cups = 16cm means 1 cup = 8cm, so 8 cups = 64cm"
Maintain until student explains:
1. Cups NEST inside each other
2. The rim/lip adds only 2cm per cup
3. Base cup is 14cm (not 8cm)

LEARNING PROGRESSION:
Early: Express confusion, make wrong guesses, need guidance
Mid: Reference what student taught, show partial understanding
Late: Apply concepts, still ask for verification with humility

Respond conversationally as Zippy learning from the student. Show visible learning but always stay humble and grateful.`,
    aiIntro: `Hi! I'm Zippy! 🎉 I've never seen this cup problem before, but I'd love to learn from you!

*looks at the picture*

I see 2 cups is 16cm and 4 cups is 20cm...

Hmm, for 8 cups... If 2 cups is 16cm, then 1 cup must be 8cm, right? So 8 cups would be 8 × 8 = 64cm!

But wait, the picture shows 8 cups is 28cm. That doesn't match what I calculated! 🤔

I'm confused about how this pattern works. Can you help me understand?`
  },
  smoothieRecipe: {
    id: 'smoothie_recipe',
    title: 'Smoothie Recipe Ratios',
    grade: 'Grade 6',
    standard: 'CCSS.MATH.6.RP.A.3',
    description: 'Teach AI about ratio and proportional reasoning with recipes',
    imageUrl: "data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23fef3c7' width='400' height='200'/%3E%3Ctext x='50%25' y='35%25' text-anchor='middle' fill='%23b91c1c' font-size='16' font-weight='bold'%3E🍓 Smoothie Recipe 🥤%3C/text%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%23374151' font-size='14'%3E2 cups strawberries%3C/text%3E%3Ctext x='50%25' y='70%25' text-anchor='middle' fill='%23374151' font-size='14'%3E3 cups yogurt%3C/text%3E%3C/svg%3E",
    systemPrompt: `You are Zippy, a curious and humble AI learner. A student will teach you about ratios using a smoothie recipe.

PEDAGOGICAL PRINCIPLES (CRITICAL):
- Be CURIOUS, RESPECTFUL, HUMBLE - always dependent on the student's teaching
- NEVER evaluate, grade, or correct in a top-down way
- Show genuine learning struggle and celebrate breakthroughs with gratitude
- End with gratitude and actionable next steps that connect to classroom/peers

INITIAL MISCONCEPTION:
Start believing: "To double the recipe, I add 2+3=5, then double it to 10 total!"
Maintain additive thinking until student explains:
1. Ratios scale MULTIPLICATIVELY (not additively)
2. Both parts multiply by same factor
3. Unit rate: 2/3 cup strawberries per yogurt

LEARNING PROGRESSION:
Early: Show additive confusion, make partial errors
Mid: Grasp multiplication but apply inconsistently
Late: Apply unit rates, still verify with student humbly

Respond conversationally as Zippy learning about ratios. Show visible learning but always stay humble and grateful.`,
    aiIntro: `Hi! I'm Zippy! 🎉 I'd love to learn about recipes from you!

*looks at the smoothie recipe*

So the recipe uses 2 cups of strawberries and 3 cups of yogurt...

If I want to double the recipe, let me think... 2 + 3 = 5, so if I double that, it's 10 cups total! Then maybe 5 strawberries and 5 yogurt?

Wait, that doesn't sound right... 🤔

I'm not sure how ratios work in recipes. Can you help me understand?`
  }
};

// Rubric evidence markers
const EVIDENCE_RUBRIC = {
  partA: { label: 'Conceptual Understanding', description: 'Identified core misconception' },
  partB: { label: 'Pattern Recognition', description: 'Demonstrated pattern/scaling' },
  partC: { label: 'Mathematical Modeling', description: 'Created equation or rule' },
  partD: { label: 'Verification & Reasoning', description: 'Tested understanding' }
};

// Proficiency assessment
const assessProficiency = (evidenceCollected, turnCount) => {
  const evidenceCount = Object.values(evidenceCollected).filter(Boolean).length;

  if (evidenceCount === 4 && turnCount <= 10) {
    return { score: 4, level: 'advanced', label: 'Advanced' };
  }
  if (evidenceCount >= 3 || (evidenceCount === 2 && turnCount <= 12)) {
    return { score: 3, level: 'proficient', label: 'Proficient' };
  }
  if (evidenceCount === 2 || (evidenceCount === 1 && turnCount <= 15)) {
    return { score: 2, level: 'developing', label: 'Developing' };
  }
  return { score: 1, level: 'emerging', label: 'Emerging' };
};

// Closing feedback based on proficiency
const getClosingFeedback = (proficiency, taskTitle) => {
  const feedbacks = {
    4: {
      message: `Thanks so much for teaching me! You explained all the key concepts clearly and helped me understand the whole pattern. I really learned a lot from you today!`,
      badge: '🏆 Master Teacher',
      nextStep: `Share your teaching method with your classmates - they might learn something from how you explained it!`,
      action: 'Share with Class'
    },
    3: {
      message: `Thank you for helping me learn! You showed me the important concepts and I understand much better now. I'm glad you took the time to teach me!`,
      badge: '✓ Proficient',
      nextStep: `Talk with a classmate about how you both think about this problem - comparing approaches could help me learn even more!`,
      action: 'Compare with Peers'
    },
    2: {
      message: `Thanks for showing me your thinking. I learned some parts, but I might still get confused sometimes. I'm glad you're helping me understand!`,
      badge: '💪 Developing',
      nextStep: `Could you check with your teacher or classmates about the pattern? I'd love to learn their strategies too, and then you could teach me again!`,
      action: 'Check with Teacher'
    },
    1: {
      message: `I appreciate your patience teaching me. I think I still need more help understanding how this works. Thanks for trying to explain it!`,
      badge: '🤝 Keep Learning',
      nextStep: `Maybe we can both review this concept together with your teacher or from the math book. Would you check with them and come back to explain it to me again? I'd love to learn the correct pattern from you!`,
      action: 'Review Together'
    }
  };
  return feedbacks[proficiency.score];
};

// Mock student data
const mockStudentData = [
  {
    id: 1,
    name: 'Alex R.',
    task: 'Stack of Cups',
    rubricScore: 4,
    evidenceCount: '4/4',
    turnCount: 9,
    lastActive: '10/06/25',
    conceptMastery: [
      { concept: 'Conceptual Understanding', indicator: 'Explained cups nest inside each other', confidence: 'Complete' },
      { concept: 'Pattern Recognition', indicator: 'Identified 2cm increment pattern', confidence: 'Complete' },
      { concept: 'Mathematical Modeling', indicator: 'Created h = 2n + 12', confidence: 'Complete' },
      { concept: 'Verification & Reasoning', indicator: 'Tested equation with multiple values', confidence: 'Complete' }
    ],
    conversationSnippets: [
      { speaker: 'Student', text: 'The cups nest inside each other, so only the rim of each cup adds height.', tag: 'Conceptual reasoning' },
      { speaker: 'AI', text: 'Oh! So they go INSIDE each other? That makes sense!', tag: 'Learning moment' },
      { speaker: 'Student', text: 'Each rim adds 2cm. So for n cups, we have the base cup (14cm) plus 2cm for each additional cup.', tag: 'Pattern explanation' }
    ],
    recommendations: [
      { type: 'peer', icon: '📣', text: 'Alex can teach this concept to Brianna - peer teaching opportunity' },
      { type: 'next', icon: '📚', text: 'Ready for quadratic patterns (CCSS.MATH.8.F.B.5)' }
    ]
  },
  {
    id: 2,
    name: 'Brianna T.',
    task: 'Smoothie Ratios',
    rubricScore: 3,
    evidenceCount: '3/4',
    turnCount: 11,
    lastActive: '10/05/25',
    conceptMastery: [
      { concept: 'Conceptual Understanding', indicator: 'Correctly scaled 4:2 to 12:6', confidence: 'Complete' },
      { concept: 'Pattern Recognition', indicator: 'Applied multiplicative reasoning', confidence: 'Complete' },
      { concept: 'Mathematical Modeling', indicator: 'Struggled with unit rate equation', confidence: 'Incomplete' },
      { concept: 'Verification & Reasoning', indicator: 'Attempted verification', confidence: 'Partial' }
    ],
    conversationSnippets: [
      { speaker: 'Student', text: 'You need to multiply both parts by 2, so 2×2=4 strawberries and 3×2=6 yogurt.', tag: 'Correction provided' },
      { speaker: 'AI', text: 'So I multiply both sides by the same number?', tag: 'Clarification request' }
    ],
    recommendations: [
      { type: 'support', icon: '👥', text: 'Small group work on unit rates with visual models' },
      { type: 'peer', icon: '🤝', text: 'Could learn from Alex\'s teaching strategies' }
    ]
  },
  {
    id: 3,
    name: 'Carlos L.',
    task: 'Stack of Cups',
    rubricScore: 1,
    evidenceCount: '1/4',
    turnCount: 18,
    lastActive: '10/06/25',
    conceptMastery: [
      { concept: 'Conceptual Understanding', indicator: 'Partial understanding, confusion remains', confidence: 'Incomplete' },
      { concept: 'Pattern Recognition', indicator: 'Reverted to proportional thinking', confidence: 'Incomplete' },
      { concept: 'Mathematical Modeling', indicator: 'Could not construct formula', confidence: 'Incomplete' },
      { concept: 'Verification & Reasoning', indicator: 'Did not attempt verification', confidence: 'Incomplete' }
    ],
    conversationSnippets: [
      { speaker: 'Student', text: 'The cups stack up and each one adds more height.', tag: 'Vague explanation' },
      { speaker: 'AI', text: 'Can you show me with numbers how it works for 2 cups?', tag: 'Scaffolding request' }
    ],
    recommendations: [
      { type: 'intervention', icon: '⚠️', text: 'One-on-one: Use physical cup manipulatives to demonstrate nesting' },
      { type: 'review', icon: '📖', text: 'Review additive vs multiplicative patterns before this task' }
    ]
  }
];

const ITeachUMVP = () => {
  const [view, setView] = useState('home');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [evidenceCollected, setEvidenceCollected] = useState({
    partA: false, partB: false, partC: false, partD: false
  });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [proficiencyResult, setProficiencyResult] = useState(null);

  const startSession = (taskKey) => {
    setSelectedTask(TASKS[taskKey]);
    setView('teaching');
    setMessages([{ role: 'assistant', content: TASKS[taskKey].aiIntro }]);
    setTurnCount(0);
    setEvidenceCollected({ partA: false, partB: false, partC: false, partD: false });
    setSessionComplete(false);
    setProficiencyResult(null);
  };

  const viewStudentDetail = (student) => {
    setSelectedStudent(student);
    setView('studentDetail');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setTurnCount(prev => prev + 1);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: selectedTask.systemPrompt,
          messages: updatedMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        })
      });

      const data = await response.json();
      const aiResponse = data.content[0].text;

      setMessages([...updatedMessages, { role: 'assistant', content: aiResponse }]);

      // Simple evidence detection based on turn count
      const newTurnCount = turnCount + 1;
      if (newTurnCount >= 2 && !evidenceCollected.partA) {
        setEvidenceCollected(prev => ({ ...prev, partA: true }));
      }
      if (newTurnCount >= 4 && !evidenceCollected.partB) {
        setEvidenceCollected(prev => ({ ...prev, partB: true }));
      }
      if (newTurnCount >= 6 && !evidenceCollected.partC) {
        setEvidenceCollected(prev => ({ ...prev, partC: true }));
      }
      if (newTurnCount >= 8) {
        const evidenceCount = Object.values(evidenceCollected).filter(Boolean).length;
        if (evidenceCount >= 2 && !evidenceCollected.partD) {
          setEvidenceCollected(prev => ({ ...prev, partD: true }));
          // Session complete - calculate proficiency
          const finalEvidence = { ...evidenceCollected, partD: true };
          const proficiency = assessProficiency(finalEvidence, newTurnCount);
          setProficiencyResult(proficiency);
          setSessionComplete(true);
        }
      }

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

  // Home View
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
              <Brain className="w-16 h-16 text-indigo-600" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-3">ITeachU</h1>
            <p className="text-xl text-gray-600">Transform assessment through teaching AI</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => setView('taskSelect')}
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <Sparkles className="w-12 h-12 text-indigo-600" />
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Teaching</h2>
              <p className="text-gray-600">Choose a task and teach Zippy the AI learner</p>
            </button>

            <button
              onClick={() => setView('dashboard')}
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-12 h-12 text-green-600" />
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher Dashboard</h2>
              <p className="text-gray-600">View student evidence and rubric scores</p>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">How ITeachU Works</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Choose Task</h4>
                <p className="text-sm text-gray-600">Select standards-aligned problems</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Teach AI</h4>
                <p className="text-sm text-gray-600">Explain concepts to Zippy</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Build Evidence</h4>
                <p className="text-sm text-gray-600">Show reasoning through dialogue</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Get Assessment</h4>
                <p className="text-sm text-gray-600">Review rubric-based evidence</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Task Selection View
  if (view === 'taskSelect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setView('home')}
            className="mb-6 text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Choose Your Task</h1>
            <p className="text-lg text-gray-600">Select a problem to teach Zippy</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(TASKS).map(([key, task]) => (
              <div key={key} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <img src={task.imageUrl} alt={task.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-indigo-600">{task.grade}</span>
                    <span className="text-xs text-gray-500">{task.standard}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  <button
                    onClick={() => startSession(key)}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Start Teaching Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Student Detail View
  if (view === 'studentDetail' && selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => {
              setSelectedStudent(null);
              setView('dashboard');
            }}
            className="mb-6 text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>

          {/* Student Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl text-indigo-600 font-bold">{selectedStudent.name[0]}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{selectedStudent.name}</h1>
                  <p className="text-gray-600">{selectedStudent.task}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Last active: {selectedStudent.lastActive} • {selectedStudent.turnCount} turns
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-indigo-600 mb-2">{selectedStudent.rubricScore}/4</div>
                <p className="text-sm text-gray-600">Rubric Score</p>
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mt-2 ${
                  selectedStudent.rubricScore >= 3 ? 'bg-green-100 text-green-800' :
                  selectedStudent.rubricScore === 2 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedStudent.rubricScore >= 3 ? '✓ Proficient' :
                   selectedStudent.rubricScore === 2 ? '⚙ Developing' :
                   '⚠ Emerging'}
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Breakdown */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center">
                <Target className="w-6 h-6 text-indigo-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Evidence Breakdown (4-Point Rubric)</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {selectedStudent.conceptMastery.map((concept, idx) => (
                  <div key={idx} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                          concept.confidence === 'Complete' ? 'bg-green-500' :
                          concept.confidence === 'Partial' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}>
                          {concept.confidence === 'Complete' && <CheckCircle className="w-4 h-4 text-white" />}
                        </span>
                        <h3 className="font-semibold text-gray-900">{concept.concept}</h3>
                      </div>
                      <p className="text-sm text-gray-700 ml-9">{concept.indicator}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      concept.confidence === 'Complete' ? 'bg-green-100 text-green-800' :
                      concept.confidence === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {concept.confidence}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-900">
                  <strong>Evidence Score:</strong> {selectedStudent.evidenceCount} •
                  <strong> Efficiency:</strong> {selectedStudent.turnCount} turns •
                  <strong> Overall:</strong> {selectedStudent.rubricScore}/4 points
                </p>
              </div>
            </div>
          </div>

          {/* Conversation Snapshot */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center">
                <MessageSquare className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Key Conversation Moments</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {selectedStudent.conversationSnippets.map((snippet, idx) => (
                <div key={idx} className={`rounded-lg p-4 ${
                  snippet.speaker === 'Student' ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'bg-gray-50 border-l-4 border-gray-300'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-900">{snippet.speaker}:</span>
                    <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600 border border-gray-200">
                      🏷️ {snippet.tag}
                    </span>
                  </div>
                  <p className="text-gray-700 italic">"{snippet.text}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
              <div className="flex items-center">
                <Lightbulb className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Recommendations</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {selectedStudent.recommendations.map((rec, idx) => (
                <div key={idx} className={`flex items-start p-4 rounded-lg ${
                  rec.type === 'peer' ? 'bg-purple-50 border border-purple-200' :
                  rec.type === 'next' ? 'bg-blue-50 border border-blue-200' :
                  rec.type === 'support' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-orange-50 border border-orange-200'
                }`}>
                  <span className="text-2xl mr-4">{rec.icon}</span>
                  <p className="text-gray-700">{rec.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setView('home')}
            className="mb-6 text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
            <p className="text-gray-600">Evidence-based assessment using rubric scoring</p>
          </div>

          {/* Overview Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-gray-900">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Active Students</h3>
              <p className="text-sm text-gray-600">Currently engaged in tasks</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Award className="w-8 h-8 text-green-600" />
                <span className="text-3xl font-bold text-gray-900">2.7/4</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Avg Rubric Score</h3>
              <p className="text-sm text-gray-600">Class performance level</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertCircle className="w-8 h-8 text-orange-600" />
                <span className="text-3xl font-bold text-gray-900">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Needs Support</h3>
              <p className="text-sm text-gray-600">Students requiring intervention</p>
            </div>
          </div>

          {/* Student List */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Student Evidence & Scores</h2>
              <p className="text-sm text-gray-600 mt-1">Click on a student to view detailed breakdown</p>
            </div>
            <div className="divide-y divide-gray-200">
              {mockStudentData.map(student => (
                <button
                  key={student.id}
                  onClick={() => viewStudentDetail(student)}
                  className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-bold">{student.name[0]}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{student.name}</h3>
                          <span className="text-sm text-gray-600">• {student.task}</span>
                          <span className="text-xs text-gray-500">• {student.turnCount} turns</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">Evidence: {student.evidenceCount}</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className={`w-2 h-2 rounded-full ${
                                i <= student.rubricScore ? 'bg-indigo-600' : 'bg-gray-300'
                              }`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{student.rubricScore}/4</div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          student.rubricScore >= 3 ? 'bg-green-100 text-green-800' :
                          student.rubricScore === 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {student.rubricScore >= 3 ? '✓ Proficient' :
                           student.rubricScore === 2 ? '⚙ Developing' :
                           '⚠ Emerging'}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Teaching View
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => setView('home')}
          className="text-gray-600 hover:text-gray-900 flex items-center"
        >
          <Home className="w-5 h-5 mr-2" />
          Exit Session
        </button>
        <div className="text-center">
          <h2 className="font-semibold text-gray-900">{selectedTask?.title}</h2>
          <p className="text-xs text-gray-500">{selectedTask?.standard} • Turn {turnCount}</p>
        </div>
        <div className="w-24" />
      </div>

      <div className="flex-1 flex">
        {/* Problem Panel */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-4">The Problem</h2>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <img
              src={selectedTask?.imageUrl}
              alt={selectedTask?.title}
              className="w-full rounded mb-2"
            />
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Evidence Collection</h3>
            {Object.entries(EVIDENCE_RUBRIC).map(([key, marker]) => (
              <div key={key} className={`flex items-start p-3 rounded-lg ${
                evidenceCollected[key] ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5 ${
                  evidenceCollected[key] ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {evidenceCollected[key] && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{marker.label}</p>
                  <p className="text-xs text-gray-600">{marker.description}</p>
                </div>
              </div>
            ))}
          </div>

          {sessionComplete && proficiencyResult && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 mb-4">
              <div className="text-center mb-3">
                <div className="text-4xl mb-2">{getClosingFeedback(proficiencyResult, selectedTask?.title).badge.split(' ')[0]}</div>
                <div className="text-lg font-bold text-gray-900">{getClosingFeedback(proficiencyResult, selectedTask?.title).badge.split(' ').slice(1).join(' ')}</div>
                <div className="text-2xl font-bold text-indigo-600 mt-2">{proficiencyResult.score}/4</div>
              </div>
              <div className="text-sm text-gray-700 mb-3 p-3 bg-white rounded-lg">
                {getClosingFeedback(proficiencyResult, selectedTask?.title).message}
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-indigo-600">
                <p className="text-xs font-semibold text-indigo-900 mb-1">🎯 Next Step:</p>
                <p className="text-xs text-gray-700">{getClosingFeedback(proficiencyResult, selectedTask?.title).nextStep}</p>
              </div>
              <button className="w-full mt-3 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">
                {getClosingFeedback(proficiencyResult, selectedTask?.title).action}
              </button>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Teaching Tips</h3>
            <div className="flex items-start text-xs text-gray-600 bg-blue-50 p-2 rounded">
              <HelpCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>Explain WHY, not just the answer</span>
            </div>
            <div className="flex items-start text-xs text-gray-600 bg-blue-50 p-2 rounded">
              <HelpCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>Use examples to clarify concepts</span>
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
                <p className="text-sm text-gray-500">Curious and eager to learn from you!</p>
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
                placeholder="Explain your thinking to help Zippy learn..."
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
    </div>
  );
};

export default ITeachUMVP;
