import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations, Translation } from '@/../../shared/i18n';

type Language = 'tr' | 'en' | 'ru';

function FlagIcon({ code, className = 'w-5 h-[14px]' }: { code: Language; className?: string }) {
  const common = 'rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] overflow-hidden inline-block';
  if (code === 'tr') {
    return (
      <svg viewBox="0 0 30 20" className={`${className} ${common}`} aria-hidden="true">
        <rect width="30" height="20" fill="#E30A17" />
        <circle cx="11" cy="10" r="4.5" fill="#fff" />
        <circle cx="12.2" cy="10" r="3.6" fill="#E30A17" />
        <polygon fill="#fff" points="15.6,10 18.4,10.9 16.7,8.6 16.7,11.4 18.4,9.1" />
      </svg>
    );
  }
  if (code === 'en') {
    return (
      <svg viewBox="0 0 60 30" className={`${className} ${common}`} aria-hidden="true">
        <clipPath id="uk-c"><rect width="60" height="30" /></clipPath>
        <g clipPath="url(#uk-c)">
          <rect width="60" height="30" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="3" />
          <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
          <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 30 20" className={`${className} ${common}`} aria-hidden="true">
      <rect width="30" height="6.67" y="0" fill="#fff" />
      <rect width="30" height="6.67" y="6.67" fill="#0039A6" />
      <rect width="30" height="6.67" y="13.33" fill="#D52B1E" />
    </svg>
  );
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps { children: ReactNode; }

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('preferred-language');
      return (saved === 'tr' || saved === 'en' || saved === 'ru') ? saved : 'tr';
    } catch { return 'tr'; }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem('preferred-language', lang); } catch {}
  };

  const value: LanguageContextType = { language, setLanguage, t: translations[language] };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

interface LanguageSelectorProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function LanguageSelector({ className = '', variant = 'light' }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'tr' as Language, flag: '🇹🇷', name: 'Türkçe' },
    { code: 'en' as Language, flag: '🇬🇧', name: 'English' },
    { code: 'ru' as Language, flag: '🇷🇺', name: 'Русский' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language)!;
  const isDark = variant === 'dark';

  const triggerCls = isDark
    ? 'bg-slate-800/30 backdrop-blur-sm border-slate-700/50 text-white hover:bg-slate-700/30 hover:border-amber-500/50'
    : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-[#FFDD57]';

  const menuCls = isDark
    ? 'bg-slate-800/95 backdrop-blur-md border-slate-700/50 shadow-2xl'
    : 'bg-white border-slate-200 shadow-lg';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 min-w-[88px] justify-between ${triggerCls}`}
        data-testid="language-dropdown-trigger"
      >
        <div className="flex items-center gap-1.5">
          <FlagIcon code={currentLanguage.code} />
          <span className="font-bold text-xs">{currentLanguage.code.toUpperCase()}</span>
        </div>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute top-full mt-2 right-0 z-50 w-48 py-1.5 border rounded-xl ${menuCls}`}>
            {languages.map((lang) => {
              const selected = language === lang.code;
              const itemCls = isDark
                ? selected
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-l-2 border-amber-500'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                : selected
                  ? 'bg-[#FFF6D6] text-slate-900 border-l-2 border-[#FFDD57] font-semibold'
                  : 'text-slate-700 hover:bg-slate-50';
              return (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ${itemCls}`}
                  data-testid={`language-option-${lang.code}`}
                >
                  <FlagIcon code={lang.code} className="w-6 h-[18px]" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{lang.code.toUpperCase()}</span>
                    <span className="text-xs opacity-75">{lang.name}</span>
                  </div>
                  {selected && (
                    <svg className={`w-4 h-4 ml-auto ${isDark ? 'text-amber-500' : 'text-[#7C5E00]'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
