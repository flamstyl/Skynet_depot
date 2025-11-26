using TaskFlow.Core.Models;

namespace TaskFlow.Core.Interfaces;

/// <summary>
/// Service for AI-powered task prioritization
/// </summary>
public interface ITaskPrioritizer
{
    /// <summary>
    /// Analyzes and reprioritizes a list of tasks
    /// Returns tasks with updated Priority and Tags
    /// </summary>
    Task<List<TaskItem>> ReprioritizeAsync(List<TaskItem> tasks);
}
