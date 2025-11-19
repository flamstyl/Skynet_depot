namespace TaskFlow.Core.Models;

/// <summary>
/// Represents a Pomodoro work session associated with a task
/// </summary>
public class PomodoroSession
{
    public int Id { get; set; }

    public int TaskId { get; set; }

    public TaskItem? Task { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    /// <summary>
    /// Planned duration (typically 25 minutes for work, 5 for break)
    /// </summary>
    public TimeSpan Duration { get; set; } = TimeSpan.FromMinutes(25);

    /// <summary>
    /// True if this is a break session, false if it's a work session
    /// </summary>
    public bool IsBreak { get; set; } = false;

    /// <summary>
    /// Was the session completed or interrupted?
    /// </summary>
    public bool IsCompleted { get; set; } = false;
}
