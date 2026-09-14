import React, { createContext, useState, useEffect } from 'react';

export const SiteDataContext = createContext();

export const calculateFullFestivalTimeline = (siteData = {}) => {
  const aagmanStr = siteData?.aagmanDate || '2026-09-12';
  const startStr = siteData?.festivalStartDate || '2026-09-14';

  const formatD = (d) => {
    if (!d || isNaN(d.getTime())) return '';
    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    return `${dayStr}-${monthStr}-${d.getFullYear()}`;
  };

  let aagmanD = new Date(aagmanStr);
  if (isNaN(aagmanD.getTime())) aagmanD = new Date('2026-09-12');

  let startD = new Date(startStr);
  if (isNaN(startD.getTime())) startD = new Date('2026-09-14');

  let visarjanD = new Date(startD);
  visarjanD.setDate(startD.getDate() + 10);

  const timeline = [];
  const aagmanFormatted = formatD(aagmanD);
  const startFormatted = formatD(startD);
  const visarjanFormatted = formatD(visarjanD);

  timeline.push({
    key: 'aagman',
    dayTag: 'Aagman Day',
    dateStr: aagmanFormatted,
    rawDate: aagmanD,
    label: `Aagman Day (${aagmanFormatted})`
  });

  for (let i = 0; i < 10; i++) {
    const d = new Date(startD);
    d.setDate(startD.getDate() + i);
    const formatted = formatD(d);
    timeline.push({
      key: `day_${i + 1}`,
      dayTag: `Day ${i + 1}`,
      dateStr: formatted,
      rawDate: d,
      label: `Day ${i + 1} (${formatted})`
    });
  }

  timeline.push({
    key: 'visarjan',
    dayTag: 'Visarjan Day',
    dateStr: visarjanFormatted,
    rawDate: visarjanD,
    label: `Visarjan Day (${visarjanFormatted})`
  });

  return {
    aagmanDateFormatted: aagmanFormatted,
    festivalStartFormatted: startFormatted,
    visarjanDateFormatted: visarjanFormatted,
    timeline
  };
};

export const getCurrentFestivalDayInfo = (siteData = {}) => {
  const safeData = siteData || {};
  const { timeline, aagmanDateFormatted, festivalStartFormatted, visarjanDateFormatted } = calculateFullFestivalTimeline(safeData);
  
  const aagmanStr = safeData?.aagmanDate || '2026-09-12';
  const startStr = safeData?.festivalStartDate || '2026-09-14';

  let aagmanD = new Date(aagmanStr);
  if (isNaN(aagmanD.getTime())) aagmanD = new Date('2026-09-12');
  aagmanD.setHours(0, 0, 0, 0);

  let startD = new Date(startStr);
  if (isNaN(startD.getTime())) startD = new Date('2026-09-14');
  startD.setHours(0, 0, 0, 0);

  let today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if simulatedDay is set in admin
  const simDay = safeData.simulatedDay;
  if (simDay && simDay !== 'auto') {
    if (simDay === 'aagman') {
      today = new Date(aagmanD);
    } else if (simDay === 'visarjan') {
      let visarjanD = new Date(startD);
      visarjanD.setDate(startD.getDate() + 10);
      today = new Date(visarjanD);
      today.setHours(0, 0, 0, 0);
    } else if (simDay.startsWith('day_')) {
      const dayNum = parseInt(simDay.replace('day_', ''), 10) || 1;
      today = new Date(startD);
      today.setDate(startD.getDate() + (dayNum - 1));
      today.setHours(0, 0, 0, 0);
    }
  }

  const formatD = (d) => {
    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    return `${dayStr}-${monthStr}-${d.getFullYear()}`;
  };

  const todayFormatted = formatD(today);

  // If today matches Aagman date, it is ALWAYS Aagman Day!
  if (todayFormatted === aagmanDateFormatted) {
    return {
      isFestivalActive: true,
      isAagmanDay: true,
      dayTag: 'Aagman Day',
      dateStr: aagmanDateFormatted,
      label: `Aagman Day (${aagmanDateFormatted})`,
      activeKey: 'aagman',
      todayFormatted
    };
  }

  const exactMatch = timeline.find(item => item.dateStr === todayFormatted);
  if (exactMatch) {
    return {
      isFestivalActive: true,
      isAagmanDay: exactMatch.key === 'aagman' || exactMatch.dayTag.toLowerCase().includes('aagman'),
      dayTag: exactMatch.dayTag,
      dateStr: exactMatch.dateStr,
      label: exactMatch.label,
      activeKey: exactMatch.key,
      todayFormatted
    };
  }

  return {
    isFestivalActive: false,
    isAagmanDay: false,
    todayFormatted,
    aagmanDateFormatted,
    festivalStartFormatted,
    visarjanDateFormatted
  };
};

