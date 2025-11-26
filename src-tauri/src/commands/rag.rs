use serde::{Deserialize, Serialize};

use crate::ai::{context_builder::ContextBuilder, llm_client::LlmClient, openai_client::OpenAiClient};
use crate::db::embeddings::EmbeddingDb;
use crate::project::indexer;
use crate::commands::settings::get_api_key_sync;
use crate::util::error::Error;

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

#[derive(Serialize)]
pub struct IndexStats {
  pub chunk_count: usize,
  pub is_indexed: bool,
}

#[tauri::command]
pub async fn initialize_project_index(req: InitIndexRequest) -> Result<(), Error> {
  let api_key = match get_api_key_sync() {
    Ok(key) => key,
    Err(_) => match std::env::var("OPENAI_API_KEY") {
      Ok(key) => key,
      Err(_) => {
        return Err(Error::Anyhow(anyhow::Error::msg(
          "API key not found. Please configure it in Settings.",
        )));
      }
    },
  };

  let client = OpenAiClient::new(
    api_key,
    "gpt-4o-mini".to_string(),
    "text-embedding-3-small".to_string(),
  );

  if let Err(err) = indexer::index_project(&req.project_root, &client).await {
    return Err(Error::Anyhow(anyhow::Error::msg(format!(
      "Error initializing project index: {}",
      err
    ))));
  }

  Ok(())
}

#[tauri::command]
pub async fn rag_query(req: RagQueryRequest) -> Result<Vec<RagHit>, Error> {
  let api_key = match get_api_key_sync() {
    Ok(key) => key,
    Err(_) => match std::env::var("OPENAI_API_KEY") {
      Ok(key) => key,
      Err(_) => return Ok(Vec::new()), // Fail silently for queries if no key
    },
  };

  let client = OpenAiClient::new(
    api_key,
    "gpt-4o-mini".to_string(),
    "text-embedding-3-small".to_string(),
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

#[tauri::command]
pub async fn get_index_stats(project_root: String) -> Result<IndexStats, Error> {
    let db = match EmbeddingDb::open_for_project(&project_root) {
        Ok(db) => db,
        Err(_) => return Ok(IndexStats { chunk_count: 0, is_indexed: false }),
    };
    
    match db.get_chunk_count(&project_root) {
        Ok(count) => Ok(IndexStats {
            chunk_count: count,
            is_indexed: count > 0,
        }),
        Err(_) => Ok(IndexStats { chunk_count: 0, is_indexed: false }),
    }
}
