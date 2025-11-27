use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::api::path::app_data_dir;
use crate::util::error::Error;

#[derive(Serialize, Deserialize, Default, Clone)]
pub struct AppSettings {
  pub provider: String,
  pub chat_model: String,
  pub embedding_model: String,
  pub theme_accent: Option<String>,
}

#[derive(Serialize)]
pub struct ApiStatus {
  pub has_key: bool,
  pub settings: AppSettings,
}

#[derive(Deserialize)]
pub struct SaveKeyRequest {
  pub api_key: String,
}

fn get_settings_path(_handle: &tauri::AppHandle) -> Option<PathBuf> {
  let mut path = app_data_dir(&tauri::Config::default())?;
  path.push("com.codexlotus.dev");
  if !path.exists() {
    let _ = fs::create_dir_all(&path);
  }
  path.push("settings.json");
  Some(path)
}

#[tauri::command]
pub async fn save_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), Error> {
  if let Some(path) = get_settings_path(&app) {
    let json = serde_json::to_string_pretty(&settings).map_err(Error::from)?;
    fs::write(path, json).map_err(Error::from)?;
  }
  Ok(())
}

#[tauri::command]
pub async fn load_settings(app: tauri::AppHandle) -> Result<AppSettings, Error> {
  let defaults = AppSettings {
    provider: "openai".to_string(),
    chat_model: "gpt-4o-mini".to_string(),
    embedding_model: "text-embedding-3-small".to_string(),
    theme_accent: None,
  };

  if let Some(path) = get_settings_path(&app) {
    if path.exists() {
      let content = fs::read_to_string(path).map_err(Error::from)?;
      let settings: AppSettings = serde_json::from_str(&content).unwrap_or(defaults.clone());
      return Ok(settings);
    }
  }
  Ok(defaults)
}

#[tauri::command]
pub async fn save_api_key(key: String) -> Result<(), Error> {
  let entry = Entry::new("codexlotus", "openai_api_key").map_err(|e| Error::Anyhow(anyhow::Error::msg(e.to_string())))?;
  entry.set_password(&key).map_err(|e| Error::Anyhow(anyhow::Error::msg(e.to_string())))?;
  Ok(())
}

#[tauri::command]
pub async fn check_api_key() -> Result<bool, Error> {
  let entry = Entry::new("codexlotus", "openai_api_key").map_err(|e| Error::Anyhow(anyhow::Error::msg(e.to_string())))?;
  match entry.get_password() {
    Ok(_) => Ok(true),
    Err(_) => Ok(false),
  }
}

pub fn get_api_key_sync() -> anyhow::Result<String> {
  let entry = Entry::new("codexlotus", "openai_api_key")?;
  Ok(entry.get_password()?)
}
