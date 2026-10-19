'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');

test('schema v1 database is upgraded to v2 without deleting existing users/projects/tasks', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskflow-migration-test-'));
  const databasePath = path.join(tempDir, 'legacy.sqlite');
  const previousDbPath = process.env.DB_PATH;
  process.env.DB_PATH = databasePath;

  const source = fs.readFileSync(path.join(__dirname, '..', 'db.js'), 'utf8');
  const match = source.match(/db\.exec\(`([\s\S]*?)`\);/);
  assert.ok(match, 'the initial schema SQL must be present in db.js');
  let versionOneSql = match[1];
  versionOneSql = versionOneSql.replace(/\n    CREATE TABLE IF NOT EXISTS http_sessions \([\s\S]*?\n    \);\n\n    CREATE TABLE IF NOT EXISTS auth_login_attempts \([\s\S]*?\n    \);/, '');
  versionOneSql = versionOneSql.replace(/\n    CREATE INDEX IF NOT EXISTS idx_http_sessions_expires ON http_sessions\(expires_at\);/, '');
  versionOneSql = versionOneSql.replace(/\n    CREATE INDEX IF NOT EXISTS idx_auth_attempts_blocked ON auth_login_attempts\(blocked_until\);/, '');

  const legacyDb = new Database(databasePath);
  legacyDb.pragma('foreign_keys = ON');
  legacyDb.exec(versionOneSql);
  legacyDb.prepare(`INSERT INTO schema_migrations (version, description) VALUES (1, ?)`)
    .run('Initial TaskFlow schema: users, projects, and tasks');
  const userId = legacyDb.prepare(`
    INSERT INTO users (username, email, full_name, password_hash, role)
    VALUES ('legacy.admin', 'legacy@example.test', 'Legacy Admin', 'legacy-hash', 'admin')
  `).run().lastInsertRowid;
  const projectId = legacyDb.prepare(`
    INSERT INTO projects (project_code, name, description, status, owner_id, created_by)
    VALUES ('LEGACY-001', 'Legacy Project', 'Existing record', 'active', ?, ?)
  `).run(userId, userId).lastInsertRowid;
  legacyDb.prepare(`
    INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority)
    VALUES ('Legacy Task', 'Existing task record', ?, ?, ?, 'todo', 'medium')
  `).run(projectId, userId, userId);
  legacyDb.close();

  const dbModulePath = require.resolve('../db');
  delete require.cache[dbModulePath];
  const { db, getSchemaStatus } = require('../db');
  t.after(() => {
    db.close();
    delete require.cache[dbModulePath];
    if (previousDbPath === undefined) delete process.env.DB_PATH;
    else process.env.DB_PATH = previousDbPath;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const status = getSchemaStatus();
  assert.equal(status.schemaVersion, 2);
  assert.deepEqual(status.authTables, ['auth_login_attempts', 'http_sessions']);
  assert.equal(db.prepare('SELECT COUNT(*) FROM users').pluck().get(), 1);
  assert.equal(db.prepare('SELECT COUNT(*) FROM projects').pluck().get(), 1);
  assert.equal(db.prepare('SELECT COUNT(*) FROM tasks').pluck().get(), 1);
  assert.equal(db.prepare('SELECT name FROM projects WHERE project_code = ?').pluck().get('LEGACY-001'), 'Legacy Project');
});
