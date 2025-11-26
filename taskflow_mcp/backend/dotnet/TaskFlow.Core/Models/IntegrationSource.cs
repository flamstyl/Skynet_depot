namespace TaskFlow.Core.Models;

/// <summary>
/// Configuration for external integration sources (Gmail, GitHub, etc.)
/// </summary>
public class IntegrationSource
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Type: Gmail, GitHub, Trello, Notion, Slack
    /// </summary>
    public string Type { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;

    public DateTime? LastSyncAt { get; set; }

    /// <summary>
    /// JSON configuration for this source (API keys, tokens, etc.)
    /// Stored as JSON string for flexibility
    /// </summary>
    public string? ConfigJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
