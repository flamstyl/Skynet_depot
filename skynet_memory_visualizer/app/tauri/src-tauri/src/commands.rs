use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AppConfig {
    pub flask_api_url: String,
    pub mcp_api_url: String,
    pub app_version: String,
}

#[tauri::command]
pub fn get_app_config() -> AppConfig {
    AppConfig {
        flask_api_url: "http://localhost:5432".to_string(),
        mcp_api_url: "http://localhost:3456".to_string(),
        app_version: "1.0.0".to_string(),
    }
}

#[tauri::command]
pub async fn check_backend_health() -> Result<bool, String> {
    // TODO: Implement actual health check
    // For now, return true
    Ok(true)
}

#[tauri::command]
pub fn open_external_link(url: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
