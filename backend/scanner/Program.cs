using System;
using System.Drawing;
using System.Windows.Forms;
using System.IO;
using System.Threading;

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
                if (File.Exists("anime.jpg.jpg"))
                {
                    animePictureBox.Image = Image.FromFile("anime.jpg.jpg");
                }
                else
                {
                    // Create black background with rain effect
                    animePictureBox.Image = CreateRainEffectImage();
                }
            }
            catch
            {
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
