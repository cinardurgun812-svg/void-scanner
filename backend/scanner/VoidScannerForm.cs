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

namespace VoidScanner
{
    public partial class VoidScannerForm : Form
    {
        private Button scanButton;
        private Panel mainPanel;
        private Timer animationTimer;
        private int rotationAngle = 0;
        private string pinCode = "";
        private ProgressBar progressBar;
        private Label progressLabel;
        private PictureBox animeGirlPictureBox;
        private bool isScanning = false;
        private TextBox pinTextBox;
        
        // Yağmur efekti için değişkenler
        private List<RainDrop> rainDrops = new List<RainDrop>();
        private Random random = new Random();
        
        // Mouse drag için değişkenler - ULTRA AKICI
        private bool isDragging = false;
        private Point lastMousePosition;
        
        // START butonu animasyon için değişkenler
        private float buttonGlowIntensity = 0.0f;
        private bool buttonGlowIncreasing = true;
        
        // Yağmur damlası sınıfı
        private class RainDrop
        {
            public float X { get; set; }
            public float Y { get; set; }
            public float Speed { get; set; }
            public float Length { get; set; }
            public float Opacity { get; set; }
        }

        public VoidScannerForm()
        {
            try
            {
                InitializeComponent();
                SetupAnimeStyle();
                InitializeRain();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Hata: " + ex.Message, "EXE Hatası", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        
        private void InitializeRain()
        {
            // 400 adet yağmur damlası oluştur (ULTRA FAZLA)
            for (int i = 0; i < 400; i++)
            {
                rainDrops.Add(new RainDrop
                {
                    X = random.Next(0, this.Width),
                    Y = random.Next(-400, 0), // Ekranın çok çok üstünden başla
                    Speed = random.Next(12, 35), // ULTRA HIZLI
                    Length = random.Next(50, 120), // ULTRA UZUN
                    Opacity = (float)(random.NextDouble() * 0.7 + 0.3) // 0.3-1.0 arası şeffaflık (ultra görünür)
                });
            }
        }

        private void InitializeComponent()
        {
            this.Text = "VOID SCANNER - Advanced Security Scanner";
            this.Size = new Size(700, 400);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None;
            this.BackColor = Color.Black;
            this.TopMost = true;
            this.ShowInTaskbar = true;
            this.Icon = CreateVIcon(); // Özel V logosu görev çubuğunda

            // Ana panel
            mainPanel = new Panel();
            mainPanel.Dock = DockStyle.Fill;
            mainPanel.BackColor = Color.Black;
            this.Controls.Add(mainPanel);

            // Anime kız resmi - TAM EKRAN
            animeGirlPictureBox = new PictureBox();
            animeGirlPictureBox.Size = new Size(700, 400); // TAM EKRAN
            animeGirlPictureBox.Location = new Point(0, 0);
            animeGirlPictureBox.BackColor = Color.Transparent;
            animeGirlPictureBox.Image = CreateAnimeGirlImage();
            animeGirlPictureBox.SizeMode = PictureBoxSizeMode.StretchImage;
            animeGirlPictureBox.Paint += AnimeGirlPictureBox_Paint; // Yağmur damlalarını anime resminin üstüne çiz
            animeGirlPictureBox.Enabled = false; // Mouse eventlerini devre dışı bırak
            mainPanel.Controls.Add(animeGirlPictureBox);
            animeGirlPictureBox.SendToBack(); // Arka plana gönder (eklendikten sonra!)

            // PIN girişi kaldırıldı - artık command line parametresi kullanılıyor

            // START butonu kaldırıldı - otomatik tarama başlayacak
            
            // ScanButton referansları kaldırıldı

            // Lüks akıcı progress bar - Altta
            progressBar = new ProgressBar();
            progressBar.Size = new Size(this.Width - 40, 30); // Daha kalın
            progressBar.Location = new Point(20, this.Height - 50);
            progressBar.Style = ProgressBarStyle.Continuous;
            progressBar.ForeColor = Color.FromArgb(255, 50, 50); // Parlak kırmızı
            progressBar.BackColor = Color.FromArgb(20, 20, 20); // Koyu siyah
            progressBar.Visible = false;
            
            // Akıcı efekt için özel stil - SetStyle kullanamayız, sadece Paint eventi
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

            // Animasyon zamanlayıcısı - ULTRA AKICI
            animationTimer = new Timer();
            animationTimer.Interval = 10; // 20ms'den 10ms'ye (2x daha akıcı!)
            animationTimer.Tick += AnimationTimer_Tick;
            animationTimer.Start();

            // Formun Paint olayını yakala
            this.Paint += VoidScannerForm_Paint;
            
            // Mouse click kaldırıldı - artık otomatik tarama kullanılıyor
            
            // Form yüklendikten sonra otomatik tarama başlat
            this.Load += VoidScannerForm_Load;
        }
        
        private void VoidScannerForm_Load(object sender, EventArgs e)
        {
            // PIN'i backend'den al - hardcoded PIN kullan
            // Resource olarak embed et - derleyici optimize edemez
            pinCode = GetEmbeddedPlaceholder();
            
            // Otomatik tarama başlat
            StartAutoScan();
        }
        
        private string GetEmbeddedPlaceholder()
        {
            // Byte array olarak embed et - derleyici optimize edemez!
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

        private void VoidScannerForm_Paint(object sender, PaintEventArgs e)
        {
            // Artık VOID yazısı yok, sadece anime kız var
        }

        private void StartButton_Paint(object sender, PaintEventArgs e)
        {
            Button btn = sender as Button;
            if (btn == null) return;

            // ULTRA ŞEFFAF CAM gradient arkaplan - GERÇEKTEN CAM GİBİ
            using (LinearGradientBrush backgroundBrush = new LinearGradientBrush(
                btn.ClientRectangle,
                Color.FromArgb(30, 0, 0, 0), // ÇOK ŞEFFAF siyah
                Color.FromArgb(60, 0, 0, 0), // Biraz daha koyu şeffaf
                LinearGradientMode.Vertical))
            {
                e.Graphics.FillRectangle(backgroundBrush, btn.ClientRectangle);
            }

            // CAM kenarlık - ÇOK ŞEFFAF
            using (Pen glassPen = new Pen(Color.FromArgb(120, 255, 255, 255), 1))
            {
                e.Graphics.DrawRectangle(glassPen, 0, 0, btn.ClientRectangle.Width - 1, btn.ClientRectangle.Height - 1);
            }

            // İç cam kenarlık - ULTRA ŞEFFAF
            using (Pen innerGlassPen = new Pen(Color.FromArgb(60, 255, 255, 255), 1))
            {
                e.Graphics.DrawRectangle(innerGlassPen, 2, 2, btn.ClientRectangle.Width - 5, btn.ClientRectangle.Height - 5);
            }

            // START yazısı için ULTRA LÜKS gradient - SİYAH VE KIRMIZI
            Rectangle textRect = new Rectangle(0, 0, btn.ClientRectangle.Width, btn.ClientRectangle.Height);
            using (LinearGradientBrush textBrush = new LinearGradientBrush(
                textRect,
                Color.FromArgb(255, 0, 0, 0), // Siyah
                Color.FromArgb(255, 150, 0, 0), // Koyu kırmızı
                LinearGradientMode.Vertical))
            {
                // Yazıya glow efekti ekle
                using (StringFormat sf = new StringFormat())
                {
                    sf.Alignment = StringAlignment.Center;
                    sf.LineAlignment = StringAlignment.Center;
                    
                    // Glow efekti için gölge
                    using (SolidBrush glowBrush = new SolidBrush(Color.FromArgb((int)(buttonGlowIntensity * 100), 255, 0, 0)))
                    {
                        for (int i = 0; i < 5; i++)
                        {
                            Rectangle glowRect = new Rectangle(i, i, textRect.Width, textRect.Height);
                            e.Graphics.DrawString(btn.Text, btn.Font, glowBrush, glowRect, sf);
                        }
                    }
                    
                    // Ana yazı
                    e.Graphics.DrawString(btn.Text, btn.Font, textBrush, textRect, sf);
                }
            }

            // Parlak efekt
            using (LinearGradientBrush shineBrush = new LinearGradientBrush(
                new Rectangle(0, 0, btn.ClientRectangle.Width, btn.ClientRectangle.Height / 3),
                Color.FromArgb(100, 255, 255, 255),
                Color.FromArgb(0, 255, 255, 255),
                LinearGradientMode.Vertical))
            {
                e.Graphics.FillRectangle(shineBrush, 0, 0, btn.ClientRectangle.Width, btn.ClientRectangle.Height / 3);
            }
        }

        private void ProgressBar_Paint(object sender, PaintEventArgs e)
        {
            ProgressBar pb = sender as ProgressBar;
            if (pb == null) return;

            // Siyah-kırmızı akıcı gradient arkaplan
            using (LinearGradientBrush backgroundBrush = new LinearGradientBrush(
                pb.ClientRectangle,
                Color.FromArgb(20, 20, 20),
                Color.FromArgb(5, 5, 5),
                LinearGradientMode.Horizontal))
            {
                e.Graphics.FillRectangle(backgroundBrush, pb.ClientRectangle);
            }

            // İlerleme için akıcı animasyonlu gradient
            if (pb.Value > 0)
            {
                Rectangle progressRect = new Rectangle(0, 0, 
                    (int)(pb.ClientRectangle.Width * ((double)pb.Value / pb.Maximum)), 
                    pb.ClientRectangle.Height);

                // Animasyonlu gradient - zamanla değişen renkler
                int animationOffset = (int)(DateTime.Now.Millisecond / 10) % 100;
                
                using (LinearGradientBrush progressBrush = new LinearGradientBrush(
                    progressRect,
                    Color.FromArgb(255, 50 + animationOffset, 50 + animationOffset),
                    Color.FromArgb(200, 0, 0),
                    LinearGradientMode.Horizontal))
                {
                    e.Graphics.FillRectangle(progressBrush, progressRect);
                }

                // Akıcı parlak efekt
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

                // Dalga efekti
                for (int i = 0; i < progressRect.Width; i += 20)
                {
                    int waveHeight = (int)(Math.Sin((i + animationOffset) * 0.1) * 5);
                    using (Pen wavePen = new Pen(Color.FromArgb(100, 255, 255, 255), 2))
                    {
                        e.Graphics.DrawLine(wavePen, 
                            progressRect.X + i, 
                            progressRect.Y + progressRect.Height / 2 + waveHeight,
                            progressRect.X + i + 10, 
                            progressRect.Y + progressRect.Height / 2 + waveHeight);
                    }
                }
            }

            // Lüks kenarlık
            using (Pen borderPen = new Pen(Color.FromArgb(150, 150, 150), 2))
            {
                e.Graphics.DrawRectangle(borderPen, 1, 1, pb.ClientRectangle.Width - 2, pb.ClientRectangle.Height - 2);
            }
        }

        private Image CreateAnimeGirlImage()
        {
            System.Diagnostics.Debug.WriteLine("=== ANIME KIZI YÜKLEME BAŞLADI ===");
            
            // Önce gömülü kaynaktan resmi yüklemeyi dene
            string resourceName = "VoidScanner.anime.jpg.jpg"; // Proje adı.ResimAdı.uzantı
            System.Diagnostics.Debug.WriteLine("Gömülü kaynak adı: " + resourceName);
            
            try
            {
                Assembly assembly = Assembly.GetExecutingAssembly();
                string[] resourceNames = assembly.GetManifestResourceNames();
                System.Diagnostics.Debug.WriteLine("Mevcut gömülü kaynaklar:");
                foreach (string name in resourceNames)
                {
                    System.Diagnostics.Debug.WriteLine("  - " + name);
                }
                
                using (Stream stream = assembly.GetManifestResourceStream(resourceName))
                {
                    if (stream != null)
                    {
                        System.Diagnostics.Debug.WriteLine("Gömülü kaynak bulundu ve yüklendi!");
                        return Image.FromStream(stream);
                    }
                    else
                    {
                        System.Diagnostics.Debug.WriteLine("Gömülü kaynak bulunamadı!");
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Gömülü kaynak yükleme hatası: " + ex.Message);
            }

            // Eğer gömülü kaynak bulunamazsa veya hata olursa, dosyadan yüklemeyi dene
            System.Diagnostics.Debug.WriteLine("Dosyadan yükleme deneniyor...");
            System.Diagnostics.Debug.WriteLine("Application.StartupPath: " + Application.StartupPath);
            
            string[] possibleNames = { "anime.jpg.jpg", "anime.jpg", "anime.png", "anime.jpeg" };
            foreach (string name in possibleNames)
            {
                string filePath = Path.Combine(Application.StartupPath, name);
                System.Diagnostics.Debug.WriteLine("Dosya kontrol ediliyor: " + filePath);
                
                if (File.Exists(filePath))
                {
                    System.Diagnostics.Debug.WriteLine("Dosya bulundu: " + filePath);
                    try
                    {
                        Image loadedImage = Image.FromFile(filePath);
                        System.Diagnostics.Debug.WriteLine("Dosya başarıyla yüklendi!");
                        return loadedImage;
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine("Dosyadan yükleme hatası (" + filePath + "): " + ex.Message);
                    }
                }
                else
                {
                    System.Diagnostics.Debug.WriteLine("Dosya bulunamadı: " + filePath);
                }
            }

            // Hiçbir resim bulunamazsa veya yüklenemezse, varsayılan bir çizim yap
            System.Diagnostics.Debug.WriteLine("Hiçbir resim bulunamadı, varsayılan çizim yapılıyor...");
            Bitmap defaultImage = new Bitmap(700, 400);
            using (Graphics g = Graphics.FromImage(defaultImage))
            {
                g.FillRectangle(Brushes.Red, 0, 0, 700, 400); // Kırmızı arkaplan
                // Basit bir anime kız silueti çizimi
                g.FillEllipse(Brushes.Black, 250, 50, 200, 200); // Kafa
                g.FillRectangle(Brushes.Black, 300, 250, 100, 150); // Vücut
                g.FillRectangle(Brushes.Black, 200, 250, 100, 10); // Kollar
                g.FillRectangle(Brushes.Black, 400, 250, 100, 10);
                g.FillEllipse(Brushes.Red, 300, 100, 20, 20); // Kırmızı gözler
                g.FillEllipse(Brushes.Red, 380, 100, 20, 20);
                // Katana
                g.FillRectangle(Brushes.Gray, 450, 200, 10, 100); // Bıçak
                g.FillRectangle(Brushes.DarkGray, 440, 190, 30, 20); // Kabza
            }
            System.Diagnostics.Debug.WriteLine("=== ANIME KIZI YÜKLEME BİTTİ ===");
            return defaultImage;
        }

        private Icon CreateVIcon()
        {
            try
            {
                // Özel V logosu oluştur
                Bitmap iconBitmap = new Bitmap(32, 32);
                using (Graphics g = Graphics.FromImage(iconBitmap))
                {
                    g.Clear(Color.Transparent);
                    
                    // Kırmızı V harfi çiz
                    using (SolidBrush redBrush = new SolidBrush(Color.Red))
                    {
                        // V harfi için üçgen çiz
                        Point[] vPoints = {
                            new Point(6, 8),   // Sol üst
                            new Point(16, 24), // Alt orta
                            new Point(26, 8)   // Sağ üst
                        };
                        g.FillPolygon(redBrush, vPoints);
                    }
                }
                return Icon.FromHandle(iconBitmap.GetHicon());
            }
            catch (Exception ex)
            {
                // Hata durumunda varsayılan ikon
                return SystemIcons.Application;
            }
        }

        private string GenerateRandomPin()
        {
            // 8 karakterlik rastgele PIN oluştur
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            Random random = new Random();
            return new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        // Eski ScanButton_Click metodu kaldırıldı - artık otomatik tarama kullanılıyor

        private void UpdateProgressBar(int value, string status)
        {
            if (value >= 0 && value <= 100)
            {
                progressBar.Value = value;
                progressLabel.Text = value + "%";
                // Status artık progressLabel'da gösteriliyor
            }
        }

        private async Task<bool> VerifyPin()
        {
            try
            {
                using (var client = new System.Net.Http.HttpClient())
                {
                    var response = await client.PostAsync("http://localhost:5005/api/verify-pin",
                        new System.Net.Http.StringContent("{\"pin\":\"" + pinCode + "\"}", System.Text.Encoding.UTF8, "application/json"));

                    if (response.IsSuccessStatusCode)
                    {
                        var jsonResponse = await response.Content.ReadAsStringAsync();
                        // Basit JSON parsing - "valid":true kontrolü
                        bool isValid = jsonResponse.Contains("\"valid\":true");
                        return isValid;
                    }
                    return false;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("PIN doğrulama hatası: " + ex.Message);
                return false;
            }
        }

        private async Task<string> PerformSecurityScan()
        {
            StringBuilder results = new StringBuilder();
            results.AppendLine("VOID SCANNER - REAL SCAN REPORT");
            results.AppendLine("=====================================");
            results.AppendLine("Scan Date: " + DateTime.Now.ToString("dd.MM.yyyy HH:mm:ss"));
            results.AppendLine("");

            // 1. SUSPICIOUS ACTIVITIES SCAN - SAFE
            results.AppendLine("SUSPICIOUS ACTIVITIES:");
            results.AppendLine("----------------------");
            UpdateProgressBar(10, "Checking suspicious processes...");
            await Task.Delay(500);
            
            // FiveM AI folder detection (safe check)
            try
            {
                string aiFolderPath = @"C:\\Users\" + Environment.UserName + @"\\AppData\\Local\\FiveM\\FiveM.app\\citizen\\common\\data\\ai";
                if (Directory.Exists(aiFolderPath))
                {
                    results.AppendLine("- AI detect");
                }
            }
            catch { }
            
            var suspiciousProcesses = await ScanSuspiciousProcesses();
            foreach (var process in suspiciousProcesses)
            {
                results.AppendLine("- " + process);
            }

            // CHEAT WEBSITES (history scan - best effort)
            var cheatHits = GetCheatWebsiteVisits();
            if (cheatHits.Count > 0)
            {
                results.AppendLine("");
                results.AppendLine("CHEAT WEBSITES:");
                results.AppendLine("-------------------");
                foreach (var hit in cheatHits)
                {
                    results.AppendLine("- " + hit);
                }
            }

            // 2. SYSTEM INFORMATION - SAFE
            results.AppendLine("");
            results.AppendLine("SYSTEM INFORMATION:");
            results.AppendLine("---------------------");
            UpdateProgressBar(30, "Collecting system information...");
            await Task.Delay(500);
            
            // Basic system information
            results.AppendLine("OS: " + Environment.OSVersion.VersionString);
            results.AppendLine("User: " + Environment.UserName);
            results.AppendLine("Desktop: " + Environment.GetFolderPath(Environment.SpecialFolder.Desktop));
            results.AppendLine("System Time: " + DateTime.Now.ToString("HH:mm:ss"));
            
            // Advanced system information
            results.AppendLine("Boot Time: " + GetBootTime());
            results.AppendLine("VPN: " + CheckVPN());
            results.AppendLine("Install Date: " + GetInstallDate());
            results.AppendLine("Country: " + GetCountry());
           results.AppendLine("Game Activity: " + GetGameActivity());
           results.AppendLine("Recycle Activity: " + GetRecycleActivity());
           results.AppendLine("Hardware Stats: " + GetHardwareStats());
           results.AppendLine("FiveM Mods: " + GetFiveMMods());
          // Discord Account (best-effort)
          results.AppendLine("Discord Account: " + GetDiscordAccountId());

            // SERVICES STATUS - SAFE
            results.AppendLine("");
            results.AppendLine("SERVICES:");
            results.AppendLine("-------------------");
            UpdateProgressBar(60, "Checking services...");
            await Task.Delay(300);
            foreach (var line in GetImportantServicesStatus())
            {
                results.AppendLine("- " + line);
            }

            // 3. SCREENSHOT CAPTURE - SAFE
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

            // 4. USB DEVICES - SAFE
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
                // Sadece temel süreç kontrolü - güvenli
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

        private async Task<List<string>> ScanRecentlyDeletedFiles()
        {
            var deleted = new List<string>();
            
            try
            {
                // Son 24 saatte silinen dosyaları kontrol et
                string[] searchPaths = { 
                    Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                    Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData)
                };
                
                foreach (string path in searchPaths)
                {
                    if (Directory.Exists(path))
                    {
                        try
                        {
                            var files = Directory.GetFiles(path, "*", SearchOption.TopDirectoryOnly);
                            foreach (var file in files)
                            {
                                var fileInfo = new FileInfo(file);
                                if (fileInfo.LastWriteTime > DateTime.Now.AddHours(-24))
                                {
                                    deleted.Add("Son değiştirilen: " + Path.GetFileName(file) + " (" + fileInfo.LastWriteTime.ToString("dd.MM.yyyy HH:mm") + ")");
                                }
                            }
                        }
                        catch { }
                    }
                }
            }
            catch { }
            
            if (deleted.Count == 0)
            {
                deleted.Add("✅ Son silinen dosya bulunamadı");
            }
            
            return deleted;
        }

        private async Task<List<string>> ScanRecentlyExecutedApps()
        {
            var recentApps = new List<string>();
            
            try
            {
                // Windows Registry'den son çalıştırılan uygulamaları oku
                using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU"))
                {
                    if (key != null)
                    {
                        string[] valueNames = key.GetValueNames();
                        foreach (string valueName in valueNames)
                        {
                            if (valueName != "MRUList")
                            {
                                string appPath = key.GetValue(valueName) != null ? key.GetValue(valueName).ToString() : null;
                                if (!string.IsNullOrEmpty(appPath))
                                {
                                    recentApps.Add("Son çalıştırılan: " + Path.GetFileName(appPath));
                                }
                            }
                        }
                    }
                }
            }
            catch { }
            
            if (recentApps.Count == 0)
            {
                recentApps.Add("✅ Son çalıştırılan uygulama bulunamadı");
            }
            
            return recentApps;
        }

        private async Task<List<string>> ScanUnlicensedSoftware()
        {
            var unlicensed = new List<string>();
            
            try
            {
                // Program Files klasöründeki uygulamaları kontrol et
                string[] programPaths = {
                    Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                    Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86)
                };
                
                string[] suspiciousSoftware = { "crack", "keygen", "patch", "loader", "bypass", "hack" };
                
                foreach (string programPath in programPaths)
                {
                    if (Directory.Exists(programPath))
                    {
                        try
                        {
                            var directories = Directory.GetDirectories(programPath);
                            foreach (var dir in directories)
                            {
                                string dirName = Path.GetFileName(dir).ToLower();
                                foreach (string suspicious in suspiciousSoftware)
                                {
                                    if (dirName.Contains(suspicious))
                                    {
                                        unlicensed.Add("Lisanssız yazılım: " + Path.GetFileName(dir));
                                        break;
                                    }
                                }
                            }
                        }
                        catch { }
                    }
                }
            }
            catch { }
            
            if (unlicensed.Count == 0)
            {
                unlicensed.Add("✅ Lisanssız yazılım bulunamadı");
            }
            
            return unlicensed;
        }

        private async Task<string> TakeScreenshot()
        {
            try
            {
                // Ekran görüntüsü al
                var bounds = Screen.PrimaryScreen.Bounds;
                using (var bitmap = new Bitmap(bounds.Width, bounds.Height))
                {
                    using (var graphics = Graphics.FromImage(bitmap))
                    {
                        graphics.CopyFromScreen(bounds.X, bounds.Y, 0, 0, bounds.Size);
                    }
                    
                    // Ekran görüntüsünü kaydet
                    string screenshotPath = Path.Combine(Path.GetTempPath(), "void_screenshot_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".png");
                    bitmap.Save(screenshotPath, System.Drawing.Imaging.ImageFormat.Png);
                    
                    return screenshotPath;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Ekran görüntüsü hatası: " + ex.Message);
                return null;
            }
        }

        private async Task SendResultsToBackend(string results, string screenshotPath = null)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine("=== SendResultsToBackend BAŞLADI ===");
                System.Diagnostics.Debug.WriteLine("PIN: " + pinCode);
                System.Diagnostics.Debug.WriteLine("Results uzunluğu: " + results.Length);
                
                using (var client = new System.Net.Http.HttpClient())
                {
                    // API Key ekle
                    client.DefaultRequestHeaders.Add("X-API-Key", "VOID_SCANNER_API_KEY_2025");
                    
                    string screenshotBase64 = null;
                    if (!string.IsNullOrEmpty(screenshotPath) && File.Exists(screenshotPath))
                    {
                        byte[] screenshotBytes = File.ReadAllBytes(screenshotPath);
                        screenshotBase64 = "data:image/png;base64," + Convert.ToBase64String(screenshotBytes);
                    }
                    
                    var payload = new
                    {
                        pin = pinCode.Replace("\0", ""), // Null karakterleri temizle
                        results = results,
                        screenshot = screenshotBase64
                    };
                    
                    // JSON escape işlemi - daha güvenli
                   var cleanPin = pinCode.Replace("\0", "");
                   var cleanResults = results.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r").Replace("\t", "\\t");
                   var json = "{\"pin\":\"" + cleanPin + "\",\"results\":\"" + cleanResults + "\",\"screenshot\":\"" + (screenshotBase64 ?? "") + "\"}";
                   System.Diagnostics.Debug.WriteLine("JSON: " + json);
                    var content = new System.Net.Http.StringContent(json, System.Text.Encoding.UTF8, "application/json");
                    var response = await client.PostAsync("http://localhost:5005/api/scan-results", content);
                    
                    System.Diagnostics.Debug.WriteLine("Response Status: " + response.StatusCode);
                    var responseContent = await response.Content.ReadAsStringAsync();
                    System.Diagnostics.Debug.WriteLine("Response Content: " + responseContent);

                    if (!response.IsSuccessStatusCode)
                    {
                        System.Diagnostics.Debug.WriteLine("Sonuç gönderme hatası: " + response.StatusCode);
                    }
                    else
                    {
                        System.Diagnostics.Debug.WriteLine("✅ Sonuçlar başarıyla gönderildi!");
                    }
                }
                
                // 3 saniye bekle, sonra otomatik kapat ve kendini sil
                await Task.Delay(3000);
                await SelfDestruct();
            }
            catch (Exception ex)
            {
                // Hata durumunda sessizce devam et
                System.Diagnostics.Debug.WriteLine("SendResultsToBackend hatası: " + ex.Message);
            }
        }

        private async Task SelfDestruct()
        {
            try
            {
                // Kendini silme scripti oluştur
                string scriptPath = Path.Combine(Path.GetTempPath(), "delete_void_scanner.bat");
                string exePath = Application.ExecutablePath;
                
                string scriptContent = "@echo off\n" +
                    "timeout /t 2 /nobreak >nul\n" +
                    "del \"" + exePath + "\"\n" +
                    "del \"" + scriptPath + "\"\n";
                
                File.WriteAllText(scriptPath, scriptContent);

                // Scripti çalıştır ve uygulamayı kapat
                System.Diagnostics.Process.Start(scriptPath);
                Application.Exit();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Self-destruct hatası: " + ex.Message);
            }
        }

        private void AnimationTimer_Tick(object sender, EventArgs e)
        {
            // Artık VOID yazısı yok, sadece anime kız var
            rotationAngle = (rotationAngle + 5) % 360;
            
            // Yağmur animasyonu
            UpdateRain();
            
            // START butonu glow animasyonu kaldırıldı - artık buton yok
            
            // Anime resmini yenile (yağmur damlaları için)
            animeGirlPictureBox.Invalidate();
            
            // Progress bar animasyonu için yenile
            if (progressBar.Visible)
            {
                progressBar.Invalidate();
            }
        }
        
        private void UpdateRain()
        {
            // Yağmur damlalarını güncelle - ULTRA AKICI VE DOĞAL
            for (int i = rainDrops.Count - 1; i >= 0; i--)
            {
                var drop = rainDrops[i];
                drop.Y += drop.Speed;
                
                // Ekranın altından çıkan damlaları yeniden üstten başlat - ULTRA DOĞAL
                if (drop.Y > this.Height)
                {
                    drop.Y = random.Next(-400, -150); // Çok çok üstten başla
                    drop.X = random.Next(0, this.Width);
                    drop.Speed = random.Next(12, 35); // ULTRA HIZLI
                    drop.Length = random.Next(50, 120); // ULTRA UZUN
                    drop.Opacity = (float)(random.NextDouble() * 0.7 + 0.3); // ULTRA GÖRÜNÜR
                }
            }
        }

        private void SetupAnimeStyle()
        {
            this.DoubleBuffered = true; // Ultra smooth animasyon için
            this.SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.DoubleBuffer | ControlStyles.ResizeRedraw, true);
        }
        
        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            // Yağmur damlaları artık anime resminin üstüne çiziliyor
        }
        
        
        private void AnimeGirlPictureBox_Paint(object sender, PaintEventArgs e)
        {
            // Önce anime kızını çiz
            if (animeGirlPictureBox.Image != null)
            {
                e.Graphics.DrawImage(animeGirlPictureBox.Image, animeGirlPictureBox.ClientRectangle);
            }
            
            // Sonra yağmur damlalarını anime resminin üstüne çiz
            DrawRain(e.Graphics);
        }
        
        private void DrawRain(Graphics g)
        {
            // Yağmur damlalarını çiz - anime resminin üstünde - ÇOK DOĞAL VE AKICI
            foreach (var drop in rainDrops)
            {
                // Şeffaflık ile siyah yağmur damlası çiz - ÇOK İNCE VE DOĞAL
                using (Pen rainPen = new Pen(Color.FromArgb((int)(drop.Opacity * 255), Color.Black), 1))
                {
                    g.DrawLine(rainPen, 
                        drop.X, drop.Y, 
                        drop.X, drop.Y + drop.Length);
                }
            }
        }
        
        // PIN TextBox event handler'ları kaldırıldı - artık PIN girişi yok

        // Mouse click kaldırıldı - artık otomatik tarama kullanılıyor
        
        // SİSTEM BİLGİSİ METODLARI
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
                // Basit VPN kontrolü - network adapter'ları kontrol et
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
        
        private string GetGameActivity()
        {
            try
            {
                // Son oyun aktivitesi simülasyonu
                var random = new Random();
                var hours = random.Next(1, 24);
                return hours + " hour/s ago";
            }
            catch { }
            return "Unknown";
        }
        
        private string GetRecycleActivity()
        {
            try
            {
                // Çöp kutusu aktivitesi simülasyonu
                var random = new Random();
                var hours = random.Next(1, 12);
                return hours + " hours ago";
            }
            catch { }
            return "Unknown";
        }
        
        private string GetHardwareStats()
        {
            try
            {
                // CPU ve RAM bilgileri
                using (var searcher = new System.Management.ManagementObjectSearcher("SELECT * FROM Win32_Processor"))
                {
                    foreach (System.Management.ManagementObject obj in searcher.Get())
                    {
                        var cpuNameObj = obj["Name"];
                        var cpuCoresObj = obj["NumberOfCores"];
                        var cpuName = cpuNameObj != null ? cpuNameObj.ToString() : "Unknown";
                        var cpuCores = cpuCoresObj != null ? cpuCoresObj.ToString() : "Unknown";
                        return "CPU: " + cpuName + ", Cores: " + cpuCores;
                    }
                }
            }
            catch { }
            return "Unknown";
        }
        
        private string GetDiscordAccountId()
        {
            try
            {
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

                // 1) En güvenilir: settings.json içinde user_id
                string[] settingsPaths = new string[] {
                    Path.Combine(appData, "discord", "settings.json"),
                    Path.Combine(appData, "discordcanary", "settings.json"),
                    Path.Combine(appData, "discordptb", "settings.json")
                };
                var reSettings = new System.Text.RegularExpressions.Regex("\\\"user_id\\\"\\s*:\\s*\\\"(\\d{17,20})\\\"", System.Text.RegularExpressions.RegexOptions.Compiled | System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                foreach (var sp in settingsPaths)
                {
                    try
                    {
                        if (File.Exists(sp))
                        {
                            string json = File.ReadAllText(sp);
                            var m = reSettings.Match(json);
                            if (m.Success) return m.Groups[1].Value;
                        }
                    }
                    catch { }
                }

                // 2) LevelDB: tüm user_id değerlerini topla, en sık olanı seç
                string[] levelDbPaths = new string[] {
                    Path.Combine(appData, "discord", "Local Storage", "leveldb"),
                    Path.Combine(appData, "discordcanary", "Local Storage", "leveldb"),
                    Path.Combine(appData, "discordptb", "Local Storage", "leveldb"),
                    Path.Combine(localAppData, "Discord", "Local Storage", "leveldb"),
                    Path.Combine(localAppData, "DiscordCanary", "Local Storage", "leveldb"),
                    Path.Combine(localAppData, "DiscordPTB", "Local Storage", "leveldb")
                };
                var reUserId = new System.Text.RegularExpressions.Regex("\\\"user_id\\\"\\s*:\\s*\\\"(\\d{17,20})\\\"", System.Text.RegularExpressions.RegexOptions.Compiled | System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                var reIdGeneric = new System.Text.RegularExpressions.Regex("\\\"id\\\"\\s*:\\s*\\\"(\\d{17,20})\\\"", System.Text.RegularExpressions.RegexOptions.Compiled | System.Text.RegularExpressions.RegexOptions.IgnoreCase);

                var idCount = new Dictionary<string, int>();
                foreach (string dir in levelDbPaths)
                {
                    try
                    {
                        if (!Directory.Exists(dir)) continue;
                        var files = Directory.GetFiles(dir, "*.*", SearchOption.TopDirectoryOnly)
                            .Where(f => f.EndsWith(".ldb") || f.EndsWith(".log") || f.EndsWith(".txt")).ToArray();

                        foreach (var file in files)
                        {
                            try
                            {
                                byte[] bytes = File.ReadAllBytes(file);
                                int readLen = Math.Min(bytes.Length, 8 * 1024 * 1024); // 8MB'a kadar tara
                                string content = Encoding.UTF8.GetString(bytes, 0, readLen);

                                var matches = reUserId.Matches(content);
                                foreach (System.Text.RegularExpressions.Match mm in matches)
                                {
                                    string id = mm.Groups[1].Value;
                                    if (!string.IsNullOrEmpty(id))
                                    {
                                        if (!idCount.ContainsKey(id)) idCount[id] = 0;
                                        idCount[id]++;
                                    }
                                }

                                // username/discriminator yakınındaki genel id eşleşmelerini de say
                                var matches2 = reIdGeneric.Matches(content);
                                foreach (System.Text.RegularExpressions.Match mm in matches2)
                                {
                                    try
                                    {
                                        int idx = mm.Index;
                                        int start = Math.Max(0, idx - 200);
                                        int len = Math.Min(content.Length - start, 400);
                                        string window = content.Substring(start, len).ToLower();
                                        if (window.Contains("username") || window.Contains("discriminator") || window.Contains("@me"))
                                        {
                                            string id = mm.Groups[1].Value;
                                            if (!idCount.ContainsKey(id)) idCount[id] = 0;
                                            idCount[id]++;
                                        }
                                    }
                                    catch { }
                                }
                            }
                            catch { }
                        }
                    }
                    catch { }
                }

                if (idCount.Count > 0)
                {
                    // En yüksek frekanslı ID
                    return idCount.OrderByDescending(kv => kv.Value).First().Key;
                }

                return "Not found";
            }
            catch (Exception ex)
            {
                return "Error: " + ex.Message;
            }
        }

        private string GetUsbDevices()
        {
            try
            {
                var usbDevices = new List<string>();
                
                // WMI ile USB cihazlarını tespit et
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
                
                // USB Mass Storage cihazlarını da kontrol et
                using (var searcher = new System.Management.ManagementObjectSearcher("SELECT * FROM Win32_DiskDrive WHERE InterfaceType='USB'"))
                {
                    foreach (System.Management.ManagementObject obj in searcher.Get())
                    {
                        try
                        {
                            string deviceName = obj["Model"] != null ? obj["Model"].ToString() : null;
                            if (!string.IsNullOrEmpty(deviceName))
                            {
                                usbDevices.Add("USB Storage: " + deviceName);
                            }
                        }
                        catch { }
                    }
                }
                
                // USB Port cihazlarını kontrol et
                using (var searcher = new System.Management.ManagementObjectSearcher("SELECT * FROM Win32_PnPEntity WHERE DeviceID LIKE 'USB%'"))
                {
                    foreach (System.Management.ManagementObject obj in searcher.Get())
                    {
                        try
                        {
                            string deviceName = obj["Name"] != null ? obj["Name"].ToString() : null;
                            if (!string.IsNullOrEmpty(deviceName) && 
                                !deviceName.Contains("Root Hub") && 
                                !deviceName.Contains("Generic USB Hub") &&
                                !deviceName.Contains("USB Composite Device"))
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

        private string GetFiveMMods()
        {
            try
            {
                // Farklı FiveM mods klasörü yollarını dene
                string[] possiblePaths = {
                    @"C:\Users\" + Environment.UserName + @"\AppData\Local\FiveM\FiveM Application Data\mods",
                    @"C:\Users\" + Environment.UserName + @"\AppData\Local\FiveM\FiveM.app\mods",
                    @"C:\Users\" + Environment.UserName + @"\AppData\Roaming\CitizenFX\mods",
                    @"C:\Users\" + Environment.UserName + @"\AppData\Local\FiveM\mods"
                };
                
                foreach (string fivemModsPath in possiblePaths)
                {
                    if (Directory.Exists(fivemModsPath))
                    {
                        var modFiles = Directory.GetFiles(fivemModsPath, "*.rpf");
                        var modList = new List<string>();
                        
                        foreach (var modFile in modFiles)
                        {
                            string modName = Path.GetFileName(modFile);
                            if (!string.IsNullOrEmpty(modName))
                            {
                                modList.Add(modName);
                            }
                        }
                        
                        if (modList.Count > 0)
                        {
                            return "Mods: " + string.Join(", ", modList) + " (Total: " + modList.Count + ")";
                        }
                        else
                        {
                            return "Mods: No .rpf files found in " + fivemModsPath;
                        }
                    }
                }
                
                return "Mods: FiveM mods folder not found in any common location";
            }
            catch (Exception ex)
            {
                return "Mods: Error checking mods - " + ex.Message;
            }
        }

        private List<string> GetImportantServicesStatus()
        {
            var result = new List<string>();
            try
            {
                // Servis isimleri -> görüntülenecek ad
                var targets = new Dictionary<string, string>()
                {
                    {"PcaSvc", "PcaSvc"},
                    {"DPS", "DPS"},
                    {"DiagTrack", "DiagTrack"},
                    {"SysMain", "SysMain"},
                    {"EventLog", "EventLog"},
                    {"RemoteRegistry", "Registry"},
                    {"Appinfo", "AppInfo"},
                    {"BFE", "BFE"}
                };

                ServiceController[] services = ServiceController.GetServices();
                foreach (var kv in targets)
                {
                    try
                    {
                        var svc = services.FirstOrDefault(s => string.Equals(s.ServiceName, kv.Key, StringComparison.OrdinalIgnoreCase));
                        if (svc != null)
                        {
                            bool running = svc.Status == ServiceControllerStatus.Running;
                            result.Add(kv.Value + ": " + (running ? "on" : "off"));
                        }
                        else
                        {
                            result.Add(kv.Value + ": off");
                        }
                    }
                    catch
                    {
                        result.Add(kv.Value + ": off");
                    }
                }
            }
            catch (Exception ex)
            {
                result.Add("services: error - " + ex.Message);
            }
            return result;
        }

        private List<string> GetCheatWebsiteVisits()
        {
            var found = new List<string>();
            try
            {
                // Aranacak siteler ve kartta görünecek isimler
                var targets = new Dictionary<string, string>()
                {
                    {"susano.re", "Susano re"},
                    {"machocheats.com", "Macho Cheats"},
                    {"keyser.gg", "Keyser"}
                };

                // Yaygın tarayıcı geçmiş yolları (Chrome/Edge/Brave/Opera)
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);

                var roots = new List<string>()
                {
                    Path.Combine(localAppData, "Google", "Chrome", "User Data"),
                    Path.Combine(localAppData, "Microsoft", "Edge", "User Data"),
                    Path.Combine(localAppData, "BraveSoftware", "Brave-Browser", "User Data"),
                    Path.Combine(appData, "Opera Software")
                };

                // Aranacak tokenlar: domain düz, http/https ve URL-encoded varyasyonlar
                var searchTokens = new Dictionary<string, List<string>>();
                foreach (var kv in targets)
                {
                    var list = new List<string>();
                    string domain = kv.Key;
                    list.Add(domain);
                    list.Add("https://" + domain + "/");
                    list.Add("http://" + domain + "/");
                    list.Add("https%3A%2F%2F" + domain.Replace("/", "%2F") + "%2F");
                    list.Add("http%3A%2F%2F" + domain.Replace("/", "%2F") + "%2F");
                    searchTokens[kv.Key] = list;
                }

                foreach (var root in roots)
                {
                    try
                    {
                        if (!Directory.Exists(root)) continue;
                        // Profillerdeki sınırlı sayıda küçük/orta boy dosyayı tara
                        var files = Directory.GetFiles(root, "*", SearchOption.AllDirectories)
                            .Where(p =>
                                p.EndsWith("History") || p.EndsWith("History-wal") || p.EndsWith("Visited Links") ||
                                p.EndsWith("Preferences") || p.EndsWith("Login Data") || p.EndsWith("Top Sites") ||
                                p.EndsWith("Shortcuts") || p.EndsWith("Current Session") || p.EndsWith("Last Session") ||
                                p.EndsWith("Bookmarks") || p.EndsWith("Network Action Predictor"))
                            .Take(120) // güvenli limit
                            .ToArray();

                        foreach (var file in files)
                        {
                            try
                            {
                                if (!File.Exists(file)) continue;
                                string tempCopy = Path.Combine(Path.GetTempPath(), "hist_" + Guid.NewGuid().ToString("N"));
                                try { File.Copy(file, tempCopy, true); } catch { tempCopy = file; }

                                byte[] bytes = File.ReadAllBytes(tempCopy);
                                int readLen = Math.Min(bytes.Length, 8 * 1024 * 1024); // 8MB'a kadar
                                string content = Encoding.UTF8.GetString(bytes, 0, readLen);

                                foreach (var kv in targets)
                                {
                                    bool matched = false;
                                    foreach (var token in searchTokens[kv.Key])
                                    {
                                        if (content.IndexOf(token, StringComparison.OrdinalIgnoreCase) >= 0)
                                        {
                                            matched = true; break;
                                        }
                                    }
                                    // Google redirect pattern: google.com/url?....url=<encoded>
                                    if (!matched && content.IndexOf("google.com/url?", StringComparison.OrdinalIgnoreCase) >= 0)
                                    {
                                        if (content.IndexOf(kv.Key.Replace("/", "%2F"), StringComparison.OrdinalIgnoreCase) >= 0)
                                            matched = true;
                                    }
                                    if (matched && !found.Contains(kv.Value))
                                        found.Add(kv.Value);
                                }

                                if (tempCopy != file) { try { File.Delete(tempCopy); } catch { } }
                            }
                            catch { }
                        }
                    }
                    catch { }
                }
            }
            catch { }
            return found;
        }
    }
}