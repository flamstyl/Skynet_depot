namespace TaskFlow.Desktop.Models;

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Source { get; set; } = "Manual";
    public string? ExternalId { get; set; }
    public string? ExternalUrl { get; set; }
    public string Status { get; set; } = "Todo";
    public int Priority { get; set; } = 3;
    public List<string> Tags { get; set; } = new();
    public DateTime? DueDate { get; set; }
    public TimeSpan? EstimatedDuration { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
