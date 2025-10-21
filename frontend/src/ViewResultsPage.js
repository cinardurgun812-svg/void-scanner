import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const ViewResultsPage = ({ pin, onBack }) => {
  const [pinData, setPinData] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      console.log('🔍 Screenshot kontrolü:', {
        screenshot: response.data.pin.screenshot,
        screenshotPath: response.data.pin.screenshotPath,
        hasScreenshot: !!response.data.pin.screenshot
      });
      
      if (response.data.pin.screenshot) {
        console.log('✅ Screenshot bulundu, set ediliyor');
        setScreenshot(response.data.pin.screenshot);
      } else if (response.data.pin.screenshotPath) {
        console.log('📁 Screenshot path bulundu, blob olarak indiriliyor');
        try {
          const screenshotResponse = await axios.get(`http://localhost:5005/api/screenshot/${pin.pin}`, {
            responseType: 'blob',
            headers: { Authorization: `Bearer ${token}` }
          });
          const imageUrl = URL.createObjectURL(screenshotResponse.data);
          setScreenshot(imageUrl);
        } catch (screenshotError) {
          console.log('❌ Ekran görüntüsü bulunamadı:', screenshotError);
        }
      } else {
        console.log('❌ Screenshot ve screenshotPath bulunamadı');
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
      services: [],
      cheatWebsites: [],
      systemInfo: [],
      screenshot: null,
      fivemMods: [],
      usbDevices: [],
      discordAccount: null
    };
    
    let currentSection = null;
    
    lines.forEach(line => {
      line = line.trim();
      
      if (line.includes('SUSPICIOUS ACTIVITIES') || line.includes('DETECT')) {
        currentSection = 'suspiciousActivities';
      } else if (line.includes('SYSTEM INFORMATION')) {
        currentSection = 'systemInfo';
      } else if (line.includes('SERVICES')) {
        currentSection = 'services';
      } else if (line.includes('SCREENSHOT')) {
        currentSection = 'screenshot';
      } else if (line.includes('USB DEVICES')) {
        currentSection = 'usbDevices';
      } else if (line.includes('FiveM Mods:')) {
        // FiveM modlarını parse et
        const modsMatch = line.match(/FiveM Mods: Mods: (.+) \(Total: (\d+)\)/);
        if (modsMatch) {
          const modsString = modsMatch[1];
          const totalCount = modsMatch[2];
          const modList = modsString.split(', ').map(mod => mod.trim());
          sections.fivemMods = modList;
        }
      } else if (line.includes('CHEAT WEBSITES')) {
        currentSection = 'cheatWebsites';
      } else if (line.includes('USB Devices:')) {
        // USB cihazlarını parse et
        const usbMatch = line.match(/USB Devices: Devices: (.+) \(Total: (\d+)\)/);
        if (usbMatch) {
          const usbString = usbMatch[1];
          const totalCount = usbMatch[2];
          const usbList = usbString.split(', ').map(device => device.trim());
          sections.usbDevices = usbList;
        } else if (line.includes('USB Devices: Devices: No USB devices detected')) {
          sections.usbDevices = ['No USB devices detected'];
        }
      } else if (line.startsWith('Discord Account:')) {
        const id = line.replace('Discord Account:', '').trim();
        if (id) sections.discordAccount = id;
      } else if (line && currentSection && line.startsWith('-')) {
        const item = line.replace('- ', '').trim();
        // çizgi/ayraç satırlarını filtrele
        if (item && !/^[\-_—]+$/.test(item)) {
          if (currentSection === 'suspiciousActivities') {
            sections.suspiciousActivities.push(item);
          } else if (currentSection === 'services') {
            sections.services.push(item);
          } else if (currentSection === 'cheatWebsites') {
            sections.cheatWebsites.push(item);
          }
        }
      } else if (line && currentSection === 'screenshot' && line.includes('Screenshot captured:')) {
        sections.screenshot = line.replace('Screenshot captured: ', '');
      } else if (line && currentSection === 'systemInfo' && (line.startsWith('OS:') || line.startsWith('User:') || line.startsWith('Desktop:') || line.startsWith('System Time:') || line.startsWith('Boot Time:') || line.startsWith('VPN:') || line.startsWith('Install Date:') || line.startsWith('Country:') || line.startsWith('Game Activity:') || line.startsWith('Recycle Activity:') || line.startsWith('Hardware Stats:') || line.startsWith('FiveM Mods:'))) {
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
    toast.success('Copied to clipboard!');
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
          Loading scan results...
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
              ← Back
            </button>
            <h1 style={{
              color: '#ffffff',
              fontSize: '1.8rem',
              margin: 0,
              fontWeight: '600',
              textShadow: '0 0 10px rgba(220, 38, 38, 0.3)'
            }}>
              Scan Results
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
        
        {/* PIN Bilgileri */}
        <div style={{
          background: 'rgba(20, 20, 20, 0.8)',
          borderRadius: '15px',
          padding: '30px',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          marginBottom: '30px'
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
            PIN Information
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '10px',
              padding: '20px',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <h3 style={{ color: '#22c55e', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Status</h3>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                {pinData?.scanCompleted ? 'Completed' : 'Pending'}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '10px',
              padding: '20px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <h3 style={{ color: '#3b82f6', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Created</h3>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                {formatDate(pinData?.createdAt)}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(168, 85, 247, 0.1)',
              borderRadius: '10px',
              padding: '20px',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}>
              <h3 style={{ color: '#a855f7', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Scan Time</h3>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                {pinData?.completedAt ? formatDate(pinData.completedAt) : 'Not completed yet'}
              </div>
            </div>
          </div>
        </div>

        {/* Sistem Bilgileri */}
        {parsedResults?.systemInfo?.length > 0 && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            marginBottom: '30px'
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
              System Information
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px'
            }}>
              {parsedResults.systemInfo.map((info, index) => (
                <div key={index} style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '10px',
                  padding: '15px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => copyToClipboard(info)}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(34, 197, 94, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', lineHeight: '1.5' }}>
                    {info}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {parsedResults?.services?.length > 0 && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            marginBottom: '30px'
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
              Services ({parsedResults.services.length})
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px'
            }}>
              {parsedResults.services.map((svc, index) => {
                const lower = (svc || '').toLowerCase();
                const isOn = lower.endsWith(': on') || lower.includes(' on');
                return (
                  <div
                    key={index}
                    style={{
                      background: isOn ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      border: isOn ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>{svc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detections */}
        {parsedResults?.suspiciousActivities?.length > 0 && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            marginBottom: '30px'
          }}>
            <h2 style={{
              color: '#ef4444',
              fontSize: '1.5rem',
              margin: '0 0 20px 0',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              Detections ({parsedResults.suspiciousActivities.length})
            </h2>
            
            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {parsedResults.suspiciousActivities.map((activity, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>{activity}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Cheat Websites */}
        {(() => true)() && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            marginBottom: '30px'
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
              Cheat Websites ({parsedResults?.cheatWebsites?.length || 0})
            </h2>
            {parsedResults?.cheatWebsites?.length > 0 ? (
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {parsedResults.cheatWebsites.map((site, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>{site}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                No cheat websites detected
              </div>
            )}
          </div>
        )}

        {/* PC Screenshot */}
        {screenshot && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            marginBottom: '30px'
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
              PC Screenshot
            </h2>
            
            <div style={{
              borderRadius: '10px',
              overflow: 'hidden',
              border: '2px solid rgba(220, 38, 38, 0.3)',
              background: 'rgba(0, 0, 0, 0.5)',
              position: 'relative'
            }}>
              <img 
                src={screenshot} 
                alt="PC Screenshot" 
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  maxHeight: '600px',
                  objectFit: 'contain'
                }}
              />
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#ffffff',
                padding: '5px 10px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Scan Moment Screenshot
              </div>
            </div>
            
            <div style={{
              marginTop: '15px',
              padding: '15px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <div style={{
                color: '#22c55e',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Screenshot captured successfully
              </div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px',
                marginTop: '5px'
              }}>
                This image was automatically captured during the scan and is only displayed here.
              </div>
            </div>
          </div>
        )}

        {/* FiveM Mods */}
        {parsedResults?.fivemMods?.length > 0 && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            marginBottom: '30px'
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
              📄 FiveM Mods ({parsedResults.fivemMods.length})
            </h2>
            
            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {parsedResults.fivemMods.map((mod, index) => (
                  <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📄 {mod}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Discord Account */}
        {parsedResults?.discordAccount && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            marginBottom: '30px'
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
              💬 Discord Account
            </h2>
            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>ID: {parsedResults.discordAccount}</span>
              </div>
            </div>
          </div>
        )}

        {/* USB Devices */}
        {parsedResults?.usbDevices?.length > 0 && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            marginBottom: '30px'
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
              🔌 USB Devices ({parsedResults.usbDevices.length})
            </h2>
            
            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {parsedResults.usbDevices.map((device, index) => (
                  <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🔌 {device}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Ekran Görüntüsü - KALDIRILDI, artık PC Screenshot bölümü var */}

        {/* Ham Sonuçlar */}
        {scanResults && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '30px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            marginBottom: '30px'
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
              Raw Results
            </h2>
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '10px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.8)',
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {scanResults}
            </div>
          </div>
        )}

        {/* Sonuç Yok */}
        {!scanResults && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '15px',
            padding: '60px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px'
            }}>
              📊
            </div>
            <h2 style={{
              color: '#ffffff',
              fontSize: '1.5rem',
              margin: '0 0 10px 0',
              fontWeight: '600'
            }}>
              Tarama Sonuçları Bulunamadı
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px',
              margin: 0
            }}>
              Bu PIN için henüz tarama yapılmamış veya sonuçlar yüklenmemiş.
            </p>
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

export default ViewResultsPage;
