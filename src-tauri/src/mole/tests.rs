#[cfg(test)]
mod tests {
    use crate::mole::discovery::MoleDiscovery;
    use crate::mole::types::*;

    #[test]
    fn test_candidate_paths_generation() {
        let candidates = MoleDiscovery::get_candidate_paths(Some("/custom/bin/mole"));
        assert!(!candidates.is_empty());
        assert_eq!(candidates[0].to_str().unwrap(), "/custom/bin/mole");
        assert!(candidates.iter().any(|p| p.to_str().unwrap() == "/opt/homebrew/bin/mole"));
    }

    #[test]
    fn test_deserialize_status_json() {
        let sample_json = r#"{
            "collected_at": "2026-11-13T23:08:32.690679+06:00",
            "host": "Jihans-MacBook-Air.local",
            "platform": "darwin 27.2",
            "uptime": "7d 7h",
            "uptime_seconds": 632988,
            "procs": 864,
            "hardware": {
                "model": "MacBook Air",
                "cpu_model": "Apple M5",
                "total_ram": "16.0 GB",
                "disk_size": "460.4 GB",
                "os_version": "macOS 27.2"
            },
            "health_score": 99,
            "health_score_msg": "Excellent",
            "cpu": {
                "usage": 4.74,
                "load1": 2.30,
                "load5": 2.56,
                "load15": 2.50,
                "core_count": 10,
                "logical_cpu": 10,
                "p_core_count": 4,
                "e_core_count": 6
            },
            "memory": {
                "used": 11267178496,
                "total": 17179869184,
                "available": 5912690688,
                "used_percent": 65.58,
                "swap_used": 703004672,
                "swap_total": 2147483648
            },
            "disks": [
                {
                    "mount": "/",
                    "device": "/dev/disk3s3s1",
                    "used": 106172117071,
                    "total": 494332366848,
                    "used_percent": 21.47,
                    "smart_status": "verified",
                    "purgeable": 3792416689
                }
            ]
        }"#;

