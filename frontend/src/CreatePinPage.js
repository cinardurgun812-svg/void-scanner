import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const CreatePinPage = ({ onBack, onPinCreated }) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePin = async () => {
    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');
      // Kullanıcı bilgisini localStorage'dan al (login sonrası genelde saklanır)
      let currentUser = null;
      try {
        const rawUser = localStorage.getItem('user');
        if (rawUser) currentUser = JSON.parse(rawUser);
      } catch (_) {}
      const userEmail = (currentUser && (currentUser.email || currentUser.username)) || null;
      const creatorName = currentUser && (currentUser.name || currentUser.username || (currentUser.email ? currentUser.email.split('@')[0] : null));
      const response = await axios.post('http://localhost:5005/api/create-pin', {
        targetInfo: {
          name: 'VOIDSCAN Target',
          description: 'Automated scan target',
          ip: '192.168.1.100',
          location: 'Istanbul, Turkey'
        },
        // Oluşturan kullanıcı bilgileri
        userEmail: userEmail,
        creatorName: creatorName,
        // Yedek alanlar (backend farklı isimler de kabul ediyor)
        email: userEmail,
        name: creatorName,
        username: currentUser ? currentUser.username : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('PIN başarıyla oluşturuldu!');
      onPinCreated();
      onBack();
    } catch (error) {
      console.error('PIN oluşturulamadı:', error);
      toast.error('PIN oluşturulamadı!');
    } finally {
      setIsCreating(false);
    }
  };

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
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '1px',
              height: `${Math.random() * 40 + 20}px`,
              background: 'linear-gradient(to bottom, rgba(220, 38, 38, 0.2), rgba(220, 38, 38, 0.05))',
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
          maxWidth: '1200px',
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
              Create PIN
            </h1>
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          background: 'rgba(20, 20, 20, 0.8)',
          borderRadius: '20px',
          padding: '40px',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            <h2 style={{
              color: '#ffffff',
              fontSize: '2rem',
              margin: '0 0 10px 0',
              fontWeight: '600'
            }}>
              Create PIN
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1.1rem',
              margin: 0
            }}>
              Automatic PIN creation
            </p>
          </div>

          <div style={{
            textAlign: 'center'
          }}>
            <button
              onClick={handleCreatePin}
              disabled={isCreating}
              style={{
                background: isCreating 
                  ? 'rgba(220, 38, 38, 0.3)' 
                  : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: 'white',
                border: 'none',
                padding: '20px 50px',
                borderRadius: '12px',
                fontSize: '1.2rem',
                fontWeight: '700',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                minWidth: '250px'
              }}
              onMouseOver={(e) => {
                if (!isCreating) {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(220, 38, 38, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isCreating) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.3)';
                }
              }}
            >
              {isCreating ? (
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
                  Oluşturuluyor...
                </div>
              ) : (
                'CREATE PIN'
              )}
            </button>
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
};

export default CreatePinPage;
