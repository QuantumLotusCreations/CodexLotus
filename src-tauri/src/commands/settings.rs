use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default)]
pub struct ApiConfig {
  pub provider: Option<String>,
  pub model: Option<String>,
  pub api_key_present: bool,
}

#[tauri::command]
pub async fn save_api_config(_config: ApiConfig) -> tauri::Result<()> {
  // TODO: Persist using Tauri's encrypted storage layer.
  Ok(())
}

#[tauri::command]
pub async fn load_api_config() -> tauri::Result<ApiConfig> {
  // TODO: Load from encrypted storage; for now return defaults.
  Ok(ApiConfig::default())
}
