import React, { useState, useEffect, Component, useContext } from 'react';
import AdminCMSPanel from './AdminCMSPanel';
import { SiteDataContext, getApiBaseUrl } from '../context/SiteDataContext';
import { ShieldCheck, LogOut, Globe, Lock, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';

class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin Panel Error Boundary caught:', error, errorInfo);
  }

  handleResetData = () => {
    try {
      localStorage.removeItem('yuva_site_data');
    } catch(e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '40px auto', textAlign: 'center', background: 'linear-gradient(135deg, #3D0B0D 0%, #250406 100%)', borderRadius: '20px', border: '1.5px solid #FF5252', color: '#FFF' }}>
          <AlertTriangle size={48} color="#FF5252" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#FFD700', fontSize: '20px', marginBottom: '10px', fontFamily: "'Cinzel', serif" }}>
            Admin Panel Recovery Mode
          </h3>
          <p style={{ color: '#FFECB3', fontSize: '13.5px', marginBottom: '12px', lineHeight: 1.6 }}>
            An unexpected error occurred while loading Admin Panel data. Click below to clear cache & reload smoothly.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.6)', padding: '12px', borderRadius: '8px', border: '1px solid #FF5252', color: '#FF8A8A', fontSize: '12px', textAlign: 'left', fontFamily: 'monospace', whiteSpace: 'pre-wrap', marginBottom: '20px', overflowX: 'auto', maxHeight: '180px' }}>
            {this.state.error ? this.state.error.toString() : 'Unknown Error'}
            {`\n\n` + (this.state.error?.stack || '')}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => this.setState({ hasError: false })}
              style={{ background: '#FFB300', color: '#2B0507', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}
            >
              🔄 Retry Loading
            </button>
            <button 
              onClick={this.handleResetData}
              style={{ background: 'rgba(255,82,82,0.2)', color: '#FF5252', border: '1px solid #FF5252', padding: '10px 20px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}
            >
              🧹 Clear Cache & Reset
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminWebsite({ onGoToPublicSite }) {
  const { siteData } = useContext(SiteDataContext);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem('yuva_admin_unlocked') === 'true';
    } catch(e) {
      return false;
    }
  });

  const [passInput, setPassInput] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    document.title = "Admin CMS Panel | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026";
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const cleanPass = (passInput || '').trim();
    const expectedPass = String(siteData?.adminPassword || 'yuva2026').trim();

    if (cleanPass === expectedPass || cleanPass.toLowerCase() === expectedPass.toLowerCase()) {
      setIsAdminUnlocked(true);
      try { sessionStorage.setItem('yuva_admin_unlocked', 'true'); } catch(e){}
      setLoginError('');
      return;
    }

    // Backend verification fallback
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: cleanPass })
      });
      const data = await res.json();
      if (data && data.success) {
        setIsAdminUnlocked(true);
        try { sessionStorage.setItem('yuva_admin_unlocked', 'true'); } catch(e){}
        setLoginError('');
        return;
      }
    } catch (err) {}

    setLoginError('❌ Incorrect Password! Please enter valid admin password.');
  };

  const handleLogout = () => {
    setIsAdminUnlocked(false);
    try { sessionStorage.removeItem('yuva_admin_unlocked'); } catch(e){}
  };

  return (
    <div style={{ background: '#120203', minHeight: '100vh', color: '#FFF' }}>
      {/* Dedicated Admin Header */}
      <header style={{
        background: 'linear-gradient(90deg, #2B0507 0%, #3D0B0D 50%, #2B0507 100%)',
        borderBottom: '1.5px solid var(--gold-border)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--gold-gradient)',
            color: '#2B0507',
            padding: '8px 14px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShieldCheck size={18} /> ADMIN PORTAL
          </div>
          <div>
            <h2 className="heading-font gold-text" style={{ fontSize: '18px', margin: 0 }}>
              Yuva Yuvak Mandal • Control Panel
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onGoToPublicSite}
            style={{
              background: 'rgba(255, 215, 0, 0.12)',
              border: '1px solid var(--gold-border)',
              color: '#FFD700',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Globe size={15} /> 🌐 View Public Website
          </button>

          {isAdminUnlocked && (
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 82, 82, 0.15)',
                border: '1px solid #FF5252',
                color: '#FF5252',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={15} /> Lock / Logout Admin
            </button>
          )}
        </div>
      </header>

      {/* Main Admin Area */}
      <main style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}>
        {!isAdminUnlocked ? (
          <div style={{ padding: '40px 20px', maxWidth: '460px', width: '100%', margin: '40px auto', textAlign: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3D0B0D 0%, #250406 100%)',
              border: '1.5px solid var(--gold-border)',
              borderRadius: '20px',
              padding: '36px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(255, 215, 0, 0.15)',
                border: '1px solid var(--gold-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Lock size={30} color="#FFD700" />
              </div>
              <h3 className="heading-font gold-text" style={{ fontSize: '24px', marginBottom: '8px' }}>
                Admin Portal Login
              </h3>
              <p style={{ color: '#FFECB3', fontSize: '13.5px', marginBottom: '24px' }}>
                Enter Admin password to edit banner, schedule, gallery & website content live in MongoDB.
              </p>

              <form onSubmit={handleLoginSubmit}>
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <input 
                    type={showLoginPass ? "text" : "password"}
                    required
                    placeholder="Enter Admin Password"
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '14px 44px 14px 16px',
                      background: 'rgba(0,0,0,0.6)',
                      border: '1px solid var(--gold-border)',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '15px',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#FFD700',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showLoginPass ? "Hide password" : "Show password"}
                  >
                    {showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {loginError && (
                  <p style={{ color: '#FF5252', fontSize: '13px', margin: '0 0 14px', fontWeight: 600 }}>
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)',
                    color: '#2B0507',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)'
                  }}
                >
                  ⚡ Unlock Admin Portal
                </button>
              </form>
            </div>
          </div>
        ) : (
          <AdminErrorBoundary>
            <AdminCMSPanel />
          </AdminErrorBoundary>
        )}
      </main>
    </div>
  );
}
