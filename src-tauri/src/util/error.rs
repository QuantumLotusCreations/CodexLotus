use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  Anyhow(#[from] anyhow::Error),
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error(transparent)]
  Tauri(#[from] tauri::Error),
  #[error(transparent)]
  Sqlite(#[from] rusqlite::Error),
  #[error(transparent)]
  SerdeJson(#[from] serde_json::Error),
}

// Allow this error to be returned from Tauri commands
impl Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

pub type Result<T> = std::result::Result<T, Error>;
