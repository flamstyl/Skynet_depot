using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using TaskFlow.Desktop.ViewModels;

namespace TaskFlow.Desktop.Views;

public sealed partial class DashboardPage : Page
{
    public DashboardViewModel ViewModel { get; }

    public DashboardPage()
    {
        this.InitializeComponent();
        ViewModel = new DashboardViewModel();
        this.Loaded += DashboardPage_Loaded;
    }

    private async void DashboardPage_Loaded(object sender, RoutedEventArgs e)
    {
        await ViewModel.LoadTasksAsync();
    }

    private void Filter_Changed(object sender, SelectionChangedEventArgs e)
    {
        ViewModel.ApplyFilters(
            SourceFilter.SelectedItem?.ToString(),
            StatusFilter.SelectedItem?.ToString(),
            SearchBox.Text
        );
    }

    private void SearchBox_TextChanged(object sender, TextChangedEventArgs e)
    {
        ViewModel.ApplyFilters(
            SourceFilter.SelectedItem?.ToString(),
            StatusFilter.SelectedItem?.ToString(),
            SearchBox.Text
        );
    }

    private void TaskListView_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (TaskListView.SelectedItem != null)
        {
            ViewModel.SelectedTask = TaskListView.SelectedItem as Models.TaskItem;
            PomodoroTaskText.Text = $"Ready to focus on: {ViewModel.SelectedTask?.Title}";
        }
    }

    private void PomodoroStart_Click(object sender, RoutedEventArgs e)
    {
        if (ViewModel.SelectedTask != null)
        {
            App.PomodoroService.Start(ViewModel.SelectedTask.Id);
            PomodoroStartButton.IsEnabled = false;
            PomodoroStopButton.IsEnabled = true;
            // TODO: Start UI timer
        }
    }

    private void PomodoroStop_Click(object sender, RoutedEventArgs e)
    {
        App.PomodoroService.Stop();
        PomodoroStartButton.IsEnabled = true;
        PomodoroStopButton.IsEnabled = false;
        // TODO: Stop UI timer
    }
}
