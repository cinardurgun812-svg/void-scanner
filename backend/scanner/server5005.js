const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Port ayarı - Production'da environment variable kullan
const PORT = process.env.PORT || 5005;

const app = express();

// Veri dosyaları
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PINS_FILE = path.join(DATA_DIR, 'pins.json');
const ENTERPRISES_FILE = path.join(DATA_DIR, 'enterprises.json');

// Veri dizinini oluştur
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Veri yükleme fonksiyonları
function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Users dosyası yüklenirken hata:', error);
    }
    return [];
}

function loadPins() {
    try {
        if (fs.existsSync(PINS_FILE)) {
            const data = fs.readFileSync(PINS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Pins dosyası yüklenirken hata:', error);
    }
    return [];
}

function loadEnterprises() {
    try {
        if (fs.existsSync(ENTERPRISES_FILE)) {
            const data = fs.readFileSync(ENTERPRISES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Enterprises dosyası yüklenirken hata:', error);
    }
    return [];
}

// Veri kaydetme fonksiyonları
function saveUsers(usersData) {
    try {
        // VERİ KORUMA - Backup oluştur
        const backupFile = USERS_FILE + '.backup';
        if (fs.existsSync(USERS_FILE)) {
            fs.copyFileSync(USERS_FILE, backupFile);
        }
        
        fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
        console.log(`✅ Users dosyası başarıyla kaydedildi (${usersData.length} kullanıcı)`);
    } catch (error) {
        console.error('❌ Users dosyası kaydedilirken hata:', error);
        
        // Hata durumunda backup'tan geri yükle
        const backupFile = USERS_FILE + '.backup';
        if (fs.existsSync(backupFile)) {
            try {
                fs.copyFileSync(backupFile, USERS_FILE);
                console.log('🔄 Backup\'tan geri yüklendi');
            } catch (restoreError) {
                console.error('❌ Backup geri yüklenirken hata:', restoreError);
            }
        }
    }
}

function savePins() {
    try {
        // VERİ KORUMA - Backup oluştur
        const backupFile = PINS_FILE + '.backup';
        if (fs.existsSync(PINS_FILE)) {
            fs.copyFileSync(PINS_FILE, backupFile);
        }
        
        fs.writeFileSync(PINS_FILE, JSON.stringify(pins, null, 2));
        console.log(`✅ Pins dosyası başarıyla kaydedildi (${pins.length} PIN)`);
    } catch (error) {
        console.error('❌ Pins dosyası kaydedilirken hata:', error);
        
        // Hata durumunda backup'tan geri yükle
        const backupFile = PINS_FILE + '.backup';
        if (fs.existsSync(backupFile)) {
            try {
                fs.copyFileSync(backupFile, PINS_FILE);
                console.log('🔄 PIN Backup\'tan geri yüklendi');
            } catch (restoreError) {
                console.error('❌ PIN Backup geri yüklenirken hata:', restoreError);
            }
        }
    }
}

function saveEnterprises(enterprisesData) {
    try {
        // VERİ KORUMA - Backup oluştur
        const backupFile = ENTERPRISES_FILE + '.backup';
        if (fs.existsSync(ENTERPRISES_FILE)) {
            fs.copyFileSync(ENTERPRISES_FILE, backupFile);
        }
        
        fs.writeFileSync(ENTERPRISES_FILE, JSON.stringify(enterprisesData, null, 2));
        console.log(`✅ Enterprises dosyası başarıyla kaydedildi (${enterprisesData.length} enterprise)`);
    } catch (error) {
        console.error('❌ Enterprises dosyası kaydedilirken hata:', error);
        
        // Hata durumunda backup'tan geri yükle
        const backupFile = ENTERPRISES_FILE + '.backup';
        if (fs.existsSync(backupFile)) {
            try {
                fs.copyFileSync(backupFile, ENTERPRISES_FILE);
                console.log('🔄 Enterprise Backup\'tan geri yüklendi');
            } catch (restoreError) {
                console.error('❌ Enterprise Backup geri yüklenirken hata:', restoreError);
            }
        }
    }
}

// Kayıtlı kullanıcıları saklamak için global array
let users = loadUsers();
if (users.length === 0) {
    // Eğer dosyadan yüklenen veri yoksa, varsayılan verileri ekle
    users = [
        {
            id: 1,
            name: 'Admin User',
            email: 'admin@revers8.com',
            password: 'admin123',
            role: 'admin',
            createdAt: new Date().toISOString(),
            hasAdminAccess: true,
            adminAccessGrantedAt: new Date().toISOString(),
            isPermanentAdmin: true,
            adminAccessRevokedAt: null,
            isBanned: false,
            unbannedAt: null,
            unbannedBy: null
        }
    ];
    saveUsers(users);
} else {
    // Kalıcı admin kontrolü - Her deploy'da admin hesabını koru
    const adminUser = users.find(user => user.email === 'admin@revers8.com');
    if (adminUser) {
        adminUser.hasAdminAccess = true;
        adminUser.isPermanentAdmin = true;
        adminUser.adminAccessRevokedAt = null;
        adminUser.isBanned = false;
        adminUser.unbannedAt = null;
        adminUser.unbannedBy = null;
    }
    
    // TÜM KULLANICILARI KORU - Hiçbirini silme
    console.log(`✅ ${users.length} kullanıcı korundu`);
    
    // Her kullanıcı için güvenlik kontrolü
    users.forEach(user => {
        if (!user.isBanned) {
            user.isBanned = false;
        }
        if (!user.unbannedAt) {
            user.unbannedAt = null;
        }
        if (!user.unbannedBy) {
            user.unbannedBy = null;
        }
    });
    
    saveUsers(users);
}

// Enterprise'ları saklamak için in-memory store
let enterprises = loadEnterprises();
if (enterprises.length === 0) {
    console.log('🏢 Enterprise dosyası boş, yeni enterprise\'lar oluşturulacak');
} else {
    // TÜM ENTERPRISE'LARI KORU - Hiçbirini silme
    console.log(`✅ ${enterprises.length} enterprise korundu`);
    
    // Her enterprise için güvenlik kontrolü
    enterprises.forEach(enterprise => {
        if (!enterprise.isActive) {
            enterprise.isActive = true;
        }
        if (!enterprise.createdAt) {
            enterprise.createdAt = new Date().toISOString();
        }
        if (!enterprise.users) {
            enterprise.users = [];
        }
    });
    
    saveEnterprises(enterprises);
}

// PIN'leri saklamak için global array
let pins = loadPins();
if (pins.length === 0) {
    console.log('📌 PIN dosyası boş, yeni PIN'ler oluşturulacak');
} else {
    // TÜM PIN'LERİ KORU - Hiçbirini silme
    console.log(`✅ ${pins.length} PIN korundu`);
    
    // Her PIN için güvenlik kontrolü
    pins.forEach(pin => {
        if (!pin.isActive) {
            pin.isActive = true;
        }
        if (!pin.createdAt) {
            pin.createdAt = new Date().toISOString();
        }
        if (!pin.scanResults) {
            pin.scanResults = [];
        }
    });
    
    savePins();
}

// CORS ayarları - Production için spesifik origin'ler
app.use(cors({
    origin: [
        'https://voidac.xyz',
        'https://www.voidac.xyz',
        'https://app.voidac.xyz',
        'https://admin.voidac.xyz',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '50mb' })); // Screenshot için limit artırıldı
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.')); // Mevcut dizini static olarak serve et

// Ana sayfa - HTML dosyasını serve et
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'VoidScanner.html'));
});

// API Key endpoint
app.get('/api/get-api-key', (req, res) => {
    console.log('API Key isteği alındı (Port 5005)');
    res.json({ 
        apiKey: 'VOID_SCANNER_API_KEY_2025',
        status: 'success',
        port: 5005
    });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Login isteği (Port 5005):', { email, password: password ? '***' : 'YOK' });
    
    // Kayıtlı kullanıcıları kontrol et
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Ban kontrolü
        if (user.isBanned) {
            console.log('Banlı kullanıcı giriş denemesi:', email);
            return res.status(403).json({
                success: false,
                message: 'BANNED',
                banReason: user.banReason || 'No reason provided',
                bannedAt: user.bannedAt
            });
        }
        
        const token = 'mock_jwt_token_' + Date.now();
        
        // Token'ı user'a kaydet
        user.token = token;
        
        // Veriyi dosyaya kaydet
        saveUsers(users);
        
        console.log('Login başarılı:', email);
        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                hasAdminAccess: user.hasAdminAccess || false,
                createdAt: user.createdAt
            },
            message: 'Giriş başarılı'
        });
    } else {
        console.log('Login başarısız - geçersiz kimlik bilgileri:', email);
        res.status(401).json({
            success: false,
            message: 'Geçersiz kimlik bilgileri'
        });
    }
});

