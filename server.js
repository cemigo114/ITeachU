import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { generateEvaluatorPrompt } from './src/utils/evaluatorPrompt.js';

const app = express();
const PORT = process.env.PORT || 3002;

// CORS configuration - allow requests from development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://cognality.netlify.app',
  'https://www.cognality.netlify.app',
  'https://cognalitylearning.com',
  'https://www.cognalitylearning.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.netlify.app') || origin.endsWith('.cognalitylearning.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    'content-type': req.headers['content-type']
  });
  next();
});

// File-based persistence paths
const DATA_DIR = path.join(process.cwd(), 'data');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const EVALUATIONS_FILE = path.join(DATA_DIR, 'evaluations.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File-based persistence utilities
const saveToFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`💾 Saved to ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error saving to ${path.basename(filePath)}:`, error.message);
  }
};

const loadFromFile = (filePath, defaultValue = []) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      console.log(`📂 Loaded from ${path.basename(filePath)}`);
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`❌ Error loading from ${path.basename(filePath)}:`, error.message);
  }
  return defaultValue;
};

// Store for conversation logs (with file persistence)
const conversationLogs = loadFromFile(CONVERSATIONS_FILE, []);

// Store for evaluations cache (with file persistence)
const evaluationCacheData = loadFromFile(EVALUATIONS_FILE, []);
const evaluationCache = new Map(evaluationCacheData); // conversationId -> evaluation result

// Store for sessions (with file persistence)
const sessionsData = loadFromFile(SESSIONS_FILE, []);
const sessions = new Map(sessionsData); // sessionId -> session data

console.log(`📊 Loaded ${conversationLogs.length} conversations, ${sessions.size} sessions, ${evaluationCache.size} evaluations`);

