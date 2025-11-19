using System;
using System.Runtime.InteropServices;

namespace SkynetCompanion.Helpers
{
    /// <summary>
    /// Win32 interop for window positioning and behavior
    /// </summary>
    public static class Win32Helper
    {
        // Window styles
        public const int GWL_EXSTYLE = -20;
        public const int WS_EX_TOPMOST = 0x00000008;
        public const int WS_EX_LAYERED = 0x00080000;
        public const int WS_EX_TRANSPARENT = 0x00000020;

        // Window positioning
        public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
        public static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);

        public const uint SWP_NOSIZE = 0x0001;
        public const uint SWP_NOMOVE = 0x0002;
        public const uint SWP_SHOWWINDOW = 0x0040;

        // DWM (Desktop Window Manager)
        public enum DWMWINDOWATTRIBUTE
        {
            DWMWA_WINDOW_CORNER_PREFERENCE = 33
        }

        public enum DWM_WINDOW_CORNER_PREFERENCE
        {
            DWMWCP_DEFAULT = 0,
            DWMWCP_DONOTROUND = 1,
            DWMWCP_ROUND = 2,
            DWMWCP_ROUNDSMALL = 3
        }

        // P/Invoke declarations
        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr GetActiveWindow();

        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool SetWindowPos(
            IntPtr hWnd,
            IntPtr hWndInsertAfter,
            int X,
            int Y,
            int cx,
            int cy,
            uint uFlags);

        [DllImport("user32.dll")]
        public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll")]
        public static extern bool SetLayeredWindowAttributes(
            IntPtr hwnd,
            uint crKey,
            byte bAlpha,
            uint dwFlags);

        [DllImport("dwmapi.dll")]
        public static extern int DwmSetWindowAttribute(
            IntPtr hwnd,
            DWMWINDOWATTRIBUTE dwAttribute,
            ref int pvAttribute,
            int cbAttribute);

        [StructLayout(LayoutKind.Sequential)]
        public struct RECT
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;

            public int Width => Right - Left;
            public int Height => Bottom - Top;
        }

        // Helper methods

        /// <summary>
        /// Set window to always be on top
        /// </summary>
        public static bool SetAlwaysOnTop(IntPtr hwnd, bool alwaysOnTop)
        {
            var insertAfter = alwaysOnTop ? HWND_TOPMOST : HWND_NOTOPMOST;
            return SetWindowPos(hwnd, insertAfter, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
        }

        /// <summary>
        /// Set window opacity (0-255)
        /// </summary>
        public static bool SetWindowOpacity(IntPtr hwnd, byte opacity)
        {
            const uint LWA_ALPHA = 0x2;

            // Add layered window style
            int exStyle = GetWindowLong(hwnd, GWL_EXSTYLE);
            SetWindowLong(hwnd, GWL_EXSTYLE, exStyle | WS_EX_LAYERED);

            return SetLayeredWindowAttributes(hwnd, 0, opacity, LWA_ALPHA);
        }

        /// <summary>
        /// Set rounded corners for window (Windows 11)
        /// </summary>
        public static void SetRoundedCorners(IntPtr hwnd, DWM_WINDOW_CORNER_PREFERENCE preference)
        {
            int pref = (int)preference;
            DwmSetWindowAttribute(hwnd, DWMWINDOWATTRIBUTE.DWMWA_WINDOW_CORNER_PREFERENCE, ref pref, sizeof(int));
        }

        /// <summary>
        /// Make window click-through in specific areas
        /// </summary>
        public static bool SetClickThrough(IntPtr hwnd, bool clickThrough)
        {
            int exStyle = GetWindowLong(hwnd, GWL_EXSTYLE);

            if (clickThrough)
            {
                exStyle |= WS_EX_TRANSPARENT;
            }
            else
            {
                exStyle &= ~WS_EX_TRANSPARENT;
            }

            SetWindowLong(hwnd, GWL_EXSTYLE, exStyle);
            return true;
        }

        /// <summary>
        /// Get screen bounds
        /// </summary>
        public static RECT GetScreenBounds()
        {
            var screen = Microsoft.UI.Windowing.DisplayArea.Primary;
            return new RECT
            {
                Left = 0,
                Top = 0,
                Right = screen.WorkArea.Width,
                Bottom = screen.WorkArea.Height
            };
        }
    }
}
