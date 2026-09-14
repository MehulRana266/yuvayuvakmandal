import React, { useContext, useState, useRef, useEffect } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext, resolveMediaUrl } from '../context/SiteDataContext';
import { Tv, Play, Pause, Volume2, VolumeX, Film } from 'lucide-react';
import { Translate } from '../utils/useAutoTranslate';

// Helper to extract YouTube Video ID
function getYouTubeId(url) {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:') || /\.(mp4|webm|mov|mkv|avi|m4v|ogv|3gp|mpeg|mpg|wmv|flv|mpe|ogm|asx)(\?.*)?$/i.test(url)) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2] && match[2].length === 11) ? match[2] : null;
}

// Convert any YouTube link to embed format with controlled autoplay
function getYouTubeEmbedUrl(url, autoPlay = false) {
  const videoId = getYouTubeId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&mute=0&rel=0&enablejsapi=1`;
  }
  return null;
}

export default function BigScreenVideo() {
  const { t, currentLang } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);
  const [currentIdx, setCurrentIdx] = useState(0);
  // Stopped by default when page opens:
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const userInitiatedPlayRef = useRef(false);

  // Extract playlist from bigScreenVideos or legacy videoUrl
  const playlist = (() => {
    if (Array.isArray(siteData?.bigScreenVideos) && siteData.bigScreenVideos.length > 0) {
      const valid = siteData.bigScreenVideos.filter(v => v && Boolean(String(v.url || '').trim()));
      if (valid.length > 0) return valid;
    }
    if (siteData?.videoUrl && String(siteData.videoUrl).trim()) {
      return [{ id: 'main', title: '', url: siteData.videoUrl }];
    }
    return [];
  })();

  const validIdx = currentIdx < playlist.length ? currentIdx : 0;
  const currentVideo = playlist[validIdx] || null;
  const videoSrc = resolveMediaUrl(currentVideo?.url || "");
  const ytVideoId = getYouTubeId(videoSrc);
  const isYouTube = Boolean(ytVideoId);

  const handleVideoEnded = () => {
    if (playlist.length > 1) {
      setCurrentIdx(prev => (prev + 1) % playlist.length);
    } else {
      setIsPlaying(false);
      userInitiatedPlayRef.current = false;
    }
  };

  const handlePlay = (e) => {
    if (e) e.stopPropagation();
    userInitiatedPlayRef.current = true;

    if (isYouTube) {
      setIsPlaying(true);
      return;
    }

    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Play error:", err);
      });
    }
  };

  const handlePause = (e) => {
    if (e) e.stopPropagation();
    userInitiatedPlayRef.current = false;
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
  };

  const togglePlayPause = (e) => {
    if (isPlaying) {
      handlePause(e);
    } else {
      handlePlay(e);
    }
  };

  const toggleSound = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Sync video source change: Keep paused unless user previously clicked play for playlist
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (userInitiatedPlayRef.current && isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [videoSrc, validIdx]);

  // Stop video ONLY when it is COMPLETELY scrolled out of view (0% visible)
  useEffect(() => {
    if (!isPlaying) return;

    const stopVideo = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      userInitiatedPlayRef.current = false;
      setIsPlaying(false);
    };

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const winHeight = window.innerHeight || document.documentElement.clientHeight;
      const headerOffset = 75; // sticky header height

      // Stop ONLY when the entire video has completely scrolled off-screen:
      // 1. Completely scrolled up past the top header (rect.bottom <= headerOffset)
      // 2. Completely scrolled down below the bottom of the screen (rect.top >= winHeight)
      // If even half or any part of the video is visible on screen, it does NOT stop!
      const isCompletelyOffScreen = rect.bottom <= headerOffset || rect.top >= winHeight;

      if (isCompletelyOffScreen) {
        stopVideo();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPlaying]);

  // IntersectionObserver: Ensure video stops when 100% off screen (0% intersection)
  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // As long as any part of the video is on screen, keep playing!
          // Only stop when completely off-screen (not intersecting and ratio <= 0)
          if (!entry.isIntersecting && entry.intersectionRatio <= 0) {
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
            }
            userInitiatedPlayRef.current = false;
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '-75px 0px 0px 0px'
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="bigscreen" style={{ padding: '38px 20px 40px', maxWidth: '1100px', margin: '0 auto' }}>
      <style>{`
        .bigscreen-header-title {
          font-size: clamp(22px, 3.5vw, 32px);
          margin: 0;
          text-align: center;
          line-height: 1.35;
          letter-spacing: 0.5px;
        }
        .bigscreen-header-icon {
          display: inline-block !important;
          vertical-align: -4px !important;
          margin-right: 8px !important;
          width: 28px !important;
          height: 28px !important;
        }
        .bigscreen-player-wrap {
          padding-bottom: 52% !important;
          border: 2px solid #FFD700 !important;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.25), 0 15px 40px rgba(0, 0, 0, 0.8) !important;
        }
        .bigscreen-player-wrap:hover {
          border-color: #FFE082 !important;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(255, 215, 0, 0.35) !important;
        }
        .bigscreen-sound-wrap {
          top: 12px;
          right: 12px;
        }
        .bigscreen-badge-wrap {
          bottom: 12px;
          left: 12px;
        }
          .bigscreen-sound-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.65) !important;
            border: 2px solid #FFD700 !important;
            color: #FFD700 !important;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            backdrop-filter: blur(6px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
            outline: none !important;
            -webkit-tap-highlight-color: transparent !important;
            animation: none !important;
          }
          .bigscreen-sound-btn:focus,
          .bigscreen-sound-btn:focus-visible {
            outline: none !important;
          }
          .bigscreen-play-btn {
            outline: none !important;
            -webkit-tap-highlight-color: transparent !important;
            animation: none !important;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6) !important;
          }
          .bigscreen-play-btn:focus,
          .bigscreen-play-btn:focus-visible {
            outline: none !important;
          }
          @media (hover: hover) and (pointer: fine) {
            .bigscreen-sound-btn:hover {
              border-color: #FFD700 !important;
              background: rgba(255, 215, 0, 0.25) !important;
            }
            .bigscreen-play-btn:hover {
              background: rgba(255, 215, 0, 0.25) !important;
            }
          }
          @media (max-width: 768px) {
            #bigscreen {
              padding: 32px 20px 32px !important;
            }
            .bigscreen-header-title {
              font-size: clamp(14px, 4.3vw, 19px) !important;
              line-height: 1.35 !important;
              padding: 0 4px !important;
            }
            .bigscreen-header-icon {
              width: 20px !important;
              height: 20px !important;
              vertical-align: -3px !important;
              margin-right: 6px !important;
            }
            .bigscreen-player-wrap {
              border: 2px solid #FFD700 !important;
              border-radius: 20px !important;
              padding-bottom: 52% !important;
            }
            .bigscreen-sound-wrap {
              top: 10px !important;
              right: 10px !important;
            }
            .bigscreen-sound-btn {
              width: 36px !important;
              height: 36px !important;
            }
            .bigscreen-sound-btn svg {
              width: 18px !important;
              height: 18px !important;
            }
            .bigscreen-badge-wrap {
              bottom: 10px !important;
              left: 10px !important;
            }
            .bigscreen-badge-inner {
              padding: 4px 10px !important;
              border-radius: 6px !important;
            }
            .bigscreen-badge-inner span {
              font-size: 11.5px !important;
              letter-spacing: 0.8px !important;
            }
            .bigscreen-play-btn {
              width: 48px !important;
              height: 48px !important;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6) !important;
              border-width: 2px !important;
              animation: none !important;
            }
            .bigscreen-play-btn svg {
              width: 20px !important;
              height: 20px !important;
              margin-left: 2px !important;
            }
          }

          /* EXTRA SMALL MOBILE (<= 400px) Matching Schedule exactly */
          @media (max-width: 400px) {
            #bigscreen {
              padding: 25px 14px 24px !important;
            }
          }
      `}</style>
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <h2 className="heading-font gold-text bigscreen-header-title">
          <Tv className="bigscreen-header-icon" color="#FFB300" />
          <Translate text={siteData?.bigScreenHeaderTitle || t.bigScreenHeader || "FEEL THE DEVOTION - ON THE BIG SCREEN"} />
        </h2>
        
        <div style={{
          width: '70px',
          height: '3px',
          background: 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)',
          margin: '10px auto 0',
          borderRadius: '2px'
        }} />
      </div>

      {/* Single Unified Royal Video Box (1 Box Only) */}
      <div 
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={togglePlayPause}
        className="bigscreen-player-wrap mobile-entrance-fade-up"
        style={{
          position: 'relative',
          height: 0,
          borderRadius: '20px',
          overflow: 'hidden',
          background: '#000',
          border: '2px solid #FFD700',
          boxShadow: '0 0 15px rgba(255, 215, 0, 0.25), 0 15px 40px rgba(0, 0, 0, 0.8)',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
          {playlist.length === 0 ? (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <h3 style={{
                color: '#FFD700',
                fontSize: 'clamp(18px, 3.5vw, 24px)',
                margin: 0,
                fontWeight: 700,
                letterSpacing: '1.2px',
                fontFamily: "'Cinzel', serif",
                textAlign: 'center',
                textShadow: '0 2px 12px rgba(255, 215, 0, 0.25)'
              }}>
                {t.videoComingSoon || "Video Coming Soon"}
              </h3>
            </div>
          ) : isYouTube ? (
            <>
              {isPlaying ? (
                <iframe 
                  key={`yt-${validIdx}-${videoSrc}`}
                  src={getYouTubeEmbedUrl(videoSrc, true)} 
                  title={currentVideo?.title || "Yuva Yuvak Mandal Big Screen Devotion"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                />
              ) : (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000' }}>
                  {ytVideoId && (
                    <img 
                      src={`https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`}
                      alt="YouTube Video Thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                    />
                  )}
                  {/* Center Golden Play Button */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 5,
                      pointerEvents: 'auto'
                    }}
                  >
                    <button
                      type="button"
                      onClick={handlePlay}
                      aria-label="Play Video"
                      title="Click to Play"
                      className="bigscreen-play-btn"
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.75)',
                        border: '2px solid #FFD700',
                        color: '#FFD700',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        transition: 'none',
                        animation: 'none'
                      }}
                    >
                      <Play size={26} color="#FFD700" style={{ marginLeft: '3px' }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <video 
                ref={videoRef}
                key={`vid-${validIdx}-${videoSrc}`}
                src={videoSrc} 
                loop={playlist.length <= 1}
                onEnded={handleVideoEnded}
                muted={isMuted}
                playsInline 
                controls={false}
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* 1. Center Play Button (Visible whenever video is stopped/paused) */}
              {!isPlaying && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 5,
                    pointerEvents: 'auto'
                  }}
                >
                  <button
                    type="button"
                    onClick={handlePlay}
                    aria-label="Play Video"
                    title="Click to Play"
                    className="bigscreen-play-btn"
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.75)',
                      border: '2px solid #FFD700',
                      color: '#FFD700',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(8px)',
                      transition: 'none',
                      animation: 'none'
                    }}
                  >
                    <Play size={26} color="#FFD700" style={{ marginLeft: '3px' }} />
                  </button>
                </div>
              )}


              {/* 2. Top-Right Sound Button */}
              <div 
                className="bigscreen-sound-wrap"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 10,
                  pointerEvents: 'auto'
                }}
              >
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
                  title={isMuted ? "Unmute Audio" : "Mute Audio"}
                  className="bigscreen-sound-btn"
                >
                  {isMuted ? (
                    <VolumeX size={19} color="#FFD700" />
                  ) : (
                    <Volume2 size={19} color="#FFD700" />
                  )}
                </button>
              </div>

              {/* 3. Bottom-Left Caption Overlay */}
              {currentVideo?.title && currentVideo.title.trim() && (
                <div 
                  className="bigscreen-badge-wrap"
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}
                >
                  <div 
                    className="bigscreen-badge-inner"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(0, 0, 0, 0.72)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(212, 175, 55, 0.45)',
                      padding: '5px 13px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    <span style={{
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      fontFamily: "'Outfit', sans-serif"
                    }}>
                      <Translate text={currentVideo.title} />
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
    </section>
  );
}
