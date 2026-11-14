use std::path::{Path, PathBuf};
use std::process::Command;
use crate::mole::types::MoleInstallationInfo;

pub struct MoleDiscovery;

impl MoleDiscovery {
    pub fn get_candidate_paths(custom_path: Option<&str>) -> Vec<PathBuf> {
        let mut candidates = Vec::new();

        if let Some(custom) = custom_path {
            if !custom.trim().is_empty() {
                candidates.push(PathBuf::from(custom.trim()));
            }
        }

        // Standard Apple Silicon Homebrew path
        candidates.push(PathBuf::from("/opt/homebrew/bin/mole"));

        // Intel Homebrew / standard Unix path
        candidates.push(PathBuf::from("/usr/local/bin/mole"));

        // User local paths
        if let Some(home) = dirs::home_dir() {
            candidates.push(home.join(".local/bin/mole"));
            candidates.push(home.join(".cargo/bin/mole"));
            candidates.push(home.join("bin/mole"));
        }

        // Also check PATH environment variable
        if let Ok(path_var) = std::env::var("PATH") {
            for dir in path_var.split(':') {
                let p = Path::new(dir).join("mole");
                if !candidates.contains(&p) {
                    candidates.push(p);
                }
            }
        }

        candidates
    }

    pub fn verify_executable(path: &Path) -> Option<(String, Option<String>, Option<String>)> {
        if !path.exists() || !path.is_file() {
            return None;
        }

        // Run `mole --version`
        let output = Command::new(path)
            .arg("--version")
            .output()
            .ok()?;

        if !output.status.success() {
            return None;
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        if !stdout.contains("Mole version") {
            return None;
        }

        // Parse version
        let mut version = "Unknown".to_string();
        let mut macos_version = None;
        let mut arch = None;

        for line in stdout.lines() {
            let line = line.trim();
            if line.starts_with("Mole version") {
                if let Some(v) = line.strip_prefix("Mole version") {
                    version = v.trim().to_string();
                }
            } else if line.starts_with("macOS:") {
                if let Some(v) = line.strip_prefix("macOS:") {
                    macos_version = Some(v.trim().to_string());
                }
            } else if line.starts_with("Architecture:") {
                if let Some(v) = line.strip_prefix("Architecture:") {
                    arch = Some(v.trim().to_string());
                }
            }
        }

        Some((version, macos_version, arch))
    }

    pub fn detect(custom_path: Option<&str>) -> MoleInstallationInfo {
        let candidates = Self::get_candidate_paths(custom_path);
        let candidate_strings: Vec<String> = candidates.iter().map(|p| p.to_string_lossy().to_string()).collect();

        for candidate in &candidates {
            if let Some((ver, macos, arch)) = Self::verify_executable(candidate) {
                return MoleInstallationInfo {
                    is_installed: true,
                    version: Some(ver),
                    binary_path: Some(candidate.to_string_lossy().to_string()),
                    candidate_paths: candidate_strings,
                    macos_version: macos,
                    architecture: arch,
                    error_message: None,
                };
            }
        }

        MoleInstallationInfo {
            is_installed: false,
            version: None,
            binary_path: None,
            candidate_paths: candidate_strings,
            macos_version: None,
            architecture: None,
            error_message: Some("Mole CLI executable was not found. Please install Mole or configure its path.".to_string()),
        }
    }
}
