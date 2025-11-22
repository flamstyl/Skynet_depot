-- Schema for Google Drive Space Analyzer

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    created_at INTEGER NOT NULL,
    last_scan_at INTEGER,
    is_active INTEGER DEFAULT 1
);

-- Files cache table
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    mime_type TEXT,
    parent_id TEXT,
    created_time INTEGER,
    modified_time INTEGER,
    md5_checksum TEXT,
    is_folder INTEGER DEFAULT 0,
    cached_at INTEGER NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Scan history table
CREATE TABLE IF NOT EXISTS scan_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    scan_date INTEGER NOT NULL,
    total_files INTEGER NOT NULL,
    total_size INTEGER NOT NULL,
    quota_used INTEGER NOT NULL,
    quota_limit INTEGER NOT NULL,
    quota_drive INTEGER,
    quota_trash INTEGER,
    duration_seconds REAL NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_account ON files(account_id);
CREATE INDEX IF NOT EXISTS idx_files_size ON files(size DESC);
CREATE INDEX IF NOT EXISTS idx_files_mime ON files(mime_type);
CREATE INDEX IF NOT EXISTS idx_files_parent ON files(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_md5 ON files(md5_checksum) WHERE md5_checksum IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_cached ON files(cached_at);
CREATE INDEX IF NOT EXISTS idx_scan_history_account_date ON scan_history(account_id, scan_date DESC);

-- Views for analytics
CREATE VIEW IF NOT EXISTS v_size_by_type AS
SELECT
    account_id,
    mime_type,
    COUNT(*) as file_count,
    SUM(size) as total_size
FROM files
WHERE is_folder = 0
GROUP BY account_id, mime_type;

CREATE VIEW IF NOT EXISTS v_large_files AS
SELECT
    f.*,
    a.email as account_email
FROM files f
JOIN accounts a ON f.account_id = a.id
WHERE f.is_folder = 0 AND f.size > 104857600  -- 100 MB
ORDER BY f.size DESC;

CREATE VIEW IF NOT EXISTS v_duplicates AS
SELECT
    md5_checksum,
    COUNT(*) as duplicate_count,
    SUM(size) as total_size
FROM files
WHERE md5_checksum IS NOT NULL
GROUP BY md5_checksum
HAVING COUNT(*) > 1
ORDER BY total_size DESC;
