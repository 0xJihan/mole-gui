use tokio::process::Command;

use crate::mole::errors::MoleError;
use crate::mole::process::ProcessManager;
use crate::mole::types::{MoleAnalyzeResult, MoleHistoryResponse, MoleInstalledApp};

pub struct CommandExecutor;

fn create_command(bin_path: &str) -> Command {
    let mut cmd = Command::new(bin_path);
    cmd.env("PATH", crate::mole::process::get_system_path());
    cmd
}

impl CommandExecutor {
    pub async fn list_installed_apps(bin_path: &str) -> Result<Vec<MoleInstalledApp>, MoleError> {
        let output = create_command(bin_path)
            .arg("uninstall")
            .arg("--list")
            .output()
            .await
            .map_err(|e| MoleError::ProcessFailed {
                command: format!("{} uninstall --list", bin_path),
                code: None,
                stderr: e.to_string(),
            })?;

        if !output.status.success() {
            let stderr_str = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(MoleError::ProcessFailed {
                command: format!("{} uninstall --list", bin_path),
                code: output.status.code(),
                stderr: stderr_str,
            });
        }

        let stdout_str = String::from_utf8_lossy(&output.stdout);
        // Find JSON array start in case there are leading/trailing characters
        let trimmed = stdout_str.trim();
        let json_start = trimmed.find('[').unwrap_or(0);
        let json_end = trimmed.rfind(']').map(|i| i + 1).unwrap_or(trimmed.len());
        let json_slice = &trimmed[json_start..json_end];

        let mut apps: Vec<MoleInstalledApp> = serde_json::from_str(json_slice).map_err(|e| {
            MoleError::JsonParseError {
                source: "mole uninstall --list".to_string(),
                raw: format!("{}: {}", e, stdout_str),
            }
        })?;

        // Enrich with native macOS app icons
        for app in &mut apps {
            if !app.path.is_empty() {
                app.icon_base64 = crate::mole::icon::get_app_icon_base64(&app.path);
            }
        }

        Ok(apps)
    }

    pub async fn analyze_disk(
        bin_path: &str,
        path: Option<&str>,
    ) -> Result<MoleAnalyzeResult, MoleError> {
        let mut cmd = create_command(bin_path);
        cmd.arg("analyze").arg("--json");

        if let Some(target) = path {
            if !target.trim().is_empty() {
                cmd.arg(target.trim());
            }
        }

        let output = cmd.output().await.map_err(|e| MoleError::ProcessFailed {
            command: format!("{} analyze --json", bin_path),
            code: None,
            stderr: e.to_string(),
        })?;

        if !output.status.success() {
            let stderr_str = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(MoleError::ProcessFailed {
                command: format!("{} analyze --json", bin_path),
                code: output.status.code(),
                stderr: stderr_str,
            });
        }

        let stdout_str = String::from_utf8_lossy(&output.stdout);
        let trimmed = stdout_str.trim();
        let json_start = trimmed.find('{').unwrap_or(0);
        let json_end = trimmed.rfind('}').map(|i| i + 1).unwrap_or(trimmed.len());
        let json_slice = &trimmed[json_start..json_end];

        let result: MoleAnalyzeResult = serde_json::from_str(json_slice).map_err(|e| {
            MoleError::JsonParseError {
                source: "mole analyze --json".to_string(),
                raw: format!("{}: {}", e, stdout_str),
            }
        })?;

        Ok(result)
    }