export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 9999;
  const str = timeStr.trim().toLowerCase();

  // Try matching 12-hour format e.g. "08:30 AM", "8:30am", "8 am", "07:00 PM Onwards"
  const match12 = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridian = match12[3].toLowerCase();

    if (meridian === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridian === 'am' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  // Try matching 24-hour format e.g. "14:30", "08:00"
  const match24 = str.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes;
    }
  }

  // Special keywords
  if (str.includes('morning') || str.includes('pratah') || str.includes('sakal')) return 480; // 8:00 AM
  if (str.includes('afternoon') || str.includes('dopahar')) return 780; // 1:00 PM
  if (str.includes('evening') || str.includes('sandhya') || str.includes('sanjh')) return 1140; // 7:00 PM
  if (str.includes('night') || str.includes('ratri')) return 1260; // 9:00 PM

  return 9999;
};

export const formatDayBadgeLabel = (dayStr, timelineInfo = {}) => {
  if (!dayStr) return 'Daily';
  const tag = String(dayStr).trim();
  const lower = tag.toLowerCase();

  if (lower.includes('aagman')) {
    return timelineInfo?.aagmanDateFormatted || tag;
  }

  if (lower.includes('visarjan')) {
    return timelineInfo?.visarjanDateFormatted || tag;
  }

  if (lower.includes('daily')) {
    return 'Daily';
  }

  return tag;
};

export const sortScheduleEvents = (eventsList = []) => {
  if (!Array.isArray(eventsList)) return [];

  const safeList = eventsList.filter(item => item && typeof item === 'object');

  const getDayOrderKey = (dayStr) => {
    if (!dayStr) return 999;
    const tag = String(dayStr).trim().toLowerCase();
    
    if (tag.includes('aagman')) return 0;
    if (tag.includes('daily')) return 1;

    const match = tag.match(/day\s*(\d+)/i);
    if (match && match[1]) {
      return 1 + parseInt(match[1], 10);
    }

    if (tag.includes('visarjan')) return 200;

    return 999;
  };

  return safeList.sort((a, b) => {
    const orderA = getDayOrderKey(a?.day);
    const orderB = getDayOrderKey(b?.day);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Sort chronologically by Time (e.g. 7 AM -> 8:30 AM -> 7 PM -> 8:30 PM -> 10 PM)
    const timeA = parseTimeToMinutes(a?.time);
    const timeB = parseTimeToMinutes(b?.time);

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return ((a?.id || 0) - (b?.id || 0));
  });
};

export const getFestivalScheduleVisibility = (siteData = {}) => {
  const safeData = siteData || {};
  const timelineInfo = calculateFullFestivalTimeline(safeData);
  
  const aagmanStr = safeData?.aagmanDate || '2026-09-12';
  const startStr = safeData?.festivalStartDate || '2026-09-14';

  let aagmanD = new Date(aagmanStr);
  if (isNaN(aagmanD.getTime())) aagmanD = new Date('2026-09-12');
  aagmanD.setHours(0, 0, 0, 0);

  let startD = new Date(startStr);
  if (isNaN(startD.getTime())) startD = new Date('2026-09-14');
  startD.setHours(0, 0, 0, 0);

  let visarjanD = new Date(startD);
  visarjanD.setDate(startD.getDate() + 10);
  visarjanD.setHours(23, 59, 59, 999);

  let today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if simulatedDay is set in admin
  const simDay = safeData.simulatedDay;
  if (simDay && simDay !== 'auto') {
    if (simDay === 'aagman') {
      today = new Date(aagmanD);
    } else if (simDay === 'visarjan') {
      today = new Date(visarjanD);
      today.setHours(0, 0, 0, 0);
    } else if (simDay.startsWith('day_')) {
      const dayNum = parseInt(simDay.replace('day_', ''), 10) || 1;
      today = new Date(startD);
      today.setDate(startD.getDate() + (dayNum - 1));
      today.setHours(0, 0, 0, 0);
    }
  }

  // Phase 1: Before Aagman Date
  if (today.getTime() < aagmanD.getTime()) {
    return {
      phase: 'BEFORE_AAGMAN',
      isVisible: false,
      showOnlyAagman: false,
      showFullFestival: false,
      isCompleted: false,
      message: `Shri Ganesh Utsav Aagman schedule ${timelineInfo.aagmanDateFormatted} ko active hoga, aur Main Festival Day 1 (${timelineInfo.festivalStartFormatted}) se poora Full Schedule live hoga.`
    };
  }

  // Phase 2: On Aagman Date (or between Aagman Date and Day 1)
  if (today.getTime() < startD.getTime()) {
    return {
      phase: 'AAGMAN_ONLY',
      isVisible: true,
      showOnlyAagman: true,
      showFullFestival: false,
      isCompleted: false,
      message: `Aaj Aagman Day (${timelineInfo.aagmanDateFormatted}) ka schedule live hai! Day 1 se Visarjan tak ka poora schedule ${timelineInfo.festivalStartFormatted} ko live hoga.`
    };
  }

  // Phase 3: Main Festival (Day 1 to Visarjan Day)
  if (today.getTime() <= visarjanD.getTime()) {
    return {
      phase: 'FULL_FESTIVAL',
      isVisible: true,
      showOnlyAagman: false,
      showFullFestival: true,
      isCompleted: false,
      message: `Shri Ganesh Utsav Mahotsav ka poora Full Schedule (${timelineInfo.festivalStartFormatted} se ${timelineInfo.visarjanDateFormatted} tak) live hai!`
    };
  }

  // Phase 4: After Visarjan Day (Festival concluded)
  return {
    phase: 'AFTER_VISARJAN',
    isVisible: false,
    showOnlyAagman: false,
    showFullFestival: false,
    isCompleted: true,
    message: `Shri Ganesh Utsav Mahotsav sampann ho chuka hai. Ganpati Bappa Morya, Pudhchya Varshi Lavkar Ya!`
  };
};

