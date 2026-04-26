import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { generateEvaluatorPrompt } from './src/utils/evaluatorPrompt.js';
import { generateZippyPrompt } from './src/utils/zippyPrompt.js';
import { parseSignal } from './src/utils/parseSignal.js';
import { parseTaskMarkdown } from './src/utils/parseMarkdown.js';
import {
  connectDatabase, disconnectDatabase, useDatabase,
  upsertConversation, getAllConversations,
  upsertEvaluation, getEvaluation,
  prisma
} from './db.js';
import authRouter from './src/routes/auth.js';
import classRouter from './src/routes/classes.js';

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

// Share database context with routers via app.locals
app.locals.useDatabase = useDatabase;
app.locals.prisma = prisma;

// Mount auth and class routers
app.use('/api/auth', authRouter);
app.use('/api/classes', classRouter);

// Health/diagnostic endpoint
app.get('/api/health', async (req, res) => {
  const { prisma } = await import('./db.js');
  let dbStatus = 'no prisma client';
  let dbConvCount = null;
  if (prisma) {
    try {
      const count = await prisma.conversation.count();
      dbStatus = 'connected';
      dbConvCount = count;
    } catch (e) {
      dbStatus = `error: ${e.message}`;
    }
  }
  res.json({
    storage: useDatabase ? 'postgresql' : 'json',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : null,
    dbStatus,
    dbConversationCount: dbConvCount,
    jsonConversationCount: conversationLogs.length
  });
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

// Cache for generated system prompts per session
const systemPromptCache = new Map(); // sessionId -> system prompt string

// Path to the task markdown files (bundled in repo)
const ITEM_BANK_DIR = path.resolve(process.cwd(), 'item-bank');

console.log(`📊 Loaded ${conversationLogs.length} conversations, ${sessions.size} sessions, ${evaluationCache.size} evaluations`);

function saveConversationToJson(sessionId, anthropicRequest, apiResponse, taskMetadata) {
  let conversationLog = conversationLogs.find(log => log.sessionId === sessionId);
  if (conversationLog) {
    conversationLog.messages = anthropicRequest.messages;
    conversationLog.lastResponse = apiResponse.content[0].text;
    conversationLog.updatedAt = new Date().toISOString();
    console.log(`📝 Updated existing conversation (JSON) for session ${sessionId}`);
  } else {
    conversationLog = {
      sessionId,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: anthropicRequest.messages,
      lastResponse: apiResponse.content[0].text,
      model: anthropicRequest.model,
      system: anthropicRequest.system,
      taskMetadata: taskMetadata || {}
    };
    conversationLogs.push(conversationLog);
    console.log(`📊 New conversation (JSON) for session ${sessionId} (${conversationLogs.length} total)`);
  }
  saveToFile(CONVERSATIONS_FILE, conversationLogs);
}

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

    // Cache the system prompt per session — reuse if already generated
    let systemPrompt = anthropicRequestBody.system;
    if (systemPromptCache.has(currentSessionId)) {
      systemPrompt = systemPromptCache.get(currentSessionId);
    } else if (systemPrompt) {
      systemPromptCache.set(currentSessionId, systemPrompt);
    }

    // Prepare request body for Anthropic (only standard fields)
    const anthropicRequest = {
      model: anthropicRequestBody.model,
      max_tokens: anthropicRequestBody.max_tokens,
      system: systemPrompt,
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

    // Parse signal tags from the LLM response
    const rawResponseText = data.content?.[0]?.text || '';
    const { visibleText, signal } = parseSignal(rawResponseText);

    // Persist conversation — database if available, JSON fallback otherwise
    if (useDatabase) {
      try {
        await upsertConversation({
          sessionId: currentSessionId,
          model: anthropicRequest.model,
          systemPrompt: anthropicRequest.system,
          taskMetadata: taskMetadata || {},
          messages: anthropicRequest.messages,
          lastResponse: rawResponseText
        });
        console.log(`🗄️  Conversation saved to database for session ${currentSessionId}`);
      } catch (dbError) {
        console.error('⚠️  Database save failed, falling back to JSON:', dbError.message);
        saveConversationToJson(currentSessionId, anthropicRequest, data, taskMetadata);
      }
    } else {
      saveConversationToJson(currentSessionId, anthropicRequest, data, taskMetadata);
    }

    // Return parsed response with visible text and signal separated
    res.json({
      ...data,
      content: [{ ...data.content[0], text: visibleText }],
      signal,
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
    // Check database cache first, then in-memory cache
    if (useDatabase) {
      const dbEval = await getEvaluation(sessionId);
      if (dbEval) {
        console.log(`📋 Using database-cached evaluation for session ${sessionId}`);
        return dbEval;
      }
    }
    if (evaluationCache.has(sessionId)) {
      console.log(`📋 Using memory-cached evaluation for session ${sessionId}`);
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

    // Build the evaluation request using v5.0 evaluator
    const taskMetadata = conversationLog.taskMetadata || {};
    const evaluatorPrompt = generateEvaluatorPrompt(taskMetadata);

    const evaluationRequest = `Evaluate the following ConversationEventLog and produce a Cognitive Breakdown Report.

TASK METADATA:
- Task: ${taskMetadata.taskTitle || taskMetadata.title || 'Unknown'}
- CCSS Code: ${taskMetadata.ccssCode || 'Not specified'}
- Target Concepts: ${Array.isArray(taskMetadata.targetConcepts) ? taskMetadata.targetConcepts.join('; ') : 'Not specified'}
- Misconceptions: ${Array.isArray(taskMetadata.misconceptions) ? taskMetadata.misconceptions.map(m => typeof m === 'string' ? m : `${m.id}: ${m.title} (${m.type})`).join('; ') : 'Not specified'}

CONVERSATION TRANSCRIPT:
${transcript}

Produce the Cognitive Breakdown Report as the specified JSON object.`;

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

    // Validate evaluation structure — accept both v3 (categoryScores) and v5 (misconceptionAnalysis) formats
    const isV5 = !!evaluation.misconceptionAnalysis;
    const isV3 = !!evaluation.categoryScores;

    if (!isV5 && !isV3) {
      console.error('❌ Invalid evaluation structure:', evaluation);
      throw new Error('Evaluation missing required fields');
    }

    console.log(`✅ Evaluation complete for session ${sessionId} (${isV5 ? 'v5.0' : 'v3.0'} format)`);

    // Cache the result — database + in-memory + JSON file
    if (useDatabase) {
      try {
        await upsertEvaluation(sessionId, evaluation);
        console.log(`🗄️  Evaluation saved to database for session ${sessionId}`);
      } catch (dbError) {
        console.error('⚠️  Database evaluation save failed:', dbError.message);
      }
    }
    evaluationCache.set(sessionId, evaluation);
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
    let logs;

    if (useDatabase) {
      try {
        const dbConversations = await getAllConversations();
        logs = dbConversations.map(conv => ({
          sessionId: conv.sessionId,
          timestamp: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
          messages: conv.messages.map(m => ({ role: m.role, content: m.content })),
          taskMetadata: conv.taskMetadata || {},
          _dbEvaluation: conv.evaluation
        }));
        console.log(`📊 Teacher dashboard requested: ${logs.length} conversations from database`);
      } catch (dbError) {
        console.error('⚠️  Database read failed, falling back to JSON:', dbError.message);
        logs = conversationLogs.map(log => ({ ...log, _dbEvaluation: null }));
      }
    } else {
      logs = conversationLogs.map(log => ({ ...log, _dbEvaluation: null }));
      console.log(`📊 Teacher dashboard requested: ${logs.length} conversations from JSON`);
    }

    const conversationsWithEvaluations = await Promise.all(
      logs.map(async (log) => {
        let evaluation;
        if (log._dbEvaluation) {
          const e = log._dbEvaluation;
          evaluation = {
            categoryScores: {
              conceptArticulation: e.conceptArticulation,
              logicCoherence: e.logicCoherence,
              misconceptionCorrection: e.misconceptionCorrection,
              cognitiveResilience: e.cognitiveResilience
            },
            justifications: e.justifications,
            totalScore: e.totalScore
          };
        } else {
          evaluation = await evaluateConversation(log, log.sessionId);
        }

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
      count: logs.length,
      conversations: conversationsWithEvaluations
    });
  } catch (error) {
    console.error('❌ Teacher dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get full conversation with messages by sessionId
app.get('/api/teacher/conversations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (useDatabase) {
      const { prisma } = await import('./db.js');
      const conv = await prisma.conversation.findUnique({
        where: { sessionId },
        include: { messages: { orderBy: { sequenceNumber: 'asc' } }, evaluation: true }
      });
      if (!conv) return res.status(404).json({ error: 'Conversation not found' });

      return res.json({
        sessionId: conv.sessionId,
        taskTitle: conv.taskTitle,
        model: conv.model,
        status: conv.status,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messages: conv.messages.map(m => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
          sequenceNumber: m.sequenceNumber
        })),
        evaluation: conv.evaluation ? {
          totalScore: conv.evaluation.totalScore,
          categoryScores: {
            conceptArticulation: conv.evaluation.conceptArticulation,
            logicCoherence: conv.evaluation.logicCoherence,
            misconceptionCorrection: conv.evaluation.misconceptionCorrection,
            cognitiveResilience: conv.evaluation.cognitiveResilience
          },
          justifications: conv.evaluation.justifications
        } : null
      });
    }

    const log = conversationLogs.find(l => l.sessionId === sessionId);
    if (!log) return res.status(404).json({ error: 'Conversation not found' });
    res.json(log);
  } catch (error) {
    console.error('Conversation detail error:', error);
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

// Get all tasks — list available task markdown files from New Item Bank
app.get('/api/tasks', (req, res) => {
  try {
    const { grade, domain } = req.query;

    if (!fs.existsSync(ITEM_BANK_DIR)) {
      return res.json({ tasks: [], source: 'item-bank', error: 'Item bank directory not found' });
    }

    const files = fs.readdirSync(ITEM_BANK_DIR).filter(f => f.endsWith('.md'));
    let tasks = files.map(filename => {
      try {
        const content = fs.readFileSync(path.join(ITEM_BANK_DIR, filename), 'utf-8');
        const parsed = parseTaskMarkdown(content);
        return { ...parsed, filename };
      } catch (parseErr) {
        console.error(`Failed to parse ${filename}:`, parseErr.message);
        return null;
      }
    }).filter(Boolean);

    if (grade) {
      tasks = tasks.filter(t => (t.gradeLevel || '').toLowerCase().includes(grade.toLowerCase()));
    }
    if (domain) {
      tasks = tasks.filter(t => (t.domain || '').toLowerCase().includes(domain.toLowerCase()));
    }

    // Return lightweight listing (exclude full prompt content for listing)
    const listing = tasks.map(t => ({
      filename: t.filename,
      taskTitle: t.taskTitle,
      ccssCode: t.ccssCode,
      gradeLevel: t.gradeLevel,
      domain: t.domain,
      standardStatement: t.standardStatement,
      misconceptionCount: t.misconceptions.length,
    }));

    res.json({ tasks: listing, source: 'item-bank', count: listing.length });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single task by filename — parse and return full task data
app.get('/api/tasks/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Sanitise: only allow .md files, no directory traversal
    if (!filename.endsWith('.md') || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(ITEM_BANK_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const taskData = parseTaskMarkdown(content);

    res.json(taskData);
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

async function startServer() {
  if (useDatabase) {
    try {
      const { execSync } = await import('child_process');
      console.log('🔄 Running database migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations complete');
    } catch (e) {
      console.error('⚠️  Migration failed:', e.message);
    }
    await connectDatabase();
  }

  app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`🗄️  Storage: ${useDatabase ? 'PostgreSQL' : 'JSON files'}`);
    console.log(`📊 Backend assessment enabled - logs hidden from frontend`);
    console.log(`💾 Session persistence enabled`);
    console.log(`📚 Task collections API ready`);
    console.log(`📝 Tasks API ready`);
    console.log(`🎯 Standards alignment API ready`);
  });

  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down...');
    await disconnectDatabase();
    process.exit(0);
  });
}

startServer();
