use async_trait::async_trait;

#[async_trait]
pub trait LlmClient {
  async fn embed(&self, _texts: &[String]) -> anyhow::Result<Vec<Vec<f32>>> {
    anyhow::bail!("embed not implemented");
  }

  async fn chat_completion(&self, _prompt: &str) -> anyhow::Result<String> {
    anyhow::bail!("chat_completion not implemented");
  }
}
