const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Mevcut dizini static olarak serve et

// Ana sayfa - HTML dosyasını serve et
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'VoidScanner.html'));
});

// API Key pnt
app.get('/api/get-api-key', (req, res) => {
    console.log('API Key isteği alındı (Port 3001)');
    res.json({ 
        apiKey: 'VOID_SCANNER_API_KEY_2025',
        status: 'success',
        port: 3001
    });
});

// PIN doğrulama endpoint
app.post('/api/verify-pin', (req, res) => {
    const { pin } = req.body;
    console.log('PIN doğrulama isteği (Port 3001):', pin);
    
    // PIN format kontrolü (8 karakter, A-F ve 0-9)
    if (pin && pin.length === 8 && /^[A-F0-9]+$/.test(pin)) {
        res.json({ 
            valid: true, 
            message: 'PIN doğrulandı',
            timestamp: new Date().toISOString(),
            port: 3001
        });
    } else {
        res.json({ 
            valid: false, 
            message: 'Geçersiz PIN formatı',
            timestamp: new Date().toISOString(),
            port: 3001
        });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login isteği (Port 3001):', username);
    
    // Basit login kontrolü
    if (username && password) {
        const token = 'dummy_token_' + Date.now();
        res.json({
            success: true,
            token: token,
            user: {
                id: 1,
                username: username,
                role: 'admin'
            },
            message: 'Giriş başarılı'
        });
    } else {
        res.json({
            success: false,
            message: 'Kullanıcı adı ve şifre gerekli'
        });
    }
});

// PIN listesi endpoint - Proxy to server5005
app.get('/api/my-pins', async (req, res) => {
    console.log('PIN listesi isteği (Port 3001) - Proxy to 5005');
    
    try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:5005/api/my-pins', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        
        console.log('✅ PIN listesi proxy başarılı:', response.data.length, 'PIN');
        res.json(response.data);
    } catch (error) {
        console.error('❌ PIN listesi proxy hatası:', error.message);
        res.status(500).json({ error: 'PIN listesi alınamadı' });
    }
});

// PIN oluşturma endpoint - Proxy to server5005
app.post('/api/create-pin', async (req, res) => {
    console.log('PIN oluşturma isteği (Port 3001) - Proxy to 5005');
    
    try {
        const axios = require('axios');
        const response = await axios.post('http://localhost:5005/api/create-pin', req.body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ PIN oluşturma proxy başarılı:', response.data.pin?.pin);
        res.json(response.data);
    } catch (error) {
        console.error('❌ PIN oluşturma proxy hatası:', error.message);
        res.status(500).json({ error: 'PIN oluşturulamadı' });
    }
});

// User info endpoint - Proxy to server5005
app.get('/api/user-info', async (req, res) => {
    console.log('User info isteği (Port 3001) - Proxy to 5005');
    
    try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:5005/api/user-info', {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        
        console.log('✅ User info proxy başarılı');
        res.json(response.data);
    } catch (error) {
        console.error('❌ User info proxy hatası:', error.message);
        res.status(500).json({ error: 'User info alınamadı' });
    }
});

// PIN silme endpoint - Proxy to server5005
app.delete('/api/pins/:id', async (req, res) => {
    console.log('PIN silme isteği (Port 3001) - Proxy to 5005:', req.params.id);
    
    try {
        const axios = require('axios');
        const response = await axios.delete(`http://localhost:5005/api/pins/${req.params.id}`, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        
        console.log('✅ PIN silme proxy başarılı');
        res.json(response.data);
    } catch (error) {
        console.error('❌ PIN silme proxy hatası:', error.message);
        res.status(500).json({ error: 'PIN silinemedi' });
    }
});

// Tarama sonuçları endpoint
app.post('/api/scan-results', (req, res) => {
    const { pinCode, scanTime, deviceInfo, encryptedData, scannerId } = req.body;
    
    console.log('=== TARAMA SONUÇLARI ALINDI (Port 3001) ===');
    console.log('PIN:', pinCode);
    console.log('Tarama Zamanı:', scanTime);
    console.log('Cihaz Bilgisi:', deviceInfo);
    console.log('Scanner ID:', scannerId);
    console.log('Zaman:', new Date().toISOString());
    console.log('===========================================');
    
    res.json({ 
        success: true, 
        message: 'Sonuçlar başarıyla kaydedildi',
        timestamp: new Date().toISOString(),
        port: 3001
    });
});

// Web arayüzü için tarama endpoint
app.post('/api/web-scan', (req, res) => {
    const { pin } = req.body;
    
    console.log('Web tarama isteği (Port 3001):', pin);
    
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
        port: 3001
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
