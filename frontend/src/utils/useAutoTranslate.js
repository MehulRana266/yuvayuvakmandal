import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { getApiBaseUrl } from '../context/SiteDataContext';

const memoryCache = new Map();
const CACHE_PREFIX = 'trans_v4_';

// 🚩 Instant Client-Side Glossary for Devotional & Festival Terms
const CLIENT_GLOSSARY = {
  HI: {
    'aagman': 'आगमन',
    'visarjan': 'विसर्जन',
    'schedule': 'शेड्यूल',
    'aarti': 'आरती',
    'prasad': 'प्रसाद',
    'mahaprasad': 'महाप्रसाद',
    'ganesh aagman': 'गणेश आगमन',
    'ganesh visarjan': 'गणेश विसर्जन',
    'aagman day': 'आगमन दिवस',
    'visarjan day': 'विसर्जन दिवस',
    'aagman & visarjan': 'आगमन एवं विसर्जन',
    'aagman and visarjan': 'आगमन एवं विसर्जन',
    'grand ganesh aagman': 'भव्य गणेश आगमन',
    'grand visarjan': 'भव्य विसर्जन',
    'grand aagman': 'भव्य आगमन',
    'devotee message & inquiries': 'भक्त संदेश एवं पूछताछ',
    'devotee message and inquiries': 'भक्त संदेश एवं पूछताछ',
    'send a message to yuva yuvak mandal admin committee for mahaprasad seva or volunteer inquiry.': 'महाप्रसाद सेवा या स्वयंसेवक पूछताछ के लिए युवा युवक मंडल व्यवस्थापक समिति को संदेश भेजें।',
    'follow our official instagram page for daily hd live darshan, aarti videos, and celebration updates.': 'दैनिक लाइव दर्शन, आरती वीडियो और अपडेट के लिए हमारे आधिकारिक इंस्टाग्राम पेज को फॉलो करें।',
    'select inquiry': 'पूछताछ चुनें',
    'general inquiry': 'सामान्य पूछताछ',
    'mahaprasad seva': 'महाप्रसाद सेवा',
    'volunteer registration': 'स्वयंसेवक पंजीकरण',
    'pandal visit inquiry': 'पंडाल दर्शन पूछताछ',
    'pandal address': 'पंडाल का पता',
    'map location & street view': 'नक्शा एवं स्ट्रीट व्यू',
    'map location and street view': 'नक्शा एवं स्ट्रीट व्यू',
    'map location': 'नक्शा एवं स्थान',
    'open in google maps': 'गूगल मैप्स में देखें',
    'join instagram community': 'इंस्टाग्राम से जुड़ें',
    'yuva yuvak': 'युवा युवक',
    'yuva yuvak mandal': 'युवा युवक मंडल',
    'yuva yuvak mandal 🚩': 'युवा युवक मंडल',
    'ram nivas society, behind rajeshree hall, navsari bazaar, sagrampura, surat, gujarat - 395002': 'राम निवास सोसायटी, राजश्री हॉल के पीछे, नवसारी बाजार, संग्रामपुरा, सूरत, गुजरात - 395002',
    'yuva yuvak mandal, ram nivas society, behind rajeshree hall, navsari bazaar, sagrampura, surat, gujarat - 395002': 'युवा युवक मंडल, राम निवास सोसायटी, राजश्री हॉल के पीछे, नवसारी बाजार, संग्रामपुरा, सूरत, गुजरात - 395002',
    'respected idol sculptor • mumbai': 'सम्मानित मूर्तिकार - मुंबई',
    'respected idol sculptor - mumbai': 'सम्मानित मूर्तिकार - मुंबई',
    'crafted with devotion in mumbai • revered in surat ganesh-utsav': 'मुंबई में भक्तिभाव से निर्मित और सूरत गणेश-उत्सव में आदरणीय',
    'crafted with devotion in mumbai and revered in surat ganesh-utsav': 'मुंबई में भक्तिभाव से निर्मित और सूरत गणेश-उत्सव में आदरणीय',
    'crafted with devotion in mumbai, revered in surat ganesh-utsav': 'मुंबई में भक्तिभाव से निर्मित और सूरत गणेश-उत्सव में आदरणीय',
    'divine creation - our idol sculptor': 'दिव्य सृजन - हमारे मूर्तिकार'
  },
  GU: {
    'aagman': 'આગમન',
    'visarjan': 'વિસર્જન',
    'schedule': 'શિડ્યુલ',
    'aarti': 'આરતી',
    'prasad': 'પ્રસાદ',
    'mahaprasad': 'મહાપ્રસાદ',
    'ganesh aagman': 'ગણેશ આગમન',
    'ganesh visarjan': 'ગણેશ વિસર્જન',
    'aagman day': 'આગમન દિવસ',
    'visarjan day': 'વિસર્જન દિવસ',
    'aagman & visarjan': 'આગમન અને વિસર્જન',
    'aagman and visarjan': 'આગમન અને વિસર્જન',
    'grand ganesh aagman': 'ભવ્ય ગણેશ આગમન',
    'grand visarjan': 'ભવ્ય વિસર્જન',
    'grand aagman': 'ભવ્ય આગમન',
    'devotee message & inquiries': 'ભક્ત સંદેશ અને પૂછપરછ',
    'devotee message and inquiries': 'ભક્ત સંદેશ અને પૂછપરછ',
    'send a message to yuva yuvak mandal admin committee for mahaprasad seva or volunteer inquiry.': 'મહાપ્રસાદ સેવા અથવા સ્વયંસેવક પૂછપરછ માટે યુવા યુવક મંડળ વ્યવસ્થાપક સમિતિને સંદેશ મોકલો.',
    'follow our official instagram page for daily hd live darshan, aarti videos, and celebration updates.': 'અમારા સત્તાવાર ઇન્સ્ટાગ્રામ પેજ સાથે જોડાઈને દૈનિક લાઈવ દર્શન અને રીલ્સ જુઓ.',
    'select inquiry': 'પૂછપરછ પસંદ કરો',
    'general inquiry': 'સામાન્ય પૂછપરછ',
    'mahaprasad seva': 'મહાપ્રસાદ સેવા',
    'volunteer registration': 'સ્વયંસેવક રજીસ્ટ્રેશન',
    'pandal visit inquiry': 'મંડપ દર્શન પૂછપરછ',
    'pandal address': 'પંડાલનું સરનામું',
    'map location & street view': 'નકશો અને સ્ટ્રીટ વ્યૂ',
    'map location and street view': 'નકશો અને સ્ટ્રીટ વ્યૂ',
    'map location': 'નકશો અને માર્ગદર્શન',
    'open in google maps': 'ગૂગલ મેપ્સમાં જુઓ',
    'join instagram community': 'ઇન્સ્ટાગ્રામ સાથે જોડાઓ',
    'yuva yuvak': 'યુવા યુવક',
    'yuva yuvak mandal': 'યુવા યુવક મંડળ',
    'yuva yuvak mandal 🚩': 'યુવા યુવક મંડળ',
    'ram nivas society, behind rajeshree hall, navsari bazaar, sagrampura, surat, gujarat - 395002': 'રામ નિવાસ સોસાયટી, રાજશ્રી હોલ પાછળ, નવસારી બજાર, સંગ્રામપુરા, સુરત, ગુજરાત - 395002',
    'yuva yuvak mandal, ram nivas society, behind rajeshree hall, navsari bazaar, sagrampura, surat, gujarat - 395002': 'યુવા યુવક મંડળ, રામ નિવાસ સોસાયટી, રાજશ્રી હોલ પાછળ, નવસારી બજાર, સંગ્રામપુરા, સુરત, ગુજરાત - 395002',
    'respected idol sculptor • mumbai': 'આદરણીય મૂર્તિકાર - મુંબઈ',
    'respected idol sculptor - mumbai': 'આદરણીય મૂર્તિકાર - મુંબઈ',
    'crafted with devotion in mumbai • revered in surat ganesh-utsav': 'મુંબઈમાં ભક્તિ સાથે રચાયેલ અને સુરત ગણેશ-ઉત્સવમાં આદરણીય',
    'crafted with devotion in mumbai and revered in surat ganesh-utsav': 'મુંબઈમાં ભક્તિ સાથે રચાયેલ અને સુરત ગણેશ-ઉત્સવમાં આદરણીય',
    'crafted with devotion in mumbai, revered in surat ganesh-utsav': 'મુંબઈમાં ભક્તિ સાથે રચાયેલ અને સુરત ગણેશ-ઉત્સવમાં આદરણીય',
    'divine creation - our idol sculptor': 'દિવ્ય સર્જન - આપણા મૂર્તિકાર'
  }
};

