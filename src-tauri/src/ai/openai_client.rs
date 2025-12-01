use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::llm_client::{LlmClient, Message};

pub struct OpenAiClient {
  http: Client,
  api_key: String,
  chat_model: String,
  embedding_model: String,
}

impl OpenAiClient {
  pub fn new(api_key: String, chat_model: String, embedding_model: String) -> Self {
    Self {
      http: Client::new(),
      api_key,
      chat_model,
      embedding_model,
    }
  }
}

#[derive(Serialize)]
struct EmbeddingsRequest {
  model: String,
  input: Vec<String>,
}

#[derive(Deserialize)]
struct EmbeddingData {
  embedding: Vec<f32>,
}

#[derive(Deserialize)]
struct EmbeddingsResponse {
  data: Vec<EmbeddingData>,
}

#[derive(Serialize)]
struct ChatMessage {
  role: String,
  content: String,
}

#[derive(Serialize)]
struct ChatCompletionRequest {
  model: String,
  messages: Vec<ChatMessage>,
}

#[derive(Deserialize)]
struct ChatCompletionChoiceMessage {
  content: String,
}

#[derive(Deserialize)]
struct ChatCompletionChoice {
  message: ChatCompletionChoiceMessage,
}

#[derive(Deserialize)]
struct ChatCompletionResponse {
  choices: Vec<ChatCompletionChoice>,
}

#[async_trait]
impl LlmClient for OpenAiClient {
  async fn embed(&self, texts: &[String]) -> anyhow::Result<Vec<Vec<f32>>> {
    if texts.is_empty() {
      return Ok(Vec::new());
    }

    let body = EmbeddingsRequest {
      model: self.embedding_model.clone(),
      input: texts.to_vec(),
    };

    let resp: EmbeddingsResponse = self
      .http
      .post("https://api.openai.com/v1/embeddings")
      .bearer_auth(&self.api_key)
      .json(&body)
      .send()
      .await?
      .error_for_status()?
      .json()
      .await?;

    Ok(resp.data.into_iter().map(|d| d.embedding).collect())
  }

  async fn chat_completion(&self, prompt: &str) -> anyhow::Result<String> {
    let body = ChatCompletionRequest {
      model: self.chat_model.clone(),
      messages: vec![ChatMessage {
        role: "user".to_string(),
        content: prompt.to_string(),
      }],
    };

    let resp: ChatCompletionResponse = self
      .http
      .post("https://api.openai.com/v1/chat/completions")
      .bearer_auth(&self.api_key)
      .json(&body)
      .send()
      .await?
      .error_for_status()?
      .json()
      .await?;

    let content = resp
      .choices
      .into_iter()
      .next()
      .map(|c| c.message.content)
      .unwrap_or_default();

    Ok(content)
  }

  async fn chat_completion_with_history(&self, messages: &[Message]) -> anyhow::Result<String> {
    let chat_messages: Vec<ChatMessage> = messages
      .iter()
      .map(|m| ChatMessage {
        role: m.role.clone(),
        content: m.content.clone(),
      })
      .collect();

    let body = ChatCompletionRequest {
      model: self.chat_model.clone(),
      messages: chat_messages,
    };

    let resp: ChatCompletionResponse = self
      .http
      .post("https://api.openai.com/v1/chat/completions")
      .bearer_auth(&self.api_key)
      .json(&body)
      .send()
      .await?
      .error_for_status()?
      .json()
      .await?;

    let content = resp
      .choices
      .into_iter()
      .next()
      .map(|c| c.message.content)
      .unwrap_or_default();

    Ok(content)
  }
}
