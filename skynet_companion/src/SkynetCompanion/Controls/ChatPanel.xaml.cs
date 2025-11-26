using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using System;

namespace SkynetCompanion.Controls
{
    public sealed partial class ChatPanel : UserControl
    {
        private string _currentAgent = "claude";

        public ChatPanel()
        {
            this.InitializeComponent();
        }

        /// <summary>
        /// Add message to chat display
        /// </summary>
        public void AddMessage(string sender, string content, bool isUser = false)
        {
            var messageBorder = new Border
            {
                Background = new Microsoft.UI.Xaml.Media.SolidColorBrush(
                    isUser ? Microsoft.UI.Colors.DarkSlateBlue : Microsoft.UI.ColorHelper.FromArgb(255, 45, 45, 48)
                ),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(12),
                HorizontalAlignment = isUser ? HorizontalAlignment.Right : HorizontalAlignment.Left,
                MaxWidth = 320,
                Margin = new Thickness(0, 0, 0, 12)
            };

            var messageStack = new StackPanel();

            var senderText = new TextBlock
            {
                Text = sender,
                FontSize = 11,
                Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 156, 163, 175)),
                Margin = new Thickness(0, 0, 0, 4)
            };

            var contentText = new TextBlock
            {
                Text = content,
                FontSize = 13,
                Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 229, 231, 235)),
                TextWrapping = TextWrapping.Wrap
            };

            messageStack.Children.Add(senderText);
            messageStack.Children.Add(contentText);
            messageBorder.Child = messageStack;

            MessagesPanel.Children.Add(messageBorder);

            // Auto-scroll to bottom
            MessagesScrollViewer.UpdateLayout();
            MessagesScrollViewer.ChangeView(null, MessagesScrollViewer.ScrollableHeight, null);
        }

        private void AgentSelector_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (AgentSelector.SelectedItem is ComboBoxItem item && item.Tag is string agent)
            {
                _currentAgent = agent;
                System.Diagnostics.Debug.WriteLine($"Agent switched to: {agent}");

                // TODO: Validate agent connectivity
                AgentStatusText.Text = "● Connected";
            }
        }

        private async void SendButton_Click(object sender, RoutedEventArgs e)
        {
            await SendMessageAsync();
        }

        private async void MessageInput_KeyDown(object sender, KeyRoutedEventArgs e)
        {
            if (e.Key == Windows.System.VirtualKey.Enter)
            {
                await SendMessageAsync();
                e.Handled = true;
            }
        }

        private async System.Threading.Tasks.Task SendMessageAsync()
        {
            var message = MessageInput.Text.Trim();
            if (string.IsNullOrEmpty(message)) return;

            // Add user message to chat
            AddMessage("You", message, isUser: true);

            // Clear input
            MessageInput.Text = string.Empty;

            // TODO: Send to MCP via MCPClient
            // For now, mock response
            await System.Threading.Tasks.Task.Delay(500);

            AddMessage("Assistant", $"[Mock Response from {_currentAgent}] I received your message: \"{message}\"");

            /*
             * TODO: Real implementation:
             *
             * var mcpClient = // Get from dependency injection or parent
             * var response = await mcpClient.SendMessageAsync(new MCPMessage
             * {
             *     Agent = _currentAgent,
             *     Content = message,
             *     Type = "chat"
             * });
             *
             * if (response.Success)
             * {
             *     AddMessage("Assistant", response.Content);
             * }
             * else
             * {
             *     AddMessage("Error", response.Error);
             * }
             */
        }

        /// <summary>
        /// Clear all messages
        /// </summary>
        public void ClearMessages()
        {
            MessagesPanel.Children.Clear();
        }
    }
}
