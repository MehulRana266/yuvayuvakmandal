import React, { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext } from '../context/SiteDataContext';
import { X, Calendar, Info, Home, Image, PhoneCall, ShieldCheck } from 'lucide-react';
import { Translate, resolveDynamicContent } from '../utils/useAutoTranslate';

export default function MobileDrawer({ isOpen, onClose, onNavigate, activeView }) {
  const { t, currentLang } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);

  if (!isOpen) return null;

  const handleNavClick = (view, sectionId) => {
    onClose();
    if (onNavigate) {
      onNavigate(view, sectionId);
    }
  };

  const logoUrl = siteData?.mandalLogoUrl || "/mandal-logo.jpg";
  const currentView = activeView || 'home';
  const mandalNameText = resolveDynamicContent(siteData?.mandalName, 'mandalName', currentLang, t.mandalName || 'YUVA YUVAK MANDAL');
  const mandalLocationText = resolveDynamicContent(siteData?.mandalLocation, 'mandalLocation', currentLang, t.footerLocation || 'Surat, Gujarat');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* Slide Drawer on RIGHT side */}
      <div style={{
        position: 'relative',
        width: '290px',
        height: '100%',
        background: '#2B0507',
        borderLeft: '1.5px solid var(--gold-border)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.85)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 201
      }}>
        {/* Header with Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div 
            onClick={() => handleNavClick('home', 'hero')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <img 
              src={logoUrl} 
              alt="Logo"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1.5px solid #FFB300',
                objectFit: 'cover'
              }}
            />
            <h3 className="heading-font gold-text" style={{ fontSize: '17px', margin: 0 }}>
              <Translate text={mandalNameText} />
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--gold-border)',
              color: '#FFB300',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links with Dynamic Active View Styling */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button 
            onClick={() => handleNavClick('home', 'hero')} 
            style={{
              ...navBtnStyle,
              background: currentView === 'home' ? 'rgba(255,179,0,0.18)' : 'rgba(0,0,0,0.3)',
              border: currentView === 'home' ? '1.5px solid #FFB300' : '1px solid rgba(212, 175, 55, 0.3)',
              color: currentView === 'home' ? '#FFB300' : '#FFF'
            }}
          >
            <Home size={18} color="#FFB300" /> {t.navHome}
          </button>

          <button 
            onClick={() => handleNavClick('gallery', null)} 
            style={{
              ...navBtnStyle,
              background: currentView === 'gallery' ? 'rgba(255,179,0,0.18)' : 'rgba(0,0,0,0.3)',
              border: currentView === 'gallery' ? '1.5px solid #FFB300' : '1px solid rgba(212, 175, 55, 0.3)',
              color: currentView === 'gallery' ? '#FFB300' : '#FFF'
            }}
          >
            <Image size={18} color="#FFB300" /> {t.navGallery}
          </button>

          <button 
            onClick={() => handleNavClick('schedule', null)} 
            style={{
              ...navBtnStyle,
              background: currentView === 'schedule' ? 'rgba(255,179,0,0.18)' : 'rgba(0,0,0,0.3)',
              border: currentView === 'schedule' ? '1.5px solid #FFB300' : '1px solid rgba(212, 175, 55, 0.3)',
              color: currentView === 'schedule' ? '#FFB300' : '#FFF'
            }}
          >
            <Calendar size={18} color="#FFB300" /> {t.navSchedule}
          </button>

          <button 
            onClick={() => handleNavClick('about', null)} 
            style={{
              ...navBtnStyle,
              background: currentView === 'about' ? 'rgba(255,179,0,0.18)' : 'rgba(0,0,0,0.3)',
              border: currentView === 'about' ? '1.5px solid #FFB300' : '1px solid rgba(212, 175, 55, 0.3)',
              color: currentView === 'about' ? '#FFB300' : '#FFF'
            }}
          >
            <Info size={18} color="#FFB300" /> {t.navAbout}
          </button>

          <button 
            onClick={() => handleNavClick('contact', null)} 
            style={{
              ...navBtnStyle,
              background: currentView === 'contact' ? 'rgba(255,179,0,0.18)' : 'rgba(0,0,0,0.3)',
              border: currentView === 'contact' ? '1.5px solid #FFB300' : '1px solid rgba(212, 175, 55, 0.3)',
              color: currentView === 'contact' ? '#FFB300' : '#FFF'
            }}
          >
            <PhoneCall size={18} color="#FFB300" /> {t.navContact || "Contact Us"}
          </button>

        </nav>

        <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
          <p className="heading-font gold-text" style={{ fontSize: '14px' }}>
            🚩 <Translate text={mandalNameText} /> 🚩
          </p>
          <p style={{ fontSize: '11px', color: '#AAA', marginTop: '4px' }}>
            <Translate text={mandalLocationText} />
          </p>
        </div>
      </div>
    </div>
  );
}

const navBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  color: '#FFF',
  padding: '12px 16px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left'
};
