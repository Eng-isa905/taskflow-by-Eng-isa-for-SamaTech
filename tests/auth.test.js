'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const bcrypt = require('bcryptjs');

const MODULES_TO_CLEAR = [
  '../db', '../session-store', '../middleware/auth', '../routes/auth', '../routes/admin', '../server'
];

async function createTestApp(t) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskflow-auth-test-'));
  const originalEnv = {
    DB_PATH: process.env.DB_PATH,
    SESSION_SECRET: process.env.SESSION_SECRET,
    SETUP_TOKEN: process.env.SETUP_TOKEN,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
    NODE_ENV: process.env.NODE_ENV,
    TRUST_PROXY: process.env.TRUST_PROXY
  };

  process.env.DB_PATH = path.join(tempDir, 'auth-test.sqlite');
  process.env.SESSION_SECRET = crypto.randomBytes(48).toString('base64url');
  process.env.SETUP_TOKEN = crypto.randomBytes(48).toString('base64url');
  process.env.COOKIE_SECURE = 'false';
  process.env.NODE_ENV = 'test';
  process.env.TRUST_PROXY = 'false';
  for (const file of MODULES_TO_CLEAR) delete require.cache[require.resolve(file)];

  const { app, db } = require('../server');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  async function request(route, options = {}) {
    const headers = new Headers(options.headers || {});
    if (cookie) headers.set('Cookie', cookie);
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
    return { response, data };
  }

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    try { db.close(); } catch { /* no-op during cleanup */ }
    for (const file of MODULES_TO_CLEAR) delete require.cache[require.resolve(file)];
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  return {
    request,
    db,
    setupToken: process.env.SETUP_TOKEN
  };
}

test('authentication supports one-time admin setup, login, role checks, CSRF, and logout', async (t) => {
  const ctx = await createTestApp(t);
  const { request, db, setupToken } = ctx;

  let result = await request('/api/auth/setup-status');
  assert.equal(result.response.status, 200);
  assert.equal(result.data.setupAllowed, true);

  result = await request('/api/admin/users');
  assert.equal(result.response.status, 401);

  result = await request('/api/auth/csrf');
  assert.equal(result.response.status, 200);
  const setupCsrf = result.data.csrfToken;

  result = await request('/api/auth/setup', {
    method: 'POST',
    headers: { 'X-CSRF-Token': setupCsrf },
    body: {
      setupToken,
      username: 'taskflow-admin',
      email: 'admin@example.test',
      fullName: 'TaskFlow Administrator',
      password: 'A-Strong-Test-Password-2026'
    }
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  assert.equal(result.data.ok, true);

  result = await request('/api/auth/setup-status');
  assert.equal(result.data.setupAllowed, false);

  result = await request('/api/auth/setup', {
    method: 'POST',
    headers: { 'X-CSRF-Token': 'not-a-valid-token' },
    body: {
      setupToken,
      username: 'second-admin',
      email: 'second-admin@example.test',
      fullName: 'Second Admin',
      password: 'A-Strong-Test-Password-2026'
    }
  });
  assert.equal(result.response.status, 403);
  assert.equal(result.data.code, 'CSRF_VALIDATION_FAILED');

  result = await request('/api/auth/csrf');
  const loginCsrf = result.data.csrfToken;
  result = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'X-CSRF-Token': loginCsrf },
    body: { identifier: 'admin@example.test', password: 'A-Strong-Test-Password-2026' }
  });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.user.role, 'admin');

  result = await request('/api/auth/me');
  assert.equal(result.data.authenticated, true);
  assert.equal(result.data.user.username, 'taskflow-admin');
  assert.equal(result.data.capabilities.manageUsers, true);

  result = await request('/api/admin/users');
  assert.equal(result.response.status, 200);
  assert.equal(result.data.count, 1);
  assert.equal(Object.hasOwn(result.data.users[0], 'password_hash'), false);

  const memberHash = await bcrypt.hash('A-Strong-Member-Password-2026', 12);
  db.prepare(`INSERT INTO users (username, email, full_name, password_hash, role)
              VALUES (?, ?, ?, ?, 'member')`)
    .run('member-user', 'member@example.test', 'TaskFlow Member', memberHash);

  result = await request('/api/auth/csrf');
  const logoutCsrf = result.data.csrfToken;
  result = await request('/api/auth/logout', { method: 'POST', body: {} });
  assert.equal(result.response.status, 403, 'unsafe requests require the session CSRF token');

  result = await request('/api/auth/logout', {
    method: 'POST',
    headers: { 'X-CSRF-Token': logoutCsrf },
    body: {}
  });
  assert.equal(result.response.status, 200);

  result = await request('/api/auth/csrf');
  const memberLoginCsrf = result.data.csrfToken;
  result = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'X-CSRF-Token': memberLoginCsrf },
    body: { identifier: 'member-user', password: 'A-Strong-Member-Password-2026' }
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.data.user.role, 'member');

  result = await request('/api/admin/users');
  assert.equal(result.response.status, 403);
  assert.equal(result.data.code, 'INSUFFICIENT_ROLE');

  result = await request('/api/auth/me');
  assert.equal(result.data.authenticated, true);
  assert.equal(result.data.capabilities.manageUsers, false);

  const memberCsrf = result.data.csrfToken || (await request('/api/auth/csrf')).data.csrfToken;
  for (let index = 0; index < 10; index += 1) {
    result = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'X-CSRF-Token': memberCsrf },
      body: { identifier: 'member-user', password: 'incorrect-password-value' }
    });
    assert.equal(result.response.status, 401);
  }
  result = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'X-CSRF-Token': memberCsrf },
    body: { identifier: 'member-user', password: 'incorrect-password-value' }
  });
  assert.equal(result.response.status, 429);

  result = await request('/api/auth/logout', {
    method: 'POST',
    headers: { 'X-CSRF-Token': memberCsrf },
    body: {}
  });
  assert.equal(result.response.status, 200);

  result = await request('/api/auth/me');
  assert.equal(result.data.authenticated, false);
});
