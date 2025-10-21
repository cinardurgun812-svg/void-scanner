const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
// MongoDB kaldırıldı - memory-based sistem kullanıyoruz

const app = express();
const PORT = 5005;

// Güvenlik anahtarları
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const API_KEY = process.env.API_KEY || crypto.randomBytes(32).toString('hex');

// Güvenlik middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Her IP için maksimum 100 istek
  message: 'Çok fazla istek! Lütfen 15 dakika sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS güvenliği
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB bağlantısı kaldırıldı - memory-based sistem kullanıyoruz

// Memory-based veritabanı sistemi

// Memory database (MongoDB yoksa)
let memoryUsers = [];
let memoryPins = [];
let memoryLogs = [];
let userIdCounter = 1;
let pinIdCounter = 1;

// Memory database fonksiyonları
const MemoryUser = {
  findOne: (query) => {
    return Promise.resolve(memoryUsers.find(user => {
      if (query.email && query.isActive !== undefined) {
        return user.email === query.email && user.isActive === query.isActive;
      }
      if (query.email) {
        return user.email === query.email;
      }
      if (query._id) {
        return user._id === query._id;
      }
      return false;
    }));
  },
  findById: (id) => {
    return Promise.resolve(memoryUsers.find(user => user._id === id));
  },
  create: (userData) => {
    const user = {
      _id: userIdCounter++,
      ...userData,
      createdAt: new Date(),
      isActive: true
    };
    memoryUsers.push(user);
    return Promise.resolve(user);
  }
};

const MemoryPin = {
  find: (query) => {
    let results = memoryPins;
    if (query.clientId) {
      results = results.filter(pin => pin.clientId === query.clientId);
    }
    if (query.pin) {
      results = results.filter(pin => pin.pin === query.pin);
    }
    return Promise.resolve(results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  },
  findOne: (query) => {
    return Promise.resolve(memoryPins.find(pin => {
      if (query.pin) {
        return pin.pin === query.pin;
      }
      if (query._id) {
        return pin._id === query._id;
      }
      return false;
    }));
  },
  create: (pinData) => {
    const pin = {
      _id: pinIdCounter++,
      ...pinData,
      createdAt: new Date(),
      scanResults: {
        status: 'pending',
        data: null,
        completedAt: null,
        riskLevel: null,
        summary: null
      }
    };
    memoryPins.push(pin);
    return Promise.resolve(pin);
  },
  findOneAndUpdate: (query, update) => {
    const pin = memoryPins.find(p => {
      if (query.pin) return p.pin === query.pin;
      if (query._id) return p._id === query._id;
      return false;
    });
    if (pin) {
      Object.assign(pin, update);
    }
    return Promise.resolve(pin);
  },
  findById: (id) => {
    console.log(`MemoryPin.findById çağrıldı: ${id} (tip: ${typeof id})`);
    console.log(`Mevcut PIN'ler:`, memoryPins.map(p => ({ _id: p._id, pin: p.pin })));
    const foundPin = memoryPins.find(pin => pin._id == id);
    console.log(`Bulunan PIN:`, foundPin);
    return Promise.resolve(foundPin);
  },
  findByIdAndDelete: (id) => {
    console.log(`MemoryPin.findByIdAndDelete çağrıldı: ${id} (tip: ${typeof id})`);
    const index = memoryPins.findIndex(pin => pin._id == id);
    console.log(`PIN index: ${index}`);
    if (index !== -1) {
      const deletedPin = memoryPins.splice(index, 1)[0];
      console.log(`Silinen PIN:`, deletedPin);
      return Promise.resolve(deletedPin);
    }
    console.log(`PIN bulunamadı, null döndürülüyor`);
    return Promise.resolve(null);
  }
};

// Memory Log nesnesi
const MemoryLog = {
  create: (logData) => {
    const log = {
      _id: Date.now(),
      ...logData,
      createdAt: new Date()
    };
    memoryLogs.push(log);
    console.log(`Log kaydedildi:`, log);
    return Promise.resolve(log);
  }
};

// Şifreleme fonksiyonları
function encryptData(data) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
      encrypted: encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Şifreleme hatası:', error);
    return null;
  }
}