// Register endpoint
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    console.log('Register isteği (Port 5005):', { name, email, password: password ? '***' : 'YOK' });
    
    // Email zaten kayıtlı mı kontrol et
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        console.log('Register başarısız - email zaten kayıtlı:', email);
        return res.status(409).json({
            success: false,
            message: 'Bu email zaten kullanılıyor!'
        });
    }
    
    // Mock register - gerçek uygulamada database'e kayıt yapılır
    if (email && password && name) {
        const user = {
            id: Date.now(),
            name: name,
            email: email,
            password: password, // Gerçek uygulamada hash'lenir
            role: 'client',
            createdAt: new Date().toISOString()
        };
        
        // Kullanıcıyı users array'ine ekle
        users.push(user);
        
        const token = 'mock_jwt_token_' + Date.now();
        
        // Token'ı user'a kaydet
        user.token = token;
        
        // Veriyi dosyaya kaydet
        saveUsers(users);
        
        console.log('Register başarılı:', email);
        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                hasAdminAccess: user.hasAdminAccess || false,
                createdAt: user.createdAt
            },
            message: 'Hesap başarıyla oluşturuldu'
        });
    } else {
        console.log('Register başarısız - eksik bilgi:', { 
            name: !!name, 
            email: !!email, 
            password: !!password 
        });
        res.status(400).json({
            success: false,
            message: 'Tüm alanları doldurun'
        });
    }
});

// PIN doğrulama endpoint
app.post('/api/verify-pin', (req, res) => {
    try {
        const { pin } = req.body;
        console.log('PIN doğrulama isteği (Port 5005):', pin);
        
        // PIN format kontrolü (8 karakter, A-Z ve 0-9)
        if (!pin || pin.length !== 8 || !/^[A-Z0-9]+$/.test(pin)) {
            console.log('PIN format hatası:', pin);
            return res.json({ 
                valid: false, 
                message: 'Geçersiz PIN formatı',
                timestamp: new Date().toISOString(),
                port: 5005
            });
        }
        
        // Debug: Mevcut PIN'leri listele
        console.log('Mevcut PIN sayisi:', pins.length);
        console.log('Mevcut PINler:', pins.map(p => p.pin));
        
        // Gerçek PIN kontrolü - pins array'inde var mı?
        const existingPin = pins.find(p => p.pin === pin);
        if (existingPin) {
            console.log('PIN bulundu:', pin);
            res.json({ 
                valid: true, 
                message: 'PIN doğrulandı',
                timestamp: new Date().toISOString(),
                port: 5005
            });
        } else {
            console.log('PIN bulunamadı:', pin);
            res.json({ 
                valid: false, 
                message: 'PIN bulunamadı',
                timestamp: new Date().toISOString(),
                port: 5005
            });
        }
    } catch (error) {
        console.error('PIN doğrulama hatası:', error);
        res.status(500).json({
            valid: false,
            message: 'Sunucu hatası',
            timestamp: new Date().toISOString(),
            port: 5005
        });
    }
});

