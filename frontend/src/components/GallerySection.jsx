import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext } from '../context/SiteDataContext';
import { Image, Video, Folder, Sparkles, X, Play, Maximize2, ArrowLeft } from 'lucide-react';

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    const videoId = match[2];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1`;
  }
  return null;
}

function getYouTubeThumbnail(url) {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
  }
  return null;
}

function getInstagramEmbedUrl(url) {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return null;
  const match = url.match(/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
  if (match && match[1]) {
    return `https://www.instagram.com/p/${match[1]}/embed/`;
  }
  return null;
}

export default function GallerySection() {
  const { t, currentLang } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);
  
  const currentMandalName = siteData?.mandalName ? siteData.mandalName.replace('🚩', '').trim() : 'YUVA YUVAK MANDAL';

  const getDisplayTitle = (item) => {
    if (!item) return '';
    const cleanMandal = currentMandalName.toUpperCase();
    const year = item.year || activeFolderYear || '';
    const type = (item.type || 'Media').toUpperCase();
    
    // Connects title dynamically with the Mandal Name from Header/Admin CMS
    if (!item.title || item.title.toLowerCase().includes('mandal') || item.title.toLowerCase().includes('yuva')) {
      return `${cleanMandal} ${year} ${type}`.trim();
    }
    return item.title;
  };

  // Helper to extract year from URL path (e.g. /gallery/2026)
  const getYearFromUrl = () => {
    const match = window.location.pathname.match(/\/gallery\/(\d{4})/i);
    return match ? match[1] : null;
  };

  const [activeFolderYear, setActiveFolderYear] = useState(getYearFromUrl);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  const galleryItems = (siteData && siteData.galleryItems) || [];

  // Dynamic automatic year calculation (Only display years that contain at least 1 photo or video)
  const allYearsArray = Array.from(new Set(
    galleryItems
      .filter(item => item && item.year && (item.url || item.videoUrl))
      .map(item => String(item.year))
  )).sort((a, b) => Number(b) - Number(a));

  // Sync activeFolderYear with URL popstate changes (browser Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      const yearFromUrl = getYearFromUrl();
      setActiveFolderYear(yearFromUrl);

      if (yearFromUrl) {
        document.title = `${yearFromUrl} Gallery | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026`;
      } else {
        document.title = `Gallery | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026`;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenFolder = (yearStr) => {
    setActiveFolderYear(yearStr);
    window.history.pushState({}, '', `/gallery/${yearStr}`);
    document.title = `${yearStr} Gallery | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026`;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleBackToFolders = () => {
    setActiveFolderYear(null);
    window.history.pushState({}, '', `/gallery`);
    document.title = `Gallery | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026`;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Compute media stats for each year
  const getYearStats = (yearStr) => {
    const items = galleryItems.filter(item => String(item.year) === yearStr);
    const photosCount = items.filter(item => item.type === 'Photo').length;
    const videosCount = items.filter(item => item.type === 'Video').length;
    const totalCount = items.length;
    const coverUrl = items.length > 0 ? items[0].url : null;
    return { photosCount, videosCount, totalCount, coverUrl, items };
  };

  // Filtered items inside an opened folder
  const currentFolderItems = activeFolderYear 
    ? galleryItems.filter(item => {
        const yearMatch = String(item.year) === String(activeFolderYear);
        const typeMatch = selectedType === 'All' || item.type === selectedType;
        return yearMatch && typeMatch;
      })
    : [];

  const activeList = currentFolderItems.length > 0
    ? currentFolderItems
    : (selectedMedia
        ? galleryItems.filter(item => String(item.year) === String(selectedMedia.year))
        : galleryItems);

  const currentMediaIndex = selectedMedia
    ? activeList.findIndex(item => 
        (selectedMedia.id && item.id && String(item.id) === String(selectedMedia.id)) ||
        (selectedMedia._id && item._id && String(item._id) === String(selectedMedia._id)) ||
        (selectedMedia.url && item.url && item.url === selectedMedia.url) ||
        (selectedMedia.videoUrl && item.videoUrl && item.videoUrl === selectedMedia.videoUrl)
      )
    : -1;

  const handleNextMedia = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (activeList.length <= 1) return;
    const nextIdx = currentMediaIndex === -1 ? 0 : (currentMediaIndex + 1) % activeList.length;
    setSelectedMedia(activeList[nextIdx]);
  };

  const handlePrevMedia = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (activeList.length <= 1) return;
    const prevIdx = currentMediaIndex === -1 ? 0 : (currentMediaIndex - 1 + activeList.length) % activeList.length;
    setSelectedMedia(activeList[prevIdx]);
  };

  // Keyboard navigation for Lightbox: Left Arrow -> Prev, Right Arrow -> Next, Escape -> Close
  useEffect(() => {
    if (!selectedMedia) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevMedia();
      } else if (e.key === 'ArrowRight') {
        handleNextMedia();
      } else if (e.key === 'Escape') {
        setSelectedMedia(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, currentMediaIndex, activeList]);

  // Touch Swipe Gesture for mobile
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) {
        handleNextMedia();
      } else {
        handlePrevMedia();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <div className="gallery-section-container mobile-entrance-fade-up" style={{ padding: '40px 20px 40px', maxWidth: '1240px', margin: '0 auto' }}>
      <style>{`
        /* Modern Lightbox Modal Styling */
        .gallery-lightbox-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(15, 2, 4, 0.95);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
          animation: fadeIn 0.2s ease-out;
        }
        .gallery-lightbox-modal {
          position: relative;
          max-width: min(92vw, 1100px);
          width: fit-content;
          max-height: 92vh;
          background: #1A0304;
          border: 1.5px solid var(--gold-border);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.95);
          display: flex;
          flex-direction: column;
          margin: auto;
          overflow: hidden;
          touch-action: pan-y pinch-zoom;
        }
        .gallery-lightbox-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          background: rgba(43, 5, 7, 0.98);
          border-bottom: 1px solid var(--gold-border);
          border-top-left-radius: 15px;
          border-top-right-radius: 15px;
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
          gap: 12px;
        }
        .gallery-lightbox-title {
          font-size: clamp(13px, 2vw, 17px);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gallery-lightbox-action-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid var(--gold-border);
          color: #FFD700;
          border-radius: 50%;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .gallery-lightbox-action-btn:hover {
          background: #FFB300;
          color: #2B0507;
          border-color: #FFF;
        }
        .gallery-lightbox-body {
          position: relative;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 0;
          margin: 0;
          width: 100%;
          border-bottom-left-radius: 15px;
          border-bottom-right-radius: 15px;
        }
        .gallery-lightbox-img {
          display: block;
          width: auto;
          max-width: min(92vw, 1100px);
          max-height: 78vh;
          height: auto;
          margin: 0 auto;
          object-fit: contain;
          border-bottom-left-radius: 15px;
          border-bottom-right-radius: 15px;
        }
        .gallery-lightbox-video {
          display: block;
          width: auto;
          max-width: min(92vw, 1100px);
          max-height: 78vh;
          height: auto;
          margin: 0 auto;
          border-bottom-left-radius: 15px;
          border-bottom-right-radius: 15px;
        }
        .gallery-lightbox-yt {
          width: min(92vw, 960px);
          aspect-ratio: 16/9;
          max-height: 78vh;
          border: none;
          display: block;
          border-bottom-left-radius: 15px;
          border-bottom-right-radius: 15px;
        }
        .gallery-lightbox-ig {
          width: min(92vw, 460px);
          height: 75vh;
          min-height: 440px;
          border: none;
          background: #FFF;
          display: block;
          margin: 0 auto;
          border-bottom-left-radius: 15px;
          border-bottom-right-radius: 15px;
        }

        /* Desktop Normal View: Enlarged Folder Cards & Image Heights */
        .gallery-folder-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 28px;
        }
        .gallery-folder-cover {
          position: relative;
          width: 100%;
          height: 300px;
          background: #0D0102;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .gallery-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }
        .gallery-media-cover {
          position: relative;
          width: 100%;
          height: 320px;
          background: #000;
          overflow: hidden;
        }

        /* Responsive Tablet View adjustments */
        @media (max-width: 880px) and (min-width: 769px) {
          .gallery-folder-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
            gap: 20px !important;
          }
          .gallery-folder-cover {
            height: 220px !important;
          }
          .gallery-media-grid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important;
            gap: 16px !important;
          }
          .gallery-media-cover {
            height: 230px !important;
          }
        }

        /* Responsive Mobile View (<= 768px): 2 Columns for Folders and Media */
        @media (max-width: 768px) {
          .gallery-section-container {
            padding: 30px 10px 40px !important;
          }
          .gallery-folder-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: clamp(8px, 2.5vw, 14px) !important;
          }
          .gallery-folder-cover {
            height: clamp(120px, 32vw, 160px) !important;
          }
          .gallery-folder-year-badge {
            top: 8px !important;
            right: 8px !important;
            padding: 3px 9px !important;
            font-size: clamp(10px, 2.7vw, 11.5px) !important;
          }
          .gallery-folder-placeholder svg {
            width: 42px !important;
            height: 42px !important;
          }
          .gallery-folder-placeholder span {
            font-size: clamp(10px, 2.6vw, 11.5px) !important;
          }
          .gallery-folder-footer {
            padding: clamp(8px, 2.2vw, 12px) clamp(8px, 2.5vw, 12px) !important;
          }
          .gallery-folder-title-wrap {
            gap: 6px !important;
            margin-bottom: 4px !important;
          }
          .gallery-folder-title {
            font-size: clamp(12px, 3.2vw, 14.5px) !important;
            line-height: 1.3 !important;
          }
          .gallery-folder-title-icon {
            width: 15px !important;
            height: 15px !important;
            flex-shrink: 0 !important;
          }
          .gallery-folder-stats {
            font-size: clamp(9px, 2.4vw, 10.5px) !important;
            gap: 4px !important;
            flex-wrap: wrap !important;
            margin-top: 4px !important;
          }
          .gallery-folder-stats svg {
            width: 12px !important;
            height: 12px !important;
            flex-shrink: 0 !important;
          }
          .gallery-media-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: clamp(8px, 2.5vw, 12px) !important;
          }
          .gallery-media-cover {
            height: clamp(130px, 34vw, 175px) !important;
          }
        }
        /* Mobile Responsive Lightbox Improvements (< 768px) */
        @media (max-width: 768px) {
          .gallery-lightbox-overlay {
            padding: 10px 8px !important;
          }
          .gallery-lightbox-modal {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            border-radius: 12px !important;
            max-height: 94vh !important;
          }
          .gallery-lightbox-header {
            padding: 10px 12px !important;
            border-top-left-radius: 11px !important;
            border-top-right-radius: 11px !important;
            gap: 8px !important;
          }
          .gallery-lightbox-title {
            font-size: 13px !important;
          }
          .gallery-lightbox-action-btn {
            width: 30px !important;
            height: 30px !important;
          }
          .gallery-lightbox-body {
            width: 100% !important;
            border-bottom-left-radius: 11px !important;
            border-bottom-right-radius: 11px !important;
          }
          .gallery-lightbox-img {
            width: 100% !important;
            max-width: 100% !important;
            max-height: 78vh !important;
            height: auto !important;
            object-fit: contain !important;
            border-bottom-left-radius: 11px !important;
            border-bottom-right-radius: 11px !important;
          }
          .gallery-lightbox-video {
            width: 100% !important;
            max-width: 100% !important;
            max-height: 78vh !important;
            border-bottom-left-radius: 11px !important;
            border-bottom-right-radius: 11px !important;
          }
          .gallery-lightbox-yt {
            width: 100% !important;
            max-width: 100% !important;
            border-bottom-left-radius: 11px !important;
            border-bottom-right-radius: 11px !important;
          }
          .gallery-lightbox-ig {
            width: 100% !important;
            max-width: 100% !important;
            min-height: 360px !important;
            border-bottom-left-radius: 11px !important;
            border-bottom-right-radius: 11px !important;
          }
        }
        .gallery-empty-state-box {
          max-width: 420px;
          width: 88%;
          margin: 0 auto;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .gallery-type-filter-bar {
            justify-content: center !important;
            padding: 12px 16px !important;
            margin-bottom: 24px !important;
          }
          .gallery-type-filter-btns {
            justify-content: center !important;
            width: 100% !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .gallery-empty-state-box {
            max-width: 320px !important;
            width: 86% !important;
            padding: 32px 18px !important;
          }
        }
        @media (max-width: 400px) {
          .gallery-type-filter-bar {
            padding: 10px 12px !important;
          }
          .gallery-empty-state-box {
            max-width: 275px !important;
            width: 88% !important;
            padding: 26px 14px !important;
          }
        }
      `}</style>
      
      {/* Header section */}
      <div style={{ textAlign: 'center', marginBottom: '38px' }}>
        <h2 className="heading-font gold-text" style={{
          fontSize: 'clamp(24px, 5vw, 34px)',
          margin: 0,
          letterSpacing: currentLang === 'EN' ? '1px' : 'normal',
          textTransform: currentLang === 'EN' ? 'uppercase' : 'none',
          lineHeight: currentLang === 'EN' ? 1.25 : 1.45
        }}>
          {activeFolderYear ? `${activeFolderYear} ${t.galleryHeader || "UTSAV GALLERY"}` : t.galleryHeader}
        </h2>

        <div style={{
          width: '80px',
          height: '3px',
          background: 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)',
          margin: '12px auto 24px',
          borderRadius: '2px'
        }} />

        <p style={{ color: '#FFECB3', fontSize: '15px', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
          {activeFolderYear 
            ? (currentLang === 'HI' ? `${activeFolderYear} गणेश उत्सव की पवित्र तस्वीरें और वीडियो देखें।` : currentLang === 'GU' ? `${activeFolderYear} ગણેશ મહોત્સવની પવિત્ર તસવીરો અને વિડિયો જુઓ.` : `Explore sacred photos and videos from Ganpati Mahotsav ${activeFolderYear}.`)
            : t.gallerySubText}
        </p>
      </div>

      {/* VIEW 1: YEAR FOLDERS OVERVIEW GRID */}
      {!activeFolderYear && (
        allYearsArray.length === 0 ? (
          <div className="gallery-empty-state-box" style={{ 
            textAlign: 'center', 
            padding: '44px 20px', 
            background: 'rgba(43, 5, 7, 0.6)', 
            border: '1px dashed var(--gold-border)', 
            borderRadius: '16px', 
            maxWidth: '420px', 
            width: '88%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}>
            <Folder size={44} color="#FFD700" style={{ marginBottom: '12px', opacity: 0.85 }} />
            <h3 style={{ color: '#FFD700', fontSize: '17px', margin: '0 0 8px', lineHeight: 1.4 }}>{t.galleryComingSoon || "Gallery Coming Soon"}</h3>
            <p style={{ color: '#FFECB3', fontSize: '13.5px', margin: 0, lineHeight: 1.5 }}>
              {currentLang === 'HI' ? "गणेश उत्सव के लिए फोटो और वीडियो जल्द ही जोड़े जाएंगे।" : currentLang === 'GU' ? "ગણેશ ઉત્સવ માટે ફોટા અને વિડિયો ટૂંક સમયમાં ઉમેરવામાં આવશે." : "Photos and videos for Ganesh Utsav will be added soon."}
            </p>
          </div>
        ) : (
          <div className="gallery-folder-grid">
          {allYearsArray.map(yearStr => {
            const stats = getYearStats(yearStr);
            const isEmpty = stats.totalCount === 0;

            return (
              <div
                key={yearStr}
                onClick={() => handleOpenFolder(yearStr)}
                style={{
                  background: 'linear-gradient(145deg, #2B0507 0%, #1A0304 100%)',
                  border: '1.5px solid var(--gold-border)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                  cursor: 'pointer',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 14px 35px rgba(255, 179, 0, 0.25)';
                  e.currentTarget.style.borderColor = '#FFD700';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.6)';
                  e.currentTarget.style.borderColor = 'var(--gold-border)';
                }}
              >
                {/* Year Badge Top Right */}
                <div className="gallery-folder-year-badge" style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'var(--gold-gradient)',
                  color: '#2B0507',
                  fontWeight: '800',
                  fontSize: '14px',
                  padding: '5px 16px',
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                  zIndex: 2
                }}>
                  {yearStr}
                </div>

                {/* Folder Cover Box */}
                <div className="gallery-folder-cover">
                  {!isEmpty && stats.coverUrl ? (
                    getInstagramEmbedUrl(stats.coverUrl) ? (
                      <iframe
                        src={getInstagramEmbedUrl(stats.coverUrl)}
                        title={`Folder ${yearStr}`}
                        style={{ width: '100%', height: '100%', border: 'none', background: '#FFF', pointerEvents: 'none' }}
                      />
                    ) : getYouTubeThumbnail(stats.coverUrl) ? (
                      <img 
                        src={getYouTubeThumbnail(stats.coverUrl)} 
                        alt={`Folder ${yearStr}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : stats.coverUrl.match(/\.(mp4|webm|ogg)$/i) || stats.coverUrl.startsWith('data:video') ? (
                      <video 
                        src={stats.coverUrl} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
                      />
                    ) : (
                      <img 
                        src={stats.coverUrl} 
                        alt={`Folder ${yearStr}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    )
                  ) : (
                    /* Clean Folder Icon placeholder for empty folder */
                    <div className="gallery-folder-placeholder" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      color: 'rgba(255,179,0,0.4)'
                    }}>
                      <Folder size={76} color="#FFB300" style={{ opacity: 0.55 }} />
                      <span style={{ fontSize: '14px', color: '#FFECB3' }}>{t.galleryNoMedia || "No media uploaded"}</span>
                    </div>
                  )}

                  {/* Dark gradient overlay at bottom of cover */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(27,4,6,0.9) 100%)'
                  }} />
                </div>

                {/* Folder Info Footer */}
                <div className="gallery-folder-footer" style={{ padding: '18px 22px', background: '#1A0304' }}>
                  <div className="gallery-folder-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Folder className="gallery-folder-title-icon" size={22} color="#FFB300" />
                    <h3 className="heading-font gold-text gallery-folder-title" style={{ fontSize: '21px', margin: 0 }}>
                      {t.galleryUtsavMemories || "Utsav Memories"} {yearStr}
                    </h3>
                  </div>

                  {/* Media Count Subtitle */}
                  <div className="gallery-folder-stats" style={{
                    fontSize: '14px',
                    color: isEmpty ? '#8E8E8E' : '#FFECB3',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '6px'
                  }}>
                    {!isEmpty ? (
                      <>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Image size={14} color="#FFB300" /> {stats.photosCount} {t.filterPhotos || "Photos"}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Video size={14} color="#FFB300" /> {stats.videosCount} {t.filterVideos || "Videos"}
                        </span>
                      </>
                    ) : (
                      <span>0 {t.galleryItemsCount || "Items"} ({currentLang === 'HI' ? 'खाली फ़ोल्डर' : currentLang === 'GU' ? 'ખાલી ફોલ્ડર' : 'Empty Folder'})</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* VIEW 2: INSIDE OPENED YEAR FOLDER CONTENT */}
      {activeFolderYear && (
        <div>
          {/* Top Bar: Type Filter Tabs */}
          <div 
            className="gallery-type-filter-bar"
            style={{
              background: 'rgba(43, 5, 7, 0.85)',
              border: '1px solid var(--gold-border)',
              borderRadius: '16px',
              padding: '16px 24px',
              marginBottom: '32px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.4)'
            }}
          >

            {/* Media Type Filter Buttons */}
            <div 
              className="gallery-type-filter-btns"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <button
                onClick={() => setSelectedType('All')}
                style={{
                  background: selectedType === 'All' ? '#FFB300' : 'transparent',
                  color: selectedType === 'All' ? '#2B0507' : '#FFF',
                  border: '1px solid rgba(255,179,0,0.4)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: selectedType === 'All' ? '700' : '500',
                  cursor: 'pointer'
                }}
              >
                {t.filterAll || 'All Items'}
              </button>
              <button
                onClick={() => setSelectedType('Photo')}
                style={{
                  background: selectedType === 'Photo' ? '#FFB300' : 'transparent',
                  color: selectedType === 'Photo' ? '#2B0507' : '#FFF',
                  border: '1px solid rgba(255,179,0,0.4)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: selectedType === 'Photo' ? '700' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Image size={15} /> {t.filterPhotos || 'Photos'}
              </button>
              <button
                onClick={() => setSelectedType('Video')}
                style={{
                  background: selectedType === 'Video' ? '#FFB300' : 'transparent',
                  color: selectedType === 'Video' ? '#2B0507' : '#FFF',
                  border: '1px solid rgba(255,179,0,0.4)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: selectedType === 'Video' ? '700' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Video size={15} /> {t.filterVideos || 'Videos'}
              </button>
            </div>
          </div>

          {/* Media Items Grid inside Folder or Empty State */}
          {currentFolderItems.length === 0 ? (
            <div className="gallery-empty-state-box" style={{
              textAlign: 'center',
              padding: '44px 20px',
              border: '1px dashed var(--gold-border)',
              borderRadius: '16px',
              background: 'rgba(43, 5, 7, 0.6)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
              margin: '0 auto',
              boxSizing: 'border-box'
            }}>
              <Folder size={44} color="#FFD700" style={{ marginBottom: '12px', opacity: 0.85 }} />
              <h3 style={{ color: '#FFD700', fontSize: '17px', margin: '0 0 8px', lineHeight: 1.4 }}>
                {currentLang === 'HI' 
                  ? `यह फ़ोल्डर वर्तमान में खाली है (${activeFolderYear})`
                  : currentLang === 'GU'
                  ? `આ ફોલ્ડર હાલમાં ખાલી છે (${activeFolderYear})`
                  : `This folder is currently empty (${activeFolderYear})`}
              </h3>
              <p style={{ color: '#FFECB3', fontSize: '13.5px', margin: 0, lineHeight: 1.5 }}>
                {currentLang === 'HI'
                  ? `${activeFolderYear} के लिए अभी तक कोई फ़ोटो या वीडियो अपलोड नहीं किया गया है।`
                  : currentLang === 'GU'
                  ? `${activeFolderYear} માટે હજુ સુધી કોઈ ફોટા કે વિડિયો અપલોડ કરવામાં આવ્યા નથી.`
                  : `No photos or videos have been uploaded for ${activeFolderYear} yet.`}
              </p>
            </div>
          ) : (
            <div className="gallery-media-grid">
              {currentFolderItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  style={{
                    background: '#1A0304',
                    border: '1px solid var(--gold-border)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 10px 28px rgba(255, 179, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)';
                  }}
                >
                  <div className="gallery-media-cover">
                    {getInstagramEmbedUrl(item.url) ? (
                      <iframe
                        src={getInstagramEmbedUrl(item.url)}
                        title={item.title}
                        style={{ width: '100%', height: '100%', border: 'none', background: '#FFF', pointerEvents: 'none' }}
                      />
                    ) : getYouTubeThumbnail(item.url) ? (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <img
                          src={getYouTubeThumbnail(item.url)}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.3)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(255,179,0,0.9)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            <Play size={24} fill="#2B0507" color="#2B0507" style={{ marginLeft: '3px' }} />
                          </div>
                        </div>
                      </div>
                    ) : item.type === 'Video' ? (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <video
                          src={item.url}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.3)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(255,179,0,0.9)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            <Play size={24} fill="#2B0507" color="#2B0507" style={{ marginLeft: '3px' }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={getDisplayTitle(item)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#FFB300',
                      color: '#2B0507',
                      fontWeight: '700',
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '12px'
                    }}>
                      {item.year}
                    </span>

                    {/* Hover Click to Expand Indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#FFF',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px'
                    }}>
                      <Maximize2 size={12} /> Click to View
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX POPUP MODAL FOR PHOTO / VIDEO */}
      {selectedMedia && (
        <div
          className="gallery-lightbox-overlay"
          onClick={() => setSelectedMedia(null)}
        >
          {/* Lightbox Container - Responsive & cleanly sized with touch swipe support */}
          <div
            className="gallery-lightbox-modal"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Lightbox Header - Clean (Year badge, Counter, Title, Zoom/Open icon, Close button) */}
            <div className="gallery-lightbox-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <span style={{
                  background: 'var(--gold-gradient)',
                  color: '#2B0507',
                  fontWeight: 800,
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  flexShrink: 0
                }}>
                  {selectedMedia.year}
                </span>

                <h3 className="heading-font gold-text gallery-lightbox-title">
                  {getDisplayTitle(selectedMedia)}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => setSelectedMedia(null)}
                  title="Close (Esc)"
                  className="gallery-lightbox-action-btn"
                  style={{ color: '#FFF' }}
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Media Content Display */}
            <div className="gallery-lightbox-body">
              {selectedMedia.type === 'Video' ? (
                getYouTubeEmbedUrl(selectedMedia.url) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(selectedMedia.url)}
                    title={getDisplayTitle(selectedMedia)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="gallery-lightbox-yt"
                  />
                ) : getInstagramEmbedUrl(selectedMedia.url) ? (
                  <iframe
                    src={getInstagramEmbedUrl(selectedMedia.url)}
                    title={getDisplayTitle(selectedMedia)}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    className="gallery-lightbox-ig"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    className="gallery-lightbox-video"
                  />
                )
              ) : (
                getInstagramEmbedUrl(selectedMedia.url) ? (
                  <iframe
                    src={getInstagramEmbedUrl(selectedMedia.url)}
                    title={getDisplayTitle(selectedMedia)}
                    className="gallery-lightbox-ig"
                  />
                ) : (
                  <img
                    src={selectedMedia.url}
                    alt={getDisplayTitle(selectedMedia)}
                    className="gallery-lightbox-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/bappa-banner.jpg';
                    }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