function decryptData(encryptedData) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Şifre çözme hatası:', error);
    return null;
  }
}

// API Key doğrulama middleware
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      message: 'API Key gerekli',
      error: 'MISSING_API_KEY'
    });
  }
  
  if (apiKey !== API_KEY) {
    return res.status(403).json({ 
      message: 'Geçersiz API Key',
      error: 'INVALID_API_KEY'
    });
  }
  
  next();
}

// PIN doğrulama middleware
function verifyPin(req, res, next) {
  const { pin } = req.body;
  
  if (!pin) {
    return res.status(400).json({ 
      message: 'PIN kodu gerekli',
      error: 'MISSING_PIN'
    });
  }
  
  // PIN format kontrolü (8 karakter, hex)
  if (!/^[A-F0-9]{8}$/.test(pin)) {
    return res.status(400).json({ 
      message: 'Geçersiz PIN formatı',
      error: 'INVALID_PIN_FORMAT'
    });
  }
  
  next();
}

// Kullanıcı kayıt
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Veri doğrulama
    if (!email || !password || !name) {
      return res.status(400).json({ 
        message: 'Email, şifre ve isim gerekli',
        error: 'MISSING_FIELDS'
      });
    }
    
    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Geçersiz email formatı',
        error: 'INVALID_EMAIL'
      });
    }
    
    // Şifre güçlülük kontrolü
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Şifre en az 6 karakter olmalı',
        error: 'WEAK_PASSWORD'
      });
    }
    
    // Kullanıcı var mı kontrol et
    const existingUser = await MemoryUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Bu email zaten kullanılıyor',
        error: 'USER_EXISTS'
      });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Yeni kullanıcı oluştur
    const user = await MemoryUser.create({ 
      email, 
      password: hashedPassword, 
      name,
      role: 'client'
    });

    // JWT token oluştur
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ 
      message: 'Hesap başarıyla oluşturuldu',
      token,
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      }
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
});

// Kullanıcı giriş
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Veri doğrulama
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email ve şifre gerekli',
        error: 'MISSING_CREDENTIALS'
      });
    }
    
    // Kullanıcıyı bul
    const user = await MemoryUser.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ 
        message: 'Geçersiz kimlik bilgileri',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Şifre kontrolü
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Geçersiz kimlik bilgileri',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.json({ 
      message: 'Giriş başarılı',
      token,
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
});

// Token doğrulama middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      message: 'Token gerekli',
      error: 'MISSING_TOKEN'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      message: 'Geçersiz token',
      error: 'INVALID_TOKEN'
    });
  }
}

