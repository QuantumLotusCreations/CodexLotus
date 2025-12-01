use std::fs;
use std::path::{Path, PathBuf};

use walkdir::WalkDir;

use crate::ai::llm_client::LlmClient;
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
pub async fn index_project(project_root: &str, client: &(dyn LlmClient + Send + Sync)) -> Result<()> {
  let root = PathBuf::from(project_root);
  let mut files: Vec<(String, String)> = Vec::new();

  println!("[Indexer] Starting index for: {}", project_root);
  println!("[Indexer] Root path exists: {}, is_dir: {}", root.exists(), root.is_dir());

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
        println!("[Indexer] Found file: {}", rel);
        files.push((rel, contents));
      }
    }
  }

  println!("[Indexer] Total files found: {}", files.len());

  if files.is_empty() {
    println!("[Indexer] No markdown files found, skipping embedding");
    return Ok(());
  }

  let texts: Vec<String> = files.iter().map(|(_, contents)| contents.clone()).collect();
  println!("[Indexer] Calling embed API for {} texts...", texts.len());
  let embeddings = client.embed(&texts).await?;
  println!("[Indexer] Got {} embeddings, first embedding length: {}", 
           embeddings.len(), 
           embeddings.first().map(|e| e.len()).unwrap_or(0));

  let inputs: Vec<FileChunkInput> = files
    .into_iter()
    .zip(embeddings.into_iter())
    .map(|((relative_path, content), embedding)| FileChunkInput {
      relative_path,
      content,
      embedding,
    })
    .collect();

  println!("[Indexer] Storing {} chunks in database...", inputs.len());
  let mut db = EmbeddingDb::open_for_project(project_root)?;
  db.replace_project_embeddings(project_root, &inputs)?;
  println!("[Indexer] Done!");

  Ok(())
}
