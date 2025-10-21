const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Mevcut dizini static olarak serve et

// Ana sayfa - HTML dosyasını serve et
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'VoidScanner.html'));
});

// API Key endpoint
app.get('/api/get-api-key', (req, res) => {
    console.log('API Key isteği alındı');
    res.json({ 
        apiKey: 'VOID_SCANNER_API_KEY_2025',
        status: 'success'
    });
});

// PIN doğrulama endpoint
app.post('/api/verify-pin', (req, res) => {
    const { pin } = req.body;
    console.log('PIN doğrulama isteği:', pin);
    
    // PIN format kontrolü (8 karakter, A-F ve 0-9)
    if (pin && pin.length === 8 && /^[A-F0-9]+$/.test(pin)) {
        res.json({ 
            valid: true, 
            message: 'PIN doğrulandı',
            timestamp: new Date().toISOString()
        });
    } else {
        res.json({ 
            valid: false, 
            message: 'Geçersiz PIN formatı',
            timestamp: new Date().toISOString()
        });
    }
});

// Tarama sonuçları endpoint
app.post('/api/scan-results', (req, res) => {
    const { pinCode, scanTime, deviceInfo, encryptedData, scannerId } = req.body;
    
    console.log('=== TARAMA SONUÇLARI ALINDI ===');
    console.log('PIN:', pinCode);
    console.log('Tarama Zamanı:', scanTime);
    console.log('Cihaz Bilgisi:', deviceInfo);
    console.log('Scanner ID:', scannerId);
    console.log('Zaman:', new Date().toISOString());
    console.log('================================');
    
    res.json({ 
        success: true, 
        message: 'Sonuçlar başarıyla kaydedildi',
        timestamp: new Date().toISOString()
    });
});

// Web arayüzü için tarama endpoint
app.post('/api/web-scan', (req, res) => {
    const { pin } = req.body;
    
    console.log('Web tarama isteği:', pin);
    
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
        status: 'completed'
    };
    
    res.json(scanResults);
});

// Sunucu başlatma
app.listen(PORT, () => {
    console.log(`🚀 Void Scanner Backend ${PORT} portunda çalışıyor`);
    console.log(`🌐 Web arayüzü: http://localhost:${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`📁 Static files: ${__dirname}`);
});
