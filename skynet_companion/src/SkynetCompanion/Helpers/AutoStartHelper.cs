using System;
using System.IO;
using System.Reflection;
using Microsoft.Win32;

namespace SkynetCompanion.Helpers
{
    /// <summary>
    /// Helper for Windows auto-start functionality
    /// </summary>
    public static class AutoStartHelper
    {
        private const string RegistryKey = @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run";
        private const string AppName = "SkynetCompanion";

        /// <summary>
        /// Enable auto-start on Windows boot
        /// </summary>
        public static bool EnableAutoStart()
        {
            try
            {
                var exePath = Assembly.GetExecutingAssembly().Location.Replace(".dll", ".exe");

                if (!File.Exists(exePath))
                {
                    // Fallback to current process path
                    exePath = Environment.ProcessPath ?? exePath;
                }

                using var key = Registry.CurrentUser.OpenSubKey(RegistryKey, true);
                key?.SetValue(AppName, $"\"{exePath}\"");

                System.Diagnostics.Debug.WriteLine($"✅ Auto-start enabled: {exePath}");
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Auto-start enable failed: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Disable auto-start
        /// </summary>
        public static bool DisableAutoStart()
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(RegistryKey, true);
                key?.DeleteValue(AppName, false);

                System.Diagnostics.Debug.WriteLine("✅ Auto-start disabled");
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Auto-start disable failed: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Check if auto-start is enabled
        /// </summary>
        public static bool IsAutoStartEnabled()
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(RegistryKey, false);
                var value = key?.GetValue(AppName);
                return value != null;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Toggle auto-start
        /// </summary>
        public static bool ToggleAutoStart()
        {
            if (IsAutoStartEnabled())
            {
                return DisableAutoStart();
            }
            else
            {
                return EnableAutoStart();
            }
        }
    }

    /*
     * Usage in Settings UI:
     *
     * <CheckBox
     *     Content="Start with Windows"
     *     IsChecked="{x:Bind AutoStartHelper.IsAutoStartEnabled()}"
     *     Checked="AutoStart_Checked"
     *     Unchecked="AutoStart_Unchecked"/>
     *
     * private void AutoStart_Checked(object sender, RoutedEventArgs e)
     * {
     *     AutoStartHelper.EnableAutoStart();
     * }
     *
     * private void AutoStart_Unchecked(object sender, RoutedEventArgs e)
     * {
     *     AutoStartHelper.DisableAutoStart();
     * }
     */
}
