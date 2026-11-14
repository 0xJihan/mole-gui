use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

use crate::mole::errors::MoleError;
use crate::mole::types::OperationEventPayload;

pub struct RunningOperation {
    pub id: String,
    pub command: String,
    pub master: Arc<Mutex<Option<Box<dyn MasterPty + Send>>>>,
    pub writer: Arc<Mutex<Option<Box<dyn Write + Send>>>>,
    pub killer: Arc<Mutex<Option<Box<dyn FnOnce() + Send>>>>,
}

#[derive(Clone)]
pub struct ProcessManager {
    app: AppHandle,
    operations: Arc<Mutex<HashMap<String, RunningOperation>>>,
}

pub fn get_system_path() -> String {
    let mut paths = vec![
        "/opt/homebrew/bin".to_string(),
        "/usr/local/bin".to_string(),
        "/usr/bin".to_string(),
        "/bin".to_string(),
        "/usr/sbin".to_string(),
        "/sbin".to_string(),
    ];
    if let Some(home) = dirs::home_dir() {
        paths.insert(0, home.join(".local/bin").to_string_lossy().to_string());
        paths.insert(1, home.join(".cargo/bin").to_string_lossy().to_string());
        paths.insert(2, home.join("bin").to_string_lossy().to_string());
    }
    if let Ok(current_path) = std::env::var("PATH") {
        for p in current_path.split(':') {
            if !paths.contains(&p.to_string()) && !p.is_empty() {
                paths.push(p.to_string());
            }
        }
    }
    paths.join(":")
}

impl ProcessManager {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app,
            operations: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn cancel_operation(&self, id: &str) -> Result<(), MoleError> {
        let op = {
            let mut ops = self.operations.lock().map_err(|e| MoleError::ProcessFailed {
                command: "cancel".into(),
                code: None,
                stderr: e.to_string(),
            })?;
            ops.remove(id)
        };

        if let Some(op) = op {
            if let Ok(mut killer_guard) = op.killer.lock() {
                if let Some(killer) = killer_guard.take() {
                    killer();
                }
            }
            let _ = self.app.emit(
                "mole://op-exit",
                OperationEventPayload {
                    operation_id: id.to_string(),
                    command_name: op.command,
                    event_type: "cancelled".to_string(),
                    data: Some("Operation was cancelled by user.\n".to_string()),
                    exit_code: Some(-1),
                    timestamp: chrono::Utc::now().timestamp_millis(),
                },
            );
            Ok(())
        } else {
            Err(MoleError::OperationCancelled(id.to_string()))
        }
    }

    pub fn send_input(&self, id: &str, input: &str) -> Result<(), MoleError> {
        let op_opt = {
            let ops = self.operations.lock().map_err(|e| MoleError::ProcessFailed {
                command: "send_input".into(),
                code: None,
                stderr: e.to_string(),
            })?;
            ops.get(id).map(|op| op.writer.clone())
        };

        if let Some(writer_arc) = op_opt {
            if let Ok(mut writer_guard) = writer_arc.lock() {
                if let Some(writer) = writer_guard.as_mut() {
                    writer.write_all(input.as_bytes()).map_err(|e| MoleError::IoError(e.to_string()))?;
                    writer.flush().map_err(|e| MoleError::IoError(e.to_string()))?;
                    return Ok(());
                }
            }
        }
        Err(MoleError::ProcessFailed {
            command: "send_input".to_string(),
            code: None,
            stderr: format!("Operation {} not found or writer closed", id),
        })
    }

    pub fn resize_pty(&self, id: &str, cols: u16, rows: u16) -> Result<(), MoleError> {
        let op_opt = {
            let ops = self.operations.lock().map_err(|e| MoleError::ProcessFailed {
                command: "resize_pty".into(),
                code: None,
                stderr: e.to_string(),
            })?;
            ops.get(id).map(|op| op.master.clone())
        };

        if let Some(master_arc) = op_opt {
            if let Ok(master_guard) = master_arc.lock() {
                if let Some(master) = master_guard.as_ref() {
                    let _ = master.resize(PtySize {
                        rows,
                        cols,
                        pixel_width: 0,
                        pixel_height: 0,
                    });
                    return Ok(());
                }
            }
        }
        Ok(())
    }

    pub async fn spawn_pty(
        &self,
        command_name: &str,
        bin_path: &str,
        args: Vec<&str>,
        working_dir: Option<PathBuf>,
    ) -> Result<String, MoleError> {
        let op_id = Uuid::new_v4().to_string();
        let pty_system = native_pty_system();

        let pair = pty_system
            .openpty(PtySize {
                rows: 30,
                cols: 100,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| MoleError::PtyError(e.to_string()))?;

        let mut cmd = CommandBuilder::new(bin_path);

        // Inherit parent environment variables
        for (k, v) in std::env::vars() {
            cmd.env(k, v);
        }

        // Guarantee essential terminal, locale, and path variables
        cmd.env("TERM", "xterm-256color");
        cmd.env("COLORTERM", "truecolor");
        cmd.env("LANG", "en_US.UTF-8");
        cmd.env("LC_ALL", "en_US.UTF-8");
        cmd.env("PATH", get_system_path());

        for arg in &args {
            cmd.arg(arg);
        }
        if let Some(cwd) = working_dir {
            cmd.cwd(cwd);
        }

        let mut child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| MoleError::PtyError(e.to_string()))?;

        drop(pair.slave);

        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| MoleError::PtyError(e.to_string()))?;

        let writer = pair
            .master
            .take_writer()
            .map_err(|e| MoleError::PtyError(e.to_string()))?;

