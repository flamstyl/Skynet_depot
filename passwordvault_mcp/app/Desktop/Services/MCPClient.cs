/**
 * PasswordVault MCP — MCP Client (C#)
 * Skynet Secure Vault v1.0
 *
 * Client pour le serveur MCP (sync, IA, HIBP)
 */

using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace PasswordVault.Services
{
    public class MCPClient
    {
        private readonly HttpClient _httpClient;
        private const string BASE_URL = "http://127.0.0.1:3000";

        public MCPClient()
        {
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri(BASE_URL),
                Timeout = TimeSpan.FromSeconds(60) // IA peut prendre du temps
            };
        }

        // ==================== Health Check ====================

        public async Task<bool> IsServerAvailableAsync()
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

        // ==================== Sync ====================

        public async Task<ApiResponse<SyncPushResult>> PushVaultAsync(string deviceId, object vaultData)
        {
            try
            {
                var payload = new
                {
                    device_id = deviceId,
                    vault = vaultData,
                    timestamp = DateTime.UtcNow.ToString("o")
                };

                var response = await _httpClient.PostAsJsonAsync("/sync/push", payload);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<SyncPushResult>(content);
                    return new ApiResponse<SyncPushResult>
                    {
                        Success = true,
                        Data = data
                    };
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ErrorResponse>(content);
                    return new ApiResponse<SyncPushResult>
                    {
                        Success = false,
                        Error = error?.Error ?? "Sync push failed"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<SyncPushResult>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<object>> PullVaultAsync(string deviceId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/sync/pull?device_id={deviceId}");
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<SyncPullResult>(content);
                    return new ApiResponse<object>
                    {
                        Success = true,
                        Data = data?.Vault
                    };
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ErrorResponse>(content);
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Error = error?.Error ?? "Sync pull failed"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<SyncStatus>> GetSyncStatusAsync(string deviceId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/sync/status?device_id={deviceId}");
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<SyncStatus>(content);
                    return new ApiResponse<SyncStatus>
                    {
                        Success = true,
                        Data = data
                    };
                }
                else
                {
                    return new ApiResponse<SyncStatus>
                    {
                        Success = false,
                        Error = "Failed to get sync status"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<SyncStatus>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        // ==================== IA Features ====================

        public async Task<ApiResponse<SecurityReport>> AuditSecurityAsync(PasswordMetadata metadata)
        {
            try
            {
                var payload = new { metadata = metadata };

                var response = await _httpClient.PostAsJsonAsync("/ai/audit", payload);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<AIAuditResponse>(content);
                    return new ApiResponse<SecurityReport>
                    {
                        Success = true,
                        Data = data?.Report
                    };
                }
                else
                {
                    return new ApiResponse<SecurityReport>
                    {
                        Success = false,
                        Error = "AI audit failed"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<SecurityReport>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<ImprovementSuggestions>> GetImprovementSuggestionsAsync(
            string currentStrength, string website, string username)
        {
            try
            {
                var payload = new
                {
                    context = new
                    {
                        current_strength = currentStrength,
                        website = website,
                        username = username
                    }
                };

                var response = await _httpClient.PostAsJsonAsync("/ai/improve", payload);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<AIImproveResponse>(content);
                    return new ApiResponse<ImprovementSuggestions>
                    {
                        Success = true,
                        Data = data?.Suggestions
                    };
                }
                else
                {
                    return new ApiResponse<ImprovementSuggestions>
                    {
                        Success = false,
                        Error = "AI improvement failed"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<ImprovementSuggestions>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<RiskAnalysis>> DetectRisksAsync(VaultPatterns patterns)
        {
            try
            {
                var payload = new { patterns = patterns };

                var response = await _httpClient.PostAsJsonAsync("/ai/detect-risks", payload);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<AIRiskResponse>(content);
                    return new ApiResponse<RiskAnalysis>
                    {
                        Success = true,
                        Data = data?.Risks
                    };
                }
                else
                {
                    return new ApiResponse<RiskAnalysis>
                    {
                        Success = false,
                        Error = "Risk detection failed"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<RiskAnalysis>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        // ==================== HIBP via MCP ====================

        public async Task<ApiResponse<HIBPResult>> CheckPasswordHashAsync(string sha1Hash)
        {
            try
            {
                var payload = new { hash = sha1Hash };

                var response = await _httpClient.PostAsJsonAsync("/hibp/check", payload);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<HIBPCheckResponse>(content);
                    return new ApiResponse<HIBPResult>
                    {
                        Success = true,
                        Data = data?.Result
                    };
                }
                else
                {
                    return new ApiResponse<HIBPResult>
                    {
                        Success = false,
                        Error = "HIBP check failed"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<HIBPResult>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }
    }

    // ==================== MCP Response Models ====================

    public class SyncPushResult
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("sync_id")]
        public string? SyncId { get; set; }

        [JsonProperty("timestamp")]
        public string? Timestamp { get; set; }
    }

    public class SyncPullResult
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("vault")]
        public object? Vault { get; set; }

        [JsonProperty("timestamp")]
        public string? Timestamp { get; set; }
    }

    public class SyncStatus
    {
        [JsonProperty("synced")]
        public bool Synced { get; set; }

        [JsonProperty("last_sync")]
        public string? LastSync { get; set; }

        [JsonProperty("sync_id")]
        public string? SyncId { get; set; }

        [JsonProperty("entry_count")]
        public int EntryCount { get; set; }
    }

    public class AIAuditResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("report")]
        public SecurityReport? Report { get; set; }
    }

    public class AIImproveResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("suggestions")]
        public ImprovementSuggestions? Suggestions { get; set; }
    }

    public class AIRiskResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("risks")]
        public RiskAnalysis? Risks { get; set; }
    }

    public class HIBPCheckResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("result")]
        public HIBPResult? Result { get; set; }
    }

    // ==================== Data Models ====================

    public class PasswordMetadata
    {
        [JsonProperty("password_length")]
        public int PasswordLength { get; set; }

        [JsonProperty("has_uppercase")]
        public bool HasUppercase { get; set; }

        [JsonProperty("has_lowercase")]
        public bool HasLowercase { get; set; }

        [JsonProperty("has_digits")]
        public bool HasDigits { get; set; }

        [JsonProperty("has_special")]
        public bool HasSpecial { get; set; }

        [JsonProperty("age_days")]
        public int AgeDays { get; set; }
    }

    public class SecurityReport
    {
        [JsonProperty("score")]
        public int Score { get; set; }

        [JsonProperty("strength")]
        public string? Strength { get; set; }

        [JsonProperty("weaknesses")]
        public string[]? Weaknesses { get; set; }

        [JsonProperty("recommendations")]
        public string[]? Recommendations { get; set; }
    }

    public class ImprovementSuggestions
    {
        [JsonProperty("suggestions")]
        public string[]? Suggestions { get; set; }

        [JsonProperty("example_pattern")]
        public string? ExamplePattern { get; set; }
    }

    public class VaultPatterns
    {
        [JsonProperty("reused_passwords")]
        public int ReusedPasswords { get; set; }

        [JsonProperty("weak_passwords")]
        public int WeakPasswords { get; set; }

        [JsonProperty("old_passwords")]
        public int OldPasswords { get; set; }

        [JsonProperty("total_entries")]
        public int TotalEntries { get; set; }
    }

    public class RiskAnalysis
    {
        [JsonProperty("critical_risks")]
        public string[]? CriticalRisks { get; set; }

        [JsonProperty("warnings")]
        public string[]? Warnings { get; set; }

        [JsonProperty("recommendations")]
        public string[]? Recommendations { get; set; }
    }
}
