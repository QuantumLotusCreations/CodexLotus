use std::fs;
use std::path::PathBuf;

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

use crate::util::error::Result;

use super::migrations;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoredChunk {
  pub relative_path: String,
  pub content: String,
  pub score: f32,
}

#[derive(Debug)]
pub struct EmbeddingDb {
  conn: Connection,
}

#[derive(Debug, Clone)]
pub struct FileChunkInput {
  pub relative_path: String,
  pub content: String,
  pub embedding: Vec<f32>,
}

impl EmbeddingDb {
  pub fn open_for_project(project_root: &str) -> Result<Self> {
    let db_path = database_path_for_project(project_root);
    if let Some(parent) = db_path.parent() {
      fs::create_dir_all(parent)?;
    }

    let mut conn = Connection::open(db_path)?;
    migrations::run_migrations(&mut conn)?;

    Ok(Self { conn })
  }

  /// Replace all embeddings for a given project.
  ///
  /// For now, each file is represented as a single chunk (chunk_index = 0).
  pub fn replace_project_embeddings(
    &mut self,
    project_root: &str,
    inputs: &[FileChunkInput],
  ) -> Result<()> {
    let tx = self.conn.transaction()?;

    // Clear existing data for this project.
    tx.execute(
      "DELETE FROM embeddings WHERE chunk_id IN (SELECT c.id FROM chunks c JOIN files f ON c.file_id = f.id WHERE f.project_root = ?1)",
      params![project_root],
    )?;
    tx.execute(
      "DELETE FROM chunks WHERE file_id IN (SELECT id FROM files WHERE project_root = ?1)",
      params![project_root],
    )?;
    tx.execute("DELETE FROM files WHERE project_root = ?1", params![project_root])?;

    // Reset any existing VSS index if present. This is best-effort and will
    // be ignored if the sqlite-vss virtual table is not available.
    let _ = tx.execute("DELETE FROM vss_chunks", []);

    for (chunk_index, input) in inputs.iter().enumerate() {
      let file_id = insert_file(&tx, project_root, &input.relative_path)?;

      tx.execute(
        "INSERT INTO chunks (file_id, chunk_index, content) VALUES (?1, ?2, ?3)",
        params![file_id, chunk_index as i64, input.content],
      )?;
      let chunk_id = tx.last_insert_rowid();

      let vector_json = serde_json::to_string(&input.embedding)?;
      tx.execute(
        "INSERT INTO embeddings (chunk_id, vector_json) VALUES (?1, ?2)",
        params![chunk_id, vector_json],
      )?;

      // Best-effort: hydrate the VSS virtual table so that when sqlite-vss is
      // available we can issue fast similarity queries. The embedding is packed
      // into a BLOB of little-endian f32 values, which matches sqlite-vss's
      // expected layout.
      let blob = f32s_to_le_blob(&input.embedding);
      let _ = tx.execute(
        "INSERT OR REPLACE INTO vss_chunks(rowid, embedding) VALUES (?1, ?2)",
        params![chunk_id, blob],
      );
    }

    tx.commit()?;
    Ok(())
  }

  /// Naive cosine-similarity search over all embeddings for a project.
  ///
  /// This can later be swapped to sqlite-vss by creating a virtual table
  /// and issuing a VSS query instead of doing the scoring in Rust.
  pub fn query_similar_chunks(
    &self,
    project_root: &str,
    query_embedding: &[f32],
    limit: usize,
  ) -> Result<Vec<ScoredChunk>> {
    if query_embedding.is_empty() {
      return Ok(Vec::new());
    }

    let mut stmt = self.conn.prepare(
      "SELECT f.relative_path, c.content, e.vector_json\
       FROM files f\
       JOIN chunks c ON c.file_id = f.id\
       JOIN embeddings e ON e.chunk_id = c.id\
       WHERE f.project_root = ?1",
    )?;

    let rows = stmt.query_map(params![project_root], |row| {
      let relative_path: String = row.get(0)?;
      let content: String = row.get(1)?;
      let vector_json: String = row.get(2)?;
      Ok((relative_path, content, vector_json))
    })?;

    let mut scored: Vec<ScoredChunk> = Vec::new();

    for row in rows {
      let (relative_path, content, vector_json) = row?;
      let embedding: Vec<f32> = serde_json::from_str(&vector_json)?;
      if embedding.len() != query_embedding.len() || embedding.is_empty() {
        continue;
      }

      let score = cosine_similarity(query_embedding, &embedding);
      scored.push(ScoredChunk {
        relative_path,
        content,
        score,
      });
    }

    scored.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    scored.truncate(limit);

    Ok(scored)
  }
}

fn database_path_for_project(project_root: &str) -> PathBuf {
  let mut path = PathBuf::from(project_root);
  path.push(".codexlotus");
  path.push("index.db");
  path
}

fn insert_file(tx: &rusqlite::Transaction<'_>, project_root: &str, relative_path: &str) -> Result<i64> {
  tx.execute(
    "INSERT INTO files (project_root, relative_path) VALUES (?1, ?2)",
    params![project_root, relative_path],
  )?;
  Ok(tx.last_insert_rowid())
}

fn f32s_to_le_blob(vec: &[f32]) -> Vec<u8> {
  let mut bytes = Vec::with_capacity(vec.len() * 4);
  for f in vec {
    bytes.extend_from_slice(&f.to_le_bytes());
  }
  bytes
}

fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
  let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
  let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
  let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

  if norm_a == 0.0 || norm_b == 0.0 {
    0.0
  } else {
    dot / (norm_a * norm_b)
  }
}
