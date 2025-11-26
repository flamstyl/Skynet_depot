using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace TaskFlow.Desktop.Views;

public sealed partial class SettingsPage : Page
{
    public SettingsPage()
    {
        this.InitializeComponent();
    }

    private async void TestConnection_Click(object sender, RoutedEventArgs e)
    {
        var button = (Button)sender;
        button.IsEnabled = false;
        button.Content = "Testing...";

        try
        {
            var url = ApiUrlTextBox.Text;
            using var client = new HttpClient();
            var response = await client.GetAsync($"{url}/api/tasks");

            if (response.IsSuccessStatusCode)
            {
                button.Content = "Connection successful!";
            }
            else
            {
                button.Content = "Connection failed";
            }
        }
        catch
        {
            button.Content = "Connection error";
        }

        await Task.Delay(2000);
        button.Content = "Test Connection";
        button.IsEnabled = true;
    }

    private void SaveSettings_Click(object sender, RoutedEventArgs e)
    {
        // TODO: Implement settings persistence
        var button = (Button)sender;
        button.Content = "Saved!";

        Task.Run(async () =>
        {
            await Task.Delay(1500);
            DispatcherQueue.TryEnqueue(() =>
            {
                button.Content = "Save Settings";
            });
        });
    }
}
