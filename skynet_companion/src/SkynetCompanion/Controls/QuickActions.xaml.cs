using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using System;

namespace SkynetCompanion.Controls
{
    public sealed partial class QuickActions : UserControl
    {
        private string _clipboardContent = string.Empty;

        public QuickActions()
        {
            this.InitializeComponent();
        }

        /// <summary>
        /// Update clipboard preview
        /// </summary>
        public void UpdateClipboardPreview(string content)
        {
            _clipboardContent = content;
            ClipboardPreview.Text = string.IsNullOrEmpty(content)
                ? "(nothing copied yet)"
                : content.Substring(0, Math.Min(200, content.Length)) + (content.Length > 200 ? "..." : "");
        }

        private async void SummarizeButton_Click(object sender, RoutedEventArgs e)
        {
            await ExecuteActionAsync("summarize", "Summarizing...");
        }

        private async void TranslateButton_Click(object sender, RoutedEventArgs e)
        {
            await ExecuteActionAsync("translate", "Translating...");
        }

        private async void ExplainButton_Click(object sender, RoutedEventArgs e)
        {
            await ExecuteActionAsync("explain", "Explaining...");
        }

        private async void ImproveButton_Click(object sender, RoutedEventArgs e)
        {
            await ExecuteActionAsync("improve", "Improving...");
        }

        private async void CodeButton_Click(object sender, RoutedEventArgs e)
        {
            await ExecuteActionAsync("code", "Generating code...");
        }

        private async void AnalyzeButton_Click(object sender, RoutedEventArgs e)
        {
            await ExecuteActionAsync("analyze", "Analyzing...");
        }

        private async System.Threading.Tasks.Task ExecuteActionAsync(string action, string loadingText)
        {
            if (string.IsNullOrEmpty(_clipboardContent))
            {
                ShowResult("Error", "No clipboard content available. Please copy some text first.");
                return;
            }

            // Show loading
            ResultBorder.Visibility = Visibility.Visible;
            ResultTitle.Text = loadingText;
            ResultText.Text = string.Empty;
            ActionProgressRing.IsActive = true;
            ActionProgressRing.Visibility = Visibility.Visible;

            // TODO: Call MCP API with clipboard content and action
            // For now, mock response
            await System.Threading.Tasks.Task.Delay(1500);

            var mockResults = new System.Collections.Generic.Dictionary<string, string>
            {
                ["summarize"] = "This is a summary of the clipboard content. Key points have been extracted.",
                ["translate"] = "Here is the translated text in French/Spanish/etc.",
                ["explain"] = "This content explains... [detailed explanation]",
                ["improve"] = "Here's an improved version with better clarity and structure.",
                ["code"] = "// Generated code based on the description\nfunction example() {\n  // Implementation\n}",
                ["analyze"] = "Analysis: The content appears to be technical documentation. Key themes: software, API, integration."
            };

            ShowResult($"✅ {char.ToUpper(action[0]) + action.Substring(1)}", mockResults[action]);

            /*
             * TODO: Real implementation:
             *
             * var mcpClient = // Get from dependency injection
             * var response = await mcpClient.AnalyzeClipboardAsync(new ClipboardContent
             * {
             *     Text = _clipboardContent,
             *     Action = action
             * });
             *
             * if (response.Success)
             * {
             *     ShowResult($"✅ {action}", response.Content);
             * }
             * else
             * {
             *     ShowResult("Error", response.Error);
             * }
             */
        }

        private void ShowResult(string title, string content)
        {
            ResultBorder.Visibility = Visibility.Visible;
            ResultTitle.Text = title;
            ResultText.Text = content;
            ActionProgressRing.IsActive = false;
            ActionProgressRing.Visibility = Visibility.Collapsed;
        }

        private void CopyResultButton_Click(object sender, RoutedEventArgs e)
        {
            var dataPackage = new Windows.ApplicationModel.DataTransfer.DataPackage();
            dataPackage.SetText(ResultText.Text);
            Windows.ApplicationModel.DataTransfer.Clipboard.SetContent(dataPackage);

            System.Diagnostics.Debug.WriteLine("📋 Result copied to clipboard");

            // TODO: Show toast notification
        }
    }
}
