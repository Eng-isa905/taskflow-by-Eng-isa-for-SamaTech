'use strict';

const express = require('express');
const { db } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Stage 2: this real protected endpoint validates the Admin-only user-directory permission.
router.get('/users', requireAuth, requireRole('admin'), (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const users = db.prepare(`
    SELECT id, username, email, full_name, role, is_active, created_at, updated_at
    FROM users
    ORDER BY created_at DESC, id DESC
  `).all().map((row) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
  res.json({ users, count: users.length });
});

module.exports = { router };
