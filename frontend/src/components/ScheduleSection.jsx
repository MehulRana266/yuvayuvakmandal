import React, { useState, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext, calculateFullFestivalTimeline, getCurrentFestivalDayInfo, getFestivalScheduleVisibility, isEventMatchingFestivalDay, filterMahaAartiConflict, sortScheduleEvents, formatDayBadgeLabel } from '../context/SiteDataContext';
import { Calendar, Clock, MapPin, Sparkles, Filter, CheckCircle2, ArrowLeft, CalendarDays, AlertCircle } from 'lucide-react';
import { useAutoTranslate, Translate } from '../utils/useAutoTranslate';

export default function ScheduleSection({ onBackToHome }) {
  const { t, currentLang } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDay, setSelectedDay] = useState('All');

  const displayScheduleHeader = siteData?.fullScheduleHeader || t.fullScheduleHeader || "DIVINE AARTI & UTSAV SCHEDULE";
  const displayScheduleSubText = siteData?.fullScheduleSubText !== undefined ? siteData.fullScheduleSubText : (t.fullScheduleSubText || "");

  const timelineInfo = calculateFullFestivalTimeline ? calculateFullFestivalTimeline(siteData) : { timeline: [] };
  const currentDayInfo = getCurrentFestivalDayInfo ? getCurrentFestivalDayInfo(siteData) : { dayTag: 'Aagman Day', dateStr: '' };
  const scheduleVisibility = getFestivalScheduleVisibility ? getFestivalScheduleVisibility(siteData) : { phase: 'FULL_FESTIVAL', isVisible: true };

  const eventsList = Array.isArray(siteData.scheduleEvents) && siteData.scheduleEvents.length > 0 ? siteData.scheduleEvents : (t.events || []);

  const categories = [
    { value: 'All', label: t.catAll },
    { value: 'Aarti', label: t.catAarti },
    { value: 'Cultural', label: t.catCultural },
    { value: 'Mahaprasad', label: t.catMahaprasad },
    { value: 'Aagman', label: t.catAagman || 'Aagman' },
    { value: 'Visarjan', label: t.catVisarjan || 'Visarjan' }
  ];

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

  const formatTranslatedDayBadge = (dayStr, timelineInfo) => {
    const raw = formatDayBadgeLabel(dayStr, timelineInfo);
    if (!raw) return currentLang === 'HI' ? 'प्रतिदिन' : currentLang === 'GU' ? 'દરરોજ' : 'Daily';
    const lower = String(raw).toLowerCase();
    if (lower === 'daily') {
      return currentLang === 'HI' ? 'प्रतिदिन' : currentLang === 'GU' ? 'દરરોજ' : 'Daily';
    }
    if (lower.includes('aagman')) {
      return currentLang === 'HI' ? 'आगमन दिवस' : currentLang === 'GU' ? 'આગમન દિવસ' : 'Aagman Day';
    }
    if (lower.includes('visarjan')) {
      return currentLang === 'HI' ? 'विसर्जन दिवस' : currentLang === 'GU' ? 'વિસર્જન દિવસ' : 'Visarjan Day';
    }
    if (currentLang === 'HI') {
      return raw.replace(/Day (\d+)/i, 'दिन $1').replace(/Day/i, 'दिन');
    }
    if (currentLang === 'GU') {
      return raw.replace(/Day (\d+)/i, 'દિવસ $1').replace(/Day/i, 'દિવસ');
    }
    return raw;
  };

  const getEventTitle = (item) => item?.title || '';

  const getEventDesc = (item) => item?.desc || '';

  const phase = scheduleVisibility.phase;
  const isConcluded = phase === 'AFTER_VISARJAN';
  const isBeforeAagman = phase === 'BEFORE_AAGMAN';
  const isAagmanOnly = phase === 'AAGMAN_ONLY';
  const isFullFestival = phase === 'FULL_FESTIVAL';

  let phaseAllowedEvents = [];
  if (isBeforeAagman || isConcluded) {
    phaseAllowedEvents = [];
  } else if (isAagmanOnly) {
    phaseAllowedEvents = eventsList.filter(item => {
      if (!item) return false;
      const tag = String(item.day || '').toLowerCase();
      const cat = String(item.category || '').toLowerCase();
      return tag.includes('aagman') || cat.includes('aagman');
    });
  } else if (isFullFestival) {
    phaseAllowedEvents = eventsList;
  }

  const rawFilteredEvents = phaseAllowedEvents.filter(item => {
    const catMatch = selectedCategory === 'All' 
      || String(item.category || '').toLowerCase() === String(selectedCategory).toLowerCase()
      || (selectedCategory === 'Aagman' && String(item.category || '').toLowerCase().includes('aagman'))
      || (selectedCategory === 'Visarjan' && String(item.category || '').toLowerCase().includes('visarjan'));

    return catMatch;
  });

  const filteredEvents = sortScheduleEvents(rawFilteredEvents);

  return (
    <div className="schedule-section-container mobile-entrance-fade-up" style={{ padding: '40px 20px 40px', maxWidth: '1240px', margin: '0 auto' }}>
      <style>{`
        .schedule-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(8px, 1.8vw, 24px);
        }
        @media (max-width: 768px) {
          .schedule-section-container {
            padding: 30px 10px 36px !important;
          }
          .schedule-cards-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: clamp(8px, 2.5vw, 12px) !important;
          }
          .schedule-card-item {
            padding: clamp(8px, 2.4vw, 14px) !important;
            border-radius: 12px !important;
          }
          .schedule-card-top-badges {
            flex-wrap: nowrap !important;
            justify-content: space-between !important;
            align-items: center !important;
            gap: 4px !important;
            margin-bottom: 10px !important;
            width: 100% !important;
          }
          .schedule-card-category-badge {
            font-size: clamp(8px, 2.1vw, 10.5px) !important;
            padding: 2px 6px !important;
            gap: 3px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .schedule-card-category-badge svg {
            width: 10px !important;
            height: 10px !important;
            flex-shrink: 0 !important;
          }
          .schedule-card-day-badge {
            font-size: clamp(7.5px, 2vw, 10px) !important;
            padding: 2px 6px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            letter-spacing: -0.2px !important;
          }
          .schedule-card-title {
            font-size: clamp(13px, 3.4vw, 16px) !important;
            margin-bottom: 6px !important;
          }
          .schedule-card-time {
            font-size: clamp(10.5px, 2.7vw, 12px) !important;
            gap: 5px !important;
            margin-bottom: 6px !important;
          }
          .schedule-card-time svg {
            width: 13px !important;
            height: 13px !important;
            flex-shrink: 0 !important;
          }
          .schedule-card-location {
            font-size: clamp(10px, 2.5vw, 11.5px) !important;
            gap: 5px !important;
            margin-bottom: 8px !important;
          }
          .schedule-card-location svg {
            width: 12px !important;
            height: 12px !important;
            flex-shrink: 0 !important;
          }
          .schedule-card-desc {
            font-size: clamp(10px, 2.5vw, 11.5px) !important;
            line-height: 1.4 !important;
          }
          .schedule-card-footer {
            margin-top: 12px !important;
            padding-top: 8px !important;
            font-size: clamp(9px, 2.3vw, 10.5px) !important;
            gap: 4px !important;
          }
          .schedule-card-footer svg {
            width: 12px !important;
            height: 12px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>
      {/* Section Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 className="heading-font gold-text" style={{
          fontSize: 'clamp(24px, 5vw, 34px)',
          margin: 0,
          letterSpacing: currentLang === 'EN' ? '1px' : 'normal',
          textTransform: currentLang === 'EN' ? 'uppercase' : 'none',
          lineHeight: currentLang === 'EN' ? 1.25 : 1.45,
          whiteSpace: 'pre-line'
        }}>
          <Translate text={displayScheduleHeader} />
        </h2>

        {/* Golden Underline Bar */}
        <div style={{
          width: '80px',
          height: '3px',
          background: 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)',
          margin: '12px auto 20px',
          borderRadius: '2px'
        }} />

        <p style={{ color: '#FFECB3', fontSize: '15px', maxWidth: '750px', margin: '0 auto 18px', lineHeight: 1.6 }}>
          <Translate text={displayScheduleSubText} />
        </p>
      </div>

      {/* Category Filter Pills */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '36px'
      }}>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            style={{
              background: selectedCategory === cat.value ? '#FFB300' : 'rgba(43, 5, 7, 0.85)',
              color: selectedCategory === cat.value ? '#2B0507' : '#FFECB3',
              border: selectedCategory === cat.value ? '1.5px solid #FFD700' : '1px solid var(--gold-border)',
              padding: '9px 18px',
              borderRadius: '24px',
              fontSize: '13.5px',
              fontWeight: selectedCategory === cat.value ? '700' : '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedCategory === cat.value ? '0 4px 15px rgba(255, 179, 0, 0.4)' : 'none'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Schedule Cards Grid or Clean No More Schedule State */}
      {filteredEvents.length === 0 ? (
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1.5px dashed var(--gold-border)',
          borderRadius: '16px',
          padding: '30px 20px',
          maxWidth: '480px',
          margin: '0 auto 28px',
          textAlign: 'center'
        }}>
          <Calendar size={28} color="#FFB300" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.85 }} />
          <p style={{ color: '#FFECB3', fontSize: '16px', fontWeight: 600, margin: 0 }}>
            {t.noMoreSchedule || "No more schedule"}
          </p>
        </div>
      ) : (
        <div className="schedule-cards-grid">
          {filteredEvents.map((item, index) => (
          <div
            key={item.id || item._id || index}
            className="maroon-card gold-box-hover schedule-card-item"
            style={{
              background: 'linear-gradient(135deg, #3D0B0D 0%, #250406 100%)',
              border: '1.5px solid var(--gold-border)',
              borderRadius: '16px',
              padding: 'clamp(12px, 1.8vw, 24px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              minWidth: 0
            }}
          >
            {/* Top Category & Day Badge */}
            <div className="schedule-card-top-badges" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'nowrap', width: '100%', gap: '4px' }}>
              <span className="schedule-card-category-badge" style={{
                background: 'rgba(255, 179, 0, 0.15)',
                border: '1px solid rgba(255, 179, 0, 0.4)',
                color: '#FFB300',
                fontSize: '12px',
                fontWeight: '700',
                padding: '4px 12px',
                borderRadius: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                <Sparkles size={13} color="#FFB300" /> {getCategoryLabel(item.category || item.day)}
              </span>

              <span className="schedule-card-day-badge" style={{
                fontSize: '11.5px',
                color: '#69F0AE',
                background: 'rgba(105, 240, 174, 0.12)',
                border: '1px solid #69F0AE',
                padding: '3px 10px',
                borderRadius: '12px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                {formatTranslatedDayBadge(item.day, timelineInfo)}
              </span>
            </div>

            {/* Title & Time */}
            <div>
              <h3 className="heading-font gold-text schedule-card-title" style={{
                fontSize: '18px',
                marginBottom: '10px',
                lineHeight: currentLang === 'EN' ? 1.3 : 1.45,
                letterSpacing: 'normal',
                paddingTop: '2px',
                paddingBottom: '2px'
              }}>
                <Translate text={item.title} />
              </h3>

              <div className="schedule-card-time" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFB300', fontSize: '13.5px', fontWeight: '600', marginBottom: '8px' }}>
                <Clock size={16} /> {item.time}
              </div>

              {item.location && (
                <div className="schedule-card-location" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#AAA', fontSize: '12.5px', marginBottom: '14px' }}>
                  <MapPin size={15} color="#D4AF37" /> <Translate text={item.location} />
                </div>
              )}

              <p className="schedule-card-desc" style={{ color: '#FFECB3', fontSize: '13.5px', lineHeight: 1.6, margin: 0, opacity: 0.9 }}>
                <Translate text={item.desc} />
              </p>
            </div>

            {/* Bottom Accent Footer */}
            <div className="schedule-card-footer" style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid rgba(255,179,0,0.15)', display: 'flex', alignItems: 'center', gap: '6px', color: '#FFB300', fontSize: '11.5px', fontWeight: 600 }}>
              <CheckCircle2 size={14} color="#FFB300" /> {t.devoteeBadge || "Open for all devotees & families"}
            </div>

          </div>
        ))}
      </div>
      )}

    </div>
  );
}
