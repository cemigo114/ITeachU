export const MOCK_STUDENTS = [
  { id: 1, name: 'Alex Rodriguez', grade: '8th', email: 'alex.r@school.edu' },
  { id: 2, name: 'Brianna Thompson', grade: '6th', email: 'brianna.t@school.edu' },
  { id: 3, name: 'Carlos Lopez', grade: '8th', email: 'carlos.l@school.edu' },
  { id: 4, name: 'Diana Chen', grade: '7th', email: 'diana.c@school.edu' },
];

export const EVALUATION_CATEGORIES = {
  conceptArticulation: { label: 'Concept Articulation', description: 'Ability to precisely use terminology, formalism and variable definitions', weight: 0.30 },
  logicCoherence: { label: 'Logic Coherence', description: 'Internal consistency and soundness of reasoning and problem-solving steps', weight: 0.30 },
  misconceptionCorrection: { label: 'Misconception Correction', description: 'Ability to identify, challenge, and correct incorrect reasoning', weight: 0.30 },
  cognitiveResilience: { label: 'Cognitive Resilience', description: 'Independence, persistence, and willingness to re-engage when faced with challenges', weight: 0.10 },
};

export const MOCK_ASSIGNMENTS = [
  {
    id: 1, studentId: 1, studentName: 'Alex Rodriguez', taskId: 'stack_of_cups',
    taskTitle: 'Stack of Cups Challenge', status: 'completed', completedDate: '2025-10-06',
    messages: [
      { role: 'assistant', content: "Hi! I'm Zippy! 🎉 I'd love to learn about this cup stacking pattern from you!\n\n*looks at the picture*\n\nI see 2 cups is 16cm and 4 cups is 20cm...\n\nHmm, for 8 cups... If 2 cups is 16cm, then 1 cup must be 8cm, right? So 8 cups would be 8 × 8 = 64cm!\n\nBut wait, the picture shows 8 cups is 28cm. That doesn't match what I calculated! 🤔\n\nI'm confused about how this pattern works. Can you help me understand?" },
      { role: 'user', content: "No, Zippy! The cups don't just stack on top of each other. They nest inside each other. Only the rim of each cup adds to the height." },
      { role: 'assistant', content: "Oh! So they go INSIDE each other? That's so cool! So the bottom cup is the full height, but the other cups slide into it and only their rims stick out?\n\nLet me see... if 2 cups is 16cm and 4 cups is 20cm, the difference is 4cm. So for 2 more cups, it's 4cm more?\n\nDoes that mean each rim is 2cm? How tall is just one cup by itself?" },
      { role: 'user', content: "Exactly! Each rim adds 2cm. To find the height of one cup, we can work backwards from the 2-cup stack. If 2 cups is 16cm, and the second cup only adds its 2cm rim, then the base cup must be 14cm." },
      { role: 'assistant', content: "OHHH! So one cup is 14cm tall! Let me check if I understand:\n\n- 1 cup = 14cm (the base)\n- 2 cups = 14cm + 2cm (one rim) = 16cm ✓\n- 4 cups = 14cm + 2cm + 2cm + 2cm (three rims) = 20cm ✓\n\nSo for 8 cups, it would be 14cm + (7 rims × 2cm) = 14 + 14 = 28cm!\n\nThat matches the picture! This makes so much more sense now! Can we make an equation for any number of cups?" },
      { role: 'user', content: "Yes! If we call the number of cups 'n' and the height 'h', then h = 14 + 2(n-1), which simplifies to h = 2n + 12." },
      { role: 'assistant', content: "Wow! So h = 2n + 12! Let me test this:\n\n- For n=2: h = 2(2) + 12 = 4 + 12 = 16cm ✓\n- For n=4: h = 2(4) + 12 = 8 + 12 = 20cm ✓\n- For n=8: h = 2(8) + 12 = 16 + 12 = 28cm ✓\n\nIt works for all of them! Thank you so much for teaching me! I finally understand how the cups nest and how to make an equation!" },
    ],
    evaluation: {
      categoryScores: { conceptArticulation: 4, logicCoherence: 4, misconceptionCorrection: 4, cognitiveResilience: 4 },
      justifications: {
        conceptArticulation: 'Student precisely explained nesting concept using clear mathematical terminology.',
        logicCoherence: 'Demonstrated excellent logical progression with systematic verification.',
        misconceptionCorrection: 'Successfully corrected proportional thinking error.',
        cognitiveResilience: 'Student independently structured explanations and extended to algebraic generalization.',
      },
      totalScore: 100,
    },
    conversationSnippets: [
      { speaker: 'Student', text: "No, Zippy! The cups don't just stack on top of each other.", tag: 'Conceptual explanation' },
      { speaker: 'AI', text: "Oh! So they go INSIDE each other? That's so cool!", tag: 'Learning moment' },
    ],
    recommendations: [
      { type: 'peer', icon: '📣', text: 'Alex can teach this concept to other students' },
      { type: 'next', icon: '📚', text: 'Ready for quadratic patterns (CCSS.MATH.8.F.B.5)' },
    ],
  },
  {
    id: 2, studentId: 2, studentName: 'Brianna Thompson', taskId: 'smoothie_recipe',
    taskTitle: 'Smoothie Recipe Ratios', status: 'completed', completedDate: '2025-10-05',
    messages: [
      { role: 'assistant', content: "Hi! I'm Zippy! 🎉 I'd love to learn about recipes from you!" },
      { role: 'user', content: 'No, Zippy. When you double a recipe, you multiply both ingredients by 2.' },
      { role: 'assistant', content: 'Oh! So I multiply both by 2? That makes more sense!' },
      { role: 'user', content: 'You multiply both by 3. So it would be 6 cups strawberries and 9 cups yogurt.' },
      { role: 'assistant', content: 'Got it! So I multiply both sides by the same number to keep the ratio! Thank you!' },
    ],
    evaluation: {
      categoryScores: { conceptArticulation: 3, logicCoherence: 3, misconceptionCorrection: 3, cognitiveResilience: 2 },
      justifications: {
        conceptArticulation: 'Student explained multiplicative scaling clearly but did not formalize the ratio.',
        logicCoherence: 'Reasoning was sound for doubling and tripling.',
        misconceptionCorrection: 'Successfully corrected additive thinking error.',
        cognitiveResilience: 'Student provided direct answers but did not independently extend concepts.',
      },
      totalScore: 73.75,
    },
    conversationSnippets: [
      { speaker: 'Student', text: 'When you double a recipe, you multiply both ingredients by 2.', tag: 'Correction provided' },
    ],
    recommendations: [
      { type: 'support', icon: '👥', text: 'Small group work on unit rates with visual models' },
    ],
  },
  {
    id: 3, studentId: 3, studentName: 'Carlos Lopez', taskId: 'stack_of_cups',
    taskTitle: 'Stack of Cups Challenge', status: 'in_progress', completedDate: null,
    messages: [
      { role: 'assistant', content: "Hi! I'm Zippy! I'm confused about how this pattern works." },
      { role: 'user', content: 'The cups stack up and each one adds more height.' },
      { role: 'assistant', content: "But if each cup is 8cm, then 8 cups should be 64cm? Can you show me with numbers?" },
    ],
    conversationSnippets: [
      { speaker: 'Student', text: 'The cups stack up and each one adds more height.', tag: 'Vague explanation' },
    ],
    recommendations: [
      { type: 'intervention', icon: '⚠️', text: 'One-on-one: Use physical cup manipulatives' },
    ],
  },
  { id: 4, studentId: 4, studentName: 'Diana Chen', taskId: 'smoothie_recipe', taskTitle: 'Smoothie Recipe Ratios', status: 'assigned', completedDate: null, messages: [] },
  { id: 5, studentId: 1, studentName: 'Alex Rodriguez', taskId: 'smoothie_recipe', taskTitle: 'Smoothie Recipe Ratios', status: 'assigned', completedDate: null, messages: [] },
];
