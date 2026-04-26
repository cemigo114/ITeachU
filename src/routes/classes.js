import express from 'express';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// File-based persistence for classes (JSON fallback)
const DATA_DIR = path.join(process.cwd(), 'data');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const CLASS_MEMBERS_FILE = path.join(DATA_DIR, 'class_members.json');

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

/**
 * Generate a 6-character uppercase alphanumeric invite code.
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/classes
 * Create a new class (teacher only).
 */
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create classes' });
    }

    const { name, gradeLevel, subject } = req.body;
    if (!name || !gradeLevel) {
      return res.status(400).json({ error: 'name and gradeLevel are required' });
    }

    const inviteCode = generateInviteCode();

    if (req.app.locals.useDatabase && req.app.locals.prisma) {
      const prisma = req.app.locals.prisma;
      const newClass = await prisma.class.create({
        data: {
          name,
          gradeLevel,
          subject: subject || 'Math',
          inviteCode,
          teacherId: req.user.id,
          members: {
            create: { userId: req.user.id, role: 'teacher' }
          }
        },
        include: { members: true }
      });
      return res.status(201).json(newClass);
    }

    // JSON fallback
    const classes = loadJson(CLASSES_FILE);
    const members = loadJson(CLASS_MEMBERS_FILE);

    const newClass = {
      id: `cls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      gradeLevel,
      subject: subject || 'Math',
      inviteCode,
      teacherId: req.user.id,
      createdAt: new Date().toISOString()
    };
    classes.push(newClass);
    saveJson(CLASSES_FILE, classes);

    const membership = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      classId: newClass.id,
      userId: req.user.id,
      role: 'teacher'
    };
    members.push(membership);
    saveJson(CLASS_MEMBERS_FILE, members);

    res.status(201).json({ ...newClass, members: [membership] });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

/**
 * GET /api/classes
 * List all classes for the current user.
 */
router.get('/', async (req, res) => {
  try {
    if (req.app.locals.useDatabase && req.app.locals.prisma) {
      const prisma = req.app.locals.prisma;
      const memberships = await prisma.classMember.findMany({
        where: { userId: req.user.id },
        include: {
          class: {
            include: {
              members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } }
            }
          }
        }
      });
      const classes = memberships.map(m => m.class);
      return res.json({ classes, count: classes.length });
    }

    // JSON fallback
    const classes = loadJson(CLASSES_FILE);
    const members = loadJson(CLASS_MEMBERS_FILE);
    const userClassIds = members
      .filter(m => m.userId === req.user.id)
      .map(m => m.classId);
    const userClasses = classes.filter(c => userClassIds.includes(c.id));

    res.json({ classes: userClasses, count: userClasses.length });
  } catch (error) {
    console.error('List classes error:', error);
    res.status(500).json({ error: 'Failed to list classes' });
  }
});

/**
 * GET /api/classes/:id
 * Get class details with members.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (req.app.locals.useDatabase && req.app.locals.prisma) {
      const prisma = req.app.locals.prisma;
      const cls = await prisma.class.findUnique({
        where: { id },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } }
        }
      });
      if (!cls) return res.status(404).json({ error: 'Class not found' });

      // Verify the requesting user is a member
      const isMember = cls.members.some(m => m.userId === req.user.id);
      if (!isMember) return res.status(403).json({ error: 'Not a member of this class' });

      return res.json(cls);
    }

    // JSON fallback
    const classes = loadJson(CLASSES_FILE);
    const members = loadJson(CLASS_MEMBERS_FILE);
    const cls = classes.find(c => c.id === id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    const classMembers = members.filter(m => m.classId === id);
    const isMember = classMembers.some(m => m.userId === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this class' });

    res.json({ ...cls, members: classMembers });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Failed to get class' });
  }
});

/**
 * POST /api/classes/:id/students
 * Add students to a class (teacher only).
 * Body: { studentIds: string[] }
 */
router.post('/:id/students', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'studentIds array is required' });
    }

    if (req.app.locals.useDatabase && req.app.locals.prisma) {
      const prisma = req.app.locals.prisma;

      const cls = await prisma.class.findUnique({ where: { id } });
      if (!cls) return res.status(404).json({ error: 'Class not found' });
      if (cls.teacherId !== req.user.id) {
        return res.status(403).json({ error: 'Only the class teacher can add students' });
      }

      const created = await prisma.classMember.createMany({
        data: studentIds.map(userId => ({ classId: id, userId, role: 'student' })),
        skipDuplicates: true
      });
      return res.json({ added: created.count });
    }

    // JSON fallback
    const classes = loadJson(CLASSES_FILE);
    const members = loadJson(CLASS_MEMBERS_FILE);
    const cls = classes.find(c => c.id === id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    if (cls.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Only the class teacher can add students' });
    }

    let addedCount = 0;
    for (const userId of studentIds) {
      const exists = members.some(m => m.classId === id && m.userId === userId);
      if (!exists) {
        members.push({
          id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          classId: id,
          userId,
          role: 'student'
        });
        addedCount++;
      }
    }
    saveJson(CLASS_MEMBERS_FILE, members);

    res.json({ added: addedCount });
  } catch (error) {
    console.error('Add students error:', error);
    res.status(500).json({ error: 'Failed to add students' });
  }
});

/**
 * POST /api/classes/join
 * Student joins a class using an invitation code.
 * Body: { inviteCode: string }
 */
router.post('/join', async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ error: 'inviteCode is required' });
    }

    const code = inviteCode.trim().toUpperCase();

    if (req.app.locals.useDatabase && req.app.locals.prisma) {
      const prisma = req.app.locals.prisma;
      const cls = await prisma.class.findUnique({ where: { inviteCode: code } });
      if (!cls) return res.status(404).json({ error: 'Invalid invitation code' });

      const existing = await prisma.classMember.findUnique({
        where: { classId_userId: { classId: cls.id, userId: req.user.id } }
      });
      if (existing) return res.json({ message: 'Already a member', classId: cls.id, className: cls.name });

      await prisma.classMember.create({
        data: { classId: cls.id, userId: req.user.id, role: 'student' }
      });
      return res.json({ message: 'Joined class', classId: cls.id, className: cls.name });
    }

    // JSON fallback
    const classes = loadJson(CLASSES_FILE);
    const members = loadJson(CLASS_MEMBERS_FILE);
    const cls = classes.find(c => c.inviteCode === code);
    if (!cls) return res.status(404).json({ error: 'Invalid invitation code' });

    const existing = members.find(m => m.classId === cls.id && m.userId === req.user.id);
    if (existing) return res.json({ message: 'Already a member', classId: cls.id, className: cls.name });

    members.push({
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      classId: cls.id,
      userId: req.user.id,
      role: 'student'
    });
    saveJson(CLASS_MEMBERS_FILE, members);

    res.json({ message: 'Joined class', classId: cls.id, className: cls.name });
  } catch (error) {
    console.error('Join class error:', error);
    res.status(500).json({ error: 'Failed to join class' });
  }
});

/**
 * DELETE /api/classes/:id/students/:userId
 * Remove a student from a class (teacher only).
 */
router.delete('/:id/students/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (req.app.locals.useDatabase && req.app.locals.prisma) {
      const prisma = req.app.locals.prisma;

      const cls = await prisma.class.findUnique({ where: { id } });
      if (!cls) return res.status(404).json({ error: 'Class not found' });
      if (cls.teacherId !== req.user.id) {
        return res.status(403).json({ error: 'Only the class teacher can remove students' });
      }

      await prisma.classMember.deleteMany({
        where: { classId: id, userId, role: 'student' }
      });
      return res.json({ removed: true });
    }

    // JSON fallback
    const classes = loadJson(CLASSES_FILE);
    const members = loadJson(CLASS_MEMBERS_FILE);
    const cls = classes.find(c => c.id === id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    if (cls.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Only the class teacher can remove students' });
    }

    const idx = members.findIndex(m => m.classId === id && m.userId === userId && m.role === 'student');
    if (idx === -1) return res.status(404).json({ error: 'Student not found in class' });

    members.splice(idx, 1);
    saveJson(CLASS_MEMBERS_FILE, members);

    res.json({ removed: true });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ error: 'Failed to remove student' });
  }
});

export default router;
