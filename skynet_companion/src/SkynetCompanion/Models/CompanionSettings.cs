using System;
using System.Text.Json.Serialization;

namespace SkynetCompanion.Models
{
    /// <summary>
    /// Application settings
    /// </summary>
    public class CompanionSettings
    {
        [JsonPropertyName("default_agent")]
        public string DefaultAgent { get; set; } = "claude";

        [JsonPropertyName("voice_enabled")]
        public bool VoiceEnabled { get; set; } = true;

        [JsonPropertyName("clipboard_monitoring")]
        public bool ClipboardMonitoring { get; set; } = true;

        [JsonPropertyName("backend_url")]
        public string BackendUrl { get; set; } = "http://localhost:8765";

        [JsonPropertyName("hotkeys")]
        public HotkeyConfig Hotkeys { get; set; } = new();

        [JsonPropertyName("overlay")]
        public OverlayConfig Overlay { get; set; } = new();

        [JsonPropertyName("memory_enabled")]
        public bool MemoryEnabled { get; set; } = true;
    }

    /// <summary>
    /// Hotkey configuration
    /// </summary>
    public class HotkeyConfig
    {
        [JsonPropertyName("voice_activation")]
        public string VoiceActivation { get; set; } = "Ctrl+Space";

        [JsonPropertyName("toggle_overlay")]
        public string ToggleOverlay { get; set; } = "Ctrl+Shift+A";

        [JsonPropertyName("quick_actions")]
        public string QuickActions { get; set; } = "Ctrl+Shift+Q";
    }

    /// <summary>
    /// Overlay UI configuration
    /// </summary>
    public class OverlayConfig
    {
        [JsonPropertyName("opacity")]
        public double Opacity { get; set; } = 0.9;

        [JsonPropertyName("position")]
        public string Position { get; set; } = "top-right"; // top-right, top-left, bottom-right, bottom-left

        [JsonPropertyName("width")]
        public int Width { get; set; } = 400;

        [JsonPropertyName("height")]
        public int Height { get; set; } = 600;

        [JsonPropertyName("theme")]
        public string Theme { get; set; } = "dark"; // dark, light
    }
}
