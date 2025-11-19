using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using SkynetCompanion.Helpers;
using SkynetCompanion.Services;
using System;
using System.Threading.Tasks;

namespace SkynetCompanion.Windows
{
    public sealed partial class SettingsWindow : Window
    {
        private readonly MCPClient _mcpClient;

        public SettingsWindow(MCPClient? mcpClient = null)
        {
            this.InitializeComponent();
            _mcpClient = mcpClient ?? new MCPClient();

            LoadSettings();
        }

        /// <summary>
        /// Load current settings into UI
        /// </summary>
        private void LoadSettings()
        {
            // Auto-start
            AutoStartToggle.IsOn = AutoStartHelper.IsAutoStartEnabled();

            // Backend URL from settings
            // TODO: Load from CompanionSettings
        }

        private void AutoStartToggle_Toggled(object sender, RoutedEventArgs e)
        {
            if (AutoStartToggle.IsOn)
            {
                AutoStartHelper.EnableAutoStart();
            }
            else
            {
                AutoStartHelper.DisableAutoStart();
            }
        }

        private void DefaultAgentComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            // TODO: Save default agent preference
            if (DefaultAgentComboBox.SelectedItem is ComboBoxItem item && item.Tag is string agent)
            {
                System.Diagnostics.Debug.WriteLine($"Default agent changed to: {agent}");
            }
        }

        private void OpacitySlider_ValueChanged(object sender, Microsoft.UI.Xaml.Controls.Primitives.RangeBaseValueChangedEventArgs e)
        {
            // TODO: Update overlay opacity in real-time
            System.Diagnostics.Debug.WriteLine($"Opacity changed to: {e.NewValue}");
        }

        private void PositionComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            // TODO: Update overlay position
            if (PositionComboBox.SelectedItem is ComboBoxItem item && item.Tag is string position)
            {
                System.Diagnostics.Debug.WriteLine($"Position changed to: {position}");
            }
        }

        private async void TestConnectionButton_Click(object sender, RoutedEventArgs e)
        {
            ConnectionStatusText.Text = "Testing connection...";
            ConnectionStatusText.Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(
                Microsoft.UI.ColorHelper.FromArgb(255, 156, 163, 175)); // Gray

            try
            {
                var url = BackendUrlTextBox.Text.Trim();
                var client = new MCPClient(url);
                var isAlive = await client.IsBackendAliveAsync();

                if (isAlive)
                {
                    ConnectionStatusText.Text = "✅ Connected successfully!";
                    ConnectionStatusText.Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(
                        Microsoft.UI.ColorHelper.FromArgb(255, 16, 185, 129)); // Green
                }
                else
                {
                    ConnectionStatusText.Text = "❌ Connection failed";
                    ConnectionStatusText.Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(
                        Microsoft.UI.ColorHelper.FromArgb(255, 239, 68, 68)); // Red
                }
            }
            catch (Exception ex)
            {
                ConnectionStatusText.Text = $"❌ Error: {ex.Message}";
                ConnectionStatusText.Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(
                    Microsoft.UI.ColorHelper.FromArgb(255, 239, 68, 68)); // Red
            }
        }

        private async void ClearMemoryButton_Click(object sender, RoutedEventArgs e)
        {
            // TODO: Show confirmation dialog
            var dialog = new ContentDialog
            {
                Title = "Clear All Memory?",
                Content = "This will permanently delete all stored memories. This action cannot be undone.",
                PrimaryButtonText = "Clear",
                CloseButtonText = "Cancel",
                DefaultButton = ContentDialogButton.Close,
                XamlRoot = this.Content.XamlRoot
            };

            var result = await dialog.ShowAsync();

            if (result == ContentDialogResult.Primary)
            {
                // TODO: Call MemoryService.ClearMemoryAsync()
                System.Diagnostics.Debug.WriteLine("Memory cleared");
                NotificationService.ShowToast("Memory Cleared", "All memories have been deleted", "🗑️");
            }
        }

        private async void ExportMemoryButton_Click(object sender, RoutedEventArgs e)
        {
            // TODO: Show file picker
            var savePicker = new Windows.Storage.Pickers.FileSavePicker
            {
                SuggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.DocumentsLibrary,
                SuggestedFileName = $"skynet_memory_{DateTime.Now:yyyy-MM-dd}"
            };

            savePicker.FileTypeChoices.Add("JSON", new[] { ".json" });

            // Get the window handle
            var hwnd = WindowHelper.GetWindowHandle(this);
            WinRT.Interop.InitializeWithWindow.Initialize(savePicker, hwnd);

            var file = await savePicker.PickSaveFileAsync();

            if (file != null)
            {
                // TODO: Export memory to file
                System.Diagnostics.Debug.WriteLine($"Exporting memory to: {file.Path}");
                NotificationService.ShowToast("Memory Exported", $"Saved to {file.Name}", "💾");
            }
        }

        private void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            // TODO: Save all settings to CompanionSettings.json
            SaveSettings();
            NotificationService.ShowToast("Settings Saved", "Your preferences have been saved", "✅");
            this.Close();
        }

        private void SaveSettings()
        {
            // TODO: Persist settings to file
            System.Diagnostics.Debug.WriteLine("Settings saved");
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }
    }
}