export const isEventMatchingFestivalDay = (eventDayStr, targetDayTag, targetDateStr) => {
  if (!eventDayStr) return false;
  const evTag = String(eventDayStr).trim().toLowerCase();
  
  // 1. Daily events match Day 1 to Day 10 (Excluded from Aagman Day and Visarjan Day)
  if (evTag.includes('daily')) {
    if (targetDayTag) {
      const targetLower = String(targetDayTag).trim().toLowerCase();
      if (targetLower.includes('aagman') || targetLower.includes('visarjan')) {
        return false;
      }
    }
    return true;
  }

  // 2. Direct date match (e.g. "14-09-2026")
  if (targetDateStr && evTag.includes(targetDateStr)) {
    return true;
  }

  if (!targetDayTag || targetDayTag === 'All') {
    return true;
  }

  const targetLower = String(targetDayTag).trim().toLowerCase();

  // 3. Aagman Day match
  if (targetLower.includes('aagman')) {
    return evTag.includes('aagman');
  }

  // 4. Visarjan Day match
  if (targetLower.includes('visarjan')) {
    return evTag.includes('visarjan');
  }

  // 5. Day 1..10 match with strict word boundary (avoids "Day 1" matching "Day 10")
  const targetDayNumMatch = targetLower.match(/day\s*(\d+)/i);
  if (targetDayNumMatch) {
    const dayNum = targetDayNumMatch[1];
    const regex = new RegExp(`\\bday\\s*${dayNum}\\b`, 'i');
    return regex.test(evTag);
  }

  return evTag === targetLower;
};

export const filterMahaAartiConflict = (events = []) => {
  if (!Array.isArray(events)) return [];

  // Check if there is a Maha Aarti event in this day's events
  const hasMahaAarti = events.some(item => {
    if (!item) return false;
    const title = String(item.title || '').toLowerCase();
    const desc = String(item.desc || '').toLowerCase();
    const cat = String(item.category || '').toLowerCase();
    return title.includes('maha aarti') || title.includes('mahaaarti') || title.includes('maha-aarti') ||
           desc.includes('maha aarti') || desc.includes('mahaaarti') ||
           cat.includes('maha aarti') || cat.includes('mahaaarti');
  });

  if (!hasMahaAarti) {
    return events;
  }

  // If Maha Aarti is scheduled, remove the standard Evening Aarti for this day
  return events.filter(item => {
    if (!item) return true;
    const title = String(item.title || '').toLowerCase();
    const isEveningAarti = (title.includes('evening') || title.includes('sandhya') || title.includes('sanjh')) && title.includes('aarti');
    return !isEveningAarti;
  });
};

export const getComputedTodaysEvents = (siteData = {}) => {
  if (!siteData) return [];
  const scheduleList = Array.isArray(siteData.scheduleEvents) ? siteData.scheduleEvents : [];
  if (scheduleList.length === 0) return [];

  const dayInfo = getCurrentFestivalDayInfo(siteData);
  
  if (!dayInfo.isFestivalActive) {
    return [];
  }

  const timelineInfo = calculateFullFestivalTimeline(siteData);
  const isTodayAagman = dayInfo.isAagmanDay || dayInfo.dayTag === 'Aagman Day' || dayInfo.todayFormatted === timelineInfo.aagmanDateFormatted;

  // If today is Aagman Date (even if Sthapana / Festival Start date is the same date), ONLY show Aagman events!
  if (isTodayAagman) {
    const aagmanEvents = scheduleList.filter(item => {
      if (!item) return false;
      const tag = String(item.day || '').trim().toLowerCase();
      const cat = String(item.category || '').trim().toLowerCase();
      return tag.includes('aagman') || cat.includes('aagman');
    });
    return sortScheduleEvents(aagmanEvents);
  }

  const filtered = scheduleList.filter(item => {
    if (!item || !item.day) return false;
    const tag = String(item.day).trim();
    
    if (tag.toLowerCase().includes('daily')) {
      const currentDayLower = String(dayInfo.dayTag || '').toLowerCase();
      if (currentDayLower.includes('aagman') || currentDayLower.includes('visarjan')) {
        return false;
      }
      return true;
    }

    return isEventMatchingFestivalDay(tag, dayInfo.dayTag, dayInfo.dateStr);
  });

  // Exclude Evening Aarti if Maha Aarti is scheduled today
  const withoutMahaAartiConflict = filterMahaAartiConflict(filtered);

  return sortScheduleEvents(withoutMahaAartiConflict);
};

