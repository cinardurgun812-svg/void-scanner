using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.IO;

namespace DynamicPathScanner
{
    class Program
    {
        private static readonly HttpClient httpClient;
        private static string pinCode = "";
        private static string backendUrl = "https://void-scanner-api.onrender.com";
        
        // Dinamik dosya yolları - Exe'nin bulunduğu dizin
        private static string exeDirectory = AppContext.BaseDirectory;
        private static string dataDirectory = Path.Combine(exeDirectory, "data");
        private static string logsDirectory = Path.Combine(exeDirectory, "logs");

        static Program()
        {
            var handler = new HttpClientHandler();
            handler.ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true;
            httpClient = new HttpClient(handler);
            httpClient.Timeout = TimeSpan.FromMinutes(10);
            
            // Gerekli dizinleri oluştur
            CreateDirectoriesIfNotExist();
        }

        static void CreateDirectoriesIfNotExist()
        {
            try
            {
                if (!Directory.Exists(dataDirectory))
                {
                    Directory.CreateDirectory(dataDirectory);
                    Console.WriteLine($"📁 Data dizini oluşturuldu: {dataDirectory}");
                }
                
                if (!Directory.Exists(logsDirectory))
                {
                    Directory.CreateDirectory(logsDirectory);
                    Console.WriteLine($"📁 Logs dizini oluşturuldu: {logsDirectory}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Dizin oluşturma hatası: {ex.Message}");
            }
        }

        static async Task Main(string[] args)
        {
            Console.WriteLine("╔══════════════════════════════════════╗");
            Console.WriteLine("║        DYNAMIC PATH SCANNER          ║");
            Console.WriteLine("║         🔐 SECURE MODE 🔐            ║");
            Console.WriteLine("╚══════════════════════════════════════╝");
            Console.WriteLine();
            
            Console.WriteLine($"📂 Exe Dizini: {exeDirectory}");
            Console.WriteLine($"📂 Data Dizini: {dataDirectory}");
            Console.WriteLine($"📂 Logs Dizini: {logsDirectory}");
            Console.WriteLine();

            try
            {
                if (args.Length == 0)
                {
                    Console.WriteLine("❌ PIN kodu gerekli!");
                    Console.WriteLine("Kullanım: DynamicPathScanner.exe [PIN]");
                    Console.WriteLine("Çıkmak için bir tuşa basın...");
                    Console.ReadKey();
                    return;
                }

                pinCode = args[0].ToUpper().Trim();
                Console.WriteLine($"🔑 PIN alındı: {pinCode}");

                Console.WriteLine("🔑 Backend'e bağlanıyor...");
                Console.WriteLine($"🌐 Backend URL: {backendUrl}");
                
                // API Key al
                var apiResponse = await httpClient.GetAsync($"{backendUrl}/api/get-api-key");
                if (apiResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ API Key başarıyla alındı!");
                }
                else
                {
                    Console.WriteLine("❌ API Key alınamadı!");
                    Console.WriteLine($"Hata: {apiResponse.StatusCode}");
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
                    Console.WriteLine($"Hata: {pinResponse.StatusCode}");
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
                        workingSet = Environment.WorkingSet,
                        exeDirectory = exeDirectory,
                        dataDirectory = dataDirectory,
                        logsDirectory = logsDirectory
                    },
                    encryptedData = "dynamic_path_scanner_data",
                    scannerId = $"DYNAMIC-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}"
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
                    
                    // Log dosyasına kaydet
                    await SaveLogToFile(scanData);
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
                
                // Hata logunu kaydet
                await SaveErrorLogToFile(ex);
            }

            Console.WriteLine();
            Console.WriteLine("✅ İşlem tamamlandı!");
            Console.WriteLine("Çıkmak için bir tuşa basın...");
            Console.ReadKey();
        }

        static async Task SaveLogToFile(object scanData)
        {
            try
            {
                var logFile = Path.Combine(logsDirectory, $"scan_{DateTime.Now:yyyyMMdd_HHmmss}.json");
                var logContent = JsonSerializer.Serialize(scanData, new JsonSerializerOptions { WriteIndented = true });
                await File.WriteAllTextAsync(logFile, logContent);
                Console.WriteLine($"📝 Log kaydedildi: {logFile}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Log kaydetme hatası: {ex.Message}");
            }
        }

        static async Task SaveErrorLogToFile(Exception ex)
        {
            try
            {
                var errorLogFile = Path.Combine(logsDirectory, $"error_{DateTime.Now:yyyyMMdd_HHmmss}.txt");
                var errorContent = $"Hata: {ex.Message}\nDetay: {ex.StackTrace}\nZaman: {DateTime.Now}";
                await File.WriteAllTextAsync(errorLogFile, errorContent);
                Console.WriteLine($"📝 Hata logu kaydedildi: {errorLogFile}");
            }
            catch (Exception logEx)
            {
                Console.WriteLine($"❌ Hata logu kaydetme hatası: {logEx.Message}");
            }
        }
    }
}
