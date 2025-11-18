use serde::{Deserialize, Serialize};

use crate::ai::{llm_client::LlmClient, openai_client::OpenAiClient};
use crate::db::embeddings::EmbeddingDb;
use crate::project::indexer;

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
pub async fn initialize_project_index(req: InitIndexRequest) -> tauri::Result<()> {
  let api_key = match std::env::var("OPENAI_API_KEY") {
    Ok(key) => key,
    Err(_) => {
      eprintln!("OPENAI_API_KEY is not set; skipping index initialization.");
      return Ok(());
    }
  };

  let client = OpenAiClient::new(
    api_key,
    "gpt-4.1-mini".to_string(),
    "text-embedding-3-large".to_string(),
  );

  if let Err(err) = indexer::index_project(&req.project_root, &client).await {
    eprintln!("Error initializing project index: {err}");
  }

  Ok(())
}

#[tauri::command]
pub async fn rag_query(req: RagQueryRequest) -> tauri::Result<Vec<RagHit>> {
  let api_key = match std::env::var("OPENAI_API_KEY") {
    Ok(key) => key,
    Err(_) => {
      eprintln!("OPENAI_API_KEY is not set; RAG query will return no results.");
      return Ok(Vec::new());
    }
  };

  let client = OpenAiClient::new(
    api_key,
    "gpt-4.1-mini".to_string(),
    "text-embedding-3-large".to_string(),
  );

  let query_embedding = match client.embed(&[req.query.clone()]).await {
    Ok(mut vecs) => match vecs.pop() {
      Some(v) => v,
      None => return Ok(Vec::new()),
    },
    Err(err) => {
      eprintln!("Error generating query embedding: {err}");
      return Ok(Vec::new());
    }
  };

  let db = match EmbeddingDb::open_for_project(&req.project_root) {
    Ok(db) => db,
    Err(err) => {
      eprintln!("Error opening embeddings database: {err}");
      return Ok(Vec::new());
    }
  };

  let scored = match db.query_similar_chunks(&req.project_root, &query_embedding, 10) {
    Ok(results) => results,
    Err(err) => {
      eprintln!("Error querying embeddings: {err}");
      Vec::new()
    }
  };

  let hits = scored
    .into_iter()
    .map(|chunk| RagHit {
      file_path: chunk.relative_path,
      snippet: chunk.content,
      score: chunk.score,
    })
    .collect();

  Ok(hits)
}
