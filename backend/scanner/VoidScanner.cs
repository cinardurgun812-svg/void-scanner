using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Management;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Win32;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Linq;

namespace VoidScanner
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
            httpClient.DefaultRequestHeaders.Add("User-Agent", $"VoidScanner/{scannerId}");
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
                Console.WriteLine("🚀 Güvenli tarama başlatılıyor...\n");

                var scanResults = await PerformSecurityScan();
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
            return $"VS-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
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
                File.AppendAllText("scanner_error.log", logMessage);
            }
            catch { }
        }

        static async Task<ScanResults> PerformSecurityScan()
        {
            Console.WriteLine("🔍 Sistem bilgileri toplanıyor...");
            
            var results = new ScanResults
            {
                PinCode = pinCode,
                ScanTime = DateTime.Now,
                DeviceInfo = GetDeviceInfo(),
                SecurityChecks = await PerformSecurityChecks(),
                SuspiciousProcesses = await FindSuspiciousProcesses(),
                SuspiciousFiles = await FindSuspiciousFiles(),
                RecentChanges = await GetRecentChanges(),
                MemoryInjections = await CheckMemoryInjections(),
                NetworkConnections = await GetNetworkConnections(),
                RegistryChecks = await CheckRegistry(),
                FileSystemChecks = await CheckFileSystem()
            };

            Console.WriteLine("✅ Tarama tamamlandı!");
            return results;
        }

        static DeviceInfo GetDeviceInfo()
        {
            try
            {
                var computerName = Environment.MachineName;
                var userName = Environment.UserName;
                var osVersion = Environment.OSVersion.ToString();
                var processorCount = Environment.ProcessorCount;
                var workingSet = Environment.WorkingSet;

                return new DeviceInfo
                {
                    ComputerName = computerName,
                    UserName = userName,
                    OSVersion = osVersion,
                    ProcessorCount = processorCount,
                    WorkingSet = workingSet,
                    ScanTime = DateTime.Now
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Cihaz bilgisi alma hatası: {ex.Message}");
                return new DeviceInfo { ScanTime = DateTime.Now };
            }
        }

        static async Task<SecurityChecks> PerformSecurityChecks()
        {
            var checks = new SecurityChecks();
            
            try
            {
                Console.WriteLine("🛡️ Güvenlik kontrolleri yapılıyor...");
                
                checks.AntivirusInstalled = await CheckAntivirus();
                checks.FirewallEnabled = await CheckFirewall();
                checks.WindowsDefenderEnabled = await CheckWindowsDefender();
                checks.SystemIntegrity = await CheckSystemIntegrity();
                checks.SuspiciousServices = await CheckSuspiciousServices();
                
                Console.WriteLine("✅ Güvenlik kontrolleri tamamlandı!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Güvenlik kontrol hatası: {ex.Message}");
            }
            
            return checks;
        }

        static async Task<bool> CheckAntivirus()
        {
            try
            {
                using var searcher = new ManagementObjectSearcher("SELECT * FROM AntiVirusProduct");
                var collection = searcher.Get();
                return collection.Count > 0;
            }
            catch
            {
                return false;
            }
        }

        static async Task<bool> CheckFirewall()
        {
            try
            {
                using var searcher = new ManagementObjectSearcher("SELECT * FROM FirewallProduct");
                var collection = searcher.Get();
                return collection.Count > 0;
            }
            catch
            {
                return false;
            }
        }

        static async Task<bool> CheckWindowsDefender()
        {
            try
            {
                var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows Defender");
                return key != null;
            }
            catch
            {
                return false;
            }
        }

        static async Task<bool> CheckSystemIntegrity()
        {
            try
            {
                var sfcResult = await RunCommand("sfc", "/verifyonly");
                return sfcResult.Contains("did not find any integrity violations");
            }
            catch
            {
                return false;
            }
        }

        static async Task<List<string>> CheckSuspiciousServices()
        {
            var suspiciousServices = new List<string>();
            try
            {
                using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_Service");
                var collection = searcher.Get();
                
                foreach (ManagementObject service in collection)
                {
                    var serviceName = service["Name"]?.ToString();
                    var displayName = service["DisplayName"]?.ToString();
                    
                    if (IsSuspiciousService(serviceName, displayName))
                    {
                        suspiciousServices.Add($"{serviceName} - {displayName}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Servis kontrol hatası: {ex.Message}");
            }
            
            return suspiciousServices;
        }

        static bool IsSuspiciousService(string serviceName, string displayName)
        {
            var suspiciousKeywords = new[]
            {
                "cheat", "hack", "inject", "bypass", "crack", "keygen",
                "trainer", "mod", "exploit", "memory", "hook"
            };
            
            var text = $"{serviceName} {displayName}".ToLower();
            return suspiciousKeywords.Any(keyword => text.Contains(keyword));
        }

        static async Task<List<string>> FindSuspiciousProcesses()
        {
            var suspiciousProcesses = new List<string>();
            try
            {
                Console.WriteLine("🔍 Şüpheli süreçler aranıyor...");
                
                var processes = Process.GetProcesses();
                var suspiciousKeywords = new[]
                {
                    "cheat", "hack", "inject", "bypass", "crack", "keygen",
                    "trainer", "mod", "exploit", "memory", "hook", "debugger"
                };
                
                foreach (var process in processes)
                {
                    try
                    {
                        var processName = process.ProcessName.ToLower();
                        var mainModule = process.MainModule?.FileName?.ToLower() ?? "";
                        
                        if (suspiciousKeywords.Any(keyword => 
                            processName.Contains(keyword) || mainModule.Contains(keyword)))
                        {
                            suspiciousProcesses.Add($"{process.ProcessName} (PID: {process.Id})");
                        }
                    }
                    catch
                    {
                        // Process erişim hatası, devam et
                    }
                }
                
                Console.WriteLine($"✅ {suspiciousProcesses.Count} şüpheli süreç bulundu!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Süreç tarama hatası: {ex.Message}");
            }
            
            return suspiciousProcesses;
        }

        static async Task<List<string>> FindSuspiciousFiles()
        {
            var suspiciousFiles = new List<string>();
            try
            {
                Console.WriteLine("📁 Şüpheli dosyalar aranıyor...");
                
                var suspiciousExtensions = new[]
                {
                    ".exe", ".dll", ".bat", ".cmd", ".ps1", ".vbs", ".js"
                };
                
                var suspiciousKeywords = new[]
                {
                    "cheat", "hack", "inject", "bypass", "crack", "keygen",
                    "trainer", "mod", "exploit", "memory", "hook"
                };
                
                var searchPaths = new[]
                {
                    Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                    Environment.GetFolderPath(Environment.SpecialFolder.Documents),
                    Environment.GetFolderPath(Environment.SpecialFolder.Downloads),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "AppData", "Local", "Temp")
                };
                
                foreach (var searchPath in searchPaths)
                {
                    if (Directory.Exists(searchPath))
                    {
                        try
                        {
                            var files = Directory.GetFiles(searchPath, "*.*", SearchOption.TopDirectoryOnly)
                                .Where(f => suspiciousExtensions.Contains(Path.GetExtension(f).ToLower()))
                                .Take(50); // Performans için sınırla
                            
                            foreach (var file in files)
                            {
                                var fileName = Path.GetFileName(file).ToLower();
                                if (suspiciousKeywords.Any(keyword => fileName.Contains(keyword)))
                                {
                                    suspiciousFiles.Add(file);
                                }
                            }
                        }
                        catch
                        {
                            // Dizin erişim hatası, devam et
                        }
                    }
                }
                
                Console.WriteLine($"✅ {suspiciousFiles.Count} şüpheli dosya bulundu!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Dosya tarama hatası: {ex.Message}");
            }
            
            return suspiciousFiles;
        }

        static async Task<List<string>> GetRecentChanges()
        {
            var recentChanges = new List<string>();
            try
            {
                Console.WriteLine("📅 Son 12 saatteki değişiklikler kontrol ediliyor...");
                
                var cutoffTime = DateTime.Now.AddHours(-12);
                var searchPaths = new[]
                {
                    Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                    Environment.GetFolderPath(Environment.SpecialFolder.Documents),
                    Environment.GetFolderPath(Environment.SpecialFolder.Downloads)
                };
                
                foreach (var searchPath in searchPaths)
                {
                    if (Directory.Exists(searchPath))
                    {
                        try
                        {
                            var files = Directory.GetFiles(searchPath, "*.*", SearchOption.TopDirectoryOnly)
                                .Where(f => File.GetLastWriteTime(f) > cutoffTime)
                                .Take(20); // Performans için sınırla
                            
                            foreach (var file in files)
                            {
                                recentChanges.Add($"{Path.GetFileName(file)} - {File.GetLastWriteTime(file):yyyy-MM-dd HH:mm:ss}");
                            }
                        }
                        catch
                        {
                            // Dizin erişim hatası, devam et
                        }
                    }
                }
                
                Console.WriteLine($"✅ {recentChanges.Count} son değişiklik bulundu!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Son değişiklik kontrol hatası: {ex.Message}");
            }
            
            return recentChanges;
        }

        static async Task<List<string>> CheckMemoryInjections()
        {
            var memoryInjections = new List<string>();
            try
            {
                Console.WriteLine("🧠 Memory injection kontrolü yapılıyor...");
                
                var processes = Process.GetProcesses();
                foreach (var process in processes)
                {
                    try
                    {
                        if (process.ProcessName.ToLower().Contains("inject") ||
                            process.ProcessName.ToLower().Contains("hook") ||
                            process.ProcessName.ToLower().Contains("dll"))
                        {
                            memoryInjections.Add($"{process.ProcessName} (PID: {process.Id})");
                        }
                    }
                    catch
                    {
                        // Process erişim hatası, devam et
                    }
                }
                
                Console.WriteLine($"✅ {memoryInjections.Count} memory injection bulundu!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Memory injection kontrol hatası: {ex.Message}");
            }
            
            return memoryInjections;
        }

        static async Task<List<string>> GetNetworkConnections()
        {
            var networkConnections = new List<string>();
            try
            {
                Console.WriteLine("🌐 Ağ bağlantıları kontrol ediliyor...");
                
                var netstatResult = await RunCommand("netstat", "-an");
                var lines = netstatResult.Split('\n');
                
                foreach (var line in lines)
                {
                    if (line.Contains("ESTABLISHED") || line.Contains("LISTENING"))
                    {
                        networkConnections.Add(line.Trim());
                    }
                }
                
                Console.WriteLine($"✅ {networkConnections.Count} ağ bağlantısı bulundu!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ağ bağlantı kontrol hatası: {ex.Message}");
            }
            
            return networkConnections.Take(20).ToList(); // Performans için sınırla
        }

        static async Task<List<string>> CheckRegistry()
        {
            var registryIssues = new List<string>();
            try
            {
                Console.WriteLine("🔧 Registry kontrolü yapılıyor...");
                
                var suspiciousKeys = new[]
                {
                    @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
                    @"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"
                };
                
                foreach (var keyPath in suspiciousKeys)
                {
                    try
                    {
                        var key = Registry.LocalMachine.OpenSubKey(keyPath);
                        if (key != null)
                        {
                            var valueNames = key.GetValueNames();
                            foreach (var valueName in valueNames)
                            {
                                var value = key.GetValue(valueName)?.ToString();
                                if (!string.IsNullOrEmpty(value) && IsSuspiciousPath(value))
                                {
                                    registryIssues.Add($"{keyPath}\\{valueName} = {value}");
                                }
                            }
                        }
                    }
                    catch
                    {
                        // Registry erişim hatası, devam et
                    }
                }
                
                Console.WriteLine($"✅ {registryIssues.Count} registry sorunu bulundu!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Registry kontrol hatası: {ex.Message}");
            }
            
            return registryIssues;
        }

        static bool IsSuspiciousPath(string path)
        {
            var suspiciousKeywords = new[]
            {
                "cheat", "hack", "inject", "bypass", "crack", "keygen",
                "trainer", "mod", "exploit", "memory", "hook"
            };
            
            var lowerPath = path.ToLower();
            return suspiciousKeywords.Any(keyword => lowerPath.Contains(keyword));
        }

        static async Task<List<string>> CheckFileSystem()
        {
            var fileSystemIssues = new List<string>();
            try
            {
                Console.WriteLine("💾 Dosya sistemi kontrolü yapılıyor...");
                
                var systemRoot = Environment.GetFolderPath(Environment.SpecialFolder.System);
                var suspiciousFiles = new[]
                {
                    "kernel32.dll", "ntdll.dll", "user32.dll"
                };
                
                foreach (var suspiciousFile in suspiciousFiles)
                {
                    var filePath = Path.Combine(systemRoot, suspiciousFile);
                    if (File.Exists(filePath))
                    {
                        var fileInfo = new FileInfo(filePath);
                        if (fileInfo.Length < 1000 || fileInfo.Length > 10000000) // Şüpheli boyut
                        {
                            fileSystemIssues.Add($"Şüpheli dosya boyutu: {suspiciousFile} ({fileInfo.Length} bytes)");
                        }
                    }
                }
                
                Console.WriteLine($"✅ {fileSystemIssues.Count} dosya sistemi sorunu bulundu!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Dosya sistemi kontrol hatası: {ex.Message}");
            }
            
            return fileSystemIssues;
        }

        static async Task<string> RunCommand(string command, string arguments)
        {
            try
            {
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = command,
                        Arguments = arguments,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };
                
                process.Start();
                var output = await process.StandardOutput.ReadToEndAsync();
                await process.WaitForExitAsync();
                
                return output;
            }
            catch
            {
                return "";
            }
        }

        static async Task SendResultsToBackend(ScanResults results)
        {
            try
            {
                Console.WriteLine("📤 Sonuçlar backend'e gönderiliyor...");
                
                var encryptedData = EncryptData(results);
                var requestData = new
                {
                    pinCode = pinCode,
                    scanTime = results.ScanTime,
                    deviceInfo = results.DeviceInfo,
                    encryptedData = encryptedData,
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
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Sonuç gönderme hatası: {ex.Message}");
            }
        }

        static string EncryptData(object data)
        {
            try
            {
                var json = JsonSerializer.Serialize(data);
                var key = Encoding.UTF8.GetBytes("VoidScanner2024Key1234567890123456"); // 32 byte key
                
                using var aes = Aes.Create();
                aes.Key = key;
                aes.GenerateIV();
                
                using var encryptor = aes.CreateEncryptor();
                using var msEncrypt = new MemoryStream();
                using var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write);
                using var swEncrypt = new StreamWriter(csEncrypt);
                
                swEncrypt.Write(json);
                swEncrypt.Close();
                
                var encrypted = msEncrypt.ToArray();
                var result = new byte[aes.IV.Length + encrypted.Length];
                Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
                Buffer.BlockCopy(encrypted, 0, result, aes.IV.Length, encrypted.Length);
                
                return Convert.ToBase64String(result);
            }
            catch
            {
                return JsonSerializer.Serialize(data);
            }
        }
    }

    // Data Models
    public class ApiKeyResponse
    {
        public string apiKey { get; set; }
        public string message { get; set; }
    }

    public class ScanResponse
    {
        public bool valid { get; set; }
        public string message { get; set; }
        public string token { get; set; }
    }

    public class ScanResults
    {
        public string PinCode { get; set; }
        public DateTime ScanTime { get; set; }
        public DeviceInfo DeviceInfo { get; set; }
        public SecurityChecks SecurityChecks { get; set; }
        public List<string> SuspiciousProcesses { get; set; } = new();
        public List<string> SuspiciousFiles { get; set; } = new();
        public List<string> RecentChanges { get; set; } = new();
        public List<string> MemoryInjections { get; set; } = new();
        public List<string> NetworkConnections { get; set; } = new();
        public List<string> RegistryChecks { get; set; } = new();
        public List<string> FileSystemChecks { get; set; } = new();
    }

    public class DeviceInfo
    {
        public string ComputerName { get; set; }
        public string UserName { get; set; }
        public string OSVersion { get; set; }
        public int ProcessorCount { get; set; }
        public long WorkingSet { get; set; }
        public DateTime ScanTime { get; set; }
    }

    public class SecurityChecks
    {
        public bool AntivirusInstalled { get; set; }
        public bool FirewallEnabled { get; set; }
        public bool WindowsDefenderEnabled { get; set; }
        public bool SystemIntegrity { get; set; }
        public List<string> SuspiciousServices { get; set; } = new();
    }
}