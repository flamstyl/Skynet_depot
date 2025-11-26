namespace TaskFlow.Core.Models;

/// <summary>
/// Represents a task from any source (Gmail, GitHub, Trello, etc.)
/// </summary>
public class TaskItem
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>
    /// Source of the task: Gmail, GitHub, Trello, Notion, Slack, Manual
    /// </summary>
    public string Source { get; set; } = "Manual";

    /// <summary>
    /// External ID from the source system (e.g., GitHub issue number, Gmail message ID)
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// External URL to the source (e.g., GitHub issue URL)
    /// </summary>
    public string? ExternalUrl { get; set; }

    /// <summary>
    /// Current status: Todo, InProgress, Done
    /// </summary>
    public string Status { get; set; } = "Todo";

    /// <summary>
    /// Priority level (1 = highest, 5 = lowest)
    /// </summary>
    public int Priority { get; set; } = 3;

    /// <summary>
    /// Tags for categorization (e.g., "urgent", "deep-work", "quick-win")
    /// </summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// Due date for the task
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// Estimated duration to complete the task
    /// </summary>
    public TimeSpan? EstimatedDuration { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Pomodoro sessions associated with this task
    /// </summary>
    public List<PomodoroSession> PomodoroSessions { get; set; } = new();
}
