using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SkynetCompanion.Models
{
    /// <summary>
    /// Message sent to/from MCP Server
    /// </summary>
    public class MCPMessage
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("agent")]
        public string Agent { get; set; } = "claude"; // Default agent

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("context")]
        public Dictionary<string, object>? Context { get; set; }

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("type")]
        public string Type { get; set; } = "query"; // query, command, voice, clipboard
    }

    /// <summary>
    /// Response from MCP Server
    /// </summary>
    public class MCPResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("agent")]
        public string Agent { get; set; } = string.Empty;

        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// Available AI agents
    /// </summary>
    public class Agent
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("display_name")]
        public string DisplayName { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("available")]
        public bool Available { get; set; }

        [JsonPropertyName("icon")]
        public string Icon { get; set; } = "🤖";
    }
}