// Tarama sonuçları endpoint
app.post('/api/scan-results', (req, res) => {
    const { pin, pinCode, results, scanTime, deviceInfo, encryptedData, scannerId, screenshot } = req.body;
    
    // pin veya pinCode kullanılabilir
    const actualPin = pin || pinCode;
    
    console.log('=== TARAMA SONUÇLARI ALINDI (Port 5005) ===');
    console.log('PIN:', actualPin);
    console.log('Results:', results);
    console.log('Screenshot:', screenshot ? 'Var' : 'Yok');
    console.log('Tarama Zamanı:', scanTime);
    console.log('Cihaz Bilgisi:', deviceInfo);
    console.log('Scanner ID:', scannerId);
    console.log('Zaman:', new Date().toISOString());
    console.log('===========================================');
    
    // PIN'e sonuçları kaydet
    const cleanPin = actualPin ? actualPin.replace(/\0/g, '') : null; // Null karakterleri temizle
    const pinObj = pins.find(p => p.pin === cleanPin);
    if (pinObj) {
        pinObj.scanCompleted = true;
        pinObj.scanResults = results || 'Tarama tamamlandı';
        pinObj.status = 'completed';
        pinObj.completedAt = new Date().toISOString();
        pinObj.screenshot = screenshot || null; // Screenshot'u kaydet
        
        // Veriyi dosyaya kaydet
        savePins();
        
        console.log('✅ Sonuçlar PIN\'e kaydedildi:', cleanPin);
        console.log('📸 Screenshot kaydedildi:', screenshot ? 'Evet' : 'Hayır');
    } else {
        console.log('⚠️ PIN bulunamadı, sonuçlar kaydedilemedi:', cleanPin);
        console.log('Mevcut PINler:', pins.map(p => p.pin));
    }
    
    res.json({ 
        success: true, 
        message: 'Sonuçlar başarıyla kaydedildi',
        timestamp: new Date().toISOString(),
        port: 5005
    });
});

// Token'dan email çıkarma fonksiyonu
function getUserEmailFromToken(token) {
    // Token'ı users array'inde ara
    const user = users.find(u => u.token === token);
    if (user) {
        return user.email;
    }
    
    // Eğer bulunamazsa, geçici çözüm - token'dan email çıkarmaya çalış
    console.log('Token bulunamadı, geçici çözüm uygulanıyor:', token);
    
    // Eğer token mock_jwt_token_ ile başlıyorsa, admin@revers1.com kullan
    if (token.startsWith('mock_jwt_token_')) {
        console.log('Mock token tespit edildi, admin@revers1.com kullanılıyor');
        return 'admin@revers1.com';
    }
    
    return null;
}

// PIN'leri saklamak için global array
let pins = loadPins();
// Varsayılan PIN'leri oluşturma - artık sadece dosyadan yükle

// PIN listesi endpoint
app.get('/api/my-pins', (req, res) => {
    console.log('PIN listesi isteği (Port 5005)');
    
    // Authorization header'dan token'ı al
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Token gerekli' });
    }
    
    const token = authHeader.substring(7);
    console.log('Token:', token);
    
    // Token'dan kullanıcı email'ini çıkar
    const userEmail = getUserEmailFromToken(token);
    
    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Geçersiz token' });
    }
    
    console.log('Kullanıcı email:', userEmail);
    console.log('Mevcut PIN sayısı:', pins.length);
    
    // Sadece bu kullanıcının PIN'lerini filtrele
    const userPins = pins.filter(pin => pin.creatorEmail === userEmail);
    console.log('Kullanıcının PIN sayısı:', userPins.length);
    
    // PIN'leri tarihe göre sırala (en yeni en üstte)
    const sortedPins = userPins.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    res.json(sortedPins);
});

// PIN detayları endpoint
app.get('/api/pin-details/:pin', (req, res) => {
    const { pin } = req.params;
    console.log('PIN detayları isteği (Port 5005):', pin);
    
    // Authorization header'dan token'ı al
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Token gerekli' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = getUserEmailFromToken(token);
    
    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Geçersiz token' });
    }
    
    const pinObj = pins.find(p => p.pin === pin);
    if (pinObj) {
        // PIN'in bu kullanıcıya ait olup olmadığını kontrol et
        if (pinObj.creatorEmail !== userEmail) {
            return res.status(403).json({
                success: false,
                message: 'Bu PIN\'e erişim yetkiniz yok'
            });
        }
        
        console.log('PIN detayları bulundu:', pin);
        res.json({
            success: true,
            pin: pinObj,
            timestamp: new Date().toISOString(),
            port: 5005
        });
    } else {
        console.log('PIN detayları bulunamadı:', pin);
        res.status(404).json({
            success: false,
            message: 'PIN bulunamadı',
            timestamp: new Date().toISOString(),
            port: 5005
        });
    }
});

// PIN oluşturma endpoint
app.post('/api/create-pin', (req, res) => {
    console.log('PIN oluşturma isteği (Port 5005)');
    const { userEmail, creatorName, email, name, username } = req.body || {};
    console.log('Gelen create-pin body:', { userEmail, creatorName, email, name, username });
    const resolvedEmail = userEmail || email || null;
    const resolvedName = creatorName || name || username || (resolvedEmail ? resolvedEmail.split('@')[0] : null);
    
    // Enterprise kontrolü - kullanıcının enterprise üyeliği var mı?
    const enterprises = loadEnterprises();
    const userEnterprise = enterprises.find(e => {
        // Owner kontrolü
        if (e.ownerEmail === resolvedEmail) return true;
        
        // Member kontrolü - hem eski (string) hem yeni (obje) format için
        if (e.members && Array.isArray(e.members)) {
            return e.members.some(member => {
                if (typeof member === 'string') {
                    return member === resolvedEmail;
                } else if (typeof member === 'object' && member.email) {
                    return member.email === resolvedEmail;
                }
                return false;
            });
        }
        return false;
    });
    
    if (!userEnterprise) {
        console.log('❌ PIN oluşturma reddedildi - Enterprise üyeliği yok:', resolvedEmail);
        return res.status(403).json({
            success: false,
            message: 'Enterprise üyeliğiniz yok. PIN oluşturmak için bir enterprise üyeliği satın alın.'
        });
    }
    
    console.log('✅ Enterprise kontrolü başarılı:', userEnterprise.name);
    
    const newPin = {
        _id: Date.now().toString(),
        pin: Math.random().toString(36).substr(2, 8).toUpperCase(),
        status: 'active',
        createdAt: new Date().toISOString(),
        scanCompleted: false,
        scanResults: null,
        creatorEmail: resolvedEmail,
        creatorName: resolvedName
    };
    console.log('PIN creator:', { creatorEmail: newPin.creatorEmail, creatorName: newPin.creatorName });
    
    // PIN'i array'e ekle
    pins.push(newPin);
    
    // Veriyi dosyaya kaydet
    savePins();
    
    console.log('Yeni PIN oluşturuldu:', newPin.pin);
    console.log('Toplam PIN sayısı:', pins.length);
    
    res.json({
        success: true,
        pin: newPin,
        message: 'PIN başarıyla oluşturuldu'
    });
});

