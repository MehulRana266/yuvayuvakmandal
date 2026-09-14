import React, { createContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('yuva_lang') || 'EN';
    } catch(e) {
      return 'EN';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yuva_lang', lang);
      const l = String(lang || 'EN').toLowerCase();
      document.documentElement.setAttribute('lang', l === 'gu' ? 'gu' : l === 'hi' ? 'hi' : 'en');
      document.documentElement.setAttribute('data-lang', String(lang || 'EN').toUpperCase());
    } catch(e) {}
  }, [lang]);

  const changeLanguage = (newLang) => {
    setLang(newLang);
  };

  const t = translations[lang] || translations.EN;

  return (
    <LanguageContext.Provider value={{ 
      lang, 
      currentLang: lang, 
      setLang, 
      changeLanguage, 
      t 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
