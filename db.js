'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const DEFAULT_DB_PATH = path.join(__dirname, 'data', 'taskflow.sqlite');
const dbPath = path.resolve(process.env.DB_PATH || DEFAULT_DB_PATH);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath, {
  timeout: 5000,
  fileMustExist: false
});

db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

const initializeSchema = db.transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member'
        CHECK (role IN ('admin', 'manager', 'member')),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_code TEXT NOT NULL COLLATE NOCASE UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned', 'active', 'on_hold', 'completed', 'cancelled')),
      owner_id INTEGER,
      start_date TEXT,
      due_date TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      CHECK (start_date IS NULL OR date(start_date) IS NOT NULL),
      CHECK (due_date IS NULL OR date(due_date) IS NOT NULL),
      CHECK (start_date IS NULL OR due_date IS NULL OR date(due_date) >= date(start_date)),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      project_id INTEGER NOT NULL,
      assigned_to INTEGER,
      created_by INTEGER,
      status TEXT NOT NULL DEFAULT 'todo'
        CHECK (status IN ('backlog', 'todo', 'in_progress', 'blocked', 'completed', 'cancelled')),
      priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      start_date TEXT,
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      CHECK (start_date IS NULL OR date(start_date) IS NOT NULL),
      CHECK (due_date IS NULL OR date(due_date) IS NOT NULL),
      CHECK (start_date IS NULL OR due_date IS NULL OR date(due_date) >= date(start_date)),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS http_sessions (
      session_hash TEXT PRIMARY KEY,
      session_data TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_login_attempts (
      ip_hash TEXT PRIMARY KEY,
      window_started_at INTEGER NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      blocked_until INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_http_sessions_expires ON http_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_auth_attempts_blocked ON auth_login_attempts(blocked_until);

    CREATE TRIGGER IF NOT EXISTS users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
    END;

    CREATE TRIGGER IF NOT EXISTS projects_updated_at
    AFTER UPDATE ON projects
    FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE projects SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
    END;

    CREATE TRIGGER IF NOT EXISTS tasks_updated_at
    AFTER UPDATE ON tasks
    FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE tasks SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
    END;
  `);

  db.prepare(`
    INSERT OR IGNORE INTO schema_migrations (version, description)
    VALUES (?, ?)
  `).run(1, 'Initial TaskFlow schema: users, projects, and tasks');

  db.prepare(`
    INSERT OR IGNORE INTO schema_migrations (version, description)
    VALUES (?, ?)
  `).run(2, 'Database-backed sessions, login throttling, and authentication foundations');
});

initializeSchema();

// Clean expired records on startup. The session store also removes sessions when accessed.
db.prepare('DELETE FROM http_sessions WHERE expires_at <= ?').run(Date.now());
db.prepare('DELETE FROM auth_login_attempts WHERE window_started_at < ? AND (blocked_until IS NULL OR blocked_until <= ?)')
  .run(Date.now() - (24 * 60 * 60 * 1000), Date.now());

function getSchemaStatus() {
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name IN ('users', 'projects', 'tasks')
    ORDER BY name
  `).all().map((row) => row.name);

  const authTables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name IN ('http_sessions', 'auth_login_attempts')
    ORDER BY name
  `).all().map((row) => row.name);

  const migration = db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get();
  return {
    connected: true,
    schemaVersion: migration?.version ?? 0,
    tables,
    authTables
  };
}

module.exports = { db, dbPath, getSchemaStatus };
