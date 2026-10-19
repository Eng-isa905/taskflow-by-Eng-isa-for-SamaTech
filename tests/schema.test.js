'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// The schema tests use a temporary database and never modify a developer's database.
test('SQLite schema initializes core and authentication tables and enforces role/status values', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskflow-test-'));
  const databasePath = path.join(tempDir, 'test.sqlite');
  const previousDbPath = process.env.DB_PATH;
  process.env.DB_PATH = databasePath;

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

  const schema = getSchemaStatus();
  assert.equal(schema.connected, true);
  assert.equal(schema.schemaVersion, 2);
  assert.deepEqual(schema.tables, ['projects', 'tasks', 'users']);
  assert.deepEqual(schema.authTables, ['auth_login_attempts', 'http_sessions']);
  assert.equal(fs.existsSync(databasePath), true);

  assert.throws(() => {
    db.prepare(`INSERT INTO users (username, email, full_name, password_hash, role)
                VALUES (?, ?, ?, ?, ?)`)
      .run('invalid-role', 'invalid@example.test', 'Invalid Role', 'not-a-real-hash', 'owner');
  }, /CHECK constraint failed/);

  assert.throws(() => {
    db.prepare(`INSERT INTO users (username, email, full_name, password_hash, role)
                VALUES (?, ?, ?, ?, ?)`)
      .run('duplicate-role', 'duplicate@example.test', 'Valid Role', 'not-a-real-hash', 'member');
    db.prepare(`INSERT INTO users (username, email, full_name, password_hash, role)
                VALUES (?, ?, ?, ?, ?)`)
      .run('duplicate-role', 'another@example.test', 'Duplicate User', 'not-a-real-hash', 'member');
  }, /UNIQUE constraint failed/);
});
