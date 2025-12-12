'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import fr from './locales/fr/common.json';
import ar from './locales/ar/common.json';
import en from './locales/en/common.json';

type Translations = typeof fr;
type Language = 'fr' | 'ar' | 'en';

const translations: Record<Language, Translations> = { fr, ar, en };

interface I18nContextType {
  lang: Language;
  t: (key: string) => string;
  setLang: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('fr');

  useEffect(() => {
    const saved = localStorage.getItem('preferredLanguage') as Language;
    if (saved && translations[saved]) {
      setLangState(saved);
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = saved;
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('preferredLanguage', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[lang];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ lang, t, setLang, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
