# Claude CLI Integration Guide

## Overview

This document describes how to integrate **Claude CLI** (or GPT API) for AI-powered task prioritization in TaskFlow.

## Phase 1: Mock Implementation

Currently using `MockTaskPrioritizer` in `TaskFlow.Core/Services/MockTaskPrioritizer.cs`.

This uses a simple algorithm:
- Due date proximity
- "urgent" tag detection
- Source-based weighting (GitHub > Gmail > Trello)
- Quick-win detection (<15 min estimated)

## Phase 2: Claude CLI Integration

### Architecture

```
TaskFlow.Api
  └─> ITaskPrioritizer
       └─> ClaudeCliTaskPrioritizer (new)
            └─> Calls Claude CLI via Process
                 └─> Sends JSON + prompt
                 └─> Parses JSON response
```

### Implementation Steps

#### 1. Install Claude CLI

User must have Claude CLI installed and configured:

```bash
# Install (if not already)
npm install -g @anthropic-ai/claude

# Configure API key
claude config set api-key YOUR_API_KEY
```

#### 2. Create ClaudeCliTaskPrioritizer

Create `TaskFlow.Core/Services/ClaudeCliTaskPrioritizer.cs`:

```csharp
using System.Diagnostics;
using System.Text.Json;
using TaskFlow.Core.Interfaces;
using TaskFlow.Core.Models;

namespace TaskFlow.Core.Services;

public class ClaudeCliTaskPrioritizer : ITaskPrioritizer
{
    private readonly string _promptTemplatePath;

    public ClaudeCliTaskPrioritizer(string promptTemplatePath)
    {
        _promptTemplatePath = promptTemplatePath;
    }

    public async Task<List<TaskItem>> ReprioritizeAsync(List<TaskItem> tasks)
    {
        // 1. Load prompt template
        var promptTemplate = await File.ReadAllTextAsync(_promptTemplatePath);

        // 2. Serialize tasks to JSON
        var tasksJson = JsonSerializer.Serialize(tasks, new JsonSerializerOptions
        {
            WriteIndented = true
        });

        // 3. Build full prompt
        var fullPrompt = $"{promptTemplate}\n\nTasks to prioritize:\n{tasksJson}";

        // 4. Call Claude CLI
        var result = await CallClaudeCli(fullPrompt);

        // 5. Parse response
        var prioritizedTasks = ParseClaudeResponse(result, tasks);

        return prioritizedTasks;
    }

    private async Task<string> CallClaudeCli(string prompt)
    {
        var processInfo = new ProcessStartInfo
        {
            FileName = "claude",
            Arguments = $"--model claude-sonnet-4 --format json",
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = processInfo };
        process.Start();

        // Send prompt
        await process.StandardInput.WriteAsync(prompt);
        await process.StandardInput.FlushAsync();
        process.StandardInput.Close();

        // Read response
        var output = await process.StandardOutput.ReadToEndAsync();
        var error = await process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync();

        if (process.ExitCode != 0)
        {
            throw new Exception($"Claude CLI error: {error}");
        }

        return output;
    }

    private List<TaskItem> ParseClaudeResponse(string response, List<TaskItem> originalTasks)
    {
        // Parse JSON response from Claude
        // Expected format: [{ "id": 1, "priority": 1, "tags": [...], "reasoning": "..." }]

        var updates = JsonSerializer.Deserialize<List<TaskUpdate>>(response);

        if (updates == null)
            return originalTasks;

        // Apply updates to original tasks
        foreach (var update in updates)
        {
            var task = originalTasks.FirstOrDefault(t => t.Id == update.Id);
            if (task != null)
            {
                task.Priority = update.Priority;
                task.Tags = update.Tags.ToList();
                task.UpdatedAt = DateTime.UtcNow;
            }
        }

        return originalTasks.OrderBy(t => t.Priority).ToList();
    }

    private class TaskUpdate
    {
        public int Id { get; set; }
        public int Priority { get; set; }
        public string[] Tags { get; set; } = Array.Empty<string>();
        public string Reasoning { get; set; } = string.Empty;
    }
}
```

#### 3. Register in DI Container

In `TaskFlow.Api/Program.cs`:

```csharp
// Replace mock with Claude CLI prioritizer
var promptPath = Path.Combine(AppContext.BaseDirectory, "ai", "TaskPrioritizer.md");
builder.Services.AddScoped<ITaskPrioritizer>(
    sp => new ClaudeCliTaskPrioritizer(promptPath)
);
```

#### 4. Configuration

Add to `appsettings.json`:

```json
{
  "AiPrioritizer": {
    "Provider": "ClaudeCLI",  // or "Mock" or "GptApi"
    "Model": "claude-sonnet-4",
    "PromptPath": "./ai/TaskPrioritizer.md"
  }
}
```

### Alternative: GPT API Integration

Similar approach but using `HttpClient` to call OpenAI API directly:

```csharp
public class GptApiTaskPrioritizer : ITaskPrioritizer
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public async Task<List<TaskItem>> ReprioritizeAsync(List<TaskItem> tasks)
    {
        var request = new
        {
            model = "gpt-4",
            messages = new[]
            {
                new { role = "system", content = promptTemplate },
                new { role = "user", content = tasksJson }
            },
            response_format = new { type = "json_object" }
        };

        var response = await _httpClient.PostAsJsonAsync(
            "https://api.openai.com/v1/chat/completions",
            request
        );

        // Parse and return
    }
}
```

## Testing

### Manual Test

```bash
cd backend/dotnet
dotnet run --project TaskFlow.Api

# In another terminal
curl -X POST http://localhost:5000/api/tasks/prioritize
```

### Unit Tests

Create `TaskFlow.Tests/ClaudeCliTaskPrioritizerTests.cs`:

```csharp
[Fact]
public async Task ReprioritizeAsync_ShouldUpdatePriorities()
{
    // Arrange
    var prioritizer = new ClaudeCliTaskPrioritizer("./ai/TaskPrioritizer.md");
    var tasks = CreateMockTasks();

    // Act
    var result = await prioritizer.ReprioritizeAsync(tasks);

    // Assert
    Assert.NotEmpty(result);
    Assert.True(result.First().Priority <= 2); // Urgent tasks first
}
```

## Error Handling

- Claude CLI not installed → fallback to mock
- API rate limits → cache results for N minutes
- Invalid JSON response → log error, return original order
- Network timeout → retry with exponential backoff

## Performance Considerations

- **Cache**: Cache prioritization results for 1 hour
- **Batch**: Only reprioritize when user clicks button (not on every sync)
- **Async**: Run prioritization in background, show spinner in UI
- **Streaming**: For large task lists (>100), use streaming response

## Future Enhancements

1. **Context-Aware**: Send user's calendar, recent activity for smarter prioritization
2. **Learning**: Track which tasks user actually does first, learn patterns
3. **Explanations**: Show AI's reasoning in UI ("This is urgent because...")
4. **Auto-Scheduling**: Not just priority, but suggest specific time slots
5. **Multi-Agent**: Use Claude for analysis, GPT for creative tasks, etc.

## Security

- **API Keys**: Store in environment variables or Azure Key Vault
- **Input Sanitization**: Validate task data before sending to AI
- **Rate Limiting**: Prevent abuse of AI endpoints
- **Logging**: Don't log sensitive task content
