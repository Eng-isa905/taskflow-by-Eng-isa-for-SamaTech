'use strict';

const crypto = require('node:crypto');
const express = require('express');
const path = require('node:path');
const session = require('express-session');
const { db, dbPath, getSchemaStatus } = require('./db');
const { SQLiteSessionStore } = require('./session-store');
const { router: authRouter, setupAllowed } = require('./routes/auth');
const { router: adminRouter } = require('./routes/admin');
const { router: projectsRouter } = require('./routes/projects');

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
if (Buffer.byteLength(SESSION_SECRET, 'utf8') < 32) {
  throw new Error('SESSION_SECRET is required and must be at least 32 bytes. Add a strong random value to .env before starting TaskFlow.');
}

const app = express();
app.disable('x-powered-by');
app.disable('etag');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self';");
  next();
});

app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

const sessionStore = new SQLiteSessionStore();
app.use(session({
  name: 'taskflow.sid',
  secret: SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length || left.length === 0) return false;
  return crypto.timingSafeEqual(left, right);
}

// Apply CSRF protection to every state-changing REST request.
app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const providedToken = req.get('x-csrf-token');
  const sessionToken = req.session?.csrfToken;
  if (!constantTimeEqual(providedToken, sessionToken)) {
    return res.status(403).json({ error: 'رمز الحماية مفقود أو انتهت صلاحيته. حدّث الصفحة ثم أعد المحاولة.', code: 'CSRF_VALIDATION_FAILED' });
  }
  return next();
});

app.get('/api/health', (_req, res) => {
  try {
    db.prepare('SELECT 1 AS ok').get();
    const schema = getSchemaStatus();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      status: 'ok',
      service: 'taskflow-api',
      timestamp: new Date().toISOString(),
      database: {
        connected: schema.connected,
        schemaVersion: schema.schemaVersion,
        initializedTables: schema.tables,
        authTables: schema.authTables
      }
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({ status: 'error', service: 'taskflow-api' });
  }
});

app.get('/api/config', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    productName: 'TaskFlow',
    productDescriptor: 'نظام إدارة المشاريع والمهام',
    companyName: 'سما تك للهندسة والتكنولوجيا',
    companyNameAr: 'سما تك للهندسة والتكنولوجيا',
    tagline: 'نظّم المشاريع، وأدر المهام، وحقّق النتائج.',
    stage: 'إدارة المشاريع',
    stageNumber: 3,
    setupAvailable: setupAllowed()
  });
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/projects', projectsRouter);

app.use(express.static(PUBLIC_DIR, {
  index: 'index.html',
  dotfiles: 'deny',
  etag: true,
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    } else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'مسار واجهة البرمجة غير موجود.' });
  return res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

app.use((error, _req, res, _next) => {
  console.error('Unhandled request error:', error.message);
  if (res.headersSent) return;
  res.status(500).json({ error: 'حدث خطأ غير متوقع في الخادم.', code: 'INTERNAL_SERVER_ERROR' });
});

let server = null;
if (require.main === module) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskFlow is listening on port ${PORT}.`);
    console.log(`SQLite database: ${dbPath}`);
    console.log(`Schema initialized: ${JSON.stringify(getSchemaStatus())}`);
    console.log(`Initial administrator setup enabled: ${setupAllowed()}`);
    console.log(`Session cookies secure: ${COOKIE_SECURE}`);
  });

  const cleanupTimer = setInterval(() => {
    try {
      db.prepare('DELETE FROM http_sessions WHERE expires_at <= ?').run(Date.now());
      db.prepare('DELETE FROM auth_login_attempts WHERE window_started_at < ? AND (blocked_until IS NULL OR blocked_until <= ?)')
        .run(Date.now() - (24 * 60 * 60 * 1000), Date.now());
    } catch (error) {
      console.error('Periodic auth cleanup failed:', error.message);
    }
  }, 60 * 60 * 1000);
  cleanupTimer.unref();

  function shutdown(signal) {
    console.log(`${signal} received; closing TaskFlow gracefully...`);
    clearInterval(cleanupTimer);
    server.close(() => {
      try {
        db.close();
        console.log('HTTP server and database connection closed.');
        process.exit(0);
      } catch (error) {
        console.error('Error while closing database:', error.message);
        process.exit(1);
      }
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { app, db, sessionStore, server };
