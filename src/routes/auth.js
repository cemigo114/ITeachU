import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '363552449164-63ca3bo4uc0m12k239rd7b28p0ds8br1.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// File-based persistence for users (JSON fallback)
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading users.json:', error.message);
  }
  return [];
}

function saveUsers(users) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving users.json:', error.message);
  }
}

/**
 * POST /api/auth/google
 * Verify a Google ID token, find or create the user, return a JWT.
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, role, action } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'credential is required' });
    }

    const isLogin = action === 'login';
    const isSignup = action === 'signup';

    if (!isLogin && (!role || !['teacher', 'student', 'parent'].includes(role))) {
      return res.status(400).json({ error: 'role must be "teacher", "student", or "parent"' });
    }

    // Verify the Google ID token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError.message);
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    const { sub: googleId, email, name } = payload;

    // Find or create user — Prisma if available, JSON fallback
    let user;
    let isNewUser = false;

    let usedDatabase = false;
    if (req.app.locals.useDatabase && req.app.locals.prisma) {
      try {
        const prisma = req.app.locals.prisma;
        user = await prisma.user.findUnique({ where: { googleId } });
        usedDatabase = true;

        if (user && isSignup) {
          return res.json({ existing: true, token: generateToken(user), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
        }
        if (!user && isLogin) {
          return res.status(404).json({ error: 'No account found. Please sign up first.' });
        }
        if (!user) {
          user = await prisma.user.create({ data: { email, name, role, googleId } });
          isNewUser = true;
          console.log(`👤 New user created (DB): ${email} as ${role}`);
        }
      } catch (dbError) {
        console.error('Database auth failed, falling back to JSON:', dbError.message);
        usedDatabase = false;
      }
    }

    if (!usedDatabase) {
      const users = loadUsers();
      user = users.find(u => u.googleId === googleId);

      if (user && isSignup) {
        return res.json({ existing: true, token: generateToken(user), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
      }
      if (!user && isLogin) {
        return res.status(404).json({ error: 'No account found. Please sign up first.' });
      }
      if (!user) {
        user = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email, name, role, googleId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        users.push(user);
        saveUsers(users);
        isNewUser = true;
        console.log(`👤 New user created (JSON): ${email} as ${role}`);
      }
    }

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Auth error:', error.message, error.stack);
    res.status(500).json({ error: 'Authentication failed', detail: error.message });
  }
});

/**
 * GET /api/auth/me
 * Return the current user from the JWT.
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
