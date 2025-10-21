using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace VisibleConsoleScanner
{
    class Program
    {
        private static readonly HttpClient httpClient;
        private static string pinCode = "";
        private static string backendUrl = "https://void-scanner-api.onrender.com";

        static Program()
        {
            var handler = new HttpClientHandler();
            handler.ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true;
            httpClient = new HttpClient(handler);
            httpClient.Timeout = TimeSpan.FromMinutes(10);
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
                    Console.WriteLine("❌ PIN kodu gerekli!");
                    Console.WriteLine("Kullanım: VisibleConsoleScanner.exe [PIN]");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                Console.WriteLine("🔑 Backend'e bağlanıyor...");
                
                // API Key al
                var apiResponse = await httpClient.GetAsync($"{backendUrl}/api/get-api-key");
                if (apiResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ API Key başarıyla alındı!");
                }
                else
                {
                    Console.WriteLine("❌ API Key alınamadı!");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                // PIN doğrula
                Console.WriteLine($"🔍 PIN: {pinCode} doğrulanıyor...");
                var requestData = new { pin = pinCode };
                var json = JsonSerializer.Serialize(requestData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var pinResponse = await httpClient.PostAsync($"{backendUrl}/api/verify-pin", content);
                if (pinResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ PIN doğrulandı!");
                }
                else
                {
                    Console.WriteLine("❌ PIN doğrulanamadı!");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                // Tarama yap
                Console.WriteLine("🚀 Tarama başlatılıyor...");
                Console.WriteLine("🔍 Sistem bilgileri toplanıyor...");
                
                var scanData = new
                {
                    pinCode = pinCode,
                    scanTime = DateTime.Now,
                    deviceInfo = new {
                        computerName = Environment.MachineName,
                        userName = Environment.UserName,
                        osVersion = Environment.OSVersion.ToString(),
                        processorCount = Environment.ProcessorCount,
                        workingSet = Environment.WorkingSet
                    },
                    encryptedData = "visible_console_scan_data",
                    scannerId = $"VCS-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}"
                };

                Console.WriteLine("✅ Tarama tamamlandı!");
                Console.WriteLine("📤 Sonuçlar backend'e gönderiliyor...");

                var scanJson = JsonSerializer.Serialize(scanData);
                var scanContent = new StringContent(scanJson, Encoding.UTF8, "application/json");

                var scanResponse = await httpClient.PostAsync($"{backendUrl}/api/scan-results", scanContent);
                if (scanResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ Sonuçlar başarıyla gönderildi!");
                    Console.WriteLine("🎉 Tarama işlemi tamamlandı!");
                }
                else
                {
                    Console.WriteLine("❌ Tarama sonuçları gönderilemedi!");
                    Console.WriteLine($"Hata: {scanResponse.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Kritik Hata: {ex.Message}");
                Console.WriteLine($"Detay: {ex.StackTrace}");
            }

            Console.WriteLine();
            Console.WriteLine("✅ İşlem tamamlandı!");
            Console.WriteLine("Çıkmak için bir tuşa basın...");
            Console.ReadKey();
        }
    }
}
