use serde::{Deserialize, Serialize};

use crate::ai::{
    context_builder::ContextBuilder, gemini_client::GeminiClient, llm_client::LlmClient,
    openai_client::OpenAiClient,
};
use crate::commands::settings::{get_api_key_sync, AppSettings};
use crate::db::embeddings::{EmbeddingDb, ScoredChunk};
use crate::util::error::Error;

/// Extract a mentioned file name from the user prompt.
/// Looks for patterns like `filename.md`, backtick-quoted files, or common phrasing.
fn extract_mentioned_file(prompt: &str) -> Option<String> {
    // Pattern 1: Backtick-quoted file names like `README.md`
    if let Some(start) = prompt.find('`') {
        if let Some(end) = prompt[start + 1..].find('`') {
            let potential = &prompt[start + 1..start + 1 + end];
            if looks_like_filename(potential) {
                return Some(potential.to_string());
            }
        }
    }

    // Pattern 2: Look for common file extensions mentioned directly
    let extensions = [".md", ".markdown", ".txt", ".yaml", ".yml", ".json"];
    for word in prompt.split_whitespace() {
        let clean = word.trim_matches(|c: char| !c.is_alphanumeric() && c != '.' && c != '_' && c != '-' && c != '/');
        for ext in &extensions {
            if clean.to_lowercase().ends_with(ext) && clean.len() > ext.len() {
                return Some(clean.to_string());
            }
        }
    }

    None
}

fn looks_like_filename(s: &str) -> bool {
    let s_lower = s.to_lowercase();
    let extensions = [".md", ".markdown", ".txt", ".yaml", ".yml", ".json", ".toml"];
    extensions.iter().any(|ext| s_lower.ends_with(ext)) && s.len() > 3 && !s.contains(' ')
}

#[derive(Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Deserialize)]
pub struct ChatRequest {
    pub prompt: String,
    pub project_root: Option<String>,
    /// Full conversation history for multi-turn chat
    pub conversation: Option<Vec<ChatMessage>>,
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

    // 1. Embed User Query and search for relevant context
    let mut context_chunks = Vec::new();

    if let Some(root) = &req.project_root {
        // Try to get embeddings and search - works for both OpenAI and Gemini
        if let Ok(query_vecs) = client.embed(&[req.prompt.clone()]).await {
            if let Some(query_vec) = query_vecs.first() {
                // Search DB for similar chunks
                if let Ok(db) = EmbeddingDb::open_for_project(root) {
                    if let Ok(hits) = db.query_similar_chunks(root, query_vec, 5) {
                        context_chunks = hits;
                    }
                }
            }
        }

        // Additionally, detect if user mentions a specific file and load it directly
        let mentioned_file = extract_mentioned_file(&req.prompt);
        if let Some(file_name) = mentioned_file {
            let file_path = std::path::Path::new(root).join(&file_name);
            if file_path.exists() {
                if let Ok(content) = std::fs::read_to_string(&file_path) {
                    // Check if this file is already in context_chunks
                    let already_included = context_chunks.iter().any(|c| {
                        c.relative_path.to_lowercase() == file_name.to_lowercase()
                    });
                    if !already_included {
                        context_chunks.insert(0, ScoredChunk {
                            relative_path: file_name,
                            content,
                            score: 1.0, // Exact match gets highest score
                        });
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
    
    let system_context = context_builder.build_system_context();
    let _user_prompt_with_context = context_builder.build_prompt(&req.prompt);

    // 5. Build messages array with conversation history
    let mut messages: Vec<crate::ai::llm_client::Message> = Vec::new();
    
    // Add system context as first message if we have any
    if !system_context.is_empty() {
        messages.push(crate::ai::llm_client::Message {
            role: "user".to_string(),
            content: format!("[CONTEXT]\n{}\n[/CONTEXT]\n\nPlease use the above context to help answer my questions. Acknowledge this context briefly.", system_context),
        });
        messages.push(crate::ai::llm_client::Message {
            role: "assistant".to_string(),
            content: "I've reviewed the project context and files you provided. I'm ready to help you with questions about your project.".to_string(),
        });
    }

    // Add conversation history if provided
    if let Some(history) = &req.conversation {
        for msg in history {
            // Skip adding the last user message since we'll add it with context
            if msg.role != "system" {
                messages.push(crate::ai::llm_client::Message {
                    role: msg.role.clone(),
                    content: msg.content.clone(),
                });
            }
        }
    }
    
    // Add the current user message (already last in conversation, but ensure it's there)
    // Only if not already added via conversation history
    let already_has_current = req.conversation.as_ref()
        .map(|c| c.last().map(|m| m.content == req.prompt && m.role == "user").unwrap_or(false))
        .unwrap_or(false);
    
    if !already_has_current {
        messages.push(crate::ai::llm_client::Message {
            role: "user".to_string(),
            content: req.prompt.clone(),
        });
    }

    // 6. Send to LLM with full conversation
    let content = match client.chat_completion_with_history(&messages).await {
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
