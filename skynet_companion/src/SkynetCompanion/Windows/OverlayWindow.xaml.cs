using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using SkynetCompanion.Services;
using SkynetCompanion.Models;
using System;

namespace SkynetCompanion.Windows
{
    /// <summary>
    /// Overlay window - always on top, semi-transparent, draggable
    /// </summary>
    public sealed partial class OverlayWindow : Window
    {
        private readonly MCPClient _mcpClient;
        private readonly ClipboardService _clipboardService;
        private readonly MemoryService _memoryService;
        private readonly HotkeyService _hotkeyService;
        private readonly WhisperService _whisperService;

        private bool _isMinimized = false;
        private double _windowWidth = 400;
        private double _windowHeight = 600;

        public OverlayWindow(
            MCPClient mcpClient,
            ClipboardService clipboardService,
            MemoryService memoryService,
            HotkeyService hotkeyService,
            WhisperService whisperService)
        {
            this.InitializeComponent();

            _mcpClient = mcpClient;
            _clipboardService = clipboardService;
            _memoryService = memoryService;
            _hotkeyService = hotkeyService;
            _whisperService = whisperService;

            InitializeServices();
            SetupWindow();
        }

        private void InitializeServices()
        {
            // Subscribe to clipboard changes
            _clipboardService.ClipboardChanged += OnClipboardChanged;
            _clipboardService.StartMonitoring();

            // Subscribe to hotkey events
            _hotkeyService.HotkeyPressed += OnHotkeyPressed;
            // TODO: Register hotkey with window handle

            // Subscribe to whisper events
            _whisperService.TranscriptionReady += OnTranscriptionReady;

            System.Diagnostics.Debug.WriteLine("✅ Services initialized");
        }

        private void SetupWindow()
        {
            // TODO: Set window always-on-top using Win32 interop
            // TODO: Set initial position (top-right corner)
            // TODO: Make window semi-transparent
            // TODO: Disable window chrome (custom titlebar)

            System.Diagnostics.Debug.WriteLine("🪟 Overlay window setup complete");
        }

        // === Event Handlers ===

        private void OnClipboardChanged(object? sender, ClipboardContent content)
        {
            System.Diagnostics.Debug.WriteLine($"📋 Clipboard: {content.Text.Substring(0, Math.Min(50, content.Text.Length))}");

            // TODO: Show notification or quick-actions panel
            // TODO: Optionally auto-analyze based on settings
        }

        private async void OnHotkeyPressed(object? sender, EventArgs e)
        {
            System.Diagnostics.Debug.WriteLine("🎹 Hotkey pressed!");

            // Show listening indicator
            ListeningIndicator.Visibility = Visibility.Visible;

            // Start recording
            _whisperService.StartRecording();

            // TODO: Auto-stop after silence detection or manual trigger
            await System.Threading.Tasks.Task.Delay(3000); // Mock: 3 seconds

            // Stop recording and get transcription
            var transcription = await _whisperService.StopRecordingAsync();

            // Hide listening indicator
            ListeningIndicator.Visibility = Visibility.Collapsed;
        }

        private async void OnTranscriptionReady(object? sender, string transcription)
        {
            System.Diagnostics.Debug.WriteLine($"🎤 Transcription: {transcription}");

            // Send to MCP
            var response = await _mcpClient.ProcessVoiceQueryAsync(transcription);

            if (response.Success)
            {
                // Display response in chat panel
                ChatPanel.AddMessage("Assistant", response.Content);

                // Save to memory
                await _memoryService.AddMemoryAsync(new MemoryEntry
                {
                    Content = transcription,
                    Summary = response.Content.Substring(0, Math.Min(100, response.Content.Length)),
                    Tags = new System.Collections.Generic.List<string> { "voice", "query" },
                    Source = "voice",
                    Agent = response.Agent
                });
            }
            else
            {
                ChatPanel.AddMessage("Error", response.Error ?? "Unknown error");
            }
        }

        // === Window Manipulation ===

        private void HeaderGrid_ManipulationStarted(object sender, ManipulationStartedRoutedEventArgs e)
        {
            // TODO: Start dragging window
            System.Diagnostics.Debug.WriteLine("Drag started");
        }

        private void HeaderGrid_ManipulationDelta(object sender, ManipulationDeltaRoutedEventArgs e)
        {
            // TODO: Move window based on delta
            // var translation = e.Delta.Translation;
            // Move window by (translation.X, translation.Y)
        }

        private void MinimizeButton_Click(object sender, RoutedEventArgs e)
        {
            if (_isMinimized)
            {
                // Restore
                RootGrid.Width = _windowWidth;
                RootGrid.Height = _windowHeight;
                ContentGrid.Visibility = Visibility.Visible;
                _isMinimized = false;
            }
            else
            {
                // Minimize to small bubble
                RootGrid.Width = 150;
                RootGrid.Height = 50;
                ContentGrid.Visibility = Visibility.Collapsed;
                _isMinimized = true;
            }
        }

        // === Tab Navigation ===

        private void ChatTabButton_Click(object sender, RoutedEventArgs e)
        {
            ShowPanel(ChatPanel);
        }

        private void ActionsTabButton_Click(object sender, RoutedEventArgs e)
        {
            ShowPanel(QuickActionsPanel);
        }

        private void MemoryTabButton_Click(object sender, RoutedEventArgs e)
        {
            ShowPanel(MemoryPanelControl);
        }

        private void ShowPanel(UIElement panel)
        {
            ChatPanel.Visibility = Visibility.Collapsed;
            QuickActionsPanel.Visibility = Visibility.Collapsed;
            MemoryPanelControl.Visibility = Visibility.Collapsed;

            panel.Visibility = Visibility.Visible;
        }
    }
}

/*
 * TODO: Window positioning and behavior
 *
 * 1. Always-on-top using Win32:
 *    [DllImport("user32.dll")]
 *    static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, ...);
 *
 *    IntPtr HWND_TOPMOST = new IntPtr(-1);
 *    SetWindowPos(hwnd, HWND_TOPMOST, x, y, width, height, flags);
 *
 * 2. Dragging without titlebar:
 *    - Use ReleasePointerCapture/CapturePointer on header
 *    - Track pointer position changes
 *    - Use AppWindow.Move() or Win32 SetWindowPos
 *
 * 3. Semi-transparency:
 *    - Already done via Grid Background Opacity
 *    - Can also use Window.SystemBackdrop for acrylic/mica
 *
 * 4. Click-through regions (advanced):
 *    - Set WS_EX_TRANSPARENT on specific regions
 *    - Allow clicks to pass through when minimized
 */