        let snapshot: Result<MoleStatusSnapshot, _> = serde_json::from_str(sample_json);
        assert!(snapshot.is_ok());
        let s = snapshot.unwrap();
        assert_eq!(s.host, "Jihans-MacBook-Air.local");
        assert_eq!(s.health_score, Some(99));
        assert_eq!(s.cpu.core_count, Some(10));
        assert_eq!(s.disks.len(), 1);
    }

    #[test]
    fn test_deserialize_installed_apps_json() {
        let sample_json = r#"[
            {
                "name": "Google Chrome",
                "bundle_id": "com.google.Chrome",
                "source": "App",
                "uninstall_name": "Google Chrome",
                "path": "/Applications/Google Chrome.app",
                "size": "774.1MB"
            },
            {
                "name": "ZapFast",
                "bundle_id": "me.paolino.fastsapp",
                "source": "Homebrew",
                "uninstall_name": "zapfast",
                "path": "/Applications/ZapFast.app",
                "size": "121.2MB"
            }
        ]"#;

        let apps: Result<Vec<MoleInstalledApp>, _> = serde_json::from_str(sample_json);
        assert!(apps.is_ok());
        let list = apps.unwrap();
        assert_eq!(list.len(), 2);
        assert_eq!(list[0].name, "Google Chrome");
        assert_eq!(list[1].source, "Homebrew");
    }

    #[test]
    fn test_deserialize_analyze_json() {
        let sample_json = r#"{
            "scan_status": "complete",
            "path": "/Users/test/.config",
            "overview": false,
            "entries": [
                {
                    "scan_status": "complete",
                    "name": "mole",
                    "path": "/Users/test/.config/mole",
                    "size": 566,
                    "is_dir": true
                }
            ],
            "total_size": 17899,
            "total_files": 6
        }"#;

        let res: Result<MoleAnalyzeResult, _> = serde_json::from_str(sample_json);
        assert!(res.is_ok());
        let r = res.unwrap();
        assert_eq!(r.entries.len(), 1);
        assert_eq!(r.total_files, 6);
    }

    #[test]
    fn test_deserialize_history_json() {
        let sample_json = r#"{
            "limit": 20,
            "sessions": [
                {
                    "command": "clean",
                    "run_id": "20261109105150",
                    "attribution": "run",
                    "started_at": "2026-11-09 10:51:50",
                    "ended_at": "2026-11-09 10:52:35",
                    "items": 130,
                    "size": "3.07GB",
                    "operation_count": 257,
                    "failed_tasks": 0,
                    "actions": {
                        "removed": 174,
                        "trashed": 0,
                        "skipped": 81,
                        "failed": 2,
                        "rebuilt": 0,
                        "other": 0
                    }
                }
            ],
            "deletions": [
                {
                    "timestamp": "2026-11-13T22:27:36+0600",
                    "mode": "trash",
                    "status": "ok",
                    "size_kb": 4700,
                    "path": "/Applications/Macenic.app"
                }
            ]
        }"#;

        let res: Result<MoleHistoryResponse, _> = serde_json::from_str(sample_json);
        assert!(res.is_ok());
        let r = res.unwrap();
        assert_eq!(r.sessions.as_ref().unwrap().len(), 1);
        assert_eq!(r.deletions.as_ref().unwrap().len(), 1);
    }

    #[test]
    fn test_native_app_icon_extraction() {
        use crate::mole::icon::get_app_icon_base64;
        let icon_b64 = get_app_icon_base64("/System/Applications/Utilities/Terminal.app")
            .or_else(|| get_app_icon_base64("/Applications/Safari.app"));
        assert!(icon_b64.is_some(), "Expected icon for system app");
        let b64 = icon_b64.unwrap();
        assert!(!b64.is_empty());
        assert!(b64.len() > 100);
    }

    #[test]
    fn test_operation_event_payload_serialization() {
        let payload = OperationEventPayload {
            operation_id: "test-uuid-123".to_string(),
            command_name: "clean".to_string(),
            event_type: "stdout".to_string(),
            data: Some("Scanning caches...\n".to_string()),
            exit_code: None,
            timestamp: 1700000000000,
        };

        let json = serde_json::to_string(&payload).expect("Serialization failed");
        assert!(json.contains("test-uuid-123"));
        assert!(json.contains("Scanning caches..."));

        let deserialized: OperationEventPayload = serde_json::from_str(&json).expect("Deserialization failed");
        assert_eq!(deserialized.operation_id, "test-uuid-123");
        assert_eq!(deserialized.exit_code, None);
    }

    #[test]
    fn test_utf8_split_boundary_handling() {
        // Test 3-byte braille spinner character '⠋' (E2 A0 8B) split across chunks
        let braille_char = "⠋";
        let bytes = braille_char.as_bytes();
        assert_eq!(bytes.len(), 3);

        // Chunk 1 has first 2 bytes (incomplete)
        let chunk1 = &bytes[0..2];
        let mut leftover = Vec::new();

        let mut emitted1 = String::new();
        match std::str::from_utf8(chunk1) {
            Ok(s) => emitted1.push_str(s),
            Err(e) => {
                let valid_up_to = e.valid_up_to();
                assert_eq!(valid_up_to, 0); // No valid prefix yet
                leftover.extend_from_slice(&chunk1[valid_up_to..]);
            }
        }
        assert_eq!(emitted1, "");
        assert_eq!(leftover.len(), 2);

        // Chunk 2 arrives with the 3rd byte + additional ASCII " scanning"
        let chunk2 = [&bytes[2..3], b" scanning"].concat();
        let mut combined = Vec::new();
        combined.extend_from_slice(&leftover);
        combined.extend_from_slice(&chunk2);
        leftover.clear();

        let mut emitted2 = String::new();
        match std::str::from_utf8(&combined) {
            Ok(s) => emitted2.push_str(s),
            Err(e) => {
                let valid_up_to = e.valid_up_to();
                if let Ok(s) = std::str::from_utf8(&combined[..valid_up_to]) {
                    emitted2.push_str(s);
                }
            }
        }
        assert_eq!(emitted2, "⠋ scanning");
    }
}
