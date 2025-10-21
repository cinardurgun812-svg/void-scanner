import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import PinDetailsPage from './PinDetailsPage';
import CreatePinPage from './CreatePinPage';
import ViewResultsPage from './ViewResultsPage';
import EnterpriseSettings from './EnterpriseSettings';

const Dashboard = ({ user: propUser, onLogout }) => {
  // localStorage'dan güncel user bilgilerini al
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : propUser;
  });
  const [pins, setPins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState(null);
  const [showPinDetails, setShowPinDetails] = useState(false);
  const [showPinDetailsPage, setShowPinDetailsPage] = useState(false);
  const [showCreatePinPage, setShowCreatePinPage] = useState(false);
  const [showViewResultsPage, setShowViewResultsPage] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [showEnterpriseSettings, setShowEnterpriseSettings] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [enterprises, setEnterprises] = useState([]);
  const [userEnterpriseInfo, setUserEnterpriseInfo] = useState(null);

  useEffect(() => {
    fetchPins();
    fetchEnterprises();
    refreshUserInfo(); // Kullanıcı bilgilerini yenile
    const t = setInterval(() => {
      fetchEnterprises();
      refreshUserInfo(); // Her 5 saniyede kullanıcı bilgilerini yenile
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const refreshUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get('http://localhost:5005/api/user-info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // localStorage'daki user bilgilerini güncelle
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // State'i güncelle
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('User info refresh error:', error);
    }
  };

  const fetchPins = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5005/api/my-pins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('PINler yuklendi:', response.data);
      console.log('Ilk PIN _id:', response.data[0]?._id);
      setPins(response.data);
    } catch (error) {
      console.error('PIN\'ler yüklenemedi:', error);
      toast.error('PIN\'ler yüklenemedi!');
    } finally {
      setIsLoading(false);
    }
  };

  const createPin = async () => {
    try {
      // Üyelik kontrolü
      if (!userEnterpriseInfo || !userEnterpriseInfo.name || userEnterpriseInfo.name === '-') {
        toast.error('Site üyeliğiniz yok. Lütfen bir enterprise üyeliği satın alın.');
        return;
      }
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5005/api/create-pin', {
        targetInfo: {
          name: 'Random Target',
          description: 'Test target for scanning'
        },
        userEmail: user?.email || user?.username,
        creatorName: (user?.name)
          ? user.name
          : (user?.username || (user?.email ? user.email.split('@')[0] : 'User')),
        // Redundant fields for backend compatibility
        email: user?.email || user?.username,
        name: user?.name || (user?.username || (user?.email ? user.email.split('@')[0] : 'User')),
        username: user?.username
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('PIN başarıyla oluşturuldu!');
      fetchPins(); // PIN listesini yenile
    } catch (error) {
      console.error('PIN oluşturulamadı:', error);
      toast.error('PIN oluşturulamadı!');
    }
  };

  const fetchEnterprises = async () => {
    try {
      const res = await axios.get('http://localhost:5005/api/admin/enterprises');
      const ents = res.data || [];
      setEnterprises(ents);
      
      // Kullanıcı bilgilerini localStorage'dan al (güncel olması için)
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : user;
      const myEmail = currentUser?.email || currentUser?.username;
      
      console.log('🔍 Enterprise kontrolü:', { 
        myEmail, 
        ents: ents.map(e => ({
          name: e.name,
          ownerEmail: e.ownerEmail,
          members: e.members,
          membersLength: e.members ? e.members.length : 0,
          membersDetails: e.members ? e.members.map(m => typeof m === 'string' ? m : m.email) : []
        }))
      });
      
      // Debug: Enterprise verilerini detaylı göster
      console.log('🔍 Enterprise verileri detaylı:', ents);
      
      // Debug: Her enterprise için member detayları
      ents.forEach((ent, index) => {
        console.log(`🔍 Enterprise ${index + 1}:`, {
          name: ent.name,
          members: ent.members,
          membersLength: ent.members ? ent.members.length : 0,
          membersDetails: ent.members ? ent.members.map(m => typeof m === 'string' ? m : m.email) : []
        });
        
        // Debug: Her member için detaylı bilgi
        if (ent.members && ent.members.length > 0) {
          ent.members.forEach((member, memberIndex) => {
            console.log(`🔍 Member ${memberIndex + 1}:`, {
              member: member,
              type: typeof member,
              email: typeof member === 'string' ? member : member.email
            });
          });
        }
      });
      
      // Debug: Kullanıcı email kontrolü
      console.log('🔍 Kullanıcı email kontrolü:', {
        myEmail: myEmail,
        myEmailType: typeof myEmail,
        myEmailLength: myEmail ? myEmail.length : 0
      });
      
      // Debug: Backend API endpoint kontrolü
      console.log('🔍 Backend API endpoint kontrolü:', {
        apiUrl: 'http://localhost:5005/api/admin/enterprises',
        timestamp: new Date().toISOString()
      });
      
      // Debug: Cache kontrolü
      console.log('🔍 Cache kontrolü:', {
        localStorage: localStorage.getItem('user'),
        sessionStorage: sessionStorage.getItem('user')
      });
      
      // Debug: Force refresh kontrolü
      console.log('🔍 Force refresh kontrolü:', {
        forceRefresh: true,
        timestamp: new Date().toISOString()
      });
      
      // Debug: Browser cache kontrolü
      console.log('🔍 Browser cache kontrolü:', {
        cache: 'disabled',
        timestamp: new Date().toISOString()
      });
      
      // Debug: Enterprise kontrolü öncesi myEmail ve enterprise üyeleri
      console.log('🔍 Enterprise kontrolü öncesi:', {
        myEmail: myEmail,
        enterpriseMembers: ents.map(e => e.members ? e.members.map(m => typeof m === 'string' ? m : m.email) : [])
      });
      
      // Enterprise bulma mantığını güncelle - hem eski hem yeni format için uyumlu
      const mine = ents.find(e => {
        console.log('🔍 Enterprise kontrol ediliyor:', e.name, {
          ownerEmail: e.ownerEmail,
          members: e.members,
          myEmail
        });
        
        // Owner kontrolü
        if (e.ownerEmail === myEmail) {
          console.log('✅ Owner olarak bulundu:', e.name);
          return true;
        }
        
        // Member kontrolü - hem eski (string) hem yeni (obje) format için
        if (e.members && Array.isArray(e.members)) {
          const isMember = e.members.some(member => {
            if (typeof member === 'string') {
              const found = member === myEmail;
              if (found) console.log('✅ String member olarak bulundu:', member);
              return found;
            } else if (typeof member === 'object' && member.email) {
              const found = member.email === myEmail;
              if (found) console.log('✅ Object member olarak bulundu:', member.email);
              return found;
            }
            return false;
          });
          if (isMember) {
            console.log('✅ Member olarak bulundu:', e.name);
            return true;
          }
        }
        return false;
      });
      
      console.log('🔍 Enterprise bulundu:', mine);
      
      if (mine) {
        const newEnterpriseInfo = {
          name: mine.name,
          slot: `${(mine.members || []).length}/${mine.seats}`,
          status: 'active',
          lastActivity: 'updated'
        };
        console.log('🔍 Enterprise bilgileri güncelleniyor:', newEnterpriseInfo);
        console.log('🔍 Mevcut userEnterpriseInfo:', userEnterpriseInfo);
        
        // Force state update
        setUserEnterpriseInfo(newEnterpriseInfo);
        
        console.log('✅ Enterprise bilgileri güncellendi:', mine.name);
        
        // Debug: State güncellemesi sonrası kontrol
        setTimeout(() => {
          console.log('🔍 State güncellemesi sonrası kontrol:', {
            userEnterpriseInfo: userEnterpriseInfo,
            newEnterpriseInfo: newEnterpriseInfo,
            isEqual: JSON.stringify(userEnterpriseInfo) === JSON.stringify(newEnterpriseInfo)
          });
        }, 100);
      } else {
        // Eğer kullanıcı hiçbir enterprise'da değilse, enterprise bilgilerini temizle
        console.log('🔍 Enterprise bilgileri temizleniyor');
        console.log('🔍 Mevcut userEnterpriseInfo:', userEnterpriseInfo);
        
        // Force state update
        setUserEnterpriseInfo(null);
        
        console.log('❌ Enterprise bulunamadı, bilgiler temizlendi');
        
        // Debug: State temizleme sonrası kontrol
        setTimeout(() => {
          console.log('🔍 State temizleme sonrası kontrol:', {
            userEnterpriseInfo: userEnterpriseInfo,
            isNull: userEnterpriseInfo === null
          });
        }, 100);
      }
    } catch (err) {
      console.error('Enterprise fetch error:', err);
    }
  };

  const deletePin = async (pinId) => {
    try {
      console.log('PIN silme işlemi başlatılıyor:', pinId);
      console.log('PIN ID tipi:', typeof pinId);
      console.log('PIN ID uzunluğu:', pinId?.length);
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Mevcut' : 'Yok');
      
      const response = await axios.delete(`http://localhost:5005/api/pins/${pinId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Silme başarılı:', response.data);
      toast.success('PIN başarıyla silindi!');
      fetchPins(); // PIN listesini yenile
    } catch (error) {
      console.error('PIN silme hatası:', error);
      console.error('Hata detayı:', error.response?.data);
      console.error('Hata durumu:', error.response?.status);
      
      if (error.response?.status === 404) {
        toast.error('PIN bulunamadı!');
      } else if (error.response?.status === 403) {
        toast.error('Bu PIN\'e erişim yetkiniz yok!');
      } else if (error.code === 'ECONNREFUSED') {
        toast.error('Backend sunucusu çalışmıyor!');
      } else {
        toast.error(`PIN silinemedi: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'used': return '#f59e0b';
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'used': return 'Kullanıldı';
      case 'expired': return 'Süresi Doldu';
      default: return 'Bilinmiyor';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Panoya kopyalandı!');
  };

  const viewPinDetails = async (pin) => {
    try {
      setSelectedPin(pin);
      setShowPinDetailsPage(true);
    } catch (error) {
      console.error('PIN detayları yüklenemedi:', error);
      toast.error('PIN detayları yüklenemedi!');
    }
  };

  const parseScanResults = (results) => {
    if (!results) return null;
    
    // Eğer results string değilse, string'e çevir
    let resultsString = results;
    if (typeof results !== 'string') {
      resultsString = String(results);
    }
    
    const lines = resultsString.split('\n');
    const sections = {
      suspiciousActivities: [],
      deletedFiles: [],
      recentApps: [],
      unlicensedApps: [],
      screenshot: null
    };
    
    let currentSection = null;
    
    lines.forEach(line => {
      line = line.trim();
      
      if (line.includes('ŞÜPHELİ AKTİVİTELER')) {
        currentSection = 'suspiciousActivities';
      } else if (line.includes('SON SİLİNEN DOSYALAR')) {
        currentSection = 'deletedFiles';
      } else if (line.includes('SON ÇALIŞTIRILAN UYGULAMALAR')) {
        currentSection = 'recentApps';
      } else if (line.includes('LİSANSSIZ UYGULAMALAR')) {
        currentSection = 'unlicensedApps';
      } else if (line.includes('EKRAN GÖRÜNTÜSÜ')) {
        currentSection = 'screenshot';
      } else if (line && currentSection && line.startsWith('⚠️')) {
        sections.suspiciousActivities.push(line.replace('⚠️ ', ''));
      } else if (line && currentSection && line.startsWith('📁')) {
        sections.deletedFiles.push(line.replace('📁 ', ''));
      } else if (line && currentSection && line.startsWith('💻')) {
        sections.recentApps.push(line.replace('💻 ', ''));
      } else if (line && currentSection && line.startsWith('🔓')) {
        sections.unlicensedApps.push(line.replace('🔓 ', ''));
      } else if (line && currentSection === 'screenshot' && line.includes('✅')) {
        sections.screenshot = line.replace('✅ Ekran görüntüsü alındı: ', '');
      }
    });
    
    return sections;
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: '1.2rem'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'rgba(20, 20, 20, 0.8)',
          borderRadius: '15px',
          border: '1px solid rgba(220, 38, 38, 0.3)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(220, 38, 38, 0.3)',
            borderTop: '3px solid #dc2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          PIN'ler yükleniyor...
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Kullanıcının Enterprise bilgisi
  const userEnterprise = userEnterpriseInfo || {
    name: '-',
    slot: '-/-',
    status: 'active',
    lastActivity: ''
  };

  if (showCreatePinPage) {
    return (
      <CreatePinPage 
        onBack={() => setShowCreatePinPage(false)}
        onPinCreated={fetchPins}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex'
    }}>
      {/* Sol Sidebar */}
      <div style={{
        width: '280px',
        background: 'rgba(15, 15, 15, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(220, 38, 38, 0.3)',
        padding: '20px',
        position: 'relative',
        zIndex: 2,
        overflowY: 'auto'
      }}>
        {/* Enterprise Info */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{
            color: '#dc2626',
            fontSize: '1.1rem',
            fontWeight: '700',
            margin: '0 0 15px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              background: '#dc2626',
              borderRadius: '50%',
              boxShadow: '0 0 10px rgba(220, 38, 38, 0.5)'
            }}></span>
            Enterprise
          </h3>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            padding: '12px 15px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '5px'
            }}>
              <span style={{
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: '600',
                fontFamily: 'monospace'
              }}>
                {userEnterprise.name} {userEnterprise.slot}
              </span>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: userEnterprise.status === 'active' ? '#10b981' : '#6b7280',
                boxShadow: `0 0 8px ${userEnterprise.status === 'active' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(107, 114, 128, 0.5)'}`
              }}></div>
            </div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem',
              fontStyle: 'italic'
            }}>
              {userEnterprise.lastActivity}
            </div>
          </div>
        </div>

        {/* Create Pin Button */}
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={() => setShowCreatePinPage(true)}
            style={{
              width: '100%',
              background: 'linear-gradient(145deg, rgba(0,0,0,0.6), rgba(20,20,20,0.4))',
              color: '#ffffff',
              padding: '16px 22px',
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              transition: 'all 0.25s ease',
              border: '1px solid rgba(220, 38, 38, 0.6)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 30px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              opacity: (userEnterpriseInfo && userEnterpriseInfo.name && userEnterpriseInfo.name !== '-') ? 1 : 0.6,
              cursor: (userEnterpriseInfo && userEnterpriseInfo.name && userEnterpriseInfo.name !== '-') ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseOver={(e) => {
              if (userEnterpriseInfo && userEnterpriseInfo.name && userEnterpriseInfo.name !== '-') {
                e.target.style.transform = 'translateY(-2px) scale(1.01)';
                e.target.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 14px 35px rgba(0,0,0,0.55)';
                e.target.style.background = 'linear-gradient(145deg, rgba(10,10,10,0.7), rgba(35,35,35,0.5))';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 30px rgba(0,0,0,0.4)';
              e.target.style.background = 'linear-gradient(145deg, rgba(0,0,0,0.6), rgba(20,20,20,0.4))';
            }}
            onClick={() => {
              if (!userEnterpriseInfo || !userEnterpriseInfo.name || userEnterpriseInfo.name === '-') {
                toast.error('Site üyeliğiniz yok. Lütfen bir enterprise üyeliği satın alın.');
                return;
              }
              setShowCreatePinPage(true);
            }}
          >
            Create Pin
          </button>
        </div>

        {/* Enterprise Settings Button */}
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={() => setShowEnterpriseSettings(true)}
            style={{
              width: '100%',
              background: 'linear-gradient(145deg, rgba(0,0,0,0.6), rgba(20,20,20,0.4))',
              color: '#ffffff',
              padding: '16px 22px',
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              transition: 'all 0.25s ease',
              border: '1px solid rgba(220, 38, 38, 0.6)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 30px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px) scale(1.01)';
              e.target.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 14px 35px rgba(0,0,0,0.55)';
              e.target.style.background = 'linear-gradient(145deg, rgba(10,10,10,0.7), rgba(35,35,35,0.5))';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 30px rgba(0,0,0,0.4)';
              e.target.style.background = 'linear-gradient(145deg, rgba(0,0,0,0.6), rgba(20,20,20,0.4))';
            }}
          >
            Enterprise Settings
          </button>
        </div>

        {/* Dashboard Stats */}
        <div style={{
          background: 'rgba(220, 38, 38, 0.05)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(220, 38, 38, 0.2)'
        }}>
          <h4 style={{
            color: '#dc2626',
            fontSize: '1rem',
            fontWeight: '600',
            margin: '0 0 15px 0',
            textAlign: 'center'
          }}>
            Dashboard Stats
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>Total Scans</span>
              <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '1.1rem' }}>{pins.length}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>Active</span>
              <span style={{ color: '#10b981', fontWeight: '700', fontSize: '1.1rem' }}>
                {pins.filter(pin => pin.status === 'active').length}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>Completed</span>
              <span style={{ color: '#f59e0b', fontWeight: '700', fontSize: '1.1rem' }}>
                {pins.filter(pin => pin.status === 'used').length}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0'
            }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>Expired</span>
              <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '1.1rem' }}>
                {pins.filter(pin => pin.status === 'expired').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ana İçerik Alanı */}
      <div style={{
        flex: 1,
        position: 'relative',
        zIndex: 2
      }}>
        {/* Yağmur efekti */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: '1px',
                height: `${Math.random() * 50 + 30}px`,
                background: 'linear-gradient(to bottom, rgba(220, 38, 38, 0.3), rgba(220, 38, 38, 0.1))',
                animation: `rain ${Math.random() * 3 + 2}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      
      <style>
        {`
          @keyframes rain {
            0% { transform: translateY(-100vh); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100vh); opacity: 0; }
          }
        `}
      </style>

        {/* Header */}
        <div style={{
          background: 'rgba(20, 20, 20, 0.9)',
          backdropFilter: 'blur(20px)',
          padding: '20px 30px',
          borderBottom: '1px solid rgba(220, 38, 38, 0.3)',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {(() => {
              const raw = (user && (user.name || user.username || user.email)) || '';
              const base = raw && raw.indexOf('@') !== -1 ? raw.split('@')[0] : raw;
              const display = base || 'User';
              return (
                <h1 style={{
                  color: '#ffffff',
                  fontSize: '2.2rem',
                  margin: 0,
                  fontWeight: 900,
                  textShadow: '0 0 6px rgba(220, 38, 38, 0.25)',
                  fontFamily: 'Poppins, Inter, Segoe UI, Arial, sans-serif',
                  letterSpacing: '1px',
                  background: 'linear-gradient(45deg, #ffffff 0%, #dc2626 55%, #ffffff 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {`Welcome ${display} Void`}
                </h1>
              );
            })()}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Panel Button - Only show if user has admin access */}
                {user.hasAdminAccess && (
                  <button
                    onClick={() => window.open('http://localhost:3001', '_blank')}
                    style={{
                      background: 'rgba(220, 38, 38, 0.2)',
                      color: '#dc2626',
                      border: '1px solid rgba(220, 38, 38, 0.5)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      textTransform: 'uppercase'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(220, 38, 38, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(220, 38, 38, 0.2)';
                    }}
                  >
                    Panel
                  </button>
                )}
                
                <button
                  onClick={() => fetchPins()}
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(16, 185, 129, 0.2)';
                  }}
                >
                  Refresh
                </button>
                
                <button
                  style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: (userEnterpriseInfo && userEnterpriseInfo.name && userEnterpriseInfo.name !== '-') ? 'pointer' : 'not-allowed',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    opacity: (userEnterpriseInfo && userEnterpriseInfo.name && userEnterpriseInfo.name !== '-') ? 1 : 0.6
                  }}
                  onMouseOver={(e) => {
                    if (userEnterpriseInfo && userEnterpriseInfo.name && userEnterpriseInfo.name !== '-') {
                      e.target.style.background = 'rgba(245, 158, 11, 0.3)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(245, 158, 11, 0.2)';
                  }}
                  onClick={() => {
                    if (!userEnterpriseInfo || !userEnterpriseInfo.name || userEnterpriseInfo.name === '-') {
                      toast.error('Site üyeliğiniz yok. Lütfen bir enterprise üyeliği satın alın.');
                      return;
                    }
                    setShowCreatePinPage(true);
                  }}
                >
                  New Pin
                </button>
              </div>

              {/* User Info */}
              <div style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.9rem',
                textAlign: 'right'
              }}>
                <div>Hoş geldin, <strong style={{ color: '#dc2626' }}>{user.username}</strong></div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {user.role === 'admin' ? 'Admin' : 'Müşteri'}
                </div>
              </div>
              
              <button
                onClick={onLogout}
                style={{
                  background: 'rgba(220, 38, 38, 0.2)',
                  color: '#ffffff',
                  border: '1px solid rgba(220, 38, 38, 0.5)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(220, 38, 38, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(220, 38, 38, 0.2)';
                }}
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>

        {/* Ana İçerik */}
        <div style={{
          flex: 1,
          padding: '30px',
          position: 'relative',
          zIndex: 2,
          overflowY: 'auto'
        }}>
        {/* Profesyonel Dashboard Kartları */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '25px',
          marginBottom: '40px'
        }}>
          {/* Total Scans Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(220, 38, 38, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }}></div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '5px'
                }}>
                  Total Scans
                </div>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  color: '#dc2626',
                  textShadow: '0 0 20px rgba(220, 38, 38, 0.5)',
                  fontFamily: 'monospace'
                }}>
                  {pins.length}
                </div>
              </div>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'rgba(220, 38, 38, 0.1)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(220, 38, 38, 0.3)'
              }}>
                <div style={{
                  fontSize: '1.2rem',
                  color: '#dc2626',
                  fontWeight: '700'
                }}>SCAN</div>
              </div>
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontStyle: 'italic'
            }}>
              Total scan operations performed
            </div>
          </div>

          {/* Active Scans Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }}></div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '5px'
                }}>
                  Active Scans
                </div>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  color: '#10b981',
                  textShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                  fontFamily: 'monospace'
                }}>
                  {pins.filter(pin => pin.status === 'active').length}
                </div>
              </div>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <div style={{
                  fontSize: '1rem',
                  color: '#10b981',
                  fontWeight: '700'
                }}>ACTIVE</div>
              </div>
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontStyle: 'italic'
            }}>
              Currently running scans
            </div>
          </div>

          {/* Completed Scans Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }}></div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '5px'
                }}>
                  Completed
                </div>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  color: '#f59e0b',
                  textShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
                  fontFamily: 'monospace'
                }}>
                  {pins.filter(pin => pin.status === 'used').length}
                </div>
              </div>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#f59e0b',
                  fontWeight: '700'
                }}>DONE</div>
              </div>
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontStyle: 'italic'
            }}>
              Successfully completed scans
            </div>
          </div>

          {/* Expired Scans Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }}></div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '5px'
                }}>
                  Expired
                </div>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  color: '#ef4444',
                  textShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
                  fontFamily: 'monospace'
                }}>
                  {pins.filter(pin => pin.status === 'expired').length}
                </div>
              </div>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#ef4444',
                  fontWeight: '700'
                }}>TIME</div>
              </div>
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontStyle: 'italic'
            }}>
              Expired scan sessions
            </div>
          </div>
        </div>

        {/* PIN Oluşturma Butonu - KALDIRILDI, artık sidebar'da */}

        {/* PIN Listesi - Profesyonel Tablo */}
        <div style={{
          background: 'rgba(20, 20, 20, 0.9)',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden'
        }}>
          <h2 style={{
            color: '#ffffff',
            fontSize: '1.8rem',
            margin: '0 0 30px 0',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            <div style={{
              width: '4px',
              height: '30px',
              background: 'linear-gradient(to bottom, #dc2626, #b91c1c)',
              borderRadius: '2px'
            }}></div>
            PIN Management Table
          </h2>
          
          {pins.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '1.2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '15px',
              border: '1px dashed rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.5 }}>🔍</div>
              No PINs created yet. Create your first PIN to start scanning.
            </div>
          ) : (
            <div style={{
              background: 'rgba(15, 15, 15, 0.8)',
              borderRadius: '15px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {/* Tablo Header */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(185, 28, 28, 0.1) 100%)',
                padding: '20px 25px',
                borderBottom: '2px solid rgba(220, 38, 38, 0.3)',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr 1fr',
                gap: '20px',
                alignItems: 'center'
              }}>
                <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  PIN Code
                </div>
                <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Status
                </div>
                <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Result
                </div>
                <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Result Link
                </div>
                <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Type
                </div>
                <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Created
                </div>
                <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Actions
                </div>
              </div>

              {/* Tablo Satırları */}
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {pins.map((pin, index) => {
                  // Tarama sonucuna göre result belirleme
                  const getScanResult = (pin) => {
                    if (!pin.scanResults || !pin.scanCompleted) return 'PENDING';
                    
                    try {
                      const parsedResults = parseScanResults(pin.scanResults);
                      if (!parsedResults) return 'CLEAN';
                      
                      const hasSuspicious = parsedResults.suspiciousActivities?.length > 0;
                      const hasUnlicensed = parsedResults.unlicensedApps?.length > 0;
                      
                      if (hasSuspicious || hasUnlicensed) {
                        return 'CHEAT';
                      }
                      return 'CLEAN';
                    } catch (error) {
                      return 'SCANNER';
                    }
                  };

                  const scanResult = getScanResult(pin);
                  const isActive = pin.status === 'active';
                  
                  return (
                    <div
                      key={pin._id}
                      style={{
                        padding: '20px 25px',
                        borderBottom: index < pins.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr 1fr',
                        gap: '20px',
                        alignItems: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                      onClick={() => viewPinDetails(pin)}
                    >
                      {/* PIN Code */}
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isActive ? '#10b981' : '#6b7280',
                          boxShadow: `0 0 8px ${isActive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(107, 114, 128, 0.5)'}`
                        }}></div>
                        {pin.pin}
                      </div>

                      {/* Status */}
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textAlign: 'center',
                        background: isActive 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(107, 114, 128, 0.2)',
                        color: isActive ? '#10b981' : '#6b7280',
                        border: `1px solid ${isActive ? '#10b981' : '#6b7280'}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </div>

                      {/* Result */}
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        ...(scanResult === 'CLEAN' ? {
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          border: '1px solid #10b981'
                        } : scanResult === 'CHEAT' ? {
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          border: '1px solid #ef4444'
                        } : {
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#f59e0b',
                          border: '1px solid #f59e0b'
                        })
                      }}>
                        {scanResult}
                      </div>

                      {/* Result Link */}
                      <div style={{ textAlign: 'center' }}>
                        {pin.scanCompleted ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPin(pin);
                              setShowViewResultsPage(true);
                            }}
                            style={{
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#3b82f6',
                              border: '1px solid rgba(59, 130, 246, 0.5)',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = 'rgba(59, 130, 246, 0.3)';
                              e.target.style.transform = 'scale(1.05)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            View Results
                          </button>
                        ) : (
                          <span style={{
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontSize: '0.8rem',
                            fontStyle: 'italic'
                          }}>
                            No Data
                          </span>
                        )}
                      </div>

                      {/* Type */}
                      <div style={{
                        color: '#f59e0b',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        VOIDSCAN
                      </div>

                      {/* Created */}
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.85rem',
                        textAlign: 'center'
                      }}>
                        {new Date(pin.createdAt).toLocaleDateString('tr-TR')}
                      </div>

                      {/* Actions */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(pin.pin);
                          }}
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontWeight: '600'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = 'rgba(16, 185, 129, 0.3)';
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = 'rgba(16, 185, 129, 0.2)';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          Copy
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePin(pin._id);
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontWeight: '600'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '8px'
          },
        }}
      />

      {/* PIN Detayları Sayfası */}
      {showPinDetailsPage && selectedPin && (
        <PinDetailsPage 
          pin={selectedPin}
          onBack={() => {
            setShowPinDetailsPage(false);
            setSelectedPin(null);
          }}
        />
      )}

      {/* View Results Sayfası */}
      {showViewResultsPage && selectedPin && (
        <ViewResultsPage 
          pin={selectedPin}
          onBack={() => {
            setShowViewResultsPage(false);
            setSelectedPin(null);
          }}
        />
      )}

      {/* Enterprise Settings */}
      {showEnterpriseSettings && (
        <EnterpriseSettings 
          user={user}
          onBack={() => setShowEnterpriseSettings(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;