'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const bcrypt = require('bcryptjs');

const MODULES_TO_CLEAR = [
  '../db', '../session-store', '../middleware/auth', '../routes/auth', '../routes/admin', '../routes/projects', '../server'
];

async function createContext(t) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskflow-projects-test-'));
  const originalEnv = {
    DB_PATH: process.env.DB_PATH,
    SESSION_SECRET: process.env.SESSION_SECRET,
    SETUP_TOKEN: process.env.SETUP_TOKEN,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
    NODE_ENV: process.env.NODE_ENV,
    TRUST_PROXY: process.env.TRUST_PROXY
  };
  process.env.DB_PATH = path.join(tempDir, 'projects-test.sqlite');
  process.env.SESSION_SECRET = crypto.randomBytes(48).toString('base64url');
  process.env.SETUP_TOKEN = crypto.randomBytes(48).toString('base64url');
  process.env.COOKIE_SECURE = 'false';
  process.env.NODE_ENV = 'test';
  process.env.TRUST_PROXY = 'false';
  for (const file of MODULES_TO_CLEAR) delete require.cache[require.resolve(file)];

  const { app, db } = require('../server');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  let csrf = '';

  async function request(route, options = {}) {
    const headers = new Headers(options.headers || {});
    if (cookie) headers.set('Cookie', cookie);
    if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())) {
      if (!headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', csrf);
    }
    if (options.body && typeof options.body !== 'string') {
      headers.set('Content-Type', 'application/json');
      options = { ...options, body: JSON.stringify(options.body) };
    }
    const response = await fetch(`${baseUrl}${route}`, { ...options, headers, redirect: 'manual' });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const firstPair = setCookie.split(';', 1)[0];
      cookie = firstPair.endsWith('=') ? '' : firstPair;
    }
    const data = await response.json().catch(() => ({}));
    if (typeof data.csrfToken === 'string') csrf = data.csrfToken;
    return { response, data };
  }

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    try { db.close(); } catch { /* database may already have been closed */ }
    for (const file of MODULES_TO_CLEAR) delete require.cache[require.resolve(file)];
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  return { request, db, setupToken: process.env.SETUP_TOKEN };
}

async function createAdminAndLogin(ctx) {
  let result = await ctx.request('/api/auth/csrf');
  result = await ctx.request('/api/auth/setup', {
    method: 'POST',
    body: {
      setupToken: ctx.setupToken,
      username: 'project-admin',
      email: 'project-admin@example.test',
      fullName: 'مدير الاختبار',
      password: 'Strong-Project-Password-2026'
    }
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  await ctx.request('/api/auth/csrf');
  result = await ctx.request('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'project-admin', password: 'Strong-Project-Password-2026' }
  });
  assert.equal(result.response.status, 200);
}

test('projects API supports Arabic project CRUD, filtering, and role checks', async (t) => {
  const ctx = await createContext(t);
  const { request, db } = ctx;

  let result = await request('/api/projects');
  assert.equal(result.response.status, 401);

  await createAdminAndLogin(ctx);
  result = await request('/api/projects', {
    method: 'POST',
    body: {
      name: 'تطوير بوابة الشركة',
      description: 'مشروع تجريبي لاختبار إدارة المشاريع',
      status: 'active',
      startDate: '2026-10-01',
      dueDate: '2026-12-20'
    }
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  const projectId = result.data.project.id;
  assert.match(result.data.project.projectCode, /^TF-\d{4}-\d{4}$/);

  result = await request('/api/projects?q=بوابة&status=active');
  assert.equal(result.response.status, 200);
  assert.equal(result.data.count, 1);
  assert.equal(result.data.projects[0].name, 'تطوير بوابة الشركة');

  result = await request(`/api/projects/${projectId}`, {
    method: 'PUT',
    body: {
      name: 'تطوير البوابة الإدارية',
      description: 'تحديث وصف المشروع',
      status: 'completed',
      startDate: '2026-10-01',
      dueDate: '2026-12-20'
    }
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.project.status, 'completed');

  result = await request('/api/projects', {
    method: 'POST',
    body: { name: 'تاريخ غير صالح', status: 'active', startDate: '2026-12-20', dueDate: '2026-10-01' }
  });
  assert.equal(result.response.status, 400);

  const memberHash = await bcrypt.hash('Strong-Member-Password-2026', 12);
  db.prepare(`INSERT INTO users (username, email, full_name, password_hash, role)
              VALUES (?, ?, ?, ?, 'member')`)
    .run('project-member', 'project-member@example.test', 'عضو الاختبار', memberHash);
  await request('/api/auth/logout', { method: 'POST', body: {} });
  await request('/api/auth/csrf');
  result = await request('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'project-member', password: 'Strong-Member-Password-2026' }
  });
  assert.equal(result.response.status, 200);

  result = await request('/api/projects');
  assert.equal(result.response.status, 200, 'Members may read projects');
  result = await request('/api/projects', {
    method: 'POST',
    body: { name: 'محاولة غير مسموحة', status: 'planned' }
  });
  assert.equal(result.response.status, 403, 'Members may not create projects');
  result = await request(`/api/projects/${projectId}`, { method: 'DELETE' });
  assert.equal(result.response.status, 403, 'Only admins may delete projects');
});
