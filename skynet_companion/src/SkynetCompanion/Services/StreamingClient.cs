using System;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using SkynetCompanion.Models;

namespace SkynetCompanion.Services
{
    /// <summary>
    /// WebSocket client for streaming AI responses
    /// </summary>
    public class StreamingClient : IDisposable
    {
        private readonly string _baseUrl;
        private ClientWebSocket? _webSocket;
        private CancellationTokenSource? _cancellationTokenSource;
        private bool _isConnected;

        public event EventHandler<string>? ChunkReceived;
        public event EventHandler? StreamCompleted;
        public event EventHandler<Exception>? ErrorOccurred;

        public bool IsConnected => _isConnected && _webSocket?.State == WebSocketState.Open;

        public StreamingClient(string baseUrl = "ws://localhost:8765")
        {
            _baseUrl = baseUrl.Replace("http://", "ws://").Replace("https://", "wss://");
        }

        /// <summary>
        /// Connect to WebSocket endpoint
        /// </summary>
        public async Task ConnectAsync()
        {
            if (IsConnected) return;

            try
            {
                _webSocket = new ClientWebSocket();
                _cancellationTokenSource = new CancellationTokenSource();

                var uri = new Uri($"{_baseUrl}/overlay/stream");
                await _webSocket.ConnectAsync(uri, _cancellationTokenSource.Token);

                _isConnected = true;
                System.Diagnostics.Debug.WriteLine("✅ WebSocket connected");

                // Start receiving messages
                _ = ReceiveLoopAsync();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ WebSocket connection failed: {ex.Message}");
                _isConnected = false;
                ErrorOccurred?.Invoke(this, ex);
                throw;
            }
        }

        /// <summary>
        /// Send message and stream response
        /// </summary>
        public async Task SendMessageAsync(MCPMessage message)
        {
            if (!IsConnected)
            {
                await ConnectAsync();
            }

            try
            {
                var json = JsonSerializer.Serialize(message);
                var bytes = Encoding.UTF8.GetBytes(json);
                var segment = new ArraySegment<byte>(bytes);

                await _webSocket!.SendAsync(segment, WebSocketMessageType.Text, true, _cancellationTokenSource!.Token);

                System.Diagnostics.Debug.WriteLine($"📤 Message sent via WebSocket: {message.Content.Substring(0, Math.Min(50, message.Content.Length))}");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ WebSocket send error: {ex.Message}");
                ErrorOccurred?.Invoke(this, ex);
                throw;
            }
        }

        /// <summary>
        /// Receive loop for streaming messages
        /// </summary>
        private async Task ReceiveLoopAsync()
        {
            var buffer = new byte[4096];

            try
            {
                while (_webSocket?.State == WebSocketState.Open)
                {
                    var result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), _cancellationTokenSource!.Token);

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, string.Empty, CancellationToken.None);
                        _isConnected = false;
                        break;
                    }

                    var message = Encoding.UTF8.GetString(buffer, 0, result.Count);

                    // Parse message
                    try
                    {
                        var chunk = JsonSerializer.Deserialize<StreamChunk>(message);

                        if (chunk?.Type == "chunk")
                        {
                            ChunkReceived?.Invoke(this, chunk.Content ?? string.Empty);
                        }
                        else if (chunk?.Type == "complete")
                        {
                            StreamCompleted?.Invoke(this, EventArgs.Empty);
                        }
                        else if (chunk?.Type == "error")
                        {
                            ErrorOccurred?.Invoke(this, new Exception(chunk.Content ?? "Unknown error"));
                        }
                    }
                    catch (JsonException ex)
                    {
                        // Not JSON, treat as plain text chunk
                        ChunkReceived?.Invoke(this, message);
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ WebSocket receive error: {ex.Message}");
                _isConnected = false;
                ErrorOccurred?.Invoke(this, ex);
            }
        }

        /// <summary>
        /// Disconnect WebSocket
        /// </summary>
        public async Task DisconnectAsync()
        {
            if (_webSocket?.State == WebSocketState.Open)
            {
                _cancellationTokenSource?.Cancel();
                await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client disconnect", CancellationToken.None);
                _isConnected = false;
                System.Diagnostics.Debug.WriteLine("WebSocket disconnected");
            }
        }

        public void Dispose()
        {
            _ = DisconnectAsync();
            _webSocket?.Dispose();
            _cancellationTokenSource?.Dispose();
        }
    }

    /// <summary>
    /// Stream chunk model
    /// </summary>
    public class StreamChunk
    {
        public string? Type { get; set; }
        public string? Content { get; set; }
    }
}
