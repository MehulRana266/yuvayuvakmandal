import React, { useContext, useState, useRef, useEffect } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext } from '../context/SiteDataContext';
import { Globe, ChevronDown } from 'lucide-react';
import { Translate } from '../utils/useAutoTranslate';

export default function Header({ onGoHome, onNavigate, activeView = 'home' }) {
  const { t, currentLang, changeLanguage } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);

  const getIsMobile = () => {
    if (typeof window === 'undefined') return false;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const screenW = window.screen?.width || 1200;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Only real phones/tablets
    if (isMobileUA || (isTouch && screenW < 768)) {
      return true;
    }

    // On Desktop PC / Laptop:
    const innerW = window.innerWidth || 1200;
    const visualW = window.visualViewport?.width || innerW;
    const effectiveW = Math.min(innerW, visualW);

    // Browser Zoom Detection on Desktop:
    let isDesktopZoom110Plus = false;
    if (window.outerWidth && window.innerWidth) {
      const zoomRatio = window.outerWidth / window.innerWidth;
      if (zoomRatio >= 1.07) {
        isDesktopZoom110Plus = true;
      }
    }

    // User requirement:
    // "110% pe menu wala ana chahiye"
    // "100% ya use kam karne par menu wala nahi ana chahiye"
    // - At >= 110% zoom OR screen width <= 880px: show hamburger menu ("menu wala")!
    // - At <= 100% zoom AND screen width > 880px: show 1-line horizontal menu!
    return isDesktopZoom110Plus || effectiveW <= 880;
  };


  const [isMobileScreen, setIsMobileScreen] = useState(getIsMobile);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuBtnRef = useRef(null);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(isMobileScreen ? 70 : 78);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        if (rect.height > 0) {
          const h = Math.round(rect.height);
          setHeaderHeight(h);
          document.documentElement.style.setProperty('--header-actual-height', `${h}px`);
        }
      }
    };
    updateHeaderHeight();

    let ro;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      ro = new ResizeObserver(updateHeaderHeight);
      ro.observe(headerRef.current);
    }
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [isMobileScreen]);

  const languages = [
    { code: 'EN', name: 'English', label: 'English' },
    { code: 'HI', name: 'हिंदी', label: 'हिंदी' },
    { code: 'GU', name: 'ગુજરાતી', label: 'ગુજરાતી' }
  ];

  const logoUrl = siteData?.mandalLogoUrl || "/mandal-logo.jpg";

  // Navigation Links
  const navLinks = [
    { id: 'home', label: t?.navHome || 'Home' },
    { id: 'gallery', label: t?.navGallery || 'Gallery' },
    { id: 'schedule', label: t?.navSchedule || 'Schedule' },
    { id: 'about', label: t?.navAbout || 'About Us' },
    { id: 'contact', label: t?.navContact || 'Contact Us' }
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target) &&
        mobileMenuBtnRef.current &&
        !mobileMenuBtnRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Update mobile detection on window or visualViewport resize, zoom, or orientation
  useEffect(() => {
    const handleResize = () => {
      const mobile = getIsMobile();
      setIsMobileScreen(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    // Periodic check to ensure immediate sync on browser Ctrl + mousewheel zoom
    const interval = setInterval(handleResize, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
      clearInterval(interval);
    };
  }, []);

  const handleNav = (id) => {
    if (onNavigate) {
      onNavigate(id, null);
    } else if (id === 'home' && onGoHome) {
      onGoHome();
    }
  };

  const currentLangObj = languages.find(l => l.code === currentLang) || languages[0];

  const isPhoneView = isMobileScreen;

  return (
    <>
      <header 
        ref={headerRef}
        className={`site-main-header ${isMobileScreen ? 'header-mobile-mode' : 'header-desktop-mode'}`}
        style={{
          background: 'rgba(43, 5, 7, 0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1.5px solid var(--gold-border)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          padding: isPhoneView ? '8px 16px' : '12px 24px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'visible'
        }}
      >
        <style>{`
        .header-nav-link {
          color: #FFECB3;
          font-size: 15px;
          font-weight: 500;
          padding: 8px 15px;
          border-radius: 20px;
          background: transparent;
          border: 1px solid transparent;
          outline: none;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
        }
        .header-nav-link:hover {
          color: #FFB300;
          background: rgba(255, 179, 0, 0.14);
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(255, 179, 0, 0.18);
        }
        .header-nav-link:active {
          transform: scale(0.95);
        }
        .header-nav-link.active {
          color: #FFB300;
          font-weight: 700;
          background: rgba(255, 179, 0, 0.18);
          border: 1px solid rgba(255, 179, 0, 0.4);
          box-shadow: 0 2px 12px rgba(255, 179, 0, 0.25);
        }

        /* Mode-based display: switches between 1-line nav and hamburger button */
        .site-main-header.header-desktop-mode .desktop-nav-group {
          display: flex !important;
        }
        .site-main-header.header-desktop-mode .mobile-menu-btn-wrap {
          display: none !important;
        }

        .site-main-header.header-mobile-mode .desktop-nav-group {
          display: none !important;
        }
        .site-main-header.header-mobile-mode .mobile-menu-btn-wrap {
          display: flex !important;
        }

        .header-fixed-spacer {
          height: var(--header-actual-height, 72px) !important;
        }

        /* DESKTOP SIZING (min-width: 881px - Always compact and sleek at 100%, 110%, etc.) */
        @media (min-width: 881px) {
          .site-main-header {
            padding: 12px 24px !important;
          }
          .mandal-logo-wrap {
            width: 54px !important;
            height: 54px !important;
            border-width: 2.5px !important;
          }
          .mandal-title-text {
            font-size: clamp(18px, 3.5vw, 24px) !important;
          }
          .mandal-subtitle-text {
            font-size: 11.5px !important;
            margin-top: 2px !important;
          }
          .mobile-hamburger-btn {
            width: 44px !important;
            height: 44px !important;
            border-radius: 10px !important;
            border-width: 1.5px !important;
            gap: 5px !important;
          }
          .mobile-hamburger-line {
            width: 22px !important;
            height: 2.5px !important;
            border-radius: 2px !important;
          }
          .mobile-dropdown-card {
            max-width: 300px !important;
            left: auto !important;
            right: auto !important;
            margin: 0 auto !important;
            padding: 10px 12px !important;
            border-radius: 14px !important;
            overflow: hidden !important;
            max-height: none !important;
            gap: 4px !important;
          }
          .mobile-nav-links-wrap {
            gap: 2px !important;
          }
          .mobile-nav-item-btn {
            font-size: 13px !important;
            padding: 5px 10px !important;
            border-radius: 10px !important;
            line-height: 1.2 !important;
          }
          .mobile-menu-divider {
            margin: 2px 0 !important;
          }
          .mobile-lang-container {
            margin-top: 1px !important;
          }
          .mobile-lang-title {
            font-size: 11px !important;
            margin-bottom: 4px !important;
            gap: 5px !important;
          }
          .mobile-lang-grid {
            padding: 2px !important;
            gap: 4px !important;
            border-radius: 12px !important;
          }
          .mobile-lang-btn {
            font-size: 11px !important;
            padding: 4px 2px !important;
            border-radius: 8px !important;
          }
        }

        /* Desktop Nav Link sizing at intermediate desktop widths */
        @media (min-width: 881px) and (max-width: 1240px) {
          .site-main-header.header-desktop-mode {
            padding: 10px 16px !important;
          }
          .header-nav-link {
            padding: 6px 10px !important;
            font-size: 13.5px !important;
          }
          .desktop-nav-group {
            gap: 12px !important;
          }
        }

        @media (min-width: 881px) and (max-width: 1060px) {
          .header-nav-link {
            padding: 5px 8px !important;
            font-size: 12.5px !important;
          }
          .desktop-nav-group {
            gap: 7px !important;
          }
          .mandal-title-text {
            font-size: 18px !important;
          }
          .mandal-subtitle-text {
            font-size: 10.5px !important;
          }
        }

        /* RESPONSIVE HEADER SIZING (Screen <= 880px / Mobile & Tablets) */
        @media (max-width: 880px) {
          .site-main-header {
            padding: 10px 16px !important;
          }
          .header-inner-row {
            gap: 10px !important;
          }
          .header-brand-wrap {
            min-width: 0 !important;
            flex: 1 1 auto !important;
            gap: 10px !important;
          }
          .header-brand-text {
            min-width: 0 !important;
            flex: 1 1 auto !important;
          }
          .mandal-logo-wrap {
            width: 50px !important;
            height: 50px !important;
            border-width: 2px !important;
            flex-shrink: 0 !important;
          }
          .mandal-title-text {
            font-size: clamp(17px, 4.2vw, 22px) !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .mandal-subtitle-text {
            font-size: 11.5px !important;
            margin-top: 2px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .mobile-menu-btn-wrap {
            flex-shrink: 0 !important;
          }
          .mobile-hamburger-btn {
            width: 44px !important;
            height: 44px !important;
            border-radius: 10px !important;
            border-width: 1.5px !important;
            gap: 5px !important;
            flex-shrink: 0 !important;
          }
          .mobile-hamburger-line {
            width: 22px !important;
            height: 2.5px !important;
          }
          .mobile-dropdown-card {
            max-width: 440px !important;
            padding: 16px 18px !important;
            border-radius: 16px !important;
            gap: 8px !important;
          }
          .mobile-nav-item-btn {
            font-size: 17px !important;
            padding: 10px 18px !important;
          }
          .mobile-lang-title {
            font-size: 13.5px !important;
            margin-bottom: 8px !important;
          }
          .mobile-lang-btn {
            font-size: 14px !important;
            padding: 8px 4px !important;
          }
        }

        @media (max-width: 440px) {
          .site-main-header {
            padding: 8px 12px !important;
          }
          .header-inner-row {
            gap: 8px !important;
          }
          .header-brand-wrap {
            gap: 8px !important;
          }
          .mandal-logo-wrap {
            width: 44px !important;
            height: 44px !important;
            border-width: 2px !important;
          }
          .mandal-title-text {
            font-size: clamp(15px, 4.2vw, 18px) !important;
          }
          .mandal-subtitle-text {
            font-size: 10.5px !important;
          }
          .mobile-hamburger-btn {
            width: 42px !important;
            height: 42px !important;
            flex-shrink: 0 !important;
          }
          .mobile-hamburger-line {
            width: 20px !important;
            height: 2.3px !important;
          }
        }

        @media (max-width: 360px) {
          .site-main-header {
            padding: 6px 10px !important;
          }
          .mandal-logo-wrap {
            width: 38px !important;
            height: 38px !important;
          }
          .mandal-title-text {
            font-size: 14px !important;
          }
          .mandal-subtitle-text {
            font-size: 9.5px !important;
          }
          .mobile-hamburger-btn {
            width: 38px !important;
            height: 38px !important;
            flex-shrink: 0 !important;
          }
        }


        .mobile-dropdown-card {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .mobile-dropdown-card::-webkit-scrollbar {
          display: none;
        }


        @keyframes mobileCenterModalAnim {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes mobileBackdropFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes mobileDropdownAnim {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div 
        className="header-inner-row"
        style={{
          maxWidth: '1240px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: isPhoneView ? '10px' : '12px',
          boxSizing: 'border-box'
        }}
      >
        {/* Left side: Mandal Logo + Title & Location */}
        <div 
          className="header-brand-wrap"
          onClick={() => handleNav('home')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isPhoneView ? '10px' : '14px', 
            cursor: 'pointer', 
            minWidth: 0, 
            flex: '1 1 auto' 
          }}
        >
          {/* Prominent Golden-bordered Mandal Logo */}
          <div 
            className="mandal-logo-wrap"
            style={{
              width: isPhoneView ? '48px' : '54px',
              height: isPhoneView ? '48px' : '54px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #FFB300',
              boxShadow: isPhoneView ? '0 0 12px rgba(255, 179, 0, 0.55)' : '0 0 16px rgba(255, 179, 0, 0.55), inset 0 0 10px rgba(0,0,0,0.5)',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <img 
              src={logoUrl} 
              alt="Yuva Yuvak Mandal Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>

          <div className="header-brand-text" style={{ minWidth: 0, flex: '1 1 auto' }}>
            <h1 
              className="heading-font gold-text mandal-title-text" 
              style={{
                fontSize: isPhoneView ? 'clamp(16px, 4.2vw, 20px)' : 'clamp(18px, 3.5vw, 24px)',
                margin: 0,
                lineHeight: 1.15,
                textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 10px rgba(255,179,0,0.3)',
                letterSpacing: '0.4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              <Translate text={
                (currentLang !== 'EN' && (!siteData?.mandalName || siteData.mandalName.toLowerCase().includes('yuva yuvak mandal')))
                  ? (t.mandalName || (currentLang === 'GU' ? 'યુવા યુવક મંડળ' : 'युवा युवक मंडल'))
                  : (siteData?.mandalName ? siteData.mandalName.replace('🚩', '').trim() : (t.mandalName || 'YUVA YUVAK MANDAL'))
              } />
            </h1>
            <span 
              className="mandal-subtitle-text"
              style={{
                fontSize: isPhoneView ? '11px' : '11.5px',
                color: '#FFECB3',
                letterSpacing: isPhoneView ? '1px' : '1.5px',
                fontWeight: 500,
                display: 'block',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              <Translate text={siteData?.mandalLocation || (currentLang === 'GU' ? 'સુરત, ગુજરાત' : currentLang === 'HI' ? 'सूरत, गुजरात' : 'Surat, Gujarat')} />
            </span>
          </div>
        </div>

        {/* Right side group: Desktop Laptop Navigation (Image 1 style) */}
        <div 
          className="desktop-nav-group" 
          style={{
            display: isMobileScreen ? 'none' : 'flex',
            alignItems: 'center',
            gap: '18px'
          }}
        >
          {/* Desktop Horizontal Navigation Links */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {navLinks.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`header-nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Saffron/Orange Language Button */}
          <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              className="desktop-lang-btn"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                background: 'linear-gradient(135deg, #FF6F00 0%, #E65100 100%)',
                border: '1.5px solid #FFA726',
                color: '#FFFFFF',
                padding: '9px 18px',
                borderRadius: '28px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(255, 111, 0, 0.45)',
                transition: 'all 0.2s ease',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 111, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 111, 0, 0.45)';
              }}
              title="Change Language / भाषा बदलें"
            >
              <Globe size={18} color="#FFFFFF" />
              <span>{currentLangObj.name}</span>
              <ChevronDown 
                size={15} 
                color="#FFFFFF" 
                style={{ 
                  transform: isLangDropdownOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.2s ease' 
                }} 
              />
            </button>

            {/* Language Selection Popup Menu */}
            {isLangDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: '#2B0507',
                border: '1.5px solid #FFA726',
                borderRadius: '14px',
                padding: '8px 0',
                minWidth: '170px',
                boxShadow: '0 12px 35px rgba(0,0,0,0.9)',
                zIndex: 110,
                overflow: 'hidden'
              }}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setIsLangDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 18px',
                      background: currentLang === lang.code ? 'rgba(255, 111, 0, 0.25)' : 'none',
                      border: 'none',
                      color: currentLang === lang.code ? '#FFB300' : '#FFF',
                      textAlign: 'left',
                      fontSize: '13.5px',
                      fontWeight: currentLang === lang.code ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (currentLang !== lang.code) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      if (currentLang !== lang.code) e.currentTarget.style.background = 'none';
                    }}
                  >
                    <span>{lang.name}</span>
                    {currentLang === lang.code && <span style={{ color: '#FFB300', fontWeight: 800 }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side group: Mobile 3-line Menu Button (Image 2 style) */}
        <div 
          className="mobile-menu-btn-wrap" 
          style={{
            display: isMobileScreen ? 'flex' : 'none',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1002,
            flexShrink: 0
          }}
        >
          <button
            ref={mobileMenuBtnRef}
            className="mobile-hamburger-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMobileMenuOpen(prev => !prev);
            }}
            aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
            title={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
            style={{
              width: '44px',
              height: '44px',
              background: 'rgba(255, 179, 0, 0.15)',
              border: '1.5px solid #FFB300',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
              position: 'relative',
              zIndex: 1002,
              pointerEvents: 'auto',
              flexShrink: 0
            }}
          >
            <span 
              className="mobile-hamburger-line"
              style={{
                pointerEvents: 'none',
                width: '22px',
                height: '2.5px',
                background: '#FFB300',
                borderRadius: '2px',
                transition: 'all 0.3s ease',
                transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
              }} 
            />
            <span 
              className="mobile-hamburger-line"
              style={{
                pointerEvents: 'none',
                width: '22px',
                height: '2.5px',
                background: '#FFB300',
                borderRadius: '2px',
                transition: 'all 0.3s ease',
                opacity: isMobileMenuOpen ? 0 : 1
              }} 
            />
            <span 
              className="mobile-hamburger-line"
              style={{
                pointerEvents: 'none',
                width: '22px',
                height: '2.5px',
                background: '#FFB300',
                borderRadius: '2px',
                transition: 'all 0.3s ease',
                transform: isMobileMenuOpen ? 'rotate(-45deg) translate(5px, -6px)' : 'none'
              }} 
            />
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Menu Centered Modal Overlay & Card */}
    {isMobileMenuOpen && (
      <div
        className="mobile-menu-overlay"
        onClick={() => setIsMobileMenuOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 2, 3, 0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px 16px',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
          animation: 'mobileBackdropFadeIn 0.2s ease-out forwards'
        }}
      >
        <div
          ref={mobileMenuRef}
          className="mobile-dropdown-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            maxWidth: isPhoneView ? '440px' : '300px',
            width: '100%',
            maxHeight: 'min(580px, calc(100vh - 40px))',
            overflowY: 'auto',
            margin: 'auto',
            background: 'rgba(38, 4, 6, 0.98)',
            border: '1.5px solid #FFB300',
            borderRadius: isPhoneView ? '16px' : '14px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95), 0 0 30px rgba(255, 179, 0, 0.35)',
            padding: isPhoneView ? '16px 18px' : '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isPhoneView ? '8px' : '4px',
            animation: 'mobileCenterModalAnim 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            zIndex: 1051
          }}
        >
          {/* Navigation Links in Mobile Card */}
          <div 
            className="mobile-nav-links-wrap"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              gap: isPhoneView ? '6px' : '3px'
            }}
          >
            {navLinks.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  className="mobile-nav-item-btn"
                  onClick={() => {
                    handleNav(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    padding: isPhoneView ? '10px 18px' : '5px 12px',
                    borderRadius: isPhoneView ? '14px' : '10px',
                    background: isActive ? 'rgba(255, 179, 0, 0.2)' : 'transparent',
                    border: isActive ? '1.5px solid rgba(255, 179, 0, 0.55)' : '1px solid transparent',
                    color: isActive ? '#FFB300' : '#FFECB3',
                    fontSize: isPhoneView ? '17px' : '13px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Subtle divider */}
          <div 
            className="mobile-menu-divider"
            style={{
              width: '100%',
              maxWidth: '100%',
              height: '1px',
              background: 'rgba(212, 175, 55, 0.25)',
              margin: isPhoneView ? '6px 0' : '2px 0'
            }} 
          />

          {/* Direct 1-Tap Saffron Language Selector in Mobile Menu */}
          <div className="mobile-lang-container" style={{ width: '100%', maxWidth: '100%', marginTop: '3px' }}>
            <div 
              className="mobile-lang-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#FFB300',
                fontSize: isPhoneView ? '13.5px' : '11px',
                fontWeight: 700,
                marginBottom: isPhoneView ? '8px' : '4px',
                letterSpacing: '0.8px',
                textTransform: 'uppercase'
              }}
            >
              <Globe size={isPhoneView ? 15 : 12} color="#FFB300" /> Language
            </div>

            <div 
              className="mobile-lang-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: isPhoneView ? '6px' : '4px',
                background: 'rgba(20, 2, 3, 0.8)',
                padding: isPhoneView ? '4px' : '2px',
                borderRadius: isPhoneView ? '16px' : '12px',
                border: '1.5px solid rgba(255, 179, 0, 0.45)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}
            >
              {languages.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    className="mobile-lang-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      changeLanguage(lang.code);
                      setTimeout(() => {
                        setIsMobileMenuOpen(false);
                      }, 220);
                    }}
                    style={{
                      padding: isPhoneView ? '8px 4px' : '5px 4px',
                      borderRadius: isPhoneView ? '12px' : '10px',
                      background: isSelected ? 'linear-gradient(135deg, #FF6F00 0%, #E65100 100%)' : 'transparent',
                      border: isSelected ? '1.5px solid #FFA726' : '1px solid transparent',
                      color: isSelected ? '#FFFFFF' : '#FFECB3',
                      fontSize: isPhoneView ? '14px' : '12px',
                      fontWeight: isSelected ? 800 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 3px 12px rgba(255, 111, 0, 0.55)' : 'none',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{lang.name}</span>
                    {isSelected && <span style={{ fontSize: isPhoneView ? '12px' : '10px', color: '#FFF' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Fixed header spacer so page content starts cleanly below header with zero gap */}
    <div 
      className="header-fixed-spacer"
      aria-hidden="true"
      style={{
        width: '100%',
        height: `${headerHeight}px`,
        visibility: 'hidden',
        pointerEvents: 'none',
        flexShrink: 0
      }}
    />
  </>
  );
}
