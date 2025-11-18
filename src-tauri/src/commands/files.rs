use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
pub struct FileEntry {
  pub path: String,
}

fn is_markdown(path: &Path) -> bool {
  if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
    matches!(ext.to_lowercase().as_str(), "md" | "markdown" | "mdx")
  } else {
    false
  }
}

#[tauri::command]
pub fn list_markdown_files(project_root: String) -> tauri::Result<Vec<FileEntry>> {
  let root = PathBuf::from(project_root);
  let mut entries = Vec::new();
  if root.is_dir() {
    for entry in walkdir::WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
      let path = entry.path();
      if path.is_file() && is_markdown(path) {
        if let Ok(rel) = path.strip_prefix(entry.path().ancestors().last().unwrap()) {
          entries.push(FileEntry {
            path: rel.to_string_lossy().to_string(),
          });
        }
      }
    }
  }
  Ok(entries)
}

#[tauri::command]
pub fn read_file(path: String) -> tauri::Result<String> {
  let contents = fs::read_to_string(path)?;
  Ok(contents)
}

#[tauri::command]
pub fn write_file(path: String, contents: String) -> tauri::Result<()> {
  fs::write(path, contents)?;
  Ok(())
}
