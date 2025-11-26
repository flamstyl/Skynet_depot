using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SkynetCompanion.Models
{
    /// <summary>
    /// Memory entry for short/long term storage
    /// </summary>
    public class MemoryEntry
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("summary")]
        public string Summary { get; set; } = string.Empty;

        [JsonPropertyName("tags")]
        public List<string> Tags { get; set; } = new();

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("source")]
        public string Source { get; set; } = "unknown"; // voice, clipboard, chat, manual

        [JsonPropertyName("agent")]
        public string Agent { get; set; } = string.Empty; // Which agent processed it

        [JsonPropertyName("metadata")]
        public Dictionary<string, object>? Metadata { get; set; }
    }

    /// <summary>
    /// Clipboard content captured
    /// </summary>
    public class ClipboardContent
    {
        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("source_app")]
        public string SourceApp { get; set; } = "unknown";
    }
}
