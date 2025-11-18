use serde::{Deserialize, Serialize};

use crate::ai::{context_builder::ContextBuilder, llm_client::LlmClient, openai_client::OpenAiClient};

#[derive(Deserialize)]
pub struct ChatRequest {
  pub prompt: String,
  pub project_root: Option<String>,
}

#[derive(Serialize)]
pub struct ChatResponse {
  pub content: String,
}

#[tauri::command]
pub async fn ai_chat_completion(req: ChatRequest) -> tauri::Result<ChatResponse> {
  let api_key = match std::env::var("OPENAI_API_KEY") {
    Ok(key) => key,
    Err(_) => {
      return Ok(ChatResponse {
        content:
          "OpenAI API key is not configured. Set OPENAI_API_KEY or wire secure key storage in Settings."
            .to_string(),
      });
    }
  };

  let client = OpenAiClient::new(
    api_key,
    "gpt-4.1-mini".to_string(),
    "text-embedding-3-large".to_string(),
  );

  let context_builder = ContextBuilder::new();
  let prompt = context_builder.build_prompt(&req.prompt);

  let content = match client.chat_completion(&prompt).await {
    Ok(c) => c,
    Err(err) => format!("AI error: {err}"),
  };

  Ok(ChatResponse { content })
}

#[derive(Deserialize)]
pub struct FileEditRequest {
  pub path: String,
  pub contents: String,
  pub instruction: String,
}

#[derive(Serialize)]
pub struct FileEditResponse {
  pub updated_contents: String,
}

#[tauri::command]
pub async fn ai_file_edit(req: FileEditRequest) -> tauri::Result<FileEditResponse> {
  // TODO: Generate real diffs and edits via LLM, using the same LlmClient abstraction.
  Ok(FileEditResponse {
    updated_contents: req.contents,
  })
}
