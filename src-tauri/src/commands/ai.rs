use serde::{Deserialize, Serialize};

use crate::ai::{
    context_builder::ContextBuilder, gemini_client::GeminiClient, llm_client::LlmClient,
    openai_client::OpenAiClient,
};
use crate::commands::settings::{get_api_key_sync, AppSettings};
use crate::db::embeddings::EmbeddingDb;
use crate::util::error::Error;

#[derive(Deserialize)]
pub struct ChatRequest {
    pub prompt: String,
    pub project_root: Option<String>,
    // Optional: allow overriding model for this request
    pub provider: Option<String>,
    pub model: Option<String>,
}

#[derive(Serialize)]
pub struct ChatResponse {
    pub content: String,
}

async fn get_client(
    settings: &AppSettings,
    api_key: String,
) -> Box<dyn LlmClient + Send + Sync> {
    if settings.provider == "gemini" {
        Box::new(GeminiClient::new(api_key, settings.chat_model.clone()))
    } else {
        Box::new(OpenAiClient::new(
            api_key,
            settings.chat_model.clone(),
            settings.embedding_model.clone(),
        ))
    }
}

#[tauri::command]
pub async fn ai_chat_completion(
    app: tauri::AppHandle,
    req: ChatRequest,
) -> Result<ChatResponse, Error> {
    let api_key = match get_api_key_sync() {
        Ok(key) => key,
        Err(_) => match std::env::var("OPENAI_API_KEY") {
            Ok(key) => key,
            Err(_) => {
                return Ok(ChatResponse {
                    content: "API key is not configured. Please enter your API key in the Settings tab.".to_string(),
                });
            }
        },
    };

    let settings = crate::commands::settings::load_settings(app)
        .await
        .unwrap_or_else(|_| AppSettings {
            provider: "openai".to_string(),
            chat_model: "gpt-4o-mini".to_string(),
            embedding_model: "text-embedding-3-small".to_string(),
            theme_accent: None,
            app_bg_color: None,
            app_font_color: None,
            input_bg_color: None,
            input_font_color: None,
            foreground_panel_color: None,
            statblock_bg_color: None,
            statblock_font_color: None,
        });

    // For RAG embedding, we currently only support OpenAI's embedding model
    // because that's what our vector store is built for.
    // If the user is using Gemini, we might need to fallback or skip RAG for now unless we implement Gemini embeddings.
    // For MVP, let's assume if using Gemini, we skip RAG or use a hybrid approach if they have an OpenAI key too?
    // Let's keep it simple: The embedding client is ALWAYS OpenAI for now (hardcoded fallback) or we skip.
    // But wait, if they only have a Gemini key, they can't use OpenAI embeddings.
    // TODO: Implement Gemini Embeddings in gemini_client.rs to support RAG with Gemini.
    // For now, we'll try to use the client for embeddings if it supports it (OpenAI does).

    let client = get_client(&settings, api_key.clone()).await;

    // 1. Embed User Query (Only if supported)
    let mut context_chunks = Vec::new();

    if let Some(root) = &req.project_root {
        // HACK: If provider is Gemini, we skip embeddings for now as it's not implemented.
        if settings.provider == "openai" {
            if let Ok(query_vecs) = client.embed(&[req.prompt.clone()]).await {
                if let Some(query_vec) = query_vecs.first() {
                    // 2. Search DB
                    if let Ok(db) = EmbeddingDb::open_for_project(root) {
                        if let Ok(hits) = db.query_similar_chunks(root, query_vec, 5) {
                            context_chunks = hits;
                        }
                    }
                }
            }
        }
    }

    // 3. Load Templates (if project root exists)
    let mut templates = Vec::new();
    if let Some(root) = &req.project_root {
        let template_dir = std::path::Path::new(root).join(".codex").join("templates");
        if template_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(template_dir) {
                for entry in entries.flatten() {
                    if let Ok(content) = std::fs::read_to_string(entry.path()) {
                        templates.push(content);
                    }
                }
            }
        }
    }

    // 4. Build Prompt with Context
    let context_builder = ContextBuilder::new()
        .with_context(context_chunks)
        .with_templates(templates);
    
    let prompt = context_builder.build_prompt(&req.prompt);

    // 5. Send to LLM
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
pub async fn ai_file_edit(
    app: tauri::AppHandle,
    req: FileEditRequest,
) -> Result<FileEditResponse, Error> {
    let api_key = match get_api_key_sync() {
        Ok(key) => key,
        Err(_) => {
            return Err(Error::Anyhow(anyhow::Error::msg("API key not configured")));
        }
    };

    let settings = crate::commands::settings::load_settings(app)
        .await
        .unwrap_or_default();
    let client = get_client(&settings, api_key).await;

    let prompt = format!(
        "You are an expert editor.
User Instruction: {}

Here is the file content:
```markdown
{}
```

Return ONLY the full updated file content. Do not add markdown code fences around the output unless the file itself contains them. Do not add conversational text.",
        req.instruction, req.contents
    );

    let updated_contents = match client.chat_completion(&prompt).await {
        Ok(c) => {
            // Naive cleanup if the LLM wraps it in ```markdown ... ```
            c.trim()
                .trim_start_matches("```markdown")
                .trim_start_matches("```")
                .trim_end_matches("```")
                .to_string()
        }
        Err(err) => format!("Error generating edit: {}", err),
    };

    Ok(FileEditResponse { updated_contents })
}
