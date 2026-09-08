import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import jwt from 'jsonwebtoken';
import { generateToken } from '../src/middleware/auth.js';

// The live router computes its JSON data dir from process.cwd() at import time,
// so we chdir into a temp dir *before* importing it to keep test writes isolated.
const originalCwd = process.cwd();
let app;
let baseUrl;
let server;
let teacherToken;

async function post(url, body, token) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iteachu-live-'));
  process.chdir(tmp);
  const { default: liveRouter } = await import('../src/routes/live.js');

  app = express();
  app.use(express.json());
  app.locals.useDatabase = false; // JSON fallback path
  app.locals.prisma = null;
  app.use('/api/live', liveRouter);

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  teacherToken = generateToken({ id: 'usr_t', email: 't@x.io', name: 'T', role: 'teacher' });
});

afterAll(async () => {
  if (server) await new Promise((r) => server.close(r));
  process.chdir(originalCwd);
});

describe('live router (JSON fallback)', () => {
  it('teacher deploys → student joins → guest token has student role and expiry', async () => {
    const dep = await post(`${baseUrl}/api/live/deploy`, { taskId: 'stack_of_cups' }, teacherToken);
    expect(dep.status).toBe(201);
    const { code, taskId } = await dep.json();
    expect(taskId).toBe('stack_of_cups');
    expect(code).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/);

    const join = await post(`${baseUrl}/api/live/join`, { code, name: 'Sam' });
    expect(join.status).toBe(200);
    const joined = await join.json();
    expect(joined.taskId).toBe('stack_of_cups');
    expect(joined.user).toMatchObject({ role: 'student', name: 'Sam' });

    const decoded = jwt.decode(joined.token);
    expect(decoded.role).toBe('student');
    expect(decoded.exp - decoded.iat).toBe(8 * 60 * 60); // 8h TTL
  });

  it('lowercase / hyphen-less codes are normalized on join', async () => {
    const dep = await post(`${baseUrl}/api/live/deploy`, { taskId: 'stack_of_cups' }, teacherToken);
    const { code } = await dep.json();
    const messy = code.replace('-', '').toLowerCase();
    const join = await post(`${baseUrl}/api/live/join`, { code: messy, name: 'Kai' });
    expect(join.status).toBe(200);
  });

  it('deploy is teacher-gated', async () => {
    const studentToken = generateToken({ id: 'g1', email: null, name: 'G', role: 'student' });
    const res = await post(`${baseUrl}/api/live/deploy`, { taskId: 'stack_of_cups' }, studentToken);
    expect(res.status).toBe(403);
  });

  it('deploy rejects an unknown taskId', async () => {
    const res = await post(`${baseUrl}/api/live/deploy`, { taskId: 'not_a_real_task' }, teacherToken);
    expect(res.status).toBe(400);
  });

  it('deploy requires auth', async () => {
    const res = await post(`${baseUrl}/api/live/deploy`, { taskId: 'stack_of_cups' });
    expect(res.status).toBe(401);
  });

  it('join with an unknown code returns 400', async () => {
    const res = await post(`${baseUrl}/api/live/join`, { code: 'ZZZ-ZZZ', name: 'Sam' });
    expect(res.status).toBe(400);
  });

  it('join without a name returns 400', async () => {
    const dep = await post(`${baseUrl}/api/live/deploy`, { taskId: 'stack_of_cups' }, teacherToken);
    const { code } = await dep.json();
    const res = await post(`${baseUrl}/api/live/join`, { code, name: '  ' });
    expect(res.status).toBe(400);
  });

  it('GET /:code resolves a live session and 404s otherwise', async () => {
    const dep = await post(`${baseUrl}/api/live/deploy`, { taskId: 'stack_of_cups' }, teacherToken);
    const { code } = await dep.json();
    const ok = await fetch(`${baseUrl}/api/live/${code}`);
    expect(ok.status).toBe(200);
    expect((await ok.json()).taskId).toBe('stack_of_cups');

    const miss = await fetch(`${baseUrl}/api/live/ZZZ-ZZZ`);
    expect(miss.status).toBe(404);
  });
});
