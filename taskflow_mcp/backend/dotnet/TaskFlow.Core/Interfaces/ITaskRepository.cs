using TaskFlow.Core.Models;

namespace TaskFlow.Core.Interfaces;

public interface ITaskRepository
{
    Task<List<TaskItem>> GetAllAsync();
    Task<List<TaskItem>> GetByFilterAsync(string? source = null, string? status = null, string? tag = null);
    Task<TaskItem?> GetByIdAsync(int id);
    Task<TaskItem?> GetByExternalIdAsync(string source, string externalId);
    Task<TaskItem> CreateAsync(TaskItem task);
    Task<TaskItem> UpdateAsync(TaskItem task);
    Task DeleteAsync(int id);
    Task<int> CountAsync();
}
