using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using SkynetCompanion.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SkynetCompanion.Controls
{
    public sealed partial class MemoryPanel : UserControl
    {
        private List<MemoryEntry> _allMemories = new();

        public MemoryPanel()
        {
            this.InitializeComponent();
            _ = LoadMemoriesAsync(); // Fire and forget
        }

        /// <summary>
        /// Load memories from service
        /// </summary>
        private async System.Threading.Tasks.Task LoadMemoriesAsync()
        {
            // TODO: Get MemoryService from dependency injection
            // var memoryService = ...
            // _allMemories = await memoryService.GetRecentMemoriesAsync(50);

            // Mock data for now
            await System.Threading.Tasks.Task.Delay(100);

            _allMemories = new List<MemoryEntry>
            {
                new MemoryEntry
                {
                    Content = "Explained how to use MCP server integration",
                    Summary = "MCP server integration guide",
                    Tags = new List<string> { "chat", "technical" },
                    Source = "chat",
                    Agent = "claude",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-30)
                },
                new MemoryEntry
                {
                    Content = "Translated French text to English",
                    Summary = "Translation task",
                    Tags = new List<string> { "clipboard", "translation" },
                    Source = "clipboard",
                    Agent = "gpt",
                    CreatedAt = DateTime.UtcNow.AddHours(-2)
                }
            };

            RefreshMemoriesDisplay(_allMemories);
        }

        /// <summary>
        /// Refresh the displayed memories
        /// </summary>
        private void RefreshMemoriesDisplay(List<MemoryEntry> memories)
        {
            MemoriesPanel.Children.Clear();

            if (memories.Count == 0)
            {
                EmptyState.Visibility = Visibility.Visible;
                MemoryCountText.Text = "(0 entries)";
                return;
            }

            EmptyState.Visibility = Visibility.Collapsed;
            MemoryCountText.Text = $"({memories.Count} entries)";

            foreach (var memory in memories.OrderByDescending(m => m.CreatedAt))
            {
                var memoryCard = CreateMemoryCard(memory);
                MemoriesPanel.Children.Add(memoryCard);
            }
        }

        /// <summary>
        /// Create a memory card UI element
        /// </summary>
        private Border CreateMemoryCard(MemoryEntry memory)
        {
            var card = new Border
            {
                Background = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 37, 37, 37)),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(12),
                Margin = new Thickness(0, 0, 0, 12)
            };

            var stack = new StackPanel { Spacing = 6 };

            // Header with source and time
            var headerPanel = new StackPanel { Orientation = Orientation.Horizontal, Spacing = 8 };

            var sourceIcon = GetSourceIcon(memory.Source);
            headerPanel.Children.Add(new TextBlock
            {
                Text = sourceIcon,
                FontSize = 12,
                Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 156, 163, 175))
            });

            headerPanel.Children.Add(new TextBlock
            {
                Text = memory.Source,
                FontSize = 11,
                Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 156, 163, 175))
            });

            headerPanel.Children.Add(new TextBlock
            {
                Text = $"• {FormatTimeAgo(memory.CreatedAt)}",
                FontSize = 11,
                Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 107, 114, 128))
            });

            stack.Children.Add(headerPanel);

            // Summary
            stack.Children.Add(new TextBlock
            {
                Text = memory.Summary,
                FontSize = 13,
                FontWeight = new Windows.UI.Text.FontWeight(600),
                Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 229, 231, 235)),
                TextWrapping = TextWrapping.Wrap
            });

            // Content preview
            var contentPreview = memory.Content.Length > 100
                ? memory.Content.Substring(0, 100) + "..."
                : memory.Content;

            stack.Children.Add(new TextBlock
            {
                Text = contentPreview,
                FontSize = 11,
                Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 156, 163, 175)),
                TextWrapping = TextWrapping.Wrap
            });

            // Tags
            if (memory.Tags.Count > 0)
            {
                var tagsPanel = new StackPanel { Orientation = Orientation.Horizontal, Spacing = 6 };
                foreach (var tag in memory.Tags)
                {
                    tagsPanel.Children.Add(new Border
                    {
                        Background = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 99, 102, 241)),
                        CornerRadius = new CornerRadius(4),
                        Padding = new Thickness(8, 4, 8, 4),
                        Child = new TextBlock
                        {
                            Text = tag,
                            FontSize = 10,
                            Foreground = new Microsoft.UI.Xaml.Media.SolidColorBrush(Microsoft.UI.Colors.White)
                        }
                    });
                }
                stack.Children.Add(tagsPanel);
            }

            card.Child = stack;
            return card;
        }

        private string GetSourceIcon(string source)
        {
            return source switch
            {
                "voice" => "🎤",
                "clipboard" => "📋",
                "chat" => "💬",
                "manual" => "✏️",
                _ => "📌"
            };
        }

        private string FormatTimeAgo(DateTime dateTime)
        {
            var timeSpan = DateTime.UtcNow - dateTime;

            if (timeSpan.TotalMinutes < 1) return "just now";
            if (timeSpan.TotalMinutes < 60) return $"{(int)timeSpan.TotalMinutes}m ago";
            if (timeSpan.TotalHours < 24) return $"{(int)timeSpan.TotalHours}h ago";
            if (timeSpan.TotalDays < 7) return $"{(int)timeSpan.TotalDays}d ago";

            return dateTime.ToShortDateString();
        }

        private void SearchBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            var query = SearchBox.Text.ToLower();

            if (string.IsNullOrWhiteSpace(query))
            {
                RefreshMemoriesDisplay(_allMemories);
                return;
            }

            var filtered = _allMemories.Where(m =>
                m.Content.ToLower().Contains(query) ||
                m.Summary.ToLower().Contains(query) ||
                m.Tags.Any(t => t.ToLower().Contains(query))
            ).ToList();

            RefreshMemoriesDisplay(filtered);
        }

        private async void ClearAllButton_Click(object sender, RoutedEventArgs e)
        {
            // TODO: Show confirmation dialog
            // TODO: Call MemoryService.ClearMemoryAsync()

            _allMemories.Clear();
            RefreshMemoriesDisplay(_allMemories);

            System.Diagnostics.Debug.WriteLine("🗑️ All memories cleared");
        }

        /// <summary>
        /// Add a new memory (called from parent)
        /// </summary>
        public void AddMemory(MemoryEntry memory)
        {
            _allMemories.Insert(0, memory);
            RefreshMemoriesDisplay(_allMemories);
        }
    }
}
