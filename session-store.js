'use strict';

const crypto = require('node:crypto');
const session = require('express-session');
const { db } = require('./db');

function hashSessionId(sessionId) {
  return crypto.createHash('sha256').update(sessionId, 'utf8').digest('hex');
}

function expiryTimestamp(sessionData) {
  const expires = sessionData && sessionData.cookie ? sessionData.cookie.expires : null;
  if (expires) {
    const timestamp = new Date(expires).getTime();
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return Date.now() + (8 * 60 * 60 * 1000);
}

class SQLiteSessionStore extends session.Store {
  get(sessionId, callback) {
    try {
      const key = hashSessionId(sessionId);
      const row = db.prepare(`
        SELECT session_data, expires_at FROM http_sessions WHERE session_hash = ?
      `).get(key);

      if (!row) return callback(null, null);
      if (row.expires_at <= Date.now()) {
        db.prepare('DELETE FROM http_sessions WHERE session_hash = ?').run(key);
        return callback(null, null);
      }

      return callback(null, JSON.parse(row.session_data));
    } catch (error) {
      return callback(error);
    }
  }

  set(sessionId, sessionData, callback = () => {}) {
    try {
      db.prepare(`
        INSERT INTO http_sessions (session_hash, session_data, expires_at)
        VALUES (?, ?, ?)
        ON CONFLICT(session_hash) DO UPDATE SET
          session_data = excluded.session_data,
          expires_at = excluded.expires_at
      `).run(hashSessionId(sessionId), JSON.stringify(sessionData), expiryTimestamp(sessionData));
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  touch(sessionId, sessionData, callback = () => {}) {
    try {
      db.prepare(`
        UPDATE http_sessions SET session_data = ?, expires_at = ? WHERE session_hash = ?
      `).run(JSON.stringify(sessionData), expiryTimestamp(sessionData), hashSessionId(sessionId));
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  destroy(sessionId, callback = () => {}) {
    try {
      db.prepare('DELETE FROM http_sessions WHERE session_hash = ?').run(hashSessionId(sessionId));
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  clear(callback = () => {}) {
    try {
      db.prepare('DELETE FROM http_sessions').run();
      callback(null);
    } catch (error) {
      callback(error);
    }
  }
}

module.exports = { SQLiteSessionStore };
