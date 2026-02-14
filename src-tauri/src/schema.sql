CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    modified_at INTEGER NOT NULL,
    hash TEXT,
    category TEXT,
    importance_score REAL,
    ai_analysis TEXT,
    is_directory INTEGER NOT NULL DEFAULT 0,
    extension TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    files_found INTEGER,
    total_size INTEGER,
    status TEXT DEFAULT 'running'
);

CREATE TABLE IF NOT EXISTS cleanups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    space_freed INTEGER,
    operations TEXT,
    status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
