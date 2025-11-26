using Microsoft.UI.Xaml;
using TaskFlow.Desktop.Services;

namespace TaskFlow.Desktop;

public partial class App : Application
{
    public static TaskService TaskService { get; private set; } = null!;
    public static PomodoroService PomodoroService { get; private set; } = null!;

    public App()
    {
        this.InitializeComponent();

        // Initialize services
        TaskService = new TaskService("http://localhost:5000");
        PomodoroService = new PomodoroService();
    }

    protected override void OnLaunched(Microsoft.UI.Xaml.LaunchActivatedEventArgs args)
    {
        m_window = new MainWindow();
        m_window.Activate();
    }

    private Window? m_window;
}
