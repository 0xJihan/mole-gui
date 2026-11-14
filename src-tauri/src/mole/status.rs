use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::process::Command;
use tauri::{AppHandle, Emitter};

use crate::mole::discovery::MoleDiscovery;
use crate::mole::errors::MoleError;
use crate::mole::types::MoleStatusSnapshot;

#[derive(Clone)]
pub struct StatusPoller {
    app: AppHandle,
    is_running: Arc<AtomicBool>,
    is_polling_active: Arc<AtomicBool>,
    interval_ms: Arc<AtomicU64>,
    last_snapshot: Arc<Mutex<Option<MoleStatusSnapshot>>>,
    custom_path: Arc<Mutex<Option<String>>>,
}

impl StatusPoller {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app,
            is_running: Arc::new(AtomicBool::new(false)),
            is_polling_active: Arc::new(AtomicBool::new(false)),
            interval_ms: Arc::new(AtomicU64::new(1000)),
            last_snapshot: Arc::new(Mutex::new(None)),
            custom_path: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn set_custom_path(&self, path: Option<String>) {
        let mut guard = self.custom_path.lock().await;
        *guard = path;
    }

    pub fn set_interval(&self, ms: u64) {
        let safe_ms = ms.max(250); // min 250ms
        self.interval_ms.store(safe_ms, Ordering::Relaxed);
    }

    pub async fn get_last_snapshot(&self) -> Option<MoleStatusSnapshot> {
        let guard = self.last_snapshot.lock().await;
        guard.clone()
    }

    pub async fn poll_once(&self) -> Result<MoleStatusSnapshot, MoleError> {
        let custom_path = {
            let guard = self.custom_path.lock().await;
            guard.clone()
        };

        let detection = MoleDiscovery::detect(custom_path.as_deref());
        let bin_path = detection.binary_path.ok_or_else(|| MoleError::MoleNotFound {
            candidates: detection.candidate_paths,
        })?;

        let output = Command::new(&bin_path)
            .arg("status")
            .arg("--json")
            .output()
            .await
            .map_err(|e| MoleError::ProcessFailed {
                command: format!("{} status --json", bin_path),
                code: None,
                stderr: e.to_string(),
            })?;

        if !output.status.success() {
            let stderr_str = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(MoleError::ProcessFailed {
                command: format!("{} status --json", bin_path),
                code: output.status.code(),
                stderr: stderr_str,
            });
        }

        let stdout_str = String::from_utf8_lossy(&output.stdout);
        let snapshot: MoleStatusSnapshot = serde_json::from_str(&stdout_str).map_err(|e| {
            MoleError::JsonParseError {
                source: "mole status --json".to_string(),
                raw: format!("{}: {}", e, stdout_str),
            }
        })?;

        // Update cached snapshot
        {
            let mut guard = self.last_snapshot.lock().await;
            *guard = Some(snapshot.clone());
        }

        Ok(snapshot)
    }

    pub fn start(&self) {
        if self.is_running.swap(true, Ordering::SeqCst) {
            // Already running
            return;
        }

        let poller = self.clone();
        tokio::spawn(async move {
            while poller.is_running.load(Ordering::Relaxed) {
                let interval = poller.interval_ms.load(Ordering::Relaxed);

                // Overlap prevention: if another poll is currently running, skip this cycle
                if !poller.is_polling_active.swap(true, Ordering::SeqCst) {
                    let poller_clone = poller.clone();
                    tokio::spawn(async move {
                        match poller_clone.poll_once().await {
                            Ok(snapshot) => {
                                let _ = poller_clone.app.emit("mole://status", &snapshot);
                            }
                            Err(err) => {
                                let _ = poller_clone.app.emit("mole://status-error", err.to_string());
                            }
                        }
                        poller_clone.is_polling_active.store(false, Ordering::SeqCst);
                    });
                }

                tokio::time::sleep(Duration::from_millis(interval)).await;
            }
        });
    }

    pub fn stop(&self) {
        self.is_running.store(false, Ordering::SeqCst);
    }
}
