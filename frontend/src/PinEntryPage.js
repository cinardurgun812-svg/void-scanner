import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const PinEntryPage = () => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pin || pin.length !== 8) {
      toast.error('PIN must be 8 characters!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('https://void-scanner-api.onrender.com/api/verify-pin', {
        pin: pin.toUpperCase()
      });

      if (response.data.valid) {
        setIsVerified(true);
        toast.success('PIN verified! Downloading scanner...');
        
        // Automatically start download
        setTimeout(() => {
          downloadScanner();
        }, 1000);
      } else {
        toast.error('Invalid PIN!');
      }
    } catch (error) {
      console.error('PIN Verification Error:', error);
      if (error.code === 'ECONNREFUSED') {
        toast.error('Backend server is not running!');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid PIN!');
      } else {
        toast.error('PIN verification failed!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadScanner = async () => {
    try {
      setIsDownloading(true);
      console.log('Starting download...');
      
      const response = await fetch(`/api/download-scanner/${pin.toUpperCase()}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VoidScanner_${pin.toUpperCase()}.exe`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Scanner downloaded successfully!');
    } catch (error) {
      console.error('Download Error:', error);
      toast.error('Download failed! Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const resetForm = () => {
    setPin('');
    setIsVerified(false);
    setIsDownloading(false);
  };

  if (isVerified) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Rain Effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: '1px',
                height: `${Math.random() * 40 + 20}px`,
                background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))',
                animation: `rain ${Math.random() * 3 + 2}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div style={{
          background: 'rgba(20, 20, 20, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '50px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          textAlign: 'center',
          maxWidth: '500px',
          width: '90%',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{
            fontSize: '4rem',
            color: '#10b981',
            marginBottom: '20px',
            textShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
          }}>
            ✓
          </div>
          
          <h1 style={{
            color: '#10b981',
            fontSize: '2rem',
            margin: '0 0 20px 0',
            fontWeight: '700',
            textShadow: '0 0 15px rgba(16, 185, 129, 0.5)'
          }}>
            PIN VERIFIED!
          </h1>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            margin: '0 0 30px 0'
          }}>
            Security scanner is downloading automatically. The scanner will automatically scan your system and send the results securely.
          </p>

          {isDownloading ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '30px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '15px',
                marginBottom: '10px'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  border: '3px solid rgba(16, 185, 129, 0.3)',
                  borderTop: '3px solid #10b981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{
                  color: '#10b981',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  Downloading Scanner...
                </span>
              </div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem'
              }}>
                Please wait while the scanner is being downloaded
              </div>
            </div>
          ) : (
            <button
              onClick={downloadScanner}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                marginBottom: '30px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
              }}
            >
              Download Scanner
            </button>
          )}

          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            marginBottom: '20px'
          }}>
            <h3 style={{
              color: '#10b981',
              fontSize: '1.2rem',
              margin: '0 0 15px 0',
              fontWeight: '600'
            }}>
              Security Guarantee
            </h3>
            <ul style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              margin: 0,
              paddingLeft: '20px',
              textAlign: 'left'
            }}>
              <li>Scanner is completely secure</li>
              <li>Your personal data is protected</li>
              <li>Only security scanning is performed</li>
              <li>Results are sent encrypted</li>
            </ul>
          </div>

          <button
            onClick={resetForm}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Enter New PIN
          </button>
        </div>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes rain {
              0% { transform: translateY(-100vh); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateY(100vh); opacity: 0; }
            }
          `}
        </style>

        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px'
            },
          }}
        />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Rain Effect */}
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

      <div style={{
        background: 'rgba(20, 20, 20, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '50px',
        border: '1px solid rgba(220, 38, 38, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%',
        position: 'relative',
        zIndex: 2
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '2.5rem',
          margin: '0 0 10px 0',
          fontWeight: '900',
          textShadow: '0 0 30px rgba(220, 38, 38, 0.7)',
          fontFamily: 'Arial, sans-serif',
          letterSpacing: '3px',
          background: 'linear-gradient(45deg, #ffffff 0%, #dc2626 50%, #ffffff 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          VOID SCANNER
        </h1>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '1.1rem',
          margin: '0 0 40px 0',
          fontWeight: '500'
        }}>
          Advanced Security Scanner
        </p>

        <form onSubmit={handlePinSubmit}>
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '10px',
              textAlign: 'left'
            }}>
              Enter PIN Code
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              placeholder="Enter 8-character PIN"
              maxLength={8}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '1.2rem',
                fontWeight: '700',
                fontFamily: 'monospace',
                letterSpacing: '2px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(220, 38, 38, 0.6)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(220, 38, 38, 0.3)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading 
                ? 'rgba(220, 38, 38, 0.3)' 
                : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
              border: 'none',
              padding: '18px 30px',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3)',
              border: '1px solid rgba(220, 38, 38, 0.3)'
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 35px rgba(220, 38, 38, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.3)';
              }
            }}
          >
            {isLoading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Verifying...
              </div>
            ) : (
              'Verify PIN'
            )}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(220, 38, 38, 0.05)',
          borderRadius: '10px',
          border: '1px solid rgba(220, 38, 38, 0.2)'
        }}>
          <h3 style={{
            color: '#dc2626',
            fontSize: '1rem',
            margin: '0 0 10px 0',
            fontWeight: '600'
          }}>
            Security Notice
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            margin: 0
          }}>
            This scanner will perform a comprehensive security analysis of your system. 
            All data transmission is encrypted and secure.
          </p>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes rain {
            0% { transform: translateY(-100vh); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100vh); opacity: 0; }
          }
        `}
      </style>

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

export default PinEntryPage;