/**
 * PasswordVault MCP — Unlock Page
 * Skynet Secure Vault v1.0
 */

using System.Windows;
using System.Windows.Controls;
using PasswordVault.Services;

namespace PasswordVault.Views
{
    public partial class UnlockPage : Page
    {
        private readonly VaultClient _vaultClient;

        public UnlockPage()
        {
            InitializeComponent();
            _vaultClient = new VaultClient();
        }

        private async void UnlockButton_Click(object sender, RoutedEventArgs e)
        {
            var masterPassword = MasterPasswordBox.Password;

            if (string.IsNullOrEmpty(masterPassword))
            {
                ShowError("Please enter your master password");
                return;
            }

            // Disable button during unlock
            var button = (Button)sender;
            button.IsEnabled = false;
            button.Content = "Unlocking...";

            try
            {
                var response = await _vaultClient.UnlockVaultAsync(masterPassword);

                if (response.Success && response.Data != null)
                {
                    // Unlock successful!
                    // TODO: Navigate to VaultPage
                    MessageBox.Show(
                        $"Vault unlocked!\n\n{response.Data.EntryCount} entries loaded.",
                        "Success",
                        MessageBoxButton.OK,
                        MessageBoxImage.Information
                    );
                }
                else
                {
                    ShowError(response.Error ?? "Invalid master password");
                }
            }
            catch (System.Exception ex)
            {
                ShowError($"Error: {ex.Message}");
            }
            finally
            {
                button.IsEnabled = true;
                button.Content = "Unlock Vault";
                MasterPasswordBox.Clear();
                MasterPasswordBox.Focus();
            }
        }

        private void ShowError(string message)
        {
            ErrorText.Text = message;
            ErrorText.Visibility = Visibility.Visible;
        }
    }
}
