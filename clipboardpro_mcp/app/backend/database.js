/**
 * Database Module - SQLite management for clipboard history
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/history.db');

let db = null;

/**
 * Initialize database connection
 * @returns {Promise<sqlite3.Database>}
 */
async function initialize() {
  return new Promise((resolve, reject) => {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('[DB] Failed to connect to database:', err);
        reject(err);
      } else {
        console.log(`[DB] Connected to SQLite database: ${DB_PATH}`);
        createTables()
          .then(() => resolve(db))
          .catch(reject);
      }
    });
  });
}

/**
 * Create database tables
 * @returns {Promise<void>}
 */
async function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Clipboard history table
      db.run(`
        CREATE TABLE IF NOT EXISTS clipboard_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK(type IN ('text', 'image', 'file')),
          content TEXT,
          ocr_text TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced BOOLEAN DEFAULT 0,
          device_id TEXT
        )
      `, (err) => {
        if (err) console.error('[DB] Error creating clipboard_history:', err);
      });

      // AI transformations table
      db.run(`
        CREATE TABLE IF NOT EXISTS ai_transformations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          history_id INTEGER,
          action TEXT NOT NULL CHECK(action IN ('rewrite', 'translate', 'summarize', 'clean')),
          input_text TEXT,
          output_text TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (history_id) REFERENCES clipboard_history(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('[DB] Error creating ai_transformations:', err);
      });

      // Settings table
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('[DB] Error creating settings:', err);
          reject(err);
        } else {
          console.log('[DB] Tables created successfully');
          resolve();
        }
      });

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_created_at ON clipboard_history(created_at DESC)');
      db.run('CREATE INDEX IF NOT EXISTS idx_type ON clipboard_history(type)');
      db.run('CREATE INDEX IF NOT EXISTS idx_device_id ON clipboard_history(device_id)');
    });
  });
}

/**
 * Execute a SQL query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<object>}
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * Get single row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<object>}
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Get all rows
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
function close() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('[DB] Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

/**
 * Get database instance
 * @returns {sqlite3.Database}
 */
function getInstance() {
  return db;
}

module.exports = {
  initialize,
  run,
  get,
  all,
  close,
  getInstance
};
