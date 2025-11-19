using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace SkynetCompanion.Helpers
{
    /// <summary>
    /// Helper for integrating Whisper.cpp transcription
    /// </summary>
    public static class WhisperHelper
    {
        private static string? _whisperPath;
        private static string? _modelPath;

        /// <summary>
        /// Initialize Whisper.cpp paths
        /// </summary>
        public static void Initialize(string whisperExePath, string modelPath)
        {
            _whisperPath = whisperExePath;
            _modelPath = modelPath;
        }

        /// <summary>
        /// Transcribe audio file using Whisper.cpp
        /// </summary>
        public static async Task<string> TranscribeAsync(string audioFilePath)
        {
            if (string.IsNullOrEmpty(_whisperPath) || string.IsNullOrEmpty(_modelPath))
            {
                throw new InvalidOperationException("Whisper paths not initialized. Call Initialize() first.");
            }

            if (!File.Exists(_whisperPath))
            {
                throw new FileNotFoundException($"Whisper.cpp executable not found at: {_whisperPath}");
            }

            if (!File.Exists(_modelPath))
            {
                throw new FileNotFoundException($"Whisper model not found at: {_modelPath}");
            }

            if (!File.Exists(audioFilePath))
            {
                throw new FileNotFoundException($"Audio file not found: {audioFilePath}");
            }

            try
            {
                // Run whisper.cpp as subprocess
                var startInfo = new ProcessStartInfo
                {
                    FileName = _whisperPath,
                    Arguments = $"-m \"{_modelPath}\" -f \"{audioFilePath}\" --output-txt --no-timestamps",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    throw new Exception("Failed to start Whisper process");
                }

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    throw new Exception($"Whisper failed: {error}");
                }

                // Parse output (Whisper.cpp outputs transcription to stdout)
                var transcription = output.Trim();

                Debug.WriteLine($"✅ Whisper transcription: {transcription}");

                return transcription;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"❌ Whisper error: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Check if Whisper.cpp is available
        /// </summary>
        public static bool IsAvailable()
        {
            return !string.IsNullOrEmpty(_whisperPath) && File.Exists(_whisperPath) && File.Exists(_modelPath);
        }

        /// <summary>
        /// Get recommended Whisper model download URL
        /// </summary>
        public static string GetModelDownloadUrl(WhisperModel model)
        {
            return model switch
            {
                WhisperModel.Tiny => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
                WhisperModel.Base => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
                WhisperModel.Small => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
                WhisperModel.Medium => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin",
                WhisperModel.Large => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin",
                _ => throw new ArgumentException($"Unknown model: {model}")
            };
        }
    }

    public enum WhisperModel
    {
        Tiny,    // ~75 MB, fastest, least accurate
        Base,    // ~142 MB, fast, decent accuracy
        Small,   // ~466 MB, balanced
        Medium,  // ~1.5 GB, slow, high accuracy
        Large    // ~3 GB, slowest, best accuracy
    }

    /*
     * TODO: Setup Instructions for Whisper.cpp
     *
     * 1. Download Whisper.cpp:
     *    - Windows: https://github.com/ggerganov/whisper.cpp/releases
     *    - Get whisper.exe (or build from source)
     *
     * 2. Download Model:
     *    - Recommended: ggml-base.bin (142 MB, good balance)
     *    - Download from: https://huggingface.co/ggerganov/whisper.cpp
     *    - Save to: C:\ProgramData\SkynetCompanion\models\
     *
     * 3. Initialize in App.xaml.cs:
     *    WhisperHelper.Initialize(
     *        @"C:\ProgramData\SkynetCompanion\whisper.exe",
     *        @"C:\ProgramData\SkynetCompanion\models\ggml-base.bin"
     *    );
     *
     * 4. Update WhisperService.cs to use this helper:
     *
     *    public async Task<string> TranscribeAudioAsync(byte[] audioData)
     *    {
     *        // Save audio to temp file (WAV format, 16kHz mono)
     *        var tempPath = Path.GetTempFileName() + ".wav";
     *        File.WriteAllBytes(tempPath, audioData);
     *
     *        try
     *        {
     *            return await WhisperHelper.TranscribeAsync(tempPath);
     *        }
     *        finally
     *        {
     *            File.Delete(tempPath);
     *        }
     *    }
     */
}
