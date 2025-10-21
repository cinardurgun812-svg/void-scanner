import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const PinDetailsPage = ({ pin, onBack }) => {
  const [pinData, setPinData] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPinDetails();
  }, [pin]);

  const fetchPinDetails = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5005/api/pin-details/${pin.pin}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPinData(response.data.pin);
      
      if (response.data.pin.scanResults) {
        setScanResults(response.data.pin.scanResults);
      }
      
      // Ekran görüntüsünü getir
      if (response.data.pin.screenshotPath) {
        try {
          const screenshotResponse = await axios.get(`http://localhost:5005/api/screenshot/${pin.pin}`, {
            responseType: 'blob',
            headers: { Authorization: `Bearer ${token}` }
          });
          const imageUrl = URL.createObjectURL(screenshotResponse.data);
          setScreenshot(imageUrl);
        } catch (screenshotError) {
          console.log('Ekran görüntüsü bulunamadı');
        }
      }
      
    } catch (error) {
      console.error('PIN detayları yüklenemedi:', error);
      toast.error('PIN detayları yüklenemedi!');
    } finally {
      setIsLoading(false);
    }
  };

  const parseScanResults = (results) => {
    if (!results) return null;
    
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
      screenshot: null,
      systemInfo: [],
      networkActivity: [],
      registryChanges: [],
      startupPrograms: [],
      browserHistory: [],
      installedSoftware: []
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
      } else if (line.includes('SİSTEM BİLGİLERİ')) {
        currentSection = 'systemInfo';
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
      } else if (line && currentSection === 'systemInfo' && (line.startsWith('🖥️') || line.startsWith('👤') || line.startsWith('📁') || line.startsWith('⏰') || line.startsWith('📅') || line.startsWith('🔒') || line.startsWith('📦') || line.startsWith('🌍') || line.startsWith('🎮') || line.startsWith('🗑️') || line.startsWith('💾'))) {
        sections.systemInfo.push(line);
      }
    });
    
    return sections;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Panoya kopyalandı!');
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
          Tarama sonuçları yükleniyor...
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

  const parsedResults = scanResults ? parseScanResults(scanResults) : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
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
        padding: '20px',
        borderBottom: '1px solid rgba(220, 38, 38, 0.3)',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(220, 38, 38, 0.2)',
                color: '#ffffff',
                border: '1px solid rgba(220, 38, 38, 0.5)',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(220, 38, 38, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(220, 38, 38, 0.2)';
              }}
            >
              ← Geri
            </button>
            <h1 style={{
              color: '#ffffff',
              fontSize: '1.8rem',
              margin: 0,
              fontWeight: '600',
              textShadow: '0 0 10px rgba(220, 38, 38, 0.3)'
            }}>
              PIN Detayları
            </h1>
          </div>
          
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#ffffff',
            fontFamily: 'monospace',
            letterSpacing: '4px',
            textShadow: '0 0 15px rgba(220, 38, 38, 0.5)',
            background: 'rgba(220, 38, 38, 0.1)',
            padding: '12px 20px',
            borderRadius: '10px',
            border: '1px solid rgba(220, 38, 38, 0.3)'
          }}>
            {pinData?.pin || pin.pin}
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '30px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          background: 'rgba(20, 20, 20, 0.8)',
          padding: '10px',
          borderRadius: '12px',
          border: '1px solid rgba(220, 38, 38, 0.2)'
        }}>
          {[
            { id: 'overview', label: 'Genel Bakış', icon: '📊' },
            { id: 'security', label: 'Güvenlik Analizi', icon: '🔒' },
            { id: 'system', label: 'Sistem Bilgileri', icon: '💻' },
            { id: 'network', label: 'Ağ Aktivitesi', icon: '🌐' },
            { id: 'files', label: 'Dosya Analizi', icon: '📁' },
            { id: 'screenshot', label: 'Ekran Görüntüsü', icon: '📸' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'rgba(220, 38, 38, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '8px',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab İçerikleri */}
        {activeTab === 'overview' && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{
              color: '#ffffff',
              fontSize: '1.5rem',
              margin: '0 0 20px 0',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📊 Genel Bakış
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{ color: '#ffffff', margin: '0 0 15px 0', fontSize: '1.2rem' }}>PIN Bilgileri</h3>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', lineHeight: '1.6' }}>
                  <div><strong>Durum:</strong> {pinData?.scanCompleted ? 'Tamamlandı' : 'Beklemede'}</div>
                  <div><strong>Oluşturulma:</strong> {formatDate(pinData?.createdAt)}</div>
                  <div><strong>Son Kullanma:</strong> {formatDate(pinData?.expiresAt)}</div>
                  <div><strong>Hedef:</strong> {pinData?.targetInfo?.name || 'Belirtilmemiş'}</div>
                </div>
              </div>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{ color: '#ffffff', margin: '0 0 15px 0', fontSize: '1.2rem' }}>Tarama Özeti</h3>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', lineHeight: '1.6' }}>
                  {parsedResults ? (
                    <>
                      <div>🔍 Şüpheli Aktivite: {parsedResults.suspiciousActivities.length}</div>
                      <div>🗑️ Silinen Dosya: {parsedResults.deletedFiles.length}</div>
                      <div>🚀 Çalıştırılan Uygulama: {parsedResults.recentApps.length}</div>
                      <div>❌ Lisanssız Uygulama: {parsedResults.unlicensedApps.length}</div>
                    </>
                  ) : (
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Tarama sonuçları bulunamadı</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && parsedResults && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{
              color: '#ffffff',
              fontSize: '1.5rem',
              margin: '0 0 20px 0',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🔒 Güvenlik Analizi
            </h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Şüpheli Aktiviteler */}
              <div style={{
                background: 'rgba(220, 38, 38, 0.1)',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid rgba(220, 38, 38, 0.3)'
              }}>
                <h3 style={{
                  color: '#ef4444',
                  fontSize: '1.2rem',
                  margin: '0 0 15px 0',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ Şüpheli Aktiviteler ({parsedResults.suspiciousActivities.length})
                </h3>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                  {parsedResults.suspiciousActivities.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {parsedResults.suspiciousActivities.map((activity, index) => (
                        <li key={index} style={{ marginBottom: '8px' }}>{activity}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>✅ Şüpheli aktivite bulunamadı</div>
                  )}
                </div>
              </div>

              {/* Lisanssız Uygulamalar */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <h3 style={{
                  color: '#ef4444',
                  fontSize: '1.2rem',
                  margin: '0 0 15px 0',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ❌ Lisanssız Uygulamalar ({parsedResults.unlicensedApps.length})
                </h3>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                  {parsedResults.unlicensedApps.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {parsedResults.unlicensedApps.map((app, index) => (
                        <li key={index} style={{ marginBottom: '8px' }}>{app}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>✅ Lisanssız uygulama bulunamadı</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{
              color: '#ffffff',
              fontSize: '1.5rem',
              margin: '0 0 20px 0',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              💻 Sistem Bilgileri
            </h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Sistem Bilgileri */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <h3 style={{
                  color: '#22c55e',
                  fontSize: '1.2rem',
                  margin: '0 0 15px 0',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🖥️ Sistem Bilgileri ({parsedResults?.systemInfo?.length || 0})
                </h3>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                  {parsedResults?.systemInfo?.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {parsedResults.systemInfo.map((info, index) => (
                        <li key={index} style={{ marginBottom: '8px' }}>{info}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>• SİSTEM BİLGİLERİ:</div>
                  )}
                </div>
              </div>

              {/* Son Çalıştırılan Uygulamalar */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <h3 style={{
                  color: '#3b82f6',
                  fontSize: '1.2rem',
                  margin: '0 0 15px 0',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🚀 Son Çalıştırılan Uygulamalar ({parsedResults?.recentApps?.length || 0})
                </h3>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                  {parsedResults?.recentApps?.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {parsedResults.recentApps.map((app, index) => (
                        <li key={index} style={{ marginBottom: '8px' }}>{app}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>✅ Son çalıştırılan uygulama bulunamadı</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && parsedResults && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{
              color: '#ffffff',
              fontSize: '1.5rem',
              margin: '0 0 20px 0',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📁 Dosya Analizi
            </h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Son Silinen Dosyalar */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '10px',
                padding: '20px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <h3 style={{
                  color: '#f59e0b',
                  fontSize: '1.2rem',
                  margin: '0 0 15px 0',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🗑️ Son Silinen Dosyalar ({parsedResults.deletedFiles.length})
                </h3>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                  {parsedResults.deletedFiles.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {parsedResults.deletedFiles.map((file, index) => (
                        <li key={index} style={{ marginBottom: '8px' }}>{file}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>✅ Son silinen dosya bulunamadı</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'screenshot' && screenshot && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{
              color: '#ffffff',
              fontSize: '1.5rem',
              margin: '0 0 20px 0',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📸 Ekran Görüntüsü
            </h2>
            
            <div style={{
              borderRadius: '10px',
              overflow: 'hidden',
              border: '2px solid rgba(220, 38, 38, 0.3)',
              background: 'rgba(0, 0, 0, 0.5)'
            }}>
              <img 
                src={screenshot} 
                alt="Ekran Görüntüsü" 
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
              />
            </div>
          </div>
        )}
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
    </div>
  );
};

export default PinDetailsPage;
