import React, { useState, useEffect } from 'react';
import { pl, en } from '../utils/translations';
import { LanguageContext, type Language } from './LanguageContextDefine';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved || 'pl';
  });

  const translations = language === 'pl' ? pl : en;

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

