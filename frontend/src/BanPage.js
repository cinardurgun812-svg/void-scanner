import React, { useEffect, useState } from 'react';

const BanPage = ({ banInfo }) => {
  const [banData, setBanData] = useState(banInfo || {
    reason: 'No reason provided',
    bannedAt: new Date().toISOString()
  });

  useEffect(() => {
    // URL'den ban bilgilerini al (eğer URL'den geliyorsa)
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const reason = searchParams.get('reason') || 'No reason provided';
      const bannedAt = searchParams.get('bannedAt') || new Date().toISOString();
      
      setBanData({
        reason,
        bannedAt
      });
    }
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      <div style={{
        background: '#111111',
        border: '1px solid #333333',
        borderRadius: '12px',
        padding: '60px',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Ban Icon */}
        <div style={{
          fontSize: '48px',
          marginBottom: '30px',
          color: '#ffffff'
        }}>
          
        </div>
        
        {/* Main Title */}
        <h1 style={{
          fontSize: '36px',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '20px',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          Account Banned
        </h1>

        {/* Subtitle */}
        <div style={{
          color: '#cccccc',
          fontSize: '16px',
          fontWeight: '500',
          marginBottom: '40px',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          Permanent Suspension
        </div>
        
        {/* Description */}
        <p style={{
          fontSize: '18px',
          marginBottom: '40px',
          color: '#cccccc',
          lineHeight: '1.6',
          fontWeight: '400'
        }}>
          This account has been permanently banned from Void Scanner.
        </p>
        
        {/* Ban Details Box */}
        {banData && (
          <div style={{
            background: '#000000',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '30px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <h3 style={{
              color: '#ffffff',
              fontSize: '16px',
              marginBottom: '20px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Ban Details
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <span style={{
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Reason:
              </span>
              <span style={{
                color: '#cccccc',
                fontSize: '14px',
                marginLeft: '8px',
                fontWeight: '400'
              }}>
                {banData.reason}
              </span>
            </div>
            
            <div>
              <span style={{
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Banned At:
              </span>
              <span style={{
                color: '#cccccc',
                fontSize: '14px',
                marginLeft: '8px',
                fontWeight: '400'
              }}>
                {formatDate(banData.bannedAt)}
              </span>
            </div>
          </div>
        )}
        
        {/* What to do next */}
        <div style={{
          background: '#000000',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '40px'
        }}>
          <h3 style={{
            color: '#ffffff',
            fontSize: '16px',
            marginBottom: '15px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            What to do next?
          </h3>
          <p style={{
            color: '#cccccc',
            fontSize: '14px',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            If you believe this ban was issued in error, please open a ticket on our Discord server.
            Our support team will review your case and respond within 24-48 hours.
          </p>
        </div>
        
        {/* Discord Button */}
        <a 
          href="https://discord.gg/NPDrBmvU"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            background: '#333333',
            color: '#ffffff',
            padding: '15px 30px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            border: '1px solid #555555'
          }}
        >
          Open Discord Ticket
        </a>
      </div>
    </div>
  );
};

export default BanPage;