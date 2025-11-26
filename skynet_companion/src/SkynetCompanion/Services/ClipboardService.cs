using System;
using System.Threading;
using System.Threading.Tasks;
using Windows.ApplicationModel.DataTransfer;
using SkynetCompanion.Models;

namespace SkynetCompanion.Services
{
    /// <summary>
    /// Service for monitoring Windows clipboard
    /// </summary>
    public class ClipboardService
    {
        private string _lastClipboardText = string.Empty;
        private Timer? _clipboardMonitorTimer;
        private bool _isMonitoring;

        public event EventHandler<ClipboardContent>? ClipboardChanged;

        /// <summary>
        /// Start monitoring clipboard
        /// </summary>
        public void StartMonitoring()
        {
            if (_isMonitoring) return;

            _isMonitoring = true;
            _clipboardMonitorTimer = new Timer(CheckClipboard, null, TimeSpan.Zero, TimeSpan.FromMilliseconds(500));
            System.Diagnostics.Debug.WriteLine("📋 Clipboard monitoring started");
        }

        /// <summary>
        /// Stop monitoring clipboard
        /// </summary>
        public void StopMonitoring()
        {
            _isMonitoring = false;
            _clipboardMonitorTimer?.Dispose();
            _clipboardMonitorTimer = null;
            System.Diagnostics.Debug.WriteLine("📋 Clipboard monitoring stopped");
        }

        /// <summary>
        /// Check clipboard for changes (polling)
        /// </summary>
        private async void CheckClipboard(object? state)
        {
            try
            {
                var currentText = await GetClipboardTextAsync();

                if (!string.IsNullOrEmpty(currentText) && currentText != _lastClipboardText)
                {
                    _lastClipboardText = currentText;

                    var clipboardContent = new ClipboardContent
                    {
                        Text = currentText,
                        Timestamp = DateTime.UtcNow
                    };

                    ClipboardChanged?.Invoke(this, clipboardContent);
                    System.Diagnostics.Debug.WriteLine($"📋 Clipboard changed: {currentText.Substring(0, Math.Min(50, currentText.Length))}...");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Clipboard check error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get text from clipboard
        /// </summary>
        public async Task<string> GetClipboardTextAsync()
        {
            try
            {
                var dataPackageView = Clipboard.GetContent();
                if (dataPackageView.Contains(StandardDataFormats.Text))
                {
                    return await dataPackageView.GetTextAsync();
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Get clipboard error: {ex.Message}");
            }

            return string.Empty;
        }

        /// <summary>
        /// Set text to clipboard
        /// </summary>
        public void SetClipboardText(string text)
        {
            try
            {
                var dataPackage = new DataPackage();
                dataPackage.SetText(text);
                Clipboard.SetContent(dataPackage);
                System.Diagnostics.Debug.WriteLine("📋 Text copied to clipboard");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Set clipboard error: {ex.Message}");
            }
        }

        /// <summary>
        /// Get last clipboard text (cached)
        /// </summary>
        public string GetLastText()
        {
            return _lastClipboardText;
        }

        /// <summary>
        /// Clear clipboard
        /// </summary>
        public void Clear()
        {
            try
            {
                Clipboard.Clear();
                _lastClipboardText = string.Empty;
                System.Diagnostics.Debug.WriteLine("📋 Clipboard cleared");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Clear clipboard error: {ex.Message}");
            }
        }
    }

    /*
     * TODO: Enhanced clipboard features
     *
     * 1. Clipboard History:
     *    - Store last N clipboard items
     *    - Display in UI for quick access
     *    - Persist to disk
     *
     * 2. Content Type Detection:
     *    - Text (plain, code, markdown)
     *    - Images (Bitmap)
     *    - Files (StorageItems)
     *    - HTML
     *
     * 3. Privacy Filters:
     *    - Detect sensitive patterns (passwords, API keys)
     *    - Blacklist certain apps
     *    - User-defined ignore patterns
     *
     * 4. Smart Actions:
     *    - Auto-detect URLs → "Open in browser"
     *    - Auto-detect code → "Explain code"
     *    - Auto-detect email → "Compose email"
     */
}
