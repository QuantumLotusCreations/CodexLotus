#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod ai;
mod project;
mod util;

use commands::{files, settings, ai as ai_cmd, rag};

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      files::list_markdown_files,
      files::read_file,
      files::write_file,
      settings::save_api_config,
      settings::load_api_config,
      ai_cmd::ai_chat_completion,
      ai_cmd::ai_file_edit,
      rag::initialize_project_index,
      rag::rag_query
    ])
    .run(tauri::generate_context!())
    .expect("error while running CodexLotus app");
}
