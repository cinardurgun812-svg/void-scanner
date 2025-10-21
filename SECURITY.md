# 🔐 Void Scanner - Güvenlik Dokümantasyonu

## 🛡️ Güvenlik Özellikleri

### **Backend Güvenliği:**
- ✅ **Helmet.js** - HTTP header güvenliği
- ✅ **Rate Limiting** - DDoS koruması (100 req/15min)
- ✅ **CORS** - Sadece localhost erişimi
- ✅ **JWT Tokens** - PIN doğrulama
- ✅ **API Key Authentication** - Scanner kimlik doğrulama
- ✅ **AES-256-CBC Şifreleme** - Hassas veri koruması
- ✅ **Input Validation** - PIN format kontrolü
- ✅ **Security Logging** - Tüm aktiviteler loglanır

### **Scanner Güvenliği:**
- ✅ **API Key Authentication** - Backend kimlik doğrulama
- ✅ **PIN Format Validation** - 8 karakter hex kontrolü
- ✅ **Data Encryption** - XOR şifreleme (geliştirilebilir)
- ✅ **Error Logging** - Hata logları
- ✅ **Scanner ID** - Benzersiz cihaz kimliği
- ✅ **Secure HTTP Client** - SSL/TLS desteği

## 🔑 Güvenlik Anahtarları

### **Environment Variables:**
```bash
JWT_SECRET=your-super-secret-jwt-key-here
ENCRYPTION_KEY=your-32-character-encryption-key
API_KEY=your-api-key-for-scanner-auth
```

### **PIN Format:**
- **Uzunluk:** 8 karakter
- **Format:** Sadece A-F ve 0-9
- **Örnek:** `A1B2C3D4`

## 📊 Veri Koruma

### **Şifrelenen Veriler:**
- Cihaz bilgileri
- Ağ bilgileri
- Şüpheli dosyalar
- Şüpheli süreçler
- Hassas sistem bilgileri

### **Şifrelenmeyen Veriler:**
- PIN kodu
- Tarama zamanı
- Risk seviyesi
- Özet istatistikler
- Güvenlik durumu

## 🚨 Güvenlik Uyarıları

### **Production'da Yapılması Gerekenler:**
1. **Güçlü şifreleme** - AES-256-GCM kullanın
2. **HTTPS** - SSL sertifikası ekleyin
3. **Database şifreleme** - MongoDB encryption
4. **API Key rotation** - Düzenli anahtar değişimi
5. **Audit logging** - Detaylı güvenlik logları
6. **Intrusion detection** - Saldırı tespit sistemi

### **Güvenlik Riskleri:**
- ⚠️ **XOR şifreleme** - Güçlü değil, geliştirilmeli
- ⚠️ **Localhost only** - Network güvenliği eksik
- ⚠️ **No HTTPS** - SSL/TLS eksik
- ⚠️ **Simple API Key** - Daha güçlü auth gerekli

## 🔧 Güvenlik Konfigürasyonu

### **Rate Limiting:**
```javascript
windowMs: 15 * 60 * 1000, // 15 dakika
max: 100, // Her IP için maksimum 100 istek
```

### **CORS Policy:**
```javascript
origin: ['http://localhost:3000', 'http://localhost:3001'],
credentials: true,
methods: ['GET', 'POST', 'PUT', 'DELETE']
```

### **Helmet Configuration:**
```javascript
helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
})
```

## 📝 Güvenlik Logları

### **Log Konumları:**
- **Backend:** `backend/security-logs/`
- **Scanner:** `%APPDATA%/VoidScanner/error.log`
- **Scan Results:** `backend/scan-results/`

### **Log İçeriği:**
- Timestamp
- IP adresi
- User-Agent
- PIN kodu
- Risk seviyesi
- Hata mesajları

## 🚀 Güvenlik Testleri

### **Test Senaryoları:**
1. **API Key Test** - Geçersiz API key
2. **PIN Format Test** - Yanlış PIN formatı
3. **Rate Limit Test** - Çok fazla istek
4. **CORS Test** - Farklı origin'den erişim
5. **Encryption Test** - Şifreleme doğruluğu

### **Test Komutları:**
```bash
# Rate limit test
for i in {1..101}; do curl http://localhost:5000/api/verify-pin; done

# CORS test
curl -H "Origin: http://malicious.com" http://localhost:5000/api/verify-pin

# API key test
curl -H "X-API-Key: invalid-key" http://localhost:5000/api/scan-results
```

## 🔒 Güvenlik Checklist

- [ ] Güçlü şifreleme algoritması
- [ ] HTTPS/SSL sertifikası
- [ ] Database şifreleme
- [ ] API key rotation
- [ ] Intrusion detection
- [ ] Security monitoring
- [ ] Penetration testing
- [ ] Security audit
- [ ] Backup encryption
- [ ] Access control

---

**⚠️ UYARI:** Bu sistem geliştirme amaçlıdır. Production kullanımı için ek güvenlik önlemleri gereklidir!