function getGlossaryOverride(lang, text) {
  if (!text || !lang) return null;
  const l = String(lang).toUpperCase();
  const lower = text.trim().toLowerCase();
  if (CLIENT_GLOSSARY[l] && CLIENT_GLOSSARY[l][lower]) {
    return CLIENT_GLOSSARY[l][lower];
  }
  return null;
}

function postProcessTranslation(translatedText, lang) {
  if (!translatedText) return '';
  let res = String(translatedText);
  const l = String(lang).toUpperCase();
  if (l === 'GU') {
    // Fix Google Translate's funny transliteration of Aagman -> 'એગમેન'
    res = res.replace(/એગમેન/gi, 'આગમન');
    res = res.replace(/\bAagman\b/gi, 'આગમન');
    res = res.replace(/\bVisarjan\b/gi, 'વિસર્જન');
  } else if (l === 'HI') {
    res = res.replace(/\bAagman\b/gi, 'आगमन');
    res = res.replace(/\bVisarjan\b/gi, 'विसर्जन');
  }
  return res;
}

function getCached(lang, text) {
  const glossary = getGlossaryOverride(lang, text);
  if (glossary) return glossary;

  const key = `${lang}:${text.trim()}`;
  if (memoryCache.has(key)) {
    return postProcessTranslation(memoryCache.get(key), lang);
  }
  try {
    const stored = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (stored) {
      const cleaned = postProcessTranslation(stored, lang);
      memoryCache.set(key, cleaned);
      return cleaned;
    }
  } catch (e) {}
  return null;
}

