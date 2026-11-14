use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use crate::mole::discovery::MoleDiscovery;
use crate::mole::errors::MoleError;
use crate::mole::types::MoleInstallationInfo;
use tauri::{AppHandle, Emitter};

pub struct MoleInstaller;

impl MoleInstaller {
    pub async fn install(app: AppHandle) -> Result<MoleInstallationInfo, MoleError> {
        // Emit starting event
        let _ = app.emit("mole://install-log", "Starting official Mole installation...\n");

        // Prefer official installation script as supported by tw93/mole
        let mut child = Command::new("bash")
            .arg("-c")
            .arg("curl -fsSL https://raw.githubusercontent.com/tw93/mole/main/install.sh | bash")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| MoleError::ProcessFailed {
                command: "install.sh".to_string(),
                code: None,
                stderr: e.to_string(),
            })?;

        let stdout = child.stdout.take().ok_or_else(|| MoleError::IoError("Failed to open stdout".into()))?;
        let stderr = child.stderr.take().ok_or_else(|| MoleError::IoError("Failed to open stderr".into()))?;

        let app_out = app.clone();
        let app_err = app.clone();

        let out_task = tokio::spawn(async move {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = app_out.emit("mole://install-log", format!("{}\n", line));
            }
        });

        let err_task = tokio::spawn(async move {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = app_err.emit("mole://install-log", format!("{}\n", line));
            }
        });

        let _ = tokio::join!(out_task, err_task);
        let status = child.wait().await.map_err(|e| MoleError::IoError(e.to_string()))?;

        if !status.success() {
            let _ = app.emit("mole://install-log", format!("\nInstaller exited with status: {:?}\n", status.code()));
        } else {
            let _ = app.emit("mole://install-log", "\nInstaller finished successfully. Verifying binary...\n");
        }

        // Verify discovery
        let info = MoleDiscovery::detect(None);
        if info.is_installed {
            let _ = app.emit("mole://install-success", &info);
            Ok(info)
        } else {
            Err(MoleError::MoleNotFound {
                candidates: info.candidate_paths,
            })
        }
    }
}
