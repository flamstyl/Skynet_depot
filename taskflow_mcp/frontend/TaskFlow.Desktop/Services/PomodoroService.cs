namespace TaskFlow.Desktop.Services;

public class PomodoroService
{
    private int? _currentTaskId;
    private DateTime? _startTime;
    private TimeSpan _duration = TimeSpan.FromMinutes(25);

    public bool IsActive => _startTime.HasValue;
    public int? CurrentTaskId => _currentTaskId;
    public TimeSpan RemainingTime
    {
        get
        {
            if (!_startTime.HasValue)
                return _duration;

            var elapsed = DateTime.UtcNow - _startTime.Value;
            var remaining = _duration - elapsed;
            return remaining > TimeSpan.Zero ? remaining : TimeSpan.Zero;
        }
    }

    public void Start(int taskId, TimeSpan? duration = null)
    {
        _currentTaskId = taskId;
        _startTime = DateTime.UtcNow;
        _duration = duration ?? TimeSpan.FromMinutes(25);

        // TODO: Call API to create PomodoroSession
        System.Diagnostics.Debug.WriteLine($"Pomodoro started for task {taskId}");
    }

    public void Stop()
    {
        if (_startTime.HasValue)
        {
            var elapsed = DateTime.UtcNow - _startTime.Value;
            System.Diagnostics.Debug.WriteLine($"Pomodoro stopped after {elapsed.TotalMinutes:F1} minutes");

            // TODO: Call API to complete PomodoroSession
        }

        _currentTaskId = null;
        _startTime = null;
    }

    public void SetDuration(TimeSpan duration)
    {
        _duration = duration;
    }
}
