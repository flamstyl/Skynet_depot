using TaskFlow.Core.Models;

namespace TaskFlow.Core.Interfaces;

/// <summary>
/// Client for communicating with the MCP Node.js server
/// </summary>
public interface IMcpClient
{
    /// <summary>
    /// Fetches tasks from a specific source via MCP
    /// </summary>
    Task<List<TaskItem>> FetchTasksAsync(string source);

    /// <summary>
    /// Fetches tasks from all enabled sources
    /// </summary>
    Task<List<TaskItem>> FetchAllTasksAsync();
}
