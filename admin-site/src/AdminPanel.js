import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserResults, setShowUserResults] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminEmail, setAdminEmail] = useState('');
  const [showEnterpriseForm, setShowEnterpriseForm] = useState(false);
  const [enterpriseName, setEnterpriseName] = useState('');
  const [enterpriseOwner, setEnterpriseOwner] = useState('');
  const [enterpriseSeats, setEnterpriseSeats] = useState(10);
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [showEnterpriseDetails, setShowEnterpriseDetails] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, enterprisesRes, pinsRes] = await Promise.all([
        axios.get('http://localhost:5005/api/users'),
        axios.get('http://localhost:5005/api/enterprises'),
        axios.get('http://localhost:5005/api/pins')
      ]);
      
      setUsers(usersRes.data);
      setEnterprises(enterprisesRes.data);
      setPins(pinsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('🔍 Fetching users...');
      const response = await axios.get('http://localhost:5005/api/users');
      setUsers(response.data);
      console.log('🔍 Users updated:', response.data.length, 'admins:', response.data.filter(u => u.role === 'admin').length);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setShowUserResults(true);
    
    try {
      const response = await axios.get(`http://localhost:5005/api/user-results/${user.email}`);
      
      // Debug: Frontend'de gelen veriyi kontrol et
      console.log('🔍 Frontend User Results Debug:', {
        responseData: response.data,
        firstResult: response.data[0] ? {
          hasScreenshot: !!response.data[0].screenshot,
          screenshotLength: response.data[0].screenshot ? response.data[0].screenshot.length : 0,
          screenshotPreview: response.data[0].screenshot ? response.data[0].screenshot.substring(0, 50) + '...' : null,
          resultKeys: Object.keys(response.data[0])
        } : null
      });
      
      setUserResults(response.data);
    } catch (error) {
      console.error('Error fetching user results:', error);
      toast.error('Failed to load user results');
      setUserResults([]);
    }
  };

  const changeUserPassword = async () => {
    if (!selectedUser || !newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    setIsChangingPassword(true);
    try {
      await axios.post('http://localhost:5005/api/admin/change-user-password', {
        email: selectedUser.email,
        newPassword: newPassword.trim()
      });
      
      toast.success('Password changed successfully');
      setNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const banUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error('Please enter a ban reason');
      return;
    }

    try {
      await axios.post('http://localhost:5005/api/admin/ban-user', {
        email: selectedUser.email,
        reason: banReason.trim()
      });
      
      toast.success('User banned successfully');
      setShowBanModal(false);
      setBanReason('');
      fetchData();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const unbanUser = async (userEmail) => {
    try {
      await axios.post('http://localhost:5005/api/admin/unban-user', {
        email: userEmail
      });
      
      toast.success('User unbanned successfully');
      fetchData();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    }
  };

  const grantAdminAccess = async () => {
    if (!adminEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      console.log('🔍 Granting admin access to:', adminEmail);
      const response = await axios.post('http://localhost:5005/api/admin/grant-admin-access', { 
        email: adminEmail.trim() 
      });
      
      console.log('🔍 Grant response:', response.data);
      
      if (response.data.success) {
        toast.success(`Admin access granted to ${adminEmail}`);
        setAdminEmail('');
        // Hem fetchData hem de fetchUsers çağır
        console.log('🔍 Refreshing data after grant...');
        await fetchData();
        await fetchUsers();
        console.log('🔍 Data refreshed after grant');
      } else {
        toast.error(response.data.message || 'Failed to grant admin access');
      }
    } catch (error) {
      console.error('Error granting admin access:', error);
      toast.error('Failed to grant admin access');
    }
  };

  const revokeAdminAccess = async (email) => {
    try {
      console.log('🔍 Revoking admin access from:', email);
      const response = await axios.post('http://localhost:5005/api/admin/revoke-admin-access', { 
        email: email 
      });
      
      console.log('🔍 Revoke response:', response.data);
      
      if (response.data.success) {
        toast.success(`Admin access revoked from ${email}`);
        // Hem fetchData hem de fetchUsers çağır
        console.log('🔍 Refreshing data after revoke...');
        await fetchData();
        await fetchUsers();
        console.log('🔍 Data refreshed after revoke');
      } else {
        toast.error(response.data.message || 'Failed to revoke admin access');
      }
    } catch (error) {
      console.error('Error revoking admin access:', error);
      toast.error('Failed to revoke admin access');
    }
  };

  const createEnterprise = async () => {
    if (!enterpriseName.trim() || !enterpriseOwner.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await axios.post('http://localhost:5005/api/enterprises', {
        name: enterpriseName.trim(),
        ownerEmail: enterpriseOwner.trim(),
        seats: enterpriseSeats
      });
      
      toast.success('Enterprise created successfully');
      setEnterpriseName('');
      setEnterpriseOwner('');
      setEnterpriseSeats(10);
      setShowEnterpriseForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating enterprise:', error);
      toast.error('Failed to create enterprise');
    }
  };

  const deleteEnterprise = async (enterpriseId) => {
    if (!enterpriseId) {
      toast.error('Enterprise ID is required');
      return;
    }

    try {
      await axios.delete(`http://localhost:5005/api/enterprises/${enterpriseId}`);
      
      toast.success('Enterprise deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting enterprise:', error);
      toast.error('Failed to delete enterprise');
    }
  };

  const handleEnterpriseClick = (enterprise) => {
    setSelectedEnterprise(enterprise);
    setShowEnterpriseDetails(true);
  };

  const addMemberToEnterprise = async () => {
    if (!selectedEnterprise || !newMemberEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await axios.post(`http://localhost:5005/api/enterprises/${selectedEnterprise.id}/members`, {
        email: newMemberEmail.trim()
      });
      
      toast.success(`Member added to ${selectedEnterprise.name}`);
      setNewMemberEmail('');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const removeMemberFromEnterprise = async (memberEmail) => {
    if (!selectedEnterprise) return;

    try {
      await axios.delete(`http://localhost:5005/api/enterprises/${selectedEnterprise.id}/members`, {
        data: { email: memberEmail }
      });
      
      toast.success(`Member removed from ${selectedEnterprise.name}`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          Loading admin data...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Toaster position="top-right" />
      
      
      {/* Sidebar */}
      <div style={{
        width: '280px',
        background: '#111111',
        borderRight: '1px solid #333333',
        padding: '0',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '30px 25px',
          borderBottom: '1px solid #333333',
          background: '#111111'
        }}>
          <h1 style={{
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            letterSpacing: '0.5px'
          }}>
            VOID ADMIN
          </h1>
          
          <div style={{
            color: '#cccccc',
            fontSize: '12px',
            fontWeight: '400',
            letterSpacing: '1px',
            opacity: 0.8
          }}>
            CONTROL PANEL
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '25px 20px 0 20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: activeTab === 'dashboard' ? '#333333' : 'transparent',
                border: '1px solid #333333',
                borderRadius: '6px',
                color: activeTab === 'dashboard' ? '#ffffff' : '#cccccc',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              Dashboard
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: activeTab === 'users' ? '#333333' : 'transparent',
                border: '1px solid #333333',
                borderRadius: '6px',
                color: activeTab === 'users' ? '#ffffff' : '#cccccc',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              Users ({users.length})
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('enterprises')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: activeTab === 'enterprises' 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)' 
                  : 'transparent',
                border: activeTab === 'enterprises' 
                  ? '2px solid #ffffff' 
                  : '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                color: activeTab === 'enterprises' ? '#ffffff' : '#cccccc',
                fontSize: '15px',
                fontWeight: activeTab === 'enterprises' ? '700' : '600',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: activeTab === 'enterprises' 
                  ? '0 8px 32px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : '0 4px 16px rgba(0, 0, 0, 0.2)',
                textShadow: activeTab === 'enterprises' ? '0 0 20px rgba(255, 255, 255, 0.6)' : 'none'
              }}
            >
              Enterprises ({enterprises.length})
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('pins')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: activeTab === 'pins' 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)' 
                  : 'transparent',
                border: activeTab === 'pins' 
                  ? '2px solid #ffffff' 
                  : '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                color: activeTab === 'pins' ? '#ffffff' : '#cccccc',
                fontSize: '15px',
                fontWeight: activeTab === 'pins' ? '700' : '600',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: activeTab === 'pins' 
                  ? '0 8px 32px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : '0 4px 16px rgba(0, 0, 0, 0.2)',
                textShadow: activeTab === 'pins' ? '0 0 20px rgba(255, 255, 255, 0.6)' : 'none'
              }}
            >
              Pins ({pins.length})
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('banlist')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: activeTab === 'banlist' 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)' 
                  : 'transparent',
                border: activeTab === 'banlist' 
                  ? '2px solid #ffffff' 
                  : '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                color: activeTab === 'banlist' ? '#ffffff' : '#cccccc',
                fontSize: '15px',
                fontWeight: activeTab === 'banlist' ? '700' : '600',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: activeTab === 'banlist' 
                  ? '0 8px 32px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : '0 4px 16px rgba(0, 0, 0, 0.2)',
                textShadow: activeTab === 'banlist' ? '0 0 20px rgba(255, 255, 255, 0.6)' : 'none'
              }}
            >
              Ban List ({users.filter(u => u.isBanned).length})
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: activeTab === 'settings' 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)' 
                  : 'transparent',
                border: activeTab === 'settings' 
                  ? '2px solid #ffffff' 
                  : '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                color: activeTab === 'settings' ? '#ffffff' : '#cccccc',
                fontSize: '15px',
                fontWeight: activeTab === 'settings' ? '700' : '600',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: activeTab === 'settings' 
                  ? '0 8px 32px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : '0 4px 16px rgba(0, 0, 0, 0.2)',
                textShadow: activeTab === 'settings' ? '0 0 20px rgba(255, 255, 255, 0.6)' : 'none'
              }}
            >
              Settings
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('management')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: activeTab === 'management' 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)' 
                  : 'transparent',
                border: activeTab === 'management' 
                  ? '2px solid #ffffff' 
                  : '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                color: activeTab === 'management' ? '#ffffff' : '#cccccc',
                fontSize: '15px',
                fontWeight: activeTab === 'management' ? '700' : '600',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: activeTab === 'management' 
                  ? '0 8px 32px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : '0 4px 16px rgba(0, 0, 0, 0.2)',
                textShadow: activeTab === 'management' ? '0 0 20px rgba(255, 255, 255, 0.6)' : 'none'
              }}
            >
              Management
            </button>
          </div>
        </nav>

        {/* Refresh Button */}
        <div style={{
          position: 'absolute',
          bottom: '25px',
          left: '20px',
          right: '20px'
        }}>
          <button
            onClick={fetchData}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#333333',
              border: '1px solid #555555',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
                >
                  REFRESH DATA
                </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '40px',
        overflow: 'auto',
        position: 'relative',
        zIndex: 5,
        background: '#000000'
      }}>
        {showUserResults ? (
          <div>
            <button
              onClick={() => {
                setShowUserResults(false);
                setSelectedUser(null);
                setUserResults([]);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                border: '1px solid #ffffff',
                borderRadius: '5px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: '20px',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              ← Back to Admin Panel
            </button>

            <h2 style={{
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '20px',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              User Results: {selectedUser?.username}
            </h2>

            {/* User Information */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '10px',
              padding: '25px',
              border: '2px solid #ffffff',
              boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
              marginBottom: '30px'
            }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '15px',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                User Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <strong style={{ color: '#ffffff' }}>Name:</strong>
                  <span style={{ color: '#fff', marginLeft: '8px' }}>{selectedUser?.username}</span>
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>Email:</strong>
                  <span style={{ color: '#fff', marginLeft: '8px' }}>{selectedUser?.email}</span>
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>Role:</strong>
                  <span style={{ color: '#fff', marginLeft: '8px' }}>{selectedUser?.role}</span>
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>Completed Scans:</strong>
                  <span style={{ color: '#fff', marginLeft: '8px' }}>{userResults.length}</span>
                </div>
                {selectedUser?.isBanned && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                    <strong style={{ color: '#ffffff' }}>Status:</strong>
                    <span style={{ color: '#ffffff', marginLeft: '8px' }}>BANNED</span>
                    {selectedUser?.banReason && (
                      <div style={{ marginTop: '5px' }}>
                        <strong style={{ color: '#ffffff' }}>Ban Reason:</strong>
                        <span style={{ color: '#ffffff', marginLeft: '8px' }}>{selectedUser.banReason}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid #ffffff',
                    borderRadius: '5px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    width: '200px',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                />
                <button
                  onClick={changeUserPassword}
                  disabled={isChangingPassword}
                  style={{
                    background: isChangingPassword ? 'rgba(100, 100, 100, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                    color: '#fff',
                    border: '1px solid #ffffff',
                    borderRadius: '5px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: isChangingPassword ? 0.6 : 1,
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                  onMouseOver={(e) => {
                    if (!isChangingPassword) {
                      e.target.style.background = 'rgba(255, 255, 255, 1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isChangingPassword) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                    }
                  }}
                >
                  {isChangingPassword ? 'Changing...' : 'Reset Password'}
                </button>
                {!selectedUser?.isBanned && (
                  <button
                    onClick={() => setShowBanModal(true)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#fff',
                      border: '1px solid #ffffff',
                      borderRadius: '5px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                    }}
                  >
                    Ban User
                  </button>
                )}
              </div>
            </div>

            {/* Completed Scan Results */}
            <h3 style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '20px',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Completed Scan Results ({userResults.length})
            </h3>

            {userResults.length === 0 ? (
              <div style={{
                background: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '10px',
                padding: '40px',
                border: '2px solid #ffffff',
                textAlign: 'center',
                color: '#999',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                No scan results found for this user.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {userResults.map((result, index) => (
                  <div key={index} style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '10px',
                    padding: '20px',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#ffffff' }}>PIN:</strong>
                      <span style={{ color: '#fff', marginLeft: '8px' }}>{result.pin}</span>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#ffffff' }}>Completed:</strong>
                      <span style={{ color: '#fff', marginLeft: '8px' }}>
                        {new Date(result.completedAt).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#ffffff' }}>System Info:</strong>
                      <span style={{ color: '#fff', marginLeft: '8px' }}>
                        {result.systemInfo ? Object.keys(result.systemInfo).length : 0} items
                      </span>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#ffffff' }}>FiveM Mods:</strong>
                      <span style={{ color: '#fff', marginLeft: '8px' }}>
                        {result.fivemMods ? result.fivemMods.length : 0} mods
                      </span>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#ffffff' }}>Cheat Websites:</strong>
                      <span style={{ color: '#fff', marginLeft: '8px' }}>
                        {result.cheatWebsites ? result.cheatWebsites.length : 0} sites
                      </span>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#ffffff' }}>Discord ID:</strong>
                      <span style={{ color: '#fff', marginLeft: '8px' }}>
                        {result.discordId || 'Not found'}
                      </span>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <strong style={{ color: '#ffffff' }}>Screenshot:</strong>
                      <span style={{ color: '#fff', marginLeft: '8px' }}>
                        {result.screenshot ? 'Available' : 'Not available'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        // Scan results'ı parse et
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
                            systemInfo: {},
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
                                sections.fivemMods = modsString.split(', ').map(mod => mod.trim());
                              }
                            } else if (line.includes('Discord Account:')) {
                              // Discord ID'yi parse et
                              const discordMatch = line.match(/Discord Account: (.+)/);
                              if (discordMatch) {
                                sections.discordAccount = discordMatch[1];
                              }
                            } else if (line.includes('USB Devices:')) {
                              // USB cihazlarını parse et
                              const usbMatch = line.match(/USB Devices: Devices: (.+) \(Total: (\d+)\)/);
                              if (usbMatch) {
                                const devicesString = usbMatch[1];
                                sections.usbDevices = devicesString.split(', ').map(device => device.trim());
                              }
                            } else if (line.includes('Screenshot captured:')) {
                              // Screenshot bilgisini parse et
                              const screenshotMatch = line.match(/Screenshot captured: (.+)/);
                              if (screenshotMatch) {
                                sections.screenshot = screenshotMatch[1];
                              }
                            } else if (line.startsWith('- ') && currentSection === 'suspiciousActivities') {
                              sections.suspiciousActivities.push(line.substring(2));
                            } else if (line.startsWith('- ') && currentSection === 'services') {
                              // Servis durumunu parse et
                              const serviceMatch = line.match(/- (.+): (.+)/);
                              if (serviceMatch) {
                                sections.services.push({
                                  name: serviceMatch[1],
                                  status: serviceMatch[2]
                                });
                              }
                            } else if (line.startsWith('- ') && currentSection === 'cheatWebsites') {
                              sections.cheatWebsites.push(line.substring(2));
                            } else if (line.includes(':') && currentSection === 'systemInfo') {
                              // Sistem bilgilerini parse et
                              const [key, ...valueParts] = line.split(':');
                              if (key && valueParts.length > 0) {
                                sections.systemInfo[key.trim()] = valueParts.join(':').trim();
                              }
                            }
                          });
                          
                          return sections;
                        };

                        // Ana dashboard'daki ViewResultsPage ile aynı detaylı görünümü aç
                        const parsedResults = parseScanResults(result.scanResults);
                        
                        // Debug: Screenshot verilerini kontrol et
                        console.log('🔍 Screenshot Debug:', {
                          hasScreenshot: !!result.screenshot,
                          screenshotLength: result.screenshot ? result.screenshot.length : 0,
                          parsedScreenshot: parsedResults ? parsedResults.screenshot : null,
                          resultKeys: Object.keys(result)
                        });
                        
                        // Screenshot verisini ayrıca fetch et
                        let screenshotData = null;
                        if (result.screenshot) {
                          screenshotData = result.screenshot;
                        } else {
                          // Eğer result'ta screenshot yoksa, userResults'tan al
                          const fullResult = userResults.find(r => r.pin === result.pin);
                          if (fullResult && fullResult.screenshot) {
                            screenshotData = fullResult.screenshot;
                          }
                        }
                        
                        // Screenshot verisini temizle - eğer zaten data: prefix'i varsa kaldır
                        if (screenshotData && screenshotData.startsWith('data:image/png;base64,')) {
                          screenshotData = screenshotData.replace('data:image/png;base64,', '');
                        }
                        
                        console.log('🔍 Final Screenshot Data:', {
                          hasScreenshotData: !!screenshotData,
                          screenshotDataLength: screenshotData ? screenshotData.length : 0,
                          screenshotDataStart: screenshotData ? screenshotData.substring(0, 50) : null,
                          screenshotDataEnd: screenshotData ? screenshotData.substring(screenshotData.length - 50) : null
                        });
                        
                        const resultsWindow = window.open('', '_blank');
                        resultsWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <title>Scan Results - ${result.pin}</title>
                              <style>
                                body {
                                  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%);
                                  color: #fff;
                                  font-family: 'Courier New', monospace;
                                  margin: 0;
                                  padding: 20px;
                                  min-height: 100vh;
                                }
                                .container {
                                  max-width: 1200px;
                                  margin: 0 auto;
                                }
                                .header {
                                  text-align: center;
                                  margin-bottom: 40px;
                                  padding: 30px;
                                  background: rgba(0, 0, 0, 0.8);
                                  border-radius: 15px;
                                  border: 2px solid #ffffff;
                                  box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
                                }
                                .header h1 {
                                  color: #ffffff;
                                  font-size: 36px;
                                  font-weight: bold;
                                  margin-bottom: 10px;
                                  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
                                }
                                .header p {
                                  color: #cccccc;
                                  font-size: 16px;
                                  margin: 0;
                                }
                                .section {
                                  background: rgba(0, 0, 0, 0.8);
                                  border-radius: 15px;
                                  padding: 30px;
                                  margin-bottom: 25px;
                                  border: 2px solid #ffffff;
                                  box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
                                }
                                .section h3 {
                                  color: #ffffff;
                                  margin-bottom: 20px;
                                  font-size: 20px;
                                  font-weight: bold;
                                  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                                  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
                                  padding-bottom: 10px;
                                }
                                .info-grid {
                                  display: grid;
                                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                                  gap: 20px;
                                }
                                .info-item {
                                  background: rgba(0, 0, 0, 0.6);
                                  padding: 15px;
                                  border-radius: 8px;
                                  border: 1px solid rgba(255, 255, 255, 0.3);
                                  transition: all 0.3s ease;
                                }
                                .info-item:hover {
                                  border-color: #ffffff;
                                  box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
                                }
                                .info-label {
                                  color: #ffffff;
                                  font-weight: bold;
                                  font-size: 14px;
                                  margin-bottom: 8px;
                                  text-transform: uppercase;
                                  letter-spacing: 1px;
                                }
                                .info-value {
                                  color: #fff;
                                  font-size: 16px;
                                  font-weight: 500;
                                }
                                .mod-item {
                                  background: rgba(0, 0, 0, 0.6);
                                  padding: 15px;
                                  border-radius: 8px;
                                  margin-bottom: 10px;
                                  border-left: 4px solid #ffffff;
                                  transition: all 0.3s ease;
                                }
                                .mod-item:hover {
                                  background: rgba(255, 255, 255, 0.1);
                                  transform: translateX(5px);
                                }
                                .screenshot-container {
                                  text-align: center;
                                  margin-top: 20px;
                                }
                                .screenshot {
                                  max-width: 100%;
                                  max-height: 600px;
                                  border-radius: 10px;
                                  box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
                                  border: 2px solid #ffffff;
                                }
                                .services-grid {
                                  display: grid;
                                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                                  gap: 15px;
                                }
                                .service-item {
                                  background: rgba(0, 0, 0, 0.6);
                                  padding: 12px;
                                  border-radius: 8px;
                                  border: 1px solid rgba(255, 255, 255, 0.3);
                                  text-align: center;
                                }
                                .service-running {
                                  border-color: #ffffff;
                                  background: rgba(255, 255, 255, 0.1);
                                }
                                .service-stopped {
                                  border-color: #666;
                                  background: rgba(100, 100, 100, 0.1);
                                }
                                .detections-list {
                                  list-style: none;
                                  padding: 0;
                                }
                                .detections-list li {
                                  background: rgba(0, 0, 0, 0.6);
                                  padding: 12px;
                                  margin-bottom: 8px;
                                  border-radius: 8px;
                                  border-left: 4px solid #ffffff;
                                }
                              </style>
                            </head>
                            <body>
                              <div class="container">
                                <div class="header">
                                  <h1>Scan Results</h1>
                                  <p>PIN: ${result.pin} | Completed: ${new Date(result.completedAt).toLocaleString()}</p>
                                </div>

                                ${parsedResults && parsedResults.systemInfo && Object.keys(parsedResults.systemInfo).length > 0 ? `
                                <div class="section">
                                  <h3>System Information</h3>
                                  <div class="info-grid">
                                    ${Object.entries(parsedResults.systemInfo).map(([key, value]) => `
                                      <div class="info-item">
                                        <div class="info-label">${key}</div>
                                        <div class="info-value">${value}</div>
                                      </div>
                                    `).join('')}
                                  </div>
                                </div>
                                ` : ''}

                                ${parsedResults && parsedResults.services && parsedResults.services.length > 0 ? `
                                <div class="section">
                                  <h3>Services</h3>
                                  <div class="services-grid">
                                    ${parsedResults.services.map(service => `
                                      <div class="service-item ${service.status === 'on' ? 'service-running' : 'service-stopped'}">
                                        <div style="color: ${service.status === 'on' ? '#ffffff' : '#666'}; font-weight: bold;">
                                          ${service.name}
                                        </div>
                                        <div style="color: ${service.status === 'on' ? '#ffffff' : '#666'}; font-size: 12px; margin-top: 5px;">
                                          ${service.status === 'on' ? 'RUNNING' : 'STOPPED'}
                                        </div>
                                      </div>
                                    `).join('')}
                                  </div>
                                </div>
                                ` : ''}

                                ${parsedResults && parsedResults.suspiciousActivities && parsedResults.suspiciousActivities.length > 0 ? `
                                <div class="section">
                                  <h3>Detections</h3>
                                  <ul class="detections-list">
                                    ${parsedResults.suspiciousActivities.map(detection => `
                                      <li>${detection}</li>
                                    `).join('')}
                                  </ul>
                                </div>
                                ` : ''}

                                ${parsedResults && parsedResults.fivemMods && parsedResults.fivemMods.length > 0 ? `
                                <div class="section">
                                  <h3>FiveM Mods (${parsedResults.fivemMods.length})</h3>
                                  ${parsedResults.fivemMods.map(mod => `
                                    <div class="mod-item">📄 ${mod}</div>
                                  `).join('')}
                                </div>
                                ` : ''}

                                ${parsedResults && parsedResults.cheatWebsites && parsedResults.cheatWebsites.length > 0 ? `
                                <div class="section">
                                  <h3>Cheat Websites (${parsedResults.cheatWebsites.length})</h3>
                                  ${parsedResults.cheatWebsites.map(site => `
                                    <div class="mod-item">🌐 ${site}</div>
                                  `).join('')}
                                </div>
                                ` : ''}

                                ${parsedResults && parsedResults.discordAccount ? `
                                <div class="section">
                                  <h3>Discord Account</h3>
                                  <div class="info-item">
                                    <div class="info-label">Discord ID</div>
                                    <div class="info-value">${parsedResults.discordAccount}</div>
                                  </div>
                                </div>
                                ` : ''}

                                ${parsedResults && parsedResults.usbDevices && parsedResults.usbDevices.length > 0 ? `
                                <div class="section">
                                  <h3>USB Devices (${parsedResults.usbDevices.length})</h3>
                                  ${parsedResults.usbDevices.map(device => `
                                    <div class="mod-item">🔌 ${device}</div>
                                  `).join('')}
                                </div>
                                ` : ''}

                                ${screenshotData ? `
                                <div class="section">
                                  <h3>PC Screenshot</h3>
                                  <div class="screenshot-container">
                                    <img src="data:image/png;base64,${screenshotData}" alt="PC Screenshot" class="screenshot" onerror="console.error('Screenshot load error:', this.src.substring(0, 50) + '...'); this.style.display='none'; this.nextElementSibling.style.display='block';">
                                    <div style="display: none; color: #ffffff; font-size: 16px; text-align: center; padding: 20px;">
                                      Screenshot failed to load. Data length: ${screenshotData.length}
                                    </div>
                                  </div>
                                </div>
                                ` : parsedResults && parsedResults.screenshot ? `
                                <div class="section">
                                  <h3>PC Screenshot</h3>
                                  <div class="screenshot-container">
                                    <div style="color: #ffffff; font-size: 16px; text-align: center; padding: 20px;">
                                      Screenshot captured: ${parsedResults.screenshot}
                                    </div>
                                  </div>
                                </div>
                                ` : ''}
                              </div>
                            </body>
                          </html>
                        `);
                        resultsWindow.document.close();
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        color: '#fff',
                        border: '1px solid #ffffff',
                        borderRadius: '5px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    >
                      Click to view full details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div>
                <div style={{
                  marginBottom: '40px',
                  position: 'relative'
                }}>
                  <h2 style={{
                    color: '#ffffff',
                    fontSize: '28px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    letterSpacing: '0.5px'
                  }}>
                    Admin Dashboard
                  </h2>
                  <div style={{
                    color: '#cccccc',
                    fontSize: '14px',
                    fontWeight: '400',
                    opacity: 0.8
                  }}>
                    System Overview & Analytics
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '25px',
                  marginBottom: '40px'
                }}>
                  <div style={{
                    background: '#111111',
                    borderRadius: '8px',
                    padding: '24px',
                    border: '1px solid #333333',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ 
                      color: '#ffffff', 
                      fontSize: '14px', 
                      marginBottom: '12px', 
                      fontWeight: '500'
                    }}>
                      Total Users
                    </h3>
                    <div style={{ 
                      color: '#ffffff', 
                      fontSize: '32px', 
                      fontWeight: '600', 
                      marginBottom: '8px'
                    }}>
                      {users.length}
                    </div>
                    <div style={{ 
                      color: '#cccccc', 
                      fontSize: '12px', 
                      fontWeight: '400'
                    }}>
                      {users.filter(u => u.role === 'admin').length} Admins
                    </div>
                  </div>

                  <div style={{
                    background: '#111111',
                    borderRadius: '8px',
                    padding: '24px',
                    border: '1px solid #333333',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ 
                      color: '#ffffff', 
                      fontSize: '14px', 
                      marginBottom: '12px', 
                      fontWeight: '500'
                    }}>
                      Enterprises
                    </h3>
                    <div style={{ 
                      color: '#ffffff', 
                      fontSize: '32px', 
                      fontWeight: '600', 
                      marginBottom: '8px'
                    }}>
                      {enterprises.length}
                    </div>
                    <div style={{ 
                      color: '#cccccc', 
                      fontSize: '12px', 
                      fontWeight: '400'
                    }}>
                      {enterprises.reduce((total, e) => total + (e.members ? e.members.length : 0), 0)} Total Members
                    </div>
                  </div>

                  <div style={{
                    background: '#111111',
                    borderRadius: '8px',
                    padding: '24px',
                    border: '1px solid #333333',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ 
                      color: '#ffffff', 
                      fontSize: '14px', 
                      marginBottom: '12px', 
                      fontWeight: '500'
                    }}>
                      Total Pins
                    </h3>
                    <div style={{ 
                      color: '#ffffff', 
                      fontSize: '32px', 
                      fontWeight: '600', 
                      marginBottom: '8px'
                    }}>
                      {pins.length}
                    </div>
                    <div style={{ 
                      color: '#cccccc', 
                      fontSize: '12px', 
                      fontWeight: '400'
                    }}>
                      {pins.filter(p => p.status === 'completed').length} Completed
                    </div>
                  </div>

                  <div style={{
                    background: '#111111',
                    borderRadius: '8px',
                    padding: '24px',
                    border: '1px solid #333333',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ 
                      color: '#ffffff', 
                      fontSize: '14px', 
                      marginBottom: '12px', 
                      fontWeight: '500'
                    }}>
                      Banned Users
                    </h3>
                    <div style={{ 
                      color: '#ffffff', 
                      fontSize: '32px', 
                      fontWeight: '600', 
                      marginBottom: '8px'
                    }}>
                      {users.filter(u => u.isBanned).length}
                    </div>
                    <div style={{ 
                      color: '#cccccc', 
                      fontSize: '12px', 
                      fontWeight: '400'
                    }}>
                      {((users.filter(u => u.isBanned).length / users.length) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#111111',
                  borderRadius: '8px',
                  padding: '24px',
                  border: '1px solid #333333'
                }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '500',
                    marginBottom: '12px'
                  }}>
                    Recent Activity
                  </h3>
                  <div style={{ 
                    color: '#cccccc', 
                    fontSize: '14px',
                    fontWeight: '400'
                  }}>
                    System is running normally. All services are operational.
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    color: '#ffffff',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Users Management ({users.length} Total)
                  </h2>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '8px 15px',
                      border: '1px solid #ffffff',
                      borderRadius: '5px',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      Admins: {users.filter(u => u.role === 'admin').length}
                    </div>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '8px 15px',
                      border: '1px solid #ffffff',
                      borderRadius: '5px',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      Banned: {users.filter(u => u.isBanned).length}
                    </div>
                  </div>
                </div>

                {/* User Statistics */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  borderRadius: '10px',
                  padding: '20px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '15px',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    User Statistics
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                  }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ffffff',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
                        {users.length}
                      </div>
                      <div style={{ color: '#fff', fontSize: '12px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Total Users
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ffffff',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
                        {users.filter(u => u.role === 'admin').length}
                      </div>
                      <div style={{ color: '#fff', fontSize: '12px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Admins
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ffffff',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
                        {users.filter(u => u.role === 'user').length}
                      </div>
                      <div style={{ color: '#fff', fontSize: '12px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Regular Users
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ffffff',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
                        {users.filter(u => u.isBanned).length}
                      </div>
                      <div style={{ color: '#fff', fontSize: '12px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Banned Users
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '15px'
                }}>
                  {users.map((user, index) => (
                    <div key={index} style={{
                      background: user.isBanned ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.8)',
                      borderRadius: '10px',
                      padding: '15px',
                      border: user.isBanned ? '2px solid #ffffff' : '2px solid #ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: user.isBanned ? '0 0 30px rgba(255, 255, 255, 0.3)' : '0 0 30px rgba(255, 255, 255, 0.3)',
                      position: 'relative'
                    }}
                    onClick={() => handleUserClick(user)}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Name:</strong>
                        <span style={{ color: '#fff', marginLeft: '8px' }}>{user.username}</span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Email:</strong>
                        <span style={{ color: '#fff', marginLeft: '8px' }}>{user.email}</span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Role:</strong>
                        <span style={{ 
                          color: user.role === 'admin' ? '#ffffff' : '#fff', 
                          marginLeft: '8px',
                          fontWeight: user.role === 'admin' ? 'bold' : 'normal',
                          textTransform: 'uppercase'
                        }}>
                          {user.role}
                        </span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Created:</strong>
                        <span style={{ color: '#fff', marginLeft: '8px', fontSize: '12px' }}>
                          {new Date(user.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {user.isBanned && (
                        <div style={{ 
                          marginTop: '8px', 
                          padding: '8px', 
                          background: 'rgba(255, 255, 255, 0.2)', 
                          borderRadius: '5px',
                          border: '1px solid #ffffff'
                        }}>
                          <strong style={{ color: '#ffffff', fontSize: '12px' }}>🚫 BANNED</strong>
                          {user.banReason && (
                            <div style={{ color: '#ffffff', fontSize: '12px', marginTop: '4px' }}>
                              Reason: {user.banReason}
                            </div>
                          )}
                        </div>
                      )}
                      {user.role === 'admin' && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(255, 255, 255, 0.8)',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}>
                          ADMIN
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enterprises Tab */}
            {activeTab === 'enterprises' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    color: '#ffffff',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Enterprises Management
                  </h2>
                  <button
                    onClick={() => setShowEnterpriseForm(!showEnterpriseForm)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#fff',
                      border: '1px solid #ffffff',
                      borderRadius: '5px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                    }}
                  >
                    {showEnterpriseForm ? 'Hide Form' : 'Create Enterprise'}
                  </button>
                </div>

                {showEnterpriseForm && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '10px',
                    padding: '25px',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{
                      color: '#ffffff',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      marginBottom: '20px',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      Create New Enterprise
                    </h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{
                        display: 'block',
                        color: '#ffffff',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}>
                        Enterprise Name:
                      </label>
                      <input
                        type="text"
                        value={enterpriseName}
                        onChange={(e) => setEnterpriseName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid #ffffff',
                          borderRadius: '5px',
                          color: '#fff',
                          fontSize: '14px',
                          outline: 'none',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{
                        display: 'block',
                        color: '#ffffff',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}>
                        Owner Email:
                      </label>
                      <input
                        type="email"
                        value={enterpriseOwner}
                        onChange={(e) => setEnterpriseOwner(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid #ffffff',
                          borderRadius: '5px',
                          color: '#fff',
                          fontSize: '14px',
                          outline: 'none',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        color: '#ffffff',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}>
                        Number of Seats:
                      </label>
                      <input
                        type="number"
                        value={enterpriseSeats || ''}
                        onChange={(e) => setEnterpriseSeats(parseInt(e.target.value) || 1)}
                        min="1"
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid #ffffff',
                          borderRadius: '5px',
                          color: '#fff',
                          fontSize: '14px',
                          outline: 'none',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                      />
                    </div>

                    <button
                      onClick={createEnterprise}
                      style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        color: '#fff',
                        border: '1px solid #ffffff',
                        borderRadius: '5px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    >
                      Create Enterprise
                    </button>
                  </div>
                )}
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '15px'
                }}>
                  {enterprises.map((enterprise, index) => (
                    <div key={index} style={{
                      background: '#111111',
                      borderRadius: '8px',
                      padding: '20px',
                      border: '1px solid #333333',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onClick={() => handleEnterpriseClick(enterprise)}
                    >
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          deleteEnterprise(enterprise.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(220, 38, 38, 0.8)',
                          color: '#ffffff',
                          border: '1px solid #dc2626',
                          borderRadius: '5px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = 'rgba(220, 38, 38, 1)';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'rgba(220, 38, 38, 0.8)';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        Delete
                      </button>

                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Name:</strong>
                        <span style={{ color: '#fff', marginLeft: '8px' }}>{enterprise.name}</span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Owner:</strong>
                        <span style={{ color: '#fff', marginLeft: '8px' }}>{enterprise.ownerEmail}</span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Seats:</strong>
                        <span style={{ color: '#fff', marginLeft: '8px' }}>{enterprise.seats}</span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Members:</strong>
                        <span style={{ color: '#fff', marginLeft: '8px' }}>{enterprise.members ? enterprise.members.length : 0}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enterprise Details Modal */}
                {showEnterpriseDetails && selectedEnterprise && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                  }}>
                    <div style={{
                      background: '#111111',
                      borderRadius: '12px',
                      padding: '30px',
                      border: '1px solid #333333',
                      maxWidth: '600px',
                      width: '90%',
                      maxHeight: '80vh',
                      overflow: 'auto'
                    }}>
                      {/* Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        borderBottom: '1px solid #333333',
                        paddingBottom: '15px'
                      }}>
                        <h2 style={{
                          color: '#ffffff',
                          fontSize: '24px',
                          fontWeight: '600',
                          margin: 0
                        }}>
                          {selectedEnterprise.name} - Members
                        </h2>
                        <button
                          onClick={() => {
                            setShowEnterpriseDetails(false);
                            setSelectedEnterprise(null);
                          }}
                          style={{
                            background: '#333333',
                            color: '#ffffff',
                            border: '1px solid #555555',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          Close
                        </button>
                      </div>

                      {/* Enterprise Info */}
                      <div style={{
                        background: '#222222',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '20px',
                        border: '1px solid #444444'
                      }}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#ffffff' }}>Owner:</strong>
                          <span style={{ color: '#cccccc', marginLeft: '8px' }}>{selectedEnterprise.ownerEmail}</span>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#ffffff' }}>Seats:</strong>
                          <span style={{ color: '#cccccc', marginLeft: '8px' }}>{selectedEnterprise.seats}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#ffffff' }}>Current Members:</strong>
                          <span style={{ color: '#cccccc', marginLeft: '8px' }}>
                            {selectedEnterprise.members ? selectedEnterprise.members.length : 0}
                          </span>
                        </div>
                      </div>

                      {/* Add Member Form */}
                      <div style={{
                        background: '#222222',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '20px',
                        border: '1px solid #444444'
                      }}>
                        <h3 style={{
                          color: '#ffffff',
                          fontSize: '18px',
                          fontWeight: '500',
                          marginBottom: '15px'
                        }}>
                          Add New Member
                        </h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input
                            type="email"
                            placeholder="Enter member email..."
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#333333',
                              border: '1px solid #555555',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                          <button
                            onClick={addMemberToEnterprise}
                            style={{
                              background: '#333333',
                              color: '#ffffff',
                              border: '1px solid #555555',
                              borderRadius: '6px',
                              padding: '10px 20px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            Add Member
                          </button>
                        </div>
                      </div>

                      {/* Members List */}
                      <div>
                        <h3 style={{
                          color: '#ffffff',
                          fontSize: '18px',
                          fontWeight: '500',
                          marginBottom: '15px'
                        }}>
                          Current Members
                        </h3>
                        
                        {selectedEnterprise.members && selectedEnterprise.members.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {selectedEnterprise.members.map((member, index) => (
                              <div key={index} style={{
                                background: '#222222',
                                borderRadius: '8px',
                                padding: '15px',
                                border: '1px solid #444444',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <div style={{ color: '#ffffff', fontWeight: '500' }}>
                                    {member.username || 'Unknown User'}
                                  </div>
                                  <div style={{ color: '#cccccc', fontSize: '14px' }}>
                                    {member.email}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeMemberFromEnterprise(member.email)}
                                  style={{
                                    background: '#dc2626',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{
                            background: '#222222',
                            borderRadius: '8px',
                            padding: '20px',
                            border: '1px solid #444444',
                            textAlign: 'center',
                            color: '#cccccc'
                          }}>
                            No members found
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pins Tab */}
            {activeTab === 'pins' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    color: '#ffffff',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Pins Management ({pins.length} Total)
                  </h2>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '8px 15px',
                      border: '1px solid #ffffff',
                      borderRadius: '5px',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      Completed: {pins.filter(p => p.status === 'completed').length}
                    </div>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '8px 15px',
                      border: '1px solid #ffffff',
                      borderRadius: '5px',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      Pending: {pins.filter(p => p.status === 'pending').length}
                    </div>
                  </div>
                </div>

                {/* Search and Filter */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  borderRadius: '10px',
                  padding: '20px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '15px',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Pin Statistics
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                  }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ffffff',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
                        {pins.length}
                      </div>
                      <div style={{ color: '#fff', fontSize: '12px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Total Pins
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ffffff',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
                        {pins.filter(p => p.status === 'completed').length}
                      </div>
                      <div style={{ color: '#fff', fontSize: '12px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Completed
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ffffff',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
                        {pins.filter(p => p.status === 'pending').length}
                      </div>
                      <div style={{ color: '#fff', fontSize: '12px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Pending
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ffffff',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
                        {new Set(pins.map(p => p.creatorEmail)).size}
                      </div>
                      <div style={{ color: '#fff', fontSize: '12px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Unique Creators
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '15px',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  padding: '10px',
                  border: '2px solid #ffffff',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.3)'
                }}>
                  {pins.map((pin, index) => (
                    <div key={index} style={{
                      background: pin.status === 'completed' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.8)',
                      borderRadius: '10px',
                      padding: '15px',
                      border: pin.status === 'completed' ? '2px solid #ffffff' : '2px solid #333333',
                      boxShadow: pin.status === 'completed' ? '0 0 30px rgba(255, 255, 255, 0.3)' : '0 0 15px rgba(0, 0, 0, 0.5)',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>PIN:</strong>
                        <span style={{ color: '#fff', marginLeft: '8px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: '16px', fontWeight: 'bold' }}>
                          {pin.pin}
                        </span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Created By:</strong>
                        <span style={{ color: '#fff', marginLeft: '8px' }}>{pin.creatorEmail}</span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Status:</strong>
                        <span style={{ 
                          color: pin.status === 'completed' ? '#ffffff' : '#333333', 
                          marginLeft: '8px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {pin.status}
                        </span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Created:</strong>
                        <span style={{ color: '#fff', marginLeft: '8px', fontSize: '12px' }}>
                          {new Date(pin.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {pin.completedAt && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#ffffff' }}>Completed:</strong>
                          <span style={{ color: '#fff', marginLeft: '8px', fontSize: '12px' }}>
                            {new Date(pin.completedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {pin.status === 'completed' && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(255, 255, 255, 0.8)',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}>
                          ✓ DONE
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ban List Tab */}
            {activeTab === 'banlist' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '40px',
                  position: 'relative'
                }}>
                  <h2 style={{
                    color: '#ffffff',
                    fontSize: '36px',
                    fontWeight: '800',
                    textShadow: '0 0 40px rgba(255, 255, 255, 0.8), 0 4px 8px rgba(0, 0, 0, 0.5)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    Banned Users
                  </h2>
                  <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    left: 0,
                    width: '100px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.3))',
                    borderRadius: '2px'
                  }}></div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%)',
                    padding: '10px 20px',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 2px 10px rgba(255, 255, 255, 0.2)'
                  }}>
                    Total Banned: <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{users.filter(u => u.isBanned).length}</span>
                  </div>
                </div>

                {users.filter(u => u.isBanned).length > 0 ? (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 0, 0, 0.8) 100%)',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '16px',
                    padding: '30px',
                    boxShadow: '0 8px 32px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{
                      display: 'grid',
                      gap: '20px'
                    }}>
                      {users.filter(u => u.isBanned).map((user, index) => (
                        <div key={index} style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)',
                          border: '2px solid rgba(255, 255, 255, 0.4)',
                          borderRadius: '12px',
                          padding: '25px',
                          boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        >
                          {/* Ban Status Badge */}
                          <div style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
                            background: 'linear-gradient(135deg, #ffffff 0%, #991b1b 100%)',
                            color: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            boxShadow: '0 4px 15px rgba(255, 255, 255, 0.4)',
                            textShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
                          }}>
                            BANNED
                          </div>

                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '20px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{
                                color: '#ffffff',
                                fontSize: '20px',
                                fontWeight: '700',
                                marginBottom: '8px',
                                textShadow: '0 0 15px rgba(255, 255, 255, 0.5)',
                                letterSpacing: '0.5px'
                              }}>
                                {user.username}
                              </h3>
                              <div style={{
                                color: '#cccccc',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '5px',
                                fontFamily: 'Inter, sans-serif'
                              }}>
                                Email: <span style={{ color: '#ffffff', fontWeight: '600' }}>{user.email}</span>
                              </div>
                              <div style={{
                                color: '#cccccc',
                                fontSize: '14px',
                                fontWeight: '500',
                                fontFamily: 'Inter, sans-serif'
                              }}>
                                Role: <span style={{ 
                                  color: user.role === 'admin' ? '#ffffff' : '#ffffff', 
                                  fontWeight: '600',
                                  textTransform: 'uppercase'
                                }}>{user.role}</span>
                              </div>
                            </div>
                          </div>

                          {/* Ban Details */}
                          <div style={{
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 0, 0, 0.9) 100%)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '10px',
                            padding: '20px',
                            marginBottom: '20px',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                          }}>
                            <h4 style={{
                              color: '#ffffff',
                              fontSize: '16px',
                              fontWeight: '700',
                              marginBottom: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>
                              Ban Information
                            </h4>
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{
                                color: '#ffffff',
                                fontSize: '14px',
                                fontWeight: '600'
                              }}>
                                Reason:
                              </span>
                              <span style={{
                                color: '#ffffff',
                                fontSize: '14px',
                                marginLeft: '8px',
                                fontWeight: '500'
                              }}>
                                {user.banReason || 'No reason provided'}
                              </span>
                            </div>
                            <div>
                              <span style={{
                                color: '#ffffff',
                                fontSize: '14px',
                                fontWeight: '600'
                              }}>
                                Banned At:
                              </span>
                              <span style={{
                                color: '#cccccc',
                                fontSize: '14px',
                                marginLeft: '8px',
                                fontWeight: '500'
                              }}>
                                {user.bannedAt ? new Date(user.bannedAt).toLocaleString() : 'Unknown'}
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '15px'
                          }}>
                            <button
                              onClick={() => unbanUser(user.email)}
                              style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.8) 100%)',
                                color: '#ffffff',
                                padding: '12px 24px',
                                borderRadius: '10px',
                                border: '2px solid rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '700',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                boxShadow: '0 8px 32px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
                              }}
                            >
                              Unban User
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 0, 0, 0.8) 100%)',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '16px',
                    padding: '60px 30px',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{
                      fontSize: '64px',
                      marginBottom: '30px',
                      opacity: 0.6
                    }}>
                    </div>
                    <h3 style={{
                      color: '#ffffff',
                      fontSize: '24px',
                      fontWeight: '700',
                      marginBottom: '15px',
                      textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
                    }}>
                      No Banned Users
                    </h3>
                    <p style={{
                      color: '#cccccc',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      fontWeight: '500'
                    }}>
                      All users are currently active. The ban list is empty.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 style={{
                  color: '#ffffff',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  System Settings
                </h2>
                
                <div style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  borderRadius: '10px',
                  padding: '25px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)'
                }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '15px',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    System Information
                  </h3>
                  
                  <div style={{ color: '#fff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ color: '#ffffff' }}>Server Status:</strong>
                      <span style={{ color: '#fff', marginLeft: '8px' }}>Online</span>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ color: '#ffffff' }}>Database:</strong>
                      <span style={{ color: '#fff', marginLeft: '8px' }}>Connected</span>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ color: '#ffffff' }}>API Endpoints:</strong>
                      <span style={{ color: '#fff', marginLeft: '8px' }}>Active</span>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ color: '#ffffff' }}>Last Backup:</strong>
                      <span style={{ color: '#fff', marginLeft: '8px' }}>{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Management Tab */}
            {activeTab === 'management' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '40px',
                  position: 'relative'
                }}>
                  <h2 style={{
                    color: '#ffffff',
                    fontSize: '36px',
                    fontWeight: '800',
                    textShadow: '0 0 40px rgba(255, 255, 255, 0.8), 0 4px 8px rgba(0, 0, 0, 0.5)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    Admin Management
                  </h2>
                  <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    left: 0,
                    width: '100px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.3))',
                    borderRadius: '2px'
                  }}></div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)',
                  borderRadius: '16px',
                  padding: '30px',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 32px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  marginBottom: '30px'
                }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Grant Admin Access
                  </h3>
                  
                  <p style={{
                    color: '#cccccc',
                    fontSize: '14px',
                    marginBottom: '20px',
                    lineHeight: '1.6',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Enter a user's email address to grant them admin access to this panel.
                  </p>

                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <input
                      type="email"
                      placeholder="Enter user email..."
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid #ffffff',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#ffffff';
                        e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#ffffff';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      onClick={grantAdminAccess}
                      disabled={!adminEmail.trim()}
                      style={{
                        background: adminEmail.trim() ? 'rgba(255, 255, 255, 0.8)' : 'rgba(100, 100, 100, 0.8)',
                        color: '#fff',
                        border: '1px solid #ffffff',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: adminEmail.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s ease',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                    >
                      Grant Access
                    </button>
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 0, 0, 0.8) 100%)',
                  borderRadius: '16px',
                  padding: '30px',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 32px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Current Admins
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gap: '15px'
                  }}>
                    {(() => {
                      const adminUsers = users.filter(u => u.hasAdminAccess === true);
                      console.log('🔍 Admin Users Debug:', {
                        totalUsers: users.length,
                        adminUsers: adminUsers.length,
                        allUsers: users.map(u => ({ email: u.email, role: u.role, hasAdminAccess: u.hasAdminAccess, username: u.username })),
                        adminUsersList: adminUsers.map(u => ({ email: u.email, role: u.role, hasAdminAccess: u.hasAdminAccess, username: u.username }))
                      });
                      return adminUsers.map((admin, index) => (
                      <div key={index} style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{
                              color: '#ffffff',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              marginBottom: '5px',
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                              {admin.username || 'Unknown User'}
                            </div>
                            <div style={{
                              color: '#cccccc',
                              fontSize: '14px',
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                              {admin.email}
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center'
                          }}>
                            <div style={{
                              background: 'rgba(255, 255, 255, 0.8)',
                              color: '#fff',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                              Admin
                            </div>
                            <button
                              onClick={() => revokeAdminAccess(admin.email)}
                              style={{
                                background: 'rgba(100, 100, 100, 0.8)',
                                color: '#fff',
                                border: '1px solid #666',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                              }}
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      </div>
                    ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ban Modal */}
        {showBanModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.95)',
              borderRadius: '15px',
              padding: '40px',
              border: '2px solid #ffffff',
              boxShadow: '0 0 60px rgba(255, 255, 255, 0.8)',
              maxWidth: '500px',
              width: '90%',
              position: 'relative'
            }}>
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                }}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 1)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ×
              </button>

              {/* Modal Content */}
              <div style={{ textAlign: 'center' }}>
                <h2 style={{
                  color: '#ffffff',
                  marginBottom: '20px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Ban User
                </h2>
                
                <p style={{
                  color: '#fff',
                  marginBottom: '30px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Are you sure you want to ban <strong style={{ color: '#ffffff' }}>{selectedUser?.username}</strong>? This action cannot be undone.
                </p>

                <div style={{ marginBottom: '30px' }}>
                  <label style={{
                    display: 'block',
                    color: '#ffffff',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Ban Reason (Required):
                  </label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Enter reason for banning this user..."
                    style={{
                      width: '100%',
                      height: '80px',
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid #ffffff',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#ffffff';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      setShowBanModal(false);
                      setBanReason('');
                    }}
                    style={{
                      background: 'rgba(100, 100, 100, 0.8)',
                      color: '#fff',
                      border: '1px solid #666',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(100, 100, 100, 1)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(100, 100, 100, 0.8)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={banUser}
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#ffffff',
                      border: '1px solid #ffffff',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 1)';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
                    }}
                  >
                    Confirm Ban
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;