app.post('/api/chat', async (req, res) => {
  try {
    console.log('📨 Received chat request:', {
      messageCount: req.body.messages?.length || 0,
      model: req.body.model,
      hasTaskMetadata: !!req.body.taskMetadata,
      sessionId: req.body.sessionId || 'new'
    });

    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('❌ API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Extract sessionId and taskMetadata before sending to Anthropic (Anthropic doesn't accept custom fields)
    const { sessionId, taskMetadata, ...anthropicRequestBody } = req.body;

    // Generate or use existing sessionId
    const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare request body for Anthropic (only standard fields)
    const anthropicRequest = {
      model: anthropicRequestBody.model,
      max_tokens: anthropicRequestBody.max_tokens,
      system: anthropicRequestBody.system,
      messages: anthropicRequestBody.messages
    };

    console.log('📤 Sending to Anthropic:', {
      model: anthropicRequest.model,
      messageCount: anthropicRequest.messages?.length || 0,
      hasSystem: !!anthropicRequest.system
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicRequest)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Anthropic API error:', data);
      return res.status(response.status).json(data);
    }

    console.log('✅ Anthropic API success:', {
      responseLength: data.content?.[0]?.text?.length || 0,
      stopReason: data.stop_reason
    });

    // Find or create conversation log for this session
    let conversationLog = conversationLogs.find(log => log.sessionId === currentSessionId);

    if (conversationLog) {
      // Update existing conversation
      conversationLog.messages = anthropicRequest.messages;
      conversationLog.lastResponse = data.content[0].text;
      conversationLog.updatedAt = new Date().toISOString();
      console.log(`📝 Updated existing conversation for session ${currentSessionId}`);
    } else {
      // Create new conversation log
      conversationLog = {
        sessionId: currentSessionId,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: anthropicRequest.messages,
        lastResponse: data.content[0].text,
        model: anthropicRequest.model,
        system: anthropicRequest.system, // Store system prompt for context
        taskMetadata: taskMetadata || {} // Store task metadata if provided (extracted earlier)
      };
      conversationLogs.push(conversationLog);
      console.log(`📊 New conversation created for session ${currentSessionId} (${conversationLogs.length} total)`);
    }

    // Save conversations to file after update
    saveToFile(CONVERSATIONS_FILE, conversationLogs);

    // Return sessionId with response so frontend can track it
    res.json({
      ...data,
      sessionId: currentSessionId
    });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Evaluate a conversation using the Claude API and the evaluator prompt
 * @param {Object} conversationLog - The conversation log object
 * @param {string} sessionId - The session ID of the conversation
 * @returns {Promise<Object>} Evaluation result with scores and justifications
 */
async function evaluateConversation(conversationLog, sessionId) {
  try {
    // Check cache first
    if (evaluationCache.has(sessionId)) {
      console.log(`📋 Using cached evaluation for session ${sessionId}`);
      return evaluationCache.get(sessionId);
    }

    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    // Format conversation transcript for evaluator
    const transcript = conversationLog.messages.map((msg, idx) => {
      const role = msg.role === 'assistant' ? 'AI Protégé (Zippy)' : 'Student';
      return `${role}: ${msg.content}`;
    }).join('\n\n');

    // Build the evaluation request
    const evaluatorPrompt = generateEvaluatorPrompt();
    const taskMetadata = conversationLog.taskMetadata || {};

    const evaluationRequest = `Please evaluate the following student-AI Protégé conversation.

TASK METADATA:
- Task: ${taskMetadata.title || 'Unknown'}
- Target Concepts: ${taskMetadata.targetConcepts ? taskMetadata.targetConcepts.join(', ') : 'Not specified'}
- Correct Solution: ${taskMetadata.correctSolutionPathway || 'Not specified'}
- Known Misconceptions: ${taskMetadata.misconceptions ? taskMetadata.misconceptions.join('; ') : 'Not specified'}

CONVERSATION TRANSCRIPT:
${transcript}

Please provide your evaluation in the specified JSON format.`;

    console.log(`🔍 Evaluating session ${sessionId}...`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: evaluatorPrompt,
        messages: [
          {
            role: 'user',
            content: evaluationRequest
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Evaluation API error:', data);
      throw new Error(`Evaluation failed: ${data.error?.message || 'Unknown error'}`);
    }

    // Parse the evaluation result
    const evaluationText = data.content[0].text;

    // Try to extract JSON from the response
    let evaluation;
    try {
      // Look for JSON block in the response
      const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        evaluation = JSON.parse(evaluationText);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse evaluation JSON:', evaluationText);
      throw new Error('Invalid evaluation format from API');
    }

    // Validate evaluation structure
    if (!evaluation.categoryScores || !evaluation.justifications || typeof evaluation.totalScore !== 'number') {
      console.error('❌ Invalid evaluation structure:', evaluation);
      throw new Error('Evaluation missing required fields');
    }

    console.log(`✅ Evaluation complete for session ${sessionId}: ${evaluation.totalScore}/100`);

    // Cache the result
    evaluationCache.set(sessionId, evaluation);

    // Save evaluations cache to file
    saveToFile(EVALUATIONS_FILE, Array.from(evaluationCache.entries()));

    return evaluation;
  } catch (error) {
    console.error(`❌ Evaluation error for session ${sessionId}:`, error);
    // Return a fallback evaluation indicating error
    return {
      error: true,
      message: error.message,
      categoryScores: {
        conceptArticulation: 0,
        logicCoherence: 0,
        misconceptionCorrection: 0,
        cognitiveResilience: 0
      },
      justifications: {
        conceptArticulation: 'Evaluation failed',
        logicCoherence: 'Evaluation failed',
        misconceptionCorrection: 'Evaluation failed',
        cognitiveResilience: 'Evaluation failed'
      },
      totalScore: 0
    };
  }
}

// Teacher-only endpoint to get conversation logs and assessments
app.get('/api/teacher/conversations', async (req, res) => {
  try {
    // In production: Add authentication middleware
    console.log(`📊 Teacher dashboard requested: ${conversationLogs.length} conversations to evaluate`);

    // Evaluate all conversations (in parallel for performance)
    const conversationsWithEvaluations = await Promise.all(
      conversationLogs.map(async (log) => {
        const evaluation = await evaluateConversation(log, log.sessionId);

        return {
          sessionId: log.sessionId,
          timestamp: log.timestamp,
          updatedAt: log.updatedAt,
          turnCount: log.messages.length,
          taskTitle: log.taskMetadata?.title || 'Unknown Task',
          evaluation: {
            categoryScores: evaluation.categoryScores,
            justifications: evaluation.justifications,
            totalScore: evaluation.totalScore,
            error: evaluation.error || false
          }
        };
      })
    );

    res.json({
      count: conversationLogs.length,
      conversations: conversationsWithEvaluations
    });
  } catch (error) {
    console.error('❌ Teacher dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Session management endpoints
app.post('/api/sessions', (req, res) => {
  try {
    const { sessionId, sessionData } = req.body;

    if (!sessionId || !sessionData) {
      return res.status(400).json({ error: 'sessionId and sessionData required' });
    }

    // Store session (in production: save to database)
    sessions.set(sessionId, {
      ...sessionData,
      updatedAt: new Date().toISOString()
    });

    // Save sessions to file
    saveToFile(SESSIONS_FILE, Array.from(sessions.entries()));

    console.log(`💾 Session saved: ${sessionId} (${sessionData.messages?.length || 0} messages)`);

    res.json({ success: true, sessionId });
  } catch (error) {
    console.error('Session save error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    sessions.delete(sessionId);

    // Save sessions to file after deletion
    saveToFile(SESSIONS_FILE, Array.from(sessions.entries()));

    console.log(`🗑️  Session deleted: ${sessionId}`);

    res.json({ success: true });
  } catch (error) {
    console.error('Session delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  try {
    const tasksPath = path.join(process.cwd(), 'src/data/tasks.json');
    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    const { grade, domain } = req.query;

    let tasks = Object.values(tasksData.tasks);

    if (grade) {
      tasks = tasks.filter(t => t.grade.toLowerCase().includes(grade.toLowerCase()));
    }
    if (domain) {
      tasks = tasks.filter(t => t.domain.toLowerCase().includes(domain.toLowerCase()));
    }

    res.json({ tasks });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single task by ID
app.get('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tasksPath = path.join(process.cwd(), 'src/data/tasks.json');
    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    const task = tasksData.tasks[id];

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Task fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get task collections
app.get('/api/collections', (req, res) => {
  try {
    // In production: Fetch from database
    // For now: Return from JSON file
    const collectionsPath = path.join(process.cwd(), 'src/data/taskCollections.json');
    const collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf-8'));
    res.json(collections);
  } catch (error) {
    console.error('Collections fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get educational standards (Connecticut Mathematics - 746 standards from Knowledge Graph)
app.get('/api/standards', (req, res) => {
  try {
    const standards = JSON.parse(fs.readFileSync('./src/data/ct-math-standards.json', 'utf-8'));
    res.json(standards);
  } catch (error) {
    console.error('Standards fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get standard by ID or code
app.get('/api/standards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const standards = JSON.parse(fs.readFileSync('./src/data/ct-math-standards.json', 'utf-8'));
    const standard = standards.standards.find(s => s.id === id || s.code === id);

    if (!standard) {
      return res.status(404).json({ error: 'Standard not found' });
    }

    res.json(standard);
  } catch (error) {
    console.error('Standard fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get prerequisite standards for a given standard ID
app.get('/api/standards/:id/prerequisites', (req, res) => {
  try {
    const { id } = req.params;
    const prereqData = JSON.parse(fs.readFileSync('./src/data/ct-prerequisites.json', 'utf-8'));
    const prereqs = prereqData.prerequisites[id] || [];

    res.json({
      standardId: id,
      prerequisites: prereqs,
      count: prereqs.length
    });
  } catch (error) {
    console.error('Prerequisites fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📊 Backend assessment enabled - logs hidden from frontend`);
  console.log(`💾 Session persistence enabled`);
  console.log(`📚 Task collections API ready`);
  console.log(`📝 Tasks API ready`);
  console.log(`🎯 Standards alignment API ready`);
});
