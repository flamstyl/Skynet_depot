using System;
using System.Threading.Tasks;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace SkynetCompanion.Services
{
    /// <summary>
    /// Service for showing notifications and toasts
    /// </summary>
    public class NotificationService
    {
        /// <summary>
        /// Show info notification
        /// </summary>
        public static async Task ShowInfoAsync(string title, string message, int durationMs = 3000)
        {
            await ShowNotificationAsync(title, message, InfoBarSeverity.Informational, durationMs);
        }

        /// <summary>
        /// Show success notification
        /// </summary>
        public static async Task ShowSuccessAsync(string title, string message, int durationMs = 3000)
        {
            await ShowNotificationAsync(title, message, InfoBarSeverity.Success, durationMs);
        }

        /// <summary>
        /// Show warning notification
        /// </summary>
        public static async Task ShowWarningAsync(string title, string message, int durationMs = 4000)
        {
            await ShowNotificationAsync(title, message, InfoBarSeverity.Warning, durationMs);
        }

        /// <summary>
        /// Show error notification
        /// </summary>
        public static async Task ShowErrorAsync(string title, string message, int durationMs = 5000)
        {
            await ShowNotificationAsync(title, message, InfoBarSeverity.Error, durationMs);
        }

        /// <summary>
        /// Show notification with custom severity
        /// </summary>
        private static async Task ShowNotificationAsync(string title, string message, InfoBarSeverity severity, int durationMs)
        {
            System.Diagnostics.Debug.WriteLine($"[Notification] {severity}: {title} - {message}");

            // TODO: Implement actual toast notifications using:
            // - Windows.UI.Notifications.ToastNotificationManager (Windows 10+)
            // - Or in-app InfoBar notification
            //
            // For now, just log to debug output

            await Task.Delay(durationMs);
        }

        /// <summary>
        /// Show toast notification (Windows native)
        /// </summary>
        public static void ShowToast(string title, string message, string iconEmoji = "🤖")
        {
            try
            {
                // TODO: Implement Windows toast notifications
                // Using Windows.UI.Notifications.ToastNotificationManager
                //
                // Example:
                // var toastXml = ToastNotificationManager.GetTemplateContent(ToastTemplateType.ToastText02);
                // var toastTextElements = toastXml.GetElementsByTagName("text");
                // toastTextElements[0].AppendChild(toastXml.CreateTextNode(title));
                // toastTextElements[1].AppendChild(toastXml.CreateTextNode(message));
                //
                // var toast = new ToastNotification(toastXml);
                // ToastNotificationManager.CreateToastNotifier("Skynet Companion").Show(toast);

                System.Diagnostics.Debug.WriteLine($"🔔 Toast: {iconEmoji} {title} - {message}");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Toast notification error: {ex.Message}");
            }
        }

        /// <summary>
        /// Show clipboard detection notification
        /// </summary>
        public static void NotifyClipboardChange(string preview)
        {
            var shortPreview = preview.Length > 50 ? preview.Substring(0, 50) + "..." : preview;
            ShowToast("Clipboard Updated", shortPreview, "📋");
        }

        /// <summary>
        /// Show voice activation notification
        /// </summary>
        public static void NotifyVoiceActivated()
        {
            ShowToast("Listening...", "Speak your query now", "🎤");
        }

        /// <summary>
        /// Show response ready notification
        /// </summary>
        public static void NotifyResponseReady(string agent)
        {
            ShowToast("Response Ready", $"Got response from {agent}", "✅");
        }

        /// <summary>
        /// Show error notification
        /// </summary>
        public static void NotifyError(string error)
        {
            ShowToast("Error", error, "❌");
        }
    }

    /*
     * TODO: Full Windows Toast Notifications
     *
     * For production, implement using:
     *
     * 1. Package name registration in Package.appxmanifest
     *
     * 2. Toast notification code:
     *
     * using Windows.UI.Notifications;
     * using Windows.Data.Xml.Dom;
     *
     * var toastXml = new XmlDocument();
     * toastXml.LoadXml($@"
     *     <toast>
     *         <visual>
     *             <binding template='ToastGeneric'>
     *                 <text>{title}</text>
     *                 <text>{message}</text>
     *             </binding>
     *         </visual>
     *         <actions>
     *             <action content='Open' arguments='open' />
     *             <action content='Dismiss' arguments='dismiss' />
     *         </actions>
     *     </toast>
     * ");
     *
     * var toast = new ToastNotification(toastXml);
     * ToastNotificationManager.CreateToastNotifier("Skynet.Companion").Show(toast);
     *
     * 3. Handle toast activation in App.xaml.cs:
     *
     * protected override void OnActivated(IActivatedEventArgs args)
     * {
     *     if (args is ToastNotificationActivatedEventArgs toastArgs)
     *     {
     *         // Handle toast click
     *     }
     * }
     */
}
