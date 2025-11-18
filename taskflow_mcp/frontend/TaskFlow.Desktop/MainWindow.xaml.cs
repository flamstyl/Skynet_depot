using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using TaskFlow.Desktop.Views;

namespace TaskFlow.Desktop;

public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        this.InitializeComponent();

        // Navigate to Dashboard by default
        ContentFrame.Navigate(typeof(DashboardPage));
    }

    private void NavView_SelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
        if (args.SelectedItemContainer != null)
        {
            var tag = args.SelectedItemContainer.Tag?.ToString();

            switch (tag)
            {
                case "Dashboard":
                    ContentFrame.Navigate(typeof(DashboardPage));
                    break;
                case "AllTasks":
                    ContentFrame.Navigate(typeof(DashboardPage)); // Reuse Dashboard for now
                    break;
                case "Pomodoro":
                    ContentFrame.Navigate(typeof(DashboardPage)); // TODO: Create dedicated Pomodoro page
                    break;
            }
        }
    }

    private async void SyncButton_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            var button = (Button)sender;
            button.IsEnabled = false;
            button.Content = "Syncing...";

            await App.TaskService.SyncTasksAsync();

            button.Content = "Sync MCP";
            button.IsEnabled = true;

            // Refresh current page
            ContentFrame.Navigate(ContentFrame.CurrentSourcePageType);
        }
        catch (Exception ex)
        {
            // TODO: Show error dialog
            System.Diagnostics.Debug.WriteLine($"Sync failed: {ex.Message}");
        }
    }

    private async void PrioritizeButton_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            var button = (Button)sender;
            button.IsEnabled = false;
            button.Content = "Analyzing...";

            await App.TaskService.PrioritizeTasksAsync();

            button.Content = "Reprioriser";
            button.IsEnabled = true;

            // Refresh current page
            ContentFrame.Navigate(ContentFrame.CurrentSourcePageType);
        }
        catch (Exception ex)
        {
            // TODO: Show error dialog
            System.Diagnostics.Debug.WriteLine($"Prioritization failed: {ex.Message}");
        }
    }

    private void SettingsButton_Click(object sender, RoutedEventArgs e)
    {
        ContentFrame.Navigate(typeof(SettingsPage));
    }
}
