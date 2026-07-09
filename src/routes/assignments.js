import express from 'express';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// File-based persistence for assignments (JSON fallback)
const DATA_DIR = path.join(process.cwd(), 'data');
const ASSIGNMENTS_FILE = path.join(DATA_DIR, 'assignments.json');
const CLASS_MEMBERS_FILE = path.join(DATA_DIR, 'class_members.json');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

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

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/assignments
 * Create assignments for students in a class (teacher only).
 * Body: { classId, taskId, taskTitle, studentIds?, dueDate?, notes? }
 */
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create assignments' });
    }

    const { classId, taskId, taskTitle, studentIds, dueDate, notes } = req.body;
    if (!classId || !taskId || !taskTitle) {
      return res.status(400).json({ error: 'classId, taskId, and taskTitle are required' });
    }

    let targetStudentIds = studentIds;

    if (req.app.locals.useDatabase && req.app.locals.prisma) {
      const prisma = req.app.locals.prisma;

      // If no studentIds provided, find all students in the class
      if (!targetStudentIds || targetStudentIds.length === 0) {
        const members = await prisma.classMember.findMany({
          where: { classId, role: 'student' }
        });
        targetStudentIds = members.map(m => m.userId);
      }

      const assignments = await Promise.all(
        targetStudentIds.map(sid =>
          prisma.assignment.create({
            data: {
              classId,
              studentId: sid,
              taskId,
              taskTitle,
              status: 'assigned',
              dueDate: dueDate ? new Date(dueDate) : null,
              notes: notes || null
            }
          })
        )
      );

      return res.status(201).json({ created: assignments.length, assignments });
    }

    // JSON fallback
    const assignments = loadJson(ASSIGNMENTS_FILE);

    if (!targetStudentIds || targetStudentIds.length === 0) {
      const members = loadJson(CLASS_MEMBERS_FILE);
      targetStudentIds = members
        .filter(m => m.classId === classId && m.role === 'student')
        .map(m => m.userId);
    }

    const created = targetStudentIds.map(sid => {
      const assignment = {
        id: `asgn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        classId,
        studentId: sid,
        taskId,
        taskTitle,
        status: 'assigned',
        dueDate: dueDate || null,
        notes: notes || null,
        sessionId: null,
        completedDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      assignments.push(assignment);
      return assignment;
    });
    saveJson(ASSIGNMENTS_FILE, assignments);

    res.status(201).json({ created: created.length, assignments: created });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignments' });
  }
});

/**
 * GET /api/assignments
 * List assignments for the current user.
 * Teachers see all assignments for classes they own.
 * Students see their own assignments.
 */
router.get('/', async (req, res) => {
  try {
    if (req.app.locals.useDatabase && req.app.locals.prisma) {
      const prisma = req.app.locals.prisma;

      let where;
      if (req.user.role === 'teacher') {
        const classes = await prisma.class.findMany({
          where: { teacherId: req.user.id },
          select: { id: true }
        });
        const classIds = classes.map(c => c.id);
        where = { classId: { in: classIds } };
      } else {
        where = { studentId: req.user.id };
      }

      const assignments = await prisma.assignment.findMany({ where });

      // Look up student names
      const studentIds = [...new Set(assignments.map(a => a.studentId))];
      const users = await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true }
      });
      const userMap = new Map(users.map(u => [u.id, u.name]));

      const enriched = assignments.map(a => ({
        ...a,
        studentName: userMap.get(a.studentId) || 'Unknown'
      }));

      return res.json({ assignments: enriched });
    }

    // JSON fallback
    const assignments = loadJson(ASSIGNMENTS_FILE);
    const users = loadJson(USERS_FILE);
    const userMap = new Map(users.map(u => [u.id, u.name]));

    let filtered;
    if (req.user.role === 'teacher') {
      const classes = loadJson(CLASSES_FILE);
      const teacherClassIds = classes
        .filter(c => c.teacherId === req.user.id)
        .map(c => c.id);
      filtered = assignments.filter(a => teacherClassIds.includes(a.classId));
    } else {
      filtered = assignments.filter(a => a.studentId === req.user.id);
    }

    const enriched = filtered.map(a => ({
      ...a,
      studentName: userMap.get(a.studentId) || 'Unknown'
    }));

    res.json({ assignments: enriched });
  } catch (error) {
    console.error('List assignments error:', error);
    res.status(500).json({ error: 'Failed to list assignments' });
  }
});

/**
 * PUT /api/assignments/:id
 * Update an assignment (status, sessionId, completedDate).
 * Only the assignment's student or the class teacher can update.
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, sessionId, completedDate } = req.body;

    if (req.app.locals.useDatabase && req.app.locals.prisma) {
      const prisma = req.app.locals.prisma;

      const assignment = await prisma.assignment.findUnique({ where: { id } });
      if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

      // Authorization: student who owns it or class teacher
      const cls = await prisma.class.findUnique({ where: { id: assignment.classId } });
      const isStudent = assignment.studentId === req.user.id;
      const isTeacher = cls && cls.teacherId === req.user.id;
      if (!isStudent && !isTeacher) {
        return res.status(403).json({ error: 'Not authorized to update this assignment' });
      }

      const data = {};
      if (status !== undefined) data.status = status;
      if (sessionId !== undefined) data.sessionId = sessionId;
      if (completedDate !== undefined) data.completedDate = completedDate ? new Date(completedDate) : null;

      const updated = await prisma.assignment.update({ where: { id }, data });
      return res.json(updated);
    }

    // JSON fallback
    const assignments = loadJson(ASSIGNMENTS_FILE);
    const idx = assignments.findIndex(a => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Assignment not found' });

    const assignment = assignments[idx];

    // Authorization: student who owns it or class teacher
    const classes = loadJson(CLASSES_FILE);
    const cls = classes.find(c => c.id === assignment.classId);
    const isStudent = assignment.studentId === req.user.id;
    const isTeacher = cls && cls.teacherId === req.user.id;
    if (!isStudent && !isTeacher) {
      return res.status(403).json({ error: 'Not authorized to update this assignment' });
    }

    const updated = { ...assignment, updatedAt: new Date().toISOString() };
    if (status !== undefined) updated.status = status;
    if (sessionId !== undefined) updated.sessionId = sessionId;
    if (completedDate !== undefined) updated.completedDate = completedDate;

    assignments[idx] = updated;
    saveJson(ASSIGNMENTS_FILE, assignments);

    res.json(updated);
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

export default router;
