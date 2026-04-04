import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { generateEvaluatorPrompt } from './src/utils/evaluatorPrompt.js';
import {
  connectDatabase, disconnectDatabase, useDatabase,
  upsertConversation, getAllConversations,
  upsertEvaluation, getEvaluation
} from './db.js';
import { parseMarkdown } from './scripts/parse-markdown.js';

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

    // Persist conversation — database if available, JSON fallback otherwise
    if (useDatabase) {
      try {
        await upsertConversation({
          sessionId: currentSessionId,
          model: anthropicRequest.model,
          systemPrompt: anthropicRequest.system,
          taskMetadata: taskMetadata || {},
          messages: anthropicRequest.messages,
          lastResponse: data.content[0].text
        });
        console.log(`🗄️  Conversation saved to database for session ${currentSessionId}`);
      } catch (dbError) {
        console.error('⚠️  Database save failed, falling back to JSON:', dbError.message);
        saveConversationToJson(currentSessionId, anthropicRequest, data, taskMetadata);
      }
    } else {
      saveConversationToJson(currentSessionId, anthropicRequest, data, taskMetadata);
    }

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

// --- Task helpers ---

function formatGradeLabel(grade) {
  if (!grade) return '';
  if (/^\d+$/.test(grade)) return `Grade ${grade}`;
  if (grade === 'HS') return 'High School';
  return grade;
}

function flattenMisconceptions(misconceptions) {
  if (!misconceptions || !Array.isArray(misconceptions)) return [];
  return misconceptions.map(m => {
    if (typeof m === 'string') return m;
    const parts = [m.title, m.description].filter(Boolean);
    return parts.join(': ');
  });
}

function formatTaskForApi(dbTask) {
  const misconceptionsFlat = flattenMisconceptions(dbTask.misconceptions);
  return {
    id: dbTask.slug,
    slug: dbTask.slug,
    title: dbTask.title,
    grade: formatGradeLabel(dbTask.grade),
    domain: dbTask.domain,
    standard: dbTask.ccssCode,
    standardDescription: dbTask.standardStatement || '',
    description: dbTask.standardStatement
      ? dbTask.standardStatement.split('.')[0] + '.'
      : '',
    problemStatement: dbTask.studentPrompt || '',
    teachingPrompt: dbTask.teachingPrompt || '',
    targetConcepts: dbTask.targetConcepts || [],
    correctSolutionPathway: '',
    misconceptions: misconceptionsFlat,
    aiIntro: dbTask.aiIntro || '',
    aiIntroES: dbTask.aiIntroEs || '',
    imageUrl: null,
    sections: {
      studentPrompt: dbTask.studentPrompt || '',
      misconceptions: dbTask.misconceptions || [],
      patternRecognition: dbTask.patternRecognition || '',
      generalization: dbTask.generalization || '',
      inference: dbTask.inferencePrediction || '',
      mappingData: dbTask.mappingData || { claims: [], evidence: '', criticalThinking: '' },
    },
  };
}

function loadTasksFromJson() {
  try {
    const tasksPath = path.join(process.cwd(), 'src/data/tasks.json');
    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    return Object.values(tasksData.tasks);
  } catch { return []; }
}

function loadCollectionsFromJson() {
  try {
    const collectionsPath = path.join(process.cwd(), 'src/data/taskCollections.json');
    return JSON.parse(fs.readFileSync(collectionsPath, 'utf-8'));
  } catch { return { collections: [] }; }
}

// --- Task routes ---

