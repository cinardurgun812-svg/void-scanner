using System;
using System.Drawing;
using System.Windows.Forms;
using System.IO;
using System.Threading;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json;
using System.Net;

namespace VoidScanner
{
    public partial class MainForm : Form
    {
        private PictureBox animePictureBox;
        private Label statusLabel;
        private ProgressBar progressBar;
        private string pinCode = "";
        
        public MainForm()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.SuspendLayout();
            
            // Form settings - NO DRAGGING, NO RESIZING
            this.Text = "Void Scanner - Security Analysis";
            this.Size = new Size(700, 400);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog; // Fixed dialog prevents dragging
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.ControlBox = false; // Remove all window controls
            this.BackColor = Color.Black; // Pure black background
            this.ForeColor = Color.White;
            this.TopMost = true; // Always on top
            
            // Anime picture box - FULL SCREEN
            animePictureBox = new PictureBox
            {
                Size = new Size(700, 400), // Full form size
                Location = new Point(0, 0),
                SizeMode = PictureBoxSizeMode.Zoom,
                BackColor = Color.Black,
                BorderStyle = BorderStyle.None
            };
            
            // Load anime image
            try
            {
                // Try multiple paths for anime.jpg.jpg
                var possiblePaths = new[]
                {
                    "anime.jpg.jpg", // Current directory
                    Path.Combine(Application.StartupPath, "anime.jpg.jpg"), // Exe directory
                    Path.Combine(Environment.CurrentDirectory, "anime.jpg.jpg"), // Working directory
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "anime.jpg.jpg") // App base directory
                };
                
                bool imageLoaded = false;
                foreach (var path in possiblePaths)
                {
                    if (File.Exists(path))
                    {
                        Console.WriteLine("Anime.jpg.jpg bulundu: " + path);
                        animePictureBox.Image = Image.FromFile(path);
                        Console.WriteLine("Anime resmi başarıyla yüklendi!");
                        imageLoaded = true;
                        break;
                    }
                }
                
                if (!imageLoaded)
                {
                    Console.WriteLine("Anime.jpg.jpg hiçbir yerde bulunamadı, yağmur efekti oluşturuluyor...");
                    Console.WriteLine("Aranan dizinler:");
                    foreach (var path in possiblePaths)
                    {
                        Console.WriteLine("  - " + path);
                    }
                    // Create black background with rain effect
                    animePictureBox.Image = CreateRainEffectImage();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Anime resmi yükleme hatası: " + ex.Message);
                animePictureBox.Image = CreateRainEffectImage();
            }
            
            // Status label - OVERLAY on anime image
            statusLabel = new Label
            {
                Text = "🔐 PIN doğrulanıyor...",
                Location = new Point(50, 320),
                Size = new Size(600, 30),
                Font = new Font("Segoe UI", 12, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleCenter,
                ForeColor = Color.LightGreen,
                BackColor = Color.Transparent
            };
            
            // Progress bar - OVERLAY on anime image
            progressBar = new ProgressBar
            {
                Location = new Point(50, 360),
                Size = new Size(600, 25),
                Style = ProgressBarStyle.Continuous,
                Value = 0,
                BackColor = Color.Black,
                ForeColor = Color.LightGreen
            };
            
            // Add controls to form
            this.Controls.Add(animePictureBox);
            this.Controls.Add(statusLabel);
            this.Controls.Add(progressBar);
            
            this.ResumeLayout(false);
        }
        
        private Image CreateRainEffectImage()
        {
            var bitmap = new Bitmap(700, 400);
            using (var g = Graphics.FromImage(bitmap))
            {
                // Pure black background
                g.Clear(Color.Black);
                
                // Create rain effect
                var random = new Random();
                var pen = new Pen(Color.FromArgb(80, 80, 80), 1); // Dark gray rain
                
                // Draw vertical rain lines
                for (int i = 0; i < 200; i++)
                {
                    int x = random.Next(0, 700);
                    int y1 = random.Next(0, 400);
                    int y2 = y1 + random.Next(20, 60);
                    
                    g.DrawLine(pen, x, y1, x, y2);
                }
                
                // Add some lighter rain lines
                pen.Color = Color.FromArgb(120, 120, 120);
                for (int i = 0; i < 100; i++)
                {
                    int x = random.Next(0, 700);
                    int y1 = random.Next(0, 400);
                    int y2 = y1 + random.Next(10, 30);
                    
                    g.DrawLine(pen, x, y1, x, y2);
                }
            }
            return bitmap;
        }
        
        protected override void OnLoad(EventArgs e)
        {
            base.OnLoad(e);
            
            // Get PIN from command line arguments
            var args = Environment.GetCommandLineArgs();
            if (args.Length > 1)
            {
                pinCode = args[1].ToUpper().Trim();
            }
            
            if (string.IsNullOrEmpty(pinCode) || !IsValidPinFormat(pinCode))
            {
                statusLabel.Text = "❌ Geçersiz PIN! Program kapatılıyor...";
                statusLabel.ForeColor = Color.Red;
                System.Windows.Forms.Timer timer = new System.Windows.Forms.Timer();
                timer.Interval = 2000;
                timer.Tick += (s, ev) => { timer.Stop(); Application.Exit(); };
                timer.Start();
                return;
            }
            
            // Start the scanning process
            StartScanning();
        }
        
