import { useEffect } from "react";
import { Link } from "wouter";
import { useUserAuth } from "@/hooks/useUserAuth";
import { LanguageSelector, useLanguage } from "@/contexts/LanguageContext";
import { ShoppingCart, Navigation, ShieldCheck, Zap, Headphones } from "lucide-react";
import adeGlobaLogo from "@assets/logo-gu-5770B_1777775485509.png";

export default function Landing() {
  const { user } = useUserAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (user) window.location.href = "/panel";
  }, [user]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF4C9] via-[#FFFBEA] to-white relative overflow-hidden flex flex-col">

      {/* Decorative wifi arcs top center */}
      <svg
        className="absolute top-6 left-1/2 -translate-x-1/2 opacity-40 pointer-events-none"
        width="180" height="100" viewBox="0 0 180 100" fill="none" aria-hidden="true"
      >
        <path d="M30 80 Q 90 30 150 80" stroke="#FFC83D" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M55 80 Q 90 50 125 80" stroke="#FFC83D" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M78 80 Q 90 68 102 80" stroke="#FFC83D" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
      </svg>

      {/* Decorative ship silhouette right */}
      <svg
        className="absolute top-[28%] -right-10 opacity-[0.18] pointer-events-none hidden sm:block"
        width="280" height="160" viewBox="0 0 280 160" fill="none" aria-hidden="true"
      >
        {/* Sea line */}
        <path d="M0 130 Q 70 120 140 130 T 280 130" stroke="#7C5E00" strokeWidth="1.5" fill="none" />
        {/* Cruise ship */}
        <path d="M40 130 L 50 100 L 230 100 L 245 130 Z" fill="#7C5E00" />
        <rect x="70" y="70" width="150" height="32" fill="#7C5E00" />
        <rect x="90" y="50" width="100" height="22" fill="#7C5E00" />
        <rect x="115" y="30" width="50" height="22" fill="#7C5E00" />
        {/* Windows */}
        {[80, 100, 120, 140, 160, 180, 200].map((x) => (
          <circle key={x} cx={x} cy={115} r="2.5" fill="#FFF4C9" />
        ))}
      </svg>

      {/* Small birds */}
      <svg className="absolute top-[18%] left-[12%] opacity-40 pointer-events-none" width="40" height="18" viewBox="0 0 40 18" fill="none" aria-hidden="true">
        <path d="M2 10 Q 7 4 12 10 Q 17 4 22 10" stroke="#7C5E00" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
      <svg className="absolute top-[14%] right-[18%] opacity-40 pointer-events-none" width="30" height="14" viewBox="0 0 30 14" fill="none" aria-hidden="true">
        <path d="M2 8 Q 7 2 12 8 Q 17 2 22 8" stroke="#7C5E00" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>

      {/* Top bar */}
      <header className="relative z-50 px-5 pt-5">
        <div className="mx-auto max-w-md flex items-center justify-end">
          <LanguageSelector variant="light" />
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pt-6 pb-8">
        <div className="w-full max-w-md text-center animate-fade-in">

          <img
            src={adeGlobaLogo}
            alt="AdeGloba Limited"
            className="h-20 sm:h-24 w-auto mx-auto mb-7 drop-shadow-[0_10px_30px_rgba(124,94,0,0.18)]"
          />

          <h1
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 pt-2 pb-1"
            style={{ lineHeight: 1.3 }}
          >
            {t.landing.heroTitle1}<br />{t.landing.heroTitle2}
          </h1>

          <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-sm mx-auto">
            {t.landing.heroDescription}
          </p>

          <div className="space-y-4 mb-7">
            <Link to="/kayit">
              <a
                className="w-full inline-flex items-center justify-center gap-3 h-14 rounded-2xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-bold text-base transition active:scale-[0.99] shadow-[0_10px_28px_-10px_rgba(255,200,61,0.85)]"
                data-testid="link-buy-package"
              >
                <ShoppingCart className="h-5 w-5" strokeWidth={2.4} />
                {t.landing.buttons.register}
              </a>
            </Link>
            <Link to="/giris">
              <a
                className="w-full inline-flex items-center justify-center gap-3 h-14 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-900 font-bold text-base transition active:scale-[0.99] shadow-sm"
                data-testid="link-login"
              >
                <Navigation className="h-5 w-5" strokeWidth={2.4} />
                {t.landing.buttons.login}
              </a>
            </Link>
          </div>

          {/* Trust card */}
          <div className="bg-white/80 backdrop-blur-sm border border-amber-100 rounded-2xl shadow-sm p-3">
            <div className="grid grid-cols-3 divide-x divide-amber-100">
              {[
                { icon: ShieldCheck, label: t.landing.trustBadges.securePayment },
                { icon: Zap, label: t.landing.trustBadges.instantActivation },
                { icon: Headphones, label: t.landing.trustBadges.globalCoverage },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center justify-center gap-2 px-2 py-1">
                  <div className="w-9 h-9 rounded-full bg-[#FFF4C9] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#7C5E00]" strokeWidth={2.2} />
                  </div>
                  <span className="text-xs text-slate-700 font-medium leading-tight whitespace-pre-line text-left">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom wave */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full pointer-events-none"
        viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"
      >
        <path d="M0 40 Q 360 0 720 40 T 1440 40 L 1440 80 L 0 80 Z" fill="#FFE9A0" opacity="0.5" />
        <path d="M0 55 Q 360 25 720 55 T 1440 55 L 1440 80 L 0 80 Z" fill="#FFDD57" opacity="0.4" />
      </svg>

      <footer className="relative z-10 px-5 pb-5 text-center text-[11px] text-slate-500">
        © 2026 AdeGloba Limited
      </footer>
    </div>
  );
}
