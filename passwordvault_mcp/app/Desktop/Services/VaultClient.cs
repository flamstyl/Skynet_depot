/**
 * PasswordVault MCP — Vault Client (C#)
 * Skynet Secure Vault v1.0
 *
 * Client HTTP pour communiquer avec le backend Python
 */

using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace PasswordVault.Services
{
    public class VaultClient
    {
        private readonly HttpClient _httpClient;
        private const string BASE_URL = "http://127.0.0.1:5555";

        public VaultClient()
        {
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri(BASE_URL),
                Timeout = TimeSpan.FromSeconds(30)
            };
        }

        // ==================== Vault Management ====================

        public async Task<ApiResponse<VaultStatus>> GetVaultStatusAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/vault/status");
                var content = await response.Content.ReadAsStringAsync();
                var data = JsonConvert.DeserializeObject<VaultStatus>(content);

                return new ApiResponse<VaultStatus>
                {
                    Success = true,
                    Data = data
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<VaultStatus>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<UnlockResult>> UnlockVaultAsync(string masterPassword)
        {
            try
            {
                var payload = new { master_password = masterPassword };
                var response = await _httpClient.PostAsJsonAsync("/vault/unlock", payload);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<UnlockResult>(content);
                    return new ApiResponse<UnlockResult>
                    {
                        Success = true,
                        Data = data
                    };
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ErrorResponse>(content);
                    return new ApiResponse<UnlockResult>
                    {
                        Success = false,
                        Error = error?.Error ?? "Unknown error"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<UnlockResult>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<bool>> CreateVaultAsync(string masterPassword)
        {
            try
            {
                var payload = new { master_password = masterPassword };
                var response = await _httpClient.PostAsJsonAsync("/vault/create", payload);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    return new ApiResponse<bool>
                    {
                        Success = true,
                        Data = true
                    };
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ErrorResponse>(content);
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Error = error?.Error ?? "Unknown error"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<bool>> LockVaultAsync()
        {
            try
            {
                var response = await _httpClient.PostAsync("/vault/lock", null);
                return new ApiResponse<bool>
                {
                    Success = response.IsSuccessStatusCode,
                    Data = response.IsSuccessStatusCode
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        // ==================== Entry Management ====================

        public async Task<ApiResponse<List<VaultEntry>>> GetEntriesAsync(string? searchQuery = null)
        {
            try
            {
                var url = "/vault/entries";
                if (!string.IsNullOrEmpty(searchQuery))
                {
                    url += $"?search={Uri.EscapeDataString(searchQuery)}";
                }

                var response = await _httpClient.GetAsync(url);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<EntriesResponse>(content);
                    return new ApiResponse<List<VaultEntry>>
                    {
                        Success = true,
                        Data = data?.Entries ?? new List<VaultEntry>()
                    };
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ErrorResponse>(content);
                    return new ApiResponse<List<VaultEntry>>
                    {
                        Success = false,
                        Error = error?.Error ?? "Unknown error"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<VaultEntry>>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<VaultEntry>> AddEntryAsync(VaultEntry entry)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/vault/entry/add", entry);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<AddEntryResponse>(content);
                    return new ApiResponse<VaultEntry>
                    {
                        Success = true,
                        Data = data?.Entry
                    };
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ErrorResponse>(content);
                    return new ApiResponse<VaultEntry>
                    {
                        Success = false,
                        Error = error?.Error ?? "Unknown error"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<VaultEntry>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<VaultEntry>> UpdateEntryAsync(string entryId, VaultEntry entry)
        {
            try
            {
                var response = await _httpClient.PutAsJsonAsync($"/vault/entry/update/{entryId}", entry);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<UpdateEntryResponse>(content);
                    return new ApiResponse<VaultEntry>
                    {
                        Success = true,
                        Data = data?.Entry
                    };
                }
                else
                {
                    var error = JsonConvert.DeserializeObject<ErrorResponse>(content);
                    return new ApiResponse<VaultEntry>
                    {
                        Success = false,
                        Error = error?.Error ?? "Unknown error"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<VaultEntry>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteEntryAsync(string entryId)
        {
            try
            {
                var response = await _httpClient.DeleteAsync($"/vault/entry/delete/{entryId}");
                return new ApiResponse<bool>
                {
                    Success = response.IsSuccessStatusCode,
                    Data = response.IsSuccessStatusCode
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        // ==================== Security ====================

        public async Task<ApiResponse<HIBPResult>> CheckPasswordAsync(string password)
        {
            try
            {
                var payload = new { password = password };
                var response = await _httpClient.PostAsJsonAsync("/vault/hibp/check", payload);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<HIBPResponse>(content);
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

    // ==================== Response Models ====================

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Error { get; set; }
    }

    public class VaultStatus
    {
        [JsonProperty("exists")]
        public bool Exists { get; set; }

        [JsonProperty("is_unlocked")]
        public bool IsUnlocked { get; set; }

        [JsonProperty("entry_count")]
        public int EntryCount { get; set; }
    }

    public class UnlockResult
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("message")]
        public string? Message { get; set; }

        [JsonProperty("entry_count")]
        public int EntryCount { get; set; }
    }

    public class EntriesResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("entries")]
        public List<VaultEntry>? Entries { get; set; }

        [JsonProperty("count")]
        public int Count { get; set; }
    }

    public class AddEntryResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("entry")]
        public VaultEntry? Entry { get; set; }

        [JsonProperty("entry_id")]
        public string? EntryId { get; set; }
    }

    public class UpdateEntryResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("entry")]
        public VaultEntry? Entry { get; set; }
    }

    public class HIBPResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("result")]
        public HIBPResult? Result { get; set; }
    }

    public class HIBPResult
    {
        [JsonProperty("breached")]
        public bool Breached { get; set; }

        [JsonProperty("count")]
        public int Count { get; set; }

        [JsonProperty("checked_at")]
        public string? CheckedAt { get; set; }
    }

    public class ErrorResponse
    {
        [JsonProperty("error")]
        public string? Error { get; set; }
    }

    public class VaultEntry
    {
        [JsonProperty("id")]
        public string? Id { get; set; }

        [JsonProperty("website")]
        public string Website { get; set; } = string.Empty;

        [JsonProperty("username")]
        public string Username { get; set; } = string.Empty;

        [JsonProperty("password")]
        public string Password { get; set; } = string.Empty;

        [JsonProperty("notes")]
        public string? Notes { get; set; }

        [JsonProperty("category")]
        public string Category { get; set; } = "web";

        [JsonProperty("tags")]
        public List<string>? Tags { get; set; }

        [JsonProperty("created_at")]
        public string? CreatedAt { get; set; }

        [JsonProperty("updated_at")]
        public string? UpdatedAt { get; set; }

        [JsonProperty("last_used")]
        public string? LastUsed { get; set; }
    }
}
