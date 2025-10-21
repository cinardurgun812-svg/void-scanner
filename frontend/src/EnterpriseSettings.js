import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EnterpriseSettings = ({ user, onBack }) => {
  const [enterprises, setEnterprises] = useState([]);
  const [myEnterprises, setMyEnterprises] = useState([]);
  const [selectedEntId, setSelectedEntId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEnterprises();
  }, []);

  const fetchEnterprises = async () => {
    try {
      const res = await axios.get('https://void-scanner-api.onrender.com/api/admin/enterprises');
      const ents = res.data || [];
      setEnterprises(ents);
      const mine = ents.filter(e => e.ownerEmail === user?.email || (e.members || []).includes(user?.email));
      setMyEnterprises(mine);
      if (mine.length > 0) setSelectedEntId(mine[0].id);
    } catch (err) {
      console.error(err);
      toast.error('Enterprises yüklenemedi');
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!selectedEntId) return toast.error('Enterprise seçin');
    if (!email) return toast.error('Email girin');
    try {
      setLoading(true);
      const res = await axios.post(`https://void-scanner-api.onrender.com/api/enterprises/${selectedEntId}/add-member`, { email });
      toast.success('Üye eklendi');
      setEmail('');
      await fetchEnterprises();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Üye eklenemedi';
      toast.error(msg);
    } finally {
      setLoading(false);
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
      <div style={{
        background: 'rgba(20, 20, 20, 0.9)',
        backdropFilter: 'blur(20px)',
        padding: '20px',
        borderBottom: '1px solid rgba(220, 38, 38, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{
            background: 'rgba(220, 38, 38, 0.2)', color:'#fff', border:'1px solid rgba(220,38,38,0.5)', borderRadius:8, padding:'10px 16px', cursor:'pointer', fontWeight:600
          }}>← Back</button>
          <h1 style={{ margin:0, fontSize:'1.6rem' }}>Enterprise Settings</h1>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        <div style={{
          background:'rgba(20,20,20,0.8)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:12, padding:20, marginBottom:20
        }}>
          <h3 style={{ margin:'0 0 12px 0' }}>My Enterprises</h3>
          {myEnterprises.length === 0 ? (
            <div style={{ color:'rgba(255,255,255,0.7)' }}>Bu kullanıcıya bağlı enterprise yok.</div>
          ) : (
            <div style={{
              background:'rgba(20,20,20,0.8)', color:'#fff', border:'1px solid rgba(220,38,38,0.5)', borderRadius:8, padding:'12px 14px', minWidth:260, fontWeight:700
            }}>
              {(() => {
                const current = myEnterprises.find(e => e.id === selectedEntId) || myEnterprises[0];
                return current ? `${current.name} — ${(current.members?.length || 0)}/${current.seats}` : '-';
              })()}
            </div>
          )}
        </div>

        {/* Sadece enterprise owner'ı üye ekleyebilir */}
        {(() => {
          const currentEnterprise = myEnterprises.find(e => e.id === selectedEntId) || myEnterprises[0];
          const isOwner = currentEnterprise && currentEnterprise.ownerEmail === user?.email;
          
          if (!isOwner) {
            return (
              <div style={{
                background:'rgba(20,20,20,0.8)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:12, padding:20
              }}>
                <h3 style={{ margin:'0 0 12px 0' }}>Add Member by Email</h3>
                <div style={{ 
                  color:'rgba(255,255,255,0.7)', 
                  padding:'12px', 
                  background:'rgba(220,38,38,0.1)', 
                  borderRadius:8, 
                  border:'1px solid rgba(220,38,38,0.3)' 
                }}>
                  Only enterprise owners can add members to the enterprise.
                </div>
              </div>
            );
          }
          
          return (
            <div style={{
              background:'rgba(20,20,20,0.8)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:12, padding:20
            }}>
              <h3 style={{ margin:'0 0 12px 0' }}>Add Member by Email</h3>
              <form onSubmit={addMember} style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <input type="email" placeholder="user@example.com" value={email} onChange={e=>setEmail(e.target.value)} style={{
                  background:'rgba(20,20,20,0.8)', color:'#fff', border:'1px solid rgba(220,38,38,0.5)', borderRadius:8, padding:'10px 12px', minWidth:260
                }} />
                <button type="submit" disabled={loading || !selectedEntId} style={{
                  background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', border:'none', borderRadius:8, padding:'10px 16px', fontWeight:700, cursor:'pointer'
                }}>{loading ? 'Adding...' : 'Add Member'}</button>
              </form>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default EnterpriseSettings;


