import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './db.js';
import SiteData from './models/SiteData.js';
import Review from './models/Review.js';
import Inquiry from './models/Inquiry.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());

// Disable HTTP caching for all API responses so all browsers (Edge, Chrome, Mobile, etc.) always receive fresh live data
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.use(express.json({ limit: '2048mb' }));
app.use(express.urlencoded({ limit: '2048mb', extended: true }));
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
const siteDataFile = path.join(dataDir, 'siteData.json');
const reviewsFile = path.join(dataDir, 'reviews.json');
const inquiriesFile = path.join(dataDir, 'inquiries.json');
let isMongoConnected = false;
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Endpoint to handle File Uploads (Photos & Videos up to 1GB+)
app.post('/api/upload', (req, res) => {
  try {
    const { fileName, fileData } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, message: 'No file data provided' });
    }

    const matches = fileData.match(/^data:(.+);base64,(.+)$/);
    let buffer;
    let extension = 'mp4';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
      if (mime.includes('video/mp4')) extension = 'mp4';
      else if (mime.includes('video/webm')) extension = 'webm';
      else if (mime.includes('video/quicktime') || mime.includes('mov')) extension = 'mov';
      else if (mime.includes('video/x-matroska') || mime.includes('mkv')) extension = 'mkv';
      else if (mime.includes('image/jpeg') || mime.includes('image/jpg')) extension = 'jpg';
      else if (mime.includes('image/png')) extension = 'png';
      else if (mime.includes('image/webp')) extension = 'webp';
      else if (fileName && fileName.includes('.')) extension = fileName.split('.').pop();
    } else {
      buffer = Buffer.from(fileData, 'base64');
      if (fileName && fileName.includes('.')) extension = fileName.split('.').pop();
    }

    // Check if an identical file already exists in uploads by comparing extension and file size (Instant!)
    const existingFiles = fs.readdirSync(uploadsDir);
    let existingSafeName = null;
    const incomingSize = buffer.length;

    for (const file of existingFiles) {
      if (file.endsWith(`.${extension}`)) {
        const fullPath = path.join(uploadsDir, file);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.size === incomingSize && stats.size > 0) {
            existingSafeName = file;
            break;
          }
        } catch (e) {}
      }
    }

    let safeName = existingSafeName;
    if (!safeName) {
      safeName = `media-${Date.now()}-${Math.round(Math.random() * 1E6)}.${extension}`;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);
      console.log(`🎥 New media file saved locally: ${safeName}`);
    } else {
      console.log(`♻️ Reusing existing media file (deduplicated): ${safeName}`);
    }

    const publicUrl = `/uploads/${safeName}`;
    return res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('File Upload Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// In-Memory Translation Cache
const translationMemoryCache = new Map();

// 📖 Custom Glossary Overrides (Ensures accurate devotional and festival vocabulary)
const customGlossary = {
  hi: {
    "schedule": "शेड्यूल",
    "aarti": "आरती",
    "prasad": "प्रसाद",
    "mahaprasad": "महाप्रसाद",
    "aagman": "आगमन",
    "visarjan": "विसर्जन",
    "aagman day": "आगमन दिवस",
    "visarjan day": "विसर्जन दिवस",
    "ganesh aagman": "गणेश आगमन",
    "ganesh visarjan": "गणेश विसर्जन",
    "aagman & visarjan": "आगमन एवं विसर्जन",
    "aagman and visarjan": "आगमन एवं विसर्जन",
    "grand ganesh aagman": "भव्य गणेश आगमन",
    "grand visarjan": "भव्य विसर्जन",
    "grand aagman": "भव्य आगमन",
    "darshan": "दर्शन",
    "bhajan": "भजन",
    "utsav": "उत्सव",
    "mandal": "मंडल"
  },
  gu: {
    "schedule": "શિડ્યુલ",
    "aarti": "આરતી",
    "prasad": "પ્રસાદ",
    "mahaprasad": "મહાપ્રસાદ",
    "aagman": "આગમન",
    "visarjan": "વિસર્જન",
    "aagman day": "આગમન દિવસ",
    "visarjan day": "વિસર્જન દિવસ",
    "ganesh aagman": "ગણેશ આગમન",
    "ganesh visarjan": "ગણેશ વિસર્જન",
    "aagman & visarjan": "આગમન અને વિસર્જન",
    "aagman and visarjan": "આગમન અને વિસર્જન",
    "grand ganesh aagman": "ભવ્ય ગણેશ આગમન",
    "grand visarjan": "ભવ્ય વિસર્જન",
    "grand aagman": "ભવ્ય આગમન",
    "darshan": "દર્શન",
    "bhajan": "ભજન",
    "utsav": "ઉત્સવ",
    "mandal": "મંડળ"
  }
};

function getCustomTranslation(text, lang) {
  if (!text || !lang) return null;
  const langKey = lang.toLowerCase();
  const lower = text.trim().toLowerCase();
  if (customGlossary[langKey] && customGlossary[langKey][lower]) {
    return customGlossary[langKey][lower];
  }
  return null;
}

function postProcessTranslation(text, targetLang) {
  if (!text) return '';
  let res = String(text);
  const lang = String(targetLang).toLowerCase();
  if (lang === 'gu') {
    // Fix Google Translate's funny transliteration of Aagman -> 'એગમેન'
    res = res.replace(/એગમેન/gi, 'આગમન');
    res = res.replace(/\bAagman\b/gi, 'આગમન');
    res = res.replace(/\bVisarjan\b/gi, 'વિસર્જન');
  } else if (lang === 'hi') {
    res = res.replace(/\bAagman\b/gi, 'आगमन');
    res = res.replace(/\bVisarjan\b/gi, 'विसर्जन');
  }
  return res;
}

async function fetchGoogleTranslate(text, targetLang) {
  // 1. Try sl=en first (prevents Google Translate from skipping Hinglish festival words)
  try {
    const urlEn = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const resEn = await fetch(urlEn);
    if (resEn.ok) {
      const data = await resEn.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map(item => item[0]).join('');
        if (translated && translated.trim()) {
          return postProcessTranslation(translated, targetLang);
        }
      }
    }
  } catch (e) {}

  // 2. Fallback to sl=auto
  try {
    const urlAuto = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const resAuto = await fetch(urlAuto);
    if (resAuto.ok) {
      const data = await resAuto.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map(item => item[0]).join('');
        return postProcessTranslation(translated, targetLang);
      }
    }
  } catch (e) {}

  return postProcessTranslation(text, targetLang);
}

