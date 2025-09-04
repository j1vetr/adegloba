import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Translation } from '@/../../shared/i18n';

type Language = 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Default to Turkish, but check localStorage for saved preference
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('preferred-language');
      return (saved === 'tr' || saved === 'en') ? saved : 'tr';
    } catch {
      return 'tr';
    }
  });

  // Update localStorage when language changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('preferred-language', lang);
    } catch {
      // Silent fail for localStorage issues
    }
  };

  // Get current translation object
  const t = translations[language];

  const value: LanguageContextType = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Language selector component
interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => setLanguage('tr')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
          language === 'tr'
            ? 'bg-amber-500 text-white shadow-lg'
            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
        }`}
        data-testid="language-tr"
      >
        TR
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
          language === 'en'
            ? 'bg-amber-500 text-white shadow-lg'
            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
        }`}
        data-testid="language-en"
      >
        EN
      </button>
    </div>
  );
}