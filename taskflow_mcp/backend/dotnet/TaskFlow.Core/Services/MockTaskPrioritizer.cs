using TaskFlow.Core.Interfaces;
using TaskFlow.Core.Models;

namespace TaskFlow.Core.Services;

/// <summary>
/// Mock implementation of task prioritization
/// Uses simple algorithm: due date + "urgent" tag
/// Phase 2: Replace with Claude CLI / GPT integration
/// </summary>
public class MockTaskPrioritizer : ITaskPrioritizer
{
    public async Task<List<TaskItem>> ReprioritizeAsync(List<TaskItem> tasks)
    {
        // Simulate AI processing delay
        await Task.Delay(500);

        var prioritized = tasks.Select(task => {
            // Clone the task to avoid modifying the original
            var newTask = task;

            // Calculate priority score
            int priorityScore = 3; // default

            // Higher priority for tasks with due dates
            if (task.DueDate.HasValue)
            {
                var daysUntilDue = (task.DueDate.Value - DateTime.UtcNow).TotalDays;
                if (daysUntilDue < 1)
                    priorityScore = 1; // Due today or overdue
                else if (daysUntilDue < 3)
                    priorityScore = 2; // Due soon
                else if (daysUntilDue < 7)
                    priorityScore = 3; // Due this week
            }

            // Boost priority for urgent tags
            if (task.Tags.Any(t => t.ToLower().Contains("urgent")))
            {
                priorityScore = Math.Max(1, priorityScore - 1);
                if (!task.Tags.Contains("urgent"))
                    task.Tags.Add("urgent");
            }

            // Add intelligent tags
            if (task.EstimatedDuration.HasValue && task.EstimatedDuration.Value.TotalMinutes <= 15)
            {
                if (!task.Tags.Contains("quick-win"))
                    task.Tags.Add("quick-win");
            }

            if (task.Tags.Any(t => t.ToLower().Contains("deep") || t.ToLower().Contains("complex")))
            {
                if (!task.Tags.Contains("deep-work"))
                    task.Tags.Add("deep-work");
            }

            // GitHub issues are often technical and important
            if (task.Source == "GitHub")
            {
                priorityScore = Math.Max(1, priorityScore - 1);
            }

            newTask.Priority = priorityScore;
            newTask.UpdatedAt = DateTime.UtcNow;

            return newTask;
        })
        .OrderBy(t => t.Priority)
        .ThenBy(t => t.DueDate ?? DateTime.MaxValue)
        .ToList();

        return prioritized;
    }
}
