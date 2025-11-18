using CommunityToolkit.Mvvm.ComponentModel;
using System.Collections.ObjectModel;
using TaskFlow.Desktop.Models;

namespace TaskFlow.Desktop.ViewModels;

public partial class DashboardViewModel : ObservableObject
{
    [ObservableProperty]
    private ObservableCollection<TaskItem> allTasks = new();

    [ObservableProperty]
    private ObservableCollection<TaskItem> filteredTasks = new();

    [ObservableProperty]
    private TaskItem? selectedTask;

    public async Task LoadTasksAsync()
    {
        var tasks = await App.TaskService.GetTasksAsync();

        AllTasks.Clear();
        foreach (var task in tasks)
        {
            AllTasks.Add(task);
        }

        FilteredTasks.Clear();
        foreach (var task in tasks)
        {
            FilteredTasks.Add(task);
        }
    }

    public void ApplyFilters(string? source, string? status, string? searchText)
    {
        var filtered = AllTasks.AsEnumerable();

        if (!string.IsNullOrEmpty(source) && source != "All")
        {
            filtered = filtered.Where(t => t.Source == source);
        }

        if (!string.IsNullOrEmpty(status) && status != "All")
        {
            filtered = filtered.Where(t => t.Status == status);
        }

        if (!string.IsNullOrEmpty(searchText))
        {
            var search = searchText.ToLower();
            filtered = filtered.Where(t =>
                t.Title.ToLower().Contains(search) ||
                (t.Description?.ToLower().Contains(search) ?? false)
            );
        }

        FilteredTasks.Clear();
        foreach (var task in filtered)
        {
            FilteredTasks.Add(task);
        }
    }
}
