using System;
using Microsoft.UI.Xaml;
using WinRT.Interop;

namespace SkynetCompanion.Helpers
{
    /// <summary>
    /// Helper for WinUI3 window management
    /// </summary>
    public static class WindowHelper
    {
        /// <summary>
        /// Get the HWND (native window handle) for a WinUI Window
        /// </summary>
        public static IntPtr GetWindowHandle(Window window)
        {
            return WindowNative.GetWindowHandle(window);
        }

        /// <summary>
        /// Setup overlay window behavior (always-on-top, opacity, etc.)
        /// </summary>
        public static void SetupOverlayWindow(Window window, double opacity = 0.95)
        {
            var hwnd = GetWindowHandle(window);

            // Set always on top
            Win32Helper.SetAlwaysOnTop(hwnd, true);

            // Set opacity (convert 0-1 to 0-255)
            byte alpha = (byte)(opacity * 255);
            Win32Helper.SetWindowOpacity(hwnd, alpha);

            // Set rounded corners (Windows 11)
            Win32Helper.SetRoundedCorners(hwnd, Win32Helper.DWM_WINDOW_CORNER_PREFERENCE.DWMWCP_ROUND);
        }

        /// <summary>
        /// Position window at specific screen location
        /// </summary>
        public static void PositionWindow(Window window, WindowPosition position, int width, int height)
        {
            var hwnd = GetWindowHandle(window);
            var screen = Win32Helper.GetScreenBounds();

            int x, y;

            switch (position)
            {
                case WindowPosition.TopRight:
                    x = screen.Right - width - 20;
                    y = 20;
                    break;

                case WindowPosition.TopLeft:
                    x = 20;
                    y = 20;
                    break;

                case WindowPosition.BottomRight:
                    x = screen.Right - width - 20;
                    y = screen.Bottom - height - 20;
                    break;

                case WindowPosition.BottomLeft:
                    x = 20;
                    y = screen.Bottom - height - 20;
                    break;

                case WindowPosition.Center:
                default:
                    x = (screen.Right - width) / 2;
                    y = (screen.Bottom - height) / 2;
                    break;
            }

            Win32Helper.SetWindowPos(hwnd, IntPtr.Zero, x, y, width, height, Win32Helper.SWP_SHOWWINDOW);
        }

        /// <summary>
        /// Move window to specific coordinates
        /// </summary>
        public static void MoveWindow(Window window, int x, int y)
        {
            var hwnd = GetWindowHandle(window);
            Win32Helper.SetWindowPos(hwnd, IntPtr.Zero, x, y, 0, 0, Win32Helper.SWP_NOSIZE | Win32Helper.SWP_SHOWWINDOW);
        }

        /// <summary>
        /// Get current window position
        /// </summary>
        public static (int x, int y, int width, int height) GetWindowBounds(Window window)
        {
            var hwnd = GetWindowHandle(window);
            Win32Helper.GetWindowRect(hwnd, out var rect);
            return (rect.Left, rect.Top, rect.Width, rect.Height);
        }
    }

    public enum WindowPosition
    {
        TopLeft,
        TopRight,
        BottomLeft,
        BottomRight,
        Center
    }
}
