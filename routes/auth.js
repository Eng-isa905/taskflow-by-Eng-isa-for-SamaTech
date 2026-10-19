'use strict';

const crypto = require('node:crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireAuth, safeUser } = require('../middleware/auth');

const router = express.Router();
router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
const SETUP_TOKEN = process.env.SETUP_TOKEN || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const BCRYPT_ROUNDS = 12;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), BCRYPT_ROUNDS);
const MIN_SETUP_TOKEN_BYTES = 32;

const findUserByIdentifier = db.prepare(`
  SELECT id, username, email, full_name, password_hash, role, is_active, created_at, updated_at
  FROM users
  WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE
  LIMIT 1
`);
const insertUser = db.prepare(`
  INSERT INTO users (username, email, full_name, password_hash, role)
  VALUES (?, ?, ?, ?, 'admin')
`);
const countUsers = db.prepare('SELECT COUNT(*) AS count FROM users').pluck();

function configuredSetupToken() {
  return Buffer.byteLength(SETUP_TOKEN, 'utf8') >= MIN_SETUP_TOKEN_BYTES;
}

function setupAllowed() {
  return configuredSetupToken() && countUsers.get() === 0;
}

function constantTimeStringEqual(received, expected) {
  if (typeof received !== 'string' || typeof expected !== 'string') return false;
  const receivedBuffer = Buffer.from(received, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (receivedBuffer.length !== expectedBuffer.length || expectedBuffer.length === 0) return false;
  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function createCsrfToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function getIpHash(ip) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(String(ip || 'unknown')).digest('hex');
}

function loginBlockRemaining(ipHash, now = Date.now()) {
  const row = db.prepare(`
    SELECT window_started_at, attempt_count, blocked_until
    FROM auth_login_attempts WHERE ip_hash = ?
  `).get(ipHash);

  if (!row) return 0;
  if (row.blocked_until && row.blocked_until > now) return Math.ceil((row.blocked_until - now) / 1000);
  if (now - row.window_started_at >= LOGIN_WINDOW_MS) {
    db.prepare('DELETE FROM auth_login_attempts WHERE ip_hash = ?').run(ipHash);
  }
  return 0;
}

function recordFailedLogin(ipHash, now = Date.now()) {
  const existing = db.prepare(`
    SELECT window_started_at, attempt_count FROM auth_login_attempts WHERE ip_hash = ?
  `).get(ipHash);

  if (!existing || now - existing.window_started_at >= LOGIN_WINDOW_MS) {
    db.prepare(`
      INSERT INTO auth_login_attempts (ip_hash, window_started_at, attempt_count, blocked_until)
      VALUES (?, ?, 1, NULL)
      ON CONFLICT(ip_hash) DO UPDATE SET
        window_started_at = excluded.window_started_at,
        attempt_count = 1,
        blocked_until = NULL
    `).run(ipHash, now);
    return;
  }

  const nextCount = existing.attempt_count + 1;
  const blockedUntil = nextCount >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_WINDOW_MS : null;
  db.prepare(`
    UPDATE auth_login_attempts SET attempt_count = ?, blocked_until = ? WHERE ip_hash = ?
  `).run(nextCount, blockedUntil, ipHash);
}

function validateSetupFields(body) {
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const token = typeof body.setupToken === 'string' ? body.setupToken : '';

  if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) {
    return { error: 'اسم المستخدم يجب أن يتراوح بين 3 و32 محرفاً، ويحتوي على أحرف إنجليزية أو أرقام أو نقطة أو شرطة أو شرطة سفلية.' };
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'أدخل بريداً إلكترونياً صالحاً.' };
  }
  if (fullName.length < 2 || fullName.length > 120) {
    return { error: 'الاسم الكامل يجب أن يتراوح بين محرفين و120 محرفاً.' };
  }
  if (password.length < 12 || password.length > 128 || Buffer.byteLength(password, 'utf8') > 72) {
    return { error: 'كلمة المرور يجب ألا تقل عن 12 محرفاً وألا تتجاوز 72 بايت وفق UTF-8.' };
  }
  if (token.length < MIN_SETUP_TOKEN_BYTES || token.length > 512) {
    return { error: 'رمز الإعداد مفقود أو غير صالح.' };
  }
  return { username, email, fullName, password, token };
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => error ? reject(error) : resolve());
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => error ? reject(error) : resolve());
  });
}

router.get('/csrf', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!req.session.csrfToken) req.session.csrfToken = createCsrfToken();
  res.json({ csrfToken: req.session.csrfToken });
});

router.get('/setup-status', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ setupAllowed: setupAllowed() });
});

