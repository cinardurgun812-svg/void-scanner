using System;
using System.Drawing;
using System.Windows.Forms;
using System.Threading.Tasks;
using System.Drawing.Drawing2D;
using System.IO;
using System.Reflection;
using System.Linq;
using System.Collections.Generic;
using System.Text;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.ServiceProcess;

namespace CleanAutoScanner
{
    public partial class CleanAutoScannerForm : Form
    {
        private Panel mainPanel;
        private Timer animationTimer;
        private int rotationAngle = 0;
        private string pinCode = "";
        private ProgressBar progressBar;
        private Label progressLabel;
        private PictureBox animePictureBox;
        private bool isScanning = false;
        
        // Yağmur efekti için değişkenler
        private List<RainDrop> rainDrops = new List<RainDrop>();
        private Random random = new Random();
        
        // Yağmur damlası sınıfı
        private class RainDrop
        {
            public float X { get; set; }
            public float Y { get; set; }
            public float Speed { get; set; }
            public float Length { get; set; }
            public float Opacity { get; set; }
        }

        public CleanAutoScannerForm()
        {
            try
            {
                InitializeComponent();
                SetupCleanStyle();
                InitializeRain();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Hata: " + ex.Message, "EXE Hatası", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        
        private void InitializeRain()
        {
            // 300 adet siyah yağmur damlası oluştur
            for (int i = 0; i < 300; i++)
            {
                rainDrops.Add(new RainDrop
                {
                    X = random.Next(0, this.Width),
                    Y = random.Next(-400, 0),
                    Speed = random.Next(8, 20),
                    Length = random.Next(30, 80),
                    Opacity = (float)(random.NextDouble() * 0.6 + 0.2)
                });
            }
        }

        private void InitializeComponent()
        {
            this.Text = "VOID SCANNER - Clean Auto Scanner";
            this.Size = new Size(800, 500);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None;
            this.BackColor = Color.Black;
            this.TopMost = true;
            this.ShowInTaskbar = true;
            this.Icon = CreateVIcon();

            // Ana panel
            mainPanel = new Panel();
            mainPanel.Dock = DockStyle.Fill;
            mainPanel.BackColor = Color.Black;
            this.Controls.Add(mainPanel);

            // Anime resmi - TAM EKRAN
            animePictureBox = new PictureBox();
            animePictureBox.Size = new Size(800, 500);
            animePictureBox.Location = new Point(0, 0);
            animePictureBox.BackColor = Color.Transparent;
            animePictureBox.Image = CreateAnimeImage();
            animePictureBox.SizeMode = PictureBoxSizeMode.StretchImage;
            animePictureBox.Paint += AnimePictureBox_Paint;
            animePictureBox.Enabled = false;
            mainPanel.Controls.Add(animePictureBox);
            animePictureBox.SendToBack();

            // Temiz progress bar - Altta
            progressBar = new ProgressBar();
            progressBar.Size = new Size(this.Width - 40, 25);
            progressBar.Location = new Point(20, this.Height - 40);
            progressBar.Style = ProgressBarStyle.Continuous;
            progressBar.ForeColor = Color.FromArgb(255, 50, 50);
            progressBar.BackColor = Color.FromArgb(20, 20, 20);
            progressBar.Visible = false;
            progressBar.Paint += ProgressBar_Paint;
            mainPanel.Controls.Add(progressBar);

            // İlerleme yüzdesi etiketi
            progressLabel = new Label();
            progressLabel.Text = "0%";
            progressLabel.Font = new Font("Arial", 10, FontStyle.Bold);
            progressLabel.ForeColor = Color.White;
            progressLabel.AutoSize = true;
            progressLabel.Location = new Point(progressBar.Right - progressLabel.Width - 5, progressBar.Top - progressLabel.Height - 5);
            progressLabel.Visible = false;
            mainPanel.Controls.Add(progressLabel);

            // Animasyon zamanlayıcısı
            animationTimer = new Timer();
            animationTimer.Interval = 20;
            animationTimer.Tick += AnimationTimer_Tick;
            animationTimer.Start();

            // Form yüklendikten sonra otomatik tarama başlat
            this.Load += CleanAutoScannerForm_Load;
        }
        
        private void CleanAutoScannerForm_Load(object sender, EventArgs e)
        {
            // PIN'i command line'dan al
            string[] args = Environment.GetCommandLineArgs();
            if (args.Length > 1)
            {
                pinCode = args[1].ToUpper().Trim();
            }
            else
            {
                pinCode = GetEmbeddedPin();
            }
            
            // Otomatik tarama başlat
            StartAutoScan();
        }
        
        private string GetEmbeddedPin()
        {
            // Byte array olarak embed et
            byte[] placeholderBytes = new byte[] {
                86, 79, 73, 68, 83, 67, 65, 78, 78, 69, 82, 95, 77, 65, 71, 73, 67, 95, 80, 76,
                65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 80, 73, 78, 95, 82, 69, 80, 76, 65, 67,
                69, 77, 69, 78, 84, 95, 83, 84, 82, 73, 78, 71, 95, 65, 66, 67, 68, 69, 70, 71,
                72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 95,
                49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 95, 69, 78, 68, 95, 79, 70, 95, 80, 76,
                65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 77, 65, 71, 73, 67, 95, 83, 84, 82, 73,
                78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67,
                69, 77, 69, 78, 84, 95, 50, 48, 50, 53, 95, 77, 73, 68, 68, 76, 69, 95, 80, 65,
                82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84,
                82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76,
                65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 69, 88,
                84, 82, 65, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76,
                68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82,
                89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84,
                73, 79, 78, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65,
                67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95,
                66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79,
                80, 69, 82, 65, 84, 73, 79, 78, 95, 69, 86, 69, 78, 95, 77, 79, 82, 69, 95, 80,
                65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83,
                84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80,
                76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 83,
                85, 80, 69, 82, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76,
                65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82,
                95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95,
                79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 85, 76, 84, 82, 65, 95, 77, 79, 82, 69,
                95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82,
                95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82,
                69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78,
                95, 77, 69, 71, 65, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80,
                76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79,
                82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84,
                95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 71, 73, 71, 65, 95, 77, 79, 82, 69,
                95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82,
                95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82,
                69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78,
                95, 84, 69, 82, 65, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80,
                76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79,
                82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84,
                95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 80, 69, 84, 65, 95, 77, 79, 82, 69,
                95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82,
                95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82,
                69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78,
                95, 69, 88, 65, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76,
                65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82,
                95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95,
                79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 90, 69, 84, 84, 65, 95, 77, 79, 82, 69,
                95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82,
                95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82,
                69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78,
                95, 89, 79, 84, 84, 65, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95,
                80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70,
                79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78,
                84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 65, 76, 80, 72, 65, 95, 77, 79,
                82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68,
                69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89,
                95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73,
                79, 78, 95, 66, 69, 84, 65, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70,
                95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95,
                70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69,
                78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 71, 65, 77, 77, 65, 95, 77,
                79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76,
                68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82,
                89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84,
                73, 79, 78, 95, 68, 69, 76, 84, 65, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95,
                79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78,
                71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69,
                77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 69, 80, 83, 73, 76,
                79, 78, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67,
                69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66,
                73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80,
                69, 82, 65, 84, 73, 79, 78, 95, 90, 69, 84, 65, 95, 77, 79, 82, 69, 95, 80, 65,
                82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84,
                82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76,
                65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 69, 84,
                65, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69,
                72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73,
                78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69,
                82, 65, 84, 73, 79, 78, 95, 84, 72, 69, 84, 65, 95, 77, 79, 82, 69, 95, 80, 65,
                82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84,
                82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76,
                65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 73, 79,
                84, 65, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67,
                69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66,
                73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80,
                69, 82, 65, 84, 73, 79, 78, 95, 75, 65, 80, 80, 65, 95, 77, 79, 82, 69, 95, 80,
                65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83,
                84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80,
                76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 76,
                65, 77, 66, 68, 65, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80,
                76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79,
                82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84,
                95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 77, 85, 95, 77, 79, 82, 69, 95, 80,
                65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83,
                84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80,
                76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 78,
                85, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67, 69,
                72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66, 73,
                78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80, 69,
                82, 65, 84, 73, 79, 78, 95, 88, 73, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95,
                79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78,
                71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69,
                77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 79, 77, 73, 67, 82,
                79, 78, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84, 95, 79, 70, 95, 80, 76, 65, 67,
                69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71, 95, 70, 79, 82, 95, 66,
                73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77, 69, 78, 84, 95, 79, 80,
                69, 82, 65, 84, 73, 79, 78, 95, 80, 73, 95, 77, 79, 82, 69, 95, 80, 65, 82, 84,
                95, 79, 70, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73,
                78, 71, 95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67,
                69, 77, 69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78, 95, 70, 73, 78, 65,
                76, 95, 80, 76, 65, 67, 69, 72, 79, 76, 68, 69, 82, 95, 83, 84, 82, 73, 78, 71,
                95, 70, 79, 82, 95, 66, 73, 78, 65, 82, 89, 95, 82, 69, 80, 76, 65, 67, 69, 77,
                69, 78, 84, 95, 79, 80, 69, 82, 65, 84, 73, 79, 78
            };
            
            return Encoding.UTF8.GetString(placeholderBytes);
        }
        
        private async void StartAutoScan()
        {
            if (isScanning) return;
            
            isScanning = true;
            progressBar.Visible = true;
            progressBar.Value = 0;
            progressLabel.Visible = true;
            progressLabel.Text = "0%";
            
            try
            {
                // PIN doğrulama simülasyonu
                await Task.Delay(2000);
                UpdateProgressBar(20, "Backend bağlantısı başarılı!");
                
                // PIN doğrulama atla - direkt taramaya geç
                UpdateProgressBar(30, "Tarama başlatılıyor...");
                
                var scanResults = await PerformSecurityScan();
                string screenshotPath = await TakeScreenshot();
                await SendResultsToBackend(scanResults, screenshotPath);
                
                UpdateProgressBar(100, "Tarama tamamlandı!");
                
                // 3 saniye bekle ve kapat
                await Task.Delay(3000);
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Tarama hatası: " + ex.Message, "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void UpdateProgressBar(int value, string status)
        {
            if (value >= 0 && value <= 100)
            {
                progressBar.Value = value;
                progressLabel.Text = value + "%";
            }
        }

        private async Task<string> PerformSecurityScan()
        {
            StringBuilder results = new StringBuilder();
            results.AppendLine("CLEAN AUTO SCANNER - REAL SCAN REPORT");
            results.AppendLine("=====================================");
            results.AppendLine("Scan Date: " + DateTime.Now.ToString("dd.MM.yyyy HH:mm:ss"));
            results.AppendLine("");

            // 1. SUSPICIOUS ACTIVITIES SCAN
            results.AppendLine("SUSPICIOUS ACTIVITIES:");
            results.AppendLine("----------------------");
            UpdateProgressBar(10, "Checking suspicious processes...");
            await Task.Delay(500);
            
            var suspiciousProcesses = await ScanSuspiciousProcesses();
            foreach (var process in suspiciousProcesses)
            {
                results.AppendLine("- " + process);
            }

            // 2. SYSTEM INFORMATION
            results.AppendLine("");
            results.AppendLine("SYSTEM INFORMATION:");
            results.AppendLine("---------------------");
            UpdateProgressBar(30, "Collecting system information...");
            await Task.Delay(500);
            
            results.AppendLine("OS: " + Environment.OSVersion.VersionString);
            results.AppendLine("User: " + Environment.UserName);
            results.AppendLine("Desktop: " + Environment.GetFolderPath(Environment.SpecialFolder.Desktop));
            results.AppendLine("System Time: " + DateTime.Now.ToString("HH:mm:ss"));
            results.AppendLine("Boot Time: " + GetBootTime());
            results.AppendLine("VPN: " + CheckVPN());
            results.AppendLine("Install Date: " + GetInstallDate());
            results.AppendLine("Country: " + GetCountry());

            // 3. SCREENSHOT CAPTURE
            results.AppendLine("");
            results.AppendLine("SCREENSHOT:");
            results.AppendLine("-------------------");
            UpdateProgressBar(70, "Taking screenshot...");
            await Task.Delay(500);
            string screenshotPath = await TakeScreenshot();
            if (!string.IsNullOrEmpty(screenshotPath))
            {
                results.AppendLine("Screenshot captured: " + screenshotPath);
            }
            else
            {
                results.AppendLine("Screenshot failed");
            }

            // 4. USB DEVICES
            results.AppendLine("");
            results.AppendLine("USB DEVICES:");
            results.AppendLine("-------------------");
            UpdateProgressBar(85, "Checking USB devices...");
            await Task.Delay(300);
            results.AppendLine("USB Devices: " + GetUsbDevices());

            UpdateProgressBar(100, "Scan completed!");
            
            results.AppendLine("");
            results.AppendLine("=====================================");
            results.AppendLine("SCAN COMPLETED - " + DateTime.Now.ToString("HH:mm:ss"));
            
            return results.ToString();
        }

        private async Task<List<string>> ScanSuspiciousProcesses()
        {
            var suspicious = new List<string>();
            
            try
            {
                var processes = System.Diagnostics.Process.GetProcesses();
                string[] suspiciousNames = { "cheatengine", "artmoney", "gameguardian", "hack", "trainer", "injector", "bypass", "crack" };
                
                int foundCount = 0;
                foreach (var process in processes)
                {
                    try
                    {
                        string processName = process.ProcessName.ToLower();
                        foreach (string suspiciousName in suspiciousNames)
                        {
                            if (processName.Contains(suspiciousName))
                            {
                                foundCount++;
                                break;
                            }
                        }
                    }
                    catch { }
                }
                
                if (foundCount > 0)
                {
                    suspicious.Add(foundCount + " suspicious processes detected");
                }
                else
                {
                    suspicious.Add("No suspicious processes found");
                }
            }
            catch 
            {
                suspicious.Add("Security check completed");
            }
            
            return suspicious;
        }

        private async Task<string> TakeScreenshot()
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
                    
                    string screenshotPath = Path.Combine(Path.GetTempPath(), "clean_auto_screenshot_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".png");
                    bitmap.Save(screenshotPath, System.Drawing.Imaging.ImageFormat.Png);
                    
                    return screenshotPath;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Screenshot error: " + ex.Message);
                return null;
            }
        }

        private async Task SendResultsToBackend(string results, string screenshotPath = null)
        {
            try
            {
                using (var client = new System.Net.Http.HttpClient())
                {
                    client.DefaultRequestHeaders.Add("X-API-Key", "VOID_SCANNER_API_KEY_2025");
                    
                    string screenshotBase64 = null;
                    if (!string.IsNullOrEmpty(screenshotPath) && File.Exists(screenshotPath))
                    {
                        byte[] screenshotBytes = File.ReadAllBytes(screenshotPath);
                        screenshotBase64 = "data:image/png;base64," + Convert.ToBase64String(screenshotBytes);
                    }
                    
                    var payload = new
                    {
                        pin = pinCode.Replace("\0", ""),
                        results = results,
                        screenshot = screenshotBase64
                    };
                    
                    var cleanPin = pinCode.Replace("\0", "");
                    var cleanResults = results.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r").Replace("\t", "\\t");
                    var json = "{\"pin\":\"" + cleanPin + "\",\"results\":\"" + cleanResults + "\",\"screenshot\":\"" + (screenshotBase64 ?? "") + "\"}";
                    var content = new System.Net.Http.StringContent(json, System.Text.Encoding.UTF8, "application/json");
                    var response = await client.PostAsync("https://void-scanner-api.onrender.com/api/scan-results", content);
                    
                    if (!response.IsSuccessStatusCode)
                    {
                        System.Diagnostics.Debug.WriteLine("Send results error: " + response.StatusCode);
                    }
                    else
                    {
                        System.Diagnostics.Debug.WriteLine("✅ Results sent successfully!");
                    }
                }
                
                await Task.Delay(3000);
                await SelfDestruct();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("SendResultsToBackend error: " + ex.Message);
            }
        }

        private async Task SelfDestruct()
        {
            try
            {
                string scriptPath = Path.Combine(Path.GetTempPath(), "delete_clean_auto_scanner.bat");
                string exePath = Application.ExecutablePath;
                
                string scriptContent = "@echo off\n" +
                    "timeout /t 2 /nobreak >nul\n" +
                    "del \"" + exePath + "\"\n" +
                    "del \"" + scriptPath + "\"\n";
                
                File.WriteAllText(scriptPath, scriptContent);
                System.Diagnostics.Process.Start(scriptPath);
                Application.Exit();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Self-destruct error: " + ex.Message);
            }
        }

        private void AnimationTimer_Tick(object sender, EventArgs e)
        {
            rotationAngle = (rotationAngle + 3) % 360;
            UpdateRain();
            animePictureBox.Invalidate();
            
            if (progressBar.Visible)
            {
                progressBar.Invalidate();
            }
        }
        
        private void UpdateRain()
        {
            for (int i = rainDrops.Count - 1; i >= 0; i--)
            {
                var drop = rainDrops[i];
                drop.Y += drop.Speed;
                
                if (drop.Y > this.Height)
                {
                    drop.Y = random.Next(-400, -150);
                    drop.X = random.Next(0, this.Width);
                    drop.Speed = random.Next(8, 20);
                    drop.Length = random.Next(30, 80);
                    drop.Opacity = (float)(random.NextDouble() * 0.6 + 0.2);
                }
            }
        }

        private void SetupCleanStyle()
        {
            this.DoubleBuffered = true;
            this.SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.DoubleBuffer | ControlStyles.ResizeRedraw, true);
        }
        
        private void AnimePictureBox_Paint(object sender, PaintEventArgs e)
        {
            if (animePictureBox.Image != null)
            {
                e.Graphics.DrawImage(animePictureBox.Image, animePictureBox.ClientRectangle);
            }
            
            DrawRain(e.Graphics);
        }
        
        private void DrawRain(Graphics g)
        {
            foreach (var drop in rainDrops)
            {
                using (Pen rainPen = new Pen(Color.FromArgb((int)(drop.Opacity * 255), Color.Black), 1))
                {
                    g.DrawLine(rainPen, 
                        drop.X, drop.Y, 
                        drop.X, drop.Y + drop.Length);
                }
            }
        }

        private void ProgressBar_Paint(object sender, PaintEventArgs e)
        {
            ProgressBar pb = sender as ProgressBar;
            if (pb == null) return;

            using (LinearGradientBrush backgroundBrush = new LinearGradientBrush(
                pb.ClientRectangle,
                Color.FromArgb(20, 20, 20),
                Color.FromArgb(5, 5, 5),
                LinearGradientMode.Horizontal))
            {
                e.Graphics.FillRectangle(backgroundBrush, pb.ClientRectangle);
            }

            if (pb.Value > 0)
            {
                Rectangle progressRect = new Rectangle(0, 0, 
                    (int)(pb.ClientRectangle.Width * ((double)pb.Value / pb.Maximum)), 
                    pb.ClientRectangle.Height);

                int animationOffset = (int)(DateTime.Now.Millisecond / 10) % 100;
                
                using (LinearGradientBrush progressBrush = new LinearGradientBrush(
                    progressRect,
                    Color.FromArgb(255, 50 + animationOffset, 50 + animationOffset),
                    Color.FromArgb(200, 0, 0),
                    LinearGradientMode.Horizontal))
                {
                    e.Graphics.FillRectangle(progressBrush, progressRect);
                }

                using (LinearGradientBrush shineBrush = new LinearGradientBrush(
                    progressRect,
                    Color.FromArgb(150, 255, 255, 255),
                    Color.FromArgb(0, 255, 255, 255),
                    LinearGradientMode.Vertical))
                {
                    Rectangle shineRect = new Rectangle(progressRect.X, progressRect.Y, 
                        progressRect.Width, progressRect.Height / 2);
                    e.Graphics.FillRectangle(shineBrush, shineRect);
                }
            }

            using (Pen borderPen = new Pen(Color.FromArgb(150, 150, 150), 2))
            {
                e.Graphics.DrawRectangle(borderPen, 1, 1, pb.ClientRectangle.Width - 2, pb.ClientRectangle.Height - 2);
            }
        }

        private Image CreateAnimeImage()
        {
            try
            {
                string resourceName = "CleanAutoScanner.anime.jpg.jpg";
                Assembly assembly = Assembly.GetExecutingAssembly();
                
                using (Stream stream = assembly.GetManifestResourceStream(resourceName))
                {
                    if (stream != null)
                    {
                        return Image.FromStream(stream);
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Embedded image loading error: " + ex.Message);
            }

            string[] possibleNames = { "anime.jpg.jpg", "anime.jpg", "anime.png", "anime.jpeg" };
            foreach (string name in possibleNames)
            {
                string filePath = Path.Combine(Application.StartupPath, name);
                if (File.Exists(filePath))
                {
                    try
                    {
                        return Image.FromFile(filePath);
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine("File loading error (" + filePath + "): " + ex.Message);
                    }
                }
            }

            // Default anime image
            Bitmap defaultImage = new Bitmap(800, 500);
            using (Graphics g = Graphics.FromImage(defaultImage))
            {
                g.FillRectangle(Brushes.DarkBlue, 0, 0, 800, 500);
                g.FillEllipse(Brushes.Black, 200, 100, 400, 300);
                g.FillEllipse(Brushes.Red, 300, 200, 50, 50);
                g.FillEllipse(Brushes.Red, 450, 200, 50, 50);
                g.FillRectangle(Brushes.Gray, 500, 300, 20, 100);
                g.FillRectangle(Brushes.DarkGray, 490, 290, 40, 20);
            }
            return defaultImage;
        }

        private Icon CreateVIcon()
        {
            try
            {
                Bitmap iconBitmap = new Bitmap(32, 32);
                using (Graphics g = Graphics.FromImage(iconBitmap))
                {
                    g.Clear(Color.Transparent);
                    using (SolidBrush redBrush = new SolidBrush(Color.Red))
                    {
                        Point[] vPoints = {
                            new Point(6, 8),
                            new Point(16, 24),
                            new Point(26, 8)
                        };
                        g.FillPolygon(redBrush, vPoints);
                    }
                }
                return Icon.FromHandle(iconBitmap.GetHicon());
            }
            catch (Exception ex)
            {
                return SystemIcons.Application;
            }
        }

        // System info methods
        private string GetBootTime()
        {
            try
            {
                using (var uptime = new System.Management.ManagementObjectSearcher("SELECT LastBootUpTime FROM Win32_OperatingSystem"))
                {
                    foreach (System.Management.ManagementObject obj in uptime.Get())
                    {
                        var bootTime = DateTime.ParseExact(obj["LastBootUpTime"].ToString().Substring(0, 14), "yyyyMMddHHmmss", null);
                        var timeSpan = DateTime.Now - bootTime;
                        
                        if (timeSpan.TotalHours < 24)
                            return (int)timeSpan.TotalHours + "h ago";
                        else
                            return (int)timeSpan.TotalDays + "d ago";
                    }
                }
            }
            catch { }
            return "Unknown";
        }
        
        private string CheckVPN()
        {
            try
            {
                using (var searcher = new System.Management.ManagementObjectSearcher("SELECT * FROM Win32_NetworkAdapter WHERE NetConnectionStatus = 2"))
                {
                    foreach (System.Management.ManagementObject obj in searcher.Get())
                    {
                        var nameObj = obj["Name"];
                        var name = nameObj != null ? nameObj.ToString().ToLower() : null;
                        if (name != null && (name.Contains("vpn") || name.Contains("tunnel") || name.Contains("openvpn")))
                        {
                            return "yes";
                        }
                    }
                }
            }
            catch { }
            return "no";
        }
        
        private string GetInstallDate()
        {
            try
            {
                using (var searcher = new System.Management.ManagementObjectSearcher("SELECT InstallDate FROM Win32_OperatingSystem"))
                {
                    foreach (System.Management.ManagementObject obj in searcher.Get())
                    {
                        var installDate = DateTime.ParseExact(obj["InstallDate"].ToString().Substring(0, 14), "yyyyMMddHHmmss", null);
                        return installDate.ToString("yyyy-MM-dd HH:mm:ss");
                    }
                }
            }
            catch { }
            return "Unknown";
        }
        
        private string GetCountry()
        {
            try
            {
                var region = System.Globalization.RegionInfo.CurrentRegion;
                return region.EnglishName;
            }
            catch { }
            return "Unknown";
        }
        
        private string GetUsbDevices()
        {
            try
            {
                var usbDevices = new List<string>();
                
                using (var searcher = new System.Management.ManagementObjectSearcher("SELECT * FROM Win32_USBHub"))
                {
                    foreach (System.Management.ManagementObject obj in searcher.Get())
                    {
                        try
                        {
                            string deviceName = obj["Name"] != null ? obj["Name"].ToString() : null;
                            if (!string.IsNullOrEmpty(deviceName) && !deviceName.Contains("Root Hub"))
                            {
                                usbDevices.Add(deviceName);
                            }
                        }
                        catch { }
                    }
                }
                
                if (usbDevices.Count > 0)
                {
                    return "Devices: " + string.Join(", ", usbDevices.Distinct()) + " (Total: " + usbDevices.Distinct().Count() + ")";
                }
                else
                {
                    return "Devices: No USB devices detected";
                }
            }
            catch (Exception ex)
            {
                return "Devices: Error checking USB devices - " + ex.Message;
            }
        }
    }
}
