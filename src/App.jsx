import React, { useState, useEffect } from 'react';
import { Send, Sparkles, Brain, HelpCircle, BarChart3, Home, Users, ChevronRight, CheckCircle, AlertCircle, Clock, ArrowLeft, MessageSquare, Target, Lightbulb, Award, UserCircle, BookOpen, Trophy, TrendingUp } from 'lucide-react';
import LumoMascot from './components/LumoMascot';
import StandardBadge from './components/StandardBadge';
import TaskCollectionBrowser from './components/TaskCollectionBrowser';
import { API_ENDPOINTS } from './config/api';
import { generateZippyPrompt } from './utils/zippyPrompt';
import {
  saveSession,
  loadSession,
  clearSession,
  archiveSession,
  createSession,
  updateSessionProgress,
  hasResumableSession,
  getSessionSummary
} from './utils/sessionStorage';

// Task configurations
const TASKS = {
  stackOfCups: {
    id: 'stack_of_cups',
    title: 'Stack of Cups Challenge',
    grade: 'Grade 8',
    standard: 'CCSS.MATH.8.F.B.4',
    standardId: '06f7e578-0d65-55d4-a817-77e4cd0a4b05', // CT standard for 8.F.B.4
    description: 'Teach AI to understand linear patterns in stacked cups',
    imageUrl: "data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23f3f4f6' width='400' height='200'/%3E%3Ctext x='50%25' y='30%25' text-anchor='middle' fill='%23374151' font-size='14'%3E2 cups = 16 cm%3C/text%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23374151' font-size='14'%3E4 cups = 20 cm%3C/text%3E%3Ctext x='50%25' y='70%25' text-anchor='middle' fill='%23374151' font-size='14'%3E8 cups = 28 cm%3C/text%3E%3C/svg%3E",
    // New metadata fields for comprehensive prompt
    problemStatement: 'Given a stack of cups where 2 cups = 16cm, 4 cups = 20cm, and 8 cups = 28cm, determine the pattern and create a formula for the height of n cups.',
    teachingPrompt: 'Help Zippy understand how cups nest together and how to model the linear relationship between number of cups and total height.',
    targetConcepts: ['Linear patterns', 'Nesting structures', 'Function notation', 'Rate of change'],
    correctSolutionPathway: 'Cups nest inside each other. Base cup is 14cm tall. Each additional cup adds only its 2cm rim. Formula: h = 14 + 2(n-1) or h = 2n + 12',
    misconceptions: [
      'Proportional thinking: 2 cups = 16cm means 1 cup = 8cm, so 8 cups = 64cm',
      'Additive only: Cups stack completely on top without nesting',
      'Missing constant: Thinking pattern is only 2n without the base constant',
      'Cannot generalize: Can calculate specific cases but struggles to create formula'
    ],
    aiIntro: `Hi! I'm Zippy! 🎉

I see 2 cups = 16cm and 4 cups = 20cm.

If 1 cup = 8cm, then 8 cups = 64cm... but the picture shows 28cm! 🤔

Can you help me figure out what's happening?`
  },
  smoothieRecipe: {
    id: 'smoothie_recipe',
    title: 'Smoothie Recipe Ratios',
    grade: 'Grade 6',
    standard: 'CCSS.MATH.6.RP.A.3',
    standardId: '62d0029e-9b81-5f08-b0bb-8ae1ddc9e8d0', // CT standard for 6.RP.A.3
    description: 'Teach AI about ratio and proportional reasoning with recipes',
    imageUrl: "data:image/svg+xml,%3Csvg width='400' height='280' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23fef3c7' width='400' height='280'/%3E%3Ctext x='200' y='30' text-anchor='middle' fill='%23b91c1c' font-size='18' font-weight='bold'%3E🍓 Smoothie Recipe 🥤%3C/text%3E%3Ctext x='200' y='60' text-anchor='middle' fill='%23059669' font-size='14' font-weight='bold'%3EOriginal Recipe%3C/text%3E%3Ctext x='100' y='90' text-anchor='middle' fill='%23dc2626' font-size='32'%3E🍓🍓%3C/text%3E%3Ctext x='100' y='115' text-anchor='middle' fill='%23374151' font-size='12'%3E2 cups%3C/text%3E%3Ctext x='200' y='102' text-anchor='middle' fill='%23374151' font-size='20'%3E:%3C/text%3E%3Ctext x='300' y='90' text-anchor='middle' fill='%2393c5fd' font-size='32'%3E🥛🥛🥛%3C/text%3E%3Ctext x='300' y='115' text-anchor='middle' fill='%23374151' font-size='12'%3E3 cups%3C/text%3E%3Crect x='50' y='130' width='300' height='2' fill='%23d1d5db'/%3E%3Ctext x='200' y='160' text-anchor='middle' fill='%23dc2626' font-size='13' font-weight='bold'%3ERatio: 2 to 3%3C/text%3E%3Ctext x='200' y='185' text-anchor='middle' fill='%23374151' font-size='11'%3ETo double: multiply BOTH by 2%3C/text%3E%3Ctext x='200' y='210' text-anchor='middle' fill='%23374151' font-size='11'%3E🍓🍓 × 2 = 🍓🍓🍓🍓 (4 cups)%3C/text%3E%3Ctext x='200' y='230' text-anchor='middle' fill='%23374151' font-size='11'%3E🥛🥛🥛 × 2 = 🥛🥛🥛🥛🥛🥛 (6 cups)%3C/text%3E%3Ctext x='200' y='260' text-anchor='middle' fill='%23374151' font-size='10' style='font-style:italic'%3EKeeps the same taste!%3C/text%3E%3C/svg%3E",
    // New metadata fields for comprehensive prompt
    problemStatement: 'A smoothie recipe uses 2 cups of strawberries and 3 cups of yogurt. How do you scale this recipe to make different amounts while keeping the same taste?',
    teachingPrompt: 'Help Zippy understand how ratios work and how to scale recipes multiplicatively (not additively).',
    targetConcepts: ['Ratios', 'Proportional reasoning', 'Multiplicative scaling', 'Unit rates'],
    correctSolutionPathway: 'Ratios scale multiplicatively. To double: multiply both parts by 2 (4 strawberries, 6 yogurt). To triple: multiply both by 3. Unit rate: 2/3 cup strawberries per cup yogurt.',
    misconceptions: [
      'Additive thinking: 2+3=5, so double means 10 total, split equally as 5 and 5',
      'Multiplying only one part: Doubling means 4 strawberries but keeping 3 yogurt',
      'Missing the relationship: Can compute specific cases but doesn\'t understand the ratio structure',
      'Cannot generalize: Struggles to apply ratio concept to different scaling factors'
    ],
    aiIntro: `Hi! I'm Zippy! 🎉

Recipe: 2 cups strawberries + 3 cups yogurt

To double it... 2+3=5, so double = 10 total? Maybe 5 strawberries and 5 yogurt? 🤔

Can you help me understand how to double recipes?`
  }
};

// Generate system prompt for a task using the new Zippy prompt generator
const getTaskSystemPrompt = (taskKey) => {
  const task = TASKS[taskKey];
  if (!task) return '';

  return generateZippyPrompt({
    title: task.title,
    problemStatement: task.problemStatement,
    teachingPrompt: task.teachingPrompt,
    targetConcepts: task.targetConcepts,
    correctSolutionPathway: task.correctSolutionPathway,
    misconceptions: task.misconceptions,
    studentCognality: 'Decoder' // Default - could be from user profile
  });
};

