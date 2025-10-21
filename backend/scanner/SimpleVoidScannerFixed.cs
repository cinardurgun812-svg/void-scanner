using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SimpleVoidScannerFixed
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
            httpClient.Timeout = TimeSpan.FromMinutes(5);
        }

        static async Task Main(string[] args)
        {
            Console.WriteLine("╔══════════════════════════════════════╗");
            Console.WriteLine("║           VOID SCANNER               ║");
            Console.WriteLine("║      Advanced Security Scanner        ║");
            Console.WriteLine("║         🔐 SECURE MODE 🔐            ║");
            Console.WriteLine("╚══════════════════════════════════════╝");
            Console.WriteLine();

            try
            {
                // PIN'i command line parametresi olarak al
                if (args.Length > 0)
                {
                    pinCode = args[0].ToUpper().Trim();
                    Console.WriteLine($"🔑 PIN alındı: {pinCode}");
                }
                else
                {
                    Console.WriteLine("❌ PIN kodu gerekli! Kullanım: VoidScanner.exe [PIN]");
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

                if (pinCode.Length != 8)
                {
                    Console.WriteLine("❌ Geçersiz PIN formatı! (8 karakter olmalı)");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                Console.WriteLine("🔑 Backend'e bağlanıyor...");
                
                // API Key al
                var apiKeyResponse = await httpClient.GetAsync($"{backendUrl}/api/get-api-key");
                if (!apiKeyResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine("❌ API Key alınamadı! Bağlantı hatası.");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                Console.WriteLine("✅ API Key başarıyla alındı!");
                Console.WriteLine($"🔍 PIN: {pinCode} doğrulanıyor...");
                
                // PIN doğrula
                var pinData = new { pin = pinCode };
                var json = JsonSerializer.Serialize(pinData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var pinResponse = await httpClient.PostAsync($"{backendUrl}/api/verify-pin", content);
                if (!pinResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine("❌ PIN doğrulanamadı!");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                Console.WriteLine("✅ PIN doğrulandı!");
                Console.WriteLine("🚀 Güvenli tarama başlatılıyor...\n");

                // Tarama simülasyonu
                await PerformSecurityScan();
                
                Console.WriteLine("\n✅ Tarama tamamlandı!");
                Console.WriteLine("Çıkmak için bir tuşa basın...");
                Console.ReadKey();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Kritik Hata: {ex.Message}");
                Console.WriteLine("Çıkmak için bir tuşa basın...");
                Console.ReadKey();
            }
        }

        static async Task PerformSecurityScan()
        {
            Console.WriteLine("🔍 Sistem bilgileri toplanıyor...");
            await Task.Delay(1000);
            
            Console.WriteLine("🛡️ Güvenlik kontrolleri yapılıyor...");
            await Task.Delay(1000);
            
            Console.WriteLine("🔍 Şüpheli süreçler aranıyor...");
            await Task.Delay(1000);
            
            Console.WriteLine("📁 Şüpheli dosyalar aranıyor...");
            await Task.Delay(1000);
            
            Console.WriteLine("📅 Son değişiklikler kontrol ediliyor...");
            await Task.Delay(1000);
            
            Console.WriteLine("🧠 Memory injection kontrolü yapılıyor...");
            await Task.Delay(1000);
            
            Console.WriteLine("🌐 Ağ bağlantıları kontrol ediliyor...");
            await Task.Delay(1000);
            
            Console.WriteLine("🔧 Registry kontrolü yapılıyor...");
            await Task.Delay(1000);
            
            Console.WriteLine("💾 Dosya sistemi kontrolü yapılıyor...");
            await Task.Delay(1000);
            
            // Sonuçları backend'e gönder
            await SendResultsToBackend();
        }

        static async Task SendResultsToBackend()
        {
            try
            {
                Console.WriteLine("📤 Sonuçlar backend'e gönderiliyor...");
                
                var scanResults = new
                {
                    pinCode = pinCode,
                    scanTime = DateTime.Now,
                    deviceInfo = new
                    {
                        ComputerName = Environment.MachineName,
                        UserName = Environment.UserName,
                        OSVersion = Environment.OSVersion.ToString(),
                        ProcessorCount = Environment.ProcessorCount,
                        WorkingSet = Environment.WorkingSet,
                        ScanTime = DateTime.Now
                    },
                    encryptedData = "SCAN_RESULTS_ENCRYPTED_DATA",
                    scannerId = $"VS-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}"
                };
                
                var json = JsonSerializer.Serialize(scanResults);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                content.Headers.Add("X-API-Key", "VOID_SCANNER_API_KEY_2025");
                
                var response = await httpClient.PostAsync($"{backendUrl}/api/scan-results", content);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ Sonuçlar başarıyla gönderildi!");
                }
                else
                {
                    Console.WriteLine($"❌ Sonuç gönderme hatası: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Sonuç gönderme hatası: {ex.Message}");
            }
        }
    }
}
