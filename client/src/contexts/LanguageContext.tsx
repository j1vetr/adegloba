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
    <div className={`relative inline-flex p-1 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 shadow-lg ${className}`}>
      {/* Sliding background indicator */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg shadow-md transition-transform duration-300 ease-out ${
          language === 'tr' ? 'translate-x-0' : 'translate-x-full'
        }`}
      />
      
      <button
        onClick={() => setLanguage('tr')}
        className={`relative z-10 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 min-w-[60px] justify-center ${
          language === 'tr'
            ? 'text-white shadow-lg scale-105'
            : 'text-slate-300 hover:text-white hover:scale-105'
        }`}
        data-testid="language-tr"
      >
        <span className="text-base">🇹🇷</span>
        <span className="font-bold">TR</span>
      </button>
      
      <button
        onClick={() => setLanguage('en')}
        className={`relative z-10 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 min-w-[60px] justify-center ${
          language === 'en'
            ? 'text-white shadow-lg scale-105'
            : 'text-slate-300 hover:text-white hover:scale-105'
        }`}
        data-testid="language-en"
      >
        <span className="text-base">🇬🇧</span>
        <span className="font-bold">EN</span>
      </button>
    </div>
  );
}