// PIN oluşturma
app.post('/api/create-pin', verifyToken, async (req, res) => {
  try {
    const { targetInfo, durationHours = 24 } = req.body;
    
    // Kullanıcıyı bul
    const user = await MemoryUser.findById(req.user.userId);
    if (!user || user.role !== 'client') {
      return res.status(403).json({ 
        message: 'Yetkisiz erişim',
        error: 'UNAUTHORIZED'
      });
    }
    
    // PIN oluştur
    const pin = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    
    // PIN kaydet
    const newPin = await MemoryPin.create({
      pin,
      targetInfo: targetInfo || {},
      clientId: user._id,
      expiresAt
    });
    
    res.status(201).json({ 
      message: 'PIN başarıyla oluşturuldu',
      pin,
      expiresAt,
      targetInfo: targetInfo || {}
    });
  } catch (error) {
    console.error('PIN oluşturma hatası:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
});

// Kullanıcının PIN'lerini listele
app.get('/api/my-pins', verifyToken, async (req, res) => {
  try {
    const pins = await MemoryPin.find({ clientId: req.user.userId });
    console.log('PINler bulundu:', pins.length);
    console.log('Ilk PIN _id:', pins[0]?._id);
    console.log('Ilk PIN:', pins[0]);
    
    res.json(pins);
  } catch (error) {
    console.error('PIN listesi hatası:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
});

// PIN detaylarını getir
app.get('/api/pin-details/:pinId', verifyToken, async (req, res) => {
  try {
    const { pinId } = req.params;
    
    const pin = await MemoryPin.findOne({ 
      _id: parseInt(pinId), 
      clientId: req.user.userId 
    });
    
    if (!pin) {
      return res.status(404).json({ 
        message: 'PIN bulunamadı',
        error: 'PIN_NOT_FOUND'
      });
    }
    
    res.json(pin);
  } catch (error) {
    console.error('PIN detay hatası:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
});

// API Key endpoint'i (Scanner için)
app.get('/api/get-api-key', (req, res) => {
  // Sadece localhost'tan erişilebilir
  if (req.ip !== '127.0.0.1' && req.ip !== '::1' && !req.ip.startsWith('192.168.')) {
    return res.status(403).json({ message: 'Erişim reddedildi' });
  }
  
  res.json({ 
    apiKey: API_KEY,
    message: 'API Key başarıyla alındı'
  });
});

// PIN doğrulama endpoint'i
app.post('/api/verify-pin', verifyPin, async (req, res) => {
  try {
    const { pin } = req.body;
    
    // PIN'i veritabanında bul
    const pinRecord = await MemoryPin.findOne({ pin: pin });
    if (!pinRecord) {
      return res.status(400).json({ 
        message: 'Geçersiz PIN',
        error: 'INVALID_PIN'
      });
    }
    
    // PIN'in süresi dolmuş mu kontrol et
    if (pinRecord.expiresAt < new Date()) {
      pinRecord.status = 'expired';
      return res.status(400).json({ 
        message: 'PIN süresi dolmuş',
        error: 'PIN_EXPIRED'
      });
    }
    
    // PIN zaten kullanılmış mı kontrol et
    if (pinRecord.status === 'used') {
      return res.status(400).json({ 
        message: 'PIN zaten kullanılmış',
        error: 'PIN_ALREADY_USED'
      });
    }
    
    // PIN'i kullanıldı olarak işaretle
    pinRecord.status = 'used';
    
    // JWT token oluştur
    const token = jwt.sign(
      { 
        pin: pin, 
        timestamp: Date.now(),
        ip: req.ip 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    res.json({ 
      message: 'PIN doğrulandı, tarama başlatıldı',
      scanId: crypto.randomBytes(16).toString('hex'),
      estimatedTime: '5 dakika',
      token: token,
      valid: true
    });
  } catch (error) {
    console.error('PIN Verification Error:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası',
      error: error.message 
    });
  }
});

app.get('/api/pin-status/:pin', (req, res) => {
  const { pin } = req.params;
  
  // Simüle edilmiş sonuç
  res.json({
    pin: pin,
    status: 'used',
    scanStatus: 'completed',
    scanResults: {
      status: 'completed',
      data: {
        riskLevel: 'Düşük',
        securityChecks: {
          malware: 'Temiz',
          suspiciousActivity: 'Tespit edilmedi'
        },
        recommendations: ['Sistem güncel', 'Antivirus aktif']
      },
      completedAt: new Date()
    }
  });
});

// Exe dosyası indirme endpoint'i
app.get('/api/download-scanner', (req, res) => {
  try {
    // Exe dosyasının yolu
    const exePath = path.join(__dirname, 'scanner', 'VoidScanner.exe');
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(exePath)) {
      // Eğer exe dosyası yoksa, basit bir placeholder oluştur
      const placeholderContent = Buffer.from('MZ'); // PE dosya başlangıcı
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="VoidScanner.exe"');
      res.setHeader('Content-Length', placeholderContent.length);
      
      return res.send(placeholderContent);
    }
    
    // Gerçek exe dosyasını gönder
    res.download(exePath, 'VoidScanner.exe', (err) => {
      if (err) {
        console.error('Exe dosyası indirme hatası:', err);
        res.status(500).json({ message: 'Dosya indirme hatası' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Anime resmi indirme endpoint'i
app.get('/api/download-anime-image', (req, res) => {
  try {
    const imagePath = path.join(__dirname, 'scanner', 'anime.jpg.jpg');
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Anime resmi bulunamadı' });
    }
    
    // Anime resmini gönder
    res.download(imagePath, 'anime.jpg.jpg', (err) => {
      if (err) {
        console.error('Anime resmi indirme hatası:', err);
        res.status(500).json({ message: 'Resim indirme hatası' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Tarama sonuçlarını exe'den alma endpoint'i (Güvenli) - EKRAN GÖRÜNTÜSÜ İLE
app.post('/api/scan-results', verifyApiKey, async (req, res) => {
  try {
    const { pin, results, screenshot } = req.body;
    
    // Veri doğrulama
    if (!scanData.pinCode || !scanData.scanTime || !scanData.deviceInfo) {
      return res.status(400).json({ 
        message: 'Geçersiz tarama verisi',
        error: 'INVALID_SCAN_DATA'
      });
    }
    
    // PIN'i veritabanında bul ve güncelle
    const pinRecord = await MemoryPin.findOne({ pin: scanData.pinCode });
    if (!pinRecord) {
      return res.status(404).json({ 
        message: 'PIN bulunamadı',
        error: 'PIN_NOT_FOUND'
      });
    }
    
    // PIN'in süresi dolmuş mu kontrol et
    if (pinRecord.expiresAt < new Date()) {
      pinRecord.status = 'expired';
      return res.status(400).json({ 
        message: 'PIN süresi dolmuş',
        error: 'PIN_EXPIRED'
      });
    }
    
    // PIN'i kullanıldı olarak işaretle
    pinRecord.status = 'used';
    pinRecord.scanResults.status = 'completed';
    pinRecord.scanResults.completedAt = new Date();
    pinRecord.scanResults.riskLevel = scanData.riskLevel;
    pinRecord.scanResults.summary = {
      suspiciousProcessesCount: scanData.securityChecks?.suspiciousProcesses?.length || 0,
      suspiciousFilesCount: scanData.cheatDetection?.suspiciousFiles?.length || 0,
      memoryInjectionsCount: scanData.cheatDetection?.memoryInjections?.length || 0
    };
    
    // Hassas verileri şifrele
    const sensitiveData = {
      deviceInfo: scanData.deviceInfo,
      networkInfo: scanData.deviceInfo?.networkInfo,
      suspiciousFiles: scanData.cheatDetection?.suspiciousFiles || [],
      suspiciousProcesses: scanData.securityChecks?.suspiciousProcesses || []
    };
    
    const encryptedData = encryptData(sensitiveData);
    
    // Güvenli veri yapısı
    const secureScanData = {
      pinCode: scanData.pinCode,
      scanTime: scanData.scanTime,
      riskLevel: scanData.riskLevel,
      encryptedData: encryptedData,
      summary: {
        suspiciousProcessesCount: scanData.securityChecks?.suspiciousProcesses?.length || 0,
        suspiciousFilesCount: scanData.cheatDetection?.suspiciousFiles?.length || 0,
        memoryInjectionsCount: scanData.cheatDetection?.memoryInjections?.length || 0,
        recentActivityCount: scanData.recentActivity ? 
          Object.values(scanData.recentActivity).flat().length : 0
      },
      securityChecks: {
        antivirusStatus: scanData.securityChecks?.antivirusStatus || 'Bilinmiyor',
        windowsDefenderStatus: scanData.securityChecks?.windowsDefenderStatus || 'Bilinmiyor',
        firewallStatus: scanData.securityChecks?.firewallStatus || 'Bilinmiyor',
        systemUpdates: scanData.securityChecks?.systemUpdates || 'Bilinmiyor'
      }
    };
    
    console.log('🔐 Şifrelenmiş tarama sonuçları alındı:', {
      pin: scanData.pinCode,
      riskLevel: scanData.riskLevel,
      scanTime: scanData.scanTime,
      summary: secureScanData.summary,
      encrypted: !!encryptedData
    });
    
    // Sonuçları şifrelenmiş olarak kaydet
    const resultsPath = path.join(__dirname, 'scan-results', `${scanData.pinCode}_${Date.now()}_secure.json`);
    
    // scan-results klasörünü oluştur
    const scanResultsDir = path.join(__dirname, 'scan-results');
    if (!fs.existsSync(scanResultsDir)) {
      fs.mkdirSync(scanResultsDir, { recursive: true });
    }
    
    // Şifrelenmiş veriyi kaydet
    fs.writeFileSync(resultsPath, JSON.stringify(secureScanData, null, 2));
    
    // PIN kaydını güncelle
    pinRecord.scanResults.data = secureScanData;
    
    // Güvenlik logu
    const securityLog = {
      timestamp: new Date().toISOString(),
      pin: scanData.pinCode,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      riskLevel: scanData.riskLevel,
      action: 'SCAN_RESULTS_RECEIVED'
    };
    
    const logPath = path.join(__dirname, 'security-logs', `security_${Date.now()}.json`);
    const securityLogsDir = path.join(__dirname, 'security-logs');
    if (!fs.existsSync(securityLogsDir)) {
      fs.mkdirSync(securityLogsDir, { recursive: true });
    }
    fs.writeFileSync(logPath, JSON.stringify(securityLog, null, 2));
    
    res.json({ 
      message: 'Tarama sonuçları güvenli şekilde kaydedildi',
      filePath: resultsPath,
      riskLevel: scanData.riskLevel,
      encrypted: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Tarama sonuçları kaydetme hatası:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ekran görüntüsünü getir
app.get('/api/screenshot/:pin', verifyToken, async (req, res) => {
  try {
    const { pin } = req.params;
    
    // PIN'i bul
    const pinData = await MemoryPin.findOne({ pin: pin });
    if (!pinData) {
      return res.status(404).json({ 
        message: 'PIN bulunamadı',
        error: 'PIN_NOT_FOUND'
      });
    }

    // Kullanıcı kontrolü
    const user = await MemoryUser.findById(req.user.userId);
    if (!user || user.role !== 'client') {
      return res.status(403).json({ 
        message: 'Yetkisiz erişim',
        error: 'UNAUTHORIZED'
      });
    }

    // PIN'in bu kullanıcıya ait olduğunu kontrol et
    if (pinData.clientId.toString() !== user._id.toString()) {
      return res.status(403).json({ 
        message: 'Bu PIN\'e erişim yetkiniz yok',
        error: 'ACCESS_DENIED'
      });
    }

    // Ekran görüntüsü yolunu kontrol et
    if (!pinData.scanResults || !pinData.scanResults.screenshotPath) {
      return res.status(404).json({ 
        message: 'Ekran görüntüsü bulunamadı',
        error: 'SCREENSHOT_NOT_FOUND'
      });
    }

    // Dosya yolunu tam path'e çevir
    const fullScreenshotPath = path.join(__dirname, pinData.scanResults.screenshotPath);
    
    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(fullScreenshotPath)) {
      return res.status(404).json({ 
        message: 'Ekran görüntüsü dosyası bulunamadı',
        error: 'SCREENSHOT_FILE_NOT_FOUND'
      });
    }

    // Dosyayı gönder
    res.sendFile(fullScreenshotPath);

  } catch (error) {
    console.error('Ekran görüntüsü getirme hatası:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
});

// PIN detaylarını getir
app.get('/api/pin-details/:pin', verifyToken, async (req, res) => {
  try {
    const { pin } = req.params;
    
    // PIN'i bul
    const pinData = await MemoryPin.findOne({ pin: pin });
    if (!pinData) {
      return res.status(404).json({ 
        message: 'PIN bulunamadı',
        error: 'PIN_NOT_FOUND'
      });
    }

    // Kullanıcı kontrolü
    const user = await MemoryUser.findById(req.user.userId);
    if (!user || user.role !== 'client') {
      return res.status(403).json({ 
        message: 'Yetkisiz erişim',
        error: 'UNAUTHORIZED'
      });
    }

    // PIN'in bu kullanıcıya ait olduğunu kontrol et
    if (pinData.clientId.toString() !== user._id.toString()) {
      return res.status(403).json({ 
        message: 'Bu PIN\'e erişim yetkiniz yok',
        error: 'ACCESS_DENIED'
      });
    }

    // Tarama sonuçlarını şifre çöz
    let decryptedResults = null;
    if (pinData.scanResults) {
      try {
        decryptedResults = decryptData(pinData.scanResults);
      } catch (error) {
        console.error('Tarama sonuçları şifre çözme hatası:', error);
      }
    }

    res.json({
      pin: pinData.pin,
      targetInfo: pinData.targetInfo,
      createdAt: pinData.createdAt,
      expiresAt: pinData.expiresAt,
      scanCompleted: pinData.scanCompleted,
      scanDate: pinData.scanDate,
      scanResults: decryptedResults,
      screenshotPath: pinData.screenshotPath
    });

  } catch (error) {
    console.error('PIN detayları getirme hatası:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
});

// PIN silme endpoint'i
app.delete('/api/pins/:pinId', verifyToken, async (req, res) => {
  try {
    const { pinId } = req.params;
    console.log(`🗑️ PIN silme isteği alındı: ${pinId}`);
    console.log(`PIN ID tipi: ${typeof pinId}`);
    console.log(`PIN ID uzunluğu: ${pinId?.length}`);
    
    // PIN'i bul - ObjectId olarak arama yap
    console.log(`PIN arama başlatılıyor...`);
    const pinData = await MemoryPin.findById(pinId);
    if (!pinData) {
      console.log(`❌ PIN bulunamadı: ${pinId}`);
      return res.status(404).json({ 
        message: 'PIN bulunamadı',
        error: 'PIN_NOT_FOUND'
      });
    }

    console.log(`✅ PIN bulundu: ${pinData.pin}`);

    // Kullanıcı kontrolü
    const user = await MemoryUser.findById(req.user.userId);
    if (!user || user.role !== 'client') {
      console.log(`❌ Yetkisiz kullanıcı: ${req.user.userId}`);
      return res.status(403).json({ 
        message: 'Yetkisiz erişim',
        error: 'UNAUTHORIZED'
      });
    }

    console.log(`✅ Kullanıcı doğrulandı: ${user.username}`);

    // PIN'in bu kullanıcıya ait olduğunu kontrol et
    if (pinData.clientId.toString() !== user._id.toString()) {
      console.log(`❌ PIN sahipliği hatası: PIN ${pinData.clientId}, User ${user._id}`);
      return res.status(403).json({ 
        message: 'Bu PIN\'e erişim yetkiniz yok',
        error: 'ACCESS_DENIED'
      });
    }

    console.log(`✅ PIN sahipliği doğrulandı`);

    // Ekran görüntüsü dosyasını sil (varsa)
    if (pinData.scanResults && pinData.scanResults.screenshotPath) {
      try {
        const screenshotPath = path.join(__dirname, pinData.scanResults.screenshotPath);
        if (fs.existsSync(screenshotPath)) {
          fs.unlinkSync(screenshotPath);
          console.log(`📸 Ekran görüntüsü silindi: ${screenshotPath}`);
        }
      } catch (error) {
        console.error('Ekran görüntüsü silme hatası:', error);
        // Dosya silme hatası PIN silmeyi engellemez
      }
    }

    // PIN'i sil
    await MemoryPin.findByIdAndDelete(pinId);
    console.log(`✅ PIN başarıyla silindi: ${pinData.pin}`);

    // Güvenlik logu
    const securityLog = {
      timestamp: new Date().toISOString(),
      pin: pinData.pin,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'PIN_DELETED'
    };
    MemoryLog.create(securityLog);

    res.status(200).json({ 
      message: 'PIN başarıyla silindi',
      deletedPin: pinData.pin
    });

  } catch (error) {
    console.error('PIN silme hatası:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Void Scanner sunucusu ${PORT} portunda çalışıyor`);
});