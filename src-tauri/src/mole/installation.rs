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
        let _ = app.emit("mole://install-log", "==> Preparing official Mole CLI installation...\n");
        let _ = app.emit("mole://install-log", "==> Requesting administrator privileges (Touch ID or password)...\n");

        // Script to run the original official Mole installation with Touch ID / administrator credentials.
        // The script:
        // 1. Authorizes sudo upfront once via `sudo -v` (which triggers the native macOS Touch ID prompt if pam_tid is active).
        //    Falls back to a native AppleScript dialog if Touch ID is not configured.
        // 2. Starts a background keepalive (`while true; do sudo -n -v; sleep 5; done`) so credentials do not lapse.
        // 3. EXPORTS `MOLE_ASSUME_SUDO_AUTH=1`:
        //    This tells tw93/mole's install.sh that sudo has already been authorized.
        //    Crucially, install.sh then runs `sudo -n` for all internal operations (lock check, directory creation, file copying),
        //    preventing pam_tid.so from prompting for Touch ID 20+ times in a row!
        // 4. Invokes the official upstream installer: `curl ... | bash`
        let install_script = r#"
set -euo pipefail

# Step 1: Authenticate administrator privileges once
if ! sudo -n true 2>/dev/null; then
    # Try sudo -v (triggers native macOS Touch ID dialog if pam_tid is active)
    if ! sudo -v 2>/dev/null; then
        # Fallback to graphical AppleScript password dialog if Touch ID is cancelled or not available
        PASS=$(osascript -e 'display dialog "Mole GUI requires administrator privileges to install to the system." default answer "" with title "Mole GUI" with icon caution with hidden answer' -e 'text returned of result' 2>/dev/null || true)
        if [ -z "$PASS" ]; then
            echo "Error: Administrator authorization was cancelled." >&2
            exit 1
        fi
        if ! printf '%s\n' "$PASS" | sudo -S -p "" -v 2>/dev/null; then
            echo "Error: Incorrect administrator password." >&2
            exit 1
        fi
        unset PASS
    fi
fi

echo "==> Administrator access authorized."

# Step 2: Background keepalive loop to keep sudo ticket fresh during download
(
    while true; do
        sudo -n -v 2>/dev/null || exit 0
        sleep 5
    done
) &
KEEPALIVE_PID=$!
trap 'kill "$KEEPALIVE_PID" 2>/dev/null || true' EXIT INT TERM

# Step 3: Export MOLE_ASSUME_SUDO_AUTH=1 to eliminate repeated Touch ID prompts
export MOLE_ASSUME_SUDO_AUTH=1

# Step 4: Run official Mole installer
echo "==> Fetching and running official Mole CLI installer..."
curl -fsSL https://raw.githubusercontent.com/tw93/mole/main/install.sh | bash
"#;

        let mut cmd = Command::new("bash");
        cmd.arg("-c").arg(install_script);
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        // Ensure PATH has standard macOS system and Homebrew binaries
        let current_path = std::env::var("PATH").unwrap_or_default();
        let standard_paths = "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin";
        let merged_path = if current_path.is_empty() {
            standard_paths.to_string()
        } else {
            format!("{}:{}", standard_paths, current_path)
        };
        cmd.env("PATH", merged_path);

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
