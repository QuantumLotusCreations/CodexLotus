use async_trait::async_trait;

#[derive(Clone, Debug)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[async_trait]
pub trait LlmClient {
  async fn embed(&self, _texts: &[String]) -> anyhow::Result<Vec<Vec<f32>>> {
    anyhow::bail!("embed not implemented");
  }

  /// Single-turn chat completion (backwards compatible)
  async fn chat_completion(&self, _prompt: &str) -> anyhow::Result<String> {
    anyhow::bail!("chat_completion not implemented");
  }

  /// Multi-turn chat completion with conversation history
  async fn chat_completion_with_history(&self, messages: &[Message]) -> anyhow::Result<String> {
    // Default implementation: just use the last user message
    if let Some(last) = messages.iter().rev().find(|m| m.role == "user") {
      self.chat_completion(&last.content).await
    } else {
      anyhow::bail!("No user message found in conversation")
    }
  }
}