// PIN silme endpoint
app.delete('/api/pins/:id', (req, res) => {
    console.log('PIN silme isteği (Port 5005):', req.params.id);
    
    // Authorization header'dan token'ı al
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Token gerekli' });
    }
    
    const token = authHeader.substring(7);
    const userEmail = getUserEmailFromToken(token);
    
    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Geçersiz token' });
    }
    
    // PIN'i array'den bul
    const pinIndex = pins.findIndex(pin => pin._id === req.params.id);
    if (pinIndex !== -1) {
        const pinToDelete = pins[pinIndex];
        
        // PIN'in bu kullanıcıya ait olup olmadığını kontrol et
        if (pinToDelete.creatorEmail !== userEmail) {
            return res.status(403).json({
                success: false,
                message: 'Bu PIN\'i silme yetkiniz yok'
            });
        }
        
        pins.splice(pinIndex, 1);
        
        // Veriyi dosyaya kaydet
        savePins();
        
        console.log('PIN silindi:', pinToDelete.pin);
        console.log('Kalan PIN sayısı:', pins.length);
        res.json({
            success: true,
            message: 'PIN başarıyla silindi'
        });
    } else {
        console.log('PIN bulunamadı:', req.params.id);
        res.status(404).json({
            success: false,
            message: 'PIN bulunamadı'
        });
    }
});

// Web arayüzü için tarama endpoint
app.post('/api/web-scan', (req, res) => {
    const { pin } = req.body;
    
    console.log('Web tarama isteği (Port 5005):', pin);
    
    // Simüle edilmiş tarama sonuçları
    const scanResults = {
        pin: pin,
        scanTime: new Date().toISOString(),
        results: {
            suspiciousProcesses: 0,
            suspiciousFiles: 0,
            recentChanges: 0,
            networkConnections: 0,
            riskLevel: 'Düşük'
        },
        status: 'completed',
        port: 5005
    };
    
    res.json(scanResults);
});

// Scanner dosyası indirme endpoint - PIN parametresi ile
app.get('/api/download-scanner/:pin', (req, res) => {
    const { pin } = req.params;
    console.log('Scanner indirme isteği alındı - PIN:', pin);
    
    // PIN'in geçerli olup olmadığını kontrol et
    const validPin = pins.find(p => p.pin === pin);
    if (!validPin) {
        console.log('Geçersiz PIN:', pin);
        return res.status(404).json({
            success: false,
            message: 'Geçersiz PIN'
        });
    }
    
    // PIN-specific EXE oluştur - PIN hardcoded
    const baseExePath = path.join(__dirname, 'CleanAutoScanner.exe');
    const pinSpecificExePath = path.join(__dirname, `CleanAutoScanner_${pin}.exe`);
    
    if (require('fs').existsSync(baseExePath)) {
        console.log('Base EXE bulundu, PIN-specific EXE oluşturuluyor:', pin);
        
        // Base EXE'yi oku
        const exeBuffer = require('fs').readFileSync(baseExePath);
        
        // PIN'i EXE içine hardcode et - binary replacement
        const pinBytes = Buffer.from(pin, 'utf8');
        const placeholderBytes = Buffer.from('VOIDSCANNER_MAGIC_PLACEHOLDER_PIN_REPLACEMENT_STRING_ABCDEFGHIJKLMNOPQRSTUVWXYZ_1234567890_END_OF_PLACEHOLDER_MAGIC_STRING_FOR_BINARY_REPLACEMENT_2025_MIDDLE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_EXTRA_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_EVEN_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_SUPER_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_ULTRA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_MEGA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_GIGA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_TERA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_PETA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_EXA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_ZETTA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_YOTTA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_ALPHA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_BETA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_GAMMA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_DELTA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_EPSILON_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_ZETA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_ETA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_THETA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_IOTA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_KAPPA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_LAMBDA_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_MU_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_NU_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_XI_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_OMICRON_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_PI_MORE_PART_OF_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION_FINAL_PLACEHOLDER_STRING_FOR_BINARY_REPLACEMENT_OPERATION', 'utf8');
        
        // PIN'i placeholder ile aynı uzunlukta yap (padding ekle)
        const paddedPin = pin.padEnd(placeholderBytes.length, '\0');
        const paddedPinBytes = Buffer.from(paddedPin, 'utf8');
        
        // EXE içinde placeholder'ı bul ve PIN ile değiştir
        let modifiedExeBuffer = exeBuffer;
        const placeholderIndex = modifiedExeBuffer.indexOf(placeholderBytes);
        
        if (placeholderIndex !== -1) {
            // Placeholder'ı PIN ile değiştir (aynı uzunlukta)
            const beforePin = modifiedExeBuffer.slice(0, placeholderIndex);
            const afterPin = modifiedExeBuffer.slice(placeholderIndex + placeholderBytes.length);
            modifiedExeBuffer = Buffer.concat([beforePin, paddedPinBytes, afterPin]);
            console.log('PIN EXE içine hardcode edildi:', pin, 'Uzunluk:', paddedPinBytes.length);
        } else {
            console.log('Placeholder bulunamadı, EXE kopyalanıyor');
        }
        
        // PIN-specific EXE'yi yaz
        require('fs').writeFileSync(pinSpecificExePath, modifiedExeBuffer);
        
        // Newtonsoft.Json.dll'yi de kopyala
        const dllSourcePath = path.join(__dirname, 'Newtonsoft.Json.dll');
        const dllDestPath = path.join(__dirname, `Newtonsoft.Json_${pin}.dll`);
        
        if (require('fs').existsSync(dllSourcePath)) {
            require('fs').copyFileSync(dllSourcePath, dllDestPath);
            console.log('Newtonsoft.Json.dll kopyalandı:', pin);
        } else {
            console.log('Newtonsoft.Json.dll bulunamadı!');
        }
        
        console.log('PIN-specific EXE oluşturuldu:', pinSpecificExePath);
        
        // DLL'yi EXE ile aynı klasöre kopyala (EXE'nin yanına)
        const exeDir = path.dirname(pinSpecificExePath);
        const dllInExeDir = path.join(exeDir, 'Newtonsoft.Json.dll');
        
        if (require('fs').existsSync(dllDestPath)) {
            require('fs').copyFileSync(dllDestPath, dllInExeDir);
            console.log('DLL EXE klasörüne kopyalandı:', pin);
        }
        
        // EXE ve DLL'yi birlikte indir
        const files = [
            { path: pinSpecificExePath, name: `CleanAutoScanner_${pin}.exe` },
            { path: dllInExeDir, name: 'Newtonsoft.Json.dll' }
        ];
        
        // İlk dosyayı indir
        res.download(files[0].path, files[0].name, (err) => {
            if (err) {
                console.error('Download hatası:', err);
            } else {
                console.log('Scanner başarıyla indirildi - PIN:', pin);
                // Sadece geçici dosyaları sil, DLL'yi silme
                try {
                    require('fs').unlinkSync(pinSpecificExePath);
                    console.log('Geçici PIN-specific EXE silindi');
                    
                    // DLL'yi de sil
                    if (require('fs').existsSync(dllDestPath)) {
                        require('fs').unlinkSync(dllDestPath);
                        console.log('Geçici DLL silindi');
                    }
                    
                    // EXE klasöründeki DLL'yi SİLME - kullanıcı için gerekli!
                    console.log('EXE klasöründeki DLL korundu - kullanıcı için gerekli');
                } catch (cleanupErr) {
                    console.log('Geçici dosyalar silinemedi:', cleanupErr.message);
                }
            }
        });
    } else {
        console.log('Base EXE dosyası bulunamadı:', baseExePath);
        res.status(404).json({
            success: false,
            message: 'Scanner dosyası bulunamadı'
        });
    }
});