const defaultScheduleEvents = [];

const defaultSiteData = {
  heroHeading: "",
  heroHeadingLines: ["The King of", "Yuva Yuvak Mandal", "", "", ""],
  heroHeadingHighlightLine: "none",
  targetDateStr: "",
  aagmanDate: "",
  festivalStartDate: "",
  heroTagline: "",
  bannerMediaType: "photo",
  bannerImageUrl: "",
  bannerVideoUrl: "",
  bannerTextAlignment: "left",
  bannerVideoSound: "off",
  fullScheduleHeader: "",
  fullScheduleSubText: "",
  videoUrl: "",
  bigScreenVideos: [],
  homeAboutHeader: "ABOUT US",
  aboutText: "Inspired by the spirit of devotion, unity, and culture, Yuva Yuvak Mandal has been organizing the Ganesh Utsav Mahotsav since 1968.\nOur mission is to preserve our rich cultural heritage, pass on the sacred traditions of Ganesh Utsav to the younger generation, and bring youth together through devotion, cultural values, and community unity.",
  yearsCount: "50+",
  volunteersCount: "200+",
  devoteesCount: "50,000+",
  fullAboutHeader: "ABOUT YUVA YUVAK MANDAL",
  fullAboutSubText: "Preserving rich cultural heritage, serving humanity through blood donation & food distribution, and uniting youth in divine devotion since 1968.",
  mandalName: "YUVA YUVAK MANDAL",
  mandalLocation: "Surat, Gujarat",
  mandalLogoUrl: "/mandal-logo.jpg",
  bigScreenHeaderTitle: "FEEL THE DEVOTION - ON THE BIG SCREEN",
  reelsHeaderTitle: "LATEST REELS FROM INSTAGRAM",
  reelsHeaderSubText: "Watch the latest devotional moments & celebration reels from our official Instagram page @yuva_yuvak_mandal\u00A0🚩",
  reelsInstaHandle: "@yuva_yuvak_mandal\u00A0🚩",
  reelsInstaUrl: "https://www.instagram.com/yuva_yuvak_mandal/",
  reviewsBadge: "Devotee Experiences & Reviews",
  reviewsTitle: "DEVOTEE FEEDBACK & BLESSINGS",
  reviewsSub: "Share your divine experience and blessings of Shri Ganesh Utsav Mahotsav!",
  footerMandalTitle: "YUVA YUVAK MANDAL",
  footerMandalTagline: "Shri Ganesh Utsav Mahotsav • Organised with devotion, grandeur and unity since 1968 in Surat, Gujarat.",
  footerAddressHeading: "Pandal Address",
  footerAddressText: "Yuva Yuvak Mandal, Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002",
  footerInstaUrl: "https://www.instagram.com/yuva_yuvak_mandal/",
  footerInstaText: "Join Instagram Community",
  footerMapHeading: "Map Location & Street View",
  footerMapEmbedUrl: "https://maps.google.com/maps?q=21.1874551,72.8251338&t=&z=17&ie=UTF8&iwloc=&output=embed",
  footerGoogleMapsUrl: "https://www.google.com/maps/place/21%C2%B011'14.8%22N+72%C2%B049'30.5%22E/@21.1873731,72.8218984,17z/data=!4m4!3m3!8m2!3d21.1874444!4d72.8251338",
  footerGoogleMapsBtnText: "Open in Google Maps",
  footerCopyrightText: "Yuva Yuvak Mandal. All Rights Reserved",
  mandalAddress: "Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002",
  aboutInstaHandle: "@yuva_yuvak_mandal 🚩",
  aboutInstaUrl: "https://www.instagram.com/yuva_yuvak_mandal/",
  aboutCard1Title: "50+ Years Glorious Legacy",
  aboutCard1Desc: "Founded in 1968 by passionate youth of Sagrampura, Navsari Bazaar, Surat, Yuva Yuvak Mandal has grown into one of the most respected Ganesh Utsav mandals in Gujarat.",
  aboutCard2Title: "Cultural Mission & Vision",
  aboutCard2Desc: "Our mission is to preserve rich Sanatan traditions, promote spiritual harmony, and empower youth through community leadership and divine service.",
  aboutCard3Title: "A Glorious Legacy of Togetherness",
  aboutCard3Desc: "This is more than just a celebration; it is a tradition of unity, devotion, and shared memories that brings our entire community together year after year.",
  volunteers: [],
  galleryItems: [],
  reels: [],
  inquiries: [],
  donations: [],
  contactInfo: {
    address: "",
    phone1: "",
    phone2: "",
    email: "",
    timings: ""
  },
  scheduleEvents: [],
  events: []
};

