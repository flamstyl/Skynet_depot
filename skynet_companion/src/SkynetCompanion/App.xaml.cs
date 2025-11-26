using Microsoft.UI.Xaml;
using SkynetCompanion.Windows;
using SkynetCompanion.Services;

namespace SkynetCompanion
{
    /// <summary>
    /// Provides application-specific behavior to supplement the default Application class.
    /// </summary>
    public partial class App : Application
    {
        private Window? m_window;
        private OverlayWindow? m_overlayWindow;

        // Services
        private MCPClient? _mcpClient;
        private ClipboardService? _clipboardService;
        private MemoryService? _memoryService;
        private HotkeyService? _hotkeyService;
        private WhisperService? _whisperService;

        public App()
        {
            this.InitializeComponent();
        }

        /// <summary>
        /// Invoked when the application is launched.
        /// </summary>
        protected override void OnLaunched(Microsoft.UI.Xaml.LaunchActivatedEventArgs args)
        {
            // Initialize services
            _mcpClient = new MCPClient("http://localhost:8765");
            _clipboardService = new ClipboardService();
            _memoryService = new MemoryService(_mcpClient);
            _hotkeyService = new HotkeyService();
            _whisperService = new WhisperService();

            // Create main window (hidden, tray icon)
            m_window = new MainWindow();
            m_window.Activate();

            // Create overlay window (always on top)
            m_overlayWindow = new OverlayWindow(
                _mcpClient,
                _clipboardService,
                _memoryService,
                _hotkeyService,
                _whisperService
            );
            m_overlayWindow.Activate();

            System.Diagnostics.Debug.WriteLine("🚀 Skynet Companion launched!");
        }
    }
}
