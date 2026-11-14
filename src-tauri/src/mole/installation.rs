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
        let _ = app.emit("mole://install-log", "Preparing Mole installation...\n");

        let home = dirs::home_dir().ok_or_else(|| MoleError::IoError("Could not determine user home directory".into()))?;
        let target_dir = home.join(".local/bin");
        let target_dir_str = target_dir.to_string_lossy().to_string();

        // Ensure ~/.local/bin exists and is owned by the current user
        if let Err(e) = tokio::fs::create_dir_all(&target_dir).await {
            let _ = app.emit("mole://install-log", format!("Warning: Could not create {}: {}\n", target_dir_str, e));
        }

        let _ = app.emit("mole://install-log", format!("Target prefix: {}\n", target_dir_str));
        let _ = app.emit("mole://install-log", "Downloading and installing official Mole CLI (zero root access required)...\n\n");

        // We run curl | bash passing `--prefix "$HOME/.local/bin"`.
        // This installs to a user-owned directory and completely prevents any
        // repeated Touch ID / sudo infinite authorization loops.
        let install_script = format!(
            "curl -fsSL https://raw.githubusercontent.com/tw93/mole/main/install.sh | bash -s -- --prefix \"{}\"",
            target_dir_str
        );

        let mut cmd = Command::new("bash");
        cmd.arg("-c").arg(&install_script);
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        // Ensure PATH includes the target dir and Homebrew
        let mut path_env = format!("{}:/opt/homebrew/bin:/usr/local/bin", target_dir_str);
        if let Ok(curr_path) = std::env::var("PATH") {
            path_env = format!("{}:{}", path_env, curr_path);
        }
        cmd.env("PATH", path_env);

        let mut child = cmd.spawn().map_err(|e| MoleError::ProcessFailed {
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
