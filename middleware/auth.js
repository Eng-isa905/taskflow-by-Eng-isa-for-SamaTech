'use strict';

const { db } = require('../db');

function safeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function requireAuth(req, res, next) {
  const userId = Number(req.session?.userId);
  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(401).json({ error: 'يلزم تسجيل الدخول أولاً.', code: 'AUTHENTICATION_REQUIRED' });
  }

  const row = db.prepare(`
    SELECT id, username, email, full_name, role, is_active, created_at, updated_at
    FROM users WHERE id = ?
  `).get(userId);

  if (!row || row.is_active !== 1) {
    req.session.destroy(() => {});
    res.clearCookie('taskflow.sid', { path: '/' });
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.', code: 'SESSION_INVALID' });
  }

  req.user = safeUser(row);
  return next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'يلزم تسجيل الدخول أولاً.', code: 'AUTHENTICATION_REQUIRED' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'ليست لديك صلاحية للوصول إلى هذا المورد.', code: 'INSUFFICIENT_ROLE' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole, safeUser };
