use crate::db::embeddings::ScoredChunk;

pub struct ContextBuilder {
    context_chunks: Vec<ScoredChunk>,
}

impl ContextBuilder {
  pub fn new() -> Self {
    Self {
        context_chunks: Vec::new(),
    }
  }

  pub fn with_context(mut self, chunks: Vec<ScoredChunk>) -> Self {
    self.context_chunks = chunks;
    self
  }

  pub fn build_prompt(&self, user_prompt: &str) -> String {
    let mut context_str = String::new();
    
    if !self.context_chunks.is_empty() {
        context_str.push_str("Use the following project context to answer the user's question. References to 'file' or 'chapter' usually refer to these snippets:\n\n");
        for chunk in &self.context_chunks {
            context_str.push_str(&format!("--- BEGIN FILE: {} ---\n", chunk.relative_path));
            context_str.push_str(&chunk.content);
            context_str.push_str(&format!("\n--- END FILE: {} ---\n\n", chunk.relative_path));
        }
        context_str.push_str("---\n\n");
    }

    format!("{}{}", context_str, user_prompt)
  }
}
