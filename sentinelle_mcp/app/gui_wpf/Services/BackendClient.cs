using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace SentinelleMCP.Services
{
    /// <summary>
    /// Client for communicating with Sentinelle Python backend and MCP server
    /// </summary>
    public class BackendClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _mcpEndpoint;

        public BackendClient(string mcpEndpoint = "http://localhost:3000")
        {
            _httpClient = new HttpClient();
            _mcpEndpoint = mcpEndpoint;
        }

        #region Health & Status

        /// <summary>
        /// Check MCP server health
        /// </summary>
        public async Task<HealthResponse> CheckHealthAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_mcpEndpoint}/health/sentinelle");
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<HealthResponse>(json);
            }
            catch (Exception ex)
            {
                return new HealthResponse
                {
                    Status = "unhealthy",
                    Service = "unknown",
                    Error = ex.Message
                };
            }
        }

        /// <summary>
        /// Get detailed server status
        /// </summary>
        public async Task<StatusResponse> GetStatusAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_mcpEndpoint}/status");
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<StatusResponse>(json);
            }
            catch (Exception ex)
            {
                // TODO: Handle error
                return null;
            }
        }

        #endregion

        #region Notifications

        /// <summary>
        /// Send event notification
        /// </summary>
        public async Task<NotificationResponse> NotifyEventAsync(object eventData, object aiAnalysis = null)
        {
            try
            {
                var payload = new
                {
                    @event = eventData,
                    ai_analysis = aiAnalysis
                };

                var json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_mcpEndpoint}/notify/event", content);
                response.EnsureSuccessStatusCode();

                var resultJson = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<NotificationResponse>(resultJson);
            }
            catch (Exception ex)
            {
                // TODO: Handle error
                return null;
            }
        }

        /// <summary>
        /// Send alert to Raphaël
        /// </summary>
        public async Task<NotificationResponse> SendAlertAsync(string message, string priority = "medium", object data = null)
        {
            try
            {
                var payload = new
                {
                    message,
                    priority,
                    data
                };

                var json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_mcpEndpoint}/alert/raphael", content);
                response.EnsureSuccessStatusCode();

                var resultJson = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<NotificationResponse>(resultJson);
            }
            catch (Exception ex)
            {
                // TODO: Handle error
                return null;
            }
        }

        #endregion

        #region AI Analysis

        /// <summary>
        /// Request AI analysis of an event
        /// </summary>
        public async Task<AIAnalysisResponse> AnalyzeEventAsync(object eventData, string promptType = "analyze_change")
        {
            try
            {
                var payload = new
                {
                    @event = eventData,
                    prompt_type = promptType
                };

                var json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_mcpEndpoint}/ai/analyze", content);
                response.EnsureSuccessStatusCode();

                var resultJson = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<AIAnalysisResponse>(resultJson);
            }
            catch (Exception ex)
            {
                // TODO: Handle error
                return null;
            }
        }

        #endregion

        #region Watcher Management

        /// <summary>
        /// Update watcher configuration
        /// </summary>
        public async Task<WatcherUpdateResponse> UpdateWatcherAsync(string action, string path, bool recursive = true)
        {
            try
            {
                var payload = new
                {
                    action,
                    path,
                    recursive
                };

                var json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"{_mcpEndpoint}/watcher/update", content);
                response.EnsureSuccessStatusCode();

                var resultJson = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<WatcherUpdateResponse>(resultJson);
            }
            catch (Exception ex)
            {
                // TODO: Handle error
                return null;
            }
        }

        #endregion

        #region Reports

        /// <summary>
        /// List available reports
        /// </summary>
        public async Task<ReportsListResponse> ListReportsAsync(int limit = 100, string format = "json")
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_mcpEndpoint}/reports/list?limit={limit}&format={format}");
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<ReportsListResponse>(json);
            }
            catch (Exception ex)
            {
                // TODO: Handle error
                return null;
            }
        }

        /// <summary>
        /// Get specific report
        /// </summary>
        public async Task<ReportResponse> GetReportAsync(string reportId, string format = "json")
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_mcpEndpoint}/reports/{reportId}?format={format}");
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<ReportResponse>(json);
            }
            catch (Exception ex)
            {
                // TODO: Handle error
                return null;
            }
        }

        #endregion
    }

    #region Response Models

    public class HealthResponse
    {
        public string Status { get; set; }
        public string Service { get; set; }
        public string Version { get; set; }
        public string Timestamp { get; set; }
        public double Uptime { get; set; }
        public string Error { get; set; }
    }

    public class StatusResponse
    {
        public ServerInfo Server { get; set; }
        public ConfigInfo Config { get; set; }
        public string Timestamp { get; set; }
    }

    public class ServerInfo
    {
        public string Name { get; set; }
        public string Version { get; set; }
        public double Uptime { get; set; }
    }

    public class ConfigInfo
    {
        public string Ai_Backend { get; set; }
        public bool Notifications_Enabled { get; set; }
    }

    public class NotificationResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Event_Id { get; set; }
        public bool Notification_Sent { get; set; }
        public string[] Methods { get; set; }
    }

    public class AIAnalysisResponse
    {
        public bool Success { get; set; }
        public string Analysis { get; set; }
        public string[] Recommendations { get; set; }
        public string Confidence { get; set; }
        public string Model { get; set; }
        public double Duration_Ms { get; set; }
    }

    public class WatcherUpdateResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Path { get; set; }
        public bool Recursive { get; set; }
    }

    public class ReportsListResponse
    {
        public bool Success { get; set; }
        public string[] Reports { get; set; }
        public int Count { get; set; }
        public int Limit { get; set; }
        public string Format { get; set; }
    }

    public class ReportResponse
    {
        public bool Success { get; set; }
        public string Report_Id { get; set; }
        public string Format { get; set; }
        public object Data { get; set; }
    }

    #endregion
}
