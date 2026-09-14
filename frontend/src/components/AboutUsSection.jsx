import React, { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext } from '../context/SiteDataContext';
import { Heart, Users, Trophy } from 'lucide-react';
import { useAutoTranslate, Translate, resolveDynamicContent } from '../utils/useAutoTranslate';

export default function AboutUsSection({ onViewFullAbout }) {
  const { t, currentLang } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);

  const handleAboutClick = () => {
    if (onViewFullAbout) {
      onViewFullAbout();
    }
  };

  const displayAboutHeader = resolveDynamicContent(siteData?.homeAboutHeader, 'aboutHeader', currentLang, t.aboutHeader || "ABOUT US");
  const displayAboutText = resolveDynamicContent(siteData?.aboutText, 'aboutDesc', currentLang, t.aboutDesc || "");

  return (
    <section id="about" className="about-preview-section" style={{ padding: '38px 20px', maxWidth: '1100px', margin: '0 auto' }}>
      <style>{`
        /* RESPONSIVE ON MOBILE & TABLET (Strictly <= 768px so Desktop is completely untouched) */
        @media (max-width: 768px) {
          #about.about-preview-section {
            padding: 32px 16px 32px !important;
          }
          #about .about-preview-card {
            padding: 36px 18px !important;
            min-height: auto !important;
          }
          #about .about-preview-title {
            font-size: clamp(26px, 6vw, 34px) !important;
          }
          #about .about-preview-underline {
            width: 80px !important;
            height: 3px !important;
            margin: 12px auto 24px !important;
          }
          #about .about-preview-desc {
            font-size: 15px !important;
            line-height: 1.75 !important;
            margin-bottom: 24px !important;
          }
          #about .about-preview-btn {
            font-size: 16px !important;
            font-weight: 700 !important;
            margin-top: 6px !important;
          }
        }

        /* Fluid vertical stacking for stat cards on screens <= 600px */
        @media (max-width: 600px) {
          .about-preview-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            margin: 0 auto 26px !important;
            max-width: min(320px, 88%) !important;
            width: 100% !important;
          }
          .about-preview-stat-card {
            padding: 22px 18px !important;
            min-height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 0 !important;
            text-align: center !important;
          }
          .about-preview-stat-icon {
            width: 32px !important;
            height: 32px !important;
            margin: 0 auto 10px !important;
            flex-shrink: 0 !important;
          }
          .about-preview-stat-num {
            font-size: 28px !important;
            margin: 0 0 6px !important;
            font-weight: 800 !important;
          }
          .about-preview-stat-label {
            font-size: 14px !important;
            color: #E6C687 !important;
            line-height: 1.4 !important;
            margin: 0 !important;
          }
        }

        /* EXTRA SMALL MOBILE (<= 400px) */
        @media (max-width: 400px) {
          #about.about-preview-section {
            padding: 25px 12px 25px !important;
          }
          #about .about-preview-card {
            padding: 30px 14px 28px !important;
          }
          .about-preview-stats-grid {
            max-width: 270px !important;
            width: 90% !important;
            margin: 0 auto 22px !important;
          }
          .about-preview-stat-card {
            padding: 18px 14px !important;
          }
          .about-preview-stat-num {
            font-size: 26px !important;
          }
          .about-preview-stat-label {
            font-size: 13.5px !important;
          }
        }
      `}</style>
      <div className="maroon-card gold-box-hover about-preview-card mobile-entrance-fade-up" style={{
        padding: '36px',
        background: 'linear-gradient(135deg, #3D0B0D 0%, #250406 100%)',
        borderRadius: '20px',
        border: '1.5px solid var(--gold-border)',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.8)',
        textAlign: 'center'
      }}>
        
        {/* Title */}
        <h2 className="heading-font gold-text about-preview-title" style={{
          fontSize: 'clamp(26px, 4vw, 34px)',
          letterSpacing: currentLang === 'EN' ? '2px' : 'normal',
          textTransform: currentLang === 'EN' ? 'uppercase' : 'none',
          lineHeight: currentLang === 'EN' ? 1.25 : 1.45,
          marginBottom: '0'
        }}>
          <Translate text={displayAboutHeader} />
        </h2>

        {/* Golden Underline Bar */}
        <div className="about-preview-underline" style={{
          width: '80px',
          height: '3px',
          background: 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)',
          margin: '12px auto 28px',
          borderRadius: '2px'
        }}></div>

        {/* Description Text */}
        <p className="about-preview-desc" style={{
          fontSize: '15px',
          color: '#F5F5F5',
          lineHeight: 1.8,
          textAlign: 'center',
          maxWidth: '880px',
          margin: '0 auto 32px'
        }}>
          <Translate text={displayAboutText} />
        </p>

        {/* 3 Stats Cards - Always 3 in a row like laptop */}
        <div className="about-preview-stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'clamp(8px, 1.8vw, 20px)',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div className="gold-box-hover about-preview-stat-card" style={{ 
            background: 'rgba(0, 0, 0, 0.4)', 
            padding: 'clamp(10px, 1.8vw, 20px)', 
            borderRadius: '12px', 
            border: '1px solid var(--gold-border)',
            minWidth: 0
          }}>
            <Trophy size={26} color="#D4AF37" className="about-preview-stat-icon" style={{ margin: '0 auto 6px' }} />
            <h3 className="heading-font gold-text about-preview-stat-num" style={{ fontSize: 'clamp(16px, 2.8vw, 26px)', margin: '0 0 4px' }}>{siteData.yearsCount || "15+"}</h3>
            <p className="about-preview-stat-label" style={{ fontSize: 'clamp(10px, 1.3vw, 13px)', color: '#E6C687', margin: 0 }}>{t.gloriousCelebrations}</p>
          </div>

          <div className="gold-box-hover about-preview-stat-card" style={{ 
            background: 'rgba(0, 0, 0, 0.4)', 
            padding: 'clamp(10px, 1.8vw, 20px)', 
            borderRadius: '12px', 
            border: '1px solid var(--gold-border)',
            minWidth: 0
          }}>
            <Users size={26} color="#D4AF37" className="about-preview-stat-icon" style={{ margin: '0 auto 6px' }} />
            <h3 className="heading-font gold-text about-preview-stat-num" style={{ fontSize: 'clamp(16px, 2.8vw, 26px)', margin: '0 0 4px' }}>{siteData.volunteersCount || "200+"}</h3>
            <p className="about-preview-stat-label" style={{ fontSize: 'clamp(10px, 1.3vw, 13px)', color: '#E6C687', margin: 0 }}>{t.dedicatedVolunteers}</p>
          </div>

          <div className="gold-box-hover about-preview-stat-card" style={{ 
            background: 'rgba(0, 0, 0, 0.4)', 
            padding: 'clamp(10px, 1.8vw, 20px)', 
            borderRadius: '12px', 
            border: '1px solid var(--gold-border)',
            minWidth: 0
          }}>
            <Heart size={26} color="#D4AF37" className="about-preview-stat-icon" style={{ margin: '0 auto 6px' }} />
            <h3 className="heading-font gold-text about-preview-stat-num" style={{ fontSize: 'clamp(16px, 2.8vw, 26px)', margin: '0 0 4px' }}>{siteData.devoteesCount || "50,000+"}</h3>
            <p className="about-preview-stat-label" style={{ fontSize: 'clamp(10px, 1.3vw, 13px)', color: '#E6C687', margin: 0 }}>{t.blessedDevotees}</p>
          </div>
        </div>

        {/* View Full About Us */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={handleAboutClick}
            className="about-preview-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#FFB300',
              fontSize: '16px',
              fontWeight: 700,
              textDecoration: 'underline',
              textUnderlineOffset: '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            {t.viewFullAbout}
          </button>
        </div>

      </div>
    </section>
  );
}