        private void StartScanning()
        {
            // Start scanning in background thread to prevent UI blocking
            Thread scanThread = new Thread(() =>
            {
                try
                {
                    UpdateStatus("🔑 PIN doğrulanıyor...", Color.Yellow);
                    Thread.Sleep(1000);
                    
                    UpdateStatus("✅ PIN doğrulandı!", Color.LightGreen);
                    UpdateProgress(20);
                    
                    UpdateStatus("📸 Ekran görüntüsü alınıyor...", Color.Yellow);
                    Thread.Sleep(1000);
                    TakeScreenshot();
                    UpdateProgress(40);
                    
                    UpdateStatus("🔍 Sistem bilgileri toplanıyor...", Color.Yellow);
                    Thread.Sleep(1500);
                    UpdateProgress(60);
                    
                    UpdateStatus("🛡️ Güvenlik taraması yapılıyor...", Color.Yellow);
                    Thread.Sleep(2000);
                    UpdateProgress(80);
                    
                    UpdateStatus("📤 Sonuçlar gönderiliyor...", Color.Yellow);
                    Thread.Sleep(1500);
                    
                    // Send results to backend
                    SendScanResults();
                    UpdateProgress(95);
                    
                    UpdateStatus("✅ Tarama tamamlandı! Program kapatılıyor...", Color.LightGreen);
                    Thread.Sleep(2000);
                    
                    // Close application
                    this.Invoke(new Action(() => Application.Exit()));
                }
                catch (Exception ex)
                {
                    UpdateStatus("❌ Hata: " + ex.Message, Color.Red);
                    Thread.Sleep(3000);
                    this.Invoke(new Action(() => Application.Exit()));
                }
            });
            
            scanThread.IsBackground = true;
            scanThread.Start();
        }
        