// Evaluation categories from evaluator prompt (matches server.js)
const EVALUATION_CATEGORIES = {
  conceptArticulation: { 
    label: 'Concept Articulation', 
    description: 'Ability to precisely use terminology, formalism and variable definitions',
    weight: 0.30
  },
  logicCoherence: { 
    label: 'Logic Coherence', 
    description: 'Internal consistency and soundness of reasoning and problem-solving steps',
    weight: 0.30
  },
  misconceptionCorrection: { 
    label: 'Misconception Correction', 
    description: 'Ability to identify, challenge, and correct incorrect reasoning',
    weight: 0.30
  },
  cognitiveResilience: { 
    label: 'Cognitive Resilience', 
    description: 'Independence, persistence, and willingness to re-engage when faced with challenges',
    weight: 0.10
  }
};

// Helper to calculate weighted score from category scores (0-100 scale)
const calculateWeightedScore = (categoryScores) => {
  if (!categoryScores) return 0;
  return (
    (categoryScores.conceptArticulation || 0) * 0.30 +
    (categoryScores.logicCoherence || 0) * 0.30 +
    (categoryScores.misconceptionCorrection || 0) * 0.30 +
    (categoryScores.cognitiveResilience || 0) * 0.10
  ) * 25; // Scale 1-4 scores to 0-100
};

// Mock data for students and assignments
const MOCK_STUDENTS = [
  { id: 1, name: 'Alex Rodriguez', grade: '8th', email: 'alex.r@school.edu' },
  { id: 2, name: 'Brianna Thompson', grade: '6th', email: 'brianna.t@school.edu' },
  { id: 3, name: 'Carlos Lopez', grade: '8th', email: 'carlos.l@school.edu' },
  { id: 4, name: 'Diana Chen', grade: '7th', email: 'diana.c@school.edu' }
];

// Mock assignments (teacher assigns tasks to students)
const MOCK_ASSIGNMENTS = [
  {
    id: 1,
    studentId: 1,
    studentName: 'Alex Rodriguez',
    taskId: 'stack_of_cups',
    taskTitle: 'Stack of Cups Challenge',
    status: 'completed',
    completedDate: '2025-10-06',
    messages: [
      { role: 'assistant', content: "Hi! I'm Zippy! 🎉 I'd love to learn about this cup stacking pattern from you!\n\n*looks at the picture*\n\nI see 2 cups is 16cm and 4 cups is 20cm...\n\nHmm, for 8 cups... If 2 cups is 16cm, then 1 cup must be 8cm, right? So 8 cups would be 8 × 8 = 64cm!\n\nBut wait, the picture shows 8 cups is 28cm. That doesn't match what I calculated! 🤔\n\nI'm confused about how this pattern works. Can you help me understand?" },
      { role: 'user', content: "No, Zippy! The cups don't just stack on top of each other. They nest inside each other. Only the rim of each cup adds to the height." },
      { role: 'assistant', content: "Oh! So they go INSIDE each other? That's so cool! So the bottom cup is the full height, but the other cups slide into it and only their rims stick out?\n\nLet me see... if 2 cups is 16cm and 4 cups is 20cm, the difference is 4cm. So for 2 more cups, it's 4cm more?\n\nDoes that mean each rim is 2cm? How tall is just one cup by itself?" },
      { role: 'user', content: "Exactly! Each rim adds 2cm. To find the height of one cup, we can work backwards from the 2-cup stack. If 2 cups is 16cm, and the second cup only adds its 2cm rim, then the base cup must be 14cm." },
      { role: 'assistant', content: "OHHH! So one cup is 14cm tall! Let me check if I understand:\n\n- 1 cup = 14cm (the base)\n- 2 cups = 14cm + 2cm (one rim) = 16cm ✓\n- 4 cups = 14cm + 2cm + 2cm + 2cm (three rims) = 20cm ✓\n\nSo for 8 cups, it would be 14cm + (7 rims × 2cm) = 14 + 14 = 28cm!\n\nThat matches the picture! This makes so much more sense now! Can we make an equation for any number of cups?" },
      { role: 'user', content: "Yes! If we call the number of cups 'n' and the height 'h', then h = 14 + 2(n-1), which simplifies to h = 2n + 12." },
      { role: 'assistant', content: "Wow! So h = 2n + 12! Let me test this:\n\n- For n=2: h = 2(2) + 12 = 4 + 12 = 16cm ✓\n- For n=4: h = 2(4) + 12 = 8 + 12 = 20cm ✓\n- For n=8: h = 2(8) + 12 = 16 + 12 = 28cm ✓\n\nIt works for all of them! Thank you so much for teaching me! I finally understand how the cups nest and how to make an equation!" }
    ],
    evaluation: {
      categoryScores: {
        conceptArticulation: 4,
        logicCoherence: 4,
        misconceptionCorrection: 4,
        cognitiveResilience: 4
      },
      justifications: {
        conceptArticulation: 'Student precisely explained nesting concept using clear mathematical terminology (base cup 14cm, rim adds 2cm). Correctly defined variables n and h, and articulated the formula h = 2n + 12 with proper reasoning.',
        logicCoherence: 'Demonstrated excellent logical progression: identified pattern difference (4cm for 2 cups), deduced rim height (2cm), calculated base cup (14cm), then systematically verified the formula across multiple test cases.',
        misconceptionCorrection: 'Successfully corrected proportional thinking error (1 cup = 8cm → 8 cups = 64cm). Recognized nesting structure eliminates simple multiplication. Student guided AI from misconception to accurate conceptual model.',
        cognitiveResilience: 'Student independently structured explanations, built upon AI responses, and extended learning to algebraic generalization without prompting. Showed persistence in ensuring full understanding.'
      },
      totalScore: 100
    },
    conversationSnippets: [
      { speaker: 'Student', text: "No, Zippy! The cups don't just stack on top of each other. They nest inside each other. Only the rim of each cup adds to the height.", tag: 'Conceptual explanation' },
      { speaker: 'AI', text: "Oh! So they go INSIDE each other? That's so cool! So the bottom cup is the full height, but the other cups slide into it and only their rims stick out?", tag: 'Learning moment' },
      { speaker: 'Student', text: 'Exactly! Each rim adds 2cm. To find the height of one cup, we can work backwards from the 2-cup stack. If 2 cups is 16cm, and the second cup only adds its 2cm rim, then the base cup must be 14cm.', tag: 'Mathematical reasoning' },
      { speaker: 'AI', text: "Wow! So h = 2n + 12! Let me test this: For n=2: h = 2(2) + 12 = 16cm ✓ For n=4: h = 2(4) + 12 = 20cm ✓ It works for all of them!", tag: 'Understanding verified' }
    ],
    recommendations: [
      { type: 'peer', icon: '📣', text: 'Alex can teach this concept to other students - peer teaching opportunity' },
      { type: 'next', icon: '📚', text: 'Ready for quadratic patterns (CCSS.MATH.8.F.B.5)' }
    ]
  },
  {
    id: 2,
    studentId: 2,
    studentName: 'Brianna Thompson',
    taskId: 'smoothie_recipe',
    taskTitle: 'Smoothie Recipe Ratios',
    status: 'completed',
    completedDate: '2025-10-05',
    messages: [
      { role: 'assistant', content: "Hi! I'm Zippy! 🎉 I'd love to learn about recipes from you!\n\n*looks at the smoothie recipe*\n\nSo the recipe uses 2 cups of strawberries and 3 cups of yogurt...\n\nIf I want to double the recipe, let me think... 2 + 3 = 5, so if I double that, it's 10 cups total! Then maybe 5 strawberries and 5 yogurt?\n\nWait, that doesn't sound right... 🤔\n\nI'm not sure how ratios work in recipes. Can you help me understand?" },
      { role: 'user', content: "No, Zippy. When you double a recipe, you multiply both ingredients by 2. So 2 strawberries becomes 4, and 3 yogurt becomes 6." },
      { role: 'assistant', content: "Oh! So I multiply both by 2? Let me try:\n\n- Strawberries: 2 × 2 = 4 cups\n- Yogurt: 3 × 2 = 6 cups\n\nSo for a double recipe, it's 4 cups strawberries and 6 cups yogurt! That makes more sense than adding them together first.\n\nWhat if I want to triple the recipe?" },
      { role: 'user', content: "You multiply both by 3. So it would be 6 cups strawberries and 9 cups yogurt." },
      { role: 'assistant', content: "Got it! So:\n- Triple: 2×3=6 strawberries, 3×3=9 yogurt\n\nSo I multiply both sides by the same number to keep the ratio! Thank you for teaching me!" }
    ],
    evaluation: {
      categoryScores: {
        conceptArticulation: 3,
        logicCoherence: 3,
        misconceptionCorrection: 3,
        cognitiveResilience: 2
      },
      justifications: {
        conceptArticulation: 'Student explained multiplicative scaling clearly (multiply both by 2, by 3) but did not formalize the ratio relationship or introduce unit rate concepts. Terminology was adequate but not precise.',
        logicCoherence: 'Reasoning was sound for doubling and tripling. Student corrected additive misconception and demonstrated consistent application of multiplicative principle. However, did not extend to general case or verify with other scaling factors.',
        misconceptionCorrection: 'Successfully corrected additive thinking error (2+3=5, double=10, split as 5:5). Guided AI to understand multiplicative scaling. However, correction was procedural rather than conceptual - focused on "what to do" more than "why it works".',
        cognitiveResilience: 'Student provided direct answers when asked but did not independently extend the concept or probe deeper understanding. Relied on AI prompts to guide the conversation forward.'
      },
      totalScore: 73.75
    },
    conversationSnippets: [
      { speaker: 'Student', text: 'No, Zippy. When you double a recipe, you multiply both ingredients by 2. So 2 strawberries becomes 4, and 3 yogurt becomes 6.', tag: 'Correction provided' },
      { speaker: 'AI', text: "Oh! So I multiply both by 2? So for a double recipe, it's 4 cups strawberries and 6 cups yogurt!", tag: 'Learning moment' },
      { speaker: 'Student', text: 'You multiply both by 3. So it would be 6 cups strawberries and 9 cups yogurt.', tag: 'Extension to triple' }
    ],
    recommendations: [
      { type: 'support', icon: '👥', text: 'Small group work on unit rates with visual models' },
      { type: 'peer', icon: '🤝', text: 'Could learn from Alex\'s teaching strategies' }
    ]
  },
  {
    id: 3,
    studentId: 3,
    studentName: 'Carlos Lopez',
    taskId: 'stack_of_cups',
    taskTitle: 'Stack of Cups Challenge',
    status: 'in_progress',
    completedDate: null,
    messages: [
      { role: 'assistant', content: "Hi! I'm Zippy! 🎉 I'd love to learn about this cup stacking pattern from you!\n\n*looks at the picture*\n\nI see 2 cups is 16cm and 4 cups is 20cm...\n\nHmm, for 8 cups... If 2 cups is 16cm, then 1 cup must be 8cm, right? So 8 cups would be 8 × 8 = 64cm!\n\nBut wait, the picture shows 8 cups is 28cm. That doesn't match what I calculated! 🤔\n\nI'm confused about how this pattern works. Can you help me understand?" },
      { role: 'user', content: "The cups stack up and each one adds more height." },
      { role: 'assistant', content: "Hmm, so each cup adds more height? But if each cup is 8cm (since 2 cups = 16cm, so 16÷2=8), then 8 cups should be 8×8=64cm, right?\n\nBut that doesn't match the picture showing 28cm for 8 cups. Can you show me with numbers how it works for 2 cups?" }
    ],
    conversationSnippets: [
      { speaker: 'AI', text: "I see 2 cups is 16cm and 4 cups is 20cm... If 2 cups is 16cm, then 1 cup must be 8cm, right? So 8 cups would be 64cm! But the picture shows 28cm. I'm confused!", tag: 'Misconception present' },
      { speaker: 'Student', text: 'The cups stack up and each one adds more height.', tag: 'Vague explanation' },
      { speaker: 'AI', text: 'But if each cup is 8cm, then 8 cups should be 64cm, right? Can you show me with numbers how it works for 2 cups?', tag: 'Still confused' }
    ],
    recommendations: [
      { type: 'intervention', icon: '⚠️', text: 'One-on-one: Use physical cup manipulatives to demonstrate nesting' },
      { type: 'review', icon: '📖', text: 'Review additive vs multiplicative patterns before this task' }
    ]
  },
  {
    id: 4,
    studentId: 4,
    studentName: 'Diana Chen',
    taskId: 'smoothie_recipe',
    taskTitle: 'Smoothie Recipe Ratios',
    status: 'assigned',
    completedDate: null,
    messages: []
  },
  {
    id: 5,
    studentId: 1,
    studentName: 'Alex Rodriguez',
    taskId: 'smoothie_recipe',
    taskTitle: 'Smoothie Recipe Ratios',
    status: 'assigned',
    completedDate: null,
    messages: []
  }
];

