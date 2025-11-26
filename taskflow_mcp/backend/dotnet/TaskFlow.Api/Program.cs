using Microsoft.EntityFrameworkCore;
using TaskFlow.Core.Interfaces;
using TaskFlow.Core.Models;
using TaskFlow.Core.Services;
using TaskFlow.Data;
using TaskFlow.Data.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add DbContext with SQLite
builder.Services.AddDbContext<TaskFlowContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=taskflow.db"));

// Register repositories and services
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskPrioritizer, MockTaskPrioritizer>();
builder.Services.AddHttpClient(); // For MCP client

var app = builder.Build();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TaskFlowContext>();
    db.Database.EnsureCreated();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

// ========== TASKS ENDPOINTS ==========

app.MapGet("/api/tasks", async (ITaskRepository repo, string? source, string? status, string? tag) =>
{
    if (!string.IsNullOrEmpty(source) || !string.IsNullOrEmpty(status) || !string.IsNullOrEmpty(tag))
    {
        return Results.Ok(await repo.GetByFilterAsync(source, status, tag));
    }
    return Results.Ok(await repo.GetAllAsync());
})
.WithName("GetTasks")
.WithOpenApi();

app.MapGet("/api/tasks/{id}", async (int id, ITaskRepository repo) =>
{
    var task = await repo.GetByIdAsync(id);
    return task is not null ? Results.Ok(task) : Results.NotFound();
})
.WithName("GetTaskById")
.WithOpenApi();

app.MapPost("/api/tasks", async (TaskItem task, ITaskRepository repo) =>
{
    var created = await repo.CreateAsync(task);
    return Results.Created($"/api/tasks/{created.Id}", created);
})
.WithName("CreateTask")
.WithOpenApi();

app.MapPut("/api/tasks/{id}", async (int id, TaskItem task, ITaskRepository repo) =>
{
    var existing = await repo.GetByIdAsync(id);
    if (existing is null)
        return Results.NotFound();

    task.Id = id;
    var updated = await repo.UpdateAsync(task);
    return Results.Ok(updated);
})
.WithName("UpdateTask")
.WithOpenApi();

app.MapDelete("/api/tasks/{id}", async (int id, ITaskRepository repo) =>
{
    await repo.DeleteAsync(id);
    return Results.NoContent();
})
.WithName("DeleteTask")
.WithOpenApi();

// ========== SYNC ENDPOINT ==========

app.MapPost("/api/sync", async (ITaskRepository repo, IHttpClientFactory httpClientFactory) =>
{
    try
    {
        var client = httpClientFactory.CreateClient();
        var mcpUrl = builder.Configuration["McpServer:Url"] ?? "http://localhost:3000";

        // Call MCP server to fetch all tasks
        var response = await client.PostAsync($"{mcpUrl}/fetch-all", null);

        if (!response.IsSuccessStatusCode)
        {
            return Results.Problem("Failed to sync with MCP server");
        }

        var mcpResponse = await response.Content.ReadFromJsonAsync<McpFetchResponse>();

        if (mcpResponse?.Tasks == null)
        {
            return Results.Ok(new { synced = 0, message = "No tasks received from MCP" });
        }

        int syncedCount = 0;
        foreach (var mcpTask in mcpResponse.Tasks)
        {
            // Check if task already exists
            var existing = await repo.GetByExternalIdAsync(mcpTask.Source, mcpTask.ExternalId ?? "");

            if (existing == null)
            {
                // Create new task
                await repo.CreateAsync(new TaskItem
                {
                    Title = mcpTask.Title,
                    Description = mcpTask.Description,
                    Source = mcpTask.Source,
                    ExternalId = mcpTask.ExternalId,
                    ExternalUrl = mcpTask.Url,
                    Status = mcpTask.Status,
                    Priority = mcpTask.PriorityGuess,
                    Tags = mcpTask.Tags.ToList(),
                    DueDate = mcpTask.DueDate
                });
                syncedCount++;
            }
            else
            {
                // Update existing task if needed
                existing.Title = mcpTask.Title;
                existing.Description = mcpTask.Description;
                existing.Status = mcpTask.Status;
                existing.Tags = mcpTask.Tags.ToList();
                existing.DueDate = mcpTask.DueDate;
                await repo.UpdateAsync(existing);
            }
        }

        return Results.Ok(new { synced = syncedCount, total = mcpResponse.Tasks.Length, message = $"Synced {syncedCount} new tasks" });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Sync failed: {ex.Message}");
    }
})
.WithName("SyncTasks")
.WithOpenApi();

// ========== PRIORITIZE ENDPOINT ==========

app.MapPost("/api/tasks/prioritize", async (ITaskRepository repo, ITaskPrioritizer prioritizer) =>
{
    try
    {
        // Get all non-completed tasks
        var tasks = await repo.GetByFilterAsync(status: "Todo");
        var inProgressTasks = await repo.GetByFilterAsync(status: "InProgress");
        tasks.AddRange(inProgressTasks);

        if (tasks.Count == 0)
        {
            return Results.Ok(new { message = "No tasks to prioritize" });
        }

        // Reprioritize
        var prioritized = await prioritizer.ReprioritizeAsync(tasks);

        // Update tasks in database
        foreach (var task in prioritized)
        {
            await repo.UpdateAsync(task);
        }

        return Results.Ok(new {
            message = $"Reprioritized {prioritized.Count} tasks",
            tasks = prioritized
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Prioritization failed: {ex.Message}");
    }
})
.WithName("PrioritizeTasks")
.WithOpenApi();

// ========== POMODORO ENDPOINTS ==========

// TODO: Implement Pomodoro endpoints in Phase 2
app.MapGet("/api/pomodoro/state", () =>
{
    return Results.Ok(new {
        isActive = false,
        taskId = (int?)null,
        remainingSeconds = 0
    });
})
.WithName("GetPomodoroState")
.WithOpenApi();

// ========== SOURCES ENDPOINTS ==========

app.MapGet("/api/sources", () =>
{
    // TODO: Implement sources management in Phase 2
    return Results.Ok(new[] {
        new { name = "Gmail", type = "gmail", isEnabled = true },
        new { name = "GitHub", type = "github", isEnabled = true },
        new { name = "Trello", type = "trello", isEnabled = true },
        new { name = "Notion", type = "notion", isEnabled = false },
        new { name = "Slack", type = "slack", isEnabled = false }
    });
})
.WithName("GetSources")
.WithOpenApi();

app.Run();

// ========== DTOs ==========

record McpFetchResponse(McpTaskDto[] Tasks);

record McpTaskDto(
    string Title,
    string Description,
    string Source,
    string? ExternalId,
    string Status,
    int PriorityGuess,
    string[] Tags,
    DateTime? DueDate,
    string? Url
);
