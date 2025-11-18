pub struct ContextBuilder;

impl ContextBuilder {
  pub fn new() -> Self {
    Self
  }

  pub fn build_prompt(&self, user_prompt: &str) -> String {
    // TODO: Incorporate current file, selected files, and RAG hits.
    user_prompt.to_string()
  }
}
