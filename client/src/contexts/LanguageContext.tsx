import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Translation } from '@/../../shared/i18n';

type Language = 'tr' | 'en' | 'ru';

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
      return (saved === 'tr' || saved === 'en' || saved === 'ru') ? saved : 'tr';
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

// Language selector component - Dropdown version
interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'tr' as Language, flag: '🇹🇷', name: 'Türkçe' },
    { code: 'en' as Language, flag: '🇬🇧', name: 'English' },
    { code: 'ru' as Language, flag: '🇷🇺', name: 'Русский' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language)!;

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 text-white hover:bg-slate-700/30 min-w-[120px] justify-between"
        data-testid="language-dropdown-trigger"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{currentLanguage.flag}</span>
          <span className="font-bold">{currentLanguage.code.toUpperCase()}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown content */}
          <div className="absolute top-full mt-2 right-0 z-50 w-48 py-2 bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-slate-700/50 ${
                  language === lang.code
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-l-2 border-amber-500'
                    : 'text-slate-300 hover:text-white'
                }`}
                data-testid={`language-option-${lang.code}`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{lang.code.toUpperCase()}</span>
                  <span className="text-xs opacity-75">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <svg className="w-4 h-4 ml-auto text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}