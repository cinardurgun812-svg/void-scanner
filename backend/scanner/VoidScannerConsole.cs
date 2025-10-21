using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Linq;

namespace VoidScannerConsole
{
    class Program
    {
        private static readonly HttpClient httpClient;
        private static string pinCode = "";
        private static string backendUrl = "https://void-scanner-api.onrender.com";
        private static string apiKey = "";
        private static readonly string scannerId = GenerateScannerId();

        static Program()
        {
            var handler = new HttpClientHandler();
            handler.ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true;

            httpClient = new HttpClient(handler);
            httpClient.Timeout = TimeSpan.FromMinutes(10);
            httpClient.DefaultRequestHeaders.Add("User-Agent", $"VoidScannerConsole/{scannerId}");
        }

        static async Task Main(string[] args)
        {
            Console.WriteLine("╔══════════════════════════════════════╗");
            Console.WriteLine("║        VOID SCANNER CONSOLE           ║");
            Console.WriteLine("║         🔐 SECURE MODE 🔐            ║");
            Console.WriteLine("╚══════════════════════════════════════╝");
            Console.WriteLine();

            try
            {
                if (args.Length > 0)
                {
                    pinCode = args[0].ToUpper().Trim();
                    Console.WriteLine($"🔑 PIN alındı: {pinCode}");
                }
                else
                {
                    Console.WriteLine("❌ PIN kodu gerekli! Kullanım: VoidScannerConsole.exe [PIN]");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                if (string.IsNullOrEmpty(pinCode))
                {
                    Console.WriteLine("❌ PIN kodu gerekli!");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                if (!IsValidPinFormat(pinCode))
                {
                    Console.WriteLine("❌ Geçersiz PIN formatı! (8 karakter, A-Z ve 0-9)");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                Console.WriteLine("🔑 Backend'e bağlanıyor...");
                await GetApiKey();

                if (string.IsNullOrEmpty(apiKey))
                {
                    Console.WriteLine("❌ API Key alınamadı! Bağlantı hatası.");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                Console.WriteLine("✅ API Key başarıyla alındı!");
                Console.WriteLine($"🔍 PIN: {pinCode} doğrulanıyor...");

                var pinValid = await VerifyPin();
                if (!pinValid)
                {
                    Console.WriteLine("❌ PIN doğrulanamadı!");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                Console.WriteLine("✅ PIN doğrulandı!");
                Console.WriteLine("🚀 Tarama başlatılıyor...\n");

                var scanResults = await PerformScan();
                await SendResultsToBackend(scanResults);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Kritik Hata: {ex.Message}");
                LogError(ex);
            }

            Console.WriteLine("\n✅ Tarama tamamlandı!");
            Console.WriteLine("Çıkmak için bir tuşa basın...");
            Console.ReadKey();
        }

        static string GenerateScannerId()
        {
            return $"VSC-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        }

        static bool IsValidPinFormat(string pin)
        {
            return pin.Length == 8 && pin.All(c => (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'));
        }

        static async Task GetApiKey()
        {
            try
            {
                var response = await httpClient.GetAsync($"{backendUrl}/api/get-api-key");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<ApiKeyResponse>(content);
                    apiKey = result?.apiKey ?? "";
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"API Key alma hatası: {ex.Message}");
            }
        }

        static async Task<bool> VerifyPin()
        {
            try
            {
                var requestData = new { pin = pinCode };
                var json = JsonSerializer.Serialize(requestData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync($"{backendUrl}/api/verify-pin", content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"PIN doğrulama hatası: {ex.Message}");
                return false;
            }
        }

        static void LogError(Exception ex)
        {
            try
            {
                var logMessage = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] ERROR: {ex.Message}\n{ex.StackTrace}\n";
                File.AppendAllText("void_scanner_error.log", logMessage);
            }
            catch { }
        }

        static async Task<ScanResults> PerformScan()
        {
            Console.WriteLine("🔍 Sistem bilgileri toplanıyor...");

            var results = new ScanResults
            {
                PinCode = pinCode,
                ScanTime = DateTime.Now,
                ComputerName = Environment.MachineName,
                UserName = Environment.UserName,
                OSVersion = Environment.OSVersion.ToString(),
                ProcessorCount = Environment.ProcessorCount,
                WorkingSet = Environment.WorkingSet,
                SystemDirectory = Environment.SystemDirectory,
                UserDomainName = Environment.UserDomainName,
                Version = Environment.Version.ToString()
            };

            Console.WriteLine("✅ Tarama tamamlandı!");
            return results;
        }

        static async Task SendResultsToBackend(ScanResults results)
        {
            try
            {
                Console.WriteLine("📤 Sonuçlar backend'e gönderiliyor...");

                var requestData = new
                {
                    pinCode = pinCode,
                    scanTime = results.ScanTime,
                    deviceInfo = new {
                        computerName = results.ComputerName,
                        userName = results.UserName,
                        osVersion = results.OSVersion,
                        processorCount = results.ProcessorCount,
                        workingSet = results.WorkingSet,
                        systemDirectory = results.SystemDirectory,
                        userDomainName = results.UserDomainName,
                        version = results.Version
                    },
                    encryptedData = "console_scan_data_encrypted",
                    scannerId = scannerId
                };

                var json = JsonSerializer.Serialize(requestData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                content.Headers.Add("X-API-Key", apiKey);

                var response = await httpClient.PostAsync($"{backendUrl}/api/scan-results", content);

                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ Sonuçlar başarıyla gönderildi!");
                }
                else
                {
                    Console.WriteLine($"❌ Sonuç gönderme hatası: {response.StatusCode}");
                    Console.WriteLine($"Hata Detayı: {await response.Content.ReadAsStringAsync()}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Sonuç gönderme hatası: {ex.Message}");
            }
        }
    }

    // Data Models
    public class ApiKeyResponse
    {
        public string apiKey { get; set; }
        public string message { get; set; }
    }

    public class ScanResults
    {
        public string PinCode { get; set; }
        public DateTime ScanTime { get; set; }
        public string ComputerName { get; set; }
        public string UserName { get; set; }
        public string OSVersion { get; set; }
        public int ProcessorCount { get; set; }
        public long WorkingSet { get; set; }
        public string SystemDirectory { get; set; }
        public string UserDomainName { get; set; }
        public string Version { get; set; }
    }
}