    pub async fn get_history(
        bin_path: &str,
        limit: Option<u32>,
    ) -> Result<MoleHistoryResponse, MoleError> {
        let mut cmd = create_command(bin_path);
        cmd.arg("history").arg("--json");

        let lim = limit.unwrap_or(50).min(200);
        cmd.arg("--limit").arg(lim.to_string());

        let output = cmd.output().await.map_err(|e| MoleError::ProcessFailed {
            command: format!("{} history --json", bin_path),
            code: None,
            stderr: e.to_string(),
        })?;

        if !output.status.success() {
            let stderr_str = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(MoleError::ProcessFailed {
                command: format!("{} history --json", bin_path),
                code: output.status.code(),
                stderr: stderr_str,
            });
        }

        let stdout_str = String::from_utf8_lossy(&output.stdout);
        let trimmed = stdout_str.trim();
        let json_start = trimmed.find('{').unwrap_or(0);
        let json_end = trimmed.rfind('}').map(|i| i + 1).unwrap_or(trimmed.len());
        let json_slice = &trimmed[json_start..json_end];

        let response: MoleHistoryResponse = serde_json::from_str(json_slice).map_err(|e| {
            MoleError::JsonParseError {
                source: "mole history --json".to_string(),
                raw: format!("{}: {}", e, stdout_str),
            }
        })?;

        Ok(response)
    }

    pub async fn execute_clean(
        process_mgr: &ProcessManager,
        bin_path: &str,
        dry_run: bool,
        external: Option<String>,
    ) -> Result<String, MoleError> {
        let mut args = vec!["clean"];
        if dry_run {
            args.push("--dry-run");
        }
        if let Some(ext) = external.as_deref() {
            if !ext.trim().is_empty() {
                args.push("--external");
                args.push(ext.trim());
            }
        }
        process_mgr.spawn_pty("clean", bin_path, args, None).await
    }

    pub async fn execute_uninstall(
        process_mgr: &ProcessManager,
        bin_path: &str,
        app_names: &[String],
        dry_run: bool,
        permanent: bool,
        with_data: bool,
    ) -> Result<String, MoleError> {
        let mut args = vec!["uninstall"];
        if dry_run {
            args.push("--dry-run");
        }
        if permanent {
            args.push("--permanent");
        }
        if with_data {
            args.push("--with-data");
        }
        for name in app_names {
            args.push(name.as_str());
        }
        let title = if app_names.len() == 1 {
            format!("uninstall: {}", app_names[0])
        } else {
            format!("uninstall ({} apps)", app_names.len())
        };
        process_mgr.spawn_pty(&title, bin_path, args, None).await
    }

    pub async fn execute_optimize(
        process_mgr: &ProcessManager,
        bin_path: &str,
        dry_run: bool,
    ) -> Result<String, MoleError> {
        let mut args = vec!["optimize"];
        if dry_run {
            args.push("--dry-run");
        }
        process_mgr.spawn_pty("optimize", bin_path, args, None).await
    }

    pub async fn execute_purge(
        process_mgr: &ProcessManager,
        bin_path: &str,
        dry_run: bool,
        yes: bool,
    ) -> Result<String, MoleError> {
        let mut args = vec!["purge"];
        if dry_run {
            args.push("--dry-run");
        }
        if yes {
            args.push("--yes");
        }
        process_mgr.spawn_pty("purge", bin_path, args, None).await
    }

    pub async fn execute_slim(
        process_mgr: &ProcessManager,
        bin_path: &str,
        dry_run: bool,
    ) -> Result<String, MoleError> {
        let mut args = vec!["slim"];
        if dry_run {
            args.push("--dry-run");
        }
        process_mgr.spawn_pty("slim", bin_path, args, None).await
    }

    pub async fn execute_installer(
        process_mgr: &ProcessManager,
        bin_path: &str,
        dry_run: bool,
    ) -> Result<String, MoleError> {
        let mut args = vec!["installer"];
        if dry_run {
            args.push("--dry-run");
        }
        process_mgr.spawn_pty("installer", bin_path, args, None).await
    }

    pub async fn execute_touchid(
        process_mgr: &ProcessManager,
        bin_path: &str,
    ) -> Result<String, MoleError> {
        process_mgr.spawn_pty("touchid", bin_path, vec!["touchid"], None).await
    }

    pub async fn execute_update(
        process_mgr: &ProcessManager,
        bin_path: &str,
        force: bool,
        nightly: bool,
    ) -> Result<String, MoleError> {
        let mut args = vec!["update"];
        if force {
            args.push("--force");
        }
        if nightly {
            args.push("--nightly");
        }
        process_mgr.spawn_pty("update", bin_path, args, None).await
    }
}
