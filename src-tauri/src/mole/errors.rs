use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MoleError {
    MoleNotFound { candidates: Vec<String> },
    InvalidExecutable { path: String, reason: String },
    ProcessFailed { command: String, code: Option<i32>, stderr: String },
    JsonParseError { source: String, raw: String },
    IoError(String),
    OperationCancelled(String),
    PtyError(String),
    Unauthorized(String),
}

impl std::fmt::Display for MoleError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MoleError::MoleNotFound { candidates } => {
                write!(f, "Mole CLI was not found in candidate paths: {:?}", candidates)
            }
            MoleError::InvalidExecutable { path, reason } => {
                write!(f, "Invalid Mole executable at '{}': {}", path, reason)
            }
            MoleError::ProcessFailed { command, code, stderr } => {
                write!(f, "Command '{}' failed with code {:?}: {}", command, code, stderr)
            }
            MoleError::JsonParseError { source, raw } => {
                write!(f, "Failed to parse JSON from {}: {}", source, raw)
            }
            MoleError::IoError(msg) => write!(f, "IO Error: {}", msg),
            MoleError::OperationCancelled(id) => write!(f, "Operation '{}' was cancelled", id),
            MoleError::PtyError(msg) => write!(f, "PTY Error: {}", msg),
            MoleError::Unauthorized(msg) => write!(f, "Authorization Error: {}", msg),
        }
    }
}

impl std::error::Error for MoleError {}

impl From<std::io::Error> for MoleError {
    fn from(err: std::io::Error) -> Self {
        MoleError::IoError(err.to_string())
    }
}

impl From<serde_json::Error> for MoleError {
    fn from(err: serde_json::Error) -> Self {
        MoleError::JsonParseError {
            source: "serde_json".to_string(),
            raw: err.to_string(),
        }
    }
}
