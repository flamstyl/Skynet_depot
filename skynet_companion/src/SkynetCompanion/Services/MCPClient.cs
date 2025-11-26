using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using SkynetCompanion.Models;

namespace SkynetCompanion.Services
{
    /// <summary>
    /// Client for communicating with MCP backend API
    /// </summary>
    public class MCPClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;

        public MCPClient(string baseUrl = "http://localhost:8765")
        {
            _baseUrl = baseUrl;
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri(_baseUrl),
                Timeout = TimeSpan.FromSeconds(30)
            };
        }

        /// <summary>
        /// Send message to agent via MCP
        /// </summary>
        public async Task<MCPResponse> SendMessageAsync(MCPMessage message)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/overlay/send", message);
                response.EnsureSuccessStatusCode();

                var result = await response.Content.ReadFromJsonAsync<MCPResponse>();
                return result ?? new MCPResponse { Success = false, Error = "Empty response" };
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ MCP Send Error: {ex.Message}");
                return new MCPResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        /// <summary>
        /// Process voice query
        /// </summary>
        public async Task<MCPResponse> ProcessVoiceQueryAsync(string transcription, string agent = "claude")
        {
            try
            {
                var payload = new
                {
                    query = transcription,
                    agent = agent
                };

                var response = await _httpClient.PostAsJsonAsync("/overlay/voice/query", payload);
                response.EnsureSuccessStatusCode();

                var result = await response.Content.ReadFromJsonAsync<MCPResponse>();
                return result ?? new MCPResponse { Success = false, Error = "Empty response" };
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Voice Query Error: {ex.Message}");
                return new MCPResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        /// <summary>
        /// Analyze clipboard content
        /// </summary>
        public async Task<MCPResponse> AnalyzeClipboardAsync(ClipboardContent content)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/overlay/clipboard/analyze", content);
                response.EnsureSuccessStatusCode();

                var result = await response.Content.ReadFromJsonAsync<MCPResponse>();
                return result ?? new MCPResponse { Success = false, Error = "Empty response" };
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Clipboard Analysis Error: {ex.Message}");
                return new MCPResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        /// <summary>
        /// Get available agents
        /// </summary>
        public async Task<List<Agent>> GetAvailableAgentsAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/overlay/agents");
                response.EnsureSuccessStatusCode();

                var agents = await response.Content.ReadFromJsonAsync<List<Agent>>();
                return agents ?? new List<Agent>();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Get Agents Error: {ex.Message}");
                return new List<Agent>();
            }
        }

        /// <summary>
        /// Get current context
        /// </summary>
        public async Task<Dictionary<string, object>?> GetContextAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/overlay/context");
                response.EnsureSuccessStatusCode();

                var context = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
                return context;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Get Context Error: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Update context
        /// </summary>
        public async Task<bool> UpdateContextAsync(Dictionary<string, object> context)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/overlay/context", context);
                response.EnsureSuccessStatusCode();
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Update Context Error: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Health check
        /// </summary>
        public async Task<bool> IsBackendAliveAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/health");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }
    }

    /*
     * TODO: WebSocket streaming support
     *
     * For real-time streaming responses:
     * - Use System.Net.WebSockets.ClientWebSocket
     * - Connect to ws://localhost:8765/overlay/stream
     * - Receive chunks of response as they're generated
     * - Update UI in real-time (ChatPanel)
     *
     * Example:
     *
     * var ws = new ClientWebSocket();
     * await ws.ConnectAsync(new Uri("ws://localhost:8765/overlay/stream"), CancellationToken.None);
     *
     * while (ws.State == WebSocketState.Open)
     * {
     *     var buffer = new byte[1024];
     *     var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
     *     var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
     *     // Update UI with streaming chunk
     * }
     */
}
