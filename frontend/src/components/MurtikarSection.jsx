import React, { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext } from '../context/SiteDataContext';
import { Award, Sparkles } from 'lucide-react';
import { Translate } from '../utils/useAutoTranslate';

export default function MurtikarSection() {
  const { t, currentLang } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);

  const murtikarName = siteData?.murtikar?.name || "Kiran Manjrekar";
  const rawBadge = siteData?.murtikar?.badge || t.murtikarBadge || "RESPECTED IDOL SCULPTOR - MUMBAI";
  const murtikarBadge = rawBadge.replace(/\s*•\s*/g, ' - ');
  const rawTagline = siteData?.murtikar?.tagline || t.murtikarTagline || "Crafted with Devotion in Mumbai and Revered in Surat Ganesh-Utsav";
  const murtikarTagline = rawTagline.replace(/\s*•\s*/g, ' and ');
  const murtikarHeaderTitle = siteData?.murtikar?.headerTitle || siteData?.murtikarHeaderTitle || t.murtikarHeader || "DIVINE CREATION - OUR IDOL SCULPTOR";
  const murtikarPhoto = siteData?.murtikar?.photo || siteData?.murtikar?.photoUrl || "";

  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    setPhotoFailed(false);
  }, [murtikarPhoto]);

  return (
    <section id="murtikar" className="murtikar-section" style={{ padding: '36px 20px 76px', maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
      <style>{`
        .murtikar-royal-card {
          background: linear-gradient(135deg, #3D0B0D 0%, #250406 100%);
          border: 1.5px solid var(--gold-border);
          border-radius: 20px;
          padding: 48px 40px 42px;
          max-width: 100%;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8);
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .murtikar-royal-card:hover {
          border-color: rgba(255, 215, 0, 0.7);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(255, 215, 0, 0.2);
        }

        /* Continuous Rotating Dashed Ring ("line line wala part gumta rahe") */
        .murtikar-circle-wrapper {
          position: relative;
          width: 146px;
          height: 146px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
        }

        .murtikar-dashed-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2.5px dashed #D4AF37;
          box-shadow: 0 0 16px rgba(212, 175, 55, 0.25);
          animation: murtikarDashedSpin 16s linear infinite;
          pointer-events: none;
          box-sizing: border-box;
        }

        @keyframes murtikarDashedSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Static Center Circle with Deep Temple Maroon-Vermilion & Gold Border (Harmonized with website) */
        .murtikar-inner-circle {
          width: 122px;
          height: 122px;
          border-radius: 50%;
          background: linear-gradient(145deg, #641109 0%, #3A080D 60%, #1D0204 100%);
          border: 2px solid rgba(212, 175, 55, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7), inset 0 0 16px rgba(212, 175, 55, 0.25);
          position: relative;
          z-index: 2;
          overflow: hidden;
        }

        .murtikar-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 215, 0, 0.14);
          border: 1px solid rgba(255, 215, 0, 0.5);
          border-radius: 50px;
          padding: 7px 20px;
          margin-bottom: 16px;
          color: #FFD700;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          box-shadow: 0 0 16px rgba(255, 215, 0, 0.18);
        }

        .murtikar-header-title {
          font-size: clamp(22px, 3.5vw, 32px);
          margin: 0;
          text-align: center;
          line-height: 1.35;
          letter-spacing: 0.5px;
        }

        .murtikar-header-icon {
          display: inline-block !important;
          vertical-align: -4px !important;
          margin-right: 8px !important;
          width: 28px !important;
          height: 28px !important;
        }

        @media (max-width: 768px) {
          #murtikar.murtikar-section {
            padding: 32px 16px 64px !important;
          }
          .murtikar-header-title {
            font-size: clamp(14px, 4.3vw, 19px) !important;
            line-height: 1.35 !important;
            padding: 0 4px !important;
          }
          .murtikar-header-icon {
            width: 20px !important;
            height: 20px !important;
            vertical-align: -3px !important;
            margin-right: 6px !important;
          }
          .murtikar-royal-card {
            width: 100% !important;
            max-width: 100% !important;
            padding: 36px 18px !important;
            border-radius: 20px !important;
            box-sizing: border-box !important;
          }
          .murtikar-circle-wrapper {
            width: 126px;
            height: 126px;
            margin-bottom: 18px;
          }
          .murtikar-inner-circle {
            width: 104px;
            height: 104px;
          }
          .murtikar-symbol-svg {
            width: 64px !important;
            height: 64px !important;
          }
          .murtikar-badge-pill {
            font-size: 11.5px;
            padding: 5px 14px;
            letter-spacing: 0.6px;
          }
        }

        /* EXTRA SMALL MOBILE (<= 400px) matching About Us */
        @media (max-width: 400px) {
          #murtikar.murtikar-section {
            padding: 26px 12px 50px !important;
          }
          .murtikar-royal-card {
            padding: 30px 14px 28px !important;
          }
        }
      `}</style>

      {/* Section Header Matching Big Screen Exactly */}
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <h2 className="heading-font gold-text murtikar-header-title">
          <Sparkles className="murtikar-header-icon" color="#FFB300" />
          <Translate text={murtikarHeaderTitle} />
        </h2>
        
        <div style={{
          width: '70px',
          height: '3px',
          background: 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)',
          margin: '10px auto 0',
          borderRadius: '2px'
        }} />
      </div>

      {/* Website-harmonized Royal Maroon & Gold Murtikar Card */}
      <div className="maroon-card gold-box-hover murtikar-royal-card mobile-entrance-fade-up">
        {/* Continuous Smooth Rotating Dashed Ring with Stationary Inner Circle */}
        <div className="murtikar-circle-wrapper">
          <div className="murtikar-dashed-ring" />
          <div className="murtikar-inner-circle">
            {murtikarPhoto && !photoFailed ? (
              <img 
                src={murtikarPhoto} 
                alt={murtikarName}
                onError={() => setPhotoFailed(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            ) : (
              <img 
                src="/ganpati-bappa-symbol.jpg" 
                alt="Shri Ganpati Bappa"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            )}
          </div>
        </div>

        {/* Title: Kiran Manjrekar with Royal Gold Gradient Text */}
        <h3 className="heading-font gold-text" style={{
          fontSize: 'clamp(24px, 4.5vw, 34px)',
          fontWeight: 800,
          margin: '0 0 12px 0',
          letterSpacing: currentLang === 'EN' ? '0.5px' : 'normal',
          lineHeight: 1.25,
          textShadow: '0 2px 14px rgba(0, 0, 0, 0.6)'
        }}>
          <Translate text={murtikarName} />
        </h3>

        {/* Pill Badge: RESPECTED IDOL SCULPTOR • MUMBAI */}
        <div className="murtikar-badge-pill">
          <Award size={15} color="#FFD700" style={{ flexShrink: 0 }} />
          <span><Translate text={murtikarBadge} /></span>
        </div>

        {/* Subtitle: Crafted with Devotion in Mumbai • Revered in Surat Ganesh-Utsav */}
        <p style={{
          fontSize: 'clamp(15.5px, 2.3vw, 19px)',
          fontWeight: 500,
          color: '#FFECB3',
          maxWidth: '940px',
          width: '100%',
          margin: '0 auto 18px',
          lineHeight: 1.55,
          letterSpacing: '0.2px'
        }}>
          <Translate text={murtikarTagline} />
        </p>

        {/* Subtle Decorative Gold Underline Accent */}
        <div style={{
          width: '90px',
          height: '2.5px',
          background: 'linear-gradient(90deg, transparent, #D4AF37, #FFD700, #D4AF37, transparent)',
          borderRadius: '2px'
        }} />
      </div>
    </section>
  );
}
