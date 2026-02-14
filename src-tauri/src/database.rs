use rusqlite::{params, Connection, OptionalExtension, Row};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileRecord {
    pub id: String,
    pub path: String,
    pub name: String,
    pub size: i64,
    pub modified_at: i64,
    pub hash: Option<String>,
    pub category: Option<String>,
    pub importance_score: Option<f64>,
    pub ai_analysis: Option<String>,
    pub is_directory: bool,
    pub extension: Option<String>,
    pub created_at: Option<i64>,
}

pub struct Database {
    conn: Mutex<Connection>,
}

const FILE_COLS: &str = "\
    id, path, name, size, modified_at, hash, \
    category, importance_score, ai_analysis, \
    is_directory, extension, created_at";

fn row_to_file(row: &Row) -> rusqlite::Result<FileRecord> {
    Ok(FileRecord {
        id: row.get(0)?,
        path: row.get(1)?,
        name: row.get(2)?,
        size: row.get(3)?,
        modified_at: row.get(4)?,
        hash: row.get(5)?,
        category: row.get(6)?,
        importance_score: row.get(7)?,
        ai_analysis: row.get(8)?,
        is_directory: row.get::<_, i32>(9)? != 0,
        extension: row.get(10)?,
        created_at: row.get(11)?,
    })
}

fn lock_err(e: impl std::fmt::Display) -> String {
    format!("Lock error: {e}")
}

impl Database {
    pub fn new() -> Result<Self, String> {
        let db_path = Self::db_path()?;
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("Failed to create db dir: {e}"))?;
        }
        let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open db: {e}"))?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.initialize_tables()?;
        Ok(db)
    }

    fn db_path() -> Result<PathBuf, String> {
        let data_dir = dirs::data_dir().ok_or("Could not determine data directory")?;
        Ok(data_dir.join("cleanos-ai").join("cleanos.db"))
    }

    fn initialize_tables(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(lock_err)?;
        conn.execute_batch(include_str!("schema.sql"))
            .map_err(|e| format!("Schema init: {e}"))?;
        Ok(())
    }

    pub fn insert_file(&self, file: &FileRecord) -> Result<(), String> {
        let conn = self.conn.lock().map_err(lock_err)?;
        conn.execute(
            "INSERT OR REPLACE INTO files \
             (id, path, name, size, modified_at, hash, \
              category, importance_score, ai_analysis, \
              is_directory, extension) \
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            params![
                file.id,
                file.path,
                file.name,
                file.size,
                file.modified_at,
                file.hash,
                file.category,
                file.importance_score,
                file.ai_analysis,
                file.is_directory as i32,
                file.extension,
            ],
        )
        .map_err(|e| format!("Insert file: {e}"))?;
        Ok(())
    }

    pub fn get_file(&self, id: &str) -> Result<Option<FileRecord>, String> {
        let conn = self.conn.lock().map_err(lock_err)?;
        let sql = format!("SELECT {FILE_COLS} FROM files WHERE id = ?1");
        let mut stmt = conn.prepare(&sql).map_err(|e| format!("Query: {e}"))?;
        let result = stmt
            .query_row(params![id], row_to_file)
            .optional()
            .map_err(|e| format!("Query: {e}"))?;
        Ok(result)
    }

    pub fn get_all_files(&self) -> Result<Vec<FileRecord>, String> {
        let conn = self.conn.lock().map_err(lock_err)?;
        let sql = format!("SELECT {FILE_COLS} FROM files ORDER BY size DESC");
        let mut stmt = conn.prepare(&sql).map_err(|e| format!("Query: {e}"))?;
        let rows = stmt
            .query_map([], row_to_file)
            .map_err(|e| format!("Query: {e}"))?;

        let mut files = Vec::new();
        for row in rows {
            files.push(row.map_err(|e| format!("Row: {e}"))?);
        }
        Ok(files)
    }

    pub fn update_file_analysis(
        &self,
        id: &str,
        category: Option<&str>,
        importance_score: Option<f64>,
        ai_analysis: Option<&str>,
    ) -> Result<(), String> {
        let conn = self.conn.lock().map_err(lock_err)?;
        conn.execute(
            "UPDATE files SET category = ?2, \
             importance_score = ?3, ai_analysis = ?4 \
             WHERE id = ?1",
            params![id, category, importance_score, ai_analysis],
        )
        .map_err(|e| format!("Update: {e}"))?;
        Ok(())
    }

    pub fn create_scan(&self, started_at: i64) -> Result<i64, String> {
        let conn = self.conn.lock().map_err(lock_err)?;
        conn.execute(
            "INSERT INTO scans (started_at) VALUES (?1)",
            params![started_at],
        )
        .map_err(|e| format!("Insert scan: {e}"))?;
        Ok(conn.last_insert_rowid())
    }

    pub fn complete_scan(
        &self,
        id: i64,
        completed_at: i64,
        files_found: i64,
        total_size: i64,
    ) -> Result<(), String> {
        let conn = self.conn.lock().map_err(lock_err)?;
        conn.execute(
            "UPDATE scans SET completed_at = ?2, \
             files_found = ?3, total_size = ?4, \
             status = 'completed' WHERE id = ?1",
            params![id, completed_at, files_found, total_size],
        )
        .map_err(|e| format!("Update scan: {e}"))?;
        Ok(())
    }

    pub fn create_cleanup(&self, started_at: i64) -> Result<i64, String> {
        let conn = self.conn.lock().map_err(lock_err)?;
        conn.execute(
            "INSERT INTO cleanups (started_at) VALUES (?1)",
            params![started_at],
        )
        .map_err(|e| format!("Insert cleanup: {e}"))?;
        Ok(conn.last_insert_rowid())
    }

    pub fn complete_cleanup(
        &self,
        id: i64,
        completed_at: i64,
        space_freed: i64,
        operations: &str,
    ) -> Result<(), String> {
        let conn = self.conn.lock().map_err(lock_err)?;
        conn.execute(
            "UPDATE cleanups SET completed_at = ?2, \
             space_freed = ?3, operations = ?4, \
             status = 'completed' WHERE id = ?1",
            params![id, completed_at, space_freed, operations],
        )
        .map_err(|e| format!("Update cleanup: {e}"))?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, String> {
        let conn = self.conn.lock().map_err(lock_err)?;
        let mut stmt = conn
            .prepare("SELECT value FROM settings WHERE key = ?1")
            .map_err(|e| format!("Query: {e}"))?;
        let result = stmt
            .query_row(params![key], |row| row.get(0))
            .optional()
            .map_err(|e| format!("Query: {e}"))?;
        Ok(result)
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(lock_err)?;
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) \
             VALUES (?1, ?2)",
            params![key, value],
        )
        .map_err(|e| format!("Insert setting: {e}"))?;
        Ok(())
    }
}
