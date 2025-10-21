import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const LoginPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Giriş
        const response = await axios.post('/api/login', {
          email: formData.email,
          password: formData.password
        });
        
        console.log('Login response:', response.data);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Token kaydedildi:', response.data.token);
        console.log('User kaydedildi:', response.data.user);
        toast.success('Login successful!');
        onLogin(response.data.user);
      } else {
        // Kayıt
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match!');
          setIsLoading(false);
          return;
        }
        
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters!');
          setIsLoading(false);
          return;
        }
        
        const response = await axios.post('/api/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        
        console.log('Register response:', response.data);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Token kaydedildi:', response.data.token);
        console.log('User kaydedildi:', response.data.user);
        toast.success('Account created!');
        onLogin(response.data.user);
      }
    } catch (error) {
      console.error('API Error:', error);
      if (error.code === 'ECONNREFUSED') {
        toast.error('Backend server is not running! Please start the backend.');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid data!');
      } else if (error.response?.status === 401) {
        toast.error('Invalid credentials!');
      } else if (error.response?.status === 403 && error.response.data.message === 'BANNED') {
        // Ban kontrolü - ban sayfasına yönlendir
        const banReason = error.response.data.banReason || 'No reason provided';
        const bannedAt = error.response.data.bannedAt || new Date().toISOString();
        window.location.href = `/ban?reason=${encodeURIComponent(banReason)}&bannedAt=${encodeURIComponent(bannedAt)}`;
        return;
      } else if (error.response?.status === 409) {
        toast.error('This email is already in use!');
      } else {
        toast.error(error.response?.data?.message || 'An error occurred!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'url(/background.jpg) center/cover no-repeat, linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Navigation Buttons */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '15px',
        zIndex: 1000
      }}>
        <a
          href="https://voidac.xyz/pin"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '12px 24px',
            color: 'white',
            textDecoration: 'none',
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.6)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.4)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Download
        </a>
        <a
          href="https://discord.gg/NPDrBmvU"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '12px 24px',
            color: 'white',
            textDecoration: 'none',
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.6)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.4)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Discord
        </a>
      </div>
      
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
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '2px',
              height: `${Math.random() * 100 + 50}px`,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.3))',
              animation: `rain ${Math.random() * 2 + 1}s linear infinite`,
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

      {/* Login Form */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(15px)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '400',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            marginBottom: '10px'
          }}>
            VOID
          </div>
          <div style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.8)',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            letterSpacing: '2px',
            fontWeight: '300'
          }}>
            {isLogin ? 'CUSTOMER LOGIN' : 'CREATE ACCOUNT'}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                marginBottom: '8px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>
                Nickname
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                placeholder="Nickname"
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.9rem',
              marginBottom: '8px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              placeholder="email@example.com"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.9rem',
              marginBottom: '8px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              placeholder="Password"
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                marginBottom: '8px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isLogin}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                placeholder="Confirm Password"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 20px rgba(255, 0, 0, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '20px'
            }}
          >
            {isLoading ? 'LOADING...' : (isLogin ? 'LOGIN' : 'CREATE ACCOUNT')}
          </button>

          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '14px'
          }}>
            {isLogin ? 'Don\'t have an account?' : 'Already have an account?'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                textDecoration: 'underline',
                cursor: 'pointer',
                marginLeft: '5px',
                fontSize: '14px'
              }}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </form>
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};

export default LoginPage;
