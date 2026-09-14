import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations.js';

// Retrieve saved language from localStorage (defaults to 'en')
const getSavedLanguage = () => {
  try {
    const saved = localStorage.getItem('yuva_lang');
    if (saved) {
      const code = String(saved).toLowerCase();
      if (['en', 'hi', 'gu'].includes(code)) return code;
    }
  } catch (e) {}
  return 'en';
};

const initialLang = getSavedLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translations.EN },
      hi: { translation: translations.HI },
      gu: { translation: translations.GU }
    },
    lng: initialLang,
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'gu'],
    interpolation: {
      escapeValue: false // React already handles escaping
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
