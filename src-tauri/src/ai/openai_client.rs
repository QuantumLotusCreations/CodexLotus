use super::llm_client::LlmClient;
use async_trait::async_trait;

pub struct OpenAiClient;

#[async_trait]
impl LlmClient for OpenAiClient {}