function setCached(lang, text, translation) {
  const cleaned = postProcessTranslation(translation, lang);
  const key = `${lang}:${text.trim()}`;
  memoryCache.set(key, cleaned);
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, cleaned);
  } catch (e) {}
}

/**
 * Hook to dynamically translate any newly added or existing text from Admin CMS into Hindi or Gujarati
 */
export function useAutoTranslate(text, currentLang) {
  const cleanText = (text !== undefined && text !== null) ? String(text).trim() : '';
  const lang = currentLang || 'EN';

  const glossaryMatch = getGlossaryOverride(lang, cleanText);

  const [translated, setTranslated] = useState(() => {
    if (!cleanText || lang === 'EN') return cleanText;
    if (glossaryMatch) return glossaryMatch;
    if (lang === 'HI' && /[\u0900-\u097F]/.test(cleanText)) return cleanText;
    if (lang === 'GU' && /[\u0A80-\u0AFF]/.test(cleanText)) return cleanText;
    return getCached(lang, cleanText) || cleanText;
  });

  useEffect(() => {
    if (!cleanText || lang === 'EN') {
      setTranslated(cleanText);
      return;
    }

    if (glossaryMatch) {
      setTranslated(glossaryMatch);
      return;
    }

    if (lang === 'HI' && /[\u0900-\u097F]/.test(cleanText)) {
      setTranslated(cleanText);
      return;
    }

    if (lang === 'GU' && /[\u0A80-\u0AFF]/.test(cleanText)) {
      setTranslated(cleanText);
      return;
    }

    const cached = getCached(lang, cleanText);
    if (cached) {
      setTranslated(cached);
      return;
    }

    let isMounted = true;
    fetch(`${getApiBaseUrl()}/api/translate?q=${encodeURIComponent(cleanText)}&to=${lang.toLowerCase()}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data && data.translatedText) {
          const processed = postProcessTranslation(data.translatedText, lang);
          setCached(lang, cleanText, processed);
          setTranslated(processed);
        }
      })
      .catch(err => {
        console.warn('Dynamic translate error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanText, lang, glossaryMatch]);

  return translated || cleanText;
}

/**
 * Simple Component to dynamically translate and display any dynamic CMS text in JSX
 * Example: <h3><Translate text={item.title} /></h3>
 */
export function Translate({ text, fallback = '' }) {
  const { currentLang } = useContext(LanguageContext);
  const translated = useAutoTranslate(text, currentLang);
  return React.createElement(React.Fragment, null, translated || fallback || text || '');
}

export function getTranslatedField(siteData, field, currentLang, fallback = '') {
  if (!siteData) return fallback;
  return siteData[field] || fallback || '';
}