export const getApiBaseUrl = () => {
  // 1. Explicit production API URL (e.g. from Vercel / Render environment variables)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  // 2. Local development
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // 3. In production: if frontend is served by backend on same domain (port 80/443)
    if (!port || port === '80' || port === '443') {
      return window.location.origin;
    }
    return `${protocol}//${hostname}:5000`;
  }
  return 'http://localhost:5000';
};

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  const apiBase = getApiBaseUrl();
  if (url.startsWith('http://localhost:5000')) {
    return url.replace('http://localhost:5000', apiBase);
  }
  if (url.startsWith('/uploads/')) {
    return `${apiBase}${url}`;
  }
  return url;
};

export const SiteDataProvider = ({ children }) => {
  const [siteData, setSiteData] = useState(() => {
    try {
      const saved = localStorage.getItem('yuva_site_data');
      if (saved) {
        return { ...defaultSiteData, ...JSON.parse(saved) };
      }
    } catch(e) {}
    return defaultSiteData;
  });

  const isIncomingFromServerRef = React.useRef(false);
  const isFirstRender = React.useRef(true);
  const syncChannelRef = React.useRef(null);
  const hasInitialServerSyncRef = React.useRef(false);
  const isExplicitUserEditRef = React.useRef(false);

  // Function to pull latest data from backend (Single Source of Truth)
  const fetchLatestData = async () => {
    try {
      const apiBase = getApiBaseUrl();
      const timestamp = Date.now();
      const [siteDataRes, inquiriesRes] = await Promise.all([
        fetch(`${apiBase}/api/site-data?_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }).then(res => res.json()).catch(() => null),
        fetch(`${apiBase}/api/inquiries?_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }).then(res => res.json()).catch(() => null)
      ]);

      if (siteDataRes && typeof siteDataRes === 'object' && !siteDataRes.error) {
        hasInitialServerSyncRef.current = true;
        setSiteData(prev => {
          const freshData = {
            ...defaultSiteData,
            ...siteDataRes
          };
          if (Array.isArray(inquiriesRes)) {
            freshData.inquiries = inquiriesRes;
          } else if (Array.isArray(siteDataRes.inquiries)) {
            freshData.inquiries = siteDataRes.inquiries;
          }

          // Avoid unnecessary state re-renders if identical
          if (JSON.stringify(prev) === JSON.stringify(freshData)) {
            return prev;
          }

          isIncomingFromServerRef.current = true;
          try {
            localStorage.setItem('yuva_site_data', JSON.stringify(freshData));
          } catch(e) {}
          return freshData;
        });
      }
    } catch (err) {
      console.log('Backend sync note:', err);
    }
  };

  // 1. Broadcast Channel for instant multi-tab sync within same browser
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('ganpati_site_data_sync');
        syncChannelRef.current = channel;
        channel.onmessage = (event) => {
          if (event.data === 'REFETCH' || event.data?.type === 'UPDATE') {
            fetchLatestData();
          }
        };
        return () => {
          channel.close();
        };
      } catch (e) {}
    }
  }, []);

  // 2. Real-Time Cross-Browser Heartbeat (Every 1.5 seconds) + Focus/Visibility Sync
  useEffect(() => {
    fetchLatestData();

    const handleFocus = () => {
      fetchLatestData();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(fetchLatestData, 1500);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  // 3. Save to backend ONLY when local admin/user performs an explicit change and after initial sync
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isIncomingFromServerRef.current) {
      isIncomingFromServerRef.current = false;
      return;
    }
    // CRITICAL: Stale localStorage must NEVER overwrite backend before server data has synced!
    if (!hasInitialServerSyncRef.current && !isExplicitUserEditRef.current) {
      return;
    }
    isExplicitUserEditRef.current = false;

    try {
      localStorage.setItem('yuva_site_data', JSON.stringify(siteData));
    } catch (e) {}

    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/site-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData)
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.siteData && data.siteData.translations) {
          isIncomingFromServerRef.current = true;
          setSiteData(prev => ({
            ...prev,
            translations: data.siteData.translations
          }));
        }
      })
      .catch(err => console.log('Error saving to backend:', err));

    if (syncChannelRef.current) {
      try {
        syncChannelRef.current.postMessage('REFETCH');
      } catch (e) {}
    }
  }, [siteData]);

  const updateHeroBanner = (headingOrObj, targetDateStr, tagline, bannerImageUrl, bannerMediaType, bannerVideoUrl, bannerTextAlignment, bannerVideoSound, headingLines, highlightLine, taglineLines) => {
    isIncomingFromServerRef.current = false;
    if (typeof headingOrObj === 'object' && headingOrObj !== null) {
      setSiteData(prev => ({ ...prev, ...headingOrObj }));
      return;
    }
    setSiteData(prev => {
      const newTagline = tagline !== undefined ? tagline : prev.heroTagline;
      const newTaglineLines = taglineLines !== undefined 
        ? taglineLines 
        : (Array.isArray(prev.heroTaglineLines) ? prev.heroTaglineLines : (newTagline ? newTagline.split('\n') : ['', '']));

      return {
        ...prev,
        heroHeading: headingOrObj !== undefined ? headingOrObj : prev.heroHeading,
        heroHeadingLines: headingLines !== undefined ? headingLines : (prev.heroHeadingLines || []),
        heroHeadingHighlightLine: highlightLine !== undefined ? highlightLine : (prev.heroHeadingHighlightLine || 'none'),
        targetDateStr: targetDateStr !== undefined ? targetDateStr : prev.targetDateStr,
        heroTagline: newTagline,
        heroTaglineLines: newTaglineLines,
        bannerImageUrl: bannerImageUrl !== undefined ? bannerImageUrl : prev.bannerImageUrl,
        bannerMediaType: bannerMediaType || prev.bannerMediaType || 'photo',
        bannerVideoUrl: bannerVideoUrl !== undefined ? bannerVideoUrl : prev.bannerVideoUrl,
        bannerTextAlignment: bannerTextAlignment || prev.bannerTextAlignment || 'left',
        bannerVideoSound: bannerVideoSound || prev.bannerVideoSound || 'off'
      };
    });
  };

  const updateVideoUrl = (url) => {
    isIncomingFromServerRef.current = false;
    setSiteData(prev => {
      const currentList = Array.isArray(prev.bigScreenVideos) && prev.bigScreenVideos.length > 0
        ? prev.bigScreenVideos
        : (url ? [{ id: Date.now(), title: 'Main Video', url }] : []);
      return { ...prev, videoUrl: url, bigScreenVideos: currentList };
    });
  };

  const addBigScreenVideo = (item) => {
    const newItem = { id: Date.now(), title: item.title !== undefined ? item.title : '', url: item.url };
    setSiteData(prev => {
      const currentList = Array.isArray(prev.bigScreenVideos) ? prev.bigScreenVideos : (prev.videoUrl ? [{ id: Date.now() - 1, title: '', url: prev.videoUrl }] : []);
      const updatedList = [...currentList, newItem];
      return {
        ...prev,
        bigScreenVideos: updatedList,
        videoUrl: updatedList[0]?.url || ''
      };
    });
  };

  const deleteBigScreenVideo = (id) => {
    setSiteData(prev => {
      const currentList = Array.isArray(prev.bigScreenVideos) ? prev.bigScreenVideos : [];
      const updatedList = currentList.filter(v => String(v.id) !== String(id) && String(v._id) !== String(id));
      return {
        ...prev,
        bigScreenVideos: updatedList,
        videoUrl: updatedList[0]?.url || ''
      };
    });
  };

  const updateBigScreenVideo = (updatedItem) => {
    if (!updatedItem) return;
    const targetId = String(updatedItem.id !== undefined ? updatedItem.id : (updatedItem._id !== undefined ? updatedItem._id : ''));
    setSiteData(prev => {
      const currentList = Array.isArray(prev.bigScreenVideos) ? prev.bigScreenVideos : [];
      const updatedList = currentList.map(item => {
        const itemId = String(item.id !== undefined ? item.id : (item._id !== undefined ? item._id : ''));
        if (targetId && itemId === targetId) {
          return {
            ...item,
            ...updatedItem,
            title: updatedItem.title !== undefined ? updatedItem.title : item.title
          };
        }
        return item;
      });
      return {
        ...prev,
        bigScreenVideos: updatedList,
        videoUrl: updatedList[0]?.url || ''
      };
    });
  };

  const setBigScreenVideosList = (list) => {
    setSiteData(prev => ({
      ...prev,
      bigScreenVideos: Array.isArray(list) ? list : [],
      videoUrl: list?.[0]?.url || ''
    }));
  };

  const updateAboutText = (text, years, vols, devs) => {
    setSiteData(prev => ({
      ...prev,
      aboutText: text,
      yearsCount: years,
      volunteersCount: vols,
      devoteesCount: devs
    }));
  };

  const updateAboutDetails = (dataObj) => {
    if (!dataObj || typeof dataObj !== 'object') return;
    const cleanData = { ...dataObj };
    if (cleanData.homeAboutHeader !== undefined && !String(cleanData.homeAboutHeader).trim()) {
      delete cleanData.homeAboutHeader;
    }
    if (cleanData.fullAboutHeader !== undefined && !String(cleanData.fullAboutHeader).trim()) {
      delete cleanData.fullAboutHeader;
    }
    setSiteData(prev => ({
      ...prev,
      ...cleanData
    }));
  };

  const updateContactInfo = (infoObj) => {
    if (!infoObj || typeof infoObj !== 'object') return;
    const cleanInfo = { ...infoObj };
    if (cleanInfo.headerTitle !== undefined && !String(cleanInfo.headerTitle).trim()) {
      delete cleanInfo.headerTitle;
    }
    if (cleanInfo.formHeader !== undefined && !String(cleanInfo.formHeader).trim()) {
      delete cleanInfo.formHeader;
    }
    setSiteData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, ...cleanInfo } }));
  };

  const updateAagmanDate = (dateStr) => {
    setSiteData(prev => ({ ...prev, aagmanDate: dateStr || '2026-09-12' }));
  };

  const updateFestivalStartDate = (dateStr) => {
    setSiteData(prev => ({ ...prev, festivalStartDate: dateStr || '2026-09-14' }));
  };

  const addEvent = (title, time, desc) => {
    const newEv = { id: Date.now(), title, time, desc };
    setSiteData(prev => ({ ...prev, events: [newEv, ...(prev.events || [])] }));
  };

  const deleteEvent = (id) => {
    setSiteData(prev => ({ ...prev, events: (prev.events || []).filter(e => e.id !== id) }));
  };

  const addScheduleEvent = (item) => {
    isIncomingFromServerRef.current = false;
    const newItem = { id: Date.now(), ...item };
    setSiteData(prev => {
      const currentList = Array.isArray(prev.scheduleEvents) ? prev.scheduleEvents : defaultScheduleEvents;
      const updatedList = sortScheduleEvents([newItem, ...currentList]);
      return { ...prev, scheduleEvents: updatedList };
    });
  };

  const updateScheduleEvent = (updatedItem) => {
    if (!updatedItem) return;
    const targetId = String(updatedItem.id !== undefined ? updatedItem.id : (updatedItem._id !== undefined ? updatedItem._id : ''));
    
    setSiteData(prev => {
      const currentList = Array.isArray(prev.scheduleEvents) ? prev.scheduleEvents : defaultScheduleEvents;
      let found = false;
      const updatedList = currentList.map(item => {
        const itemId = String(item.id !== undefined ? item.id : (item._id !== undefined ? item._id : ''));
        if (targetId && itemId === targetId) {
          found = true;
          return { ...item, ...updatedItem };
        }
        return item;
      });

      if (!found) {
        const fallbackList = currentList.map(item => {
          if (item.title === updatedItem.title) {
            found = true;
            return { ...item, ...updatedItem };
          }
          return item;
        });
        if (found) {
          return { ...prev, scheduleEvents: sortScheduleEvents(fallbackList) };
        }
      }

      return { ...prev, scheduleEvents: sortScheduleEvents(updatedList) };
    });
  };

  const deleteScheduleEvent = (id) => {
    if (id === undefined || id === null) return;
    setSiteData(prev => {
      const currentList = Array.isArray(prev.scheduleEvents) ? prev.scheduleEvents : defaultScheduleEvents;
      const updatedList = currentList.filter(i => String(i.id) !== String(id) && String(i._id) !== String(id));
      return { ...prev, scheduleEvents: updatedList };
    });
  };

  const updateFullScheduleHeader = (header, subtext) => {
    setSiteData(prev => ({
      ...prev,
      fullScheduleHeader: (header && header.trim()) ? header.trim() : prev.fullScheduleHeader,
      fullScheduleSubText: subtext !== undefined ? subtext : prev.fullScheduleSubText
    }));
  };

  const addReel = (item) => {
    isIncomingFromServerRef.current = false;
    const newItem = { id: Date.now(), ...item };
    setSiteData(prev => ({ ...prev, reels: [newItem, ...(prev.reels || [])] }));
  };

  const updateReel = (id, updatedItem) => {
    if (!updatedItem) return;
    const targetId = String(id !== undefined ? id : (updatedItem.id !== undefined ? updatedItem.id : ''));
    setSiteData(prev => {
      const currentList = Array.isArray(prev.reels) ? prev.reels : [];
      const updatedList = currentList.map(item => {
        const itemId = String(item.id !== undefined ? item.id : (item._id !== undefined ? item._id : ''));
        if (targetId && itemId === targetId) {
          return { ...item, ...updatedItem };
        }
        return item;
      });
      return { ...prev, reels: updatedList };
    });
  };

  const deleteReel = (id) => {
    setSiteData(prev => ({ ...prev, reels: (prev.reels || []).filter(r => String(r.id) !== String(id) && String(r._id) !== String(id)) }));
  };

  const setReelsList = (list) => {
    setSiteData(prev => ({ ...prev, reels: Array.isArray(list) ? list : [] }));
  };

  const addGalleryItem = (title, year, type, url) => {
    isIncomingFromServerRef.current = false;
    const newItem = { id: Date.now(), title, year, type, url };
    setSiteData(prev => ({ ...prev, galleryItems: [newItem, ...(prev.galleryItems || [])] }));
  };

  const deleteGalleryItem = (id) => {
    setSiteData(prev => ({ ...prev, galleryItems: (prev.galleryItems || []).filter(g => g.id !== id && g._id !== id) }));
  };

  const addVolunteer = (volunteer) => {
    const newItem = {
      id: Date.now(),
      name: volunteer.name || '',
      phone: volunteer.phone || '',
      canCollectCash: Boolean(volunteer.canCollectCash),
      canEditSchedule: Boolean(volunteer.canEditSchedule),
      canAddReels: Boolean(volunteer.canAddReels),
      canEditBanner: Boolean(volunteer.canEditBanner),
      date: new Date().toLocaleDateString('en-GB')
    };
    setSiteData(prev => ({ ...prev, volunteers: [newItem, ...(prev.volunteers || [])] }));
  };

  const deleteVolunteer = (id) => {
    setSiteData(prev => ({
      ...prev,
      volunteers: (prev.volunteers || []).filter(v => v.id !== id && v._id !== id)
    }));
  };

  const toggleVolunteerPermission = (id, permissionKey) => {
    setSiteData(prev => ({
      ...prev,
      volunteers: (prev.volunteers || []).map(v => {
        if (v.id === id || v._id === id) {
          if (permissionKey) {
            return { ...v, [permissionKey]: !v[permissionKey] };
          }
          return { ...v, approved: !v.approved };
        }
        return v;
      })
    }));
  };

  const addInquiry = (inquiry) => {
    const now = new Date();
    const formattedDateTime = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const newItem = { id: Date.now(), ...inquiry, date: formattedDateTime };
    setSiteData(prev => ({ ...prev, inquiries: [newItem, ...(prev.inquiries || [])] }));

    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    })
      .then(() => {
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const channel = new BroadcastChannel('ganpati_inquiries_sync');
            channel.postMessage('NEW_INQUIRY');
            channel.close();
          }
          window.dispatchEvent(new CustomEvent('new_inquiry_added'));
        } catch (e) {}
      })
      .catch(err => console.log('Error saving inquiry to backend:', err));
  };

  const deleteInquiry = (id) => {
    setSiteData(prev => ({ ...prev, inquiries: (prev.inquiries || []).filter(i => i.id !== id && i._id !== id) }));

    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/inquiries/${id}`, {
      method: 'DELETE'
    }).catch(err => console.log('Error deleting inquiry from backend:', err));
  };

  const addDonation = (donation) => {
    const newItem = { 
      id: Date.now(), 
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), 
      ...donation 
    };
    setSiteData(prev => ({ ...prev, donations: [newItem, ...(prev.donations || [])] }));
  };

  const deleteDonation = (id) => {
    setSiteData(prev => ({ ...prev, donations: (prev.donations || []).filter(d => d.id !== id && d._id !== id) }));
  };

  const changeAdminPassword = async (currentPassword, newPassword) => {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data && data.success) {
        setSiteData(prev => ({ ...prev, adminPassword: newPassword }));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to update password' };
    } catch (err) {
      return { success: false, message: 'Server connection error: ' + err.message };
    }
  };

  const updateSiteData = (partialObj) => {
    if (!partialObj || typeof partialObj !== 'object') return;
    isIncomingFromServerRef.current = false;
    isExplicitUserEditRef.current = true;
    setSiteData(prev => ({
      ...prev,
      ...partialObj
    }));
  };

  const resetToDefaults = () => {
    setSiteData(defaultSiteData);
    try { localStorage.removeItem('yuva_site_data'); } catch(e){}
  };

  return (
    <SiteDataContext.Provider value={{
      siteData,
      updateSiteData,
      updateHeroBanner,
      updateVideoUrl,
      addBigScreenVideo,
      updateBigScreenVideo,
      deleteBigScreenVideo,
      setBigScreenVideosList,
      updateAboutText,
      updateAboutDetails,
      updateContactInfo,
      updateAagmanDate,
      updateFestivalStartDate,
      addEvent,
      deleteEvent,
      addScheduleEvent,
      updateScheduleEvent,
      deleteScheduleEvent,
      updateFullScheduleHeader,
      addReel,
      updateReel,
      deleteReel,
      setReelsList,
      addGalleryItem,
      deleteGalleryItem,
      addVolunteer,
      deleteVolunteer,
      toggleVolunteerPermission,
      addInquiry,
      deleteInquiry,
      addDonation,
      deleteDonation,
      changeAdminPassword,
      resetToDefaults,
      refetchSiteData: fetchLatestData,
      calculateFullFestivalTimeline,
      getCurrentFestivalDayInfo,
      getComputedTodaysEvents,
      sortScheduleEvents
    }}>
      {children}
    </SiteDataContext.Provider>
  );
};
