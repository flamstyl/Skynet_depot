/**
 * PasswordVault MCP — Main Window
 * Skynet Secure Vault v1.0
 */

using System;
using System.Windows;
using System.Windows.Media;
using PasswordVault.Services;

namespace PasswordVault
{
    public partial class MainWindow : Window
    {
        private readonly VaultClient _vaultClient;
        private readonly MCPClient _mcpClient;

        public MainWindow()
        {
            InitializeComponent();

            _vaultClient = new VaultClient();
            _mcpClient = new MCPClient();

            Loaded += MainWindow_Loaded;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            // Check backend status
            await CheckBackendStatusAsync();

            // TODO: Navigate to UnlockPage or VaultPage based on vault status
            StatusText.Text = "Checking vault status...";

            var statusResponse = await _vaultClient.GetVaultStatusAsync();

            if (statusResponse.Success && statusResponse.Data != null)
            {
                if (!statusResponse.Data.Exists)
                {
                    StatusText.Text = "No vault found - Create a new vault";
                    // TODO: Navigate to CreateVaultPage
                }
                else if (!statusResponse.Data.IsUnlocked)
                {
                    StatusText.Text = "Vault locked - Enter master password";
                    // TODO: Navigate to UnlockPage
                }
                else
                {
                    StatusText.Text = $"Vault unlocked - {statusResponse.Data.EntryCount} entries";
                    // TODO: Navigate to VaultPage
                }
            }
            else
            {
                StatusText.Text = "Error: Cannot connect to backend";
                MessageBox.Show(
                    "Cannot connect to Python backend.\n\nPlease ensure the backend server is running:\n\npython vault_server.py",
                    "Connection Error",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error
                );
            }
        }

        private async System.Threading.Tasks.Task CheckBackendStatusAsync()
        {
            // Check Python backend
            try
            {
                var vaultStatus = await _vaultClient.GetVaultStatusAsync();
                if (vaultStatus.Success)
                {
                    BackendStatus.Text = "Python: ●";
                    BackendStatus.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#00C853"));
                }
                else
                {
                    BackendStatus.Text = "Python: ●";
                    BackendStatus.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#F44336"));
                }
            }
            catch
            {
                BackendStatus.Text = "Python: ●";
                BackendStatus.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#F44336"));
            }

            // Check MCP server (optional)
            try
            {
                var mcpAvailable = await _mcpClient.IsServerAvailableAsync();
                if (mcpAvailable)
                {
                    MCPStatus.Text = "MCP: ●";
                    MCPStatus.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#00C853"));
                }
                else
                {
                    MCPStatus.Text = "MCP: ●";
                    MCPStatus.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#FFC107"));
                    MCPStatus.ToolTip = "MCP server offline (optional)";
                }
            }
            catch
            {
                MCPStatus.Text = "MCP: ●";
                MCPStatus.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#FFC107"));
                MCPStatus.ToolTip = "MCP server offline (optional)";
            }
        }
    }
}
