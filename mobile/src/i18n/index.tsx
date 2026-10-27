import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from './en';
import { am } from './am';

type Language = 'en' | 'am';
type Translations = typeof en;

interface I18nContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => Promise<void>;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  t: en,
  setLanguage: async () => {}
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem('@injibara_app_lang').then((saved) => {
      if (saved === 'am' || saved === 'en') {
        setLangState(saved);
      }
    });
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLangState(newLang);
    await AsyncStorage.setItem('@injibara_app_lang', newLang);
  };

  const t = language === 'am' ? (am as Translations) : en;

  return (
    <I18nContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
