using Microsoft.EntityFrameworkCore;
using TaskFlow.Core.Models;

namespace TaskFlow.Data;

public class TaskFlowContext : DbContext
{
    public TaskFlowContext(DbContextOptions<TaskFlowContext> options) : base(options)
    {
    }

    public DbSet<TaskItem> Tasks { get; set; } = null!;
    public DbSet<PomodoroSession> PomodoroSessions { get; set; } = null!;
    public DbSet<IntegrationSource> Sources { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // TaskItem configuration
        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Source).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);

            // Store Tags as JSON
            entity.Property(e => e.Tags)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                );

            // Indexes for common queries
            entity.HasIndex(e => e.Source);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => new { e.Source, e.ExternalId }).IsUnique();
        });

        // PomodoroSession configuration
        modelBuilder.Entity<PomodoroSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Task)
                .WithMany(t => t.PomodoroSessions)
                .HasForeignKey(e => e.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // IntegrationSource configuration
        modelBuilder.Entity<IntegrationSource>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Type);
        });
    }
}
