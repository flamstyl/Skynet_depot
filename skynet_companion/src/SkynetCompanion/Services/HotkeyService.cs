using System;
using System.Runtime.InteropServices;
using System.Windows.Input;
using Microsoft.UI.Xaml;

namespace SkynetCompanion.Services
{
    /// <summary>
    /// Global hotkey registration service using Win32 API
    /// </summary>
    public class HotkeyService : IDisposable
    {
        // Win32 API imports
        [DllImport("user32.dll")]
        private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

        [DllImport("user32.dll")]
        private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

        private const int HOTKEY_ID = 9000;
        private IntPtr _windowHandle;
        private bool _registered;

        // Modifier keys
        private const uint MOD_ALT = 0x0001;
        private const uint MOD_CONTROL = 0x0002;
        private const uint MOD_SHIFT = 0x0004;
        private const uint MOD_WIN = 0x0008;

        // Virtual key codes
        private const uint VK_SPACE = 0x20;

        public event EventHandler? HotkeyPressed;

        /// <summary>
        /// Register global hotkey (Ctrl+Space by default)
        /// </summary>
        public bool RegisterHotkey(IntPtr windowHandle)
        {
            _windowHandle = windowHandle;

            // Register Ctrl+Space
            _registered = RegisterHotKey(_windowHandle, HOTKEY_ID, MOD_CONTROL, VK_SPACE);

            if (_registered)
            {
                // TODO: Hook into WndProc to detect WM_HOTKEY message
                System.Diagnostics.Debug.WriteLine("✅ Hotkey Ctrl+Space registered successfully");
            }
            else
            {
                System.Diagnostics.Debug.WriteLine("❌ Failed to register hotkey");
            }

            return _registered;
        }

        /// <summary>
        /// Unregister hotkey
        /// </summary>
        public void UnregisterHotkey()
        {
            if (_registered)
            {
                UnregisterHotKey(_windowHandle, HOTKEY_ID);
                _registered = false;
                System.Diagnostics.Debug.WriteLine("🔓 Hotkey unregistered");
            }
        }

        /// <summary>
        /// Trigger hotkey event (called from WndProc)
        /// </summary>
        public void TriggerHotkey()
        {
            HotkeyPressed?.Invoke(this, EventArgs.Empty);
        }

        public void Dispose()
        {
            UnregisterHotkey();
        }
    }

    /// <summary>
    /// TODO: For WinUI3, need to use Win32 interop to hook WndProc
    /// Alternative: Use Windows.System.DispatcherQueue + native messaging
    /// Or use Microsoft.Toolkit.Uwp.UI.Helpers (if available)
    ///
    /// For MVP: Can use polling or focus-based hotkey detection
    /// </summary>
}