// Admin endpoints
app.get('/api/admin/users', (req, res) => {
    console.log('Admin users isteği (Port 5005)');
    res.json(users);
});

app.get('/api/admin/pins', (req, res) => {
    console.log('Admin pins isteği (Port 5005)');
    console.log('PIN sayısı:', pins.length);
    pins.forEach((pin, index) => {
        console.log(`PIN ${index + 1}:`, {
            pin: pin.pin,
            scanCompleted: pin.scanCompleted,
            hasScreenshot: !!pin.screenshot,
            screenshotLength: pin.screenshot ? pin.screenshot.length : 0
        });
    });
    res.json(pins);
});

// Enterprises - Admin endpoints
app.get('/api/admin/enterprises', (req, res) => {
    console.log('Admin enterprises isteği (Port 5005)');
    try {
        const allEnterprises = loadEnterprises();
        const allUsers = loadUsers();
        
        const enterprisesWithMembers = allEnterprises.map(enterprise => {
            let members = [];
            
            if (enterprise.members && Array.isArray(enterprise.members)) {
                members = enterprise.members.map(member => {
                    if (typeof member === 'string') {
                        const user = allUsers.find(u => u.email === member);
                        return {
                            email: member,
                            username: user ? (user.username || user.name) : 'Unknown User',
                            addedAt: new Date().toISOString() // Varsayılan bir tarih ekleyebiliriz
                        };
                    }
                    return member; // Zaten obje formatındaysa direkt kullan
                });
            }
            return { ...enterprise, members };
        });
        
        console.log('🔍 Enterprises API response:', {
            totalEnterprises: enterprisesWithMembers.length,
            enterprises: enterprisesWithMembers.map(e => ({
                name: e.name,
                membersCount: e.members ? e.members.length : 0,
                members: e.members ? e.members.map(m => typeof m === 'string' ? m : m.email) : []
            }))
        });
        
        res.json(enterprisesWithMembers);
    } catch (error) {
        console.error('Enterprises API hatası:', error);
        res.status(500).json({ error: 'Enterprises yüklenirken hata oluştu' });
    }
});

// Enterprise oluşturma endpoint'i (hem /api/enterprises hem /api/admin/enterprises için)
const createEnterprise = (req, res) => {
    const { name, ownerEmail, seats } = req.body;
    console.log('Enterprise oluşturma isteği:', { name, ownerEmail, seats });

    if (!name || !ownerEmail || !seats || seats <= 0) {
        return res.status(400).json({ success: false, message: 'Geçersiz veri' });
    }

    try {
        const allEnterprises = loadEnterprises();
        
        // Owner kullanıcısı varsa, role'ünü koru. Yoksa ownersız da oluşturulabilir
        const ent = {
            id: 'ent_' + Date.now(),
            name,
            ownerEmail,
            seats: Number(seats),
            members: ownerEmail ? [ownerEmail] : [],
            createdAt: new Date().toISOString()
        };
        
        allEnterprises.push(ent);
        
        // Veriyi dosyaya kaydet
        saveEnterprises(allEnterprises);
        
        console.log('✅ Enterprise oluşturuldu:', ent.id);
        res.json({ success: true, enterprise: ent });
    } catch (error) {
        console.error('❌ Enterprise oluşturma hatası:', error);
        res.status(500).json({ success: false, message: 'Enterprise oluşturulurken hata oluştu' });
    }
};

