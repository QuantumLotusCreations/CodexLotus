use rusqlite::Connection;

use crate::util::error::Result;

/// Run database migrations for the local embeddings store.
///
/// This uses plain SQLite tables for now; sqlite-vss can be wired in later
/// by adding a virtual table and updating queries in `db::embeddings`.
pub fn run_migrations(conn: &mut Connection) -> Result<()> {
  conn.execute_batch(
    r#"
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_root TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      UNIQUE(project_root, relative_path)
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      UNIQUE(file_id, chunk_index)
    );

    CREATE TABLE IF NOT EXISTS embeddings (
      chunk_id INTEGER PRIMARY KEY REFERENCES chunks(id) ON DELETE CASCADE,
      vector_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chunks_file_id ON chunks(file_id);
    "#,
  )?;

  Ok(())
}
