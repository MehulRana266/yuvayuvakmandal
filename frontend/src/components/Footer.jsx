import React, { useContext } from 'react';
import { MapPin, Navigation, Compass, Instagram } from 'lucide-react';
import { SiteDataContext } from '../context/SiteDataContext';
import { LanguageContext } from '../context/LanguageContext';
import { Translate } from '../utils/useAutoTranslate';

export default function Footer({ onNavigate, onOpenAdmin }) {
  const { currentLang, t } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);
  const currentYear = new Date().getFullYear();

  const rawPandalAddress = siteData?.footerAddressText 
    || siteData?.contactInfo?.address 
    || "Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002";
  const isDefaultPandalAddress = !rawPandalAddress || rawPandalAddress.toLowerCase().includes('ram nivas society');
  const pandalAddress = (currentLang !== 'EN' && isDefaultPandalAddress)
    ? (currentLang === 'GU' ? 'યુવા યુવક મંડળ, રામ નિવાસ સોસાયટી, રાજશ્રી હોલ પાછળ, નવસારી બજાર, સંગ્રામપુરા, સુરત, ગુજરાત - 395002' : 'युवा युवक मंडल, राम निवास सोसायटी, राजश्री हॉल के पीछे, नवसारी बाजार, संग्रामपुरा, सूरत, गुजरात - 395002')
    : rawPandalAddress;

  const googleMapsUrl = siteData?.footerGoogleMapsUrl || siteData?.contactInfo?.gmapsUrl || "https://www.google.com/maps/place/21%C2%B011'14.8%22N+72%C2%B049'30.5%22E/@21.1873731,72.8218984,17z/data=!4m4!3m3!8m2!3d21.1874444!4d72.8251389?hl=en-US&entry=ttu&g_ep=EgoyMDI2MDgyMy4wIKXMDSoASAFQAw%3D%3D";
  const instaUrl = siteData?.footerInstaUrl || siteData?.reelsInstaUrl || siteData?.contactInfo?.instaUrl || siteData?.aboutInstaUrl || "https://www.instagram.com/yuva_yuvak_mandal/";
  
  const isDefaultMandalTitle = !siteData?.footerMandalTitle || siteData.footerMandalTitle.toLowerCase().includes('yuva yuvak mandal');
  const mandalDisplayName = (currentLang !== 'EN' && isDefaultMandalTitle)
    ? (currentLang === 'GU' ? 'યુવા યુવક મંડળ' : 'युवा युवक मंडल')
    : (siteData?.footerMandalTitle ? siteData.footerMandalTitle.replace('🚩', '').trim() : (siteData?.mandalName ? siteData.mandalName.replace('🚩', '').trim() : (t.mandalName || 'YUVA YUVAK MANDAL')));

  return (
    <footer style={{
      background: '#1A0304',
      borderTop: '1px solid var(--gold-border)',
      padding: '40px 20px 24px',
      color: '#FFECB3'
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '32px',
        marginBottom: '32px'
      }}>
        {/* 1. Mandal Info & Quick Links */}
        <div>
          <h3 className="heading-font gold-text" style={{ fontSize: '22px', marginBottom: '10px' }}>
            <Translate text={mandalDisplayName} />
          </h3>
          <p style={{ fontSize: '13px', color: '#DDD', lineHeight: 1.6, marginBottom: '16px' }}>
            <Translate text={siteData?.footerMandalTagline || "Shri Ganesh Utsav Mahotsav • Organised with devotion, grandeur and unity since 1968 in Surat, Gujarat."} />
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px' }}>
            <span onClick={() => onNavigate && onNavigate('home', null)} style={{ color: '#FFB300', cursor: 'pointer', fontWeight: '600' }}><Translate text={t.navHome || "Home"} /></span>
            <span style={{ color: '#555' }}>•</span>
            <span onClick={() => onNavigate && onNavigate('gallery', null)} style={{ color: '#FFB300', cursor: 'pointer', fontWeight: '600' }}><Translate text={t.navGallery || "Gallery"} /></span>
            <span style={{ color: '#555' }}>•</span>
            <span onClick={() => onNavigate && onNavigate('schedule', null)} style={{ color: '#FFB300', cursor: 'pointer', fontWeight: '600' }}><Translate text={t.navSchedule || "Schedule"} /></span>
            <span style={{ color: '#555' }}>•</span>
            <span onClick={() => onNavigate && onNavigate('about', null)} style={{ color: '#FFB300', cursor: 'pointer', fontWeight: '600' }}><Translate text={t.navAbout || "About Us"} /></span>
            <span style={{ color: '#555' }}>•</span>
            <span onClick={() => onNavigate && onNavigate('contact', null)} style={{ color: '#FFB300', cursor: 'pointer', fontWeight: '600' }}><Translate text={t.navContact || "Contact"} /></span>
          </div>
        </div>

        {/* 2. Location Address & Instagram Expandable Button */}
        <div>
          <h4 style={{ color: '#FFB300', fontSize: '16px', marginBottom: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#FFB300" /> <Translate text={siteData?.footerAddressHeading || t.footerPandalAddress || "Pandal Address"} />
          </h4>
          <p style={{ fontSize: '13.5px', color: '#FFF', lineHeight: 1.6, marginBottom: '14px' }}>
            <Translate text={pandalAddress} />
          </p>

          {/* Instagram Button - Static pill, untranslated English, no expand animation */}
          <div style={{ marginTop: '16px' }}>
            <a 
              href={instaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="insta-expand-btn"
              title={t.footerJoinInsta || "Join Instagram Community"}
            >
              <div className="insta-expand-icon-box">
                <Instagram size={20} color="#E1306C" />
              </div>
              <span className="insta-expand-text">{t.footerJoinInsta || "Join Instagram Community"}</span>
            </a>
          </div>
        </div>

        {/* 3. Interactive Google Map Location */}
        <div>
          <h4 style={{ color: '#FFB300', fontSize: '16px', marginBottom: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} color="#FFB300" /> <Translate text={siteData?.footerMapHeading || t.footerMapLocation || "Map Location & Street View"} />
          </h4>

          {/* Embedded Google Map Widget (Clickable everywhere on Mobile & Desktop) */}
          <a 
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Google Maps"
            style={{
              display: 'block',
              width: '100%',
              height: '140px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1.5px solid rgba(255, 179, 0, 0.45)',
              marginBottom: '10px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
              position: 'relative',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <iframe 
              src={siteData?.footerMapEmbedUrl || "https://maps.google.com/maps?q=21.1874551,72.8251338&t=&z=17&ie=UTF8&iwloc=&output=embed"}
              title="Yuva Yuvak Mandal Pandal Location Map"
              style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
              loading="lazy"
            />
            {/* Clickable tap surface */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'transparent',
              zIndex: 2
            }} />
          </a>

          <a 
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold gmaps-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              fontSize: '13px',
              padding: '8px 14px',
              textDecoration: 'none',
              transition: 'none',
              transform: 'none'
            }}
          >
            <Navigation size={15} /> <Translate text={(siteData?.footerGoogleMapsBtnText || t.openGoogleMapsBtn || "Open in Google Maps").replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()} />
          </a>
        </div>
      </div>

      <div 
        style={{
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 179, 0, 0.15)',
          fontSize: '12.5px',
          color: '#AAA',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {(() => {
          const mandalNamePart = currentLang === 'GU' ? 'યુવા યુવક મંડળ' : currentLang === 'HI' ? 'युवा युवक मंडल' : (siteData?.mandalName ? siteData.mandalName.replace('🚩', '').trim() : 'Yuva Yuvak Mandal');
          const rightsPart = currentLang === 'GU' ? 'સર્વ હક સુરક્ષિત.' : currentLang === 'HI' ? 'सर्वाधिकार सुरक्षित.' : 'All rights reserved.';
          const rawRights = siteData?.footerCopyrightText;
          if (rawRights && !rawRights.toLowerCase().includes('all rights reserved') && !rawRights.toLowerCase().includes('yuva yuvak mandal')) {
            return `© ${rawRights}`;
          }
          return `© ${currentYear} ${mandalNamePart}. ${rightsPart}`;
        })()}
      </div>
    </footer>
  );
}