app.get('/api/tasks', async (req, res) => {
  try {
    const { grade, domain } = req.query;

    if (useDatabase) {
      const where = { published: true };
      if (grade) where.grade = grade.replace(/^Grade\s*/i, '');
      if (domain) where.domain = { contains: domain, mode: 'insensitive' };

      const dbTasks = await (await import('./db.js')).prisma.task.findMany({ where, orderBy: { ccssCode: 'asc' } });

      if (dbTasks.length > 0) {
        const tasks = dbTasks.map(formatTaskForApi);
        return res.json({ tasks, count: tasks.length });
      }
    }

    // Fallback to JSON file
    let tasks = loadTasksFromJson();
    if (grade) tasks = tasks.filter(t => t.grade.toLowerCase().includes(grade.toLowerCase()));
    if (domain) tasks = tasks.filter(t => t.domain.toLowerCase().includes(domain.toLowerCase()));
    res.json({ tasks, count: tasks.length });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (useDatabase) {
      const { prisma } = await import('./db.js');
      const dbTask = await prisma.task.findFirst({
        where: { OR: [{ id }, { slug: id }], published: true },
      });

      if (dbTask) return res.json(formatTaskForApi(dbTask));
    }

    // Fallback to JSON file
    const tasksPath = path.join(process.cwd(), 'src/data/tasks.json');
    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    const task = tasksData.tasks[id];
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    console.error('Task fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/collections', async (req, res) => {
  try {
    if (useDatabase) {
      const { prisma } = await import('./db.js');
      const dbCollections = await prisma.collection.findMany({
        where: { published: true },
        include: {
          tasks: {
            orderBy: { sortOrder: 'asc' },
            include: { task: true },
          },
        },
        orderBy: [{ grade: 'asc' }, { title: 'asc' }],
      });

      if (dbCollections.length > 0) {
        const collections = dbCollections.map(c => ({
          id: c.slug,
          slug: c.slug,
          title: c.title,
          description: c.description || '',
          grade: c.grade ? parseInt(c.grade, 10) || c.grade : null,
          tasks: c.tasks.map(ct => ({
            id: ct.task.slug,
            slug: ct.task.slug,
            title: ct.task.title,
            description: ct.task.standardStatement ? ct.task.standardStatement.split('.')[0] + '.' : '',
            standard: ct.task.ccssCode,
            grade: formatGradeLabel(ct.task.grade),
            domain: ct.task.domain,
            order: ct.sortOrder,
            required: false,
          })),
        }));
        return res.json({ collections });
      }
    }

    // Fallback to JSON file
    res.json(loadCollectionsFromJson());
  } catch (error) {
    console.error('Collections fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Task upload ---

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 } });

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

app.post('/api/tasks/upload', upload.single('file'), async (req, res) => {
  try {
    if (!useDatabase) {
      return res.status(503).json({ error: 'Database not available. Task upload requires PostgreSQL.' });
    }

    let markdownContent;
    let filename = 'upload.md';

    if (req.file) {
      markdownContent = req.file.buffer.toString('utf-8');
      filename = req.file.originalname || filename;
    } else if (req.is('text/markdown') || req.is('text/plain')) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      markdownContent = Buffer.concat(chunks).toString('utf-8');
    } else if (req.body?.content) {
      markdownContent = req.body.content;
      filename = req.body.filename || filename;
    } else {
      return res.status(400).json({ error: 'No markdown content provided. Send as multipart file, text/markdown body, or JSON with { content, filename }.' });
    }

    const parsed = parseMarkdown(markdownContent, filename);

    if (!parsed.ccssCode || !parsed.taskTitle) {
      return res.status(422).json({ error: 'Could not extract ccss_code or task_title from the markdown.' });
    }

    const gradeNum = parsed.gradeLevel?.match(/\d+/)?.[0];
    const grade = gradeNum || (/high\s*school/i.test(parsed.gradeLevel) ? 'HS' : parsed.gradeLevel || 'unknown');
    const slug = slugify(`${parsed.ccssCode}-${parsed.taskTitle}`);

    const miscFlat = parsed.misconceptions.map(m => typeof m === 'string' ? m : [m.title, m.description].filter(Boolean).join(': '));
    const promptPreview = parsed.studentPrompt?.split(/[.!?"]\s/)?.[0] || parsed.taskTitle;
    const firstMiscDesc = parsed.misconceptions?.[0]?.description || '';
    const aiIntro = `Hi! I'm Zippy! 🎉\n\n${promptPreview}.\n\nHmm, I think ${firstMiscDesc.charAt(0).toLowerCase() + firstMiscDesc.slice(1).slice(0, 120)}... 🤔\n\nCan you help me understand this better?`;

    const { prisma } = await import('./db.js');
    const task = await prisma.task.upsert({
      where: { slug },
      create: {
        slug,
        title: parsed.taskTitle,
        grade,
        domain: parsed.domain || 'General',
        ccssCode: parsed.ccssCode,
        cluster: parsed.cluster || null,
        standardStatement: parsed.standardStatement || null,
        studentPrompt: parsed.studentPrompt || null,
        misconceptions: parsed.misconceptions,
        patternRecognition: parsed.patternRecognition || null,
        generalization: parsed.generalization || null,
        inferencePrediction: parsed.inferencePrediction || null,
        mappingData: parsed.mappingData,
        teachingPrompt: `Help Zippy understand ${parsed.taskTitle.toLowerCase()} by guiding them through the concept step by step.`,
        targetConcepts: parsed.standardStatement ? [parsed.standardStatement.split(',')[0].trim()] : [],
        aiIntro,
        sourceFile: filename,
        published: true,
      },
      update: {
        title: parsed.taskTitle,
        grade,
        domain: parsed.domain || 'General',
        ccssCode: parsed.ccssCode,
        cluster: parsed.cluster || null,
        standardStatement: parsed.standardStatement || null,
        studentPrompt: parsed.studentPrompt || null,
        misconceptions: parsed.misconceptions,
        patternRecognition: parsed.patternRecognition || null,
        generalization: parsed.generalization || null,
        inferencePrediction: parsed.inferencePrediction || null,
        mappingData: parsed.mappingData,
        teachingPrompt: `Help Zippy understand ${parsed.taskTitle.toLowerCase()} by guiding them through the concept step by step.`,
        targetConcepts: parsed.standardStatement ? [parsed.standardStatement.split(',')[0].trim()] : [],
        aiIntro,
        sourceFile: filename,
      },
    });

    console.log(`📥 Task uploaded: ${parsed.ccssCode} - ${parsed.taskTitle} (${task.id})`);
    res.json({ success: true, task: formatTaskForApi(task) });
  } catch (error) {
    console.error('Task upload error:', error);
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
