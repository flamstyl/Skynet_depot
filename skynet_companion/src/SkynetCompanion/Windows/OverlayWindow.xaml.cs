using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using SkynetCompanion.Services;
using SkynetCompanion.Models;
using SkynetCompanion.Helpers;
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

        // Dragging state
        private bool _isDragging = false;
        private Windows.Graphics.PointInt32 _dragStartPoint;

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
            // Setup overlay behavior (always-on-top, opacity)
            WindowHelper.SetupOverlayWindow(this, opacity: 0.95);

            // Position window at top-right
            WindowHelper.PositionWindow(this, WindowPosition.TopRight, (int)_windowWidth, (int)_windowHeight);

            // Register hotkey with window handle
            var hwnd = WindowHelper.GetWindowHandle(this);
            _hotkeyService.RegisterHotkey(hwnd);

            System.Diagnostics.Debug.WriteLine("✅ Overlay window setup complete (always-on-top, positioned)");
        }

        // === Event Handlers ===

        private void OnClipboardChanged(object? sender, ClipboardContent content)
        {
            System.Diagnostics.Debug.WriteLine($"📋 Clipboard: {content.Text.Substring(0, Math.Min(50, content.Text.Length))}");

            // Update quick actions panel with clipboard content
            QuickActionsPanel.UpdateClipboardPreview(content.Text);

            // Switch to actions panel to show suggestions
            if (!_isMinimized)
            {
                ShowPanel(QuickActionsPanel);
            }
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
            _isDragging = true;
            var bounds = WindowHelper.GetWindowBounds(this);
            _dragStartPoint = new Windows.Graphics.PointInt32(bounds.x, bounds.y);
            System.Diagnostics.Debug.WriteLine("🖱️ Drag started");
        }

        private void HeaderGrid_ManipulationDelta(object sender, ManipulationDeltaRoutedEventArgs e)
        {
            if (!_isDragging) return;

            var bounds = WindowHelper.GetWindowBounds(this);
            int newX = bounds.x + (int)e.Delta.Translation.X;
            int newY = bounds.y + (int)e.Delta.Translation.Y;

            WindowHelper.MoveWindow(this, newX, newY);
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
        /// <summary>
        /// Update window position to a preset
        /// </summary>
        public void SetPosition(WindowPosition position)
        {
            WindowHelper.PositionWindow(this, position, (int)_windowWidth, (int)_windowHeight);
        }

        /// <summary>
        /// Toggle always-on-top
        /// </summary>
        public void ToggleAlwaysOnTop(bool enabled)
        {
            var hwnd = WindowHelper.GetWindowHandle(this);
            Win32Helper.SetAlwaysOnTop(hwnd, enabled);
        }
    }
}
