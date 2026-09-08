import express from 'express';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { authMiddleware, generateToken } from '../middleware/auth.js';
import { generateUniqueClassCode, normalizeClassCode } from '../utils/classCode.js';

const require = createRequire(import.meta.url);
// The pre-authored task bank (client bundle). Deploy validates a taskId against it.
const tasksData = require('../data/tasks.json');
const TASKS = tasksData.tasks || {};

const router = express.Router();

const MAX_ROSTER = 150; // matches gap-finder's cap
const GUEST_TOKEN_TTL = '8h'; // matches gap-finder's student cookie lifetime

// File-based persistence (JSON fallback), mirroring src/routes/classes.js.
const DATA_DIR = path.join(process.cwd(), 'data');
const LIVE_SESSIONS_FILE = path.join(DATA_DIR, 'live_sessions.json');
const PARTICIPANTS_FILE = path.join(DATA_DIR, 'participants.json');

function loadJson(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error(`Error loading ${path.basename(filePath)}:`, error.message);
  }
  return [];
}

function saveJson(filePath, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error saving ${path.basename(filePath)}:`, error.message);
  }
}

function newGuestId() {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function joinUrlFor(req, code) {
  const host = req.get('origin') || `${req.protocol}://${req.get('host')}`;
  return `${host}/app/j/${code}`;
}

/**
 * POST /api/live/deploy — teacher mints a live session for a pre-authored task.
 * Body: { taskId, title? }
 */
router.post('/deploy', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can deploy a live session' });
    }
    const { taskId, title } = req.body;
    if (!taskId || !TASKS[taskId]) {
      return res.status(400).json({ error: 'Unknown taskId' });
    }
    const useDb = req.app.locals.useDatabase && req.app.locals.prisma;
    const prisma = req.app.locals.prisma;

    const code = await generateUniqueClassCode(async (c) => {
      if (useDb) return !!(await prisma.liveSession.findUnique({ where: { code: c } }));
      return loadJson(LIVE_SESSIONS_FILE).some((s) => s.code === c);
    });

    const sessionTitle = (typeof title === 'string' && title.trim()) || TASKS[taskId].title || null;

    if (useDb) {
      const session = await prisma.liveSession.create({
        data: {
          code,
          taskId,
          title: sessionTitle,
          teacherId: req.user.id,
          status: 'live',
          deployedAt: new Date(),
        },
      });
      return res.status(201).json({ code: session.code, taskId, joinUrl: joinUrlFor(req, code) });
    }

    const sessions = loadJson(LIVE_SESSIONS_FILE);
    const session = {
      id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code,
      taskId,
      title: sessionTitle,
      teacherId: req.user.id,
      status: 'live',
      createdAt: new Date().toISOString(),
      deployedAt: new Date().toISOString(),
    };
    sessions.push(session);
    saveJson(LIVE_SESSIONS_FILE, sessions);
    res.status(201).json({ code, taskId, joinUrl: joinUrlFor(req, code) });
  } catch (error) {
    console.error('Deploy live session error:', error);
    res.status(500).json({ error: 'Failed to deploy live session' });
  }
});

/**
 * GET /api/live/:code — public. Resolve a code to its task (for the deep link).
 */
router.get('/:code', async (req, res) => {
  try {
    const code = normalizeClassCode(req.params.code);
    const useDb = req.app.locals.useDatabase && req.app.locals.prisma;
    const prisma = req.app.locals.prisma;

    const session = useDb
      ? await prisma.liveSession.findUnique({ where: { code } })
      : loadJson(LIVE_SESSIONS_FILE).find((s) => s.code === code);

    if (!session || session.status !== 'live') {
      return res.status(404).json({ error: 'No live session found for that code' });
    }
    res.json({ code: session.code, taskId: session.taskId, title: session.title, status: session.status });
  } catch (error) {
    console.error('Lookup live session error:', error);
    res.status(500).json({ error: 'Failed to look up live session' });
  }
});

/**
 * POST /api/live/join — PUBLIC (no account). Anonymous student joins by code.
 * Mints a short-lived guest JWT so the existing conversation stack works unchanged.
 * Body: { code, name }
 */
router.post('/join', async (req, res) => {
  try {
    const { code: rawCode, name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Add a name so your teacher knows it's you." });
    }
    const code = normalizeClassCode(rawCode);
    const useDb = req.app.locals.useDatabase && req.app.locals.prisma;
    const prisma = req.app.locals.prisma;

    const session = useDb
      ? await prisma.liveSession.findUnique({ where: { code } })
      : loadJson(LIVE_SESSIONS_FILE).find((s) => s.code === code);

    if (!session || session.status !== 'live') {
      return res.status(400).json({ error: "We couldn't find a live session with that code." });
    }

    const rosterCount = useDb
      ? await prisma.participant.count({ where: { sessionId: session.id } })
      : loadJson(PARTICIPANTS_FILE).filter((p) => p.sessionId === session.id).length;
    if (rosterCount >= MAX_ROSTER) {
      return res.status(409).json({ error: 'This class is full — check with your teacher.' });
    }

    const guestUserId = newGuestId();
    const displayName = name.trim();

    if (useDb) {
      await prisma.participant.create({
        data: { sessionId: session.id, displayName, guestUserId, status: 'in_progress' },
      });
    } else {
      const participants = loadJson(PARTICIPANTS_FILE);
      participants.push({
        id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: session.id,
        displayName,
        guestUserId,
        status: 'in_progress',
        joinedAt: new Date().toISOString(),
      });
      saveJson(PARTICIPANTS_FILE, participants);
    }

    const user = { id: guestUserId, email: null, name: displayName, role: 'student' };
    const token = generateToken(user, { expiresIn: GUEST_TOKEN_TTL });
    res.json({ token, user, taskId: session.taskId });
  } catch (error) {
    console.error('Join live session error:', error);
    res.status(500).json({ error: 'Something went wrong joining — please try again.' });
  }
});

export default router;
