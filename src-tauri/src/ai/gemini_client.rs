use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::llm_client::LlmClient;

pub struct GeminiClient {
  http: Client,
  api_key: String,
  model: String,
}

impl GeminiClient {
  pub fn new(api_key: String, model: String) -> Self {
    Self {
      http: Client::new(),
      api_key,
      model,
    }
  }
}

#[derive(Serialize)]
struct GeminiContentPart {
    text: String,
}

#[derive(Serialize)]
struct GeminiContent {
    role: String,
    parts: Vec<GeminiContentPart>,
}

#[derive(Serialize)]
struct GeminiGenerateRequest {
    contents: Vec<GeminiContent>,
}

#[derive(Deserialize)]
struct GeminiPartResponse {
    text: Option<String>,
}

#[derive(Deserialize)]
struct GeminiContentResponse {
    parts: Option<Vec<GeminiPartResponse>>,
}

#[derive(Deserialize)]
struct GeminiCandidate {
    content: Option<GeminiContentResponse>,
}

#[derive(Deserialize)]
struct GeminiGenerateResponse {
    candidates: Option<Vec<GeminiCandidate>>,
}

#[async_trait]
impl LlmClient for GeminiClient {
  async fn embed(&self, _texts: &[String]) -> anyhow::Result<Vec<Vec<f32>>> {
    // Gemini embedding API support is slightly different; for now we can rely on OpenAI for embeddings
    // or implement Gemini's embedding-001 model if strictly needed.
    // Given the user request was for Gemini *Models* (likely for generation), we will focus on chat first.
    // For the RAG pipeline to work, we either need to swap the embedding provider globally or keep using OpenAI for embeddings.
    // Let's keep embeddings not implemented for now to avoid breaking the existing flow if mixed usage is intended.
    anyhow::bail!("Gemini embeddings not yet implemented");
  }

  async fn chat_completion(&self, prompt: &str) -> anyhow::Result<String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        self.model, self.api_key
    );

    let body = GeminiGenerateRequest {
        contents: vec![GeminiContent {
            role: "user".to_string(),
            parts: vec![GeminiContentPart {
                text: prompt.to_string(),
            }],
        }],
    };

    let resp: GeminiGenerateResponse = self
      .http
      .post(&url)
      .json(&body)
      .send()
      .await?
      .error_for_status()?
      .json()
      .await?;

    let content = resp
        .candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .and_then(|c| c.parts)
        .and_then(|parts| parts.into_iter().next())
        .and_then(|p| p.text)
        .unwrap_or_default();

    Ok(content)
  }
}

