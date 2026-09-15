import React, { useState, useEffect, useLayoutEffect, useRef, useContext } from 'react';
import { Star, MessageSquare, Send, User, MapPin } from 'lucide-react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext, getApiBaseUrl } from '../context/SiteDataContext';
import { Translate } from '../utils/useAutoTranslate';
import { formatReviewDate } from '../utils/dateUtils';

export default function DevoteeReviews() {
  const { t, currentLang } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingError, setRatingError] = useState(false);
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const reviewsListRef = useRef(null);
  const formBoxRef = useRef(null);
  const [formBoxHeight, setFormBoxHeight] = useState(null);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth > 768 : true);

  const hasAutoScrolled = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useLayoutEffect(() => {
    if (formBoxRef.current) {
      const updateHeight = () => {
        if (formBoxRef.current) {
          setFormBoxHeight(formBoxRef.current.offsetHeight);
        }
      };
      updateHeight();
      const observer = new ResizeObserver(updateHeight);
      observer.observe(formBoxRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    fetchReviews();

    // 1. Live auto-polling every 4 seconds for real-time sync across devices
    const pollInterval = setInterval(() => {
      fetchReviews(true);
    }, 4000);

    // 2. BroadcastChannel for 0ms instant sync across browser tabs
    let channel;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('ganpati_reviews_sync');
        channel.onmessage = () => {
          fetchReviews(true);
        };
      }
    } catch (e) {}

    // 3. Tab visibility, window focus, and custom event listeners
    const handleSync = () => fetchReviews(true);
    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('new_review_added', handleSync);

    return () => {
      clearInterval(pollInterval);
      if (channel) channel.close();
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('new_review_added', handleSync);
    };
  }, []);

  const fetchReviews = async (silent = false) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/reviews?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } else if (!silent) {
        setReviews([]);
        setIsReady(true);
      }
    } catch (e) {
      if (!silent) {
        setReviews([]);
        setIsReady(true);
      }
    } finally {
      if (!silent) {
        setHasFetched(true);
      }
    }
  };

  // Instant positioning before browser paint: WhatsApp style
  useLayoutEffect(() => {
    if (reviews.length > 0) {
      if (!hasAutoScrolled.current && reviewsListRef.current) {
        reviewsListRef.current.scrollTop = reviewsListRef.current.scrollHeight;
        hasAutoScrolled.current = true;
        setIsReady(true);
      }
    } else {
      setIsReady(true);
    }
  }, [reviews]);

  const scrollToBottom = (behavior = 'smooth') => {
    if (reviewsListRef.current) {
      reviewsListRef.current.scrollTo({
        top: reviewsListRef.current.scrollHeight,
        behavior
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    if (rating === 0) {
      setRatingError(true);
      return;
    }
    setRatingError(false);

    setLoading(true);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) + ', ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

    const newRev = {
      name,
      rating,
      comment,
      location: location || 'Surat Devotee',
      clientDate: formattedDate,
      createdAt: now.toISOString()
    };

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRev)
      });
      if (res.ok) {
        const result = await res.json();
        setReviews(prev => [...prev, result.review]);
        setName('');
        setComment('');
        setLocation('');
        setRating(0);
        setTimeout(() => scrollToBottom('smooth'), 120);

        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const channel = new BroadcastChannel('ganpati_reviews_sync');
            channel.postMessage('NEW_REVIEW');
            channel.close();
          }
          window.dispatchEvent(new CustomEvent('new_review_added'));
        } catch (e) {}
      }
    } catch (err) {
      const localRev = {
        id: Date.now(),
        name,
        rating,
        comment,
        location: location || 'Surat Devotee',
        date: formattedDate,
        createdAt: now.toISOString()
      };
      setReviews(prev => [...prev, localRev]);
      setName('');
      setComment('');
      setLocation('');
      setRating(0);
      setTimeout(() => scrollToBottom('smooth'), 120);

      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const channel = new BroadcastChannel('ganpati_reviews_sync');
          channel.postMessage('NEW_REVIEW');
          channel.close();
        }
        window.dispatchEvent(new CustomEvent('new_review_added'));
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="devotee-reviews-section" style={{
      padding: '40px 20px 50px',
      background: 'linear-gradient(180deg, #2B0507 0%, #1A0304 100%)',
      borderTop: '1.5px solid var(--gold-border)'
    }}>
      <style>{`
        @media (min-width: 769px) {
          .devotee-reviews-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .devotee-reviews-section {
            padding-top: 34px !important;
            padding-bottom: 40px !important;
            padding-left: 14px !important;
            padding-right: 14px !important;
          }
          .devotee-reviews-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .devotee-reviews-header {
            margin-bottom: 32px !important;
          }
          .devotee-reviews-badge-wrap {
            margin-bottom: 14px !important;
          }
          .devotee-reviews-title {
            font-size: clamp(20px, 4.8vw, 25px) !important;
            line-height: 1.3 !important;
            letter-spacing: 0.5px !important;
          }
          .devotee-reviews-sub {
            font-size: 13.5px !important;
            line-height: 1.55 !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        
        <div className="devotee-reviews-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          {siteData?.reviewsBadge !== '' && (
            <div className="devotee-reviews-badge-wrap" style={{ display: 'block', marginBottom: '14px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 179, 0, 0.12)',
                border: '1px solid var(--gold-border)',
                padding: '6px 16px',
                borderRadius: '20px',
                color: '#FFB300',
                fontSize: '13px',
                fontWeight: 700
              }}>
                <MessageSquare size={16} color="#FFB300" /> <Translate text={siteData?.reviewsBadge || t.reviewsBadge || "Devotee Experiences & Reviews"} />
              </div>
            </div>
          )}
          <h2 className="heading-font gold-text devotee-reviews-title" style={{ fontSize: '32px', margin: '0 0 10px', display: 'block' }}>
            <Translate text={siteData?.reviewsTitle || t.reviewsTitle || "🚩 DEVOTEE FEEDBACK & BLESSINGS 🚩"} />
          </h2>
          <div style={{
            width: '90px',
            height: '3.5px',
            background: 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)',
            margin: '12px auto 18px',
            borderRadius: '3px'
          }} />
          {siteData?.reviewsSub !== '' && (
            <p className="devotee-reviews-sub" style={{ color: '#FFECB3', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
              <Translate text={siteData?.reviewsSub || t.reviewsSub || "Share your divine experience and blessings of Shri Ganesh Utsav Mahotsav!"} />
            </p>
          )}
        </div>

        <div className="devotee-reviews-grid mobile-entrance-fade-up" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px',
          alignItems: 'stretch'
        }}>
          
          {/* Left Box (Desktop) / Top Box (Mobile): Reviews List */}
          <div 
            ref={reviewsListRef} 
            className="custom-scrollbar" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              minHeight: 0,
              height: (isDesktop && formBoxHeight) ? `${formBoxHeight}px` : 'auto',
              maxHeight: (isDesktop && formBoxHeight) ? `${formBoxHeight}px` : '480px', 
              overflowY: 'auto', 
              padding: '10px',
              opacity: isReady ? 1 : 0,
              visibility: isReady ? 'visible' : 'hidden',
              transition: 'opacity 0.2s ease',
              boxSizing: 'border-box'
            }}
          >
            {!hasFetched ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', gap: '12px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  border: '2.5px solid rgba(212, 175, 55, 0.25)',
                  borderTopColor: '#FFD700',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span style={{ color: '#E6C687', fontSize: '13px' }}>
                  {currentLang === 'HI' ? 'अनुभव लोड हो रहे हैं...' : currentLang === 'GU' ? 'અનુભવો લોડ થઈ રહ્યા છે...' : 'Loading devotee reviews...'}
                </span>
              </div>
            ) : reviews.length === 0 ? (
              <p style={{ color: '#AAA', textAlign: 'center', padding: '40px' }}>
                {t.noReviewsYet || "No reviews yet. Be the first to share your experience!"}
              </p>
            ) : (
              reviews.map((item) => (
                <div key={item._id || item.id} className="review-card-hover" style={{ 
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(212, 175, 55, 0.22)',
                  borderRadius: '16px',
                  padding: '18px 20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div className="user-avatar" style={{
                        width: '34px',
                        height: '34px',
                        minWidth: '34px',
                        minHeight: '34px',
                        maxWidth: '34px',
                        maxHeight: '34px',
                        flexShrink: 0,
                        aspectRatio: '1 / 1',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFB300, #D4AF37)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2B0507',
                        fontWeight: 700,
                        fontSize: '13px',
                        overflow: 'hidden'
                      }}>
                        <User size={18} color="#2B0507" style={{ flexShrink: 0 }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ color: '#FFF', fontSize: '14.5px', margin: '0 0 2px', fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}>
                          {item.name}
                        </h4>
                        <div style={{ fontSize: '11px', color: '#AAA', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', lineHeight: 1.3 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#FFD700', fontWeight: 600 }}>
                            <MapPin size={11} color="#FFB300" style={{ flexShrink: 0 }} />
                            <span>{item.location || 'Surat Devotee'}</span>
                          </span>
                          <span style={{ color: '#777' }}>•</span>
                          <span>{formatReviewDate(item, currentLang)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0, marginTop: '2px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={14} 
                          fill={s <= item.rating ? '#FFD700' : 'transparent'} 
                          color={s <= item.rating ? '#FFD700' : '#444'} 
                          style={{ flexShrink: 0 }}
                        />
                      ))}
                    </div>
                  </div>

                  <p style={{ color: '#FFECB3', fontSize: '13.5px', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                    "{item.comment}"
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Right Box (Desktop) / Bottom Box (Mobile): Write Review Form */}
          <div 
            ref={formBoxRef}
            className="write-review-box-stable" 
            style={{
              background: 'linear-gradient(135deg, rgba(61, 11, 13, 0.85) 0%, rgba(37, 4, 6, 0.95) 100%)',
              border: '1.5px solid var(--gold-border)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '480px'
            }}
          >
            <h3 className="heading-font gold-text" style={{ fontSize: '20px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t.writeReviewTitle || "Write Your Review / Feedback"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ color: '#FFECB3', fontSize: '13px', fontWeight: 600 }}>
                    {t.yourRating || "Your Rating:"}
                  </label>
                  <span style={{ color: '#FFD700', fontSize: '13px', fontWeight: 700 }}>
                    {(hoverRating || rating)} {t.starRating || "/ 5 Star"}
                  </span>
                </div>
                
                {/* Smooth Star Container */}
                <div 
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ 
                    display: 'flex', 
                    gap: '6px', 
                    alignItems: 'center', 
                    userSelect: 'none',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: ratingError ? '1.5px solid #FF5252' : '1.5px solid transparent',
                    background: ratingError ? 'rgba(255, 82, 82, 0.12)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || rating);
                    return (
                      <span
                        key={star}
                        role="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setRating(star);
                          setHoverRating(0);
                          setRatingError(false);
                        }}
                        onTouchStart={() => setHoverRating(0)}
                        onMouseEnter={() => setHoverRating(star)}
                        aria-label={`Select ${star} Star`}
                        style={{
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          outline: 'none',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        <Star 
                          size={28} 
                          fill={isFilled ? '#FFD700' : 'transparent'} 
                          color={isFilled ? '#FFD700' : '#777'} 
                          style={{ pointerEvents: 'none', transition: 'fill 0.15s ease, color 0.15s ease' }}
                        />
                      </span>
                    );
                  })}
                </div>
                {ratingError && (
                  <p style={{ color: '#FF5252', fontSize: '12px', margin: '6px 0 0', fontWeight: 600 }}>
                    {t.starRatingRequired || 'Star Rating is Required'}
                  </p>
                )}
              </div>

              <div>
                <input 
                  type="text" 
                  required
                  placeholder={t.reviewerNamePlaceholder || (currentLang === 'HI' ? "आपका नाम दर्ज करें" : currentLang === 'GU' ? "તમારું નામ દાખલ કરો" : "Your Name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-gold-hover" 
                  style={inputStyle}
                />
              </div>

              <div>
                <input 
                  type="text" 
                  placeholder={t.reviewerLocationPlaceholder || (currentLang === 'HI' ? "स्थान / क्षेत्र (जैसे: नवसारी बाजार, सूरत)" : currentLang === 'GU' ? "વિસ્તાર / શહેર (જેમ કે: નવસારી બજાર, સુરત)" : "Location / Area (Optional)")}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-gold-hover" 
                  style={inputStyle}
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '130px' }}>
                <textarea 
                  required
                  placeholder={t.reviewMessagePlaceholder || (currentLang === 'HI' ? "जय श्री गणेश! अपना अनुभव साझा करें..." : currentLang === 'GU' ? "જય શ્રી ગણેશ! આપનો અનુભવ શેર કરો..." : "Share your Darshan experience...")}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input-gold-hover" 
                  style={{ ...inputStyle, flex: 1, height: '100%', minHeight: '130px', resize: 'none', lineHeight: 1.5 }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '24px',
                  fontWeight: 700,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '10px'
                }}
              >
                <Send size={16} /> {loading ? (t.submittingReviewBtn || 'Submitting...') : (t.submitReviewBtn || 'Submit Devotee Review')}
              </button>
            </form>
          </div>

        </div>

      </div>
    </section>
  );
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  background: 'rgba(0,0,0,0.5)',
  border: '1px solid var(--gold-border)',
  borderRadius: '10px',
  color: '#FFF',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box'
};
