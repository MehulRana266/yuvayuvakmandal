import React, { useState, useContext, useEffect, useRef } from 'react';
import { SiteDataContext, getApiBaseUrl, resolveMediaUrl, calculateFullFestivalTimeline, getCurrentFestivalDayInfo, getComputedTodaysEvents, sortScheduleEvents } from '../context/SiteDataContext';
import { LanguageContext } from '../context/LanguageContext';
import { 
  Settings, 
  Image, 
  Calendar, 
  Tv, 
  Award,
  Instagram, 
  Info, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Shield, 
  UserCheck, 
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  Inbox,
  Heart,
  MapPin,
  Clock,
  Send,
  Edit2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Printer,
  FileText,
  X,
  Share2,
  Copy,
  Download,
  ExternalLink
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { formatReviewDate } from '../utils/dateUtils';
import { jsPDF } from 'jspdf';

const ALL_IMAGE_TYPES = 'image/*,.tif,.jfif,.pjp,.apng,.xbm,.jxl,.jpe,.jpeg,.heif,.ico,.tiff,.webp,.svgz,.jpg,.heic,.gif,.svg,.png,.bmp';
const ALL_VIDEO_TYPES = 'video/*,.mpe,.mpeg,.ogm,.mkv,.mpg,.wmv,.webm,.ogv,.mov,.m4v,.asx,.mp4,.avi,.flv,.3gp';

const officialInstaUrl = "https://www.instagram.com/yuva_yuvak_mandal/";

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

function numberToWordsINR(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
             'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const n = parseInt(num, 10);
  if (isNaN(n) || n === 0) return 'Zero Rupees Only';
  if (n < 0) return 'Invalid Amount';

  function convert(val) {
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
    if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred' + (val % 100 !== 0 ? ' and ' + convert(val % 100) : '');
    if (val < 100000) return convert(Math.floor(val / 1000)) + ' Thousand' + (val % 1000 !== 0 ? ' ' + convert(val % 1000) : '');
    if (val < 10000000) return convert(Math.floor(val / 100000)) + ' Lakh' + (val % 100000 !== 0 ? ' ' + convert(val % 100000) : '');
    return convert(Math.floor(val / 10000000)) + ' Crore' + (val % 10000000 !== 0 ? ' ' + convert(val % 10000000) : '');
  }

  return convert(n) + ' Rupees Only';
}

function AdminReviewsManager() {
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedStar, setSelectedStar] = React.useState('ALL');

  const loadReviewsSilent = () => {
    fetch(`${getApiBaseUrl()}/api/reviews?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setReviews([...list].reverse());
        setLoading(false);
      })
      .catch(err => { setLoading(false); });
  };

  React.useEffect(() => {
    loadReviewsSilent();

    // 1. Auto-poll every 2.5s
    const interval = setInterval(loadReviewsSilent, 2500);

    // 2. BroadcastChannel for 0ms instant sync across tabs
    let channel;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('ganpati_reviews_sync');
        channel.onmessage = () => {
          loadReviewsSilent();
        };
      }
    } catch (e) {}

    // 3. Focus & custom event listener
    const handleSync = () => loadReviewsSilent();
    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('new_review_added', handleSync);

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('new_review_added', handleSync);
    };
  }, []);

  const handleDelete = (review) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    const targetId = review._id || review.id;
    fetch(`${getApiBaseUrl()}/api/reviews/` + targetId, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        setReviews(prev => prev.filter(r => {
          if (review._id && (r._id === review._id || String(r._id) === String(review._id))) return false;
          if (review.id && (r.id === review.id || String(r.id) === String(review.id))) return false;
          return true;
        }));
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const channel = new BroadcastChannel('ganpati_reviews_sync');
            channel.postMessage('DELETE_REVIEW');
            channel.close();
          }
          window.dispatchEvent(new CustomEvent('new_review_added'));
        } catch (e) {}
      })
      .catch(err => {
        console.error('Delete review error:', err);
      });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '550px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{ fontSize: '24px' }}>⏳</div>
        <p style={{ color: '#FFD700', fontSize: '14.5px', fontWeight: 600, margin: 0 }}>Loading Devotee Reviews...</p>
      </div>
    );
  }

  const totalReviews = reviews.length;
  const starCounts = {
    5: reviews.filter(r => Number(r.rating) === 5).length,
    4: reviews.filter(r => Number(r.rating) === 4).length,
    3: reviews.filter(r => Number(r.rating) === 3).length,
    2: reviews.filter(r => Number(r.rating) === 2).length,
    1: reviews.filter(r => Number(r.rating) === 1).length
  };

  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
    : '5.0';

  const filteredReviews = selectedStar === 'ALL'
    ? reviews
    : reviews.filter(r => Number(r.rating) === Number(selectedStar));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 🌟 Star Rating Analytics & Message Counts (Admin View Only) */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(61, 11, 13, 0.7) 0%, rgba(20, 3, 5, 0.9) 100%)',
        border: '1.5px solid var(--gold-border)',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h4 style={{ color: '#FFD700', margin: '0 0 4px', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 Star-wise Devotee Review Count
            </h4>
            <p style={{ color: '#FFECB3', margin: 0, fontSize: '12.5px' }}>
              Total Devotee Reviews Received: <strong style={{ color: '#FFF' }}>{totalReviews}</strong> | Average Rating: <strong style={{ color: '#FFD700' }}>{avgRating} ★</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setSelectedStar('ALL');
            }}
            style={{
              background: selectedStar === 'ALL' ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.08)',
              color: selectedStar === 'ALL' ? '#2B0507' : '#FFECB3',
              border: selectedStar === 'ALL' ? '1px solid #FFD700' : '1px solid rgba(212,175,55,0.3)',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Show All ({totalReviews})
          </button>
        </div>

        {/* 5-Star to 1-Star Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px'
        }}>
          {[5, 4, 3, 2, 1].map((s) => {
            const count = starCounts[s] || 0;
            const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            const isSelected = selectedStar === s;

            return (
              <div
                key={s}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedStar(selectedStar === s ? 'ALL' : s);
                }}
                style={{
                  background: isSelected ? 'rgba(255, 215, 0, 0.16)' : 'rgba(0, 0, 0, 0.45)',
                  border: isSelected ? '1.5px solid #FFD700' : '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ color: '#FFD700', fontSize: '15px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <span>{s}</span>
                  <span style={{ fontSize: '13px' }}>{'★'.repeat(s)}</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', margin: '2px 0' }}>
                  {count} <span style={{ fontSize: '12px', fontWeight: 500, color: '#AAA' }}>reviews</span>
                </div>
                <div style={{ fontSize: '11px', color: '#69F0AE', fontWeight: 600 }}>
                  {percent}% of total
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Devotee Reviews List with minHeight for 100% stability */}
      <div style={{ minHeight: '350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ color: '#FFECB3', fontSize: '14px', margin: 0 }}>
            {selectedStar === 'ALL' ? `Showing All Devotee Reviews (${reviews.length})` : `Showing ${selectedStar} Star Reviews (${filteredReviews.length})`}
          </h4>
          {selectedStar !== 'ALL' && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setSelectedStar('ALL');
              }}
              style={{ background: 'none', border: 'none', color: '#FFD700', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear Filter (Show All)
            </button>
          )}
        </div>

        {filteredReviews.length === 0 ? (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px dashed var(--gold-border)',
            borderRadius: '12px',
            padding: '36px 20px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#AAA', margin: 0, fontSize: '14px' }}>
              {selectedStar === 'ALL' ? 'No reviews found.' : `Is star (${selectedStar} ★) me abhi koi message nahi aaya hai.`}
            </p>
          </div>
        ) : (
          <div style={{
            maxHeight: '380px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingRight: '6px'
          }}>
            {filteredReviews.map(r => (
              <div key={r._id || r.id} style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--gold-border)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ color: '#FFF', margin: '0 0 4px', fontSize: '14px' }}>
                    {r.name} <span style={{ color: '#FFD700', fontSize: '12px' }}>({r.rating} ★)</span>
                  </h4>
                  <p style={{ color: '#FFECB3', fontSize: '13px', margin: '0 0 4px', fontStyle: 'italic' }}>
                    "{r.comment}"
                  </p>
                  <span style={{ color: '#AAA', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>📍 {r.location} • 🕒 {formatReviewDate(r)}</span>
                </div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(r);
                  }}
                  style={{
                    background: 'rgba(255,0,0,0.2)',
                    border: '1px solid #FF5252',
                    color: '#FF5252',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminInquiriesManager({ triggerSuccess }) {
  const [inquiries, setInquiries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const loadInquiriesSilent = () => {
    fetch(`${getApiBaseUrl()}/api/inquiries?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setInquiries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  React.useEffect(() => {
    loadInquiriesSilent();

    // 1. Auto-poll every 2.5 seconds
    const interval = setInterval(loadInquiriesSilent, 2500);

    // 2. BroadcastChannel for 0ms instant sync across tabs
    let channel;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('ganpati_inquiries_sync');
        channel.onmessage = () => {
          loadInquiriesSilent();
        };
      }
    } catch (e) {}

    // 3. Focus, visibility, custom event sync
    const handleSync = () => loadInquiriesSilent();
    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('new_inquiry_added', handleSync);

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('new_inquiry_added', handleSync);
    };
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    fetch(`${getApiBaseUrl()}/api/inquiries/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        setInquiries(prev => prev.filter(i => i.id !== id && i._id !== id));
        if (triggerSuccess) triggerSuccess('Inquiry deleted successfully!');
      })
      .catch(err => console.error('Delete inquiry error:', err));
  };

  return (
    <div className="maroon-card gold-box-hover" style={{ padding: '28px', minHeight: '650px' }}>
      <h3 className="heading-font" style={{ color: '#FFB300', marginBottom: '16px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Inbox size={22} color="#FFB300" /> Devotee Message Inquiries ({inquiries.length})
      </h3>
      <p style={{ color: '#FFECB3', fontSize: '13px', marginBottom: '24px' }}>
        Contact Us page se devotees dwara bheje gaye sabhi message inquiries aur volunteer requests yahan live dikhte hain.
      </p>

      {inquiries.length === 0 ? (
        <p style={{ color: '#AAA', fontSize: '14px', textAlign: 'center', padding: '30px 0' }}>
          Abhi tak koi message inquiry nahi aayi hai. Devotees jab Contact Us form bharenge to woh yahan dikhenge!
        </p>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxHeight: '515px',
          overflowY: 'auto',
          paddingRight: '6px'
        }}>
          {inquiries.map((inq) => (
            <div key={inq.id || inq._id} style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--gold-border)',
              borderRadius: '14px',
              padding: '18px 22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h4 style={{ color: '#FFB300', margin: 0, fontSize: '16px', fontWeight: 700 }}>
                    {inq.name}
                  </h4>
                  <span style={{ background: 'rgba(255, 179, 0, 0.2)', border: '1px solid #FFB300', color: '#FFECB3', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                    {inq.subject || 'General Inquiry'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#FFF', margin: '8px 0', lineHeight: 1.5, background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '8px' }}>
                  "{inq.message}"
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#AAA', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span>📞 Phone: <strong style={{ color: '#69F0AE' }}>{inq.phone}</strong></span>
                  <span>🕒 Date & Time: <strong style={{ color: '#FFECB3' }}>{inq.date}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {inq.phone && (
                  <>
                    <a 
                      href={`https://wa.me/91${inq.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`🙏 Jai Shri Ganesh ${inq.name} ji! 🙏\nYuva Yuvak Mandal ki taraf se aapke sandesh ke jawab mein: `)}`}
                      target="_blank" 
                      rel="noreferrer"
                      style={{
                        background: 'rgba(37, 211, 102, 0.2)',
                        border: '1px solid #25D366',
                        color: '#25D366',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      💬 WhatsApp Reply
                    </a>

                    <a 
                      href={`tel:${inq.phone}`}
                      style={{
                        background: 'rgba(33, 150, 243, 0.2)',
                        border: '1px solid #2196F3',
                        color: '#64B5F6',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📞 Call
                    </a>
                  </>
                )}

                <button 
                  onClick={() => handleDelete(inq.id || inq._id)}
                  style={{
                    background: 'rgba(255,0,0,0.2)',
                    border: '1px solid #FF5252',
                    color: '#FF5252',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SmartTimeField({ label, value, onChange }) {
  const parseValue = (valStr) => {
    const s = String(valStr || '').trim();
    
    // Range Match: 06:00 AM - 11:30 PM Daily
    const rangeMatch = s.match(/^(0[1-9]|1[0-2]):([0-5][0-9])\s+(AM|PM)\s*-\s*(0[1-9]|1[0-2]):([0-5][0-9])\s+(AM|PM)(?:\s+(.*))?$/i);
    if (rangeMatch) {
      return {
        isRange: true,
        isCustom: false,
        h1: rangeMatch[1],
        m1: rangeMatch[2],
        p1: rangeMatch[3].toUpperCase(),
        h2: rangeMatch[4],
        m2: rangeMatch[5],
        p2: rangeMatch[6].toUpperCase(),
        note: rangeMatch[7] || 'Daily'
      };
    }

    // Single Match: 08:30 AM
    const singleMatch = s.match(/^(0[1-9]|1[0-2]):([0-5][0-9])\s+(AM|PM)(?:\s+(.*))?$/i);
    if (singleMatch) {
      return {
        isRange: false,
        isCustom: false,
        h1: singleMatch[1],
        m1: singleMatch[2],
        p1: singleMatch[3].toUpperCase(),
        h2: '11',
        m2: '30',
        p2: 'PM',
        note: singleMatch[4] || 'None'
      };
    }

    // Custom Text (or default range 06:00 AM - 11:30 PM)
    return {
      isRange: true,
      isCustom: Boolean(s),
      h1: '06',
      m1: '00',
      p1: 'AM',
      h2: '11',
      m2: '30',
      p2: 'PM',
      note: 'Daily'
    };
  };

  const initialParsed = parseValue(value);
  const [isCustomMode, setIsCustomMode] = React.useState(initialParsed.isCustom);
  const [isRangeMode, setIsRangeMode] = React.useState(initialParsed.isRange);

  const [tState, setTState] = React.useState({
    h1: initialParsed.h1,
    m1: initialParsed.m1,
    p1: initialParsed.p1,
    h2: initialParsed.h2,
    m2: initialParsed.m2,
    p2: initialParsed.p2,
    note: initialParsed.note
  });

  React.useEffect(() => {
    const p = parseValue(value);
    setTState({
      h1: p.h1,
      m1: p.m1,
      p1: p.p1,
      h2: p.h2,
      m2: p.m2,
      p2: p.p2,
      note: p.note
    });
    if (p.isCustom) setIsCustomMode(true);
    if (p.isRange) setIsRangeMode(true);
  }, [value]);

  const emitFormatted = (range, h1, m1, p1, h2, m2, p2, note) => {
    let result = '';
    if (range) {
      result = `${h1}:${m1} ${p1} - ${h2}:${m2} ${p2} ${note === 'None' ? '' : note}`.trim();
    } else {
      result = `${h1}:${m1} ${p1} ${note === 'None' ? '' : note}`.trim();
    }
    onChange(result);
  };

  const updateState = (updates) => {
    const next = { ...tState, ...updates };
    setTState(next);
    const range = updates.isRange !== undefined ? updates.isRange : isRangeMode;
    emitFormatted(range, next.h1, next.m1, next.p1, next.h2, next.m2, next.p2, next.note);
  };

  return (
    <div style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '6px', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '12px', color: '#FFECB3', fontWeight: 700 }}>
          ⏰ {label}
        </label>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {!isCustomMode && (
            <button
              type="button"
              onClick={() => {
                const nextRange = !isRangeMode;
                setIsRangeMode(nextRange);
                emitFormatted(nextRange, tState.h1, tState.m1, tState.p1, tState.h2, tState.m2, tState.p2, tState.note);
              }}
              style={{
                background: isRangeMode ? 'rgba(105, 240, 174, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: isRangeMode ? '1px solid #69F0AE' : '1px solid #AAA',
                color: isRangeMode ? '#69F0AE' : '#CCC',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {isRangeMode ? '↔️ Range Mode (Start - End)' : '⏱️ Single Time'}
            </button>
          )}

          <button 
            type="button" 
            onClick={() => {
              const nextMode = !isCustomMode;
              setIsCustomMode(nextMode);
              if (!nextMode) {
                emitFormatted(isRangeMode, tState.h1, tState.m1, tState.p1, tState.h2, tState.m2, tState.p2, tState.note);
              }
            }}
            style={{
              background: 'rgba(255, 179, 0, 0.15)',
              border: '1px solid #FFB300',
              color: '#FFD700',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {isCustomMode ? '⏰ Use Time Picker' : '✏️ Custom Text'}
          </button>
        </div>
      </div>

      {!isCustomMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
          {/* Row 1: Start Time (From) */}
          <div className="smart-time-row" style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
            {isRangeMode && (
              <span style={{ fontSize: '11px', color: '#FFD700', fontWeight: 700, minWidth: '38px' }}>
                From:
              </span>
            )}

            {/* Start Hour */}
            <select 
              className="form-input" 
              value={tState.h1} 
              onChange={(e) => updateState({ h1: e.target.value })}
              style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF', padding: '6px 4px', fontSize: '12.5px', fontWeight: 700, flex: 1, minWidth: '45px' }}
            >
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span style={{ color: '#FFD700', fontWeight: 800 }}>:</span>

            {/* Start Min */}
            <select 
              className="form-input" 
              value={tState.m1} 
              onChange={(e) => updateState({ m1: e.target.value })}
              style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF', padding: '6px 4px', fontSize: '12.5px', flex: 1, minWidth: '45px' }}
            >
              {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* Start Period */}
            <select 
              className="form-input" 
              value={tState.p1} 
              onChange={(e) => updateState({ p1: e.target.value })}
              style={{ background: '#FFB300', color: '#2B0507', fontWeight: 800, padding: '6px 4px', fontSize: '12.5px', flex: 1, minWidth: '48px' }}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>

            {/* Note Suffix (only when single time mode) */}
            {!isRangeMode && (
              <select 
                className="form-input" 
                value={tState.note} 
                onChange={(e) => updateState({ note: e.target.value })}
                style={{ background: 'rgba(0,0,0,0.7)', color: '#FFECB3', padding: '6px 4px', fontSize: '11.5px', flex: 1.2, minWidth: '60px' }}
              >
                <option value="Daily">Daily</option>
                <option value="Onwards">Onwards</option>
                <option value="Exact">Exact Time</option>
                <option value="After Aarti">After Aarti</option>
                <option value="None">No Note</option>
              </select>
            )}
          </div>

          {/* Row 2: End Time (To) & Note Suffix (when Range Mode active) */}
          {isRangeMode && (
            <div className="smart-time-row" style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: '11px', color: '#FFD700', fontWeight: 700, minWidth: '38px' }}>
                To:
              </span>

              {/* End Hour */}
              <select 
                className="form-input" 
                value={tState.h2} 
                onChange={(e) => updateState({ h2: e.target.value })}
                style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF', padding: '6px 4px', fontSize: '12.5px', fontWeight: 700, flex: 1, minWidth: '45px' }}
              >
                {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span style={{ color: '#FFD700', fontWeight: 800 }}>:</span>

              {/* End Min */}
              <select 
                className="form-input" 
                value={tState.m2} 
                onChange={(e) => updateState({ m2: e.target.value })}
                style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF', padding: '6px 4px', fontSize: '12.5px', flex: 1, minWidth: '45px' }}
              >
                {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              {/* End Period */}
              <select 
                className="form-input" 
                value={tState.p2} 
                onChange={(e) => updateState({ p2: e.target.value })}
                style={{ background: '#FFB300', color: '#2B0507', fontWeight: 800, padding: '6px 4px', fontSize: '12.5px', flex: 1, minWidth: '48px' }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>

              {/* Note Suffix */}
              <select 
                className="form-input" 
                value={tState.note} 
                onChange={(e) => updateState({ note: e.target.value })}
                style={{ background: 'rgba(0,0,0,0.7)', color: '#FFECB3', padding: '6px 4px', fontSize: '11.5px', flex: 1.2, minWidth: '60px' }}
              >
                <option value="Daily">Daily</option>
                <option value="Onwards">Onwards</option>
                <option value="Exact">Exact Time</option>
                <option value="After Aarti">After Aarti</option>
                <option value="None">No Note</option>
              </select>
            </div>
          )}
        </div>
      ) : (
        <textarea 
          className="form-input" 
          rows="2" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder="e.g. 06:00 AM - 11:30 PM Daily or After Aarti"
          style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
        />
      )}
    </div>
  );
}

export default function AdminCMSPanel() {
  const { t } = useContext(LanguageContext);
  const { 
    siteData, 
    updateSiteData,
    updateHeroBanner, 
    updateVideoUrl, 
    updateAboutText, 
    updateAboutDetails,
    addEvent, 
    deleteEvent, 
    addScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
    updateFullScheduleHeader,
    addBigScreenVideo,
    updateBigScreenVideo,
    deleteBigScreenVideo,
    setBigScreenVideosList,
    addReel, 
    updateReel,
    deleteReel,
    setReelsList,
    addGalleryItem,
    deleteGalleryItem, 
    addVolunteer,
    deleteVolunteer,
    toggleVolunteerPermission,
    updateContactInfo,
    updateAagmanDate,
    updateFestivalStartDate,
    updateVisarjanDate,
    addInquiry,
    deleteInquiry,
    addDonation,
    deleteDonation,
    changeAdminPassword,
    resetToDefaults
  } = useContext(SiteDataContext);

  const [activeTab, setActiveTab] = useState('banner');
  const [successMsg, setSuccessMsg] = useState('');

  // Safe Fallbacks
  const safeData = siteData || {};
  const volunteersList = safeData.volunteers || [];
  const eventsList = safeData.events || [];
  const fullScheduleList = sortScheduleEvents(
    Array.isArray(safeData.scheduleEvents) && safeData.scheduleEvents.length > 0 ? safeData.scheduleEvents : (t.events || [])
  );
  const bigScreenVideosList = Array.isArray(safeData.bigScreenVideos) && safeData.bigScreenVideos.length > 0
    ? safeData.bigScreenVideos
    : (safeData.videoUrl ? [{ id: 'main', title: 'Main Broadcast Video', url: safeData.videoUrl }] : []);
  const reelsList = safeData.reels || [];
  const galleryList = safeData.galleryItems || [];
  const inquiriesList = safeData.inquiries || [];
  const donationsList = safeData.donations || [];
  const contactInfoObj = safeData.contactInfo || {};

  // Banner State (5 Lines Custom Editor)
  const getInitialHeadingLines = () => {
    if (Array.isArray(safeData.heroHeadingLines) && safeData.heroHeadingLines.length > 0) {
      return [
        safeData.heroHeadingLines[0] || '',
        safeData.heroHeadingLines[1] || '',
        safeData.heroHeadingLines[2] || '',
        safeData.heroHeadingLines[3] || '',
        safeData.heroHeadingLines[4] || ''
      ];
    }
    if (safeData.heroHeading) {
      const lines = safeData.heroHeading.split('\n');
      return [
        lines[0] || '',
        lines[1] || '',
        lines[2] || '',
        lines[3] || '',
        lines[4] || ''
      ];
    }
    return ['The King of', 'Yuva Yuvak Mandal', '', '', ''];
  };

  const initialHeadingLines = getInitialHeadingLines();
  const [headingLine1, setHeadingLine1] = useState(initialHeadingLines[0]);
  const [headingLine2, setHeadingLine2] = useState(initialHeadingLines[1]);
  const [headingLine3, setHeadingLine3] = useState(initialHeadingLines[2]);
  const [headingLine4, setHeadingLine4] = useState(initialHeadingLines[3]);
  const [headingLine5, setHeadingLine5] = useState(initialHeadingLines[4]);

  const hasInitializedBannerFormRef = React.useRef(false);

  useEffect(() => {
    if (safeData && !hasInitializedBannerFormRef.current) {
      if (Array.isArray(safeData.heroHeadingLines) && safeData.heroHeadingLines.length > 0) {
        setHeadingLine1(safeData.heroHeadingLines[0] || '');
        setHeadingLine2(safeData.heroHeadingLines[1] || '');
        setHeadingLine3(safeData.heroHeadingLines[2] || '');
        setHeadingLine4(safeData.heroHeadingLines[3] || '');
        setHeadingLine5(safeData.heroHeadingLines[4] || '');
        hasInitializedBannerFormRef.current = true;
      } else if (safeData.heroHeading) {
        const lines = safeData.heroHeading.split('\n');
        setHeadingLine1(lines[0] || '');
        setHeadingLine2(lines[1] || '');
        setHeadingLine3(lines[2] || '');
        setHeadingLine4(lines[3] || '');
        setHeadingLine5(lines[4] || '');
        hasInitializedBannerFormRef.current = true;
      }
    }
  }, [safeData]);

  const [targetDateTime, setTargetDateTime] = useState(String(safeData.targetDateStr || '').slice(0, 16));
  
  const getInitialTaglineLines = () => {
    if (Array.isArray(safeData.heroTaglineLines) && safeData.heroTaglineLines.length > 0) {
      return [safeData.heroTaglineLines[0] || '', safeData.heroTaglineLines[1] || ''];
    }
    if (safeData.heroTagline) {
      const parts = safeData.heroTagline.split('\n');
      return [parts[0] || '', parts[1] || ''];
    }
    return ['', ''];
  };
  const initialTaglineLines = getInitialTaglineLines();
  const [taglineLine1, setTaglineLine1] = useState(initialTaglineLines[0]);
  const [taglineLine2, setTaglineLine2] = useState(initialTaglineLines[1]);

  const [headingHighlightLine, setHeadingHighlightLine] = useState(safeData.heroHeadingHighlightLine || 'none');
  const [bannerMediaType, setBannerMediaType] = useState(safeData.bannerMediaType || 'photo');
  const [bannerUrl, setBannerUrl] = useState(safeData.bannerImageUrl || '');
  const [bannerVideoUrl, setBannerVideoUrl] = useState(safeData.bannerVideoUrl || '');
  const [bannerTextAlignment, setBannerTextAlignment] = useState(safeData.bannerTextAlignment || 'left');
  const [bannerVideoSound, setBannerVideoSound] = useState(safeData.bannerVideoSound || 'off');

  // Video State
  const [videoUrl, setVideoUrl] = useState(safeData.videoUrl || '');
  const [bsVideoTitle, setBsVideoTitle] = useState('');
  const [bsVideoUrl, setBsVideoUrl] = useState('');
  const [editingBsVideoId, setEditingBsVideoId] = useState(null);

  // About State (Home Page & Read Full About Us Page)
  const [homeAboutHeader, setHomeAboutHeader] = useState(safeData.homeAboutHeader?.trim() || "ABOUT US");
  const [homeAboutHeaderError, setHomeAboutHeaderError] = useState('');
  const [aboutText, setAboutText] = useState(safeData.aboutText || "Inspired by the spirit of devotion, unity, and culture, Yuva Yuvak Mandal has been organizing the Ganesh Utsav Mahotsav since 1968.\nOur mission is to preserve our rich cultural heritage, pass on the sacred traditions of Ganesh Utsav to the younger generation, and bring youth together through devotion, cultural values, and community unity.");
  const [years, setYears] = useState(safeData.yearsCount || "50+");
  const [vols, setVols] = useState(safeData.volunteersCount || "25+");
  const [devs, setDevs] = useState(safeData.devoteesCount || "100+");

  // Read Full About Us Page State
  const [fullAboutHeader, setFullAboutHeader] = useState(safeData.fullAboutHeader?.trim() || "ABOUT YUVA YUVAK MANDAL");
  const [fullAboutHeaderError, setFullAboutHeaderError] = useState('');
  const [fullAboutSubText, setFullAboutSubText] = useState(safeData.fullAboutSubText || "Preserving rich cultural heritage, serving humanity through blood donation & food distribution, and uniting youth in divine devotion since 1968.");
  const [mandalName, setMandalName] = useState(safeData.mandalName || "YUVA YUVAK MANDAL 🚩");
  const [mandalLogoUrl, setMandalLogoUrl] = useState(safeData.mandalLogoUrl || "/mandal-logo.jpg");
  const [mandalAddress, setMandalAddress] = useState(safeData.mandalAddress || "Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002");
  const [aboutInstaHandle, setAboutInstaHandle] = useState(safeData.aboutInstaHandle || "@yuva_yuvak_mandal 🚩");
  const [aboutInstaUrl, setAboutInstaUrl] = useState(safeData.aboutInstaUrl || "https://www.instagram.com/yuva_yuvak_mandal/");

  // 3 Detail Highlight Story Cards
  const [aboutCard1Title, setAboutCard1Title] = useState(safeData.aboutCard1Title || "50+ Years Glorious Legacy");
  const [aboutCard1Desc, setAboutCard1Desc] = useState(safeData.aboutCard1Desc || "Founded in 1968 by passionate youth of Sagrampura, Navsari Bazaar, Surat, Yuva Yuvak Mandal has grown into one of the most respected Ganesh Utsav mandals in Gujarat.");
  const [aboutCard2Title, setAboutCard2Title] = useState(safeData.aboutCard2Title || "Cultural Mission & Vision");
  const [aboutCard2Desc, setAboutCard2Desc] = useState(safeData.aboutCard2Desc || "Our mission is to preserve rich Sanatan traditions, promote spiritual harmony, and empower youth through community leadership and divine service.");
  const [aboutCard3Title, setAboutCard3Title] = useState(safeData.aboutCard3Title || "A Glorious Legacy of Togetherness");
  const [aboutCard3Desc, setAboutCard3Desc] = useState(safeData.aboutCard3Desc || "This is more than just a celebration; it is a tradition of unity, devotion, and shared memories that brings our entire community together year after year.");

  // Contact Info & Contact Page Full Settings State
  const [cHeaderTitle, setCHeaderTitle] = useState(contactInfoObj.headerTitle?.trim() || "CONTACT YUVA YUVAK MANDAL");
  const [cHeaderTitleError, setCHeaderTitleError] = useState('');
  const [cHeaderSubText, setCHeaderSubText] = useState(contactInfoObj.headerSubText || "Reach out to our mandal committee, visit our sacred Pandal, or send us your devotional inquiries & volunteer requests.");
  const [cAddress, setCAddress] = useState(contactInfoObj.address || "Yuva Yuvak Mandal, Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002");
  const [cGmapsUrl, setCGmapsUrl] = useState(contactInfoObj.gmapsUrl || "https://www.google.com/maps/place/21%C2%B011'14.8%22N+72%C2%B049'30.5%22E/@21.1873731,72.8218984,17z/data=!4m4!3m3!8m2!3d21.1874444!4d72.8251389?hl=en-US&entry=ttu&g_ep=EgoyMDI2MDgyMy4wIKXMDSoASAFQAw%3D%3D");
  const [cInstaHandle, setCInstaHandle] = useState(contactInfoObj.instaHandle || "@yuva_yuvak_mandal 🚩");
  const [cInstaUrl, setCInstaUrl] = useState(contactInfoObj.instaUrl || "https://www.instagram.com/yuva_yuvak_mandal/");
  const [cSocialDesc, setCSocialDesc] = useState(contactInfoObj.socialDesc || "Follow our official Instagram page for daily HD Live Darshan, Aarti videos, and celebration updates.");
  const [cTimingPandalOpen, setCTimingPandalOpen] = useState(contactInfoObj.timingPandalOpen || "06:00 AM - 11:30 PM Daily");
  const [cTimingMorningAarti, setCTimingMorningAarti] = useState(contactInfoObj.timingMorningAarti || "08:30 AM");
  const [cTimingEveningAarti, setCTimingEveningAarti] = useState(contactInfoObj.timingEveningAarti || "08:30 PM");
  const [cTimingPrasad, setCTimingPrasad] = useState(contactInfoObj.timingPrasad || "After Aarti");
  const [cFormHeader, setCFormHeader] = useState(contactInfoObj.formHeader?.trim() || "Devotee Message & Inquiries");
  const [cFormHeaderError, setCFormHeaderError] = useState('');
  const [cFormSubText, setCFormSubText] = useState(contactInfoObj.formSubText || "Send a message to Yuva Yuvak Mandal Admin committee for Mahaprasad seva or volunteer inquiry.");
  const [cPhone1, setCPhone1] = useState(contactInfoObj.phone1 || "9876543210");
  const [cPhone2, setCPhone2] = useState(contactInfoObj.phone2 || "");
  const [cEmail, setCEmail] = useState(contactInfoObj.email || "yuvayuvakmandal@gmail.com");
  const [cTimings, setCTimings] = useState(contactInfoObj.timings || "");

  // 🌟 Header, Section Titles & Footer Branding State
  const [mandalLocation, setMandalLocation] = useState(safeData.mandalLocation || "Surat, Gujarat");
  const [bigScreenHeaderTitle, setBigScreenHeaderTitle] = useState(safeData.bigScreenHeaderTitle?.trim() || "FEEL THE DEVOTION - ON THE BIG SCREEN");
  const [bsTitleError, setBsTitleError] = useState('');
  const [reelsHeaderTitle, setReelsHeaderTitle] = useState(safeData.reelsHeaderTitle?.trim() || "LATEST REELS FROM INSTAGRAM");
  const [reelsTitleError, setReelsTitleError] = useState('');
  const [reelsHeaderSubText, setReelsHeaderSubText] = useState(safeData.reelsHeaderSubText || "Watch the latest devotional moments & celebration reels from our official Instagram page @yuva_yuvak_mandal 🚩");
  const [reelsInstaHandle, setReelsInstaHandle] = useState(safeData.reelsInstaHandle?.trim() || "@yuva_yuvak_mandal 🚩");
  const [reelsInstaUrl, setReelsInstaUrl] = useState(safeData.reelsInstaUrl || "https://www.instagram.com/yuva_yuvak_mandal/");
  const [reelsUrlError, setReelsUrlError] = useState('');
  const [reviewsBadge, setReviewsBadge] = useState(safeData.reviewsBadge !== undefined ? safeData.reviewsBadge : "Devotee Experiences & Reviews");
  const [reviewsTitle, setReviewsTitle] = useState(safeData.reviewsTitle?.trim() || "🚩 DEVOTEE FEEDBACK & BLESSINGS 🚩");
  const [reviewsTitleError, setReviewsTitleError] = useState('');
  const [reviewsSub, setReviewsSub] = useState(safeData.reviewsSub !== undefined ? safeData.reviewsSub : "Share your divine experience and blessings of Shri Ganesh Utsav Mahotsav!");
  const [footerMandalTitle, setFooterMandalTitle] = useState(safeData.footerMandalTitle || "YUVA YUVAK MANDAL 🚩");
  const [footerMandalTagline, setFooterMandalTagline] = useState(safeData.footerMandalTagline || "Shri Ganesh Utsav Mahotsav • Organised with devotion, grandeur and unity since 1968 in Surat, Gujarat.");
  const [footerAddressHeading, setFooterAddressHeading] = useState(safeData.footerAddressHeading || "Pandal Address");
  const [footerAddressText, setFooterAddressText] = useState(safeData.footerAddressText || "Yuva Yuvak Mandal, Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002");
  const [footerInstaUrl, setFooterInstaUrl] = useState(safeData.footerInstaUrl || "https://www.instagram.com/yuva_yuvak_mandal/");
  const [footerInstaText, setFooterInstaText] = useState(safeData.footerInstaText || "Join Instagram Community");
  const [footerMapHeading, setFooterMapHeading] = useState(safeData.footerMapHeading || "Map Location & Street View");
  const [footerMapEmbedUrl, setFooterMapEmbedUrl] = useState(safeData.footerMapEmbedUrl || "https://maps.google.com/maps?q=21.1874551,72.8251338&t=&z=17&ie=UTF8&iwloc=&output=embed");
  const [footerGoogleMapsUrl, setFooterGoogleMapsUrl] = useState(safeData.footerGoogleMapsUrl || "https://www.google.com/maps/place/21%C2%B011'14.8%22N+72%C2%B049'30.5%22E/@21.1873731,72.8218984,17z/data=!4m4!3m3!8m2!3d21.1874444!4d72.8251338");
  const [footerGoogleMapsBtnText, setFooterGoogleMapsBtnText] = useState(safeData.footerGoogleMapsBtnText || "Open in Google Maps");
  const [footerCopyrightText, setFooterCopyrightText] = useState(safeData.footerCopyrightText || "Yuva Yuvak Mandal. All Rights Reserved");

  // 🎨 Murtikar Section State
  const [murtikarHeaderTitle, setMurtikarHeaderTitle] = useState(safeData.murtikar?.headerTitle || safeData.murtikarHeaderTitle || "DIVINE CREATION - OUR IDOL SCULPTOR");
  const [murtikarName, setMurtikarName] = useState(safeData.murtikar?.name || "Kiran Manjrekar");
  const [murtikarBadge, setMurtikarBadge] = useState(safeData.murtikar?.badge || "RESPECTED IDOL SCULPTOR - MUMBAI");
  const [murtikarTagline, setMurtikarTagline] = useState(safeData.murtikar?.tagline || "Crafted with Devotion in Mumbai and Revered in Surat Ganesh-Utsav");
  const [murtikarPhoto, setMurtikarPhoto] = useState(safeData.murtikar?.photo || safeData.murtikar?.photoUrl || "");

  // New Event State (Home Schedule Cards)
  const [evTitle, setEvTitle] = useState('');
  const [evTime, setEvTime] = useState('');
  const [evDesc, setEvDesc] = useState('');

  // Full Schedule Page State
  const [fsHeaderTitle, setFsHeaderTitle] = useState(safeData.fullScheduleHeader?.trim() || "DIVINE AARTI & UTSAV SCHEDULE");
  const [fsHeaderTitleError, setFsHeaderTitleError] = useState('');
  const [fsHeaderSubText, setFsHeaderSubText] = useState(safeData.fullScheduleSubText || "Explore the complete 10-day event timeline, daily Aarti timings, Sattvik Mahaprasad, cultural programs, and Aagman/Visarjan highlights.");
  const [fsTitle, setFsTitle] = useState('');
  const [fsTime, setFsTime] = useState('05:00 PM Onwards');
  const [editingEventId, setEditingEventId] = useState(null);
  const editFormRef = useRef(null);
  const [timeHour, setTimeHour] = useState('05');
  const [timeMin, setTimeMin] = useState('00');
  const [timePeriod, setTimePeriod] = useState('PM');
  const [timeNote, setTimeNote] = useState('Onwards');
  const [isCustomTimeMode, setIsCustomTimeMode] = useState(false);
  const [fsCategory, setFsCategory] = useState('Aarti');
  const [fsDay, setFsDay] = useState('Daily');
  const [fsDesc, setFsDesc] = useState('');

  // Reel State (Upload & URL & Custom Real Metrics)
  const [reelUrl, setReelUrl] = useState('');
  const [reelTitleInput, setReelTitleInput] = useState('');
  const [reelUsernameInput, setReelUsernameInput] = useState('');
  const [reelAudioInput, setReelAudioInput] = useState('');
  const [reelLikesInput, setReelLikesInput] = useState('');
  const [reelCommentsInput, setReelCommentsInput] = useState('');
  const [reelSharesInput, setReelSharesInput] = useState('');
  const [reelVideoFileUrl, setReelVideoFileUrl] = useState('');
  const [reelPosterFileUrl, setReelPosterFileUrl] = useState('');
  const [editingReelId, setEditingReelId] = useState(null);
  const [isFetchingInsta, setIsFetchingInsta] = useState(false);
  const [reelMetaCache, setReelMetaCache] = useState(null);

  // New Gallery Item State
  const [galTitle, setGalTitle] = useState('');
  const [galYear, setGalYear] = useState(String(new Date().getFullYear()));
  const [galType, setGalType] = useState('Photo');
  const [galUrl, setGalUrl] = useState('');
  const [adminGalYearFilter, setAdminGalYearFilter] = useState('All');
  const [adminGalTypeFilter, setAdminGalTypeFilter] = useState('All');

  // Donation Form State (Admin Only)
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorWhatsApp, setDonorWhatsApp] = useState('');
  const [isSameAsPhone, setIsSameAsPhone] = useState(false);
  const [donorEmail, setDonorEmail] = useState('');
  const [donAmount, setDonAmount] = useState('');
  const [donType, setDonType] = useState('Cash');
  const [donCategory, setDonCategory] = useState('Mahaprasad & Bhandara Seva');
  const [otherSevaName, setOtherSevaName] = useState('');
  const [collectorName, setCollectorName] = useState('Volunteer Admin');
  const [autoOpenWhatsApp, setAutoOpenWhatsApp] = useState(true);
  const [donErrors, setDonErrors] = useState({ name: '', phone: '', whatsapp: '', email: '', amount: '', otherSeva: '' });
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Volunteer Management States
  const [volNameInput, setVolNameInput] = useState('');
  const [volPhoneInput, setVolPhoneInput] = useState('');
  const [canCashInput, setCanCashInput] = useState(true);
  const [canSchedInput, setCanSchedInput] = useState(false);
  const [canReelsInput, setCanReelsInput] = useState(true);
  const [canBannerInput, setCanBannerInput] = useState(false);

  const handleAddVolunteerSubmit = (e) => {
    e.preventDefault();
    if (!volNameInput.trim()) {
      triggerSuccess('⚠️ Please enter volunteer name!');
      return;
    }
    if (addVolunteer) {
      addVolunteer({
        name: volNameInput.trim(),
        phone: volPhoneInput.trim() || 'N/A',
        canCollectCash: canCashInput,
        canEditSchedule: canSchedInput,
        canAddReels: canReelsInput,
        canEditBanner: canBannerInput
      });
      triggerSuccess(`⚡ Live Added: Volunteer "${volNameInput.trim()}" registered with permissions!`);
      setVolNameInput('');
      setVolPhoneInput('');
    }
  };

  // Admin Password Management State
  const [currPassInput, setCurrPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passChangeLoading, setPassChangeLoading] = useState(false);
  const [passChangeMsg, setPassChangeMsg] = useState({ type: '', text: '' });

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassChangeMsg({ type: '', text: '' });

    if (!currPassInput.trim()) {
      setPassChangeMsg({ type: 'error', text: '⚠️ Please enter your current admin password.' });
      return;
    }
    if (!newPassInput.trim() || newPassInput.trim().length < 4) {
      setPassChangeMsg({ type: 'error', text: '⚠️ New password must be at least 4 characters long.' });
      return;
    }
    if (newPassInput !== confirmPassInput) {
      setPassChangeMsg({ type: 'error', text: '⚠️ New password and Confirm password do not match!' });
      return;
    }

    setPassChangeLoading(true);
    try {
      if (changeAdminPassword) {
        const res = await changeAdminPassword(currPassInput.trim(), newPassInput.trim());
        if (res && res.success) {
          setPassChangeMsg({ type: 'success', text: '✅ ' + (res.message || 'Admin password successfully changed!') });
          setCurrPassInput('');
          setNewPassInput('');
          setConfirmPassInput('');
          triggerSuccess('🔑 Admin Password successfully changed!');
        } else {
          setPassChangeMsg({ type: 'error', text: '❌ ' + (res.message || 'Incorrect current password.') });
        }
      } else {
        const response = await fetch(`${getApiBaseUrl()}/api/admin/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: currPassInput.trim(), newPassword: newPassInput.trim() })
        });
        const json = await response.json();
        if (json && json.success) {
          setPassChangeMsg({ type: 'success', text: '✅ ' + json.message });
          setCurrPassInput('');
          setNewPassInput('');
          setConfirmPassInput('');
          triggerSuccess('🔑 Admin Password successfully changed!');
        } else {
          setPassChangeMsg({ type: 'error', text: '❌ ' + (json.message || 'Incorrect current password.') });
        }
      }
    } catch (err) {
      setPassChangeMsg({ type: 'error', text: '❌ Connection error: ' + err.message });
    } finally {
      setPassChangeLoading(false);
    }
  };

  const hasInitializedOtherFieldsRef = React.useRef(false);

  useEffect(() => {
    if (siteData && !hasInitializedOtherFieldsRef.current) {
      hasInitializedOtherFieldsRef.current = true;
      if (Array.isArray(siteData.heroHeadingLines) && siteData.heroHeadingLines.length > 0) {
        setHeadingLine1(siteData.heroHeadingLines[0] || '');
        setHeadingLine2(siteData.heroHeadingLines[1] || '');
        setHeadingLine3(siteData.heroHeadingLines[2] || '');
        setHeadingLine4(siteData.heroHeadingLines[3] || '');
        setHeadingLine5(siteData.heroHeadingLines[4] || '');
      } else if (siteData.heroHeading) {
        const lines = siteData.heroHeading.split('\n');
        setHeadingLine1(lines[0] || '');
        setHeadingLine2(lines[1] || '');
        setHeadingLine3(lines[2] || '');
        setHeadingLine4(lines[3] || '');
        setHeadingLine5(lines[4] || '');
      }
      if (siteData.heroHeadingHighlightLine !== undefined) setHeadingHighlightLine(siteData.heroHeadingHighlightLine);
      if (siteData.targetDateStr) setTargetDateTime(siteData.targetDateStr.slice(0, 16));
      if (Array.isArray(siteData.heroTaglineLines) && siteData.heroTaglineLines.length > 0) {
        setTaglineLine1(siteData.heroTaglineLines[0] || '');
        setTaglineLine2(siteData.heroTaglineLines[1] || '');
      } else if (siteData.heroTagline !== undefined) {
        const parts = (siteData.heroTagline || '').split('\n');
        setTaglineLine1(parts[0] || '');
        setTaglineLine2(parts[1] || '');
      }
      if (siteData.bannerMediaType) setBannerMediaType(siteData.bannerMediaType);
      if (siteData.bannerImageUrl) setBannerUrl(siteData.bannerImageUrl);
      if (siteData.bannerVideoUrl) setBannerVideoUrl(siteData.bannerVideoUrl);
      if (siteData.bannerTextAlignment) setBannerTextAlignment(siteData.bannerTextAlignment);
      if (siteData.bannerVideoSound) setBannerVideoSound(siteData.bannerVideoSound);
      if (siteData.videoUrl) setVideoUrl(siteData.videoUrl);
      if (siteData.contactInfo) {
        if (siteData.contactInfo.headerTitle) setCHeaderTitle(siteData.contactInfo.headerTitle);
        if (siteData.contactInfo.headerSubText) setCHeaderSubText(siteData.contactInfo.headerSubText);
        if (siteData.contactInfo.address) setCAddress(siteData.contactInfo.address);
        if (siteData.contactInfo.gmapsUrl) setCGmapsUrl(siteData.contactInfo.gmapsUrl);
        if (siteData.contactInfo.instaHandle) setCInstaHandle(siteData.contactInfo.instaHandle);
        if (siteData.contactInfo.instaUrl) setCInstaUrl(siteData.contactInfo.instaUrl);
        if (siteData.contactInfo.socialDesc) setCSocialDesc(siteData.contactInfo.socialDesc);
        if (siteData.contactInfo.timingPandalOpen) setCTimingPandalOpen(siteData.contactInfo.timingPandalOpen);
        if (siteData.contactInfo.timingMorningAarti) setCTimingMorningAarti(siteData.contactInfo.timingMorningAarti);
        if (siteData.contactInfo.timingEveningAarti) setCTimingEveningAarti(siteData.contactInfo.timingEveningAarti);
        if (siteData.contactInfo.timingPrasad) setCTimingPrasad(siteData.contactInfo.timingPrasad);
        if (siteData.contactInfo.formHeader) setCFormHeader(siteData.contactInfo.formHeader);
        if (siteData.contactInfo.formSubText) setCFormSubText(siteData.contactInfo.formSubText);
        if (siteData.contactInfo.phone1) setCPhone1(siteData.contactInfo.phone1);
        if (siteData.contactInfo.phone2) setCPhone2(siteData.contactInfo.phone2);
        if (siteData.contactInfo.email) setCEmail(siteData.contactInfo.email);
        if (siteData.contactInfo.timings) setCTimings(siteData.contactInfo.timings);
      }
      if (siteData.homeAboutHeader !== undefined) setHomeAboutHeader(siteData.homeAboutHeader?.trim() || "ABOUT US");
      if (siteData.aboutText !== undefined) setAboutText(siteData.aboutText || "Inspired by the spirit of devotion, unity, and culture, Yuva Yuvak Mandal has been organizing the Ganesh Utsav Mahotsav since 1968.\nOur mission is to preserve our rich cultural heritage, pass on the sacred traditions of Ganesh Utsav to the younger generation, and bring youth together through devotion, cultural values, and community unity.");
      if (siteData.yearsCount !== undefined) setYears(siteData.yearsCount || "50+");
      if (siteData.volunteersCount !== undefined) setVols(siteData.volunteersCount || "200+");
      if (siteData.devoteesCount !== undefined) setDevs(siteData.devoteesCount || "50,000+");
      if (siteData.fullAboutHeader !== undefined) setFullAboutHeader(siteData.fullAboutHeader?.trim() || "ABOUT YUVA YUVAK MANDAL");
      if (siteData.fullAboutSubText !== undefined) setFullAboutSubText(siteData.fullAboutSubText || "Preserving rich cultural heritage, serving humanity through blood donation & food distribution, and uniting youth in divine devotion since 1968.");
      if (siteData.mandalName !== undefined) setMandalName(siteData.mandalName || "YUVA YUVAK MANDAL 🚩");
      if (siteData.mandalLogoUrl !== undefined) setMandalLogoUrl(siteData.mandalLogoUrl || "/mandal-logo.jpg");
      if (siteData.mandalAddress !== undefined) setMandalAddress(siteData.mandalAddress || "Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002");
      if (siteData.aboutInstaHandle !== undefined) setAboutInstaHandle(siteData.aboutInstaHandle || "@yuva_yuvak_mandal 🚩");
      if (siteData.aboutInstaUrl !== undefined) setAboutInstaUrl(siteData.aboutInstaUrl || "https://www.instagram.com/yuva_yuvak_mandal/");
      if (siteData.aboutCard1Title !== undefined) setAboutCard1Title(siteData.aboutCard1Title || "50+ Years Glorious Legacy");
      if (siteData.aboutCard1Desc !== undefined) setAboutCard1Desc(siteData.aboutCard1Desc || "Founded in 1968 by passionate youth of Sagrampura, Navsari Bazaar, Surat, Yuva Yuvak Mandal has grown into one of the most respected Ganesh Utsav mandals in Gujarat.");
      if (siteData.aboutCard2Title !== undefined) setAboutCard2Title(siteData.aboutCard2Title || "Cultural Mission & Vision");
      if (siteData.aboutCard2Desc !== undefined) setAboutCard2Desc(siteData.aboutCard2Desc || "Our mission is to preserve rich Sanatan traditions, promote spiritual harmony, and empower youth through community leadership and divine service.");
      if (siteData.aboutCard3Title !== undefined) setAboutCard3Title(siteData.aboutCard3Title || "A Glorious Legacy of Togetherness");
      if (siteData.aboutCard3Desc !== undefined) setAboutCard3Desc(siteData.aboutCard3Desc || "This is more than just a celebration; it is a tradition of unity, devotion, and shared memories that brings our entire community together year after year.");
      if (siteData.mandalLocation !== undefined) setMandalLocation(siteData.mandalLocation);
      if (siteData.bigScreenHeaderTitle !== undefined) {
        setBigScreenHeaderTitle(siteData.bigScreenHeaderTitle?.trim() || "FEEL THE DEVOTION - ON THE BIG SCREEN");
      }
      if (siteData.reelsHeaderTitle !== undefined) {
        setReelsHeaderTitle(siteData.reelsHeaderTitle?.trim() || "LATEST REELS FROM INSTAGRAM");
      }
      if (siteData.reelsHeaderSubText !== undefined) setReelsHeaderSubText(siteData.reelsHeaderSubText);
      if (siteData.reelsInstaHandle !== undefined) {
        setReelsInstaHandle(siteData.reelsInstaHandle?.trim() || "@yuva_yuvak_mandal 🚩");
      }
      if (siteData.reelsInstaUrl !== undefined) setReelsInstaUrl(siteData.reelsInstaUrl);
      if (siteData.reviewsBadge !== undefined) setReviewsBadge(siteData.reviewsBadge);
      if (siteData.reviewsTitle !== undefined) {
        setReviewsTitle(siteData.reviewsTitle?.trim() || "🚩 DEVOTEE FEEDBACK & BLESSINGS 🚩");
      }
      if (siteData.reviewsSub !== undefined) setReviewsSub(siteData.reviewsSub);
      if (siteData.footerMandalTitle !== undefined) setFooterMandalTitle(siteData.footerMandalTitle || "YUVA YUVAK MANDAL 🚩");
      if (siteData.footerMandalTagline !== undefined) setFooterMandalTagline(siteData.footerMandalTagline || "Shri Ganesh Utsav Mahotsav • Organised with devotion, grandeur and unity since 1968 in Surat, Gujarat.");
      if (siteData.footerAddressHeading !== undefined) setFooterAddressHeading(siteData.footerAddressHeading || "Pandal Address");
      if (siteData.footerAddressText !== undefined) setFooterAddressText(siteData.footerAddressText || "Yuva Yuvak Mandal, Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002");
      if (siteData.footerInstaUrl !== undefined) setFooterInstaUrl(siteData.footerInstaUrl || "https://www.instagram.com/yuva_yuvak_mandal/");
      if (siteData.footerInstaText !== undefined) setFooterInstaText(siteData.footerInstaText || "Join Instagram Community");
      if (siteData.footerMapHeading !== undefined) setFooterMapHeading(siteData.footerMapHeading || "Map Location & Street View");
      if (siteData.footerMapEmbedUrl !== undefined) setFooterMapEmbedUrl(siteData.footerMapEmbedUrl || "https://maps.google.com/maps?q=21.1874551,72.8251338&t=&z=17&ie=UTF8&iwloc=&output=embed");
      if (siteData.footerGoogleMapsUrl !== undefined) setFooterGoogleMapsUrl(siteData.footerGoogleMapsUrl || "https://www.google.com/maps/place/21%C2%B011'14.8%22N+72%C2%B049'30.5%22E/@21.1873731,72.8218984,17z/data=!4m4!3m3!8m2!3d21.1874444!4d72.8251338");
      if (siteData.footerGoogleMapsBtnText !== undefined) setFooterGoogleMapsBtnText(siteData.footerGoogleMapsBtnText || "Open in Google Maps");
      if (siteData.footerCopyrightText !== undefined) setFooterCopyrightText(siteData.footerCopyrightText || "Yuva Yuvak Mandal. All Rights Reserved");
      if (siteData.fullScheduleHeader !== undefined) setFsHeaderTitle(siteData.fullScheduleHeader || "DIVINE AARTI & UTSAV SCHEDULE");
      if (siteData.fullScheduleSubText !== undefined) setFsHeaderSubText(siteData.fullScheduleSubText || "Explore the complete 10-day event timeline, daily Aarti timings, Sattvik Mahaprasad, cultural programs, and Aagman/Visarjan highlights.");
      if (siteData.murtikar && typeof siteData.murtikar === 'object') {
        if (siteData.murtikar.headerTitle !== undefined) setMurtikarHeaderTitle(siteData.murtikar.headerTitle || "DIVINE CREATION - OUR IDOL SCULPTOR");
        if (siteData.murtikar.name !== undefined) setMurtikarName(siteData.murtikar.name || "Kiran Manjrekar");
        if (siteData.murtikar.badge !== undefined) setMurtikarBadge(siteData.murtikar.badge || "RESPECTED IDOL SCULPTOR - MUMBAI");
        if (siteData.murtikar.tagline !== undefined) setMurtikarTagline(siteData.murtikar.tagline || "Crafted with Devotion in Mumbai and Revered in Surat Ganesh-Utsav");
        if (siteData.murtikar.photo !== undefined) setMurtikarPhoto(siteData.murtikar.photo || "");
      }
    }
  }, [siteData]);

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const compressImageForMobile = (file) => {
    return new Promise((resolve) => {
      if (!file.type || !file.type.startsWith('image/') || file.type.includes('gif') || file.type.includes('svg')) {
        const reader = new FileReader();
        reader.onload = () => resolve({ fileName: file.name, base64Data: reader.result });
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 1920;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const base64Data = canvas.toDataURL('image/jpeg', 0.85);
          const safeFileName = (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
          resolve({ fileName: safeFileName, base64Data });
        };
        img.onerror = () => {
          resolve({ fileName: file.name, base64Data: reader.result });
        };
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const uploadMediaFile = async (fileOrEvent, setUrlState) => {
    let file = fileOrEvent;
    if (fileOrEvent && fileOrEvent.target && fileOrEvent.target.files) {
      file = fileOrEvent.target.files[0];
    }
    if (!file) return;

    // Check size limit for video files
    if (file.type && file.type.startsWith('video/') && file.size > 28 * 1024 * 1024) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(1);
      alert(`⚠️ Video file is too large (${mbSize} MB). Cloud server upload limit is 25 MB. Please select a video under 25 MB or paste a YouTube / online video link.`);
      return;
    }

    setIsUploadingMedia(true);
    triggerSuccess('⏳ Preparing & uploading file from phone... Please wait!');

    try {
      let processed = null;
      if (file.type && file.type.startsWith('image/')) {
        processed = await compressImageForMobile(file);
      } else {
        processed = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ fileName: file.name, base64Data: reader.result });
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      }

      if (!processed || !processed.base64Data) {
        triggerSuccess('⚠️ Could not read file from device. Please try again.');
        setIsUploadingMedia(false);
        return;
      }

      const res = await fetch(`${getApiBaseUrl()}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: processed.fileName, fileData: processed.base64Data })
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.url) {
          setUrlState(json.url);
          triggerSuccess('✅ File uploaded successfully! Click "+ Upload to Gallery" or Save below to publish.');
        } else {
          triggerSuccess(`❌ Upload failed: ${json.message || 'Server error'}`);
        }
      } else {
        let errMessage = 'Server rejected upload';
        try {
          const errData = await res.json();
          errMessage = errData.message || errMessage;
        } catch(e) {
          if (res.status === 413) {
            errMessage = 'File is too large for cloud server (limit ~25MB). Please choose a smaller file.';
          }
        }
        triggerSuccess(`❌ ${errMessage}`);
      }
    } catch (err) {
      console.log('Upload error:', err);
      triggerSuccess('⚠️ Upload failed due to network error. Please try again!');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleMediaUpload = uploadMediaFile;

  const handleSaveBanner = (e) => {
    e.preventDefault();
    const linesArray = [
      headingLine1.trim(),
      headingLine2.trim(),
      headingLine3.trim(),
      headingLine4.trim(),
      headingLine5.trim()
    ];
    const combinedHeading = linesArray.join('\n');
    const taglineLinesArray = [taglineLine1.trim(), taglineLine2.trim()];
    const combinedTagline = taglineLinesArray.filter(Boolean).join('\n');
    updateHeroBanner(
      combinedHeading,
      targetDateTime,
      combinedTagline,
      bannerUrl,
      bannerMediaType,
      bannerVideoUrl,
      bannerTextAlignment,
      bannerVideoSound,
      linesArray,
      headingHighlightLine,
      taglineLinesArray
    );

    triggerSuccess(`⚡ Live Updated: Hero 5-Line Title, 2-Line Tagline & Banner Settings Synced!`);
  };

  const handleSaveVideo = (e) => {
    e.preventDefault();
    updateVideoUrl(videoUrl);
    triggerSuccess('⚡ Live Updated: Big Screen Video Link Sync to all Viewers!');
  };

  const handleAddBigScreenVideo = (e) => {
    e.preventDefault();
    if (!bsVideoUrl) {
      triggerSuccess('⚠️ Please enter or upload a video URL first!');
      return;
    }
    if (editingBsVideoId !== null && editingBsVideoId !== undefined) {
      if (updateBigScreenVideo) {
        updateBigScreenVideo({
          id: editingBsVideoId,
          _id: editingBsVideoId,
          title: bsVideoTitle.trim(),
          url: bsVideoUrl.trim()
        });
        setEditingBsVideoId(null);
        setBsVideoTitle('');
        setBsVideoUrl('');
        triggerSuccess('⚡ Live Updated: Big Screen Video updated successfully!');
      }
    } else {
      if (addBigScreenVideo) {
        addBigScreenVideo({
          title: bsVideoTitle !== undefined ? bsVideoTitle.trim() : '',
          url: bsVideoUrl.trim()
        });
        setBsVideoTitle('');
        setBsVideoUrl('');
        triggerSuccess('⚡ Live Updated: New Video added to Big Screen Auto-Loop Playlist!');
      }
    }
  };

  const handleEditBigScreenVideo = (item) => {
    setEditingBsVideoId(item.id !== undefined ? item.id : item._id);
    setBsVideoTitle(item.title || '');
    setBsVideoUrl(item.url || '');
  };

  const handleCancelBsEdit = () => {
    setEditingBsVideoId(null);
    setBsVideoTitle('');
    setBsVideoUrl('');
  };

  const handleDeleteBigScreenVideo = (id) => {
    if (deleteBigScreenVideo) {
      deleteBigScreenVideo(id);
      if (String(editingBsVideoId) === String(id)) {
        setEditingBsVideoId(null);
        setBsVideoTitle('');
        setBsVideoUrl('');
      }
      triggerSuccess('🗑️ Video removed from Big Screen Playlist!');
    }
  };

  const handleMoveBigScreenVideo = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= bigScreenVideosList.length) return;
    const updated = [...bigScreenVideosList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    if (setBigScreenVideosList) {
      setBigScreenVideosList(updated);
      triggerSuccess('⚡ Live Updated: Big Screen Playlist order changed!');
    }
  };

  const handleSaveMurtikar = (e) => {
    e.preventDefault();
    if (!murtikarName.trim()) {
      triggerSuccess('⚠️ Murtikar Name cannot be empty!');
      return;
    }
    const updatedMurtikar = {
      headerTitle: (murtikarHeaderTitle || '').trim(),
      name: murtikarName.trim(),
      badge: (murtikarBadge || '').trim(),
      tagline: (murtikarTagline || '').trim(),
      photo: (murtikarPhoto || '').trim()
    };
    updateSiteData({
      murtikar: updatedMurtikar,
      murtikarHeaderTitle: (murtikarHeaderTitle || '').trim()
    });
    triggerSuccess('⚡ Live Updated: Murtikar Details saved successfully to website!');
  };

  const handleSaveAbout = (e) => {
    e.preventDefault();
    let hasError = false;

    if (!homeAboutHeader || !homeAboutHeader.trim()) {
      setHomeAboutHeaderError('Part 1: Home Page Section Title khali nahi reh sakta!');
      hasError = true;
    } else {
      setHomeAboutHeaderError('');
    }

    if (!fullAboutHeader || !fullAboutHeader.trim()) {
      setFullAboutHeaderError('Part 2: Full About Page Main Title khali nahi reh sakta!');
      hasError = true;
    } else {
      setFullAboutHeaderError('');
    }

    if (hasError) return;

    if (updateAboutDetails) {
      updateAboutDetails({
        homeAboutHeader: homeAboutHeader.trim(),
        aboutText,
        yearsCount: years,
        volunteersCount: vols,
        devoteesCount: devs,
        fullAboutHeader: fullAboutHeader.trim(),
        fullAboutSubText,
        mandalName,
        mandalLogoUrl,
        mandalAddress,
        aboutInstaHandle,
        aboutInstaUrl,
        aboutCard1Title,
        aboutCard1Desc,
        aboutCard2Title,
        aboutCard2Desc,
        aboutCard3Title,
        aboutCard3Desc
      });
    } else if (updateAboutText) {
      updateAboutText(aboutText, years, vols, devs);
    }
    triggerSuccess('⚡ Live Updated: Home Page About Us & Read Full About Us Page synced live!');
  };

  const handleSaveContactInfo = (e) => {
    e.preventDefault();
    let hasError = false;

    if (!cHeaderTitle || !cHeaderTitle.trim()) {
      setCHeaderTitleError('Main Page Heading khali nahi reh sakta!');
      hasError = true;
    } else {
      setCHeaderTitleError('');
    }

    if (!cFormHeader || !cFormHeader.trim()) {
      setCFormHeaderError('Inquiry Form Heading khali nahi reh sakta!');
      hasError = true;
    } else {
      setCFormHeaderError('');
    }

    if (hasError) return;

    if (updateContactInfo) {
      updateContactInfo({
        headerTitle: cHeaderTitle.trim(),
        headerSubText: cHeaderSubText,
        address: cAddress,
        gmapsUrl: cGmapsUrl,
        instaHandle: cInstaHandle,
        instaUrl: cInstaUrl,
        socialDesc: cSocialDesc,
        timingPandalOpen: cTimingPandalOpen,
        timingMorningAarti: cTimingMorningAarti,
        timingEveningAarti: cTimingEveningAarti,
        timingPrasad: cTimingPrasad,
        formHeader: cFormHeader.trim(),
        formSubText: cFormSubText,
        phone1: cPhone1,
        phone2: cPhone2,
        email: cEmail,
        timings: cTimings
      });
    }
    triggerSuccess('⚡ Live Updated: Contact Us Page Details synced to MongoDB & Public Site!');
  };

  const handleSaveBranding = (e) => {
    if (e) e.preventDefault();
    if (updateSiteData) {
      updateSiteData({
        mandalLogoUrl,
        mandalName,
        mandalLocation,
        footerMandalTitle,
        footerMandalTagline,
        footerAddressHeading,
        footerAddressText,
        footerInstaUrl,
        footerInstaText,
        footerMapHeading,
        footerMapEmbedUrl,
        footerGoogleMapsUrl,
        footerGoogleMapsBtnText,
        footerCopyrightText
      });
    }
    triggerSuccess('⚡ Live Updated: Header & Footer details synced to MongoDB & Public Site!');
  };

  const handleAddEventSubmit = (e) => {
    e.preventDefault();
    if (!evTitle || !evTime) return;
    addEvent(evTitle, evTime, evDesc);
    setEvTitle('');
    setEvTime('');
    setEvDesc('');
    triggerSuccess('⚡ Live Updated: New Home Page Schedule Card Added!');
  };

  const handleSaveFullScheduleHeader = (e) => {
    e.preventDefault();
    if (!fsHeaderTitle || !fsHeaderTitle.trim()) {
      setFsHeaderTitleError('Full Schedule Header Title khali nahi reh sakta!');
      return;
    }
    setFsHeaderTitleError('');
    if (updateFullScheduleHeader) {
      updateFullScheduleHeader(fsHeaderTitle.trim(), fsHeaderSubText);
    } else {
      updateHeroBanner({
        fullScheduleHeader: fsHeaderTitle.trim(),
        fullScheduleSubText: fsHeaderSubText
      });
    }
    triggerSuccess('⚡ Live Updated: Full Schedule Page Header & Subtext synced!');
  };

  
  const handleEditScheduleClick = (ev) => {
    if (!ev) return;
    const targetId = ev.id !== undefined ? ev.id : (ev._id !== undefined ? ev._id : Date.now());
    setEditingEventId(targetId);
    setFsTitle(ev.title || '');
    setFsTime(ev.time || '');
    setFsCategory(ev.category || 'Aarti');
    setFsDay(ev.day || 'Daily');
    setFsDesc(ev.desc || '');

    if (ev.time && typeof ev.time === 'string') {
      const match = ev.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s*(.*)$/i);
      if (match) {
        setTimeHour(match[1].padStart(2, '0'));
        setTimeMin(match[2]);
        setTimePeriod(match[3].toUpperCase());
        setTimeNote(match[4] ? match[4].trim() : 'None');
        setIsCustomTimeMode(false);
      } else {
        setIsCustomTimeMode(true);
      }
    }
    
    setTimeout(() => {
      if (editFormRef && editFormRef.current) {
        try {
          editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {}
      }
    }, 50);
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setFsTitle('');
    setFsTime('');
    setFsCategory('Aarti');
    setFsDay('Daily');
    setFsDesc('');
    setIsCustomTimeMode(false);
  };

  const handleAddFullScheduleSubmit = (e) => {
    e.preventDefault();
    const finalTime = isCustomTimeMode 
      ? (fsTime || '').trim() 
      : ((fsTime || '').trim() || `${timeHour}:${timeMin} ${timePeriod} ${timeNote === 'None' ? '' : timeNote}`.trim());

    if (!fsTitle || !fsTitle.trim() || !finalTime) {
      triggerSuccess('⚠️ Please fill in Title and Time for the schedule event!');
      return;
    }

    const payload = {
      title: fsTitle.trim(),
      time: finalTime,
      category: fsCategory || 'Aarti',
      day: fsDay || 'Daily',
      location: 'Ram Nivas Society Pandal, Surat',
      desc: (fsDesc || '').trim()
    };

    if (editingEventId !== null && editingEventId !== undefined) {
      if (updateScheduleEvent) {
        updateScheduleEvent({
          id: editingEventId,
          _id: editingEventId,
          ...payload
        });
        triggerSuccess('⚡ Live Updated: Schedule Event Updated successfully!');
      }
      setEditingEventId(null);
    } else {
      if (addScheduleEvent) {
        addScheduleEvent(payload);
        triggerSuccess('⚡ Live Updated: New Event added to Full View Schedule!');
      }
    }

    setFsTitle('');
    setFsTime(`${timeHour}:${timeMin} ${timePeriod} ${timeNote === 'None' ? '' : timeNote}`.trim());
    setFsDesc('');
    setIsCustomTimeMode(false);
  };

  const handleDeleteScheduleItem = (itemId) => {
    if (deleteScheduleEvent) {
      deleteScheduleEvent(itemId);
      triggerSuccess('🗑️ Schedule Event Deleted successfully!');
    }
  };

  const handleAddGallerySubmit = (e) => {
    e.preventDefault();
    if (!galUrl) {
      triggerSuccess(`⚠️ Please select a ${galType} file from your device first!`);
      return;
    }
    const cleanMandal = siteData?.mandalName ? siteData.mandalName.replace('🚩', '').trim() : 'Yuva Yuvak Mandal';
    const defaultTitle = `${cleanMandal} ${galYear} ${galType}`;
    addGalleryItem(defaultTitle, galYear, galType, galUrl);
    setGalUrl('');
    triggerSuccess(`⚡ Live Updated: New ${galType} added for Year ${galYear}!`);
  };

  const handleAutoFetchInstagramData = async (inputUrl) => {
    const targetUrl = (inputUrl || reelUrl || '').trim();
    if (!targetUrl || (!targetUrl.includes('instagram.com') && !targetUrl.includes('instagr.am'))) {
      return null;
    }
    setIsFetchingInsta(true);
    try {
      const apiHost = getApiBaseUrl();
      const res = await fetch(`${apiHost}/api/instagram/fetch-metadata?url=${encodeURIComponent(targetUrl)}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          const d = json.data;
          setReelMetaCache(d);
          if (d.title) setReelTitleInput(d.title);
          if (d.authorDisplayText || d.username) setReelUsernameInput(d.authorDisplayText || d.username);
          if (d.likesCount) setReelLikesInput(d.likesCount);
          if (d.commentsCount) setReelCommentsInput(d.commentsCount);
          if (d.sharesCount) setReelSharesInput(d.sharesCount);
          if (d.audioText) setReelAudioInput(d.audioText);
          if (d.posterUrl) setReelPosterFileUrl(d.posterUrl);
          if (d.videoUrl) setReelVideoFileUrl(d.videoUrl);
          triggerSuccess('✨ Auto-Fetched: Reel details, likes, comments & cover loaded from Instagram!');
          return d;
        } else {
          triggerSuccess('⚠️ Instagram fetch returned no data. Please verify the URL.');
        }
      } else {
        triggerSuccess('⚠️ Could not connect to Instagram fetch server.');
      }
    } catch (e) {
      console.log('Error auto-fetching instagram metadata:', e);
      triggerSuccess('⚠️ Auto-fetch error: ' + (e.message || 'Network error'));
    } finally {
      setIsFetchingInsta(false);
    }
    return null;
  };

  const handleAddReelSubmit = async (e) => {
    e.preventDefault();
    const urlToAdd = reelUrl.trim();

    if (!urlToAdd && !reelVideoFileUrl) {
      triggerSuccess('⚠️ Please enter an Instagram Reel URL or select a video file!');
      return;
    }

    let meta = reelMetaCache;
    if ((!meta || !meta.avatarUrl) && urlToAdd && (urlToAdd.includes('instagram.com') || urlToAdd.includes('instagr.am'))) {
      setIsFetchingInsta(true);
      try {
        const apiHost = getApiBaseUrl();
        const res = await fetch(`${apiHost}/api/instagram/fetch-metadata?url=${encodeURIComponent(urlToAdd)}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.data) {
            meta = json.data;
          }
        }
      } catch (e) {}
      setIsFetchingInsta(false);
    }

    const videoUrlToUse = reelVideoFileUrl || (meta && meta.videoUrl) || urlToAdd || '';
    const posterUrlToUse = reelPosterFileUrl || (meta && meta.posterUrl) || '';

    const reelPayload = {
      id: (meta && meta.shortcode) || (editingReelId || Date.now()),
      shortcode: (meta && meta.shortcode) || '',
      url: urlToAdd || officialInstaUrl,
      videoUrl: videoUrlToUse,
      posterUrl: posterUrlToUse,
      title: reelTitleInput.trim() || (meta && meta.title) || '',
      username: (meta && meta.username) || reelUsernameInput.trim() || 'Instagram',
      authorDisplayText: (meta && meta.authorDisplayText) || reelUsernameInput.trim() || 'Instagram',
      isVerified: Boolean(meta ? meta.isVerified : false),
      coauthorVerified: Boolean(meta ? meta.coauthorVerified : false),
      subtitleTag: (meta && meta.subtitleTag) || '',
      audioText: (reelAudioInput && reelAudioInput !== 'Original audio - Yuva Yuvak Mandal' ? reelAudioInput.trim() : (meta && meta.audioText)) || 'Original audio',
      likesCount: reelLikesInput.trim() || (meta && meta.likesCount) || '',
      commentsCount: reelCommentsInput.trim() || (meta && meta.commentsCount) || '',
      sharesCount: reelSharesInput.trim() || (meta && meta.sharesCount) || '',
      repostsCount: reelSharesInput.trim() || (meta && meta.repostsCount) || '',
      avatarUrl: (meta && meta.avatarUrl) || '/mandal-logo.jpg',
      secondaryAvatarUrl: (meta && meta.secondaryAvatarUrl) || ''
    };

    if (editingReelId !== null && editingReelId !== undefined) {
      if (updateReel) {
        updateReel(editingReelId, { id: editingReelId, ...reelPayload });
        triggerSuccess('⚡ Live Updated: Instagram Reel updated successfully!');
      }
      setEditingReelId(null);
    } else {
      if (addReel) {
        addReel(reelPayload);
        triggerSuccess('⚡ Live Updated: Nayi Reel website ke Instagram section mein live add ho gayi!');
      }
    }

    setReelMetaCache(null);
    setReelUrl('');
    setReelTitleInput('');
    setReelLikesInput('');
    setReelCommentsInput('');
    setReelSharesInput('');
    setReelAudioInput('');
    setReelUsernameInput('');
    setReelVideoFileUrl('');
    setReelPosterFileUrl('');
  };

  const handleEditReel = (reel) => {
    if (!reel) return;
    setEditingReelId(reel.id !== undefined ? reel.id : reel._id);
    setReelUrl(reel.url || '');
    setReelTitleInput(reel.title || '');
    setReelUsernameInput(reel.username || reel.author || '');
    setReelAudioInput(reel.audioText || reel.audio || '');
    setReelLikesInput(reel.likesCount || '');
    setReelCommentsInput(reel.commentsCount || '');
    setReelSharesInput(reel.sharesCount || reel.repostsCount || '');
    setReelVideoFileUrl(reel.videoUrl || '');
    setReelPosterFileUrl(reel.posterUrl || '');
  };

  const handleCancelReelEdit = () => {
    setEditingReelId(null);
    setReelUrl('');
    setReelTitleInput('');
    setReelLikesInput('');
    setReelCommentsInput('');
    setReelSharesInput('');
    setReelAudioInput('');
    setReelUsernameInput('');
    setReelVideoFileUrl('');
    setReelPosterFileUrl('');
  };

  const handleMoveReel = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= reelsList.length) return;
    const updated = [...reelsList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    if (setReelsList) {
      setReelsList(updated);
      triggerSuccess('⚡ Live Updated: Instagram Reels sequence order changed!');
    }
  };

  const handleDonorPhoneChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setDonorPhone(clean);
    if (isSameAsPhone) {
      setDonorWhatsApp(clean);
    }
    if (clean.length === 10) {
      setDonErrors(prev => ({ 
        ...prev, 
        phone: '', 
        ...(isSameAsPhone ? { whatsapp: '' } : {}) 
      }));
    }
  };

  const getPublicReceiptUrl = (donation) => {
    if (!donation) return window.location.origin;
    try {
      const payload = {
        receiptNo: donation.receiptNo || ('YYM-DON-' + String(donation.id).slice(-6)),
        donorName: donation.donorName,
        donorPhone: donation.donorPhone,
        donorWhatsApp: donation.donorWhatsApp,
        donorEmail: donation.donorEmail,
        amount: donation.amount,
        amountInWords: donation.amountInWords || numberToWordsINR(donation.amount),
        type: donation.type,
        category: donation.category,
        collectorName: donation.collectorName,
        date: donation.date,
        time: donation.time
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      return `${window.location.origin}/receipt?no=${encodeURIComponent(payload.receiptNo)}&d=${encodeURIComponent(encoded)}`;
    } catch (e) {
      return `${window.location.origin}/receipt?no=${encodeURIComponent(donation.receiptNo || donation.id)}`;
    }
  };

  const getCleanSlipCanvas = async () => {
    const el = document.querySelector('.donation-receipt-print-area');
    if (!el) return null;

    // Temporarily reset scroll of all parent elements
    const scrollParents = [];
    let p = el.parentElement;
    while (p && p !== document.body) {
      if (p.scrollTop > 0) {
        scrollParents.push({ el: p, top: p.scrollTop });
        p.scrollTop = 0;
      }
      p = p.parentElement;
    }

    const prevScrollY = window.scrollY;
    window.scrollTo(0, 0);

    const canvas = await html2canvas(el, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#FFFDF6',
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.querySelector('.donation-receipt-print-area');
        if (clonedEl) {
          clonedEl.style.margin = '0 auto';
          clonedEl.style.transform = 'none';
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.background = '#FFFDF6';
          let parent = clonedEl.parentElement;
          while (parent && parent !== clonedDoc.body) {
            parent.style.overflow = 'visible';
            parent.style.maxHeight = 'none';
            parent.style.height = 'auto';
            parent.scrollTop = 0;
            parent = parent.parentElement;
          }
        }
      }
    });

    // Restore scroll positions
    window.scrollTo(0, prevScrollY);
    scrollParents.forEach(item => { item.el.scrollTop = item.top; });

    return canvas;
  };

  const copySlipImageToClipboard = async (donation) => {
    try {
      const canvas = await getCleanSlipCanvas();
      if (!canvas) return false;
      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) return resolve(false);
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            triggerSuccess('📸 Print Slip Image clipboard par copy ho gayi hai! WhatsApp chat me seedha Ctrl + V (Paste) karein!');
            resolve(true);
          } catch (clipErr) {
            console.warn('Clipboard image copy failed, downloading fallback:', clipErr);
            const link = document.createElement('a');
            link.download = `Donation_Slip_${donation?.receiptNo || 'YYM'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            triggerSuccess('📥 Print Slip Image download ho gayi hai! Isse WhatsApp me attach karke bhej sakte hain.');
            resolve(true);
          }
        }, 'image/png');
      });
    } catch (e) {
      console.error('Error copying slip image:', e);
      return false;
    }
  };

  const downloadSlipImage = async (donation) => {
    try {
      const canvas = await getCleanSlipCanvas();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `Donation_Slip_${donation?.receiptNo || 'YYM'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      triggerSuccess('📥 Official Print Slip Image (PNG) downloaded successfully!');
    } catch (e) {
      console.error('Error downloading slip image:', e);
    }
  };

  const downloadReceiptPDF = async (donation) => {
    try {
      const canvas = await getCleanSlipCanvas();
      if (!canvas) return null;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, printWidth, Math.min(printHeight, pdfHeight - (margin * 2)));

      const filename = `Donation_Receipt_${donation?.receiptNo || ('YYM-DON-' + String(donation?.id).slice(-6))}.pdf`;
      pdf.save(filename);
      triggerSuccess('📄 Official Donation Receipt PDF downloaded successfully!');
      return pdf;
    } catch (e) {
      console.error('Error generating PDF:', e);
      return null;
    }
  };

  const handlePrintSlip = (donation) => {
    const el = document.querySelector('.donation-receipt-print-area');
    if (!el) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Donation Receipt - ${donation?.receiptNo || 'YYM'}</title>
          <style>
            @page {
              size: A5 portrait;
              margin: 6mm;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              background: #FFF;
              color: #2B0507;
              font-family: "Times New Roman", serif, sans-serif;
              display: flex;
              justify-content: center;
              padding: 10px;
            }
            .donation-receipt-print-area {
              width: 100% !important;
              max-width: 580px !important;
              background: #FFFDF6 !important;
              color: #2B0507 !important;
              border: 3px double #B8860B !important;
              border-radius: 12px !important;
              padding: 24px !important;
              box-shadow: none !important;
            }
            table { width: 100% !important; border-collapse: collapse !important; }
          </style>
        </head>
        <body>
          ${el.outerHTML}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const sendWhatsAppReceipt = (donation) => {
    if (!donation) return;
    const targetPhone = (donation.donorWhatsApp || donation.donorPhone || '').replace(/\D/g, '');
    const cleanPhone = targetPhone.length === 10 ? '91' + targetPhone : targetPhone;
    const isDiffWA = donation.donorWhatsApp && donation.donorPhone && donation.donorWhatsApp !== donation.donorPhone;

    // Automatically generate and download the official PDF receipt
    downloadReceiptPDF(donation);

    // Also copy slip image to clipboard as instant paste option
    copySlipImageToClipboard(donation);

    const pdfFileName = `Donation_Receipt_${donation.receiptNo || ('YYM-DON-' + String(donation.id).slice(-6))}.pdf`;

    const msg = `🚩 *YUVA YUVAK MANDAL - OFFICIAL DONATION RECEIPT* 🚩\n` +
      `Shri Ganesh Utsav Mahotsav 2026 • Surat, Gujarat\n` +
      `---------------------------------------------\n` +
      `📄 *Official Donation Receipt PDF attached (${pdfFileName})*\n` +
      `📜 *Receipt No:* ${donation.receiptNo || ('YYM-DON-' + String(donation.id).slice(-6))}\n` +
      `📅 *Date & Time:* ${donation.date || ''} ${donation.time || ''}\n` +
      `👤 *Donor Name:* ${donation.donorName}\n` +
      `📞 *Mobile No:* +91 ${donation.donorPhone || ''}\n` +
      (isDiffWA ? `💬 *WhatsApp No:* +91 ${donation.donorWhatsApp}\n` : '') +
      (donation.donorEmail ? `📧 *Email:* ${donation.donorEmail}\n` : '') +
      `💰 *Donation Amount:* ₹${Number(donation.amount).toLocaleString('en-IN')} /-\n` +
      `📝 *In Words:* ${donation.amountInWords || numberToWordsINR(donation.amount)}\n` +
      `🏷️ *Seva Category:* ${donation.category || 'General Festival Fund'}\n` +
      `💳 *Payment Mode:* ${donation.type || 'Cash'}\n` +
      `---------------------------------------------\n` +
      `🌺 *Ganpati Bappa Morya!* 🌺\n` +
      `Yuva Yuvak Mandal parivar ki or se aapka hardik aabhar. Bappa aapko aur aapke parivaar ko sukh, shanti aur samriddhi pradaan karein! 🙏🚩\n\n` +
      `📍 *Pandal Address:* Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat - 395002.\n` +
      `🌐 *Official Website:* https://yuvayuvakmandal.org`;

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const sendSmsReceipt = (donation) => {
    if (!donation) return;
    const rawPhone = (donation.donorPhone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? '+91' + rawPhone : rawPhone;
    const msg = `🚩 YUVA YUVAK MANDAL - OFFICIAL DONATION RECEIPT 🚩\n` +
      `Receipt No: ${donation.receiptNo || ('YYM-DON-' + String(donation.id).slice(-6))}\n` +
      `Donor: ${donation.donorName}\n` +
      `Amount: Rs. ${Number(donation.amount).toLocaleString('en-IN')} /-\n` +
      `In Words: ${donation.amountInWords || numberToWordsINR(donation.amount)}\n` +
      `Category: ${donation.category || 'General Seva'}\n` +
      `Payment: ${donation.type || 'Cash'}\n` +
      `Date: ${donation.date || ''} ${donation.time || ''}\n` +
      `Jai Shree Ganesh! Mandal me aapke sahyog hetu hardik aabhar. Bappa aapko sukh, shanti aur samriddhi pradan karein! 🙏🚩`;

    try {
      const a = document.createElement('a');
      a.href = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.open(`sms:${cleanPhone}?body=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const sendEmailReceipt = (donation) => {
    if (!donation || !donation.donorEmail) return;
    const subject = `Official Donation Receipt - Yuva Yuvak Mandal #${donation.receiptNo || donation.id}`;
    const body = `Respected ${donation.donorName},\n\n` +
      `Jai Shree Ganesh!\n\n` +
      `Thank you very much for your divine contribution towards Shri Ganesh Utsav Mahotsav 2026.\n\n` +
      `OFFICIAL DONATION RECEIPT DETAILS:\n` +
      `--------------------------------------------------\n` +
      `Receipt No: ${donation.receiptNo || ('YYM-DON-' + String(donation.id).slice(-6))}\n` +
      `Date & Time: ${donation.date || ''} ${donation.time || ''}\n` +
      `Donor Name: ${donation.donorName}\n` +
      `Mobile Number: +91 ${donation.donorPhone || ''}\n` +
      `Email Address: ${donation.donorEmail}\n` +
      `Donation Amount: Rs. ${Number(donation.amount).toLocaleString('en-IN')} /-\n` +
      `Amount in Words: ${donation.amountInWords || numberToWordsINR(donation.amount)}\n` +
      `Seva Category: ${donation.category}\n` +
      `Payment Mode: ${donation.type}\n` +
      `--------------------------------------------------\n\n` +
      `🌺 Ganpati Bappa Morya! 🌺\n` +
      `May Lord Ganesha bless you and your family with divine health, happiness, and eternal prosperity.\n\n` +
      `Warm regards,\n` +
      `Yuva Yuvak Mandal Committee\n` +
      `Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat - 395002\n` +
      `Official Website: https://yuvayuvakmandal.org`;

    try {
      const a = document.createElement('a');
      a.href = `mailto:${donation.donorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.open(`mailto:${donation.donorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    }
  };

  const dispatchAllReceiptChannels = (donation) => {
    if (!donation) return;

    // 1. WhatsApp in new tab / window
    if (donation.donorWhatsApp || donation.donorPhone) {
      sendWhatsAppReceipt(donation);
    }

    // 2. SMS (Phone Message)
    if (donation.donorPhone) {
      setTimeout(() => {
        sendSmsReceipt(donation);
      }, 500);
    }

    // 3. Email (to donor's email address)
    if (donation.donorEmail) {
      setTimeout(() => {
        sendEmailReceipt(donation);
      }, 1000);
    }

    // 4. Print official receipt slip dialog
    setTimeout(() => {
      handlePrintSlip(donation);
    }, 1500);
  };

  const handleAddDonationSubmit = (e) => {
    e.preventDefault();
    let newErrors = { name: '', phone: '', whatsapp: '', email: '', amount: '', otherSeva: '' };
    let hasErr = false;

    if (!donorName || !donorName.trim()) {
      newErrors.name = 'Donor name is required!';
      hasErr = true;
    }

    const cleanPhone = (donorPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      newErrors.phone = 'Valid 10-digit mobile number is required!';
      hasErr = true;
    }

    const cleanWhatsApp = isSameAsPhone 
      ? cleanPhone 
      : (donorWhatsApp || '').replace(/\D/g, '');
    if (!cleanWhatsApp || cleanWhatsApp.length !== 10) {
      newErrors.whatsapp = 'Valid 10-digit WhatsApp number is required!';
      hasErr = true;
    }

    if (!donorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())) {
      newErrors.email = 'Valid email address is required!';
      hasErr = true;
    }

    if (!donAmount || Number(donAmount) <= 0) {
      newErrors.amount = 'Valid donation amount (greater than 0) is required!';
      hasErr = true;
    }

    if (donCategory === 'Other Seva' && !otherSevaName.trim()) {
      newErrors.otherSeva = 'Please specify the other fund/seva name!';
      hasErr = true;
    }

    setDonErrors(newErrors);
    if (hasErr) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const receiptNo = `YYM-${now.getFullYear()}-DON-${String(Date.now()).slice(-6)}`;
    const amountInWords = numberToWordsINR(donAmount);

    const finalCategory = donCategory === 'Other Seva' 
      ? (otherSevaName.trim() ? `Other Seva - ${otherSevaName.trim()}` : 'Other Seva') 
      : donCategory;

    const newDonation = {
      id: Date.now(),
      receiptNo,
      donorName: donorName.trim(),
      donorPhone: cleanPhone,
      donorWhatsApp: cleanWhatsApp,
      donorEmail: donorEmail.trim(),
      amount: Number(donAmount),
      amountInWords,
      type: donType,
      category: finalCategory,
      collectorName: collectorName.trim() || 'Volunteer Admin',
      date: formattedDate,
      time: formattedTime
    };

    if (addDonation) {
      addDonation(newDonation);
    }

    setSelectedReceipt(newDonation);
    setIsReceiptModalOpen(true);

    if (autoOpenWhatsApp) {
      dispatchAllReceiptChannels(newDonation);
    }

    setDonorName('');
    setDonorPhone('');
    setDonorWhatsApp('');
    setIsSameAsPhone(false);
    setDonorEmail('');
    setDonAmount('');
    setOtherSevaName('');
    setDonErrors({ name: '', phone: '', whatsapp: '', email: '', amount: '', otherSeva: '' });
    triggerSuccess('💰 New Donation Record Added & Receipt Generated Successfully!');
  };

  const totalDonationSum = donationsList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalCashSum = donationsList.filter(d => d.type === 'Cash' || d.type === 'Cash Collection').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalOnlineSum = donationsList.filter(d => d.type !== 'Cash' && d.type !== 'Cash Collection').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="admin-cms-wrapper" style={{ maxWidth: '1180px', margin: '30px auto', padding: '20px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="heading-font gold-text" style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings color="#FFB300" size={32} /> Admin Control & Management Panel
          </h2>
          <p style={{ color: '#FFECB3', fontSize: '14px', marginTop: '4px' }}>
            Admin can manage website content, volunteer permissions, devotee inquiries & donation records seamlessly!
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div style={{
          background: 'rgba(105, 240, 174, 0.2)',
          border: '1px solid #69F0AE',
          color: '#69F0AE',
          padding: '12px 20px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600
        }}>
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {/* 🧭 Tab Navigation in Exact Sequence requested */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className={`admin-tab-btn ${activeTab === 'banner' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('banner')}>
          🖼️ Banner & Countdown Control
        </button>
        <button className={`admin-tab-btn ${activeTab === 'branding' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('branding')}>
          🌟 Header & Footer Control
        </button>
        <button className={`admin-tab-btn ${activeTab === 'gallery' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('gallery')}>
          🖼️ Gallery
        </button>
        <button className={`admin-tab-btn ${activeTab === 'schedule' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('schedule')}>
          ⏰ Schedule
        </button>
        <button className={`admin-tab-btn ${activeTab === 'about' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('about')}>
          ℹ️ About Us & Full Story
        </button>
        <button className={`admin-tab-btn ${activeTab === 'contact' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('contact')}>
          📞 Contact Us
        </button>
        <button className={`admin-tab-btn ${activeTab === 'video' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('video')}>
          📺 Big Screen Video
        </button>
        <button className={`admin-tab-btn ${activeTab === 'murtikar' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('murtikar')}>
          ✨ Murtikar Details
        </button>
        <button className={`admin-tab-btn ${activeTab === 'reviews' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('reviews')}>
          💬 Devotee Reviews
        </button>
        <button className={`admin-tab-btn ${activeTab === 'inquiries' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('inquiries')}>
          📬 Devotee Message Inquiry ({inquiriesList.length})
        </button>
        <button className={`admin-tab-btn ${activeTab === 'donations' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('donations')}>
          💰 Donation Control (Admin Only)
        </button>
        <button className={`admin-tab-btn ${activeTab === 'permissions' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('permissions')}>
          👥 Volunteer Permission ({volunteersList.length})
        </button>
        <button className={`admin-tab-btn ${activeTab === 'security' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('security')}>
          🔐 Password & Security
        </button>
      </div>

      {/* 1. TAB: BANNER & COUNTDOWN CONTROL */}
      {activeTab === 'banner' && (
        <div className="maroon-card gold-box-hover admin-card-box" style={{ padding: '28px', maxWidth: '100%', boxSizing: 'border-box' }}>
          <h3 className="heading-font" style={{ color: '#FFB300', marginBottom: '16px', fontSize: '20px' }}>
            🖼️ Hero Banner & Countdown Date Control
          </h3>
          <form onSubmit={handleSaveBanner} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
            {/* 👑 5-Line Custom Hero Heading Title */}
            <div className="admin-card-inner" style={{
              background: 'rgba(255, 179, 0, 0.05)',
              border: '1.5px solid rgba(255, 179, 0, 0.4)',
              borderRadius: '14px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
                <label style={{ fontSize: '14px', color: '#FFD700', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  👑 Hero Heading Title
                </label>
              </div>

              <div className="admin-form-grid" style={{ gap: '12px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <div className="admin-grid-item" style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <label style={{ fontSize: '13px', color: '#FFECB3', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                    🔹 Line 1
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter Line 1"
                    value={headingLine1}
                    onChange={(e) => setHeadingLine1(e.target.value)}
                    style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                  />
                </div>

                <div className="admin-grid-item" style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <label style={{ fontSize: '13px', color: '#FFECB3', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                    🔹 Line 2
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter Line 2"
                    value={headingLine2}
                    onChange={(e) => setHeadingLine2(e.target.value)}
                    style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                  />
                </div>

                <div className="admin-grid-item" style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <label style={{ fontSize: '13px', color: '#FFECB3', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                    🔹 Line 3
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter Line 3"
                    value={headingLine3}
                    onChange={(e) => setHeadingLine3(e.target.value)}
                    style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                  />
                </div>

                <div className="admin-grid-item" style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <label style={{ fontSize: '13px', color: '#FFECB3', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                    🔹 Line 4
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter Line 4"
                    value={headingLine4}
                    onChange={(e) => setHeadingLine4(e.target.value)}
                    style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                  />
                </div>

                <div className="admin-grid-item" style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <label style={{ fontSize: '13px', color: '#FFECB3', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                    🔹 Line 5
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter Line 5"
                    value={headingLine5}
                    onChange={(e) => setHeadingLine5(e.target.value)}
                    style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                  />
                </div>

                <div className="admin-grid-item" style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <label style={{ fontSize: '13px', color: '#FFD700', display: 'block', marginBottom: '5px', fontWeight: 700 }}>
                    ✨ Highlight Sentence
                  </label>
                  <select
                    className="form-input"
                    value={headingHighlightLine}
                    onChange={(e) => setHeadingHighlightLine(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#FFF', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                  >
                    <option value="none">No Highlight</option>
                    <option value="1">Highlight Line 1</option>
                    <option value="2">Highlight Line 2</option>
                    <option value="3">Highlight Line 3</option>
                    <option value="4">Highlight Line 4</option>
                    <option value="5">Highlight Line 5</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
              <label style={{ fontSize: '13px', color: '#FFECB3', display: 'block', marginBottom: '5px' }}>Target Countdown Date & Time</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={targetDateTime}
                onChange={(e) => setTargetDateTime(e.target.value)}
                style={{ colorScheme: 'dark', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
              />
            </div>

            <div className="admin-card-inner" style={{ background: 'rgba(255, 179, 0, 0.05)', border: '1px solid rgba(255, 179, 0, 0.25)', borderRadius: '12px', padding: '16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
              <label style={{ fontSize: '13.5px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
                📜 Hero Tagline (2 Lines - Optional)
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <div style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    🔹 Tagline Line 1
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter Tagline Line 1 (Optional - leave empty if not needed)"
                    value={taglineLine1}
                    onChange={(e) => setTaglineLine1(e.target.value)}
                    style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    🔹 Tagline Line 2
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter Tagline Line 2 (Optional - leave empty if not needed)"
                    value={taglineLine2}
                    onChange={(e) => setTaglineLine2(e.target.value)}
                    style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            <div className="admin-form-grid" style={{
              gap: '14px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <div className="admin-grid-item" style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <label style={{ fontSize: '13px', color: '#FFECB3', display: 'block', marginBottom: '6px' }}>Banner Media Type</label>
                <select 
                  className="form-input" 
                  value={bannerMediaType}
                  onChange={(e) => setBannerMediaType(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#FFF', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                >
                  <option value="photo">🖼️ Photo Banner</option>
                  <option value="video">🎥 Video Banner</option>
                </select>
              </div>

              <div className="admin-grid-item" style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <label style={{ fontSize: '13px', color: '#FFECB3', display: 'block', marginBottom: '6px' }}>📐 Text Alignment Position</label>
                <select 
                  className="form-input" 
                  value={bannerTextAlignment}
                  onChange={(e) => setBannerTextAlignment(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#FFF', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                >
                  <option value="left">⬅️ Left Aligned (Default)</option>
                  <option value="center">↔️ Middle / Center Aligned</option>
                  <option value="right">➡️ Right Aligned</option>
                </select>
              </div>

              {bannerMediaType === 'video' && (
                <div style={{ minWidth: 0 }}>
                  <label style={{ fontSize: '13px', color: '#FFECB3', display: 'block', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    🔊 Video Sound Setting
                  </label>
                  <select 
                    className="form-input" 
                    value={bannerVideoSound}
                    onChange={(e) => setBannerVideoSound(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#FFF', width: '100%', boxSizing: 'border-box', textOverflow: 'ellipsis' }}
                  >
                    <option value="off">🔊 Mute / Unmute Button (Default Muted)</option>
                    <option value="on">🔊 Mute / Unmute Button (Sound ON)</option>
                    <option value="no_sound">🔇 No Sound (Button Disabled)</option>
                  </select>
                </div>
              )}
            </div>

            {bannerMediaType === 'photo' ? (
              <div style={{ background: 'rgba(255,179,0,0.08)', padding: '16px', borderRadius: '12px', border: '1px dashed #FFB300' }}>
                <label style={{ fontSize: '13px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  🖼️ Photo Banner Image File / URL
                </label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  placeholder="Enter image URL or select photo file from device"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  style={{ wordBreak: 'break-all', resize: 'vertical', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }}
                />
                <input 
                  type="file" 
                  accept={ALL_IMAGE_TYPES}
                  id="bannerImageFileInput"
                  style={{ display: 'none' }}
                  onChange={(e) => uploadMediaFile(e.target.files[0], setBannerUrl)}
                />
                <button 
                  type="button"
                  onClick={() => document.getElementById('bannerImageFileInput').click()}
                  style={{ background: 'rgba(255,179,0,0.2)', border: '1px solid #FFB300', color: '#FFB300', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', width: '100%', fontWeight: 700 }}
                >
                  📁 Select Photo File From Device
                </button>
                {bannerUrl && (
                  <div style={{ marginTop: '12px', textAlign: 'center', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.3)' }}>
                    <p style={{ color: '#FFD700', fontSize: '11px', margin: '0 0 8px', fontWeight: 600 }}>👁️ Selected Photo Preview:</p>
                    <img 
                      id="bannerImgPreviewEl"
                      src={resolveMediaUrl(bannerUrl)} 
                      alt="Banner Preview" 
                      style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain' }} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const errEl = document.getElementById('bannerImgErrNotice');
                        if (errEl) errEl.style.display = 'block';
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'inline-block';
                        const errEl = document.getElementById('bannerImgErrNotice');
                        if (errEl) errEl.style.display = 'none';
                      }}
                    />
                    <div id="bannerImgErrNotice" style={{ display: 'none', color: '#FFA000', fontSize: '12px', padding: '8px', background: 'rgba(255, 160, 0, 0.1)', borderRadius: '6px' }}>
                      ⚠️ Photo load nahi hui (Purana link ya missing file). Kripya upar "Select Photo File From Device" se naya photo chunein.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'rgba(255,179,0,0.08)', padding: '16px', borderRadius: '12px', border: '1px dashed #FFB300' }}>
                <label style={{ fontSize: '13px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  🎥 Video Banner Video File / YouTube Link
                </label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  placeholder="Enter video URL, YouTube link or select video file from device"
                  value={bannerVideoUrl}
                  onChange={(e) => setBannerVideoUrl(e.target.value)}
                  style={{ wordBreak: 'break-all', resize: 'vertical', marginBottom: '10px', width: '100%' }}
                />
                <input 
                  type="file" 
                  accept={ALL_VIDEO_TYPES}
                  id="bannerVideoFileInput"
                  style={{ display: 'none' }}
                  onChange={(e) => uploadMediaFile(e.target.files[0], setBannerVideoUrl)}
                />
                <button 
                  type="button"
                  onClick={() => document.getElementById('bannerVideoFileInput').click()}
                  style={{ background: 'rgba(255,179,0,0.2)', border: '1px solid #FFB300', color: '#FFB300', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', width: '100%', fontWeight: 700 }}
                >
                  📁 Select Video File From Device
                </button>
                {bannerVideoUrl && (
                  <div style={{ marginTop: '12px', textAlign: 'center', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.3)' }}>
                    <p style={{ color: '#FFD700', fontSize: '11px', margin: '0 0 8px', fontWeight: 600 }}>👁️ Selected Video Preview:</p>
                    <video 
                      src={resolveMediaUrl(bannerVideoUrl)} 
                      controls 
                      muted 
                      playsInline
                      style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '6px' }} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const errEl = document.getElementById('bannerVidErrNotice');
                        if (errEl) errEl.style.display = 'block';
                      }}
                      onLoadedData={(e) => {
                        e.target.style.display = 'inline-block';
                        const errEl = document.getElementById('bannerVidErrNotice');
                        if (errEl) errEl.style.display = 'none';
                      }}
                    />
                    <div id="bannerVidErrNotice" style={{ display: 'none', color: '#FFA000', fontSize: '12px', padding: '8px', background: 'rgba(255, 160, 0, 0.1)', borderRadius: '6px' }}>
                      ⚠️ Video load nahi hui (Purana link ya missing file). Kripya upar "Select Video File From Device" se naya video chunein ya valid link dalein.
                    </div>
                  </div>
                )}
              </div>
            )}

            <p style={{ color: '#FFECB3', fontSize: '12px', margin: '12px 0 4px', textAlign: 'center', fontWeight: 600 }}>
              📌 File upload hone ke baad neeche <span style={{ color: '#FFD700' }}>"Save & Update Live Banner"</span> button par click karein!
            </p>

            <button type="submit" className="btn-gold" style={{ marginTop: '8px', justifyContent: 'center' }}>
              ⚡ Save & Update Live Banner
            </button>
          </form>
        </div>
      )}

      {/* 🌟 TAB: HEADER, FOOTER & SECTION TITLES */}
      {activeTab === 'branding' && (
        <div className="maroon-card gold-box-hover" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 className="heading-font" style={{ color: '#FFB300', margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🌟 Header & Footer Control
              </h3>
            </div>
          </div>

          <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. 👑 Header & Logo (Navbar) */}
            <div className="admin-card-inner" style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '14px', border: '1.5px solid rgba(255,179,0,0.3)', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px' }}>👑</span>
                <h4 style={{ color: '#FFD700', fontSize: '16px', margin: 0, fontWeight: 700 }}>
                  1. Header / Navbar Branding (Logo, Mandal Name & Location)
                </h4>
              </div>

              <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                {/* Logo with live circular preview */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                  <div style={{
                    width: '65px',
                    height: '65px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2.5px solid #FFB300',
                    boxShadow: '0 0 14px rgba(255, 179, 0, 0.4)',
                    background: '#000',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src={mandalLogoUrl || "/mandal-logo.jpg"} 
                      alt="Logo Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Mandal Logo (Image URL or Upload File)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={mandalLogoUrl} 
                        onChange={(e) => setMandalLogoUrl(e.target.value)} 
                        placeholder="e.g. /mandal-logo.jpg or upload" 
                        style={{ flex: 1, minWidth: 0 }} 
                      />
                      <label className="btn-outline-gold" style={{ cursor: 'pointer', padding: '8px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        📁 Upload
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={(e) => uploadMediaFile(e, setMandalLogoUrl)} 
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Mandal Name */}
                <div style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Mandal Name (Header & Mobile Drawer)
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={mandalName} 
                    onChange={(e) => setMandalName(e.target.value)} 
                    placeholder="e.g. YUVA YUVAK MANDAL" 
                    style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }} 
                  />
                </div>

                {/* Mandal Location */}
                <div style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    City / Location Subtitle (Under Logo)
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={mandalLocation} 
                    onChange={(e) => setMandalLocation(e.target.value)} 
                    placeholder="e.g. Surat, Gujarat" 
                    style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }} 
                  />
                </div>
              </div>
            </div>

            {/* 2. 🦶 Footer Section & Map Details */}
            <div className="admin-card-inner" style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '14px', border: '1.5px solid rgba(255,179,0,0.3)', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px' }}>🦶</span>
                <h4 style={{ color: '#FFD700', fontSize: '16px', margin: 0, fontWeight: 700 }}>
                  2. Footer & Map Location Settings
                </h4>
              </div>

              <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Footer Column 1: Mandal Title
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={footerMandalTitle} 
                    onChange={(e) => setFooterMandalTitle(e.target.value)} 
                    placeholder="e.g. YUVA YUVAK MANDAL 🚩" 
                    style={{ width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Footer Column 2: Pandal Address Heading
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={footerAddressHeading} 
                    onChange={(e) => setFooterAddressHeading(e.target.value)} 
                    placeholder="e.g. Pandal Address" 
                    style={{ width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Footer Column 3: Map Location Heading
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={footerMapHeading} 
                    onChange={(e) => setFooterMapHeading(e.target.value)} 
                    placeholder="e.g. Map Location & Street View" 
                    style={{ width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Footer Column 1: Mandal Story / Tagline Description
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="2"
                    value={footerMandalTagline} 
                    onChange={(e) => setFooterMandalTagline(e.target.value)} 
                    placeholder="e.g. Shri Ganesh Utsav Mahotsav • Organised with devotion, grandeur and unity since 1968 in Surat, Gujarat." 
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} 
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Footer Column 2: Full Pandal Address Text
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="2"
                    value={footerAddressText} 
                    onChange={(e) => setFooterAddressText(e.target.value)} 
                    placeholder="e.g. Yuva Yuvak Mandal, Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002" 
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Instagram Community Button Text
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={footerInstaText} 
                    onChange={(e) => setFooterInstaText(e.target.value)} 
                    placeholder="e.g. Join Instagram Community" 
                    style={{ width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Instagram Community Link
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={footerInstaUrl} 
                    onChange={(e) => setFooterInstaUrl(e.target.value)} 
                    placeholder="e.g. https://www.instagram.com/yuva_yuvak_mandal/" 
                    style={{ width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Google Maps Button Label
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={footerGoogleMapsBtnText} 
                    onChange={(e) => setFooterGoogleMapsBtnText(e.target.value)} 
                    placeholder="e.g. Open in Google Maps" 
                    style={{ width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Google Maps Link
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={footerGoogleMapsUrl} 
                    onChange={(e) => setFooterGoogleMapsUrl(e.target.value)} 
                    placeholder="e.g. https://www.google.com/maps/..." 
                    style={{ width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Google Maps Iframe Embed URL (Map Widget)
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={footerMapEmbedUrl} 
                    onChange={(e) => setFooterMapEmbedUrl(e.target.value)} 
                    placeholder="e.g. https://maps.google.com/maps?q=21.1874551,72.8251338&t=&z=17&ie=UTF8&iwloc=&output=embed" 
                    style={{ width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Bottom Copyright Text
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={footerCopyrightText} 
                    onChange={(e) => setFooterCopyrightText(e.target.value)} 
                    placeholder="e.g. 2026 Yuva Yuvak Mandal. All Rights Reserved" 
                    style={{ width: '100%', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button 
              type="submit" 
              className="btn-gold" 
              style={{
                padding: '16px 28px',
                fontSize: '16px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.45)',
                cursor: 'pointer'
              }}
            >
              💾 Save Header & Footer Changes
            </button>
          </form>
        </div>
      )}

      {/* 2. TAB: GALLERY */}
      {activeTab === 'gallery' && (
        <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px', alignItems: 'stretch', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <div className="maroon-card gold-box-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="heading-font" style={{ color: '#FFB300', marginBottom: '16px', fontSize: '18px' }}>
              + Add Year-Wise Photo / Video to Gallery
            </h3>
            <form onSubmit={handleAddGallerySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#FFECB3' }}>Year *</label>
                  <select 
                    className="form-input" 
                    value={galYear}
                    onChange={(e) => setGalYear(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#FFF' }}
                  >
                    {Array.from({ length: (new Date().getFullYear()) - 2006 + 1 }, (_, i) => (new Date().getFullYear()) - i).map(yr => (
                      <option key={yr} value={String(yr)}>{yr}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#FFECB3' }}>Media Type *</label>
                  <select 
                    className="form-input" 
                    value={galType}
                    onChange={(e) => {
                      setGalType(e.target.value);
                      setGalUrl('');
                    }}
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#FFF' }}
                  >
                    <option value="Photo">📷 Photo</option>
                    <option value="Video">🎥 Video</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'rgba(255, 179, 0, 0.08)', border: '1px dashed #FFB300', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <input 
                  type="file" 
                  accept={galType === 'Photo' ? ALL_IMAGE_TYPES : ALL_VIDEO_TYPES}
                  id="galleryMediaFileInput"
                  style={{ display: 'none' }}
                  onChange={(e) => uploadMediaFile(e.target.files[0], setGalUrl)}
                />
                <button 
                  type="button"
                  onClick={() => document.getElementById('galleryMediaFileInput').click()}
                  style={{
                    background: 'rgba(255, 179, 0, 0.25)',
                    border: '1px solid #FFB300',
                    color: '#FFB300',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📁 Choose {galType} File From Device
                </button>
                {galUrl && (
                  <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(105, 240, 174, 0.15)', border: '1px solid #69F0AE', borderRadius: '8px', fontSize: '12px', color: '#69F0AE', fontWeight: 600, wordBreak: 'break-all' }}>
                    ✅ {galType} Selected! Click "+ Upload to Gallery" below to save.
                  </div>
                )}
              </div>

              <button type="submit" className="btn-gold" style={{ justifyContent: 'center', marginTop: 'auto' }}>
                + Upload to Gallery
              </button>
            </form>
          </div>

          <div className="maroon-card gold-box-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 className="heading-font" style={{ color: '#FFB300', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🖼️ Uploaded Gallery Items ({galleryList.length})
                </h3>
                <p style={{ color: '#FFECB3', fontSize: '11.5px', margin: '4px 0 0', opacity: 0.85 }}>
                  Year-wise visual preview to inspect photos & videos before deleting
                </p>
              </div>
            </div>

            {/* Filter Bar: Year & Media Type */}
            <div style={{
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid var(--gold-border)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '18px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              {/* Year Filter Dropdown / Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#FFD700', fontWeight: 700 }}>📁 Year Filter:</span>
                <select 
                  value={adminGalYearFilter} 
                  onChange={(e) => setAdminGalYearFilter(e.target.value)}
                  style={{
                    background: '#2B0507',
                    border: '1px solid var(--gold-border)',
                    color: '#FFF',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">All Years</option>
                  {Array.from(new Set([
                    ...Array.from({ length: (new Date().getFullYear()) - 2006 + 1 }, (_, i) => String((new Date().getFullYear()) - i)),
                    ...(Array.isArray(galleryList) ? galleryList : []).map(item => String(item.year))
                  ])).sort((a, b) => b - a).map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#FFD700', fontWeight: 700 }}>Media:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['All', 'Photo', 'Video'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdminGalTypeFilter(type)}
                      style={{
                        background: adminGalTypeFilter === type ? 'var(--gold-gradient)' : 'rgba(255,215,0,0.1)',
                        color: adminGalTypeFilter === type ? '#2B0507' : '#FFD700',
                        border: '1px solid var(--gold-border)',
                        padding: '4px 10px',
                        borderRadius: '14px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {type === 'All' ? 'All' : type === 'Photo' ? '📷 Photo' : '🎥 Video'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gallery Media Grid with Thumbnails (Scrollable 430px Container for 4 full cards) */}
            {galleryList.length === 0 ? (
              <p style={{ color: '#AAA', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
                No gallery media uploaded yet. Use the form on the left to add year-wise photos/videos!
              </p>
            ) : (
              <div style={{ maxHeight: '430px', overflowY: 'auto', paddingRight: '4px' }}>
                {(() => {
                  const filteredList = galleryList.filter(item => {
                    const yearMatch = adminGalYearFilter === 'All' || String(item.year) === String(adminGalYearFilter);
                    const typeMatch = adminGalTypeFilter === 'All' || item.type === adminGalTypeFilter;
                    return yearMatch && typeMatch;
                  });

                  if (filteredList.length === 0) {
                    return (
                      <p style={{ color: '#AAA', fontSize: '12.5px', textAlign: 'center', padding: '24px 0' }}>
                        No media found for year <strong>{adminGalYearFilter}</strong> ({adminGalTypeFilter}).
                      </p>
                    );
                  }

                  return (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '14px'
                    }}>
                      {filteredList.map((item) => {
                        const ytThumb = getYouTubeThumbnail(item.url);
                        return (
                          <div 
                            key={item.id || item._id} 
                            style={{
                              background: 'linear-gradient(135deg, rgba(37,4,6,0.95) 0%, rgba(20,2,3,0.98) 100%)',
                              border: '1.5px solid var(--gold-border)',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              position: 'relative',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
                            }}
                          >
                            {/* Thumbnail Box */}
                            <div style={{ position: 'relative', width: '100%', height: '135px', background: '#000', overflow: 'hidden' }}>
                              {item.type === 'Photo' ? (
                                <img 
                                  src={resolveMediaUrl(item.url)} 
                                  alt={item.title} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  onError={(e) => { e.target.onerror = null; e.target.src = '/bappa-banner.jpg'; }}
                                />
                              ) : (
                                ytThumb ? (
                                  <img 
                                    src={ytThumb} 
                                    alt={item.title} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  />
                                ) : (
                                  <video 
                                    src={resolveMediaUrl(item.url)} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    muted 
                                    preload="metadata"
                                  />
                                )
                              )}

                              {/* Media Type Tag (Top Left) */}
                              <span style={{
                                position: 'absolute',
                                top: '6px',
                                left: '6px',
                                background: 'rgba(0,0,0,0.85)',
                                color: '#FFF',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                border: '1px solid rgba(255,215,0,0.4)',
                                backdropFilter: 'blur(4px)'
                              }}>
                                {item.type === 'Photo' ? '📷 Photo' : '🎥 Video'}
                              </span>

                              {/* Year Badge (Top Right) */}
                              <span style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                background: 'linear-gradient(90deg, #FFD700, #FFA000)',
                                color: '#2B0507',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: 800,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.6)'
                              }}>
                                {item.year}
                              </span>
                            </div>

                            {/* Delete Button Container */}
                            <div style={{ padding: '8px' }}>
                              <button 
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete "${item.title || 'Media'}" (${item.type}) from year ${item.year}?`)) {
                                    deleteGalleryItem(item.id || item._id);
                                  }
                                }}
                                style={{
                                  background: 'rgba(255, 52, 52, 0.18)',
                                  border: '1px solid #FF5252',
                                  color: '#FF5252',
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  width: '100%'
                                }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TAB: SCHEDULE CONTROL */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          


          {/* ⚡ FLEXIBLE AAGMAN & 10-DAY FESTIVAL DATES ENGINE CARD */}
          {(() => {
            const aagmanVal = safeData.aagmanDate || '2026-09-12';
            const festStartVal = safeData.festivalStartDate || '2026-09-14';

            const timelineInfo = calculateFullFestivalTimeline ? calculateFullFestivalTimeline(safeData) : { timeline: [] };
            const curDayInfo = getCurrentFestivalDayInfo ? getCurrentFestivalDayInfo(safeData) : { isFestivalActive: false };
            const computedTodays = getComputedTodaysEvents ? getComputedTodaysEvents(safeData) : [];

            return (
              <div className="maroon-card gold-box-hover" style={{ padding: '24px', background: 'linear-gradient(135deg, #2B0507 0%, #3D0B0D 100%)', border: '1.5px solid var(--gold-border)', borderRadius: '16px' }}>
                <h3 className="heading-font" style={{ color: '#FFD700', marginBottom: '18px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🗓️ 1. Festival Timeline Dates Configuration (Aagman & Main 10-Day Festival)
                </h3>

                {/* 2 Date Inputs Grid (Aagman Date & Main Festival Day 1) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  {/* Aagman Date */}
                  <div style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '12px', border: '1px solid var(--gold-border)' }}>
                    <label style={{ fontSize: '12.5px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      🚩 Aagman Date (Ganesh Arrival Miravnuk) *
                    </label>
                    <input 
                      type="date"
                      className="form-input"
                      value={aagmanVal}
                      onChange={(e) => updateAagmanDate && updateAagmanDate(e.target.value)}
                      style={{ colorScheme: 'dark', background: 'rgba(0,0,0,0.7)', color: '#FFF' }}
                    />
                    <span style={{ fontSize: '11px', color: '#AAA', marginTop: '4px', display: 'block' }}>
                      Aagman Miravnuk Date: <strong>{timelineInfo.aagmanDateFormatted}</strong>
                    </span>
                  </div>

                  {/* Main 10-Day Festival Start Date */}
                  <div style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '12px', border: '1px solid var(--gold-border)' }}>
                    <label style={{ fontSize: '12.5px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      📅 Main Festival Sthapana Start Date (Day 1) *
                    </label>
                    <input 
                      type="date"
                      className="form-input"
                      value={festStartVal}
                      onChange={(e) => updateFestivalStartDate && updateFestivalStartDate(e.target.value)}
                      style={{ colorScheme: 'dark', background: 'rgba(0,0,0,0.7)', color: '#FFF' }}
                    />
                    <span style={{ fontSize: '11px', color: '#AAA', marginTop: '4px', display: 'block' }}>
                      Day 1 ({timelineInfo.festivalStartFormatted}) to Visarjan ({timelineInfo.visarjanDateFormatted})
                    </span>
                  </div>
                </div>

                {/* Full Timeline Breakdown Pills */}
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px', color: '#FFECB3', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    📆 Calculated Full Festival Timeline Breakdown ({(timelineInfo.timeline || []).length} Days):
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                    {(timelineInfo.timeline || []).map((item) => {
                      const isActive = curDayInfo.isFestivalActive && (curDayInfo.dateStr === item.dateStr || curDayInfo.dayTag === item.dayTag);
                      return (
                        <div 
                          key={item.key} 
                          style={{
                            background: isActive ? '#FFB300' : 'rgba(0,0,0,0.5)',
                            color: isActive ? '#2B0507' : '#FFF',
                            border: isActive ? '1.5px solid #FFD700' : '1px solid rgba(255,215,0,0.3)',
                            padding: '8px',
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ fontSize: '11px', fontWeight: 800 }}>{item.dayTag}</div>
                          <div style={{ fontSize: '10.5px', opacity: 0.9 }}>{item.dateStr ? item.dateStr.slice(0, 5) : ''}</div>
                          {isActive && <div style={{ fontSize: '9.5px', fontWeight: 800 }}>⭐️ Today</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Computed Today's Schedule Box */}
                <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px dashed #FFB300', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ color: '#FFD700', margin: 0, fontSize: '14px', fontWeight: 700 }}>
                      ⚡ Auto-Computed Today's Schedule Events ({computedTodays.length} items)
                    </h4>
                    <span style={{ fontSize: '11px', color: curDayInfo.isFestivalActive ? '#69F0AE' : '#FFD700', background: curDayInfo.isFestivalActive ? 'rgba(105,240,174,0.15)' : 'rgba(255,215,0,0.15)', padding: '3px 8px', borderRadius: '8px', border: curDayInfo.isFestivalActive ? '1px solid #69F0AE' : '1px solid #FFD700' }}>
                      {curDayInfo.isFestivalActive ? "Active Festival Day: " + curDayInfo.dayTag : "Today: " + (curDayInfo.todayFormatted || '') + " (Non-Festival Date)"}
                    </span>
                  </div>

                  {!curDayInfo.isFestivalActive ? (
                    <p style={{ color: '#FFECB3', fontSize: '12.5px', margin: 0, lineHeight: 1.5 }}>
                      ℹ️ Today's System Date <strong>({curDayInfo.todayFormatted})</strong> is not a festival date. Shri Ganesh Aagman is on <strong>{timelineInfo.aagmanDateFormatted}</strong> and Day 1 is on <strong>{timelineInfo.festivalStartFormatted}</strong>. Today's Schedule on Home Page is currently <strong>EMPTY (as expected)</strong>!
                    </p>
                  ) : computedTodays.length === 0 ? (
                    <p style={{ color: '#AAA', fontSize: '12px', margin: 0 }}>No events scheduled for {curDayInfo.dayTag} ({curDayInfo.dateStr}). Add events in Section 2 below with tag "Daily" or "{curDayInfo.dayTag}".</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {computedTodays.map((ev, i) => (
                        <div key={ev.id || i} style={{ background: 'rgba(255,179,0,0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '11px', background: ev.day?.toLowerCase().includes('daily') ? '#FFB300' : '#69F0AE', color: '#2B0507', padding: '1px 6px', borderRadius: '6px', fontWeight: 800, marginRight: '8px' }}>
                              {ev.day || 'Daily'}
                            </span>
                            <strong style={{ color: '#FFF', fontSize: '13px' }}>{ev.title}</strong>
                            <span style={{ color: '#FFECB3', fontSize: '12px', marginLeft: '10px' }}>⏰ {ev.time}</span>
                          </div>
                          <span style={{ color: '#FFD700', fontSize: '11.5px', fontWeight: 600 }}>{ev.category}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })()}

          {/* 2. FULL SCHEDULE EVENTS & HEADER EDIT */}
          <div className="maroon-card gold-box-hover" style={{ padding: '24px' }}>
            <h3 className="heading-font" style={{ color: '#FFB300', marginBottom: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📅 2. Full Schedule Events & Timeline Events ({fullScheduleList.length})
            </h3>

            {/* Header & Subtext Form */}
            <form onSubmit={handleSaveFullScheduleHeader} style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '10px', border: '1px solid var(--gold-border)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ color: '#FFD700', margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>
                ✏️ Edit Schedule Page Header & Description Text
              </h4>
              <div>
                <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Full Schedule Header Title <span style={{ color: '#FF5252' }}>*</span>
                </label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  value={fsHeaderTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFsHeaderTitle(val);
                    if (val.trim()) {
                      setFsHeaderTitleError('');
                    } else {
                      setFsHeaderTitleError('Full Schedule Header Title khali nahi reh sakta!');
                    }
                  }}
                  onBlur={() => {
                    if (!fsHeaderTitle || !fsHeaderTitle.trim()) {
                      setFsHeaderTitleError('Full Schedule Header Title khali nahi reh sakta!');
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    maxWidth: '100%', 
                    boxSizing: 'border-box', 
                    resize: 'vertical',
                    border: fsHeaderTitleError ? '1.5px solid #FF5252' : undefined,
                    boxShadow: fsHeaderTitleError ? '0 0 10px rgba(255, 82, 82, 0.45)' : undefined
                  }} 
                />
                {fsHeaderTitleError && (
                  <p style={{ color: '#FF5252', fontSize: '12px', margin: '6px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚠️ {fsHeaderTitleError}
                  </p>
                )}
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Full Schedule Header SubText / Description
                </label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  value={fsHeaderSubText}
                  onChange={(e) => setFsHeaderSubText(e.target.value)}
                  style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              <button type="submit" className="btn-gold" style={{ fontSize: '13px', padding: '8px 18px', alignSelf: 'flex-start', cursor: 'pointer' }}>
                ⚡ Save Schedule Header & Subtext
              </button>
            </form>

            {/* Form to Add Full Schedule Event */}
            <form ref={editFormRef} onSubmit={handleAddFullScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', background: editingEventId ? 'rgba(255,215,0,0.08)' : 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '10px', border: editingEventId ? '1.5px solid #FFD700' : '1px solid var(--gold-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ color: '#FFD700', margin: 0, fontSize: '14px', fontWeight: 700 }}>
                  {editingEventId ? '✏️ Edit Schedule Event' : '➕ Add New Schedule Event'}
                </h4>
                {editingEventId && (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    style={{ background: 'rgba(255,0,0,0.2)', border: '1px solid #FF5252', color: '#FF5252', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ❌ Cancel Edit
                  </button>
                )}
              </div>

              {/* Line 1: Event Title */}
              <div style={{ width: '100%' }}>
                <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>Event Title *</label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  placeholder="e.g. Grand Aagman Miravnuk"
                  value={fsTitle}
                  onChange={(e) => setFsTitle(e.target.value)}
                  style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                  required 
                />
              </div>

              {/* Line 2: Description */}
              <div style={{ width: '100%' }}>
                <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  placeholder="Event details or location info..."
                  value={fsDesc}
                  onChange={(e) => setFsDesc(e.target.value)}
                  style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* Line 3: Time (Left), Category (Middle), Day Tag (Right) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-start', width: '100%' }}>
                {/* Time Picker / Custom Text */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '12px', color: '#FFECB3', fontWeight: 700 }}>
                      ⏰ {isCustomTimeMode ? 'Custom Time Text *' : 'Time (Hour : Min : AM/PM) *'}
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setIsCustomTimeMode(!isCustomTimeMode)}
                      style={{
                        background: 'rgba(255, 179, 0, 0.15)',
                        border: '1px solid #FFB300',
                        color: '#FFD700',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {isCustomTimeMode ? '⏰ Use Time Picker' : '✏️ Edit Custom Text'}
                    </button>
                  </div>

                  {!isCustomTimeMode ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', width: '100%' }}>
                      {/* Hour */}
                      <select 
                        className="form-input" 
                        value={timeHour} 
                        onChange={(e) => {
                          setTimeHour(e.target.value);
                          const formatted = `${e.target.value}:${timeMin} ${timePeriod} ${timeNote === 'None' ? '' : timeNote}`.trim();
                          setFsTime(formatted);
                        }}
                        style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF', padding: '6px 4px', fontSize: '12.5px', fontWeight: 700, flex: 1, minWidth: 0 }}
                      >
                        {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span style={{ color: '#FFD700', fontWeight: 800 }}>:</span>

                      {/* Minute */}
                      <select 
                        className="form-input" 
                        value={timeMin} 
                        onChange={(e) => {
                          setTimeMin(e.target.value);
                          const formatted = `${timeHour}:${e.target.value} ${timePeriod} ${timeNote === 'None' ? '' : timeNote}`.trim();
                          setFsTime(formatted);
                        }}
                        style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF', padding: '6px 4px', fontSize: '12.5px', flex: 1, minWidth: 0 }}
                      >
                        {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      {/* AM / PM Select */}
                      <select 
                        className="form-input" 
                        value={timePeriod} 
                        onChange={(e) => {
                          setTimePeriod(e.target.value);
                          const formatted = `${timeHour}:${timeMin} ${e.target.value} ${timeNote === 'None' ? '' : timeNote}`.trim();
                          setFsTime(formatted);
                        }}
                        style={{ background: '#FFB300', color: '#2B0507', fontWeight: 800, padding: '6px 4px', fontSize: '12.5px', flex: 1, minWidth: 0 }}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>

                      {/* Time Suffix Note */}
                      <select 
                        className="form-input" 
                        value={timeNote} 
                        onChange={(e) => {
                          setTimeNote(e.target.value);
                          const formatted = `${timeHour}:${timeMin} ${timePeriod} ${e.target.value === 'None' ? '' : e.target.value}`.trim();
                          setFsTime(formatted);
                        }}
                        style={{ background: 'rgba(0,0,0,0.7)', color: '#FFECB3', padding: '6px 4px', fontSize: '11.5px', flex: 1.2, minWidth: 0 }}
                      >
                        <option value="Onwards">Onwards</option>
                        <option value="Exact">Exact Time</option>
                        <option value="After Aarti">After Aarti</option>
                        <option value="None">No Note</option>
                      </select>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 08:00 PM - 10:30 PM or After Aarti"
                      value={fsTime}
                      onChange={(e) => setFsTime(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      required 
                    />
                  )}
                </div>

                {/* Category */}
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>Category *</label>
                  <select 
                    className="form-input" 
                    value={fsCategory}
                    onChange={(e) => setFsCategory(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#FFF', width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="Aarti">🪔 Aarti</option>
                    <option value="Cultural">🎭 Cultural</option>
                    <option value="Mahaprasad">🍲 Mahaprasad</option>
                    <option value="Aagman">🚩 Aagman</option>
                    <option value="Visarjan">🌊 Visarjan</option>
                  </select>
                </div>

                {/* Day Tag */}
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>Day Tag (Aagman / Daily / Day 1-10 / Visarjan) *</label>
                  {(() => {
                    const timelineInfo = calculateFullFestivalTimeline ? calculateFullFestivalTimeline(safeData) : { timeline: [] };
                    return (
                      <select 
                        className="form-input" 
                        value={fsDay}
                        onChange={(e) => setFsDay(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.6)', color: '#FFF', width: '100%', boxSizing: 'border-box' }}
                      >
                        <option value="Daily">🪔 Daily (Everyday Aarti & Prasad)</option>
                        {timelineInfo.timeline.map((item) => (
                          <option key={item.key} value={item.dayTag}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              </div>

              {/* Line 4: Button (Left Aligned) */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
                <button type="submit" className="btn-gold" style={{ fontSize: '13px', padding: '8px 22px' }}>
                  {editingEventId ? '⚡ Update Schedule Event' : '+ Add to Full View Schedule'}
                </button>
              </div>
            </form>

            {/* List of Full Schedule Events */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              {(Array.isArray(fullScheduleList) ? fullScheduleList : []).map((item, index) => {
                if (!item) return null;
                const itemKey = item.id !== undefined ? item.id : (item._id !== undefined ? item._id : index);
                return (
                <div key={itemKey} style={{
                  background: 'rgba(0,0,0,0.6)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--gold-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', background: 'rgba(255,179,0,0.2)', color: '#FFB300', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                        {item.category || 'Event'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#AAA' }}>{item.day}</span>
                    </div>
                    <h4 style={{ color: '#FFF', fontSize: '14.5px', margin: '4px 0', fontFamily: "'Cinzel', serif" }}>{item.title}</h4>
                    <span style={{ fontSize: '12px', color: '#FFB300', fontWeight: 700 }}>{item.time}</span>
                    <p style={{ fontSize: '12px', color: '#FFECB3', margin: '6px 0 0', opacity: 0.9 }}>{item.desc}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignSelf: 'flex-end' }}>
                    <button 
                      type="button"
                      onClick={() => handleEditScheduleClick(item)}
                      style={{ background: 'rgba(255,179,0,0.2)', border: '1px solid #FFD700', color: '#FFD700', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700 }}
                    >
                      ✏️ Edit Event
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteScheduleItem(item.id !== undefined ? item.id : item._id)}
                      style={{ background: 'rgba(255,0,0,0.18)', border: '1px solid #FF5252', color: '#FF5252', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700 }}
                    >
                      🗑️ Delete Event
                    </button>
                  </div>
                </div>
                );
              })}
            </div>

          </div>

        </div>
      )}

      {/* 4. TAB: ABOUT US & READ FULL ABOUT US CONTROLS */}
      {activeTab === 'about' && (
        <div className="maroon-card gold-box-hover" style={{ padding: '28px' }}>
          <h3 className="heading-font" style={{ color: '#FFB300', marginBottom: '20px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ℹ️ About Us & Read Full About Us Page Control
          </h3>

          <form onSubmit={handleSaveAbout} style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            
            {/* ============================================================ */}
            {/* PART 1: PUBLIC HOME PAGE - ABOUT US SECTION */}
            {/* ============================================================ */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,179,0,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px' }}>🏠</span>
                <h4 style={{ color: '#FFD700', fontSize: '16px', margin: 0, fontWeight: 700 }}>
                  Part 1: Public Home Page - "About Us" Section
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Home Page Section Title <span style={{ color: '#FF5252' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    className="form-input"
                    value={homeAboutHeader}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHomeAboutHeader(val);
                      if (val.trim()) {
                        setHomeAboutHeaderError('');
                      } else {
                        setHomeAboutHeaderError('Home Page Section Title khali nahi reh sakta!');
                      }
                    }}
                    onBlur={() => {
                      if (!homeAboutHeader || !homeAboutHeader.trim()) {
                        setHomeAboutHeaderError('Home Page Section Title khali nahi reh sakta!');
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      boxSizing: 'border-box',
                      border: homeAboutHeaderError ? '1.5px solid #FF5252' : undefined,
                      boxShadow: homeAboutHeaderError ? '0 0 10px rgba(255, 82, 82, 0.45)' : undefined
                    }}
                  />
                  {homeAboutHeaderError && (
                    <p style={{ color: '#FF5252', fontSize: '12px', margin: '6px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ⚠️ {homeAboutHeaderError}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '13px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Home Page Short Description / History Summary
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="4"
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    placeholder="Enter short description for home page"
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                    required
                  />
                </div>

                {/* 3 Mandal Impact Stats */}
                <div>
                  <label style={{ fontSize: '13px', color: '#FFD700', display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                    🏆 3 Mandal Impact Stats (Home & Full Page Shared)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                        Years of Legacy Count
                      </label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 15+"
                        value={years}
                        onChange={(e) => setYears(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                        Dedicated Volunteers Count
                      </label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 200+"
                        value={vols}
                        onChange={(e) => setVols(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                        Blessed Devotees Count
                      </label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 50,000+"
                        value={devs}
                        onChange={(e) => setDevs(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* PART 2: READ FULL ABOUT US PAGE (/about) */}
            {/* ============================================================ */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,179,0,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px' }}>📖</span>
                <h4 style={{ color: '#FFD700', fontSize: '16px', margin: 0, fontWeight: 700 }}>
                  Part 2: "Read Full About Us" Page Controls (/about)
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* 1. Page Header & Mission Subtext */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Full About Page Main Title <span style={{ color: '#FF5252' }}>*</span>
                    </label>
                    <input 
                      type="text"
                      className="form-input"
                      value={fullAboutHeader}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFullAboutHeader(val);
                        if (val.trim()) {
                          setFullAboutHeaderError('');
                        } else {
                          setFullAboutHeaderError('Full About Page Main Title khali nahi reh sakta!');
                        }
                      }}
                      onBlur={() => {
                        if (!fullAboutHeader || !fullAboutHeader.trim()) {
                          setFullAboutHeaderError('Full About Page Main Title khali nahi reh sakta!');
                        }
                      }}
                      style={{ 
                        width: '100%', 
                        boxSizing: 'border-box',
                        border: fullAboutHeaderError ? '1.5px solid #FF5252' : undefined,
                        boxShadow: fullAboutHeaderError ? '0 0 10px rgba(255, 82, 82, 0.45)' : undefined
                      }}
                    />
                    {fullAboutHeaderError && (
                      <p style={{ color: '#FF5252', fontSize: '12px', margin: '6px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⚠️ {fullAboutHeaderError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Full About Page Mission Subtitle
                    </label>
                    <textarea 
                      className="form-input"
                      rows="2"
                      value={fullAboutSubText}
                      onChange={(e) => setFullAboutSubText(e.target.value)}
                      placeholder="e.g. Preserving rich cultural heritage..."
                      style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* 2. Mandal Official Profile Header Card */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px dashed rgba(255,179,0,0.25)' }}>
                  <h5 style={{ color: '#FFD700', fontSize: '13.5px', margin: '0 0 12px', fontWeight: 700 }}>
                    👑 Mandal Profile Header (Logo, Name & Sacred Address)
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                        Mandal Official Display Name
                      </label>
                      <input 
                        type="text"
                        className="form-input"
                        value={mandalName}
                        onChange={(e) => setMandalName(e.target.value)}
                        placeholder="e.g. YUVA YUVAK MANDAL 🚩"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                        Mandal Logo (Image URL or Upload)
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text"
                          className="form-input"
                          value={mandalLogoUrl}
                          onChange={(e) => setMandalLogoUrl(e.target.value)}
                          placeholder="Image URL or upload file"
                          style={{ flex: 1 }}
                        />
                        <label className="btn-outline-gold" style={{ cursor: 'pointer', padding: '8px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          📁 Upload
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={(e) => uploadMediaFile(e, setMandalLogoUrl)} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                      Mandal Full Address
                    </label>
                    <textarea 
                      className="form-input"
                      rows="2"
                      value={mandalAddress}
                      onChange={(e) => setMandalAddress(e.target.value)}
                      placeholder="e.g. Ram Nivas Society, Navsari Bazaar, Surat"
                      style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                        Instagram Social Handle
                      </label>
                      <input 
                        type="text"
                        className="form-input"
                        value={aboutInstaHandle}
                        onChange={(e) => setAboutInstaHandle(e.target.value)}
                        placeholder="e.g. @yuva_yuvak_mandal 🚩"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                        Instagram Profile Link URL
                      </label>
                      <input 
                        type="text"
                        className="form-input"
                        value={aboutInstaUrl}
                        onChange={(e) => setAboutInstaUrl(e.target.value)}
                        placeholder="https://www.instagram.com/yuva_yuvak_mandal/"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Highlight Story Cards */}
                <div>
                  <h5 style={{ color: '#FFD700', fontSize: '13.5px', margin: '0 0 12px', fontWeight: 700 }}>
                    ✨ 3 Highlight Story Cards on Full About Page
                  </h5>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    {/* Story Card 1 */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '10px', padding: '14px' }}>
                      <label style={{ fontSize: '12px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                        🏆 Story Card 1
                      </label>
                      <input 
                        type="text"
                        className="form-input"
                        value={aboutCard1Title}
                        onChange={(e) => setAboutCard1Title(e.target.value)}
                        placeholder="Card 1 Title"
                        style={{ width: '100%', boxSizing: 'border-box', marginBottom: '8px' }}
                      />
                      <textarea 
                        className="form-input"
                        rows="3"
                        value={aboutCard1Desc}
                        onChange={(e) => setAboutCard1Desc(e.target.value)}
                        placeholder="Card 1 Story Description..."
                        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </div>

                    {/* Story Card 2 */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '10px', padding: '14px' }}>
                      <label style={{ fontSize: '12px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                        🛡️ Story Card 2
                      </label>
                      <input 
                        type="text"
                        className="form-input"
                        value={aboutCard2Title}
                        onChange={(e) => setAboutCard2Title(e.target.value)}
                        placeholder="Card 2 Title"
                        style={{ width: '100%', boxSizing: 'border-box', marginBottom: '8px' }}
                      />
                      <textarea 
                        className="form-input"
                        rows="3"
                        value={aboutCard2Desc}
                        onChange={(e) => setAboutCard2Desc(e.target.value)}
                        placeholder="Card 2 Story Description..."
                        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </div>

                    {/* Story Card 3 */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '10px', padding: '14px' }}>
                      <label style={{ fontSize: '12px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                        ✨ Story Card 3
                      </label>
                      <input 
                        type="text"
                        className="form-input"
                        value={aboutCard3Title}
                        onChange={(e) => setAboutCard3Title(e.target.value)}
                        placeholder="Card 3 Title"
                        style={{ width: '100%', boxSizing: 'border-box', marginBottom: '8px' }}
                      />
                      <textarea 
                        className="form-input"
                        rows="3"
                        value={aboutCard3Desc}
                        onChange={(e) => setAboutCard3Desc(e.target.value)}
                        placeholder="Card 3 Story Description..."
                        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </div>

                  </div>
                </div>

              </div>
            </div>

            <button type="submit" className="btn-gold" style={{ padding: '12px 26px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', cursor: 'pointer', alignSelf: 'flex-start' }}>
              ⚡ Save & Live Sync About Us & Full About Page
            </button>
          </form>
        </div>
      )}

      {/* 5. TAB: CONTACT US FULL PAGE CONTROLS */}
      {activeTab === 'contact' && (
        <div className="maroon-card gold-box-hover" style={{ padding: '28px' }}>
          <h3 className="heading-font" style={{ color: '#FFB300', marginBottom: '20px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={22} color="#FFB300" /> 📞 Contact Us Page Full Control
          </h3>

          <form onSubmit={handleSaveContactInfo} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Section 1: Page Header & Subtext */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255,179,0,0.25)' }}>
              <h4 style={{ color: '#FFD700', fontSize: '14px', margin: '0 0 12px', fontWeight: 700 }}>
                1. 👑 Main Contact Page Header & Subtitle
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Main Page Heading <span style={{ color: '#FF5252' }}>*</span>
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="2" 
                    value={cHeaderTitle} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setCHeaderTitle(val);
                      if (val.trim()) {
                        setCHeaderTitleError('');
                      } else {
                        setCHeaderTitleError('Main Page Heading khali nahi reh sakta!');
                      }
                    }} 
                    onBlur={() => {
                      if (!cHeaderTitle || !cHeaderTitle.trim()) {
                        setCHeaderTitleError('Main Page Heading khali nahi reh sakta!');
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      boxSizing: 'border-box', 
                      resize: 'vertical',
                      border: cHeaderTitleError ? '1.5px solid #FF5252' : undefined,
                      boxShadow: cHeaderTitleError ? '0 0 10px rgba(255, 82, 82, 0.45)' : undefined
                    }}
                  />
                  {cHeaderTitleError && (
                    <p style={{ color: '#FF5252', fontSize: '12px', margin: '6px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ⚠️ {cHeaderTitleError}
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                    Page Subtitle Description
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="2" 
                    value={cHeaderSubText} 
                    onChange={(e) => setCHeaderSubText(e.target.value)} 
                    placeholder="e.g. Reach out to our mandal committee..."
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Sacred Pandal Address & Google Maps */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255,179,0,0.25)' }}>
              <h4 style={{ color: '#FFD700', fontSize: '14px', margin: '0 0 12px', fontWeight: 700 }}>
                2. 📍 Card 1: Sacred Pandal Address & Google Maps Link
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                    Pandal Full Address Text
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="2" 
                    value={cAddress} 
                    onChange={(e) => setCAddress(e.target.value)} 
                    placeholder="Enter mandal address"
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                    Google Maps URL / Location Link (बटन पर क्लिक करने पर खुलेगा)
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="2" 
                    value={cGmapsUrl} 
                    onChange={(e) => setCGmapsUrl(e.target.value)} 
                    placeholder="Google maps link URL"
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', wordBreak: 'break-all' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Official Social Media & Instagram */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255,179,0,0.25)' }}>
              <h4 style={{ color: '#FFD700', fontSize: '14px', margin: '0 0 12px', fontWeight: 700 }}>
                3. 📸 Card 2: Official Social Media & Instagram
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                    Instagram Handle Display Text
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="2" 
                    value={cInstaHandle} 
                    onChange={(e) => setCInstaHandle(e.target.value)} 
                    placeholder="e.g. @yuva_yuvak_mandal 🚩"
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                    Instagram Profile URL Link
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="2" 
                    value={cInstaUrl} 
                    onChange={(e) => setCInstaUrl(e.target.value)} 
                    placeholder="Instagram profile URL link"
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', wordBreak: 'break-all' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                    Social Media Subtitle Description
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="2" 
                    value={cSocialDesc} 
                    onChange={(e) => setCSocialDesc(e.target.value)} 
                    placeholder="e.g. Follow our official Instagram page..."
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Pandal & Aarti Timings */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255,179,0,0.25)', overflow: 'hidden' }}>
              <h4 style={{ color: '#FFD700', fontSize: '14px', margin: '0 0 16px', fontWeight: 700 }}>
                4. ⏰ Card 3: Pandal & Aarti Timings
              </h4>
              <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '20px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <SmartTimeField 
                  label="Pandal Open Hours" 
                  value={cTimingPandalOpen} 
                  onChange={setCTimingPandalOpen} 
                />
                <SmartTimeField 
                  label="Morning Aarti Time" 
                  value={cTimingMorningAarti} 
                  onChange={setCTimingMorningAarti} 
                />
                <SmartTimeField 
                  label="Evening Aarti Time" 
                  value={cTimingEveningAarti} 
                  onChange={setCTimingEveningAarti} 
                />
                <SmartTimeField 
                  label="Prasad Distribution Time" 
                  value={cTimingPrasad} 
                  onChange={setCTimingPrasad} 
                />
              </div>
            </div>

            {/* Section 5: Devotee Message & Inquiry Form Header & Subtext */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255,179,0,0.25)' }}>
              <h4 style={{ color: '#FFD700', fontSize: '14px', margin: '0 0 12px', fontWeight: 700 }}>
                5. ✉️ Card 4: Devotee Message & Inquiry Form Header
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Inquiry Form Heading <span style={{ color: '#FF5252' }}>*</span>
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="2" 
                    value={cFormHeader} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setCFormHeader(val);
                      if (val.trim()) {
                        setCFormHeaderError('');
                      } else {
                        setCFormHeaderError('Inquiry Form Heading khali nahi reh sakta!');
                      }
                    }} 
                    onBlur={() => {
                      if (!cFormHeader || !cFormHeader.trim()) {
                        setCFormHeaderError('Inquiry Form Heading khali nahi reh sakta!');
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      boxSizing: 'border-box', 
                      resize: 'vertical',
                      border: cFormHeaderError ? '1.5px solid #FF5252' : undefined,
                      boxShadow: cFormHeaderError ? '0 0 10px rgba(255, 82, 82, 0.45)' : undefined
                    }}
                  />
                  {cFormHeaderError && (
                    <p style={{ color: '#FF5252', fontSize: '12px', margin: '6px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ⚠️ {cFormHeaderError}
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>
                    Inquiry Form Subtitle
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="2" 
                    value={cFormSubText} 
                    onChange={(e) => setCFormSubText(e.target.value)} 
                    placeholder="e.g. Send a message to Yuva Yuvak Mandal..."
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-gold" style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', cursor: 'pointer', alignSelf: 'flex-start' }}>
              ⚡ Save & Sync Contact Us Page Live
            </button>
          </form>
        </div>
      )}

      {/* 6. TAB: BIG SCREEN VIDEO (MULTI-VIDEO PLAYLIST) */}
      {activeTab === 'video' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Header Title Editor */}
          <div className="maroon-card gold-box-hover" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <label style={{ fontSize: '13px', color: '#FFD700', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Tv size={16} color="#FFB300" /> 📺 Big Screen Video Section Title <span style={{ color: '#FF5252' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={bigScreenHeaderTitle} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setBigScreenHeaderTitle(val);
                    if (val.trim()) {
                      setBsTitleError('');
                    } else {
                      setBsTitleError('Big Screen Video Section Title khali nahi reh sakta!');
                    }
                  }} 
                  onBlur={() => {
                    if (!bigScreenHeaderTitle || !bigScreenHeaderTitle.trim()) {
                      setBsTitleError('Big Screen Video Section Title khali nahi reh sakta!');
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    boxSizing: 'border-box',
                    border: bsTitleError ? '1.5px solid #FF5252' : undefined,
                    boxShadow: bsTitleError ? '0 0 10px rgba(255, 82, 82, 0.45)' : undefined
                  }} 
                />
                {bsTitleError && (
                  <p style={{ color: '#FF5252', fontSize: '12px', margin: '6px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚠️ {bsTitleError}
                  </p>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => {
                  if (!bigScreenHeaderTitle || !bigScreenHeaderTitle.trim()) {
                    setBsTitleError('Big Screen Video Section Title khali nahi reh sakta!');
                    return;
                  }
                  setBsTitleError('');
                  if (updateSiteData) updateSiteData({ bigScreenHeaderTitle: bigScreenHeaderTitle.trim() });
                  triggerSuccess('⚡ Live Updated: Big Screen Section Title updated!');
                }}
                className="btn-gold" 
                style={{ padding: '10px 20px', fontSize: '13px', alignSelf: 'flex-start', marginTop: '22px', cursor: 'pointer' }}
              >
                💾 Save Title
              </button>
            </div>
          </div>

          <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          {/* Add / Edit Video Form Card */}
          <div className="maroon-card gold-box-hover" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 className="heading-font" style={{ color: '#FFB300', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tv size={20} color="#FFB300" /> {editingBsVideoId ? '✏️ Edit Video in Playlist' : '+ Add Video to Big Screen Playlist'}
              </h3>
              {editingBsVideoId && (
                <button
                  type="button"
                  onClick={handleCancelBsEdit}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#FFECB3',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  ✖ Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleAddBigScreenVideo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>Video Title / Caption (Optional)</label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  value={bsVideoTitle}
                  onChange={(e) => setBsVideoTitle(e.target.value)}
                  placeholder="Enter video title or caption..."
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px' }}>Video URL (YouTube or Direct Video URL)</label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  placeholder="e.g. https://www.youtube.com/watch?v=... or .mp4 link"
                  value={bsVideoUrl}
                  onChange={(e) => setBsVideoUrl(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', wordBreak: 'break-all', resize: 'vertical' }}
                />
              </div>

              <div style={{ background: 'rgba(255,179,0,0.08)', padding: '14px', borderRadius: '10px', border: '1px dashed #FFB300', textAlign: 'center' }}>
                <label style={{ fontSize: '12px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  📁 Or Upload Video File From Computer / Phone
                </label>
                <input 
                  type="file" 
                  accept={ALL_VIDEO_TYPES}
                  id="bigScreenVideoFileInput"
                  style={{ display: 'none' }}
                  onChange={(e) => uploadMediaFile(e.target.files[0], setBsVideoUrl)}
                />
                <button 
                  type="button"
                  onClick={() => document.getElementById('bigScreenVideoFileInput').click()}
                  style={{ background: 'rgba(255,179,0,0.2)', border: '1px solid #FFB300', color: '#FFB300', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                >
                  📁 Select Video File
                </button>
                {bsVideoUrl && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#69F0AE', wordBreak: 'break-all' }}>
                    ✅ Video Source Loaded! Click {editingBsVideoId ? 'Save Changes' : 'Add to Playlist'} below.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="submit" className="btn-gold" style={{ justifyContent: 'center', flex: 1 }}>
                  {editingBsVideoId ? '⚡ Save Changes to Video' : '+ Add Video to Loop Playlist'}
                </button>
                {editingBsVideoId && (
                  <button 
                    type="button" 
                    onClick={handleCancelBsEdit}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid #999',
                      color: '#FFF',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Current Playlist Queue Card */}
          <div className="maroon-card gold-box-hover" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className="heading-font" style={{ color: '#FFB300', margin: 0, fontSize: '18px' }}>
                🎬 Active Video Playlist ({bigScreenVideosList.length})
              </h3>
              <span style={{ fontSize: '11px', color: '#69F0AE', background: 'rgba(105, 240, 174, 0.12)', border: '1px solid #69F0AE', padding: '3px 8px', borderRadius: '10px', fontWeight: 700 }}>
                🔁 Auto-Looping Active
              </span>
            </div>

            {bigScreenVideosList.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#AAA', border: '1px dashed rgba(255,215,0,0.3)', borderRadius: '12px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '13.5px', color: '#FFECB3' }}>No videos in the Big Screen Playlist yet.</p>
                <p style={{ margin: 0, fontSize: '12px' }}>Use the form on the left to add your first broadcast video!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
                {bigScreenVideosList.map((item, idx) => (
                  <div 
                    key={item.id || item._id || idx}
                    style={{
                      background: editingBsVideoId === (item.id || item._id) ? 'rgba(255, 179, 0, 0.15)' : 'rgba(0,0,0,0.5)',
                      border: editingBsVideoId === (item.id || item._id) ? '1.5px solid #FFD700' : '1px solid var(--gold-border)',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <span style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'var(--gold-gradient)',
                        color: '#2B0507',
                        fontSize: '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ color: '#FFF', margin: '0 0 4px', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title && item.title.trim() ? item.title : <span style={{ color: '#9E9E9E', fontStyle: 'italic', fontSize: '12px' }}>(No Title)</span>}
                        </h4>
                        <p style={{ color: '#FFECB3', margin: 0, fontSize: '11px', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.url}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleEditBigScreenVideo(item)}
                        title="Edit Video Title or URL"
                        style={{
                          background: editingBsVideoId === (item.id || item._id) ? 'var(--gold-gradient)' : 'rgba(255, 179, 0, 0.18)',
                          border: '1px solid #FFB300',
                          color: editingBsVideoId === (item.id || item._id) ? '#2B0507' : '#FFD700',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>

                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveBigScreenVideo(idx, -1)}
                          title="Move Video Up in Loop"
                          style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid #FFD700', color: '#FFD700', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                        >
                          ⬆️
                        </button>
                      )}
                      {idx < bigScreenVideosList.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveBigScreenVideo(idx, 1)}
                          title="Move Video Down in Loop"
                          style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid #FFD700', color: '#FFD700', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                        >
                          ⬇️
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteBigScreenVideo(item.id || item._id)}
                        title="Delete from playlist"
                        style={{ background: 'rgba(255,0,0,0.2)', border: '1px solid #FF5252', color: '#FF5252', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* TAB: MURTIKAR DETAILS (Placed right after Big Screen Video) */}
      {activeTab === 'murtikar' && (
        <div className="maroon-card gold-box-hover" style={{ padding: '28px', minHeight: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            <h3 className="heading-font" style={{ color: '#FFB300', margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} color="#FFB300" /> ✨ Murtikar Section Details & Branding
            </h3>
            <span style={{ background: 'rgba(255, 179, 0, 0.15)', border: '1px solid rgba(255, 179, 0, 0.4)', color: '#FFD700', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
              Live Website Section
            </span>
          </div>

          <form onSubmit={handleSaveMurtikar} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
            {/* 1. Section Header Title */}
            <div style={{ width: '100%', boxSizing: 'border-box' }}>
              <label style={{ display: 'block', color: '#FFD700', fontSize: '13.5px', fontWeight: 700, marginBottom: '6px' }}>
                1. Section Header Title (Card ke upar aane wali heading)
              </label>
              <input
                type="text"
                className="input-gold-hover"
                value={murtikarHeaderTitle}
                onChange={(e) => setMurtikarHeaderTitle(e.target.value)}
                placeholder="e.g. DIVINE CREATION - OUR IDOL SCULPTOR"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--gold-border)',
                  color: '#FFF',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* 2. Murtikar Name */}
            <div style={{ width: '100%', boxSizing: 'border-box' }}>
              <label style={{ display: 'block', color: '#FFD700', fontSize: '13.5px', fontWeight: 700, marginBottom: '6px' }}>
                2. Murtikar Name (Artist / Sculptor Name) <span style={{ color: '#FF5252' }}>*</span>
              </label>
              <input
                type="text"
                className="input-gold-hover"
                value={murtikarName}
                onChange={(e) => setMurtikarName(e.target.value)}
                placeholder="e.g. Kiran Manjrekar"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--gold-border)',
                  color: '#FFF',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              />
            </div>

            {/* 3. Badge / Honor Title */}
            <div style={{ width: '100%', boxSizing: 'border-box' }}>
              <label style={{ display: 'block', color: '#FFD700', fontSize: '13.5px', fontWeight: 700, marginBottom: '6px' }}>
                3. Pill Badge (Honor Title & City)
              </label>
              <input
                type="text"
                className="input-gold-hover"
                value={murtikarBadge}
                onChange={(e) => setMurtikarBadge(e.target.value)}
                placeholder="e.g. RESPECTED IDOL SCULPTOR - MUMBAI"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--gold-border)',
                  color: '#FFF',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* 4. Devotional Tagline / Subtitle */}
            <div style={{ width: '100%', boxSizing: 'border-box' }}>
              <label style={{ display: 'block', color: '#FFD700', fontSize: '13.5px', fontWeight: 700, marginBottom: '6px' }}>
                4. Devotional Tagline / Subtitle
              </label>
              <textarea
                rows={3}
                className="input-gold-hover"
                value={murtikarTagline}
                onChange={(e) => setMurtikarTagline(e.target.value)}
                placeholder="e.g. Crafted with Devotion in Mumbai and Revered in Surat Ganesh-Utsav"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--gold-border)',
                  color: '#FFF',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />
            </div>

            {/* 5. Murtikar Photo (Round Circle Image) */}
            <div style={{ width: '100%', boxSizing: 'border-box' }}>
              <label style={{ display: 'block', color: '#FFD700', fontSize: '13.5px', fontWeight: 700, marginBottom: '6px' }}>
                5. Murtikar Photo (Round Circle me aane wali photo)
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="input-gold-hover"
                  value={murtikarPhoto}
                  onChange={(e) => setMurtikarPhoto(e.target.value)}
                  placeholder="Photo URL paste karein ya '📁 Upload Photo' par click karein"
                  style={{
                    flex: '1 1 320px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--gold-border)',
                    color: '#FFF',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <label style={{
                  cursor: 'pointer',
                  padding: '11px 20px',
                  fontSize: '13.5px',
                  whiteSpace: 'nowrap',
                  borderRadius: '10px',
                  background: 'rgba(255, 179, 0, 0.15)',
                  border: '1.5px solid #FFB300',
                  color: '#FFD700',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease'
                }}>
                  📁 Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => uploadMediaFile(e, setMurtikarPhoto)}
                  />
                </label>
                {murtikarPhoto && (
                  <button
                    type="button"
                    onClick={() => setMurtikarPhoto('')}
                    style={{
                      padding: '11px 18px',
                      fontSize: '13.5px',
                      whiteSpace: 'nowrap',
                      borderRadius: '10px',
                      background: 'rgba(255, 82, 82, 0.15)',
                      border: '1.5px solid #FF5252',
                      color: '#FF8A8A',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ✕ Remove Photo
                  </button>
                )}
              </div>

              {murtikarPhoto ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.3)' }}>
                  <img
                    src={murtikarPhoto}
                    alt="Murtikar Preview"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #FFD700',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                    }}
                  />
                  <div>
                    <span style={{ fontSize: '13px', color: '#4CAF50', fontWeight: 700, display: 'block' }}>
                      ✓ Photo successfully select ho gayi hai!
                    </span>
                    <span style={{ fontSize: '12px', color: '#FFECB3', opacity: 0.85 }}>
                      Website ke rotating circle ke andar ye photo dikhegi.
                    </span>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: '#AAA', marginTop: '6px', display: 'block' }}>
                  ℹ️ Optional: Agar photo nahi daalenge, toh website ke round circle ke andar default Ganpati Bappa Creation symbol dikhega.
                </span>
              )}
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #FFB300 0%, #D4AF37 100%)',
                  color: '#2B0507',
                  border: 'none',
                  padding: '13px 32px',
                  borderRadius: '24px',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(255, 179, 0, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                💾 Save Murtikar Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 8. TAB: DEVOTEE REVIEWS */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Header Editor */}
          <div className="maroon-card gold-box-hover" style={{ padding: '20px 22px' }}>
            <h4 style={{ color: '#FFD700', fontSize: '15px', margin: '0 0 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              💬 Devotee Feedback & Blessings Section Header
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              {/* 1. Top Badge Pill Text - Badi Line (100% Full Width) */}
              <div style={{ width: '100%' }}>
                <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Top Badge Pill Text
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={reviewsBadge} 
                  onChange={(e) => setReviewsBadge(e.target.value)} 
                  style={{ width: '100%', boxSizing: 'border-box' }} 
                />
              </div>

              {/* 2. Main Section Heading Title - Niche Ki Line Me & Badi Line (100% Full Width) with Strict Validation */}
              <div style={{ width: '100%' }}>
                <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Main Section Heading Title <span style={{ color: '#FF5252' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={reviewsTitle} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setReviewsTitle(val);
                    if (val.trim()) {
                      setReviewsTitleError('');
                    } else {
                      setReviewsTitleError('Main Section Heading Title khali nahi reh sakta!');
                    }
                  }} 
                  onBlur={() => {
                    if (!reviewsTitle || !reviewsTitle.trim()) {
                      setReviewsTitleError('Main Section Heading Title khali nahi reh sakta!');
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    boxSizing: 'border-box',
                    border: reviewsTitleError ? '1.5px solid #FF5252' : undefined,
                    boxShadow: reviewsTitleError ? '0 0 10px rgba(255, 82, 82, 0.45)' : undefined
                  }} 
                />
                {reviewsTitleError && (
                  <p style={{ color: '#FF5252', fontSize: '12px', margin: '6px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚠️ {reviewsTitleError}
                  </p>
                )}
              </div>

              {/* 3. Subtitle Description - Badi Line (100% Full Width, No Placeholder) */}
              <div style={{ width: '100%' }}>
                <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Subtitle Description
                </label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  value={reviewsSub} 
                  onChange={(e) => setReviewsSub(e.target.value)} 
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} 
                />
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => {
                if (!reviewsTitle || !reviewsTitle.trim()) {
                  setReviewsTitleError('Main Section Heading Title khali nahi reh sakta!');
                  return;
                }
                setReviewsTitleError('');
                if (updateSiteData) {
                  updateSiteData({ 
                    reviewsBadge: reviewsBadge.trim(), 
                    reviewsTitle: reviewsTitle.trim(), 
                    reviewsSub 
                  });
                }
                triggerSuccess('⚡ Live Updated: Reviews Header updated!');
              }}
              className="btn-gold" 
              style={{ padding: '9px 20px', fontSize: '13px', cursor: 'pointer' }}
            >
              💾 Save Reviews Header
            </button>
          </div>

          <div className="maroon-card gold-box-hover" style={{ padding: '28px', minHeight: '650px' }}>
            <h3 className="heading-font" style={{ color: '#FFB300', marginBottom: '16px', fontSize: '20px' }}>
              💬 Devotee Reviews & Feedback Manager
            </h3>
            <AdminReviewsManager />
          </div>
        </div>
      )}

      {/* 9. TAB: DEVOTEE MESSAGE INQUIRY (Contact Us Submissions) */}
      {activeTab === 'inquiries' && (
        <AdminInquiriesManager triggerSuccess={triggerSuccess} />
      )}

      {/* 10. TAB: DONATION CONTROL (Admin Only) */}
      {activeTab === 'donations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Summary Stats Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="maroon-card gold-box-hover" style={{ padding: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#FFECB3', textTransform: 'uppercase', letterSpacing: '1px' }}>
                💰 Total Seva Collection
              </span>
              <h3 style={{ fontSize: '28px', color: '#FFD700', margin: '6px 0 0', fontWeight: 800 }}>
                ₹{totalDonationSum.toLocaleString('en-IN')}
              </h3>
            </div>

            <div className="maroon-card gold-box-hover" style={{ padding: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#69F0AE', textTransform: 'uppercase', letterSpacing: '1px' }}>
                💵 Cash Collections
              </span>
              <h3 style={{ fontSize: '28px', color: '#69F0AE', margin: '6px 0 0', fontWeight: 800 }}>
                ₹{totalCashSum.toLocaleString('en-IN')}
              </h3>
            </div>

            <div className="maroon-card gold-box-hover" style={{ padding: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#81D4FA', textTransform: 'uppercase', letterSpacing: '1px' }}>
                📲 Online QR / UPI Collections
              </span>
              <h3 style={{ fontSize: '28px', color: '#81D4FA', margin: '6px 0 0', fontWeight: 800 }}>
                ₹{totalOnlineSum.toLocaleString('en-IN')}
              </h3>
            </div>
          </div>

          <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            {/* Add Donation Form */}
            <div className="maroon-card gold-box-hover" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="heading-font" style={{ color: '#FFB300', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={20} color="#FFB300" /> + Record Seva / Donation Entry
                </h3>
                <span style={{ fontSize: '11px', background: 'rgba(255, 215, 0, 0.15)', color: '#FFD700', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                  SMS & WhatsApp Auto
                </span>
              </div>

              <div style={{
                background: 'rgba(37, 211, 102, 0.1)',
                border: '1px solid rgba(37, 211, 102, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#A7F3D0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Share2 size={16} color="#25D366" />
                <span>Entry save hote hi <strong>WhatsApp</strong> aur <strong>Phone SMS</strong> dono par donation slip bhejne ka direct access milega.</span>
              </div>

              <form onSubmit={handleAddDonationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Donor Full Name (Textarea) */}
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Donor Full Name (दानदाता का पूरा नाम) *</span>
                    {donErrors.name && <span style={{ color: '#FF5252', fontSize: '11px' }}>⚠️ {donErrors.name}</span>}
                  </label>
                  <textarea 
                    rows={2}
                    className="form-input" 
                    placeholder="e.g. Rameshchandra Ramanlal Patel"
                    value={donorName}
                    onChange={(e) => {
                      setDonorName(e.target.value);
                      if (e.target.value.trim()) setDonErrors(prev => ({ ...prev, name: '' }));
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', border: donErrors.name ? '1px solid #FF5252' : undefined }}
                  />
                </div>

                {/* 2. Donor Mobile Number */}
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Mobile No. (फ़ोन नंबर) *</span>
                    <span style={{ color: donorPhone.length === 10 ? '#69F0AE' : '#AAA', fontSize: '10.5px' }}>
                      {donorPhone.length}/10 digits
                    </span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(212,175,55,0.4)',
                      borderRight: 'none',
                      color: '#FFD700',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      padding: '9.5px 10px',
                      borderTopLeftRadius: '8px',
                      borderBottomLeftRadius: '8px'
                    }}>
                      +91
                    </span>
                    <input 
                      type="tel" 
                      maxLength={10}
                      className="form-input" 
                      placeholder="9876543210"
                      value={donorPhone}
                      onChange={(e) => handleDonorPhoneChange(e.target.value)}
                      style={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        width: '100%',
                        boxSizing: 'border-box',
                        border: donErrors.phone ? '1px solid #FF5252' : undefined
                      }}
                    />
                  </div>
                  {donErrors.phone && <p style={{ color: '#FF5252', fontSize: '11px', margin: '4px 0 0' }}>⚠️ {donErrors.phone}</p>}
                </div>

                {/* 3. Donor WhatsApp Number (with Same as Mobile option) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '12px', color: '#FFECB3', margin: 0 }}>
                      WhatsApp No. (व्हाट्सएप नंबर) *
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#69F0AE', cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox"
                        checked={isSameAsPhone}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsSameAsPhone(checked);
                          if (checked) {
                            setDonorWhatsApp(donorPhone);
                            if (donorPhone.length === 10) {
                              setDonErrors(prev => ({ ...prev, whatsapp: '' }));
                            }
                          }
                        }}
                        style={{ accentColor: '#25D366', width: '15px', height: '15px' }}
                      />
                      <span style={{ fontWeight: 600 }}>Same as Mobile (फ़ोन नंबर जैसा ही है)</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      background: 'rgba(37, 211, 102, 0.18)',
                      border: '1px solid rgba(37, 211, 102, 0.45)',
                      borderRight: 'none',
                      color: '#25D366',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      padding: '9.5px 10px',
                      borderTopLeftRadius: '8px',
                      borderBottomLeftRadius: '8px'
                    }}>
                      +91
                    </span>
                    <input 
                      type="tel"
                      maxLength={10}
                      disabled={isSameAsPhone}
                      className="form-input"
                      placeholder={isSameAsPhone ? (donorPhone || 'Same as Mobile Number') : 'Enter 10-digit WhatsApp number'}
                      value={isSameAsPhone ? donorPhone : donorWhatsApp}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setDonorWhatsApp(clean);
                        if (clean.length === 10) {
                          setDonErrors(prev => ({ ...prev, whatsapp: '' }));
                        }
                      }}
                      style={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        width: '100%',
                        boxSizing: 'border-box',
                        opacity: isSameAsPhone ? 0.85 : 1,
                        background: isSameAsPhone ? 'rgba(0,0,0,0.45)' : undefined,
                        border: donErrors.whatsapp ? '1px solid #FF5252' : undefined
                      }}
                    />
                  </div>
                  {donErrors.whatsapp && <p style={{ color: '#FF5252', fontSize: '11px', margin: '4px 0 0' }}>⚠️ {donErrors.whatsapp}</p>}
                </div>

                {/* 4. Donor Email Address (Textarea) */}
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Email Address (ईमेल पता) *</span>
                    {donErrors.email && <span style={{ color: '#FF5252', fontSize: '11px' }}>⚠️ {donErrors.email}</span>}
                  </label>
                  <textarea 
                    rows={2}
                    className="form-input" 
                    placeholder="e.g. donor.email@gmail.com"
                    value={donorEmail}
                    onChange={(e) => {
                      setDonorEmail(e.target.value);
                      if (e.target.value.includes('@')) setDonErrors(prev => ({ ...prev, email: '' }));
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', border: donErrors.email ? '1px solid #FF5252' : undefined }}
                  />
                </div>

                {/* 5. Donation Amount (₹) */}
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Donation Amount (राशि ₹) *</span>
                    {donErrors.amount && <span style={{ color: '#FF5252', fontSize: '11px' }}>⚠️ {donErrors.amount}</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#FFD700',
                      fontWeight: 800,
                      fontSize: '15px'
                    }}>
                      ₹
                    </span>
                    <input 
                      type="number" 
                      min="1"
                      className="form-input" 
                      placeholder="5001"
                      value={donAmount}
                      onChange={(e) => {
                        setDonAmount(e.target.value);
                        if (Number(e.target.value) > 0) setDonErrors(prev => ({ ...prev, amount: '' }));
                      }}
                      style={{ paddingLeft: '28px', fontSize: '15px', fontWeight: 700, width: '100%', boxSizing: 'border-box', border: donErrors.amount ? '1px solid #FF5252' : undefined }}
                    />
                  </div>

                  {/* Live In Words Preview */}
                  {donAmount && Number(donAmount) > 0 && (
                    <div style={{
                      background: 'rgba(255, 215, 0, 0.08)',
                      border: '1px dashed rgba(255, 215, 0, 0.3)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      marginTop: '6px',
                      fontSize: '11.5px',
                      color: '#69F0AE'
                    }}>
                      📝 <strong>In Words:</strong> {numberToWordsINR(donAmount)}
                    </div>
                  )}
                </div>

                {/* 5. Payment Type (Exactly 2 options: Cash & Online) */}
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '5px' }}>
                    Payment Type (भुगतान का प्रकार) *
                  </label>
                  <select 
                    className="form-input" 
                    value={donType}
                    onChange={(e) => setDonType(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#FFF', width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="Online">📲 Online</option>
                  </select>
                </div>

                {/* 6. Seva Category (with Other Seva option) */}
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '5px' }}>
                    Seva Category (सेवा का प्रकार) *
                  </label>
                  <select 
                    className="form-input" 
                    value={donCategory}
                    onChange={(e) => {
                      setDonCategory(e.target.value);
                      if (e.target.value !== 'Other Seva') {
                        setDonErrors(prev => ({ ...prev, otherSeva: '' }));
                      }
                    }}
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#FFF', width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="Mahaprasad & Bhandara Seva">🍲 Mahaprasad & Bhandara Seva</option>
                    <option value="Decoration & Lighting Seva">🌺 Decoration & Lighting Seva</option>
                    <option value="General Festival Fund">🚩 General Festival Fund</option>
                    <option value="Daily Aarti & Pooja Seva">🪔 Daily Aarti & Pooja Seva</option>
                    <option value="Visarjan Mahotsav Seva">🌊 Visarjan Mahotsav Seva</option>
                    <option value="Other Seva">✨ Other Seva (अन्य सेवा)</option>
                  </select>

                  {/* If Other Seva is selected, show input to specify fund details */}
                  {donCategory === 'Other Seva' && (
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ fontSize: '12px', color: '#FFD700', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Specify Other Seva / Fund Name (फण्ड / सेवा का नाम लिखें) *</span>
                        {donErrors.otherSeva && <span style={{ color: '#FF5252', fontSize: '11px' }}>⚠️ {donErrors.otherSeva}</span>}
                      </label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Laddu Prasad Fund, Sound System Seva, Blood Camp..."
                        value={otherSevaName}
                        onChange={(e) => {
                          setOtherSevaName(e.target.value);
                          if (e.target.value.trim()) setDonErrors(prev => ({ ...prev, otherSeva: '' }));
                        }}
                        style={{ width: '100%', boxSizing: 'border-box', border: donErrors.otherSeva ? '1px solid #FF5252' : undefined }}
                      />
                    </div>
                  )}
                </div>

                {/* Auto Send to SMS, WhatsApp, Email & Print Receipt Checkbox */}
                <div style={{
                  background: 'rgba(37, 211, 102, 0.1)',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(37, 211, 102, 0.35)'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#FFF', margin: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={autoOpenWhatsApp} 
                      onChange={(e) => setAutoOpenWhatsApp(e.target.checked)} 
                      style={{ width: '18px', height: '18px', accentColor: '#25D366' }}
                    />
                    <span style={{ color: '#A7F3D0', fontWeight: 700 }}>
                      ⚡ Auto-Send to SMS, WhatsApp, Email & Print Receipt immediately
                    </span>
                  </label>
                  <p style={{ margin: '6px 0 0 28px', fontSize: '11.5px', color: '#DDD', lineHeight: 1.4 }}>
                    Entry generate hote hi <strong>WhatsApp</strong>, <strong>Phone SMS</strong>, aur <strong>Email</strong> teeno par receipt turant bhej di jayegi aur <strong>Print Receipt</strong> slip open ho jayegi.
                  </p>
                </div>

                <button type="submit" className="btn-gold" style={{ justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: 700 }}>
                  + Record Entry & Generate Receipt (पावती)
                </button>
              </form>
            </div>

            {/* Donation Records List */}
            <div className="maroon-card gold-box-hover" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="heading-font" style={{ color: '#FFB300', margin: 0, fontSize: '18px' }}>
                  📋 Donation Records ({donationsList.length})
                </h3>
                <span style={{ fontSize: '12px', color: '#FFD700', fontWeight: 700 }}>
                  Total: ₹{totalDonationSum.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
                {donationsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#AAA' }}>
                    <FileText size={36} color="rgba(255,215,0,0.3)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>Abhi tak koi donation entry nahi hai. Nayi entry add karein!</p>
                  </div>
                ) : (
                  (Array.isArray(donationsList) ? donationsList : []).map((d) => (
                    <div key={d.id || d._id} style={{
                      background: 'rgba(0,0,0,0.55)',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid var(--gold-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      {/* Top Row: Donor & Amount */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <h4 style={{ color: '#FFF', fontSize: '14.5px', margin: '0 0 3px', fontWeight: 700 }}>
                            {d.donorName}
                          </h4>
                          <div style={{ fontSize: '11.5px', color: '#DDD', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {d.donorPhone && (
                              <span style={{ color: '#81D4FA' }}>📞 +91 {d.donorPhone}</span>
                            )}
                            {d.donorWhatsApp && d.donorWhatsApp !== d.donorPhone && (
                              <span style={{ color: '#69F0AE' }}>💬 WA: +91 {d.donorWhatsApp}</span>
                            )}
                            {d.donorEmail && (
                              <span style={{ color: '#CE93D8' }}>📧 {d.donorEmail}</span>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: '#FFD700', fontWeight: 800, fontSize: '16px' }}>
                            ₹{Number(d.amount).toLocaleString('en-IN')}
                          </span>
                          <div style={{ fontSize: '10px', color: '#888' }}>
                            #{d.receiptNo || ('YYM-' + String(d.id).slice(-6))}
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Meta */}
                      <div style={{ fontSize: '11px', color: '#BBB', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                        <div>
                          <span style={{ color: '#69F0AE', fontWeight: 600 }}>{d.type}</span> • <span>{d.category}</span>
                        </div>
                        <div style={{ color: '#888' }}>
                          {d.date} {d.time || ''} | By: {d.collectorName || 'Admin'}
                        </div>
                      </div>

                      {/* Bottom Row: Actions (Send All, Print, WhatsApp, SMS, Email, Delete) */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '4px' }}>
                        {/* 0. Master Send All 3 & Print */}
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedReceipt(d);
                            setIsReceiptModalOpen(true);
                            dispatchAllReceiptChannels(d);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                            border: 'none',
                            color: '#2B0507',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 6px rgba(255,215,0,0.3)'
                          }}
                          title="Send receipt to WhatsApp, SMS and Email, plus open Print dialog"
                        >
                          ⚡ Send All 3 & Print
                        </button>

                        {/* 1. View / Print Slip */}
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedReceipt(d);
                            setIsReceiptModalOpen(true);
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,215,0,0.4)',
                            color: '#FFD700',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="View & Print Official Receipt Slip"
                        >
                          <Printer size={13} /> Print Slip
                        </button>

                        {/* 2. WhatsApp Button */}
                        <button 
                          type="button"
                          onClick={() => sendWhatsAppReceipt(d)}
                          style={{
                            background: '#25D366',
                            border: 'none',
                            color: '#000',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Send Receipt via WhatsApp"
                        >
                          💬 WhatsApp
                        </button>

                        {/* 3. Phone Message (SMS) Button */}
                        <button 
                          type="button"
                          onClick={() => sendSmsReceipt(d)}
                          style={{
                            background: '#0288D1',
                            border: 'none',
                            color: '#FFF',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Send Receipt via Phone SMS Message"
                        >
                          📲 SMS
                        </button>

                        {/* 4. Email Button (if email present) */}
                        {d.donorEmail && (
                          <button 
                            type="button"
                            onClick={() => sendEmailReceipt(d)}
                            style={{
                              background: '#7E57C2',
                              border: 'none',
                              color: '#FFF',
                              padding: '5px 9px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Send Receipt via Email"
                          >
                            ✉️ Email
                          </button>
                        )}

                        {/* 5. Delete Button */}
                        <button 
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Kya aap sure hain ki "${d.donorName}" ka donation record delete karna hai?`)) {
                              if (deleteDonation) deleteDonation(d.id || d._id);
                              triggerSuccess('Donation record deleted!');
                            }
                          }}
                          style={{
                            background: 'rgba(255,0,0,0.15)',
                            border: '1px solid #FF5252',
                            color: '#FF5252',
                            padding: '5px 9px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            marginLeft: 'auto'
                          }}
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. TAB: VOLUNTEER PERMISSION MANAGER */}
      {activeTab === 'permissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Add Volunteer Form */}
          <div className="maroon-card gold-box-hover" style={{ padding: '24px' }}>
            <h3 className="heading-font" style={{ color: '#FFB300', marginBottom: '8px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={20} color="#FFB300" /> ➕ Register New Mandal Volunteer
            </h3>
            <p style={{ color: '#FFECB3', fontSize: '13px', marginBottom: '20px' }}>
              Mandal ke naye volunteer (karyakarta) ko yahan add karein aur unhe avashyak permissions dein.
            </p>

            <form onSubmit={handleAddVolunteerSubmit}>
              <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px', marginBottom: '16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '6px' }}>
                    Volunteer Name (नाम) *
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Rahul Sharma" 
                    value={volNameInput} 
                    onChange={(e) => setVolNameInput(e.target.value)} 
                    className="form-input" 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#FFECB3', display: 'block', marginBottom: '6px' }}>
                    Phone Number (मोबाइल नंबर)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 9876543210" 
                    value={volPhoneInput} 
                    onChange={(e) => setVolPhoneInput(e.target.value)} 
                    className="form-input" 
                  />
                </div>
              </div>

              {/* Quick Permission Checkboxes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#FFD700', display: 'block', marginBottom: '10px', fontWeight: 600 }}>
                  Initial Access Permissions (प्रारंभिक अनुमतियाँ):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#FFF', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <input type="checkbox" checked={canCashInput} onChange={(e) => setCanCashInput(e.target.checked)} />
                    💵 Cash Collection
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#FFF', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <input type="checkbox" checked={canSchedInput} onChange={(e) => setCanSchedInput(e.target.checked)} />
                    ⏰ Edit Schedule
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#FFF', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <input type="checkbox" checked={canBannerInput} onChange={(e) => setCanBannerInput(e.target.checked)} />
                    🖼️ Edit Banner
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-gold" 
                style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                👥 Add Volunteer
              </button>
            </form>
          </div>

          {/* Volunteer Permissions Table */}
          <div className="maroon-card gold-box-hover" style={{ padding: '28px' }}>
            <h3 className="heading-font" style={{ color: '#FFB300', marginBottom: '8px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="#FFB300" /> Active Volunteer Permissions List ({volunteersList.length})
            </h3>
            <p style={{ color: '#FFECB3', fontSize: '13px', marginBottom: '24px' }}>
              Admin kisi bhi samay kisi karyakarta ki permission button par click karke Granted (अनुमति दी) ya Revoked (अनुमति हटाई) toggle kar sakta hai.
            </p>

            {volunteersList.length === 0 ? (
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--gold-border)', borderRadius: '12px', padding: '36px 20px', textAlign: 'center' }}>
                <p style={{ color: '#AAA', margin: 0, fontSize: '14px' }}>
                  👥 Abhi tak koi volunteer register nahi hai. Upar diye gaye form se naye volunteer ka naam aur permission add karein!
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#FFF' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 179, 0, 0.15)', borderBottom: '1px solid rgba(255, 179, 0, 0.3)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Volunteer Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>💵 Cash Collection</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>⏰ Edit Schedule</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>📸 Add Reels</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>🖼️ Edit Banner</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteersList.map((vol) => (
                      <tr key={vol.id || vol._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <td style={{ padding: '12px', fontWeight: 600, color: '#FFB300' }}>{vol.name}</td>
                        <td style={{ padding: '12px', color: '#FFECB3' }}>{vol.phone || 'N/A'}</td>
                        
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              toggleVolunteerPermission(vol.id || vol._id, 'canCollectCash');
                              triggerSuccess(`Cash permission updated for ${vol.name}`);
                            }}
                            style={{
                              background: vol.canCollectCash ? 'rgba(105, 240, 174, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                              border: vol.canCollectCash ? '1px solid #69F0AE' : '1px solid #FF5252',
                              color: vol.canCollectCash ? '#69F0AE' : '#FF5252',
                              padding: '5px 12px',
                              borderRadius: '16px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '11px'
                            }}
                          >
                            {vol.canCollectCash ? '✅ Granted' : '❌ Revoked'}
                          </button>
                        </td>

                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              toggleVolunteerPermission(vol.id || vol._id, 'canEditSchedule');
                              triggerSuccess(`Schedule permission updated for ${vol.name}`);
                            }}
                            style={{
                              background: vol.canEditSchedule ? 'rgba(105, 240, 174, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                              border: vol.canEditSchedule ? '1px solid #69F0AE' : '1px solid #FF5252',
                              color: vol.canEditSchedule ? '#69F0AE' : '#FF5252',
                              padding: '5px 12px',
                              borderRadius: '16px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '11px'
                            }}
                          >
                            {vol.canEditSchedule ? '✅ Granted' : '❌ Revoked'}
                          </button>
                        </td>

                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              toggleVolunteerPermission(vol.id || vol._id, 'canAddReels');
                              triggerSuccess(`Reels permission updated for ${vol.name}`);
                            }}
                            style={{
                              background: vol.canAddReels ? 'rgba(105, 240, 174, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                              border: vol.canAddReels ? '1px solid #69F0AE' : '1px solid #FF5252',
                              color: vol.canAddReels ? '#69F0AE' : '#FF5252',
                              padding: '5px 12px',
                              borderRadius: '16px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '11px'
                            }}
                          >
                            {vol.canAddReels ? '✅ Granted' : '❌ Revoked'}
                          </button>
                        </td>

                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              toggleVolunteerPermission(vol.id || vol._id, 'canEditBanner');
                              triggerSuccess(`Banner permission updated for ${vol.name}`);
                            }}
                            style={{
                              background: vol.canEditBanner ? 'rgba(105, 240, 174, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                              border: vol.canEditBanner ? '1px solid #69F0AE' : '1px solid #FF5252',
                              color: vol.canEditBanner ? '#69F0AE' : '#FF5252',
                              padding: '5px 12px',
                              borderRadius: '16px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '11px'
                            }}
                          >
                            {vol.canEditBanner ? '✅ Granted' : '❌ Revoked'}
                          </button>
                        </td>

                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove ${vol.name}?`)) {
                                if (deleteVolunteer) deleteVolunteer(vol.id || vol._id);
                                triggerSuccess(`Volunteer ${vol.name} removed successfully!`);
                              }
                            }}
                            style={{
                              background: 'rgba(255,0,0,0.15)',
                              border: '1px solid #FF5252',
                              color: '#FF5252',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 11. TAB: ADMIN PASSWORD & SECURITY */}
      {activeTab === 'security' && (
        <div className="maroon-card gold-box-hover" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'rgba(255, 215, 0, 0.15)',
              border: '1.5px solid var(--gold-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <KeyRound size={26} color="#FFD700" />
            </div>
            <div>
              <h3 className="heading-font" style={{ color: '#FFB300', margin: 0, fontSize: '22px' }}>
                Admin Portal Password & Security
              </h3>
              <p style={{ color: '#FFECB3', fontSize: '13px', margin: '4px 0 0' }}>
                Change the access password required to unlock and manage the Admin CMS Portal.
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Current Password Field */}
            <div>
              <label style={{ fontSize: '13.5px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                🔒 Current Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrPass ? "text" : "password"}
                  required
                  placeholder="Enter current admin password"
                  value={currPassInput}
                  onChange={(e) => setCurrPassInput(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrPass(!showCurrPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#FFD700',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title={showCurrPass ? "Hide" : "Show"}
                >
                  {showCurrPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div>
              <label style={{ fontSize: '13.5px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                🔑 New Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  minLength={4}
                  placeholder="Enter new password (at least 4 characters)"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#FFD700',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title={showNewPass ? "Hide" : "Show"}
                >
                  {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div>
              <label style={{ fontSize: '13.5px', color: '#FFD700', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                🔁 Confirm New Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPass ? "text" : "password"}
                  required
                  placeholder="Re-enter new password to confirm"
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#FFD700',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title={showConfirmPass ? "Hide" : "Show"}
                >
                  {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {newPassInput && confirmPassInput && (
                <p style={{
                  fontSize: '12px',
                  marginTop: '6px',
                  fontWeight: 600,
                  color: newPassInput === confirmPassInput ? '#69F0AE' : '#FF5252'
                }}>
                  {newPassInput === confirmPassInput ? '✅ Passwords match' : '❌ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Feedback Message */}
            {passChangeMsg.text && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: passChangeMsg.type === 'success' ? 'rgba(105, 240, 174, 0.15)' : 'rgba(255, 82, 82, 0.15)',
                border: passChangeMsg.type === 'success' ? '1px solid #69F0AE' : '1px solid #FF5252',
                color: passChangeMsg.type === 'success' ? '#69F0AE' : '#FF5252',
                fontSize: '13.5px',
                fontWeight: 600
              }}>
                {passChangeMsg.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={passChangeLoading}
              className="btn-gold"
              style={{
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: passChangeLoading ? 'not-allowed' : 'pointer',
                opacity: passChangeLoading ? 0.7 : 1,
                marginTop: '8px'
              }}
            >
              {passChangeLoading ? '🔄 Updating Password...' : '💾 Save New Admin Password'}
            </button>
          </form>
        </div>
      )}

      {/* 12. DIVINE DONATION RECEIPT & DISPATCH MODAL */}
      {isReceiptModalOpen && selectedReceipt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #2B0507 0%, #150203 100%)',
            border: '2px solid var(--gold-border)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255,215,0,0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
              background: 'rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText color="#FFD700" size={22} />
                <h3 className="heading-font" style={{ color: '#FFD700', margin: 0, fontSize: '18px' }}>
                  Official Donation Receipt Slip (पावती)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#FFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Dispatch Action Bar */}
            <div style={{
              background: 'rgba(255, 215, 0, 0.08)',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#FFECB3', fontWeight: 700 }}>
                  🚀 Instant Receipt Dispatch:
                </span>
                <button
                  type="button"
                  onClick={() => dispatchAllReceiptChannels(selectedReceipt)}
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                    color: '#2B0507',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(255,215,0,0.4)'
                  }}
                  title="Automatically send receipt to WhatsApp, Phone SMS, and Email, plus open Print dialog"
                >
                  ⚡ Send All 3 (WhatsApp + SMS + Email) & Print
                </button>
              </div>

              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={() => sendWhatsAppReceipt(selectedReceipt)}
                style={{
                  background: '#25D366',
                  color: '#000',
                  border: 'none',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 8px rgba(37,211,102,0.4)'
                }}
              >
                💬 WhatsApp (+91 {selectedReceipt.donorWhatsApp || selectedReceipt.donorPhone})
              </button>

              {/* SMS Button */}
              <button
                type="button"
                onClick={() => sendSmsReceipt(selectedReceipt)}
                style={{
                  background: '#0288D1',
                  color: '#FFF',
                  border: 'none',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 8px rgba(2,136,209,0.4)'
                }}
              >
                📲 Phone SMS (+91 {selectedReceipt.donorPhone})
              </button>

              {/* Email Button (if email present) */}
              {selectedReceipt.donorEmail && (
                <button
                  type="button"
                  onClick={() => sendEmailReceipt(selectedReceipt)}
                  style={{
                    background: '#7E57C2',
                    color: '#FFF',
                    border: 'none',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  ✉️ Email ({selectedReceipt.donorEmail})
                </button>
              )}

              {/* Download PDF Button */}
              <button
                type="button"
                onClick={() => downloadReceiptPDF(selectedReceipt)}
                style={{
                  background: '#D32F2F',
                  color: '#FFF',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 8px rgba(211,47,47,0.4)'
                }}
                title="Download Official Donation Receipt as PDF File"
              >
                <FileText size={15} /> Download PDF (पावती PDF)
              </button>

              {/* Print Slip Button */}
              <button
                type="button"
                onClick={() => handlePrintSlip(selectedReceipt)}
                className="btn-gold"
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Printer size={15} /> Print Slip / PDF
              </button>

              {/* Copy Slip Image Button */}
              <button
                type="button"
                onClick={() => copySlipImageToClipboard(selectedReceipt)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: '#FFD700',
                  border: '1px solid rgba(255,215,0,0.4)',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Copy Official Print Slip Image to Clipboard (press Ctrl+V in WhatsApp chat to paste)"
              >
                <Copy size={14} /> Copy Slip Image (Ctrl+V)
              </button>

              {/* Download Slip PNG Button */}
              <button
                type="button"
                onClick={() => downloadSlipImage(selectedReceipt)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#FFF',
                  border: '1px solid rgba(255,255,255,0.25)',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Download Official Print Slip as PNG Image"
              >
                <Download size={14} /> Download Image
              </button>
            </div>

            {/* Helper Banner */}
            <div style={{
              background: 'rgba(37, 211, 102, 0.12)',
              borderBottom: '1px solid rgba(37, 211, 102, 0.3)',
              padding: '8px 20px',
              fontSize: '12px',
              color: '#A7F3D0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '15px' }}>💡</span>
              <span>
                <strong>WhatsApp par Receipt PDF bhejna:</strong> WhatsApp click karte hi <strong>Receipt PDF automatically download</strong> ho jaati hai. WhatsApp chat me <strong>📎 (Attach) &gt; Document</strong> par click karke downloaded PDF select karein aur bhej dein! Ya chat me <strong>Ctrl + V</strong> daba kar direct slip image bhej dein!
              </span>
            </div>

            {/* Printable Receipt Paper Container */}
            <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <div
                className="donation-receipt-print-area"
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  background: '#FFFDF6',
                  color: '#2B0507',
                  border: '3px double #B8860B',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  fontFamily: '"Times New Roman", serif, sans-serif'
                }}
              >
                {/* Mandir Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #B8860B', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', color: '#B8860B', fontWeight: 800, letterSpacing: '2px' }}>
                    ॥ श्री गणेशाय नमः ॥
                  </div>
                  <h2 style={{ margin: '4px 0 2px', fontSize: '24px', color: '#8B0000', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    YUVA YUVAK MANDAL
                  </h2>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#333' }}>
                    🚩 Shri Ganesh Utsav Mahotsav 2026 • 58th Glorious Year
                  </div>
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                    Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat - 395002
                  </div>
                  <div style={{
                    display: 'inline-block',
                    background: '#8B0000',
                    color: '#FFD700',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    padding: '2px 14px',
                    borderRadius: '14px',
                    marginTop: '8px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    Official Donation Receipt Voucher (दान पावती)
                  </div>
                </div>

                {/* Receipt Metadata Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#444', marginBottom: '14px', borderBottom: '1px dashed #B8860B', paddingBottom: '8px' }}>
                  <div>
                    <strong>Receipt No:</strong> <span style={{ color: '#8B0000', fontWeight: 800 }}>{selectedReceipt.receiptNo || ('YYM-DON-' + String(selectedReceipt.id).slice(-6))}</span>
                  </div>
                  <div>
                    <strong>Date:</strong> {selectedReceipt.date} {selectedReceipt.time || ''}
                  </div>
                </div>

                {/* Donor Particulars Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', marginBottom: '16px' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                      <td style={{ padding: '7px 4px', color: '#666', width: '35%' }}>Donor Full Name:</td>
                      <td style={{ padding: '7px 4px', fontWeight: 700, color: '#111', fontSize: '14px' }}>
                        श्री / श्रीमती {selectedReceipt.donorName}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                      <td style={{ padding: '7px 4px', color: '#666' }}>Mobile Number:</td>
                      <td style={{ padding: '7px 4px', fontWeight: 700, color: '#111' }}>
                        +91 {selectedReceipt.donorPhone}
                      </td>
                    </tr>
                    {selectedReceipt.donorWhatsApp && selectedReceipt.donorWhatsApp !== selectedReceipt.donorPhone && (
                      <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                        <td style={{ padding: '7px 4px', color: '#666' }}>WhatsApp Number:</td>
                        <td style={{ padding: '7px 4px', fontWeight: 700, color: '#1B5E20' }}>
                          +91 {selectedReceipt.donorWhatsApp}
                        </td>
                      </tr>
                    )}
                    {selectedReceipt.donorEmail && (
                      <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                        <td style={{ padding: '7px 4px', color: '#666' }}>Email Address:</td>
                        <td style={{ padding: '7px 4px', color: '#111' }}>
                          {selectedReceipt.donorEmail}
                        </td>
                      </tr>
                    )}
                    <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                      <td style={{ padding: '7px 4px', color: '#666' }}>Seva Category / Purpose:</td>
                      <td style={{ padding: '7px 4px', fontWeight: 700, color: '#8B0000' }}>
                        {selectedReceipt.category || 'General Festival Fund'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                      <td style={{ padding: '7px 4px', color: '#666' }}>Payment Mode:</td>
                      <td style={{ padding: '7px 4px', fontWeight: 600, color: '#111' }}>
                        {selectedReceipt.type || 'Cash Collection'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E0D0B0', background: 'rgba(255, 215, 0, 0.12)' }}>
                      <td style={{ padding: '9px 4px', color: '#8B0000', fontWeight: 800, fontSize: '13px' }}>Donation Amount:</td>
                      <td style={{ padding: '9px 4px', fontWeight: 900, color: '#8B0000', fontSize: '18px' }}>
                        ₹ {Number(selectedReceipt.amount).toLocaleString('en-IN')} /-
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                      <td style={{ padding: '7px 4px', color: '#666' }}>Amount in Words:</td>
                      <td style={{ padding: '7px 4px', fontStyle: 'italic', fontWeight: 700, color: '#2B0507' }}>
                        {selectedReceipt.amountInWords || numberToWordsINR(selectedReceipt.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Divine Blessings Note */}
                <div style={{
                  background: 'rgba(139, 0, 0, 0.05)',
                  border: '1px solid rgba(184, 134, 11, 0.4)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '11.5px',
                  color: '#4A1517',
                  textAlign: 'center',
                  marginBottom: '16px',
                  lineHeight: 1.5
                }}>
                  🌺 <strong>गणपति बप्पा मोरया!</strong> 🌺<br />
                  युवा युवक मंडल परिवार की ओर से आपका हार्दिक आभार। भगवान श्री गणेश जी आपके परिवार को सुख, शांति, समृद्धि एवं उत्तम स्वास्थ्य प्रदान करें। 🙏🚩
                </div>

                {/* Signatures & Seal Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', paddingTop: '10px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: '2px dashed #8B0000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      color: '#8B0000',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      transform: 'rotate(-10deg)',
                      margin: '0 auto 4px'
                    }}>
                      OFFICIAL<br />SEAL<br />YYM 2026
                    </div>
                    <span style={{ fontSize: '10px', color: '#666' }}>Trust Verified Seal</span>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#333', minWidth: '160px' }}>
                    <div style={{ height: '28px' }}></div>
                    <div style={{ borderTop: '1px solid #555', paddingTop: '4px', fontSize: '11px', fontWeight: 700, color: '#8B0000' }}>
                      Authorized Signatory
                    </div>
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      Yuva Yuvak Mandal, Surat
                    </div>
                  </div>
                </div>

                {/* Slip Disclaimer */}
                <div style={{ textAlign: 'center', fontSize: '9.5px', color: '#888', marginTop: '14px', borderTop: '1px dashed #CCC', paddingTop: '6px' }}>
                  * This is a computer-generated official receipt slip of Yuva Yuvak Mandal, Surat.
                </div>
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              borderTop: '1px solid rgba(212, 175, 55, 0.2)',
              background: 'rgba(0,0,0,0.3)'
            }}>
              <span style={{ fontSize: '12px', color: '#AAA' }}>
                Recipient: +91 {selectedReceipt.donorPhone}
              </span>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFF',
                  padding: '6px 18px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12.5px'
                }}
              >
                Close (बंद करें)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