router.post('/setup', async (req, res, next) => {
  try {
    if (!setupAllowed()) {
      return res.status(403).json({ error: 'الإعداد الأولي مغلق أو لم تتم تهيئته.', code: 'SETUP_CLOSED' });
    }

    const fields = validateSetupFields(req.body || {});
    if (fields.error) return res.status(400).json({ error: fields.error, code: 'VALIDATION_ERROR' });
    if (!constantTimeStringEqual(fields.token, SETUP_TOKEN)) {
      return res.status(403).json({ error: 'رمز الإعداد غير صحيح.', code: 'INVALID_SETUP_TOKEN' });
    }

    // Re-check within the synchronous insert transaction so only one first admin can be created.
    const passwordHash = await bcrypt.hash(fields.password, BCRYPT_ROUNDS);
    const createFirstAdmin = db.transaction(() => {
      if (countUsers.get() !== 0) throw Object.assign(new Error('SETUP_CLOSED'), { code: 'SETUP_CLOSED' });
      return insertUser.run(fields.username, fields.email, fields.fullName, passwordHash).lastInsertRowid;
    });

    let userId;
    try {
      userId = createFirstAdmin();
    } catch (error) {
      if (error.code === 'SETUP_CLOSED') {
        return res.status(403).json({ error: 'تم إغلاق الإعداد الأولي بالفعل.', code: 'SETUP_CLOSED' });
      }
      if (String(error.message).includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'اسم المستخدم أو البريد الإلكتروني مسجل مسبقاً.', code: 'ACCOUNT_CONFLICT' });
      }
      throw error;
    }

    await regenerateSession(req);
    req.session.csrfToken = createCsrfToken();
    await saveSession(req);

    res.status(201).json({
      ok: true,
      message: 'تم إنشاء حساب المدير. سجّل الدخول باستخدام البيانات التي أدخلتها.',
      userId
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const ipHash = getIpHash(req.ip);
    const remaining = loginBlockRemaining(ipHash);

    if (remaining > 0) {
      res.setHeader('Retry-After', String(remaining));
      return res.status(429).json({
        error: `محاولات تسجيل الدخول الفاشلة كثيرة. حاول مجدداً بعد نحو ${Math.ceil(remaining / 60)} دقيقة.`,
        code: 'LOGIN_RATE_LIMITED'
      });
    }

    if (!identifier || identifier.length > 254 || !password || password.length > 128 || Buffer.byteLength(password, 'utf8') > 72) {
      recordFailedLogin(ipHash);
      return res.status(401).json({ error: 'اسم المستخدم أو البريد الإلكتروني أو كلمة المرور غير صحيحة.', code: 'INVALID_CREDENTIALS' });
    }

    const user = findUserByIdentifier.get(identifier, identifier);
    const passwordMatches = await bcrypt.compare(password, user ? user.password_hash : DUMMY_PASSWORD_HASH);
    if (!user || !passwordMatches || user.is_active !== 1) {
      recordFailedLogin(ipHash);
      return res.status(401).json({ error: 'اسم المستخدم أو البريد الإلكتروني أو كلمة المرور غير صحيحة.', code: 'INVALID_CREDENTIALS' });
    }

    db.prepare('DELETE FROM auth_login_attempts WHERE ip_hash = ?').run(ipHash);
    await regenerateSession(req);
    req.session.userId = user.id;
    req.session.csrfToken = createCsrfToken();
    await saveSession(req);

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ ok: true, user: safeUser(user), csrfToken: req.session.csrfToken });
  } catch (error) {
    next(error);
  }
});

router.get('/me', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const userId = Number(req.session?.userId);
  if (!Number.isInteger(userId) || userId < 1) return res.json({ authenticated: false, user: null });

  const row = db.prepare(`
    SELECT id, username, email, full_name, role, is_active, created_at, updated_at
    FROM users WHERE id = ?
  `).get(userId);

  if (!row || row.is_active !== 1) {
    req.session.destroy(() => {});
    res.clearCookie('taskflow.sid', { path: '/' });
    return res.json({ authenticated: false, user: null });
  }

  const capabilities = {
    manageUsers: row.role === 'admin',
    viewUserDirectory: row.role === 'admin',
    manageProjects: row.role === 'admin' || row.role === 'manager',
    manageTasks: row.role === 'admin' || row.role === 'manager',
    updateAssignedTasks: true
  };

  return res.json({ authenticated: true, user: safeUser(row), capabilities });
});

router.post('/logout', (req, res) => {
  if (!req.session) {
    res.clearCookie('taskflow.sid', { path: '/' });
    return res.json({ ok: true });
  }

  req.session.destroy((error) => {
    if (error) return res.status(500).json({ error: 'تعذر إنهاء الجلسة.', code: 'LOGOUT_FAILED' });
    res.clearCookie('taskflow.sid', { path: '/' });
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ ok: true, message: 'تم تسجيل الخروج بنجاح.' });
  });
});

router.get('/whoami', requireAuth, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ user: req.user });
});

module.exports = { router, setupAllowed };
