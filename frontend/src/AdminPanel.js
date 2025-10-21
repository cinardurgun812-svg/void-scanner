import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const AdminPanel = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [pins, setPins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [selectedPin, setSelectedPin] = useState(null);
  const [showPinDetails, setShowPinDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, pinsResponse] = await Promise.all([
        axios.get('https://api.voidac.xyz/api/admin/users'),
        axios.get('https://api.voidac.xyz/api/admin/pins')
      ]);
      
      setUsers(usersResponse.data);
      setPins(pinsResponse.data);
    } catch (error) {
      console.error('Admin verileri yüklenemedi:', error);
      toast.error('Admin verileri yüklenemedi!');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'completed': return '#3b82f6';
      case 'expired': return '#ef4444';
      default: return '#6b7280';
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

  const handlePinClick = (pin) => {
    setSelectedPin(pin);
    setShowPinDetails(true);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '1.2rem',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          Loading admin data...
        </div>
      </div>
    );
  }

  if (showPinDetails && selectedPin) {
    const parsedResults = parseScanResults(selectedPin.scanResults);
    
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Toaster position="top-right" />
        
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
                onClick={() => setShowPinDetails(false)}
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
                ← Back to Admin Panel
              </button>
              <h1 style={{
                color: '#ffffff',
                fontSize: '1.8rem',
                margin: 0,
                fontWeight: '600',
                textShadow: '0 0 10px rgba(220, 38, 38, 0.3)'
              }}>
                PIN Details: {selectedPin.pin}
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '30px 20px',
          position: 'relative',
          zIndex: 2
        }}>
          {/* PIN Info */}
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
              fontWeight: '600'
            }}>
              PIN Information
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px'
            }}>
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '10px',
                padding: '15px',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                  PIN: {selectedPin.pin}
                </div>
              </div>
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '10px',
                padding: '15px',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                  Status: {selectedPin.status}
                </div>
              </div>
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '10px',
                padding: '15px',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                  Created: {formatDate(selectedPin.createdAt)}
                </div>
              </div>
              {selectedPin.completedAt && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '10px',
                  padding: '15px',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                    Completed: {formatDate(selectedPin.completedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scan Results */}
          {parsedResults && (
            <>
              {/* System Information */}
              {parsedResults.systemInfo?.length > 0 && (
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
                    fontWeight: '600'
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
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                      }}>
                        <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', lineHeight: '1.5' }}>
                          {info}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FiveM Mods */}
              {parsedResults.fivemMods?.length > 0 && (
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
                    fontWeight: '600'
                  }}>
                    FiveM Mods ({parsedResults.fivemMods.length})
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

              {/* Cheat Websites */}
              {parsedResults.cheatWebsites?.length > 0 && (
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
                    fontWeight: '600'
                  }}>
                    Cheat Websites ({parsedResults.cheatWebsites.length})
                  </h2>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {parsedResults.cheatWebsites.map((site, index) => (
                        <li key={index} style={{ marginBottom: '8px' }}>{site}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Discord Account */}
              {parsedResults.discordAccount && (
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
                    fontWeight: '600'
                  }}>
                    Discord Account
                  </h2>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>ID: {parsedResults.discordAccount}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Toaster position="top-right" />
      
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
              ← Back to Dashboard
            </button>
            <h1 style={{
              color: '#ffffff',
              fontSize: '1.8rem',
              margin: 0,
              fontWeight: '600',
              textShadow: '0 0 10px rgba(220, 38, 38, 0.3)'
            }}>
              Admin Panel
            </h1>
          </div>
          
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#ffffff',
            textShadow: '0 0 20px rgba(220, 38, 38, 0.5)'
          }}>
            ADMIN
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '30px 20px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px'
        }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              background: activeTab === 'users' ? 'rgba(220, 38, 38, 0.3)' : 'rgba(20, 20, 20, 0.8)',
              color: '#ffffff',
              border: '1px solid rgba(220, 38, 38, 0.5)',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('pins')}
            style={{
              background: activeTab === 'pins' ? 'rgba(220, 38, 38, 0.3)' : 'rgba(20, 20, 20, 0.8)',
              color: '#ffffff',
              border: '1px solid rgba(220, 38, 38, 0.5)',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            PINs ({pins.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
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
              fontWeight: '600'
            }}>
              Registered Users
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px'
            }}>
              {users.map((user) => (
                <div key={user.id} style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '10px',
                  padding: '20px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(34, 197, 94, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    {user.name}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '4px' }}>
                    Email: {user.email}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '4px' }}>
                    Role: {user.role}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                    Joined: {formatDate(user.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PINs Tab */}
        {activeTab === 'pins' && (
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
              fontWeight: '600'
            }}>
              All PINs
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px'
            }}>
              {pins.map((pin) => (
                <div key={pin._id} style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '10px',
                  padding: '20px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handlePinClick(pin)}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(34, 197, 94, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    PIN: {pin.pin}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '4px' }}>
                    Status: <span style={{ color: getStatusColor(pin.status) }}>{pin.status}</span>
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '4px' }}>
                    Scan Completed: {pin.scanCompleted ? 'Yes' : 'No'}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '4px' }}>
                    Created: {formatDate(pin.createdAt)}
                  </div>
                  {pin.completedAt && (
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                      Completed: {formatDate(pin.completedAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
