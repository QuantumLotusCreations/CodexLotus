use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::llm_client::{LlmClient, Message};

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

// Embeddings
#[derive(Serialize)]
struct GeminiEmbedRequest {
    content: GeminiContent,
    model: String,
}

#[derive(Serialize)]
struct GeminiBatchEmbedRequest {
    requests: Vec<GeminiEmbedRequest>,
}

// Response structure: { "embeddings": [{ "values": [...] }, ...] }
#[derive(Deserialize)]
struct GeminiEmbedResponse {
    values: Vec<f32>,
}

#[derive(Deserialize)]
struct GeminiBatchEmbedResponse {
    embeddings: Option<Vec<GeminiEmbedResponse>>,
}


#[async_trait]
impl LlmClient for GeminiClient {
  async fn embed(&self, texts: &[String]) -> anyhow::Result<Vec<Vec<f32>>> {
    // Gemini uses a specific model for embeddings, usually "embedding-001" or "text-embedding-004"
    // We will use "text-embedding-004" as a safe default or "embedding-001".
    let embedding_model = "text-embedding-004";
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:batchEmbedContents?key={}",
        embedding_model, self.api_key
    );

    // Prepare batch request
    let requests: Vec<GeminiEmbedRequest> = texts.iter().map(|t| {
        GeminiEmbedRequest {
            model: format!("models/{}", embedding_model),
            content: GeminiContent {
                role: "user".to_string(),
                parts: vec![GeminiContentPart { text: t.clone() }]
            }
        }
    }).collect();

    let body = GeminiBatchEmbedRequest { requests };

    let response = self
      .http
      .post(&url)
      .json(&body)
      .send()
      .await?
      .error_for_status()?;
    
    // Debug: print raw response
    let response_text = response.text().await?;
    println!("[Gemini Embed] Raw response (first 500 chars): {}", &response_text[..response_text.len().min(500)]);
    
    let resp: GeminiBatchEmbedResponse = serde_json::from_str(&response_text)?;

    let mut results = Vec::new();
    if let Some(embeddings) = resp.embeddings {
        println!("[Gemini Embed] Got {} embedding responses", embeddings.len());
        for (i, e) in embeddings.iter().enumerate() {
            println!("[Gemini Embed] Embedding {} has {} values", i, e.values.len());
            results.push(e.values.clone());
        }
    } else {
        println!("[Gemini Embed] No embeddings field in response!");
    }

    Ok(results)
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

  async fn chat_completion_with_history(&self, messages: &[Message]) -> anyhow::Result<String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        self.model, self.api_key
    );

    // Convert messages to Gemini format
    // Note: Gemini uses "user" and "model" roles (not "assistant")
    let contents: Vec<GeminiContent> = messages
        .iter()
        .map(|m| {
            let role = if m.role == "assistant" { "model".to_string() } else { m.role.clone() };
            GeminiContent {
                role,
                parts: vec![GeminiContentPart {
                    text: m.content.clone(),
                }],
            }
        })
        .collect();

    let body = GeminiGenerateRequest { contents };

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
