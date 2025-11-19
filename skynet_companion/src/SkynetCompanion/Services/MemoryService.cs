using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using SkynetCompanion.Models;

namespace SkynetCompanion.Services
{
    /// <summary>
    /// Service for managing short-term and long-term memory
    /// </summary>
    public class MemoryService
    {
        private readonly string _memoryFilePath;
        private List<MemoryEntry> _shortTermMemory;
        private readonly MCPClient _mcpClient;

        public MemoryService(MCPClient mcpClient, string? memoryPath = null)
        {
            _mcpClient = mcpClient;
            _memoryFilePath = memoryPath ?? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "SkynetCompanion",
                "memory_short.json"
            );

            _shortTermMemory = new List<MemoryEntry>();
            _ = LoadMemoryAsync(); // Fire and forget initialization
        }

        /// <summary>
        /// Load memory from disk
        /// </summary>
        private async Task LoadMemoryAsync()
        {
            try
            {
                if (File.Exists(_memoryFilePath))
                {
                    var json = await File.ReadAllTextAsync(_memoryFilePath);
                    _shortTermMemory = JsonSerializer.Deserialize<List<MemoryEntry>>(json) ?? new List<MemoryEntry>();
                    System.Diagnostics.Debug.WriteLine($"🧠 Loaded {_shortTermMemory.Count} memory entries");
                }
                else
                {
                    // Create directory if it doesn't exist
                    var directory = Path.GetDirectoryName(_memoryFilePath);
                    if (directory != null && !Directory.Exists(directory))
                    {
                        Directory.CreateDirectory(directory);
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Load memory error: {ex.Message}");
            }
        }

        /// <summary>
        /// Save memory to disk
        /// </summary>
        private async Task SaveMemoryAsync()
        {
            try
            {
                var json = JsonSerializer.Serialize(_shortTermMemory, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                await File.WriteAllTextAsync(_memoryFilePath, json);
                System.Diagnostics.Debug.WriteLine($"💾 Saved {_shortTermMemory.Count} memory entries");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Save memory error: {ex.Message}");
            }
        }

        /// <summary>
        /// Add new memory entry
        /// </summary>
        public async Task AddMemoryAsync(MemoryEntry entry)
        {
            _shortTermMemory.Add(entry);

            // Keep only last 100 entries in short-term memory
            if (_shortTermMemory.Count > 100)
            {
                _shortTermMemory = _shortTermMemory.OrderByDescending(m => m.CreatedAt).Take(100).ToList();
            }

            await SaveMemoryAsync();

            // TODO: Also send to MCP for long-term storage
            // await _mcpClient.SendMemoryToLongTermAsync(entry);
        }

        /// <summary>
        /// Get recent memories
        /// </summary>
        public async Task<List<MemoryEntry>> GetRecentMemoriesAsync(int count = 10)
        {
            await Task.CompletedTask; // Ensure async signature
            return _shortTermMemory
                .OrderByDescending(m => m.CreatedAt)
                .Take(count)
                .ToList();
        }

        /// <summary>
        /// Search memories by content
        /// </summary>
        public async Task<List<MemoryEntry>> SearchMemoryAsync(string query)
        {
            await Task.CompletedTask; // Ensure async signature

            query = query.ToLower();
            return _shortTermMemory
                .Where(m =>
                    m.Content.ToLower().Contains(query) ||
                    m.Summary.ToLower().Contains(query) ||
                    m.Tags.Any(t => t.ToLower().Contains(query))
                )
                .OrderByDescending(m => m.CreatedAt)
                .ToList();
        }

        /// <summary>
        /// Get memories by tag
        /// </summary>
        public async Task<List<MemoryEntry>> GetMemoriesByTagAsync(string tag)
        {
            await Task.CompletedTask;
            return _shortTermMemory
                .Where(m => m.Tags.Contains(tag, StringComparer.OrdinalIgnoreCase))
                .OrderByDescending(m => m.CreatedAt)
                .ToList();
        }

        /// <summary>
        /// Delete memory entry
        /// </summary>
        public async Task DeleteMemoryAsync(string id)
        {
            _shortTermMemory.RemoveAll(m => m.Id == id);
            await SaveMemoryAsync();
        }

        /// <summary>
        /// Clear all short-term memory
        /// </summary>
        public async Task ClearMemoryAsync()
        {
            _shortTermMemory.Clear();
            await SaveMemoryAsync();
            System.Diagnostics.Debug.WriteLine("🗑️ Memory cleared");
        }

        /// <summary>
        /// Export memory to JSON file
        /// </summary>
        public async Task<string> ExportMemoryAsync(string exportPath)
        {
            try
            {
                var json = JsonSerializer.Serialize(_shortTermMemory, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                await File.WriteAllTextAsync(exportPath, json);
                return $"Exported {_shortTermMemory.Count} entries to {exportPath}";
            }
            catch (Exception ex)
            {
                return $"Export failed: {ex.Message}";
            }
        }

        /// <summary>
        /// Import memory from JSON file
        /// </summary>
        public async Task<string> ImportMemoryAsync(string importPath)
        {
            try
            {
                var json = await File.ReadAllTextAsync(importPath);
                var imported = JsonSerializer.Deserialize<List<MemoryEntry>>(json) ?? new List<MemoryEntry>();

                _shortTermMemory.AddRange(imported);
                await SaveMemoryAsync();

                return $"Imported {imported.Count} entries";
            }
            catch (Exception ex)
            {
                return $"Import failed: {ex.Message}";
            }
        }
    }

    /*
     * TODO: Long-term memory via MCP
     *
     * 1. MCP MemoryStore Integration:
     *    - Send important memories to MCP backend
     *    - Use semantic search (embeddings)
     *    - Query: "What did I work on last week?"
     *
     * 2. Auto-summarization:
     *    - Periodically summarize old memories
     *    - Consolidate related entries
     *
     * 3. Memory Graph:
     *    - Link related memories
     *    - Build knowledge graph
     *    - Visualize connections
     *
     * 4. Smart Tagging:
     *    - Auto-generate tags using AI
     *    - Detect entities, topics, sentiment
     */
}
