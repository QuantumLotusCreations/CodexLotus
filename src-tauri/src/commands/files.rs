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
  let mut entries = Vec::new();
  let root_path = PathBuf::from(&project_root);

  if !root_path.is_dir() {
    eprintln!("list_markdown_files: project_root is not a directory: {:?}", project_root);
    return Ok(entries);
  }

  // Normalize the root path for string comparison.
  // We convert backslashes to forward slashes and trim trailing slashes.
  // This handles "C:\\Foo" vs "C:/Foo" vs "C:/Foo/" issues robustly.
  let root_normalized = project_root.replace('\\', "/");
  let root_prefix = root_normalized.trim_end_matches('/');

  // We iterate over the directory. We do NOT use canonicalize here to avoid
  // issues with UNC paths (\\?\) that might not match the simple path strings.
  // Instead, we rely on WalkDir returning paths relative to the root we gave it
  // (if we gave relative) or absolute if we gave absolute.
  // Since project_root from dialog is usually absolute, WalkDir yields absolute paths.
  for entry_result in walkdir::WalkDir::new(&root_path) {
    match entry_result {
      Ok(entry) => {
        let path = entry.path();
        if path.is_file() && is_markdown(path) {
            // Normalize the entry path the exact same way
            let path_string = path.to_string_lossy().replace('\\', "/");
            
            // Perform a case-insensitive prefix check.
            // This is safer on Windows where casing might differ between
            // user input and file system.
            if path_string.to_lowercase().starts_with(&root_prefix.to_lowercase()) {
                // Determine the relative part by slicing
                if path_string.len() > root_prefix.len() {
                    let relative_part = &path_string[root_prefix.len()..];
                    // Remove any leading slash from the relative part
                    let clean_relative = relative_part.trim_start_matches('/');
                    
                    entries.push(FileEntry {
                        path: clean_relative.to_string(),
                    });
                }
            } else {
                // Fallback: if the string matching fails (unlikely), try standard strip_prefix
                // This might happen if there are symlinks or unexpected path representations
                if let Ok(rel) = path.strip_prefix(&root_path) {
                    let rel_str = rel.to_string_lossy().replace('\\', "/");
                    entries.push(FileEntry { path: rel_str });
                }
            }
        }
      }
      Err(e) => {
        eprintln!("list_markdown_files: error walking entry: {}", e);
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
  if let Some(parent) = Path::new(&path).parent() {
    fs::create_dir_all(parent)?;
  }
  fs::write(path, contents)?;
  Ok(())
}

#[tauri::command]
pub fn create_directory(path: String) -> tauri::Result<()> {
  fs::create_dir_all(path)?;
  Ok(())
}

#[tauri::command]
pub fn copy_file(source: String, destination: String) -> tauri::Result<()> {
  if let Some(parent) = Path::new(&destination).parent() {
    fs::create_dir_all(parent)?;
  }
  fs::copy(source, destination)?;
  Ok(())
}