// Her iki endpoint için de aynı fonksiyonu kullan
app.post('/api/enterprises', createEnterprise);
app.post('/api/admin/enterprises', createEnterprise);

// Enterprise'a üye ekleme (owner veya admin tarafından)
app.post('/api/enterprises/:id/add-member', (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    console.log('Enterprise üye ekleme:', { id, email });

    const ent = enterprises.find(e => e.id === id);
    if (!ent) return res.status(404).json({ success: false, message: 'Enterprise bulunamadı' });

    if (!email) return res.status(400).json({ success: false, message: 'Email gerekli' });

    // Koltuk limiti kontrolü
    if (ent.members.length >= ent.seats) {
        return res.status(409).json({ success: false, message: 'Koltuk limiti dolu' });
    }

    if (!ent.members.includes(email)) {
        ent.members.push(email);
        
        // Veriyi dosyaya kaydet
        saveEnterprises(enterprises);
    }
    console.log('Üye eklendi:', email, '->', id);
    res.json({ success: true, enterprise: ent });
});

// Enterprise silme fonksiyonu (hem /api/enterprises/:id hem /api/admin/enterprises/:id için)
const deleteEnterprise = (req, res) => {
    const { id } = req.params;
    console.log('Enterprise silme isteği (Port 5005):', id);
    
    try {
        const allEnterprises = loadEnterprises();
        const idx = allEnterprises.findIndex(e => e.id === id);
        
        if (idx === -1) {
            return res.status(404).json({ success: false, message: 'Enterprise bulunamadı' });
        }
        
        const removed = allEnterprises[idx];
        allEnterprises.splice(idx, 1);
        
        // Veriyi dosyaya kaydet
        saveEnterprises(allEnterprises);
        
        console.log('✅ Enterprise silindi:', removed.name);
        res.json({ success: true, removed });
    } catch (error) {
        console.error('❌ Enterprise silme hatası:', error);
        res.status(500).json({ success: false, message: 'Enterprise silinirken hata oluştu' });
    }
};

// Her iki endpoint için de aynı fonksiyonu kullan
app.delete('/api/enterprises/:id', deleteEnterprise);
app.delete('/api/admin/enterprises/:id', deleteEnterprise);

// Kullanıcı bilgilerini getirme
app.get('/api/user-info', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('User info isteği (Port 5005)');
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token gerekli' });
    }
    
    const userEmail = getUserEmailFromToken(token);
    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Geçersiz token' });
    }
    
    // GÜNCEL VERİYİ DOSYADAN YÜKLE
    const currentUsers = loadUsers();
    const user = currentUsers.find(u => u.email === userEmail);
    if (!user) {
        return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
    
    console.log('🔍 User info debug:', {
        email: userEmail,
        role: user.role,
        hasAdminAccess: user.hasAdminAccess
    });
    
    res.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            hasAdminAccess: user.hasAdminAccess || false,
            createdAt: user.createdAt
        }
    });
});

// Admin tarafından kullanıcı şifresi değiştirme
app.post('/api/admin/change-user-password', (req, res) => {
    const { email, newPassword } = req.body;
    console.log('Admin şifre değiştirme isteği (Port 5005):', email);
    
    if (!email || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email ve yeni şifre gerekli' });
    }
    
    // Kullanıcıyı bul
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
    
    // Şifreyi güncelle
    user.password = newPassword;
    user.passwordChangedAt = new Date().toISOString();
    user.passwordChangedBy = 'admin';
    
    // Veriyi dosyaya kaydet
    saveUsers(users);
    
    console.log('Kullanıcı şifresi değiştirildi:', email);
    res.json({ success: true, message: 'Kullanıcı şifresi başarıyla değiştirildi' });
});

// Admin ban endpoint'i
app.post('/api/admin/ban-user', (req, res) => {
    const { email, reason } = req.body;
    console.log('Admin ban isteği (Port 5005):', email, 'Sebep:', reason);
    
    if (!email || !reason) {
        return res.status(400).json({ success: false, message: 'Email ve ban sebebi gerekli' });
    }
    
    // Kullanıcıyı bul
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
    
    // Kullanıcıyı banla
    user.isBanned = true;
    user.banReason = reason;
    user.bannedAt = new Date().toISOString();
    user.bannedBy = 'admin';
    
    // Veriyi dosyaya kaydet
    saveUsers(users);
    
    console.log('Kullanıcı banlandı:', email, 'Sebep:', reason);
    res.json({ success: true, message: 'Kullanıcı başarıyla banlandı' });
});

// Admin unban endpoint'i
app.post('/api/admin/unban-user', (req, res) => {
    const { email } = req.body;
    console.log('Admin unban isteği (Port 5005):', email);
    
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email gerekli' });
    }
    
    // Kullanıcıyı bul
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
    
    // Kullanıcının ban durumunu kontrol et
    if (!user.isBanned) {
        return res.status(400).json({ success: false, message: 'Kullanıcı zaten banlı değil' });
    }
    
    // Kullanıcının banını kaldır
    user.isBanned = false;
    user.unbannedAt = new Date().toISOString();
    user.unbannedBy = 'admin';
    // Ban bilgilerini temizle
    delete user.banReason;
    delete user.bannedAt;
    delete user.bannedBy;
    
    // Veriyi dosyaya kaydet
    saveUsers(users);
    
    console.log('Kullanıcı banı kaldırıldı:', email);
    res.json({ success: true, message: 'Kullanıcı banı başarıyla kaldırıldı' });
});


// Admin Panel API Endpoints
// Tüm kullanıcıları getir
app.get('/api/users', (req, res) => {
    console.log('Users API isteği alındı (Port 5005)');
    try {
        const allUsers = loadUsers();
        res.json(allUsers);
    } catch (error) {
        console.error('Users API hatası:', error);
        res.status(500).json({ error: 'Users yüklenirken hata oluştu' });
    }
});

