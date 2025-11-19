using Microsoft.UI.Xaml;

namespace SkynetCompanion.Windows
{
    public sealed partial class SettingsWindow : Window
    {
        public SettingsWindow()
        {
            this.InitializeComponent();
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }
    }
}
