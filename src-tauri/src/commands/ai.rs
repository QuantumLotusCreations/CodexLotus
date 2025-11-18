use serde::{Deserialize, Serialize};

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
  // TODO: Wire to AI orchestration (LLM provider + RAG context builder).
  Ok(ChatResponse {
    content: format!("AI response placeholder for prompt: {}", req.prompt),
  })
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
  // TODO: Generate real diffs and edits via LLM.
  Ok(FileEditResponse {
    updated_contents: req.contents,
  })
}
