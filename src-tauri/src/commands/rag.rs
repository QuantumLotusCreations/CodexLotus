use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct InitIndexRequest {
  pub project_root: String,
}

#[derive(Deserialize)]
pub struct RagQueryRequest {
  pub query: String,
  pub project_root: String,
}

#[derive(Serialize)]
pub struct RagHit {
  pub file_path: String,
  pub snippet: String,
  pub score: f32,
}

#[tauri::command]
pub async fn initialize_project_index(_req: InitIndexRequest) -> tauri::Result<()> {
  // TODO: Walk markdown files, embed chunks, and persist to SQLite + sqlite-vss.
  Ok(())
}

#[tauri::command]
pub async fn rag_query(_req: RagQueryRequest) -> tauri::Result<Vec<RagHit>> {
  // TODO: Query sqlite-vss for nearest neighbors.
  Ok(Vec::new())
}
