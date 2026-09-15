import React, { useContext, useState, useEffect, useRef } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext, resolveMediaUrl } from '../context/SiteDataContext';
import { Volume2, VolumeX } from 'lucide-react';
import { Translate } from '../utils/useAutoTranslate';

export default function HeroBanner({ activeView = 'home' }) {
  const { t, currentLang } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);
  const videoRef = useRef(null);
  const heroRef = useRef(null);
  const iframeRef = useRef(null);
  const lastBannerTimeRef = useRef(0);

  const hasTargetCountdown = Boolean(siteData.targetDateStr && String(siteData.targetDateStr).trim());
  const targetTimestamp = hasTargetCountdown ? new Date(siteData.targetDateStr).getTime() : null;

  const calculateTimeLeft = (target) => {
    if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const now = new Date().getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      expired: false
    };
  };

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetTimestamp));

  useEffect(() => {
    if (!targetTimestamp) return;

    setTimeLeft(calculateTimeLeft(targetTimestamp));
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetTimestamp));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTimestamp]);

  const mediaType = siteData.bannerMediaType || 'photo';
  const bannerBg = resolveMediaUrl(siteData.bannerImageUrl || '');
  const bannerVideo = resolveMediaUrl(siteData.bannerVideoUrl || '');
  const isVideo = mediaType === 'video' && Boolean(bannerVideo);
  
  // Alignment & Sound Options
  const alignment = siteData.bannerTextAlignment || 'left'; // 'left', 'center', 'right'
  const bannerVideoSound = siteData.bannerVideoSound || 'off'; // 'off' (muted w/ toggle), 'on' (unmuted w/ toggle), 'no_sound' (no sound & toggle hidden)
  const isNoSound = bannerVideoSound === 'no_sound' || bannerVideoSound === 'none' || bannerVideoSound === 'disabled';

  // Always start isMuted as true so the UI never falsely displays "Sound ON" if the browser blocks audio
  const [isMuted, setIsMuted] = useState(true);
  // Track whether user (or admin default 'on') wants audio active
  const userWantsAudioRef = useRef(bannerVideoSound === 'on');

  const postToYouTube = (func) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: func,
          args: []
        }), '*');
      } catch (e) {}
    }
  };

  const isAudioPlaybackAllowed = () => {
    if (typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive) {
      return true;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const isRunning = ctx.state === 'running';
        ctx.close().catch(() => {});
        return isRunning;
      }
    } catch (e) {}
    return false;
  };

  const safeUnmute = () => {
    if (isNoSound) return;
    const video = videoRef.current;
    if (!video) return;

    // Check if browser actually permits audio output right now
    const audioAllowed = isAudioPlaybackAllowed();

    if (!audioAllowed) {
      // Browser autoplay policy restricts audio on cold load without prior user gesture.
      // Keep video smoothly playing muted, and DO NOT falsely display "Sound ON" in UI.
      video.muted = true;
      video.defaultMuted = true;
      setIsMuted(true);
      video.play().catch(() => {});
      return;
    }

    // Audio is genuinely allowed by browser or user interaction
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1.0;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsMuted(false);
          postToYouTube('unMute');
        })
        .catch(() => {
          video.muted = true;
          video.defaultMuted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
    } else {
      setIsMuted(false);
      postToYouTube('unMute');
    }
  };

  const safeMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
    }
    setIsMuted(true);
    postToYouTube('mute');
  };

  // Direct, reliable toggle on Mute/Unmute button click
  const handleToggleSound = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isNoSound) return;
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      // User clicked to UNMUTE (Click is a user gesture, so audio is guaranteed to work!)
      userWantsAudioRef.current = true;
      video.muted = false;
      video.defaultMuted = false;
      video.volume = 1.0;
      video.play().then(() => {
        setIsMuted(false);
        postToYouTube('unMute');
      }).catch(() => {
        setIsMuted(false);
      });
    } else {
      // User clicked to MUTE
      userWantsAudioRef.current = false;
      video.muted = true;
      video.defaultMuted = true;
      setIsMuted(true);
      postToYouTube('mute');
    }
  };

  // Sync when admin setting changes dynamically in CMS
  useEffect(() => {
    userWantsAudioRef.current = (bannerVideoSound === 'on');
    if (bannerVideoSound === 'on') {
      safeUnmute();
    } else {
      safeMute();
    }
  }, [bannerVideoSound, isNoSound]);

  // 1. Initial video playback on page load / refresh
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (bannerVideoSound === 'on') {
      userWantsAudioRef.current = true;
      safeUnmute();
    } else {
      userWantsAudioRef.current = false;
      safeMute();
      video.play().catch(() => {});
    }

    const checkPlaying = () => {
      const v = videoRef.current;
      if (v && v.paused) {
        v.muted = true;
        v.play().catch(() => {});
      }
    };
    const t1 = setTimeout(checkPlaying, 150);
    const t2 = setTimeout(checkPlaying, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [bannerVideo, bannerVideoSound]);

  // If admin set Sound ON and browser deferred audio on cold load, unmute on first gesture
  useEffect(() => {
    if (bannerVideoSound !== 'on') return;

    const onUserInteraction = (e) => {
      // Don't interfere if user clicked the sound toggle button directly (button handles its own toggle)
      if (e && e.target && e.target.closest && e.target.closest('button[aria-label*="Mute"]')) {
        return;
      }

      window.removeEventListener('click', onUserInteraction, true);
      window.removeEventListener('touchstart', onUserInteraction, true);
      window.removeEventListener('pointerdown', onUserInteraction, true);
      window.removeEventListener('keydown', onUserInteraction, true);

      if (userWantsAudioRef.current) {
        const video = videoRef.current;
        if (video) {
          video.muted = false;
          video.defaultMuted = false;
          video.volume = 1.0;
          video.play().then(() => {
            setIsMuted(false);
            postToYouTube('unMute');
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('click', onUserInteraction, { capture: true, passive: true });
    window.addEventListener('touchstart', onUserInteraction, { capture: true, passive: true });
    window.addEventListener('pointerdown', onUserInteraction, { capture: true, passive: true });
    window.addEventListener('keydown', onUserInteraction, { capture: true, passive: true });

    return () => {
      window.removeEventListener('click', onUserInteraction, true);
      window.removeEventListener('touchstart', onUserInteraction, true);
      window.removeEventListener('pointerdown', onUserInteraction, true);
      window.removeEventListener('keydown', onUserInteraction, true);
    };
  }, [bannerVideoSound]);

  // 2. Maintain continuous playback & mute when switching between views
  useEffect(() => {
    if (activeView !== 'home') {
      // Switched to another page (Gallery/Schedule/About/Contact): MUTE audio
      safeMute();
    } else {
      // Switched back to home page: continuous playback
      const video = videoRef.current;
      if (video) {
        if (lastBannerTimeRef.current > 0 && Math.abs(video.currentTime - lastBannerTimeRef.current) > 2) {
          video.currentTime = lastBannerTimeRef.current;
        }
        if (video.paused) {
          video.play().catch(() => {});
        }
      }

      // If user enabled audio AND hero banner is in view, unmute
      const heroEl = heroRef.current;
      if (heroEl && !isNoSound && userWantsAudioRef.current) {
        const rect = heroEl.getBoundingClientRect();
        if (rect.bottom > 150) {
          safeUnmute();
        }
      }
    }
  }, [activeView, isNoSound]);

  // 3. Scroll detection: Mute sound when scrolling away from banner, unmute sound when returning to banner
  useEffect(() => {
    if (isNoSound) return;

    const handleScroll = () => {
      if (activeView && activeView !== 'home') {
        safeMute();
        return;
      }

      const heroEl = heroRef.current;
      if (!heroEl) return;

      const rect = heroEl.getBoundingClientRect();
      const headerOffset = 75; // sticky header

      const inView = rect.bottom > headerOffset + 80 && rect.top < window.innerHeight - 80;

      if (inView) {
        // Scrolled back to banner!
        // Only unmute if the user has explicitly turned sound on (or admin set sound 'on')
        if (userWantsAudioRef.current && isMuted) {
          safeUnmute();
        }
      } else {
        // Scrolled away from banner -> Mute sound!
        if (!isMuted) {
          safeMute();
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeView, isNoSound, isMuted]);

  const getIsPhoneView = () => {
    if (typeof window === 'undefined') return false;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobileUA || window.innerWidth <= 768;
  };

  const [isPhoneView, setIsPhoneView] = useState(getIsPhoneView);

  useEffect(() => {
    const handleResize = () => {
      setIsPhoneView(getIsPhoneView());
    };
    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const getYoutubeEmbed = (url, muted) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${match[2]}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1`;
    }
    return null;
  };
  const youtubeEmbed = isVideo ? getYoutubeEmbed(bannerVideo, isMuted) : null;
  
  const taglineLines = (() => {
    if (Array.isArray(siteData.heroTaglineLines) && siteData.heroTaglineLines.length > 0) {
      return siteData.heroTaglineLines.map(s => String(s || '').trim()).filter(Boolean);
    }
    if (siteData.heroTagline !== undefined && siteData.heroTagline !== null && String(siteData.heroTagline).trim()) {
      return String(siteData.heroTagline).split('\n').map(s => String(s || '').trim()).filter(Boolean);
    }
    return t.heroTagline ? [t.heroTagline] : [];
  })();

  const containerMarginLeft = alignment === 'center' ? 'auto' : alignment === 'right' ? 'auto' : '0';
  const containerMarginRight = alignment === 'center' ? 'auto' : alignment === 'right' ? '0' : 'auto';
  const textAlignValue = alignment === 'center' ? 'center' : alignment === 'right' ? 'right' : 'left';
  const timerRowJustify = alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start';

  // Extract 5 custom lines to render with their exact original line numbers (1 to 5)
  const linesToRender = (() => {
    const rawLines = Array.isArray(siteData.heroHeadingLines) && siteData.heroHeadingLines.length === 5
      ? siteData.heroHeadingLines
      : (siteData.heroHeading ? siteData.heroHeading.split('\n') : []);

    return rawLines
      .map((text, idx) => ({ text: String(text || '').trim(), lineNum: String(idx + 1) }))
      .filter(item => item.text.length > 0);
  })();

  const getRenderedLineText = (item, idx) => {
    if (currentLang === 'EN') return item.text;

    // Check if the current lines match the standard default 4-line arrival banner
    const isStandardBanner = linesToRender.length >= 4 &&
      linesToRender[0]?.text?.toLowerCase() === 'the king of' &&
      linesToRender[1]?.text?.toLowerCase() === 'yuva yuvak mandal' &&
      linesToRender[2]?.text?.toLowerCase() === 'is arriving';

    if (isStandardBanner) {
      if (idx === 0) {
        return currentLang === 'GU' ? 'યુવા યુવક મંડળ' : 'युवा युवक मंडल';
      }
      if (idx === 1) {
        return currentLang === 'GU' ? 'ના રાજા' : 'के राजा';
      }
      if (idx === 2) {
        return currentLang === 'GU' ? 'પધારી રહ્યા છે' : 'पधार रहे हैं';
      }
      if (idx === 3) {
        return <Translate text={item.text} />;
      }
    }

    return <Translate text={item.text} />;
  };

  return (
    <section id="hero" ref={heroRef} className="hero-banner-section" style={{
      position: 'relative',
      minHeight: isPhoneView ? '535px' : '535px',
      width: '100%',
      maxWidth: '100%',
      margin: '0',
      borderRadius: '0px',
      overflow: 'hidden',
      boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
      borderBottom: '2px solid var(--gold-border)',
      background: '#2B0408',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
      paddingTop: isPhoneView ? '38px' : '38px',
      paddingBottom: isPhoneView ? '38px' : '38px',
      paddingLeft: 'clamp(18px, 3.8vw, 52px)',
      paddingRight: 'clamp(18px, 3.8vw, 52px)',
      boxSizing: 'border-box',
      transition: 'min-height 0.3s ease, padding-top 0.3s ease'
    }}>
      <style>{`
        /* DESKTOP HERO SIZING (min-width: 769px - sleek & proportional, never blows up) */
        @media (min-width: 769px) {
          #hero.hero-banner-section {
            min-height: 535px !important;
            padding-top: 38px !important;
            padding-bottom: 38px !important;
          }

          .hero-banner-title {
            font-size: clamp(22px, 3.3vw, 38px) !important;
            line-height: 1.22 !important;
            margin-bottom: 14px !important;
          }

          .hero-banner-tagline p {
            font-size: 15px !important;
            line-height: 1.42 !important;
          }

          .hero-timer-card {
            width: 70px !important;
            height: 76px !important;
            border-radius: 11px !important;
          }

          .hero-timer-num {
            font-size: 26px !important;
          }

          .hero-timer-label {
            font-size: 9.5px !important;
          }
        }

        /* Desktop when zoomed in (e.g. 110%, 125% zoom where viewport <= 990px and > 768px) */
        @media (min-width: 769px) and (max-width: 990px) {
          #hero.hero-banner-section {
            min-height: 495px !important;
            padding-top: 32px !important;
            padding-bottom: 32px !important;
          }
          .hero-banner-title {
            font-size: clamp(21px, 3.1vw, 32px) !important;
            line-height: 1.26 !important;
            margin-bottom: 12px !important;
          }
          .hero-banner-tagline {
            margin-bottom: 12px !important;
          }
          .hero-banner-tagline p {
            font-size: 14px !important;
            line-height: 1.4 !important;
          }
          .hero-timer-card {
            width: 64px !important;
            height: 70px !important;
            border-radius: 10px !important;
          }
          .hero-timer-num {
            font-size: 24px !important;
          }
          .hero-timer-label {
            font-size: 9px !important;
          }
        }

        .hero-sound-toggle-btn {
          top: 22px !important;
          right: 22px !important;
          bottom: auto !important;
        }

        /* RESPONSIVE VIEW (Tablets, Mobile & Devtools <= 768px) */
        @media (max-width: 768px) {
          #hero.hero-banner-section {
            justify-content: center !important;
            align-items: ${alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start'} !important;
            padding-top: 38px !important;
            padding-bottom: 38px !important;
            padding-left: 18px !important;
            padding-right: 18px !important;
            min-height: 535px !important;
          }
          .hero-content-wrap {
            margin-left: ${containerMarginLeft} !important;
            margin-right: ${containerMarginRight} !important;
            text-align: ${textAlignValue} !important;
            width: 100% !important;
          }
          .hero-banner-title {
            font-size: clamp(23px, 6.4vw, 34px) !important;
            line-height: 1.32 !important;
            margin-bottom: 10px !important;
            letter-spacing: 0.7px !important;
            text-align: ${textAlignValue} !important;
          }
          .hero-banner-tagline {
            margin-bottom: 12px !important;
            margin-left: ${containerMarginLeft} !important;
            margin-right: ${containerMarginRight} !important;
            text-align: ${textAlignValue} !important;
          }
          .hero-banner-tagline p {
            font-size: 13.5px !important;
            line-height: 1.45 !important;
            letter-spacing: 0.25px !important;
            margin-bottom: 4px !important;
            text-align: ${textAlignValue} !important;
          }
          .hero-countdown-container {
            margin-top: 14px !important;
            text-align: ${textAlignValue} !important;
            margin-left: ${containerMarginLeft} !important;
            margin-right: ${containerMarginRight} !important;
          }
          .hero-countdown-label {
            font-size: 11px !important;
            letter-spacing: 1.6px !important;
            margin-bottom: 8px !important;
            text-align: ${textAlignValue} !important;
          }
          .hero-timer-cards-row {
            justify-content: ${timerRowJustify} !important;
            gap: 9px !important;
          }
          .hero-timer-card {
            width: 65px !important;
            height: 70px !important;
            border-radius: 11px !important;
          }
          .hero-timer-num {
            font-size: 24px !important;
          }
          .hero-timer-label {
            font-size: 9px !important;
          }
          .hero-sound-toggle-btn {
            top: 14px !important;
            right: 14px !important;
            bottom: auto !important;
            width: 42px !important;
            height: 42px !important;
          }
          .hero-sound-toggle-btn svg {
            width: 21px !important;
            height: 21px !important;
          }
        }

        /* EXTRA SMALL MOBILE (<= 380px) */
        @media (max-width: 380px) {
          #hero.hero-banner-section {
            padding-left: 14px !important;
            padding-right: 14px !important;
            padding-bottom: 30px !important;
            min-height: 500px !important;
            justify-content: center !important;
            align-items: ${alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start'} !important;
          }
          .hero-banner-title {
            font-size: clamp(21px, 6vw, 28px) !important;
            line-height: 1.28 !important;
            letter-spacing: 0.6px !important;
            margin-bottom: 10px !important;
            text-align: ${textAlignValue} !important;
          }
          .hero-countdown-container {
            margin-top: 12px !important;
            text-align: ${textAlignValue} !important;
          }
          .hero-timer-cards-row {
            justify-content: ${timerRowJustify} !important;
            gap: 7px !important;
          }
          .hero-timer-card {
            width: 58px !important;
            height: 63px !important;
            border-radius: 9px !important;
          }
          .hero-timer-num {
            font-size: 21px !important;
          }
          .hero-timer-label {
            font-size: 8.5px !important;
          }
          .hero-sound-toggle-btn {
            top: 12px !important;
            right: 12px !important;
            bottom: auto !important;
            width: 36px !important;
            height: 36px !important;
          }
          .hero-sound-toggle-btn svg {
            width: 18px !important;
            height: 18px !important;
          }
        }
      `}</style>
      {/* Background Media: Photo or Video */}
      {isVideo ? (
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none'
        }}>
          {youtubeEmbed ? (
            <iframe
              ref={iframeRef}
              src={youtubeEmbed}
              title="Hero Background Video"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                border: 'none',
                objectFit: 'cover'
              }}
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          ) : (
            <video
              ref={videoRef}
              key={bannerVideo}
              src={bannerVideo}
              autoPlay
              loop
              muted={isMuted}
              defaultMuted={true}
              playsInline
              webkit-playsinline="true"
              preload="auto"
              onTimeUpdate={(e) => {
                if (e.target.currentTime > 0) {
                  lastBannerTimeRef.current = e.target.currentTime;
                }
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            >
              <source src={bannerVideo} />
            </video>
          )}
        </div>
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: bannerBg ? `url("${bannerBg}"), url("/hero-bg.jpg")` : 'url("/hero-bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0
        }} />
      )}

      {/* Dark & Gold Royal Gradient Overlay */}
      <div 
        className="hero-gradient-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background: alignment === 'center' 
            ? 'radial-gradient(circle at center, rgba(43, 5, 7, 0.65) 0%, rgba(20, 2, 3, 0.92) 100%)'
            : alignment === 'right'
            ? 'linear-gradient(270deg, rgba(43, 5, 7, 0.95) 0%, rgba(20, 2, 3, 0.75) 50%, rgba(0, 0, 0, 0.4) 100%)'
            : 'linear-gradient(90deg, rgba(43, 5, 7, 0.95) 0%, rgba(20, 2, 3, 0.75) 50%, rgba(0, 0, 0, 0.4) 100%)',
          zIndex: 1
        }} 
      />

      {/* Sound Toggle Button (Pure Icon Only - Positioned Top Right) */}
      {isVideo && bannerVideoSound !== 'no_sound' && !youtubeEmbed && (
        <button
          onClick={handleToggleSound}
          type="button"
          className="hero-sound-toggle-btn"
          aria-label={isMuted ? (t.soundOff || 'Unmute Video') : (t.soundOn || 'Mute Video')}
          title={isMuted ? (bannerVideoSound === 'on' ? (t.tapToUnmute || 'Default Sound ON • Tap to Unmute') : (t.soundOff || 'Click to Unmute')) : (t.soundOn || 'Click to Mute')}
          style={{
            position: 'absolute',
            top: isPhoneView ? '16px' : '24px',
            right: isPhoneView ? '16px' : '24px',
            bottom: 'auto',
            zIndex: 35,
            width: isPhoneView ? '44px' : '48px',
            height: isPhoneView ? '44px' : '48px',
            borderRadius: '50%',
            background: 'rgba(30, 3, 5, 0.92)',
            border: '2px solid #FFB300',
            color: '#FFB300',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
            transition: 'transform 0.2s ease',
            pointerEvents: 'auto',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isMuted ? <VolumeX size={24} color="#FFB300" /> : <Volume2 size={24} color="#FFB300" />}
        </button>
      )}

      {/* Content Layer with Dynamic Alignment */}
      <div 
        className="hero-content-wrap mobile-entrance-fade-up"
        style={{
          position: 'relative',
          zIndex: 4,
          maxWidth: '840px',
          width: '100%',
          textAlign: textAlignValue,
          marginLeft: containerMarginLeft,
          marginRight: containerMarginRight
        }}
      >
        
        {/* Dynamic 5-Line Royal Title (Hidden when all lines are empty) */}
        {linesToRender.length > 0 && (
          <h1 className="hero-banner-title" style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(24px, 3.5vw, 42px)',
            fontWeight: 900,
            color: '#FFB300',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 179, 0, 0.4)',
            lineHeight: 1.22,
            letterSpacing: '0.8px',
            marginBottom: '16px',
            textAlign: textAlignValue
          }}>
            {linesToRender.map((item, idx) => {
              const isHighlight = String(siteData.heroHeadingHighlightLine) === item.lineNum;
              const content = getRenderedLineText(item, idx);
              return (
                <React.Fragment key={idx}>
                  {isHighlight ? (
                    <span style={{ color: '#FFE082', textShadow: '0 0 18px rgba(255,224,130,0.6)' }}>
                      {content}
                    </span>
                  ) : (
                    content
                  )}
                  {idx < linesToRender.length - 1 && <br />}
                </React.Fragment>
              );
            })}
          </h1>
        )}

        {/* Dynamic Tagline Lines (Hidden completely when empty in Admin) */}
        {taglineLines.length > 0 && (
          <div className="hero-banner-tagline" style={{
            maxWidth: '640px',
            marginBottom: '20px',
            textAlign: textAlignValue,
            marginLeft: containerMarginLeft,
            marginRight: containerMarginRight
          }}>
            {taglineLines.map((lineText, idx) => (
              <p key={idx} style={{
                fontSize: '15px',
                color: '#FFFFFF',
                lineHeight: 1.45,
                margin: idx < taglineLines.length - 1 ? '0 0 4px 0' : '0',
                opacity: 0.95,
                textAlign: textAlignValue
              }}>
                <Translate text={lineText} />
              </p>
            ))}
          </div>
        )}

        {/* Countdown Timer Section (Hidden completely when Target Date & Time is empty in Admin) */}
        {hasTargetCountdown && targetTimestamp > 0 && (
          <div className="hero-countdown-container" style={{
            textAlign: textAlignValue,
            marginLeft: containerMarginLeft,
            marginRight: containerMarginRight
          }}>
            {/* Countdown Label */}
            <div className="hero-countdown-label" style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#FFB300',
              letterSpacing: '2px',
              marginBottom: '12px',
              textTransform: 'uppercase',
              textAlign: textAlignValue
            }}>
              {t.countdownLabel}
            </div>

            {/* 4 Cards Timer */}
            <div className="hero-timer-cards-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: timerRowJustify }}>
              <div className="hero-timer-card" style={timerCardStyle}>
                <span className="hero-timer-num" style={numberStyle}>{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="hero-timer-label" style={labelStyle}>{t.days}</span>
              </div>

              <div className="hero-timer-card" style={timerCardStyle}>
                <span className="hero-timer-num" style={numberStyle}>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="hero-timer-label" style={labelStyle}>{t.hours}</span>
              </div>

              <div className="hero-timer-card" style={timerCardStyle}>
                <span className="hero-timer-num" style={numberStyle}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="hero-timer-label" style={labelStyle}>{t.mins}</span>
              </div>

              <div className="hero-timer-card" style={timerCardStyle}>
                <span className="hero-timer-num" style={numberStyle}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="hero-timer-label" style={labelStyle}>{t.secs}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const timerCardStyle = {
  width: '72px',
  height: '78px',
  background: 'rgba(74, 11, 14, 0.85)',
  border: '1.5px solid rgba(255, 179, 0, 0.6)',
  borderRadius: '13px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
};

const numberStyle = {
  fontSize: '27px',
  fontWeight: 800,
  color: '#FFB300',
  lineHeight: 1
};

const labelStyle = {
  fontSize: '10px',
  fontWeight: 600,
  color: '#FFECB3',
  marginTop: '4px',
  letterSpacing: '0.8px'
};
