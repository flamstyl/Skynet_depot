using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace SkynetCompanion
{
    /// <summary>
    /// Main window (mostly hidden, manages tray icon)
    /// </summary>
    public sealed partial class MainWindow : Window
    {
        public MainWindow()
        {
            this.InitializeComponent();

            // TODO: Minimize to system tray on start
            // TODO: Add tray icon with context menu
        }

        private void ShowOverlayButton_Click(object sender, RoutedEventArgs e)
        {
            // TODO: Show/focus overlay window
            System.Diagnostics.Debug.WriteLine("Show overlay clicked");
        }

        private void SettingsButton_Click(object sender, RoutedEventArgs e)
        {
            // TODO: Open settings window
            System.Diagnostics.Debug.WriteLine("Settings clicked");
        }

        private void ExitButton_Click(object sender, RoutedEventArgs e)
        {
            // TODO: Cleanup services
            Application.Current.Exit();
        }
    }
}
