use serde::{Deserialize, Serialize};

use crate::ai::{
    gemini_client::GeminiClient, llm_client::LlmClient,
    openai_client::OpenAiClient,
};
use crate::commands::settings::{get_api_key_sync, AppSettings};
use crate::db::embeddings::EmbeddingDb;
use crate::project::indexer;
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

async fn get_client(
    app: &tauri::AppHandle,
) -> Result<Box<dyn LlmClient + Send + Sync>, Error> {
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

    let settings = crate::commands::settings::load_settings(app.clone())
        .await
        .unwrap_or_else(|_| AppSettings {
            provider: "openai".to_string(),
            chat_model: "gpt-4o-mini".to_string(),
            embedding_model: "text-embedding-3-small".to_string(),
            theme_accent: None,
        });

    if settings.provider == "gemini" {
        Ok(Box::new(GeminiClient::new(api_key, settings.chat_model)))
    } else {
        Ok(Box::new(OpenAiClient::new(
            api_key,
            settings.chat_model,
            settings.embedding_model,
        )))
    }
}

#[tauri::command]
pub async fn initialize_project_index(
    app: tauri::AppHandle,
    req: InitIndexRequest,
) -> Result<(), Error> {
    let client = get_client(&app).await?;

    if let Err(err) = indexer::index_project(&req.project_root, client.as_ref()).await {
        return Err(Error::Anyhow(anyhow::Error::msg(format!(
            "Error initializing project index: {}",
            err
        ))));
    }

    Ok(())
}

#[tauri::command]
pub async fn rag_query(
    app: tauri::AppHandle,
    req: RagQueryRequest,
) -> Result<Vec<RagHit>, Error> {
    // We might fail to get a client if no key, but for queries we often want to fail silently or return empty
    let client = match get_client(&app).await {
        Ok(c) => c,
        Err(_) => return Ok(Vec::new()),
    };

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
        Err(_) => {
            return Ok(IndexStats {
                chunk_count: 0,
                is_indexed: false,
            })
        }
    };

    match db.get_chunk_count(&project_root) {
        Ok(count) => Ok(IndexStats {
            chunk_count: count,
            is_indexed: count > 0,
        }),
        Err(_) => Ok(IndexStats {
            chunk_count: 0,
            is_indexed: false,
        }),
    }
}