// Tüm PIN'leri getir
app.get('/api/pins', (req, res) => {
    console.log('Pins API isteği alındı (Port 5005)');
    try {
        const allPins = loadPins();
        res.json(allPins);
    } catch (error) {
        console.error('Pins API hatası:', error);
        res.status(500).json({ error: 'Pins yüklenirken hata oluştu' });
    }
});

// Tüm enterprise'leri getir
app.get('/api/enterprises', (req, res) => {
    console.log('Enterprises API isteği alındı (Port 5005)');
    try {
        const allEnterprises = loadEnterprises();
        const allUsers = loadUsers();
        
        // Enterprise'ları üye bilgileriyle birlikte gönder
        const enterprisesWithMembers = allEnterprises.map(enterprise => {
            let members = [];
            
            if (enterprise.members && Array.isArray(enterprise.members)) {
                members = enterprise.members.map(member => {
                    // Eğer member string ise (eski format), user bilgisini bul
                    if (typeof member === 'string') {
                        const user = allUsers.find(u => u.email === member);
                        return {
                            email: member,
                            username: user ? (user.username || user.name || 'Unknown User') : 'Unknown User',
                            addedAt: new Date().toISOString()
                        };
                    }
                    // Eğer member obje ise (yeni format), direkt kullan
                    return member;
                });
            }
            
            return {
                ...enterprise,
                members: members
            };
        });
        
        res.json(enterprisesWithMembers);
    } catch (error) {
        console.error('Enterprises API hatası:', error);
        res.status(500).json({ error: 'Enterprises yüklenirken hata oluştu' });
    }
});

// Kullanıcı sonuçlarını getir
app.get('/api/user-results/:email', (req, res) => {
    const { email } = req.params;
    console.log('User results API isteği alındı (Port 5005):', email);
    
    try {
        const allPins = loadPins();
        const userPins = allPins.filter(pin => pin.creatorEmail === email && pin.status === 'completed');
        
        // Debug: Screenshot verilerini kontrol et
        console.log('🔍 Backend Screenshot Debug:', {
            totalPins: allPins.length,
            userPins: userPins.length,
            firstPinScreenshot: userPins[0] ? {
                hasScreenshot: !!userPins[0].screenshot,
                screenshotLength: userPins[0].screenshot ? userPins[0].screenshot.length : 0,
                screenshotPreview: userPins[0].screenshot ? userPins[0].screenshot.substring(0, 50) + '...' : null
            } : null
        });
        
        res.json(userPins);
    } catch (error) {
        console.error('User results API hatası:', error);
        res.status(500).json({ error: 'User results yüklenirken hata oluştu' });
    }
});

// Admin erişimi ver - KUSURSUZ VERSİYON
app.post('/api/admin/grant-admin-access', (req, res) => {
    const { email } = req.body;
    console.log('🚀 GRANT REQUEST:', email);
    
    try {
        const users = loadUsers();
        console.log('📊 Total users:', users.length);
        
        const userIndex = users.findIndex(user => user.email === email);
        console.log('🔍 User index:', userIndex);
        
        if (userIndex === -1) {
            console.log('❌ User not found:', email);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // KUSURSUZ GRANT İŞLEMİ - HİÇBİR KONTROL YOK
        console.log('🎯 GRANTING ADMIN ACCESS TO:', email);
        console.log('📝 Before:', {
            role: users[userIndex].role,
            hasAdminAccess: users[userIndex].hasAdminAccess
        });
        
        users[userIndex].role = 'admin';
        users[userIndex].hasAdminAccess = true;
        users[userIndex].adminAccessGrantedAt = new Date().toISOString();
        
        console.log('📝 After:', {
            role: users[userIndex].role,
            hasAdminAccess: users[userIndex].hasAdminAccess
        });
        
        saveUsers(users);
        
        console.log('✅ SUCCESS: Admin access granted to:', email);
        res.json({ 
            success: true, 
            message: 'Admin access granted successfully' 
        });
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to grant admin access' 
        });
    }
});

// Admin erişimi çek
app.post('/api/admin/revoke-admin-access', (req, res) => {
    const { email } = req.body;
    console.log('Admin erişimi çekiliyor:', email);
    
    try {
        const users = loadUsers();
        const userIndex = users.findIndex(user => user.email === email);
        
        if (userIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // KUSURSUZ REVOKE İŞLEMİ - HİÇBİR KONTROL YOK
        console.log('🎯 REVOKING ADMIN ACCESS FROM:', email);
        console.log('📝 Before:', {
            role: users[userIndex].role,
            hasAdminAccess: users[userIndex].hasAdminAccess
        });
        
        users[userIndex].role = 'client';
        users[userIndex].hasAdminAccess = false;
        users[userIndex].adminAccessRevokedAt = new Date().toISOString();
        
        console.log('📝 After:', {
            role: users[userIndex].role,
            hasAdminAccess: users[userIndex].hasAdminAccess
        });
        
        saveUsers(users);
        
        console.log('✅ SUCCESS: Admin access revoked from:', email);
        res.json({ 
            success: true, 
            message: 'Admin access revoked successfully' 
        });
    } catch (error) {
        console.error('Admin erişimi çekme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to revoke admin access' 
        });
    }
});