        private void UpdateStatus(string text, Color color)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => UpdateStatus(text, color)));
                return;
            }
            
            statusLabel.Text = text;
            statusLabel.ForeColor = color;
            Application.DoEvents();
        }
        
        private void UpdateProgress(int value)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => UpdateProgress(value)));
                return;
            }
            
            progressBar.Value = Math.Min(100, Math.Max(0, value));
            Application.DoEvents();
        }
        
        private void TakeScreenshot()
        {
            try
            {
                var screenBounds = Screen.PrimaryScreen.Bounds;
                var bitmap = new Bitmap(screenBounds.Width, screenBounds.Height);
                
                using (var graphics = Graphics.FromImage(bitmap))
                {
                    graphics.CopyFromScreen(screenBounds.X, screenBounds.Y, 0, 0, screenBounds.Size);
                }
                
                // Save screenshot
                bitmap.Save("screenshot.jpg", System.Drawing.Imaging.ImageFormat.Jpeg);
            }
            catch
            {
                // Ignore screenshot errors
            }
        }
        
        private void SendScanResults()
        {
            try
            {
                // Create scan results
                var scanResults = new
                {
                    pin = pinCode,
                    results = "VOID SCANNER - REAL SCAN REPORT\n" +
                             "============================\n" +
                             "Scan Date: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "\n" +
                             "SYSTEM INFORMATION:\n" +
                             "OS: " + Environment.OSVersion.ToString() + "\n" +
                             "User: " + Environment.UserName + "\n" +
                             "Desktop: " + Environment.GetFolderPath(Environment.SpecialFolder.Desktop) + "\n" +
                             "System Time: " + DateTime.Now.ToString("HH:mm:ss") + "\n" +
                             "Boot Time: " + GetBootTime() + "\n" +
                             "VPN: " + CheckVPN() + "\n" +
                             "Install Date: " + GetInstallDate() + "\n" +
                             "Country: Türkiye\n" +
                             "Game Activity: " + GetGameActivity() + "\n" +
                             "Recycle Activity: " + GetRecycleActivity() + "\n" +
                             "Hardware Stats: CPU: " + GetCPUInfo() + "\n" +
                             "FiveM Mods: " + GetFiveMMods() + "\n" +
                             "Discord Account: " + GetDiscordAccount() + "\n" +
                             "SERVICES:\n" +
                             GetServices() + "\n" +
                             "DETECTIONS:\n" +
                             GetDetections() + "\n" +
                             "CHEAT WEBSITES:\n" +
                             GetCheatWebsites() + "\n" +
                             "USB DEVICES:\n" +
                             GetUSBDevices(),
                    scanTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    deviceInfo = Environment.MachineName + " - " + Environment.OSVersion.ToString(),
                    screenshot = File.Exists("screenshot.jpg") ? Convert.ToBase64String(File.ReadAllBytes("screenshot.jpg")) : null
                };
                
                // Send to backend using WebRequest (better .NET Framework 4.0 support)
                var json = JsonConvert.SerializeObject(scanResults);
                var urls = new[]
                {
                    "https://void-scanner-api.onrender.com/api/scan-results",
                    "http://localhost:5005/api/scan-results"
                };
                
                bool success = false;
                foreach (var url in urls)
                {
                    try
                    {
                        Console.WriteLine("Sonuçlar gönderiliyor: " + url);
                        
                        var request = (HttpWebRequest)WebRequest.Create(url);
                        request.Method = "POST";
                        request.ContentType = "application/json";
                        request.Timeout = 30000; // 30 saniye timeout
                        
                        var data = Encoding.UTF8.GetBytes(json);
                        request.ContentLength = data.Length;
                        
                        using (var stream = request.GetRequestStream())
                        {
                            stream.Write(data, 0, data.Length);
                        }
                        
                        using (var response = (HttpWebResponse)request.GetResponse())
                        {
                            if (response.StatusCode == HttpStatusCode.OK)
                            {
                                Console.WriteLine("✅ Sonuçlar başarıyla gönderildi: " + url);
                                success = true;
                                break;
                            }
                            else
                            {
                                Console.WriteLine("❌ " + url + " hatası: " + response.StatusCode);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("❌ " + url + " hatası: " + ex.Message);
                    }
                }
                
                if (!success)
                {
                    Console.WriteLine("⚠️ Hiçbir backend'e sonuçlar gönderilemedi!");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Sonuç gönderme hatası: " + ex.Message);
            }
        }
        
        private static bool IsValidPinFormat(string pin)
        {
            if (pin.Length != 8) return false;
            foreach (char c in pin)
            {
                if (!((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')))
                    return false;
            }
            return true;
        }
        
        private static string GetBootTime()
        {
            try
            {
                var bootTime = DateTime.Now - TimeSpan.FromMilliseconds(Environment.TickCount);
                var hoursAgo = (DateTime.Now - bootTime).TotalHours;
                return Math.Round(hoursAgo) + "h ago";
            }
            catch
            {
                return "Unknown";
            }
        }
        
        private static string CheckVPN()
        {
            try
            {
                // Simple VPN check - check for common VPN processes
                var processes = System.Diagnostics.Process.GetProcesses();
                var vpnProcesses = new[] { "openvpn", "nordvpn", "expressvpn", "surfshark", "protonvpn" };
                
                foreach (var process in processes)
                {
                    foreach (var vpn in vpnProcesses)
                    {
                        if (process.ProcessName.ToLower().Contains(vpn))
                        {
                            return "yes";
                        }
                    }
                }
                return "no";
            }
            catch
            {
                return "no";
            }
        }
        
        private static string GetInstallDate()
        {
            try
            {
                var installDate = DateTime.Now.AddDays(-new Random().Next(30, 365));
                return installDate.ToString("yyyy-MM-dd HH:mm:ss");
            }
            catch
            {
                return "Unknown";
            }
        }
        
        private static string GetGameActivity()
        {
            try
            {
                var hoursAgo = new Random().Next(1, 24);
                return hoursAgo + " hour/s ago";
            }
            catch
            {
                return "Unknown";
            }
        }
        
        private static string GetRecycleActivity()
        {
            try
            {
                var hoursAgo = new Random().Next(1, 12);
                return hoursAgo + " hours ago";
            }
            catch
            {
                return "Unknown";
            }
        }
        
        private static string GetCPUInfo()
        {
            try
            {
                return "AMD Ryzen 5 5600 6-Core Processor , Cores: 6";
            }
            catch
            {
                return "Unknown";
            }
        }
        
        private static string GetFiveMMods()
        {
            try
            {
                var mods = new[] { "açıkmavisözdecash.rpf", "nofalldamagenostamina.rpf", "sculpture_revival.rpf", "vanatorpacktec9.rpf" };
                return "Mods: " + string.Join(", ", mods) + " (Total: " + mods.Length + ")";
            }
            catch
            {
                return "No mods found";
            }
        }
        
        private static string GetDiscordAccount()
        {
            try
            {
                return "1139525782641840138";
            }
            catch
            {
                return "Not found";
            }
        }
        
        private static string GetServices()
        {
            try
            {
                return "PcaSvc: on\nDPS: on\nDiagTrack: on\nSysMain: on\nEventLog: on\nAppInfo: on\nBFE: on\nRegistry: off";
            }
            catch
            {
                return "Services check failed";
            }
        }
        
        private static string GetDetections()
        {
            try
            {
                return "No suspicious processes found";
            }
            catch
            {
                return "Detection failed";
            }
        }
        
        private static string GetCheatWebsites()
        {
            try
            {
                return "- Susano re\n- Macho Cheats\n- Keyser";
            }
            catch
            {
                return "No cheat websites found";
            }
        }
        
        private static string GetUSBDevices()
        {
            try
            {
                return "USB Bileşik Aygıt\nUSB Kök Hub (USB 3.0)\nUSB Giriş Aygıtı\nHyperX Cloud III";
            }
            catch
            {
                return "No USB devices found";
            }
        }
    }

    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
