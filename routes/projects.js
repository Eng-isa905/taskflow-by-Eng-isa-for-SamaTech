'use strict';

const express = require('express');
const { db } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const MANAGERS = ['admin', 'manager'];
const PROJECT_STATUSES = new Set(['planned', 'active', 'on_hold', 'completed', 'cancelled']);

router.use(requireAuth);
router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const projectListSql = `
  SELECT p.id, p.project_code, p.name, p.description, p.status,
         p.owner_id, p.start_date, p.due_date, p.created_by, p.created_at, p.updated_at,
         owner.full_name AS owner_name,
         COUNT(t.id) AS task_count,
         SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
  FROM projects p
  LEFT JOIN users owner ON owner.id = p.owner_id
  LEFT JOIN tasks t ON t.project_id = p.id
`;

function toProject(row) {
  const taskCount = Number(row.task_count || 0);
  const completedTasks = Number(row.completed_tasks || 0);
  return {
    id: row.id,
    projectCode: row.project_code,
    name: row.name,
    description: row.description,
    status: row.status,
    ownerId: row.owner_id,
    ownerName: row.owner_name || null,
    startDate: row.start_date,
    dueDate: row.due_date,
    taskCount,
    completedTasks,
    progress: taskCount ? Math.round((completedTasks / taskCount) * 100) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parseDate(value, label) {
  if (value === undefined || value === null || value === '') return { value: null };
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: `صيغة ${label} غير صحيحة.` };
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    return { error: `تاريخ ${label} غير صالح.` };
  }
  return { value };
}

function validateProject(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const status = typeof body.status === 'string' ? body.status : 'planned';
  const startDate = parseDate(body.startDate, 'البداية');
  const dueDate = parseDate(body.dueDate, 'الاستحقاق');

  if (name.length < 2 || name.length > 120) return { error: 'اسم المشروع مطلوب ويجب أن يكون بين حرفين و120 حرفاً.' };
  if (description.length > 2000) return { error: 'وصف المشروع يجب ألا يتجاوز 2000 حرف.' };
  if (!PROJECT_STATUSES.has(status)) return { error: 'حالة المشروع غير صحيحة.' };
  if (startDate.error) return { error: startDate.error };
  if (dueDate.error) return { error: dueDate.error };
  if (startDate.value && dueDate.value && dueDate.value < startDate.value) {
    return { error: 'تاريخ الانتهاء يجب أن يساوي تاريخ البداية أو يأتي بعده.' };
  }

  let ownerId = null;
  if (body.ownerId !== undefined && body.ownerId !== null && body.ownerId !== '') {
    ownerId = Number(body.ownerId);
    if (!Number.isSafeInteger(ownerId) || ownerId < 1) return { error: 'المسؤول المحدد غير صالح.' };
    const owner = db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(ownerId);
    if (!owner) return { error: 'المسؤول المحدد غير موجود أو غير نشط.' };
  }

  return { name, description, status, startDate: startDate.value, dueDate: dueDate.value, ownerId };
}

function getProjectRow(id) {
  return db.prepare(`${projectListSql} WHERE p.id = ? GROUP BY p.id`).get(id);
}

function nextProjectCode() {
  const row = db.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'projects'").get();
  const maxId = db.prepare('SELECT COALESCE(MAX(id), 0) AS id FROM projects').get().id;
  const nextId = Math.max(Number(row?.seq || 0), Number(maxId || 0)) + 1;
  return `TF-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;
}

router.get('/users', requireRole(...MANAGERS), (_req, res) => {
  const users = db.prepare(`
    SELECT id, full_name AS fullName, username
    FROM users WHERE is_active = 1
    ORDER BY full_name COLLATE NOCASE, id
  `).all();
  res.json({ users });
});

router.get('/', (req, res) => {
  const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  if (status && status !== 'all' && !PROJECT_STATUSES.has(status)) {
    return res.status(400).json({ error: 'مرشح الحالة غير صالح.', code: 'VALIDATION_ERROR' });
  }

  const where = [];
  const params = [];
  if (search) {
    where.push('(p.name LIKE ? OR p.project_code LIKE ? OR p.description LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (status && status !== 'all') {
    where.push('p.status = ?');
    params.push(status);
  }
  const sql = `${projectListSql}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} GROUP BY p.id ORDER BY p.updated_at DESC, p.id DESC`;
  const projects = db.prepare(sql).all(...params).map(toProject);
  const summary = {
    total: projects.length,
    active: projects.filter((item) => item.status === 'active').length,
    completed: projects.filter((item) => item.status === 'completed').length,
    delayed: projects.filter((item) => item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10) && !['completed', 'cancelled'].includes(item.status)).length
  };
  return res.json({ projects, count: projects.length, summary });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'رقم المشروع غير صالح.', code: 'VALIDATION_ERROR' });
  const row = getProjectRow(id);
  if (!row) return res.status(404).json({ error: 'المشروع غير موجود.', code: 'PROJECT_NOT_FOUND' });

  const tasks = db.prepare(`
    SELECT t.id, t.title, t.status, t.priority, t.due_date AS dueDate,
           u.full_name AS assigneeName
    FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.project_id = ? ORDER BY t.id DESC LIMIT 50
  `).all(id);
  return res.json({ project: toProject(row), tasks });
});

router.post('/', requireRole(...MANAGERS), (req, res) => {
  const fields = validateProject(req.body || {});
  if (fields.error) return res.status(400).json({ error: fields.error, code: 'VALIDATION_ERROR' });

  try {
    const create = db.transaction(() => {
      const projectCode = nextProjectCode();
      const result = db.prepare(`
        INSERT INTO projects (project_code, name, description, status, owner_id, start_date, due_date, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(projectCode, fields.name, fields.description, fields.status, fields.ownerId, fields.startDate, fields.dueDate, req.user.id);
      return Number(result.lastInsertRowid);
    });
    const id = create();
    return res.status(201).json({ ok: true, message: 'تم إنشاء المشروع بنجاح.', project: toProject(getProjectRow(id)) });
  } catch (error) {
    console.error('Project creation failed:', error.message);
    return res.status(500).json({ error: 'تعذر إنشاء المشروع حالياً.', code: 'PROJECT_CREATE_FAILED' });
  }
});

router.put('/:id', requireRole(...MANAGERS), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'رقم المشروع غير صالح.', code: 'VALIDATION_ERROR' });
  if (!db.prepare('SELECT id FROM projects WHERE id = ?').get(id)) {
    return res.status(404).json({ error: 'المشروع غير موجود.', code: 'PROJECT_NOT_FOUND' });
  }
  const fields = validateProject(req.body || {});
  if (fields.error) return res.status(400).json({ error: fields.error, code: 'VALIDATION_ERROR' });
  db.prepare(`
    UPDATE projects
    SET name = ?, description = ?, status = ?, owner_id = ?, start_date = ?, due_date = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `).run(fields.name, fields.description, fields.status, fields.ownerId, fields.startDate, fields.dueDate, id);
  return res.json({ ok: true, message: 'تم تحديث المشروع بنجاح.', project: toProject(getProjectRow(id)) });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'رقم المشروع غير صالح.', code: 'VALIDATION_ERROR' });
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'المشروع غير موجود.', code: 'PROJECT_NOT_FOUND' });
  return res.json({ ok: true, message: 'تم حذف المشروع.' });
});

module.exports = { router, validateProject, toProject };
