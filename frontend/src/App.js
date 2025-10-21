import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import PinEntryPage from './PinEntryPage';
import BanPage from './BanPage';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('login');

  useEffect(() => {
    // Sayfa yüklendiğinde token kontrolü
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('App.js - Token kontrolü:', token ? 'Token var' : 'Token yok');
    console.log('App.js - User data:', userData ? 'User var' : 'User yok');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('App.js - Parsed user:', parsedUser);
        setUser(parsedUser);
        setCurrentPage('dashboard');
        console.log('App.js - Dashboard\'a yönlendiriliyor');
      } catch (error) {
        console.error('App.js - User parse hatası:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    console.log('App.js - handleLogin çağrıldı:', userData);
    setUser(userData);
    setCurrentPage('dashboard');
    console.log('App.js - Dashboard\'a yönlendirildi');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('login');
    toast.success('Çıkış yapıldı!');
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '1.5rem'
      }}>
        Yükleniyor...
      </div>
    );
  }

  // URL'den sayfa kontrolü
  const urlPath = window.location.pathname;
  if (urlPath === '/pin') {
    return <PinEntryPage />;
  }
  if (urlPath === '/ban') {
    // URL'den ban bilgilerini al
    const searchParams = new URLSearchParams(window.location.search);
    const banInfo = {
      reason: searchParams.get('reason') || 'No reason provided',
      bannedAt: searchParams.get('bannedAt') || new Date().toISOString()
    };
    return <BanPage banInfo={banInfo} />;
  }

  return (
    <>
      {currentPage === 'dashboard' && user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
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
    </>
  );
}

export default App;