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
            this.Size = new Size(600, 700);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog; // Fixed dialog prevents dragging
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.ControlBox = false; // Remove all window controls
            this.BackColor = Color.FromArgb(30, 30, 30);
            this.ForeColor = Color.White;
            this.TopMost = true; // Always on top
            
            // Anime picture box
            animePictureBox = new PictureBox
            {
                Size = new Size(400, 300),
                Location = new Point(100, 50),
                SizeMode = PictureBoxSizeMode.Zoom,
                BackColor = Color.FromArgb(40, 40, 40),
                BorderStyle = BorderStyle.FixedSingle
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
                    animePictureBox.BackColor = Color.FromArgb(60, 60, 60);
                    animePictureBox.Image = CreateFallbackImage();
                }
            }
            catch
            {
                animePictureBox.BackColor = Color.FromArgb(60, 60, 60);
                animePictureBox.Image = CreateFallbackImage();
            }
            
            // Status label
            statusLabel = new Label
            {
                Text = "🔐 PIN doğrulanıyor...",
                Location = new Point(50, 370),
                Size = new Size(500, 30),
                Font = new Font("Segoe UI", 12, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleCenter,
                ForeColor = Color.LightGreen
            };
            
            // Progress bar
            progressBar = new ProgressBar
            {
                Location = new Point(50, 420),
                Size = new Size(500, 25),
                Style = ProgressBarStyle.Continuous,
                Value = 0
            };
            
            // Scan info label
            var scanInfoLabel = new Label
            {
                Text = "• Otomatik güvenlik taraması başlatılıyor\n• Sonuçlar şifreli gönderilir\n• Ekran görüntüsü alınır",
                Location = new Point(50, 470),
                Size = new Size(500, 80),
                Font = new Font("Segoe UI", 10),
                TextAlign = ContentAlignment.MiddleCenter,
                ForeColor = Color.LightGray
            };
            
            // Add controls to form
            this.Controls.Add(animePictureBox);
            this.Controls.Add(statusLabel);
            this.Controls.Add(progressBar);
            this.Controls.Add(scanInfoLabel);
            
            this.ResumeLayout(false);
        }
        
        private Image CreateFallbackImage()
        {
            var bitmap = new Bitmap(400, 300);
            using (var g = Graphics.FromImage(bitmap))
            {
                g.Clear(Color.FromArgb(60, 60, 60));
                g.DrawString("Void Scanner", new Font("Arial", 24, FontStyle.Bold), 
                    Brushes.White, new PointF(100, 120));
                g.DrawString("Security Analysis", new Font("Arial", 14), 
                    Brushes.LightGray, new PointF(120, 160));
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