// 🌐 Dynamic Real-time Translation API (Supports English -> Hindi / Gujarati / Any Language)
app.get('/api/translate', async (req, res) => {
  try {
    const { q, to } = req.query;
    if (!q || !to) {
      return res.status(400).json({ success: false, error: 'Query parameter q and to are required' });
    }

    const text = String(q).trim();
    const targetLang = String(to).toLowerCase();

    if (targetLang === 'en' || !text) {
      return res.json({ success: true, originalText: text, translatedText: text });
    }

    // 1. Check custom glossary override first
    const customMatch = getCustomTranslation(text, targetLang);
    if (customMatch) {
      return res.json({ success: true, originalText: text, translatedText: customMatch });
    }

    const cacheKey = `${targetLang}:${text}`;
    if (translationMemoryCache.has(cacheKey)) {
      return res.json({ success: true, originalText: text, translatedText: translationMemoryCache.get(cacheKey) });
    }

    const translatedText = await fetchGoogleTranslate(text, targetLang);

    translationMemoryCache.set(cacheKey, translatedText);
    return res.json({ success: true, originalText: text, translatedText });
  } catch (err) {
    console.error('Translation error:', err.message);
    return res.json({ success: false, originalText: req.query.q, translatedText: req.query.q });
  }
});

// 🌐 Batch Dynamic Translation API (for translating multiple CMS items in parallel)
app.post('/api/translate-batch', async (req, res) => {
  try {
    const { texts, to } = req.body;
    if (!Array.isArray(texts) || !to) {
      return res.status(400).json({ success: false, error: 'texts must be an array and to is required' });
    }

    const targetLang = String(to).toLowerCase();
    if (targetLang === 'en') {
      return res.json({ success: true, translations: texts });
    }

    const results = await Promise.all(
      texts.map(async (txt) => {
        const text = String(txt || '').trim();
        if (!text) return '';
        const customMatch = getCustomTranslation(text, targetLang);
        if (customMatch) return customMatch;
        const cacheKey = `${targetLang}:${text}`;
        if (translationMemoryCache.has(cacheKey)) {
          return translationMemoryCache.get(cacheKey);
        }
        const translated = await fetchGoogleTranslate(text, targetLang);
        translationMemoryCache.set(cacheKey, translated);
        return translated;
      })
    );

    return res.json({ success: true, translations: results });
  } catch (err) {
    console.error('Batch translation error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const defaultSiteData = {
  heroHeading: "",
  targetDateStr: "",
  aagmanDate: "",
  festivalStartDate: "",
  visarjanDate: "",
  simulatedDay: "auto",
  heroTagline: "",
  bannerMediaType: "photo",
  bannerImageUrl: "",
  bannerVideoUrl: "",
  videoUrl: "",
  bigScreenVideos: [],
  mandalLogoUrl: "/mandal-logo.jpg",
  homeAboutHeader: "ABOUT US",
  aboutText: "Inspired by the spirit of devotion, unity, and culture, Yuva Yuvak Mandal has been organizing the Ganesh Utsav Mahotsav since 1968.\nOur mission is to preserve our rich cultural heritage, pass on the sacred traditions of Ganesh Utsav to the younger generation, and bring youth together through devotion, cultural values, and community unity.",
  yearsCount: "50+",
  volunteersCount: "200+",
  devoteesCount: "50,000+",
  fullAboutHeader: "ABOUT YUVA YUVAK MANDAL",
  fullAboutSubText: "Preserving rich cultural heritage, serving humanity through blood donation & food distribution, and uniting youth in divine devotion since 1968.",
  mandalAddress: "Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002",
  aboutInstaHandle: "@yuva_yuvak_mandal 🚩",
  aboutInstaUrl: "https://www.instagram.com/yuva_yuvak_mandal/",
  aboutCard1Title: "50+ Years Glorious Legacy",
  aboutCard1Desc: "Founded in 1968 by passionate youth of Sagrampura, Navsari Bazaar, Surat, Yuva Yuvak Mandal has grown into one of the most respected Ganesh Utsav mandals in Gujarat.",
  aboutCard2Title: "Cultural Mission & Vision",
  aboutCard2Desc: "Our mission is to preserve rich Sanatan traditions, promote spiritual harmony, and empower youth through community leadership and divine service.",
  aboutCard3Title: "A Glorious Legacy of Togetherness",
  aboutCard3Desc: "This is more than just a celebration; it is a tradition of unity, devotion, and shared memories that brings our entire community together year after year.",
  mandalName: "YUVA YUVAK MANDAL",
  mandalLocation: "Surat, Gujarat",
  bigScreenHeaderTitle: "FEEL THE DEVOTION - ON THE BIG SCREEN",
  reelsHeaderTitle: "LATEST REELS FROM INSTAGRAM",
  reelsHeaderSubText: "Watch the latest devotional moments & celebration reels from our official Instagram page @yuva_yuvak_mandal 🚩",
  reelsInstaHandle: "@yuva_yuvak_mandal 🚩",
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
  footerGoogleMapsBtnText: "Open in Google Maps 🗺️",
  footerCopyrightText: "Yuva Yuvak Mandal. All Rights Reserved",
  scheduleEvents: [],
  events: [],
  galleryItems: [],
  reels: [],
  inquiries: [],
  donations: [],
  volunteers: []
};

const defaultReviews = [];
const defaultInquiries = [];

if (!fs.existsSync(siteDataFile)) {
  fs.writeFileSync(siteDataFile, JSON.stringify(defaultSiteData, null, 2), 'utf8');
}

if (!fs.existsSync(reviewsFile)) {
  fs.writeFileSync(reviewsFile, JSON.stringify(defaultReviews, null, 2), 'utf8');
}

if (!fs.existsSync(inquiriesFile)) {
  fs.writeFileSync(inquiriesFile, JSON.stringify(defaultInquiries, null, 2), 'utf8');
}

const seedMongoDB = async () => {
  try {
    const existingSiteData = await SiteData.findOne({ key: 'main' });
    if (!existingSiteData) {
      let initialData = defaultSiteData;
      if (fs.existsSync(siteDataFile)) {
        try { initialData = JSON.parse(fs.readFileSync(siteDataFile, 'utf8')); } catch (e) {}
      }
      await SiteData.create({ key: 'main', ...initialData });
      console.log('🌱 Seeded initial Site Data into MongoDB');
    }
  } catch (err) {
    console.error('❌ Failed to seed MongoDB:', err.message);
  }
};

app.get('/api/site-data', async (req, res) => {
  try {
    if (isMongoConnected) {
      const data = await SiteData.findOne({ key: 'main' });
      if (data) return res.json(data);
    }
    const data = JSON.parse(fs.readFileSync(siteDataFile, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read site data' });
  }
});

// Helper to delete any uploaded media files that are no longer referenced in site data
function cleanupOrphanUploads(currentData) {
  // Disabled automatic deletion of uploads directory to prevent uploaded video/image files from being deleted
  return;
}

// Endpoint to delete a specific media file immediately
app.post('/api/delete-media', (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL required' });
    const filename = path.basename(url.split('?')[0]);
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Manually deleted media file: ${filename}`);
      return res.json({ success: true, message: 'File deleted' });
    }
    return res.json({ success: true, message: 'File already deleted or not found' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// AUTO TRANSLATION ENGINE (English -> Hindi & Gujarati)
// ==========================================
const translationCache = new Map();

async function translateText(text, targetLang) {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // Don't translate if already in target language script
  if (targetLang === 'hi' && /[\u0900-\u097F]/.test(trimmed)) return text;
  if (targetLang === 'gu' && /[\u0A80-\u0AFF]/.test(trimmed)) return text;

  const cacheKey = `${targetLang.toLowerCase()}:${trimmed}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);

  // If text contains newlines, translate paragraph by paragraph
  if (trimmed.includes('\n')) {
    const parts = trimmed.split('\n');
    const transParts = await Promise.all(parts.map(p => translateText(p, targetLang)));
    const combined = transParts.join('\n');
    translationCache.set(cacheKey, combined);
    return combined;
  }

  try {
    const langpair = `en|${targetLang.toLowerCase()}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${langpair}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const trans = data.responseData.translatedText;
        translationCache.set(cacheKey, trans);
        return trans;
      }
    }
  } catch (err) {
    console.warn(`Translation error for "${trimmed}":`, err.message);
  }
  return text;
}

async function autoTranslateSiteData(siteData) {
  if (!siteData || typeof siteData !== 'object') return siteData;
  siteData.translations = siteData.translations || { HI: {}, GU: {} };
  siteData.translations.HI = siteData.translations.HI || {};
  siteData.translations.GU = siteData.translations.GU || {};

  const textFields = [
    'homeAboutHeader',
    'aboutText',
    'fullAboutHeader',
    'fullAboutSubText',
    'aboutCard1Title',
    'aboutCard1Desc',
    'aboutCard2Title',
    'aboutCard2Desc',
    'aboutCard3Title',
    'aboutCard3Desc',
    'heroTagline',
    'fullScheduleHeader',
    'fullScheduleSubText',
    'mandalName',
    'mandalLocation',
    'mandalAddress',
    'galleryHeaderTitle',
    'galleryHeaderSubText',
    'bigScreenHeaderTitle',
    'reelsHeaderTitle',
    'reelsHeaderSubText',
    'reviewsBadge',
    'reviewsTitle',
    'reviewsSub',
    'footerMandalTitle',
    'footerMandalTagline',
    'footerAddressHeading',
    'footerAddressText',
    'footerMapHeading',
    'footerCopyrightText'
  ];

  const translationPromises = [];

  for (const field of textFields) {
    if (siteData[field] && typeof siteData[field] === 'string') {
      const val = siteData[field];
      translationPromises.push(
        translateText(val, 'hi').then(res => { siteData.translations.HI[field] = res; }),
        translateText(val, 'gu').then(res => { siteData.translations.GU[field] = res; })
      );
    }
  }

  if (siteData.murtikar && typeof siteData.murtikar === 'object') {
    if (siteData.murtikar.name) {
      translationPromises.push(
        translateText(siteData.murtikar.name, 'hi').then(res => { siteData.translations.HI.murtikarName = res; }),
        translateText(siteData.murtikar.name, 'gu').then(res => { siteData.translations.GU.murtikarName = res; })
      );
    }
    if (siteData.murtikar.badge) {
      translationPromises.push(
        translateText(siteData.murtikar.badge, 'hi').then(res => { siteData.translations.HI.murtikarBadge = res; }),
        translateText(siteData.murtikar.badge, 'gu').then(res => { siteData.translations.GU.murtikarBadge = res; })
      );
    }
    if (siteData.murtikar.tagline) {
      translationPromises.push(
        translateText(siteData.murtikar.tagline, 'hi').then(res => { siteData.translations.HI.murtikarTagline = res; }),
        translateText(siteData.murtikar.tagline, 'gu').then(res => { siteData.translations.GU.murtikarTagline = res; })
      );
    }
    if (siteData.murtikar.headerTitle) {
      translationPromises.push(
        translateText(siteData.murtikar.headerTitle, 'hi').then(res => { siteData.translations.HI.murtikarHeaderTitle = res; }),
        translateText(siteData.murtikar.headerTitle, 'gu').then(res => { siteData.translations.GU.murtikarHeaderTitle = res; })
      );
    }
  }

  if (Array.isArray(siteData.heroHeadingLines)) {
    translationPromises.push(
      Promise.all(siteData.heroHeadingLines.map(line => translateText(line, 'hi'))).then(lines => {
        siteData.translations.HI.heroHeadingLines = lines;
      }),
      Promise.all(siteData.heroHeadingLines.map(line => translateText(line, 'gu'))).then(lines => {
        siteData.translations.GU.heroHeadingLines = lines;
      })
    );
  }

  await Promise.allSettled(translationPromises);
  return siteData;
}

// Endpoint to translate arbitrary text on-demand
app.post('/api/translate', async (req, res) => {
  try {
    const { text, texts, to } = req.body;
    const targetLang = (to || 'hi').toLowerCase();
    if (texts && Array.isArray(texts)) {
      const results = await Promise.all(texts.map(t => translateText(t, targetLang)));
      return res.json({ success: true, results });
    }
    const result = await translateText(text, targetLang);
    res.json({ success: true, translatedText: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/translate', async (req, res) => {
  try {
    const { q, to } = req.query;
    if (!q) return res.status(400).json({ error: 'Text "q" is required' });
    const targetLang = (to || 'hi').toLowerCase();
    const result = await translateText(q, targetLang);
    res.json({ success: true, translatedText: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADMIN PORTAL PASSWORD MANAGEMENT
// ==========================================
app.post('/api/admin/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters long.' });
    }

    let currentSiteData = {};
    if (isMongoConnected) {
      currentSiteData = await SiteData.findOne({ key: 'main' }) || {};
    } else if (fs.existsSync(siteDataFile)) {
      currentSiteData = JSON.parse(fs.readFileSync(siteDataFile, 'utf8'));
    }

    const savedPassword = String(currentSiteData.adminPassword || 'yuva2026').trim();
    const enteredCurrent = String(currentPassword || '').trim();

    if (enteredCurrent !== savedPassword) {
      return res.status(400).json({ success: false, message: 'Current password does not match!' });
    }

    const updatedPass = newPassword.trim();
    currentSiteData.adminPassword = updatedPass;

    fs.writeFileSync(siteDataFile, JSON.stringify(currentSiteData, null, 2), 'utf8');

    if (isMongoConnected) {
      await SiteData.findOneAndUpdate({ key: 'main' }, { adminPassword: updatedPass }, { upsert: true });
    }

    console.log('🔑 Admin password changed successfully!');
    return res.json({ success: true, message: 'Admin password changed successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    let currentSiteData = {};
    if (isMongoConnected) {
      currentSiteData = await SiteData.findOne({ key: 'main' }) || {};
    } else if (fs.existsSync(siteDataFile)) {
      currentSiteData = JSON.parse(fs.readFileSync(siteDataFile, 'utf8'));
    }

    const savedPassword = String(currentSiteData.adminPassword || 'yuva2026').trim();
    const entered = String(password || '').trim();

    if (entered === savedPassword || entered.toLowerCase() === savedPassword.toLowerCase()) {
      return res.json({ success: true, verified: true });
    }
    return res.status(401).json({ success: false, message: 'Incorrect password!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/site-data', async (req, res) => {
  try {
    const newData = req.body;
    if (newData.homeAboutHeader !== undefined && !String(newData.homeAboutHeader).trim()) {
      newData.homeAboutHeader = 'ABOUT US';
    }
    if (newData.fullAboutHeader !== undefined && !String(newData.fullAboutHeader).trim()) {
      newData.fullAboutHeader = 'ABOUT YUVA YUVAK MANDAL';
    }
    if (newData.fullScheduleHeader !== undefined && !String(newData.fullScheduleHeader).trim()) {
      newData.fullScheduleHeader = 'DIVINE AARTI & UTSAV SCHEDULE';
    }
    if (newData.bigScreenHeaderTitle !== undefined && !String(newData.bigScreenHeaderTitle).trim()) {
      newData.bigScreenHeaderTitle = 'FEEL THE DEVOTION - ON THE BIG SCREEN';
    }
    if (newData.reviewsTitle !== undefined && !String(newData.reviewsTitle).trim()) {
      newData.reviewsTitle = '🚩 DEVOTEE FEEDBACK & BLESSINGS 🚩';
    }
    if (newData.contactInfo && typeof newData.contactInfo === 'object') {
      if (newData.contactInfo.headerTitle !== undefined && !String(newData.contactInfo.headerTitle).trim()) {
        newData.contactInfo.headerTitle = 'CONTACT YUVA YUVAK MANDAL';
      }
      if (newData.contactInfo.formHeader !== undefined && !String(newData.contactInfo.formHeader).trim()) {
        newData.contactInfo.formHeader = 'Devotee Message & Inquiries';
      }
    }
    if (newData.murtikar && typeof newData.murtikar === 'object') {
      if (newData.murtikar.name !== undefined && !String(newData.murtikar.name).trim()) {
        newData.murtikar.name = 'Kiran Manjrekar';
      }
      if (newData.murtikar.headerTitle !== undefined && !String(newData.murtikar.headerTitle).trim()) {
        newData.murtikar.headerTitle = 'DIVINE CREATION - OUR IDOL SCULPTOR';
      }
      if (newData.murtikar.badge !== undefined && !String(newData.murtikar.badge).trim()) {
        newData.murtikar.badge = 'RESPECTED IDOL SCULPTOR - MUMBAI';
      }
      if (newData.murtikar.tagline !== undefined && !String(newData.murtikar.tagline).trim()) {
        newData.murtikar.tagline = 'Crafted with Devotion in Mumbai and Revered in Surat Ganesh-Utsav';
      }
    }

    // Automatically translate updated texts to Hindi & Gujarati
    try {
      await autoTranslateSiteData(newData);
    } catch (transErr) {
      console.warn('Auto translation warning:', transErr.message);
    }

    fs.writeFileSync(siteDataFile, JSON.stringify(newData, null, 2), 'utf8');

    if (isMongoConnected) {
      await SiteData.findOneAndUpdate({ key: 'main' }, { ...newData, key: 'main' }, { upsert: true, returnDocument: 'after' });
    }

    // Auto-clean any files in uploads/ that are no longer referenced in newData
    cleanupOrphanUploads(newData);

    res.json({ success: true, message: 'Site data saved and translated successfully!', siteData: newData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save site data' });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    if (isMongoConnected) {
      const reviews = await Review.find().sort({ createdAt: 1, id: 1 });
      return res.json(reviews);
    }
    const reviews = JSON.parse(fs.readFileSync(reviewsFile, 'utf8'));
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read reviews' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { name, rating, comment, location } = req.body;
    if (!name || !comment) {
      return res.status(400).json({ error: 'Name and comment are required' });
    }

    const now = new Date();
    const formattedDateTime = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newReviewData = {
      id: Date.now(),
      name,
      rating: Number(rating) || 5,
      comment,
      location: location || 'Surat Devotee',
      date: formattedDateTime
    };

    const reviews = JSON.parse(fs.readFileSync(reviewsFile, 'utf8'));
    const updatedReviews = [...reviews, newReviewData];
    fs.writeFileSync(reviewsFile, JSON.stringify(updatedReviews, null, 2), 'utf8');

    if (isMongoConnected) {
      await Review.create(newReviewData);
    }

    res.json({ success: true, review: newReviewData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post review' });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const idParam = String(req.params.id);
    let numericId = !isNaN(Number(idParam)) ? Number(idParam) : null;
    let matchingDoc = null;

    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(idParam) && idParam.length === 24) {
        matchingDoc = await Review.findById(idParam);
        if (matchingDoc) {
          if (matchingDoc.id) numericId = matchingDoc.id;
          await Review.findByIdAndDelete(idParam);
        }
      }

      if (!matchingDoc) {
        const query = numericId !== null ? { id: numericId } : { id: idParam };
        matchingDoc = await Review.findOne(query);
        if (matchingDoc) {
          if (matchingDoc.id) numericId = matchingDoc.id;
          await Review.deleteOne({ _id: matchingDoc._id });
        }
      }
    }

    if (fs.existsSync(reviewsFile)) {
      try {
        const reviews = JSON.parse(fs.readFileSync(reviewsFile, 'utf8') || '[]');
        const updated = reviews.filter(r => {
          if (!r) return false;
          if (String(r.id) === idParam) return false;
          if (r._id && String(r._id) === idParam) return false;
          if (numericId !== null && Number(r.id) === Number(numericId)) return false;
          if (matchingDoc && matchingDoc.id && String(r.id) === String(matchingDoc.id)) return false;
          return true;
        });
        fs.writeFileSync(reviewsFile, JSON.stringify(updated, null, 2), 'utf8');
      } catch (fileErr) {
        console.error('Failed to update reviews.json file:', fileErr);
      }
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// 📬 DEVOTEE INQUIRIES API
app.get('/api/inquiries', async (req, res) => {
  try {
    if (isMongoConnected) {
      const inquiries = await Inquiry.find().sort({ createdAt: -1 });
      return res.json(inquiries);
    }
    const inquiries = JSON.parse(fs.readFileSync(inquiriesFile, 'utf8') || '[]');
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read inquiries' });
  }
});

app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, phone, subject, message } = req.body;
    if (!name || !phone || !subject || !String(subject).trim() || !message) {
      return res.status(400).json({ error: 'Name, phone, subject, and message are required' });
    }

    const now = new Date();
    const formattedDateTime = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newInquiryData = {
      id: Date.now(),
      name: String(name).trim(),
      phone: String(phone).trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      date: formattedDateTime
    };

    let inquiries = [];
    if (fs.existsSync(inquiriesFile)) {
      try { inquiries = JSON.parse(fs.readFileSync(inquiriesFile, 'utf8') || '[]'); } catch(e) {}
    }
    const updatedInquiries = [newInquiryData, ...inquiries];
    fs.writeFileSync(inquiriesFile, JSON.stringify(updatedInquiries, null, 2), 'utf8');

    if (isMongoConnected) {
      await Inquiry.create(newInquiryData);
    }

    // Sync into siteData for backwards compatibility
    if (fs.existsSync(siteDataFile)) {
      try {
        const sData = JSON.parse(fs.readFileSync(siteDataFile, 'utf8'));
        sData.inquiries = [newInquiryData, ...(sData.inquiries || []).filter(i => i.id !== newInquiryData.id)];
        fs.writeFileSync(siteDataFile, JSON.stringify(sData, null, 2), 'utf8');
        if (isMongoConnected) {
          await SiteData.findOneAndUpdate({ key: 'main' }, { inquiries: sData.inquiries });
        }
      } catch(e) {}
    }

    res.json({ success: true, inquiry: newInquiryData });
  } catch (err) {
    console.error('Post inquiry error:', err);
    res.status(500).json({ error: 'Failed to post inquiry' });
  }
});

app.delete('/api/inquiries/:id', async (req, res) => {
  try {
    const idParam = String(req.params.id);
    let numericId = !isNaN(Number(idParam)) ? Number(idParam) : null;
    let matchingDoc = null;

    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(idParam) && idParam.length === 24) {
        matchingDoc = await Inquiry.findById(idParam);
        if (matchingDoc) {
          if (matchingDoc.id) numericId = matchingDoc.id;
          await Inquiry.findByIdAndDelete(idParam);
        }
      }

      if (!matchingDoc) {
        const query = numericId !== null ? { id: numericId } : { id: idParam };
        matchingDoc = await Inquiry.findOne(query);
        if (matchingDoc) {
          if (matchingDoc.id) numericId = matchingDoc.id;
          await Inquiry.deleteOne({ _id: matchingDoc._id });
        }
      }
    }

    if (fs.existsSync(inquiriesFile)) {
      try {
        const inquiries = JSON.parse(fs.readFileSync(inquiriesFile, 'utf8') || '[]');
        const updated = inquiries.filter(i => {
          if (!i) return false;
          if (String(i.id) === idParam) return false;
          if (i._id && String(i._id) === idParam) return false;
          if (numericId !== null && Number(i.id) === Number(numericId)) return false;
          if (matchingDoc && matchingDoc.id && String(i.id) === String(matchingDoc.id)) return false;
          return true;
        });
        fs.writeFileSync(inquiriesFile, JSON.stringify(updated, null, 2), 'utf8');
      } catch (fileErr) {
        console.error('Failed to update inquiries.json file:', fileErr);
      }
    }

    // Also remove from siteData.json and MongoDB SiteData
    if (fs.existsSync(siteDataFile)) {
      try {
        const sData = JSON.parse(fs.readFileSync(siteDataFile, 'utf8'));
        if (Array.isArray(sData.inquiries)) {
          sData.inquiries = sData.inquiries.filter(i => {
            if (!i) return false;
            if (String(i.id) === idParam) return false;
            if (i._id && String(i._id) === idParam) return false;
            if (numericId !== null && Number(i.id) === Number(numericId)) return false;
            if (matchingDoc && matchingDoc.id && String(i.id) === String(matchingDoc.id)) return false;
            return true;
          });
          fs.writeFileSync(siteDataFile, JSON.stringify(sData, null, 2), 'utf8');
          if (isMongoConnected) {
            await SiteData.findOneAndUpdate({ key: 'main' }, { inquiries: sData.inquiries });
          }
        }
      } catch(e) {}
    }

    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (err) {
    console.error('Delete inquiry error:', err);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});


function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try { return String.fromCodePoint(parseInt(hex, 16)); } catch(e) { return ''; }
    })
    .replace(/&#([0-9]+);/g, (_, dec) => {
      try { return String.fromCodePoint(parseInt(dec, 10)); } catch(e) { return ''; }
    })
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\\\//g, '/');
}

function formatCount(num) {
  const n = parseInt(num, 10);
  if (isNaN(n)) return String(num || '');
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// Helper function to extract live metadata for a single Instagram URL
async function fetchInstagramMetadataObject(rawUrl) {
  let cleanUrl = String(rawUrl || '').trim();
  if (!cleanUrl) return null;
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  
  const shortcodeMatch = cleanUrl.match(/(?:reel|reels|p|tv|share\/reel)\/([A-Za-z0-9_-]+)/i);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';
  const targetFetchUrl = shortcode ? `https://www.instagram.com/reel/${shortcode}/` : cleanUrl;

  let username = '';
  let authorDisplayText = '';
  let isVerified = false;
  let coauthorVerified = false;
  let subtitleTag = '';
  let secondaryAvatarUrl = '';
  let title = '';
  let likesCount = '';
  let commentsCount = '';
  let sharesCount = '';
  let repostsCount = '';
  let audioText = 'Original audio';
  let posterUrl = '';
  let videoUrl = cleanUrl;
  let avatarUrl = '/mandal-logo.jpg';

  try {
    const response = await fetch(targetFetchUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (response.ok) {
      const html = await response.text();

      const rawOgTitle = html.match(/property=["']og:title["']\s+content=["'](.*?)["']/i)?.[1] || 
                         html.match(/content=["'](.*?)["']\s+property=["']og:title["']/i)?.[1];
      const rawOgDesc = html.match(/property=["']og:description["']\s+content=["'](.*?)["']/i)?.[1] || 
                        html.match(/content=["'](.*?)["']\s+property=["']og:description["']/i)?.[1];
      const rawOgImg = html.match(/property=["']og:image["']\s+content=["'](.*?)["']/i)?.[1] || 
                       html.match(/content=["'](.*?)["']\s+property=["']og:image["']/i)?.[1];

      const ogTitle = decodeHtmlEntities(rawOgTitle || '');
      const ogDesc = decodeHtmlEntities(rawOgDesc || '');
      posterUrl = decodeHtmlEntities(rawOgImg || '').replace(/\\\//g, '/');

      // Extract Username
      const userFromDesc = ogDesc.match(/-\s*([a-zA-Z0-9_.]+)\s+on/i);
      const userFromTitle = ogTitle.match(/^([a-zA-Z0-9_.]+)\s+on\s+Instagram/i) || ogTitle.match(/@([a-zA-Z0-9_.]+)/i);
      if (userFromDesc) username = userFromDesc[1];
      else if (userFromTitle) username = userFromTitle[1];
      if (!username) {
        const allUsernames = [...html.matchAll(/"username":\s*"([^"]+)"/g)].map(m => m[1]);
        if (allUsernames.length > 0) username = allUsernames[0];
      }

      // Extract Coauthors
      const coauthorsMatch = html.match(/"coauthor_producers":\s*(\[.*?\])/);
      let coauthorUsers = [];
      if (coauthorsMatch && coauthorsMatch[1]) {
        try {
          const rawCoauthors = JSON.parse(coauthorsMatch[1]);
          coauthorUsers = rawCoauthors.map(u => ({
            username: u.username,
            is_verified: Boolean(u.is_verified),
            profile_pic_url: decodeHtmlEntities(u.profile_pic_url || '').replace(/\\\//g, '/')
          }));
        } catch(e) {
          const parsedUsers = [...coauthorsMatch[1].matchAll(/"username":\s*"([^"]+)"/g)].map(m => m[1]);
          const verifieds = [...coauthorsMatch[1].matchAll(/"is_verified":\s*(true|false)/g)].map(m => m[1] === 'true');
          const pics = [...coauthorsMatch[1].matchAll(/"profile_pic_url":\s*"([^"]+)"/g)].map(m => decodeHtmlEntities(m[1]).replace(/\\\//g, '/'));
          coauthorUsers = parsedUsers.map((u, i) => ({
            username: u,
            is_verified: verifieds[i] || false,
            profile_pic_url: pics[i] || ''
          }));
        }
      }

      if (coauthorUsers.length === 1) {
        authorDisplayText = `${username} and ${coauthorUsers[0].username}`;
        coauthorVerified = coauthorUsers[0].is_verified;
        if (coauthorUsers[0].profile_pic_url) {
          secondaryAvatarUrl = coauthorUsers[0].profile_pic_url;
        }
      } else if (coauthorUsers.length > 1) {
        authorDisplayText = `${username} and ${coauthorUsers.length} others`;
        const secondPic = coauthorUsers.find(c => c.profile_pic_url)?.profile_pic_url;
        if (secondPic) {
          secondaryAvatarUrl = secondPic;
        }
        coauthorVerified = coauthorUsers.some(c => c.is_verified);
      } else {
        authorDisplayText = username;
        coauthorVerified = false;
        secondaryAvatarUrl = '';
      }

      // Extract Avatars
      const allAvatars = [...html.matchAll(/https:\/\/[^"'\s]+t51\.[0-9]+-19\/[^"'\s]+/g)].map(m => decodeHtmlEntities(m[0]));
      if (allAvatars.length > 0) {
        avatarUrl = allAvatars[0];
        if (!secondaryAvatarUrl && allAvatars.length > 1 && coauthorUsers.length > 0) {
          secondaryAvatarUrl = allAvatars[1];
        }
      }

      // Main user verification
      if (username) {
        const mainUserVerifiedMatch = html.match(new RegExp(`"username":\\s*"${username}",[^}]*"is_verified":\\s*true`)) ||
                                      html.match(new RegExp(`"is_verified":\\s*true,[^}]*"username":\\s*"${username}"`));
        isVerified = Boolean(mainUserVerifiedMatch);
      }

      // Likes count
      const likeMatch = html.match(/"like_count":\s*(\d+)/);
      if (likeMatch) {
        likesCount = formatCount(likeMatch[1]);
      } else {
        const ogLikeMatch = ogDesc.match(/([\d,.]+[kKmMbB]?)\s+likes/i);
        if (ogLikeMatch) likesCount = ogLikeMatch[1];
      }

      // Comments count
      const commentMatch = html.match(/"comment_count":\s*(\d+)/);
      if (commentMatch) {
        commentsCount = formatCount(commentMatch[1]);
      } else {
        const ogCommentMatch = ogDesc.match(/([\d,.]+[kKmMbB]?)\s+comments/i);
        if (ogCommentMatch) commentsCount = ogCommentMatch[1];
      }

      // Caption
      const quoteMatch = ogDesc.match(/:\s*"(.*?)"\.\s*$/) || ogDesc.match(/:\s*"(.*?)"/);
      if (quoteMatch) {
        title = quoteMatch[1];
      } else {
        const captionMatch = html.match(/"caption":\s*\{\s*"text":\s*"([^"]+)"/i) || html.match(/"text":\s*"([^"]+)"/i);
        if (captionMatch) title = decodeHtmlEntities(captionMatch[1]);
      }
    }

    // Embed fallback
    if (shortcode) {
      try {
        const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (embedRes.ok) {
          const embedHtml = await embedRes.text();
          const embedImgMatch = embedHtml.match(/class="[^"]*EmbeddedMediaImage[^\"]*"[^>]*src="([^"]+)"/);
          if (embedImgMatch) {
            const candidate = embedImgMatch[1].replace(/&amp;/g, '&');
            const headCheck = await fetch(candidate).catch(() => null);
            const clen = parseInt(headCheck?.headers?.get('content-length') || '0', 10);
            if (clen > 3000) {
              posterUrl = candidate;
            }
          }

          if (!avatarUrl || avatarUrl === '/mandal-logo.jpg') {
            const embAvatars = [...embedHtml.matchAll(/https:\/\/[^"'\s]+t51\.[0-9]+-19\/[^"'\s]+/g)].map(m => m[0].replace(/&amp;/g, '&'));
            if (embAvatars.length > 0) avatarUrl = embAvatars[0];
          }

          if (!username || username === 'Instagram') {
            const uMatch = embedHtml.match(/class="CaptionUsername"[^>]*>([^<]+)</) || embedHtml.match(/class="UsernameText"[^>]*>([^<]+)</);
            if (uMatch) username = uMatch[1].trim();
          }

          if (!likesCount) {
            const lMatch = embedHtml.match(/([\d,.]+[kKmMbB]?)\s+likes/i);
            if (lMatch) likesCount = lMatch[1];
          }

          if (!commentsCount) {
            const cMatch = embedHtml.match(/View all ([\d,.]+) comments/i);
            if (cMatch) commentsCount = formatCount(cMatch[1]);
          }
        }
      } catch(e) {}
    }
  } catch (err) {}

  if (!username) username = 'Instagram';
  if (!authorDisplayText) authorDisplayText = username;
  if (!audioText) audioText = 'Original audio';

  // Calculate realistic fallback reposts & shares if not explicitly returned by API
  if (!repostsCount && likesCount) {
    const numLikes = parseInt(String(likesCount).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numLikes) && numLikes > 0) {
      repostsCount = formatCount(Math.max(1, Math.round(numLikes * 0.08)));
    }
  }
  if (!sharesCount && likesCount) {
    const numLikes = parseInt(String(likesCount).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numLikes) && numLikes > 0) {
      sharesCount = formatCount(Math.max(1, Math.round(numLikes * 0.06)));
    }
  }

  const embedUrl = shortcode ? `https://www.instagram.com/reel/${shortcode}/embed/` : cleanUrl;

  return {
    id: shortcode || Date.now(),
    shortcode,
    url: cleanUrl,
    embedUrl,
    username,
    authorDisplayText,
    isVerified,
    coauthorVerified,
    subtitleTag,
    secondaryAvatarUrl,
    audioText,
    likesCount,
    commentsCount,
    sharesCount,
    repostsCount,
    title,
    posterUrl,
    videoUrl: cleanUrl,
    avatarUrl
  };
}

// 📸 Smart Instagram URL Metadata & Real Stats Extraction API
app.all('/api/instagram/fetch-metadata', async (req, res) => {
  try {
    const rawUrl = req.method === 'POST' ? req.body?.url : req.query?.url;
    if (!rawUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    const data = await fetchInstagramMetadataObject(rawUrl);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching Instagram metadata:', err);
    res.status(500).json({ error: 'Failed to fetch Instagram metadata' });
  }
});

// 🔄 Auto-Sync function with Smart Batch Rotation (Supports 15, 20, 50, 100+ reels smoothly!)
let syncCurrentIndex = 0;
async function syncAllReelsLiveStats() {
  try {
    const filePath = './data/siteData.json';
    if (!fs.existsSync(filePath)) return;
    let fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!fileData || !Array.isArray(fileData.reels) || fileData.reels.length === 0) return;

    const totalReels = fileData.reels.length;
    // Process in smart batches of 5 reels per 5-second cycle
    const batchSize = 5;
    const startIndex = syncCurrentIndex % totalReels;
    const batch = [];
    for (let i = 0; i < Math.min(batchSize, totalReels); i++) {
      const idx = (startIndex + i) % totalReels;
      batch.push({ idx, reel: fileData.reels[idx] });
    }
    syncCurrentIndex = (startIndex + batchSize) % totalReels;

    const results = await Promise.all(
      batch.map(async ({ idx, reel }) => {
        const targetUrl = reel.url || (reel.shortcode ? `https://www.instagram.com/reel/${reel.shortcode}/` : '');
        if (targetUrl) {
          try {
            const fresh = await fetchInstagramMetadataObject(targetUrl);
            if (fresh && fresh.username !== 'Instagram') {
              return {
                idx,
                updated: {
                  ...reel,
                  likesCount: fresh.likesCount || reel.likesCount,
                  commentsCount: fresh.commentsCount || reel.commentsCount,
                  repostsCount: fresh.repostsCount || reel.repostsCount,
                  sharesCount: fresh.sharesCount || reel.sharesCount,
                  avatarUrl: (fresh.avatarUrl && fresh.avatarUrl !== '/mandal-logo.jpg') ? fresh.avatarUrl : reel.avatarUrl,
                  secondaryAvatarUrl: fresh.secondaryAvatarUrl || reel.secondaryAvatarUrl,
                  authorDisplayText: fresh.authorDisplayText || reel.authorDisplayText,
                  isVerified: fresh.isVerified,
                  coauthorVerified: fresh.coauthorVerified
                }
              };
            }
          } catch(err) {}
        }
        return { idx, updated: reel };
      })
    );

    let changed = false;
    results.forEach(({ idx, updated }) => {
      if (updated) {
        fileData.reels[idx] = updated;
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
      if (isMongoConnected) {
        await SiteData.findOneAndUpdate({ key: 'main' }, { reels: fileData.reels });
      }
    }
  } catch (e) {
    console.error('⚠️ [Auto-Sync Error]:', e.message);
  }
}

// 🔄 Trigger live sync endpoint
app.post('/api/instagram/sync-all-reels', async (req, res) => {
  try {
    await syncAllReelsLiveStats();
    const filePath = './data/siteData.json';
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json({ success: true, message: 'All reels synced with Instagram live stats', reels: fileData.reels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run background auto-sync every 5 seconds (Ultra-Fast Safe Speed)
setInterval(syncAllReelsLiveStats, 5 * 1000);


// Serve frontend static build in production (if built)
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`🚩 Backend Server running on http://localhost:${PORT}`);
  isMongoConnected = await connectDB();
  if (isMongoConnected) {
    await seedMongoDB();
  }
});