        let master_holder = Arc::new(Mutex::new(Some(pair.master)));
        let writer_holder = Arc::new(Mutex::new(Some(writer)));

        // Child process killer closure
        let killer_child = child.clone_killer();
        let killer_holder = Arc::new(Mutex::new(Some(Box::new(move || {
            let mut killer = killer_child;
            let _ = killer.kill();
        }) as Box<dyn FnOnce() + Send>)));

        let op = RunningOperation {
            id: op_id.clone(),
            command: command_name.to_string(),
            master: master_holder.clone(),
            writer: writer_holder.clone(),
            killer: killer_holder.clone(),
        };

        {
            if let Ok(mut ops) = self.operations.lock() {
                ops.insert(op_id.clone(), op);
            }
        }

        // Emit started event
        let _ = self.app.emit(
            "mole://op-started",
            OperationEventPayload {
                operation_id: op_id.clone(),
                command_name: command_name.to_string(),
                event_type: "started".to_string(),
                data: Some(format!("Executing: {} {}\n", bin_path, args.join(" "))),
                exit_code: None,
                timestamp: chrono::Utc::now().timestamp_millis(),
            },
        );

        let app_clone = self.app.clone();
        let op_id_clone = op_id.clone();
        let cmd_name_clone = command_name.to_string();
        let operations_ref = self.operations.clone();

        // Spawn background thread to stream PTY output with incomplete UTF-8 boundary protection
        let app_clone_reader = app_clone.clone();
        let op_id_reader = op_id_clone.clone();
        let cmd_name_reader = cmd_name_clone.clone();

        std::thread::spawn(move || {
            let mut raw_buffer = [0u8; 4096];
            let mut leftover_bytes: Vec<u8> = Vec::new();

            loop {
                match reader.read(&mut raw_buffer) {
                    Ok(0) => break, // EOF reached
                    Ok(n) => {
                        let mut combined = Vec::with_capacity(leftover_bytes.len() + n);
                        combined.extend_from_slice(&leftover_bytes);
                        combined.extend_from_slice(&raw_buffer[..n]);
                        leftover_bytes.clear();

                        match std::str::from_utf8(&combined) {
                            Ok(valid_str) => {
                                let _ = app_clone_reader.emit(
                                    "mole://op-output",
                                    OperationEventPayload {
                                        operation_id: op_id_reader.clone(),
                                        command_name: cmd_name_reader.clone(),
                                        event_type: "stdout".to_string(),
                                        data: Some(valid_str.to_string()),
                                        exit_code: None,
                                        timestamp: chrono::Utc::now().timestamp_millis(),
                                    },
                                );
                            }
                            Err(e) => {
                                let valid_up_to = e.valid_up_to();
                                if valid_up_to > 0 {
                                    if let Ok(valid_str) = std::str::from_utf8(&combined[..valid_up_to]) {
                                        let _ = app_clone_reader.emit(
                                            "mole://op-output",
                                            OperationEventPayload {
                                                operation_id: op_id_reader.clone(),
                                                command_name: cmd_name_reader.clone(),
                                                event_type: "stdout".to_string(),
                                                data: Some(valid_str.to_string()),
                                                exit_code: None,
                                                timestamp: chrono::Utc::now().timestamp_millis(),
                                            },
                                        );
                                    }
                                }

                                if let Some(error_len) = e.error_len() {
                                    let next_offset = valid_up_to + error_len;
                                    if next_offset < combined.len() {
                                        leftover_bytes.extend_from_slice(&combined[next_offset..]);
                                    }
                                } else {
                                    leftover_bytes.extend_from_slice(&combined[valid_up_to..]);
                                }
                            }
                        }
                    }
                    Err(_) => break,
                }
            }

            // Flush any remaining leftover bytes as lossy UTF-8
            if !leftover_bytes.is_empty() {
                let trailing_str = String::from_utf8_lossy(&leftover_bytes).to_string();
                let _ = app_clone_reader.emit(
                    "mole://op-output",
                    OperationEventPayload {
                        operation_id: op_id_reader.clone(),
                        command_name: cmd_name_reader.clone(),
                        event_type: "stdout".to_string(),
                        data: Some(trailing_str),
                        exit_code: None,
                        timestamp: chrono::Utc::now().timestamp_millis(),
                    },
                );
            }
        });

        // Dedicated process monitor thread: waits on child.wait() concurrently
        // Ensures that when the main process finishes, any orphan keepalive subshells are terminated
        // and mole://op-exit is emitted immediately without hanging
        let mut killer_for_wait = child.clone_killer();
        std::thread::spawn(move || {
            let exit_status = child.wait();
            let exit_code = match exit_status {
                Ok(status) => status.exit_code() as i32,
                Err(_) => -1,
            };

            // Allow 150ms for reader thread to flush final buffer
            std::thread::sleep(std::time::Duration::from_millis(150));

            // Terminate any lingering background subshells
            let _ = killer_for_wait.kill();

            // Synchronously remove from active operations map - zero tokio::spawn, zero panics!
            if let Ok(mut ops) = operations_ref.lock() {
                ops.remove(&op_id_clone);
            }

            // Emit exit event
            let _ = app_clone.emit(
                "mole://op-exit",
                OperationEventPayload {
                    operation_id: op_id_clone,
                    command_name: cmd_name_clone,
                    event_type: "exit".to_string(),
                    data: None,
                    exit_code: Some(exit_code),
                    timestamp: chrono::Utc::now().timestamp_millis(),
                },
            );
        });

        Ok(op_id)
    }
}
