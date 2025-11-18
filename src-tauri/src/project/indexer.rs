use std::fs;
use std::path::{Path, PathBuf};

use walkdir::WalkDir;

use crate::ai::llm_client::LlmClient;
use crate::ai::openai_client::OpenAiClient;
use crate::db::embeddings::{EmbeddingDb, FileChunkInput};
use crate::util::error::Result;

fn is_markdown(path: &Path) -> bool {
  if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
    matches!(ext.to_lowercase().as_str(), "md" | "markdown" | "mdx")
  } else {
    false
  }
}

/// Index all markdown files in a project directory.
///
/// For now, each file becomes a single chunk. Later this can be extended to
/// paragraph- or section-level chunking.
pub async fn index_project(project_root: &str, client: &OpenAiClient) -> Result<()> {
  let root = PathBuf::from(project_root);
  let mut files: Vec<(String, String)> = Vec::new();

  if root.is_dir() {
    for entry in WalkDir::new(&root).into_iter().filter_map(|e| e.ok()) {
      let path = entry.path();
      if path.is_file() && is_markdown(path) {
        let rel = path
          .strip_prefix(&root)
          .unwrap_or(path)
          .to_string_lossy()
          .to_string();
        let contents = fs::read_to_string(path)?;
        files.push((rel, contents));
      }
    }
  }

  if files.is_empty() {
    return Ok(());
  }

  let texts: Vec<String> = files.iter().map(|(_, contents)| contents.clone()).collect();
  let embeddings = client.embed(&texts).await?;

  let inputs: Vec<FileChunkInput> = files
    .into_iter()
    .zip(embeddings.into_iter())
    .map(|((relative_path, content), embedding)| FileChunkInput {
      relative_path,
      content,
      embedding,
    })
    .collect();

  let mut db = EmbeddingDb::open_for_project(project_root)?;
  db.replace_project_embeddings(project_root, &inputs)?;

  Ok(())
}