// Main App component
const App = () => {
  // Authentication state
  const [userRole, setUserRole] = useState(null); // 'teacher', 'parent', 'student'
  const [currentUser, setCurrentUser] = useState(null);

  // View state
  const [view, setView] = useState('landing');

  // Carousel state
  const [activeStep, setActiveStep] = useState(0);
  const [showStepDetail, setShowStepDetail] = useState(false);

  // Mascot emotion rotation
  const [mascotEmotion, setMascotEmotion] = useState('happy');

  // Teacher state
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState(null);
  const [selectedStudentsForAssignment, setSelectedStudentsForAssignment] = useState([]);

  // Student state
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null); // Track backend session ID
  // Removed old evidenceCollected state - now using backend evaluation system

  // Session persistence state
  const [currentSession, setCurrentSession] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // Assignment/feedback state
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS);
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  
  // Evaluation data from backend
  const [evaluationData, setEvaluationData] = useState(null);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  // Check for resumable session on mount
  useEffect(() => {
    if (hasResumableSession() && userRole === 'student') {
      setShowResumePrompt(true);
    }
  }, [userRole]);

  // Test API connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.chat.replace('/api/chat', '/api/standards')}`);
        if (response.ok) {
          console.log('✅ Backend API is reachable');
        } else {
          console.warn('⚠️ Backend API returned error:', response.status);
        }
      } catch (error) {
        console.error('❌ Cannot reach backend API:', error.message);
        console.error('💡 Make sure the backend server is running on port 3002');
      }
    };
    testConnection();
  }, []);

  // Fetch evaluation data from backend when teacher views assignments
  useEffect(() => {
    if (userRole === 'teacher' && view === 'teacherReviewAssignments') {
      fetchEvaluations();
    }
  }, [userRole, view]);

  // Fetch evaluation data from backend
  const fetchEvaluations = async () => {
    setLoadingEvaluations(true);
    try {
      const response = await fetch(API_ENDPOINTS.teacherConversations);
      if (!response.ok) {
        throw new Error('Failed to fetch evaluations');
      }
      const data = await response.json();
      setEvaluationData(data);
      console.log('📊 Evaluation data loaded:', data);
    } catch (error) {
      console.error('❌ Error fetching evaluations:', error);
      setEvaluationData(null);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  // Login handler
  const handleLogin = (role, user) => {
    setUserRole(role);
    setCurrentUser(user);

    if (role === 'teacher') {
      setView('teacherDashboard');
    } else if (role === 'student') {
      setView('studentDashboard');
    } else if (role === 'parent') {
      setView('parentDashboard');
    }
  };

  // Teacher: Create new assignment
  const handleCreateAssignment = () => {
    if (!selectedTaskForAssignment || selectedStudentsForAssignment.length === 0) {
      alert('Please select a task and at least one student');
      return;
    }

    const newAssignments = selectedStudentsForAssignment.map((studentId) => {
      const student = MOCK_STUDENTS.find(s => s.id === studentId);
      return {
        id: assignments.length + studentId,
        studentId: student.id,
        studentName: student.name,
        taskId: selectedTaskForAssignment.id,
        taskTitle: selectedTaskForAssignment.title,
        status: 'assigned',
        completedDate: null,
        messages: []
      };
    });

    setAssignments([...assignments, ...newAssignments]);
    setSelectedTaskForAssignment(null);
    setSelectedStudentsForAssignment([]);
    setView('teacherDashboard');
  };

  // Student: Start teaching session
  const startTeachingSession = (assignment) => {
    setActiveAssignment(assignment);
    // Reset session tracking for new session
    setSessionId(null);
    // Convert snake_case to camelCase for TASKS lookup
    const taskKey = assignment.taskId.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    const task = TASKS[taskKey];
    if (!task) {
      console.error(`Task not found for taskId: ${assignment.taskId}, tried key: ${taskKey}`);
      return;
    }
    setMessages([{ role: 'assistant', content: task.aiIntro }]);
    setView('teaching');
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Convert snake_case to camelCase for TASKS lookup
      const taskKey = activeAssignment.taskId.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      const task = TASKS[taskKey];

      if (!task) {
        throw new Error(`Task not found: ${activeAssignment.taskId}`);
      }

      console.log('🔍 Sending request to:', API_ENDPOINTS.chat);
      console.log('🔍 Request payload:', {
        messageCount: updatedMessages.length,
        model: 'claude-sonnet-4-5-20250929',
        hasSystemPrompt: !!getTaskSystemPrompt(taskKey),
        hasTaskMetadata: true
      });
      
      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          system: getTaskSystemPrompt(taskKey),
          messages: updatedMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          })),
          // Include sessionId for backend tracking
          sessionId: sessionId,
          // Include task metadata for backend evaluation
          taskMetadata: {
            title: task.title,
            problemStatement: task.problemStatement,
            teachingPrompt: task.teachingPrompt,
            targetConcepts: task.targetConcepts,
            correctSolutionPathway: task.correctSolutionPathway,
            misconceptions: task.misconceptions
          }
        })
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('❌ API Error Response:', errorData);
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);

      // Capture sessionId from backend response
      if (data.sessionId && !sessionId) {
        console.log('📝 Session ID received from backend:', data.sessionId);
        setSessionId(data.sessionId);
      }

      if (data.content && data.content[0]) {
        const aiMessage = { role: 'assistant', content: data.content[0].text };
        setMessages([...updatedMessages, aiMessage]);
      } else {
        console.error('❌ Invalid response format:', data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Full Error Details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('API Endpoint:', API_ENDPOINTS.chat);
      
      // Provide more helpful error message
      let errorMessage = "Oops! I had trouble connecting. Can you try explaining that again?";
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = "I couldn't reach the server. Please check:\n1. Is the backend server running on port 3002?\n2. Check your browser console for more details.";
      } else if (error.message.includes('API Error: 500')) {
        errorMessage = "The server encountered an error. Please check the backend logs.";
      } else if (error.message.includes('API key')) {
        errorMessage = "API key configuration issue. Please check backend environment variables.";
      }
      
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Complete session - evaluation will be done by backend
  const completeSession = () => {
    if (!sessionId) {
      console.error('❌ No session ID available - cannot complete session');
      alert('Error: Session tracking failed. Please try your last message again.');
      return;
    }

    const updatedAssignments = assignments.map(a =>
      a.id === activeAssignment.id
        ? {
            ...a,
            status: 'completed',
            completedDate: new Date().toISOString().split('T')[0],
            messages: messages,
            sessionId: sessionId // Use actual backend session ID
          }
        : a
    );

    setAssignments(updatedAssignments);
    setView('feedback');

    // Fetch evaluation from backend after completion
    fetchEvaluations();
  };

  // Render badge based on weighted total score (0-100)
  const getBadge = (totalScore) => {
    if (totalScore >= 85) return { name: 'Master Teacher', icon: '🏆', color: 'bg-yellow-500' };
    if (totalScore >= 70) return { name: 'Great Explainer', icon: '⭐', color: 'bg-blue-500' };
    if (totalScore >= 50) return { name: 'Good Helper', icon: '👍', color: 'bg-green-500' };
    return { name: 'Getting Started', icon: '🌱', color: 'bg-gray-500' };
  };

  // How It Works steps data
  const howItWorksSteps = [
    {
      id: 'T1',
      title: 'Teacher chooses a task (< 5 mins, real time feedback)',
      icon: '🧑‍🏫',
      role: 'Teacher',
      color: 'indigo',
      description: 'Select from curriculum-aligned tasks designed to assess deeper understanding',
      illustration: <Target className="w-16 h-16 text-indigo-600" />
    },
    {
      id: 'T2',
      title: 'Teacher assigns to student(s)',
      icon: '📝',
      role: 'Teacher',
      color: 'indigo',
      description: 'Assign tasks to individual students or groups with one click',
      illustration: <Users className="w-16 h-16 text-indigo-600" />
    },
    {
      id: 'S1',
      title: 'Student collaborates with AI solving problems',
      icon: '🎓',
      role: 'Student',
      color: 'green',
      description: 'Students work alongside AI to solve problems, demonstrating their understanding',
      illustration: <Award className="w-16 h-16 text-green-600" />
    },
    {
      id: 'S2',
      title: 'Student builds evidence and confidence',
      icon: '📚',
      role: 'Student',
      color: 'green',
      description: 'Evidence of understanding is collected automatically as students teach',
      illustration: <BarChart3 className="w-16 h-16 text-green-600" />
    },
    {
      id: 'All',
      title: 'Everyone gets feedback & recommendation',
      icon: '💬',
      role: 'All',
      color: 'purple',
      description: 'Teachers, parents, and students receive actionable insights and next steps',
      illustration: <MessageSquare className="w-16 h-16 text-purple-600" />
    }
  ];

  // Auto-advance carousel
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % howItWorksSteps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Rotate mascot emotions every 0.5 seconds
  React.useEffect(() => {
    const emotions = ['happy', 'curious', 'excited', 'confident', 'encouraging', 'listening'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % emotions.length;
      setMascotEmotion(emotions[currentIndex]);
      console.log('Emotion changed to:', emotions[currentIndex]);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // LANDING PAGE
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              {/* Zippy mascot - centered */}
              <div style={{ width: '90px', height: '90px', marginBottom: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <LumoMascot emotion={mascotEmotion} size="medium" />
              </div>
              {/* Title */}
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900" style={{ marginBottom: '24px' }}>
                Cognality Learning
              </h1>
              <p className="text-2xl md:text-3xl text-gray-700 mb-12 font-light italic">
                "Different minds, equal value — learning is more than a score."
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <button
                  onClick={() => {
                    setView('login');
                    setTimeout(() => handleLogin('teacher', { name: 'Ms. Johnson', id: 'teacher_1' }), 100);
                  }}
                  className="w-64 px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition transform hover:scale-105 shadow-lg"
                >
                  I'm a Teacher
                </button>
                <button
                  onClick={() => {
                    setView('login');
                    setTimeout(() => handleLogin('student', { name: 'Alex Rodriguez', id: 1 }), 100);
                  }}
                  className="w-64 px-8 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition transform hover:scale-105 shadow-lg"
                >
                  I'm a Student
                </button>
                <button
                  onClick={() => {
                    setView('login');
                    setTimeout(() => handleLogin('parent', { name: 'Parent of Alex', id: 'parent_1', childId: 1 }), 100);
                  }}
                  className="w-64 px-8 py-4 bg-purple-600 text-white rounded-xl font-semibold text-lg hover:bg-purple-700 transition transform hover:scale-105 shadow-lg"
                >
                  I'm a Parent
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-white rounded-3xl shadow-2xl backdrop-blur-xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              How It Works
            </h2>

            {/* Step Detail Popup */}
            {showStepDetail && (
              <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-indigo-200 animate-fadeIn">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    {howItWorksSteps[activeStep].illustration}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{howItWorksSteps[activeStep].icon}</span>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          howItWorksSteps[activeStep].color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                          howItWorksSteps[activeStep].color === 'green' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {howItWorksSteps[activeStep].role}
                        </span>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">
                          {howItWorksSteps[activeStep].title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-gray-700 text-lg">
                      {howItWorksSteps[activeStep].description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Horizontal Scrollable Cards */}
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {howItWorksSteps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      setActiveStep(index);
                      setShowStepDetail(true);
                    }}
                    onMouseEnter={() => setActiveStep(index)}
                    className={`flex-shrink-0 w-48 p-6 rounded-2xl transition-all transform snap-center ${
                      activeStep === index
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white scale-110 shadow-2xl'
                        : 'bg-white text-gray-700 hover:shadow-lg hover:scale-105'
                    }`}
                  >
                    <div className="text-5xl mb-3 animate-bounce">{step.icon}</div>
                    <h4 className="font-semibold text-sm leading-tight">
                      {step.title}
                    </h4>
                  </button>
                ))}
              </div>

              {/* Dot Indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {howItWorksSteps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      setActiveStep(index);
                      setShowStepDetail(true);
                    }}
                    className={`w-3 h-3 rounded-full transition-all ${
                      activeStep === index
                        ? 'bg-indigo-600 w-8'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <button
                onClick={() => setView('login')}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
              >
                Get Started Today
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOGIN VIEW (Simple modal-style)
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '32px' }}>
            {/* Zippy mascot - centered */}
            <div style={{ width: '65px', height: '65px', marginBottom: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <LumoMascot emotion={mascotEmotion} size="small" />
            </div>
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900" style={{ marginBottom: '8px' }}>Cognality Learning</h1>
            <p className="text-gray-600 mt-2">Transform assessment by teaching AI</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleLogin('teacher', { name: 'Ms. Johnson', id: 'teacher_1' })}
              className="w-full flex items-center justify-between p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">Teacher</div>
                  <div className="text-sm text-indigo-200">Assign tasks & review progress</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleLogin('student', { name: 'Alex Rodriguez', id: 1 })}
              className="w-full flex items-center justify-between p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">Student</div>
                  <div className="text-sm text-green-200">Teach AI & earn badges</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleLogin('parent', { name: 'Parent of Alex', id: 'parent_1', childId: 1 })}
              className="w-full flex items-center justify-between p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <div className="flex items-center gap-3">
                <UserCircle className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">Parent</div>
                  <div className="text-sm text-purple-200">View child's progress</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TEACHER DASHBOARD
  if (view === 'teacherDashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-indigo-600 text-white p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
              <p className="text-indigo-200">Welcome, {currentUser.name}</p>
            </div>
            <button
              onClick={() => { setUserRole(null); setView('login'); }}
              className="px-4 py-2 bg-indigo-700 rounded-lg hover:bg-indigo-800"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <button
              onClick={() => setView('teacherAssignTask')}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border-2 border-transparent hover:border-indigo-500"
            >
              <Target className="w-12 h-12 text-indigo-600 mb-3" />
              <h3 className="text-xl font-semibold mb-2">Assign New Task</h3>
              <p className="text-gray-600">Choose a task and assign to students</p>
            </button>

            <button
              onClick={() => setView('teacherReviewAssignments')}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border-2 border-transparent hover:border-indigo-500"
            >
              <BarChart3 className="w-12 h-12 text-indigo-600 mb-3" />
              <h3 className="text-xl font-semibold mb-2">Review Progress</h3>
              <p className="text-gray-600">View student work & provide feedback</p>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Assignments</h2>
            <div className="space-y-3">
              {assignments.slice(0, 5).map(assignment => (
                <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">{assignment.studentName}</div>
                    <div className="text-sm text-gray-600">{assignment.taskTitle}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {assignment.status.replace('_', ' ')}
                    </span>
                    {assignment.status === 'completed' && (
                      <span className="text-sm font-semibold text-indigo-600">
                        Score: {assignment.evaluation?.totalScore?.toFixed(0) || 0}/100
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TEACHER: ASSIGN TASK
  if (view === 'teacherAssignTask') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-indigo-600 text-white p-6">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button onClick={() => setView('teacherDashboard')} className="p-2 hover:bg-indigo-700 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Assign New Task</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Step 1: Choose Task</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(TASKS).map(task => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskForAssignment(task)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    selectedTaskForAssignment?.id === task.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">{task.grade}</span>
                    <StandardBadge standardId={task.standardId} standardCode={task.standard} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedTaskForAssignment && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Step 2: Select Students</h2>
              <div className="space-y-2">
                {MOCK_STUDENTS.map(student => (
                  <label key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedStudentsForAssignment.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentsForAssignment([...selectedStudentsForAssignment, student.id]);
                        } else {
                          setSelectedStudentsForAssignment(selectedStudentsForAssignment.filter(id => id !== student.id));
                        }
                      }}
                      className="w-5 h-5 text-indigo-600"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{student.name}</div>
                      <div className="text-sm text-gray-600">{student.grade} Grade • {student.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {selectedTaskForAssignment && selectedStudentsForAssignment.length > 0 && (
            <button
              onClick={handleCreateAssignment}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Assign Task to {selectedStudentsForAssignment.length} Student(s)
            </button>
          )}
        </div>
      </div>
    );
  }

  // TEACHER: REVIEW ASSIGNMENTS
  if (view === 'teacherReviewAssignments') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-indigo-600 text-white p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('teacherDashboard')} className="p-2 hover:bg-indigo-700 rounded">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">Review Student Work</h1>
            </div>
            <button
              onClick={fetchEvaluations}
              disabled={loadingEvaluations}
              className="px-4 py-2 bg-indigo-700 rounded-lg hover:bg-indigo-800 disabled:opacity-50 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {loadingEvaluations ? 'Loading...' : 'Refresh Evaluations'}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.filter(a => a.status !== 'assigned').map(assignment => {
              const badge = getBadge(assignment.evaluation?.totalScore || 0);
              return (
                <button
                  key={assignment.id}
                  onClick={() => {
                    setSelectedStudentForDetail(assignment);
                    setView('studentDetail');
                  }}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{assignment.studentName}</h3>
                      <p className="text-sm text-gray-600">{assignment.taskTitle}</p>
                    </div>
                    {assignment.status === 'completed' && (
                      <div className={`${badge.color} text-white px-2 py-1 rounded text-xs`}>
                        {badge.icon} {badge.name}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(() => {
                      // Find evaluation: match by sessionId first, then fallback to latest by taskTitle
                      let evaluation = null;

                      if (evaluationData?.conversations) {
                        // Try sessionId match (most reliable)
                        if (assignment.sessionId) {
                          const conv = evaluationData.conversations.find(
                            c => c.sessionId === assignment.sessionId
                          );
                          if (conv) evaluation = conv.evaluation;
                        }

                        // Fallback: Find by taskTitle, get LATEST one
                        if (!evaluation) {
                          const matchingConvs = evaluationData.conversations.filter(
                            c => c.taskTitle === assignment.taskTitle
                          );
                          if (matchingConvs.length > 0) {
                            const latest = matchingConvs.sort((a, b) =>
                              new Date(b.updatedAt || b.timestamp) - new Date(a.updatedAt || a.timestamp)
                            )[0];
                            evaluation = latest.evaluation;
                          }
                        }
                      }

                      const displayScore = evaluation && !evaluation.error
                        ? evaluation.totalScore
                        : assignment.evaluation?.totalScore || 0;
                      
                      return (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Evaluation Score:</span>
                          <span className={`font-semibold ${
                            displayScore >= 75 ? 'text-green-600' :
                            displayScore >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {displayScore}/100
                          </span>
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {assignment.status.replace('_', ' ')}
                      </span>
                    </div>

                    {assignment.completedDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Completed:</span>
                        <span>{assignment.completedDate}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // TEACHER: FEEDBACK VIEW
  if (view === 'teacherFeedback' && selectedAssignmentForReview) {
    const assignment = selectedAssignmentForReview;
    const badge = getBadge(assignment.evaluation?.totalScore || 0);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-indigo-600 text-white p-6">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button onClick={() => setView('teacherReviewAssignments')} className="p-2 hover:bg-indigo-700 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{assignment.studentName}'s Work</h1>
              <p className="text-indigo-200">{assignment.taskTitle}</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Assessment Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Badge Earned</div>
                <div className={`${badge.color} text-white px-3 py-2 rounded inline-block`}>
                  {badge.icon} {badge.name}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Evaluation Breakdown</h2>
            {(() => {
              // Find evaluation: match by sessionId first, then fallback to latest by taskTitle
              let evaluation = null;

              if (evaluationData?.conversations) {
                // Try sessionId match (most reliable)
                if (assignment.sessionId) {
                  const conv = evaluationData.conversations.find(
                    c => c.sessionId === assignment.sessionId
                  );
                  if (conv) evaluation = conv.evaluation;
                }

                // Fallback: Find by taskTitle, get LATEST one
                if (!evaluation) {
                  const matchingConvs = evaluationData.conversations.filter(
                    c => c.taskTitle === assignment.taskTitle
                  );
                  if (matchingConvs.length > 0) {
                    const latest = matchingConvs.sort((a, b) =>
                      new Date(b.updatedAt || b.timestamp) - new Date(a.updatedAt || a.timestamp)
                    )[0];
                    evaluation = latest.evaluation;
                  }
                }
              }
              
              if (!evaluation || evaluation.error) {
                return (
                  <div className="text-center py-6 text-gray-500">
                    {loadingEvaluations ? (
                      <div>Loading evaluation...</div>
                    ) : (
                      <div>
                        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Evaluation not available yet</p>
                      </div>
                    )}
                  </div>
                );
              }

              const categoryScores = evaluation.categoryScores || {};
              const justifications = evaluation.justifications || {};

              return (
                <div className="space-y-3">
                  {Object.entries(EVALUATION_CATEGORIES).map(([key, category]) => {
                    const score = categoryScores[key] || 0;
                    const justification = justifications[key] || 'No justification available';
                    const scoreColor = score >= 3 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-red-600';

                    return (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold">{category.label}</div>
                            <div className="text-sm text-gray-600">{category.description}</div>
                          </div>
                          <div className={`text-xl font-bold ${scoreColor} ml-4`}>
                            {score}/4
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-600 italic">"{justification}"</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
            <div className="space-y-3">
              {(assignment.evaluation?.totalScore || 0) >= 80 ? (
                <>
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                    <Trophy className="w-6 h-6 text-green-600 mt-1" />
                    <div>
                      <div className="font-semibold text-green-900">Excellent Understanding!</div>
                      <div className="text-sm text-green-700">Student demonstrated all key concepts. Ready for more advanced challenges.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <Lightbulb className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <div className="font-semibold text-blue-900">Next Steps</div>
                      <div className="text-sm text-blue-700">Consider assigning quadratic patterns or system of equations tasks.</div>
                    </div>
                  </div>
                </>
              ) : (assignment.evaluation?.totalScore || 0) >= 60 ? (
                <>
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-yellow-600 mt-1" />
                    <div>
                      <div className="font-semibold text-yellow-900">Partial Understanding</div>
                      <div className="text-sm text-yellow-700">Student grasped some concepts but needs additional support to reach proficiency.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <div className="font-semibold text-blue-900">Suggested Support</div>
                      <div className="text-sm text-blue-700">Small group work or peer teaching might help reinforce concepts.</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
                    <div>
                      <div className="font-semibold text-red-900">Additional Support Needed</div>
                      <div className="text-sm text-red-700">Student struggled with core concepts. One-on-one intervention recommended.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                    <HelpCircle className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <div className="font-semibold text-purple-900">Intervention Strategy</div>
                      <div className="text-sm text-purple-700">Use concrete manipulatives and visual models before retrying this task.</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STUDENT DETAIL VIEW (Teacher sees detailed student performance)
  if (view === 'studentDetail' && selectedStudentForDetail) {
    const student = selectedStudentForDetail;
    const badge = getBadge(student.evaluation?.totalScore || 0);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-indigo-600 text-white p-6">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button onClick={() => setView('teacherReviewAssignments')} className="p-2 hover:bg-indigo-700 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{student.studentName}</h1>
              <p className="text-indigo-200">{student.taskTitle} • {student.status === 'completed' ? `Completed ${student.completedDate}` : 'In Progress'}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Evidence & Performance */}
            <div className="lg:col-span-2 space-y-6">
              {/* Evaluation Summary */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Evaluation Summary</h2>
                {(() => {
                  // Find evaluation: match by sessionId first, then fallback to latest by taskTitle
                  let evaluation = null;

                  if (evaluationData?.conversations) {
                    // Try sessionId match (most reliable)
                    if (student.sessionId) {
                      const conv = evaluationData.conversations.find(
                        c => c.sessionId === student.sessionId
                      );
                      if (conv) evaluation = conv.evaluation;
                    }

                    // Fallback: Find by taskTitle, get LATEST one
                    if (!evaluation) {
                      const matchingConvs = evaluationData.conversations.filter(
                        c => c.taskTitle === student.taskTitle
                      );
                      if (matchingConvs.length > 0) {
                        const latest = matchingConvs.sort((a, b) =>
                          new Date(b.updatedAt || b.timestamp) - new Date(a.updatedAt || a.timestamp)
                        )[0];
                        evaluation = latest.evaluation;
                      }
                    }
                  }
                  
                  if (!evaluation || evaluation.error) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        {loadingEvaluations ? (
                          <div>Loading evaluation...</div>
                        ) : (
                          <div>
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>Evaluation not available yet</p>
                            <p className="text-sm mt-2">Complete the conversation to see evaluation results</p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const totalScore = evaluation.totalScore || 0;
                  const categoryScores = evaluation.categoryScores || {};
                  const justifications = evaluation.justifications || {};

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Total Score</div>
                          <div className="text-3xl font-bold text-indigo-600">{totalScore}/100</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Badge Earned</div>
                          <div className={`${badge.color} text-white px-3 py-2 rounded inline-block`}>
                            {badge.icon} {badge.name}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(EVALUATION_CATEGORIES).map(([key, category]) => {
                          const score = categoryScores[key] || 0;
                          const justification = justifications[key] || 'No justification available';
                          const scoreColor = score >= 3 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-red-600';
                          const bgColor = score >= 3 ? 'bg-green-50' : score >= 2 ? 'bg-yellow-50' : 'bg-red-50';

                          return (
                            <div key={key} className={`p-4 rounded-lg border-l-4 ${bgColor} ${
                              score >= 3 ? 'border-green-500' : score >= 2 ? 'border-yellow-500' : 'border-red-500'
                            }`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{category.label}</div>
                                  <div className="text-sm text-gray-600 mt-1">{category.description}</div>
                                </div>
                                <div className={`text-2xl font-bold ${scoreColor} ml-4`}>
                                  {score}/4
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-sm font-medium text-gray-700 mb-1">Evidence:</div>
                                <div className="text-sm text-gray-600 italic">"{justification}"</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 4-Category Evaluation Rubric */}
              {student.evaluation && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Competency Evaluation</h2>

                  {/* Total Score Display */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600 font-medium">Weighted Total Score</div>
                        <div className="text-3xl font-bold text-indigo-600">
                          {student.evaluation.totalScore?.toFixed(1) || 0}/100
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Proficiency Level</div>
                        <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                          student.evaluation.totalScore >= 80 ? 'bg-green-100 text-green-700' :
                          student.evaluation.totalScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {student.evaluation.totalScore >= 80 ? 'PROFICIENT' :
                           student.evaluation.totalScore >= 60 ? 'DEVELOPING' : 'EMERGING'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Scores */}
                  <div className="space-y-4">
                    {Object.entries(EVALUATION_CATEGORIES).map(([key, category]) => {
                      const score = student.evaluation.categoryScores?.[key] || 0;
                      const justification = student.evaluation.justifications?.[key] || 'No evaluation available';

                      return (
                        <div key={key} className="p-4 bg-gray-50 rounded-lg border-l-4 border-indigo-400">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{category.label}</h3>
                              <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-2xl font-bold text-indigo-600">{score}/4</div>
                              <div className="text-xs text-gray-500">Weight: {(category.weight * 100).toFixed(0)}%</div>
                            </div>
                          </div>
                          <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                            <div className="text-xs font-semibold text-gray-600 mb-1">Evidence:</div>
                            <p className="text-sm text-gray-700">{justification}</p>
                          </div>
                          {/* Score Bar */}
                          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 transition-all duration-500"
                              style={{ width: `${(score / 4) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Evaluation Legend */}
                  <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Scoring Scale (1-4):</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>• <strong>4 - Strong:</strong> Demonstrates mastery</div>
                      <div>• <strong>3 - Adequate:</strong> Generally proficient</div>
                      <div>• <strong>2 - Emerging:</strong> Partial understanding</div>
                      <div>• <strong>1 - Weak:</strong> Limited demonstration</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Conversation History */}
              {student.messages && student.messages.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Full Conversation</h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {student.messages.map((msg, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${
                        msg.role === 'assistant' ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-green-50 border-l-4 border-green-400'
                      }`}>
                        <div className="font-semibold text-xs mb-1 text-gray-600">
                          {msg.role === 'assistant' ? 'Zippy (AI)' : 'Student'}
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation Snippets (Highlights) */}
              {student.conversationSnippets && student.conversationSnippets.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Key Conversation Moments</h2>
                  <div className="space-y-4">
                    {student.conversationSnippets.map((snippet, idx) => (
                      <div key={idx} className="border-l-4 border-indigo-500 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{snippet.speaker}:</span>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                            {snippet.tag}
                          </span>
                        </div>
                        <p className="text-gray-700 italic">"{snippet.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column - Recommendations */}
            <div className="space-y-6">
              {/* Recommendations */}
              {student.recommendations && student.recommendations.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
                  <div className="space-y-3">
                    {student.recommendations.map((rec, idx) => (
                      <div key={idx} className={`p-4 rounded-lg ${
                        rec.type === 'intervention' ? 'bg-red-50 border border-red-200' :
                        rec.type === 'support' ? 'bg-yellow-50 border border-yellow-200' :
                        rec.type === 'peer' ? 'bg-blue-50 border border-blue-200' :
                        'bg-green-50 border border-green-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          <span className="text-2xl">{rec.icon}</span>
                          <p className="text-sm flex-1">{rec.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Send Feedback
                  </button>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                    <Target className="w-4 h-4" />
                    Assign New Task
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    View All Progress
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STUDENT DASHBOARD
  if (view === 'studentDashboard') {
    const studentAssignments = assignments.filter(a => a.studentId === currentUser.id);
    const completedCount = studentAssignments.filter(a => a.status === 'completed').length;
    const totalBadges = studentAssignments.filter(a => a.status === 'completed').map(a => getBadge(a.evaluation?.totalScore || 0));

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-600 text-white p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Learning Dashboard</h1>
              <p className="text-green-200">Welcome, {currentUser.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('browseTasks')}
                className="px-4 py-2 bg-green-700 rounded-lg hover:bg-green-800 flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Browse Tasks
              </button>
              <button
                onClick={() => { setUserRole(null); setView('login'); }}
                className="px-4 py-2 bg-green-700 rounded-lg hover:bg-green-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-semibold">Tasks Assigned</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{studentAssignments.length}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h3 className="text-lg font-semibold">Completed</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-8 h-8 text-yellow-600" />
                <h3 className="text-lg font-semibold">Badges Earned</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{completedCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">My Badges</h2>
            <div className="flex flex-wrap gap-3">
              {totalBadges.length > 0 ? totalBadges.map((badge, idx) => (
                <div key={idx} className={`${badge.color} text-white px-4 py-2 rounded-lg font-semibold`}>
                  {badge.icon} {badge.name}
                </div>
              )) : (
                <p className="text-gray-500">Complete tasks to earn badges!</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">My Assignments</h2>
            <div className="space-y-3">
              {studentAssignments.map(assignment => (
                <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">{assignment.taskTitle}</h3>
                    <p className="text-sm text-gray-600">
                      {assignment.status === 'completed'
                        ? `Completed ${assignment.completedDate}`
                        : assignment.status === 'in_progress'
                        ? 'Continue teaching...'
                        : 'Ready to start'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {assignment.status === 'completed' ? (
                      <>
                        <div className={`${getBadge(assignment.evaluation?.totalScore || 0).color} text-white px-3 py-1 rounded`}>
                          {getBadge(assignment.evaluation?.totalScore || 0).icon}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAssignmentForReview(assignment);
                            setView('feedback');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          View Feedback
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startTeachingSession(assignment)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        {assignment.status === 'in_progress' ? 'Continue' : 'Start Teaching'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BROWSE TASKS VIEW (Student)
  if (view === 'browseTasks') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-600 text-white p-6">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button
              onClick={() => setView('studentDashboard')}
              className="p-2 hover:bg-green-700 rounded"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Browse Tasks</h1>
              <p className="text-green-200">Explore available learning tasks</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <TaskCollectionBrowser
            onSelectTask={(task) => {
              // Handle task selection - could create an assignment or just view details
              console.log('Selected task:', task);
              // For now, just log the task. In the future, could create an assignment
            }}
          />
        </div>
      </div>
    );
  }

  // TEACHING SESSION VIEW (Student)
  if (view === 'teaching' && activeAssignment) {
    // Convert snake_case to camelCase for TASKS lookup
    const taskKey = activeAssignment.taskId.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    const task = TASKS[taskKey];

    if (!task) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Task Not Found</h2>
            <p className="text-gray-600 mb-4">Task ID: {activeAssignment.taskId}</p>
            <button
              onClick={() => setView('studentDashboard')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    // Detect Lumo's emotion based on message content
    const getEmotionFromContent = (content) => {
      const lowerContent = content.toLowerCase();

      if (lowerContent.includes('?') || lowerContent.includes('confused') || lowerContent.includes('don\'t understand')) return 'confused';
      if (lowerContent.includes('!') && (lowerContent.includes('oh') || lowerContent.includes('wow') || lowerContent.includes('amazing'))) return 'excited';
      if (lowerContent.includes('thank') || lowerContent.includes('helpful') || lowerContent.includes('that helps')) return 'encouraging';
      if (lowerContent.includes('hmm') || lowerContent.includes('let me think') || lowerContent.includes('i\'m thinking')) return 'thinking';
      if (lowerContent.includes('i understand') || lowerContent.includes('i got it') || lowerContent.includes('makes sense')) return 'confident';
      if (lowerContent.includes('can you') || lowerContent.includes('could you') || lowerContent.includes('explain')) return 'listening';

      return 'curious';
    };

    // Get emotion for a specific message
    const getMessageEmotion = (message) => {
      if (message.role !== 'assistant') return null;
      return getEmotionFromContent(message.content);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
        <div className="bg-green-600 text-white p-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setView('studentDashboard')} className="p-2 hover:bg-green-700 rounded">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold">{task.title}</h2>
                  <p className="text-sm text-green-200">{task.grade} • {task.standard}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={completeSession}
                  disabled={messages.length === 0}
                  className="px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Session
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg flex flex-col h-[calc(100vh-200px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0" style={{ width: '50px', height: '50px' }}>
                      <LumoMascot emotion={getMessageEmotion(msg)} size="small" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0" style={{ width: '50px', height: '50px' }}>
                    <LumoMascot emotion="thinking" size="small" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your explanation to teach Zippy..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Task Presentation - Sticky at Top */}
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
              <h3 className="font-semibold mb-3 text-sm text-gray-700">Task</h3>
              <img
                src={task.imageUrl}
                alt={task.title}
                className="w-full rounded-lg mb-2"
              />
              <p className="text-xs text-gray-600">{task.description}</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                <Lightbulb className="w-5 h-5" />
                Teaching Tips
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Explain the <strong>why</strong>, not just the answer</li>
                <li>• Use examples to show patterns</li>
                <li>• Check if Zippy understands each step</li>
                <li>• Verify with different numbers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FEEDBACK VIEW (Student/Parent/Teacher after completion)
  if (view === 'feedback') {
    const assignment = selectedAssignmentForReview || activeAssignment;
    const badge = getBadge(assignment.evaluation?.totalScore || 0);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="max-w-4xl mx-auto text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
            <p className="text-green-100">Great job teaching Zippy!</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="mb-6">
              <div className={`${badge.color} text-white px-6 py-3 rounded-lg inline-block text-2xl font-bold mb-2`}>
                {badge.icon} {badge.name}
              </div>
              <p className="text-gray-600">You've earned a badge!</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Score</div>
                <div className="text-3xl font-bold text-green-600">{assignment.evaluation?.totalScore?.toFixed(1) || 0}/100</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Messages Sent</div>
                <div className="text-3xl font-bold text-blue-600">{assignment.messages?.length || messages.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-600" />
              Evaluation Results
            </h2>
            {(() => {
              // Find evaluation: match by sessionId if available, fallback to taskTitle
              let evaluation;

              if (assignment.sessionId && evaluationData?.conversations) {
                // Match by sessionId (most reliable)
                const conv = evaluationData.conversations.find(
                  c => c.sessionId === assignment.sessionId
                );
                evaluation = conv?.evaluation || assignment.evaluation;
              } else {
                // Fallback to taskTitle matching (for old data)
                evaluation = evaluationData?.conversations?.find(
                  conv => conv.taskTitle === assignment.taskTitle
                )?.evaluation || assignment.evaluation;
              }

              if (!evaluation) {
                // No evaluation available yet
                return (
                  <div className="text-center py-6 text-gray-500">
                    <p>⏳ Evaluation in progress... Please refresh in a moment.</p>
                    <button
                      onClick={fetchEvaluations}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Refresh Evaluation
                    </button>
                  </div>
                );
              }

              if (evaluation.error) {
                // Evaluation failed
                return (
                  <div className="text-center py-6 text-red-600">
                    <p>❌ Evaluation failed: {evaluation.message || 'Unknown error'}</p>
                    <p className="text-sm text-gray-600 mt-2">Please contact your teacher.</p>
                  </div>
                );
              }

              const categoryScores = evaluation.categoryScores || {};
              const justifications = evaluation.justifications || {};
              const totalScore = evaluation.totalScore || 0;

              return (
                <>
                  <div className="mb-4 p-4 bg-indigo-50 rounded-lg text-center">
                    <div className="text-sm text-gray-600 mb-1">Overall Score</div>
                    <div className="text-4xl font-bold text-indigo-600">{totalScore}/100</div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(EVALUATION_CATEGORIES).map(([key, category]) => {
                      const score = categoryScores[key] || 0;
                      const justification = justifications[key] || 'No justification available';
                      const scoreColor = score >= 3 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-red-600';
                      const bgColor = score >= 3 ? 'bg-green-50' : score >= 2 ? 'bg-yellow-50' : 'bg-red-50';

                      return (
                        <div key={key} className={`p-3 rounded-lg border-l-4 ${bgColor} ${
                          score >= 3 ? 'border-green-500' : score >= 2 ? 'border-yellow-500' : 'border-red-500'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-semibold">{category.label}</div>
                              <div className="text-sm text-gray-600">{category.description}</div>
                            </div>
                            <div className={`text-xl font-bold ${scoreColor} ml-4`}>
                              {score}/4
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-600 italic">"{justification}"</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-900">
              <TrendingUp className="w-6 h-6" />
              Next Steps
            </h2>
            {(assignment.evaluation?.totalScore || 0) >= 80 ? (
              <div className="space-y-2 text-blue-800">
                <p>🎉 <strong>Outstanding work!</strong> You explained all the key concepts clearly.</p>
                <p>💡 <strong>Challenge yourself:</strong> Try teaching a more advanced problem or help a classmate!</p>
              </div>
            ) : (assignment.evaluation?.totalScore || 0) >= 60 ? (
              <div className="space-y-2 text-blue-800">
                <p>👍 <strong>Good effort!</strong> You demonstrated understanding of some concepts.</p>
                <p>💡 <strong>Keep practicing:</strong> Try explaining the parts you missed to build stronger evidence.</p>
              </div>
            ) : (
              <div className="space-y-2 text-blue-800">
                <p>🌱 <strong>Keep learning!</strong> This is a challenging topic.</p>
                <p>💡 <strong>Try again:</strong> Ask your teacher for help understanding the concepts, then reteach Zippy.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (userRole === 'student') setView('studentDashboard');
              else if (userRole === 'teacher') setView('teacherDashboard');
              else if (userRole === 'parent') setView('parentDashboard');
            }}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // PARENT DASHBOARD
  if (view === 'parentDashboard') {
    const childAssignments = assignments.filter(a => a.studentId === currentUser.childId);
    const completedCount = childAssignments.filter(a => a.status === 'completed').length;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-purple-600 text-white p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Parent Dashboard</h1>
              <p className="text-purple-200">Viewing progress for Alex Rodriguez</p>
            </div>
            <button
              onClick={() => { setUserRole(null); setView('login'); }}
              className="px-4 py-2 bg-purple-700 rounded-lg hover:bg-purple-800"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-semibold">Total Tasks</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{childAssignments.length}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h3 className="text-lg font-semibold">Completed</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-8 h-8 text-yellow-600" />
                <h3 className="text-lg font-semibold">Badges Earned</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{completedCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {childAssignments.map(assignment => {
                const badge = getBadge(assignment.evaluation?.totalScore || 0);
                return (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{assignment.taskTitle}</h3>
                      <p className="text-sm text-gray-600">
                        {assignment.status === 'completed'
                          ? `Completed ${assignment.completedDate}`
                          : assignment.status === 'in_progress'
                          ? 'In progress...'
                          : 'Assigned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {assignment.status === 'completed' && (
                        <>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Score</div>
                            <div className="font-semibold">{assignment.evaluation?.totalScore?.toFixed(0) || 0}/100</div>
                          </div>
                          <div className={`${badge.color} text-white px-3 py-2 rounded`}>
                            {badge.icon} {badge.name}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedAssignmentForReview(assignment);
                              setView('feedback');
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                          >
                            View Details
                          </button>
                        </>
                      )}
                      {assignment.status === 'in_progress' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                          In Progress
                        </span>
                      )}
                      {assignment.status === 'assigned' && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
