import React, { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext, getComputedTodaysEvents, calculateFullFestivalTimeline, formatDayBadgeLabel } from '../context/SiteDataContext';
import { Calendar, Sparkles, Clock, MapPin } from 'lucide-react';
import { Translate } from '../utils/useAutoTranslate';

export default function SchedulePreview({ onViewFullSchedule }) {
  const { t, currentLang } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);

  const events = getComputedTodaysEvents(siteData);
  const timelineInfo = calculateFullFestivalTimeline ? calculateFullFestivalTimeline(siteData) : {};

  const getCategoryLabel = (cat) => {
    if (!cat) return currentLang === 'HI' ? 'कार्यक्रम' : currentLang === 'GU' ? 'કાર્યક્રમ' : 'Event';
    const c = String(cat).toLowerCase();
    if (c.includes('aagman') && c.includes('visarjan')) return t.catAagmanVisarjan || cat;
    if (c.includes('aarti')) return t.catAarti || cat;
    if (c.includes('cultural')) return t.catCultural || cat;
    if (c.includes('mahaprasad') || c.includes('prasad')) return t.catMahaprasad || cat;
    if (c.includes('aagman')) return t.catAagman || cat;
    if (c.includes('visarjan')) return t.catVisarjan || cat;
    return cat;
  };

  const getEventTitle = (item) => item?.title || '';

  const getEventDesc = (item) => item?.desc || '';

  const getGridStyle = () => {
    if (events.length === 1) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        maxWidth: '520px',
        margin: '0 auto 32px',
        gap: '20px',
        textAlign: 'left'
      };
    }
    if (events.length === 2) {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        maxWidth: '860px',
        margin: '0 auto 32px',
        gap: 'clamp(12px, 2vw, 24px)',
        textAlign: 'left'
      };
    }
    // 3 or more boxes (3 in first line, 4th and beyond in the line below)
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 'clamp(8px, 1.8vw, 20px)',
      marginBottom: '32px',
      textAlign: 'left'
    };
  };

  return (
    <section id="schedule" className="schedule-preview-section" style={{ padding: '76px 20px 38px', maxWidth: '1100px', margin: '0 auto' }}>
      <style>{`
        /* RESPONSIVE ON MOBILE & TABLET (Strictly <= 768px so Desktop is completely untouched) */
        @media (max-width: 768px) {
          #schedule.schedule-preview-section {
            padding-top: 64px !important;
            padding-bottom: 32px !important;
          }
          #schedule .schedule-preview-card {
            padding: 36px 18px !important;
          }
          #schedule .schedule-preview-title {
            font-size: clamp(26px, 6vw, 34px) !important;
          }
          #schedule .schedule-preview-underline {
            width: 80px !important;
            height: 3px !important;
            margin: 12px auto 24px !important;
          }
          .schedule-preview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: clamp(8px, 2.5vw, 12px) !important;
          }
          .schedule-preview-grid.events-count-4 .schedule-preview-item-card:nth-child(4) {
            grid-column: auto !important;
          }
          #schedule .schedule-preview-item-card {
            padding: clamp(10px, 2.8vw, 16px) !important;
            border-radius: 12px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            min-height: auto !important;
          }
          .schedule-prev-tag-wrap {
            margin-bottom: 10px !important;
          }
          .schedule-prev-tag-span {
            font-size: clamp(9.5px, 2.4vw, 11px) !important;
            padding: 3px 7px !important;
            gap: 4px !important;
          }
          .schedule-prev-tag-span svg {
            width: 11px !important;
            height: 11px !important;
          }
          .schedule-prev-title {
            font-size: clamp(13px, 3.4vw, 16px) !important;
            margin-bottom: 6px !important;
          }
          .schedule-prev-time {
            font-size: clamp(10.5px, 2.7vw, 12px) !important;
            gap: 5px !important;
            margin-bottom: 6px !important;
          }
          .schedule-prev-time svg {
            width: 13px !important;
            height: 13px !important;
            flex-shrink: 0 !important;
          }
          .schedule-prev-location {
            font-size: clamp(10px, 2.5vw, 11.5px) !important;
            gap: 5px !important;
            margin-bottom: 8px !important;
          }
          .schedule-prev-location svg {
            width: 12px !important;
            height: 12px !important;
            flex-shrink: 0 !important;
          }
          .schedule-prev-desc {
            font-size: clamp(10px, 2.5vw, 11.5px) !important;
            line-height: 1.4 !important;
          }
          #schedule .schedule-preview-btn {
            font-size: 15px !important;
            font-weight: 700 !important;
            margin-top: 6px !important;
          }
          .schedule-preview-empty-box {
            max-width: 320px !important;
            width: 86% !important;
            padding: 20px 14px !important;
            margin: 0 auto 24px !important;
          }
        }

        /* 4th box sits in middle column of row 2 on desktop when exactly 4 boxes exist */
        @media (min-width: 769px) {
          .schedule-preview-grid.events-count-4 .schedule-preview-item-card:nth-child(4) {
            grid-column: 2 / 3;
          }
        }

        /* EXTRA SMALL MOBILE (<= 400px) */
        @media (max-width: 400px) {
          #schedule.schedule-preview-section {
            padding: 50px 14px 25px !important;
          }
          #schedule .schedule-preview-card {
            padding: 30px 14px 30px !important;
          }
          #schedule .schedule-preview-item-card {
            padding: 18px 14px !important;
          }
          .schedule-preview-empty-box {
            max-width: 270px !important;
            width: 88% !important;
            padding: 18px 12px !important;
          }
        }
      `}</style>
      <div className="maroon-card gold-box-hover schedule-preview-card mobile-entrance-fade-up" style={{
        padding: '36px',
        background: 'linear-gradient(135deg, #3D0B0D 0%, #250406 100%)',
        borderRadius: '20px',
        border: '1.5px solid var(--gold-border)',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.8)',
        textAlign: 'center'
      }}>
        
        {/* Title */}
        <h2 className="heading-font gold-text schedule-preview-title" style={{
          fontSize: 'clamp(26px, 4vw, 34px)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '0'
        }}>
          {t.todaysSchedule}
        </h2>

        {/* Golden Underline Bar */}
        <div className="schedule-preview-underline" style={{
          width: '70px',
          height: '3px',
          background: 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)',
          margin: '12px auto 28px',
          borderRadius: '2px'
        }}></div>

        {/* Inner Cards Grid / Empty State */}
        {events.length === 0 ? (
          <div className="schedule-preview-empty-box" style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px dashed var(--gold-border)',
            borderRadius: '16px',
            padding: '24px 18px',
            maxWidth: '380px',
            width: '88%',
            margin: '0 auto 28px',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <Calendar size={28} color="#FFB300" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.85 }} />
            <p style={{
              color: '#FFECB3',
              fontSize: '15px',
              fontWeight: 600,
              margin: 0,
              lineHeight: 1.4
            }}>
              {t.noMoreSchedule || 'No more schedule'}
            </p>
          </div>
        ) : (
          <div className={`schedule-preview-grid events-count-${events.length}`} style={getGridStyle()}>
          {events.map((item, index) => (
            <div
              key={item.id || item._id || index}
              className="gold-box-hover schedule-preview-item-card"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1.5px solid var(--gold-border)',
                borderRadius: '16px',
                padding: 'clamp(14px, 1.8vw, 24px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                position: 'relative',
                overflow: 'hidden',
                minWidth: 0,
                boxSizing: 'border-box'
              }}
            >
              <div>
                {/* Top Category Tag (No green day badge, exactly as requested) */}
                <div className="schedule-prev-tag-wrap" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="schedule-prev-tag-span" style={{
                    background: 'rgba(255, 179, 0, 0.15)',
                    border: '1px solid rgba(255, 179, 0, 0.4)',
                    color: '#FFB300',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <Sparkles size={13} color="#FFB300" /> {getCategoryLabel(item.category || item.day)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="heading-font gold-text schedule-prev-title" style={{
                  fontSize: '18px',
                  marginBottom: '10px',
                  marginTop: 0,
                  lineHeight: currentLang === 'EN' ? 1.3 : 1.45,
                  letterSpacing: 'normal',
                  paddingTop: '2px',
                  paddingBottom: '2px',
                  textAlign: 'left'
                }}>
                  <Translate text={item.title} />
                </h3>

                {/* Time */}
                <div className="schedule-prev-time" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFB300', fontSize: '13.5px', fontWeight: '600', marginBottom: '8px', textAlign: 'left' }}>
                  <Clock size={16} /> {item.time}
                </div>

                {/* Location */}
                {(item.location || siteData?.mandalAddress) && (
                  <div className="schedule-prev-location" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#AAA', fontSize: '12.5px', marginBottom: item.desc ? '14px' : '0', textAlign: 'left' }}>
                    <MapPin size={15} color="#D4AF37" /> <Translate text={item.location || siteData?.mandalAddress} />
                  </div>
                )}

                {/* Description (if present) */}
                {item.desc ? (
                  <p className="schedule-prev-desc" style={{ color: '#FFECB3', fontSize: '13.5px', lineHeight: 1.6, margin: 0, opacity: 0.9, textAlign: 'left' }}>
                    <Translate text={item.desc} />
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

        {/* View Full Schedule */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={onViewFullSchedule}
            className="schedule-preview-btn"
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
            {t.viewFullSchedule}
          </button>
        </div>

      </div>
    </section>
  );
}
