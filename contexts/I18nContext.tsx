import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, Translations, defaultLanguage, languageNames } from '@/lib/i18n';

const I18N_STORAGE_KEY = '@app_language';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
  languageNames: typeof languageNames;
  availableLanguages: Language[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(I18N_STORAGE_KEY);
        if (savedLanguage && savedLanguage in translations) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(I18N_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }, []);

  const t = translations[language];
  const availableLanguages = Object.keys(translations) as Language[];

  // Don't render until language is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languageNames,
        availableLanguages,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Helper function for interpolation
export function interpolate(text: string, params: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() ?? match;
  });
}
