import React, { createContext, useState, useEffect, useMemo } from 'react';
import i18n from '../i18n/index.js';
import { translations } from '../i18n/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('yuva_lang');
      if (saved && ['EN', 'HI', 'GU'].includes(saved.toUpperCase())) {
        return saved.toUpperCase();
      }
    } catch (e) {}
    return 'EN';
  });

  useEffect(() => {
    try {
      const upper = String(lang || 'EN').toUpperCase();
      const lower = upper.toLowerCase();
      localStorage.setItem('yuva_lang', upper);
      document.documentElement.setAttribute('lang', lower === 'gu' ? 'gu' : lower === 'hi' ? 'hi' : 'en');
      document.documentElement.setAttribute('data-lang', upper);
      if (i18n.language !== lower) {
        i18n.changeLanguage(lower);
      }
    } catch (e) {}
  }, [lang]);

  const changeLanguage = (newLang) => {
    if (!newLang) return;
    const upper = String(newLang).toUpperCase();
    setLang(upper);
    const lower = upper.toLowerCase();
    i18n.changeLanguage(lower);
  };

  // Dual-capability `t`: supports both function calls `t('key')` and property lookups `t.key`
  const t = useMemo(() => {
    const activeDict = translations[lang] || translations.EN;
    
    const translateFn = (key, defaultVal) => {
      if (!key) return defaultVal || '';
      if (activeDict[key] !== undefined) return activeDict[key];
      const i18nVal = i18n.t(key, { defaultValue: defaultVal });
      if (i18nVal && i18nVal !== key) return i18nVal;
      return defaultVal || activeDict[key] || translations.EN[key] || key;
    };

    return new Proxy(translateFn, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop === 'string') {
          if (activeDict[prop] !== undefined) return activeDict[prop];
          if (translations.EN[prop] !== undefined) return translations.EN[prop];
          const i18nVal = i18n.t(prop);
          if (i18nVal && i18nVal !== prop) return i18nVal;
        }
        return undefined;
      }
    });
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ 
      lang, 
      currentLang: lang, 
      setLang, 
      changeLanguage, 
      t,
      i18n 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
