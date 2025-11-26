using System.Net.Http.Json;
using TaskFlow.Desktop.Models;

namespace TaskFlow.Desktop.Services;

public class TaskService
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;

    public TaskService(string baseUrl)
    {
        _baseUrl = baseUrl;
        _httpClient = new HttpClient { BaseAddress = new Uri(baseUrl) };
    }

    public async Task<List<TaskItem>> GetTasksAsync(string? source = null, string? status = null)
    {
        try
        {
            var query = "/api/tasks";
            var queryParams = new List<string>();

            if (!string.IsNullOrEmpty(source))
                queryParams.Add($"source={source}");

            if (!string.IsNullOrEmpty(status))
                queryParams.Add($"status={status}");

            if (queryParams.Any())
                query += "?" + string.Join("&", queryParams);

            var response = await _httpClient.GetAsync(query);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<List<TaskItem>>() ?? new();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"GetTasksAsync failed: {ex.Message}");
            return new List<TaskItem>();
        }
    }

    public async Task<TaskItem?> GetTaskByIdAsync(int id)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/tasks/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<TaskItem>();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"GetTaskByIdAsync failed: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> SyncTasksAsync()
    {
        try
        {
            var response = await _httpClient.PostAsync("/api/sync", null);
            response.EnsureSuccessStatusCode();
            return true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"SyncTasksAsync failed: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> PrioritizeTasksAsync()
    {
        try
        {
            var response = await _httpClient.PostAsync("/api/tasks/prioritize", null);
            response.EnsureSuccessStatusCode();
            return true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"PrioritizeTasksAsync failed: {ex.Message}");
            return false;
        }
    }

    public async Task<TaskItem?> CreateTaskAsync(TaskItem task)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/tasks", task);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<TaskItem>();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"CreateTaskAsync failed: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> UpdateTaskAsync(TaskItem task)
    {
        try
        {
            var response = await _httpClient.PutAsJsonAsync($"/api/tasks/{task.Id}", task);
            response.EnsureSuccessStatusCode();
            return true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"UpdateTaskAsync failed: {ex.Message}");
            return false;
        }
    }
}