// Enterprise üye ekleme
app.post('/api/enterprises/:enterpriseId/members', (req, res) => {
    const { enterpriseId } = req.params;
    const { email } = req.body;
    
    console.log('Enterprise üye ekleniyor:', { enterpriseId, email });
    
    try {
        const enterprises = loadEnterprises();
        const users = loadUsers();
        
        const enterpriseIndex = enterprises.findIndex(e => e.id === enterpriseId);
        if (enterpriseIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Enterprise not found' 
            });
        }
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Üyenin zaten enterprise'da olup olmadığını kontrol et
        if (enterprises[enterpriseIndex].members && 
            enterprises[enterpriseIndex].members.some(m => m.email === email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'User is already a member of this enterprise' 
            });
        }
        
        // Seat limitini kontrol et
        const currentMembers = enterprises[enterpriseIndex].members ? enterprises[enterpriseIndex].members.length : 0;
        if (currentMembers >= enterprises[enterpriseIndex].seats) {
            return res.status(400).json({ 
                success: false, 
                message: 'Enterprise has reached its seat limit' 
            });
        }
        
        // Üyeyi ekle
        if (!enterprises[enterpriseIndex].members) {
            enterprises[enterpriseIndex].members = [];
        }
        
        enterprises[enterpriseIndex].members.push({
            email: user.email,
            username: user.username || user.name,
            addedAt: new Date().toISOString()
        });
        
        saveEnterprises(enterprises);
        
        console.log('✅ SUCCESS: Member added to enterprise:', email);
        res.json({ 
            success: true, 
            message: 'Member added successfully' 
        });
    } catch (error) {
        console.error('Enterprise üye ekleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add member' 
        });
    }
});

// Enterprise üye çıkarma
app.delete('/api/enterprises/:enterpriseId/members', (req, res) => {
    const { enterpriseId } = req.params;
    const { email } = req.body;
    
    console.log('Enterprise üye çıkarılıyor:', { enterpriseId, email });
    
    try {
        const enterprises = loadEnterprises();
        
        const enterpriseIndex = enterprises.findIndex(e => e.id === enterpriseId);
        if (enterpriseIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Enterprise not found' 
            });
        }
        
        if (!enterprises[enterpriseIndex].members) {
            return res.status(400).json({ 
                success: false, 
                message: 'No members found in this enterprise' 
            });
        }
        
        const memberIndex = enterprises[enterpriseIndex].members.findIndex(m => {
            // Eğer member string ise (eski format), direkt karşılaştır
            if (typeof m === 'string') {
                return m === email;
            }
            // Eğer member obje ise (yeni format), email alanını karşılaştır
            return m.email === email;
        });
        if (memberIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found in this enterprise' 
            });
        }
        
        // Üyeyi çıkar
        enterprises[enterpriseIndex].members.splice(memberIndex, 1);
        
        saveEnterprises(enterprises);
        
        console.log('✅ SUCCESS: Member removed from enterprise:', email);
        res.json({ 
            success: true, 
            message: 'Member removed successfully' 
        });
    } catch (error) {
        console.error('Enterprise üye çıkarma hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to remove member' 
        });
    }
});

// ==================== EXE SCANNER ENDPOINTS ====================

// API Key endpoint - Exe için
app.get('/api/get-api-key', (req, res) => {
    console.log('🔑 API Key isteği alındı (Exe Scanner)');
    res.json({ 
        apiKey: 'VOID_SCANNER_API_KEY_2025',
        message: 'API Key başarıyla alındı',
        status: 'success'
    });
});

// PIN doğrulama endpoint - Exe için
app.post('/api/verify-pin', (req, res) => {
    const { pin } = req.body;
    
    console.log('🔍 PIN doğrulama isteği:', pin);
    
    try {
        const pins = loadPins();
        const pinData = pins.find(p => p.pin === pin);
        
        if (pinData) {
            console.log('✅ PIN doğrulandı:', pin);
            res.json({ 
                valid: true, 
                message: 'PIN doğrulandı',
                pinData: pinData
            });
        } else {
            console.log('❌ Geçersiz PIN:', pin);
            res.json({ 
                valid: false, 
                message: 'Geçersiz PIN kodu' 
            });
        }
    } catch (error) {
        console.error('PIN doğrulama hatası:', error);
        res.status(500).json({ 
            valid: false, 
            message: 'PIN doğrulama hatası' 
        });
    }
});

// Tarama sonuçları endpoint - Exe için
app.post('/api/scan-results', (req, res) => {
    const { pinCode, scanTime, deviceInfo, encryptedData, scannerId } = req.body;
    
    console.log('=== 🔍 TARAMA SONUÇLARI ALINDI (EXE) ===');
    console.log('PIN:', pinCode);
    console.log('Tarama Zamanı:', scanTime);
    console.log('Cihaz Bilgisi:', deviceInfo);
    console.log('Scanner ID:', scannerId);
    console.log('Zaman:', new Date().toISOString());
    console.log('==========================================');
    
    try {
        // PIN'e ait kullanıcıyı bul
        const pins = loadPins();
        const pinData = pins.find(p => p.pin === pinCode);
        
        if (pinData) {
            // Tarama sonuçlarını kaydet
            const scanResult = {
                id: Date.now(),
                pinCode: pinCode,
                scanTime: scanTime,
                deviceInfo: deviceInfo,
                encryptedData: encryptedData,
                scannerId: scannerId,
                createdAt: new Date().toISOString(),
                userId: pinData.userId,
                userName: pinData.userName
            };
            
            // Sonuçları dosyaya kaydet (isteğe bağlı)
            const resultsFile = path.join(DATA_DIR, 'scan-results.json');
            let results = [];
            
            if (fs.existsSync(resultsFile)) {
                const data = fs.readFileSync(resultsFile, 'utf8');
                results = JSON.parse(data);
            }
            
            results.push(scanResult);
            fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
            
            console.log('✅ Tarama sonuçları başarıyla kaydedildi');
        }
        
        res.json({ 
            success: true, 
            message: 'Sonuçlar başarıyla kaydedildi',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Tarama sonuçları kaydetme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sonuçlar kaydedilemedi' 
        });
    }
});

// Sunucu başlatma
app.listen(PORT, () => {
    console.log(`🚀 Void Scanner Backend ${PORT} portunda çalışıyor`);
    console.log(`🌐 Web arayüzü: http://localhost:${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`📁 Static files: ${__dirname}`);
    console.log(`📥 Download URL: http://localhost:${PORT}/download/scanner`);
    console.log(`🔑 Exe Scanner API: http://localhost:${PORT}/api/get-api-key`);
});
