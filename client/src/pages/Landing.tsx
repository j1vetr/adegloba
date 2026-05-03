import { useEffect } from "react";
import { Link } from "wouter";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useLanguage, LanguageSelector } from "@/contexts/LanguageContext";
import {
  Satellite, Waves, Globe, Zap, Shield, ArrowRight, Anchor, Navigation,
} from "lucide-react";
import adeGlobaLogo from "@assets/adegloba-1_1756252463127.png";

export default function Landing() {
  const { user } = useUserAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (user) window.location.href = "/panel";
  }, [user]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <header className="bg-white border-b border-slate-200/70">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <img src={adeGlobaLogo} alt="AdeGloba" className="h-8 w-auto" />
          <LanguageSelector />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF6D6] text-[#7C5E00] text-xs font-semibold mb-5">
            <Satellite className="h-3.5 w-3.5" /> AdeGloba Starlink System
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-3">
            {t.landing.heroTitle1}
            <br />
            <span className="text-slate-700">{t.landing.heroTitle2}</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto mb-7">
            {t.landing.heroDescription}
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-7">
            <span className="chip chip-brand"><Satellite className="h-3 w-3" /> {t.landing.features.starlink}</span>
            <span className="chip chip-neutral"><Waves className="h-3 w-3" /> {t.landing.features.maritime}</span>
            <span className="chip chip-brand"><Zap className="h-3 w-3" /> {t.landing.features.instant}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link to="/kayit">
              <a className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold transition active:scale-[0.99] shadow-sm" data-testid="link-register">
                <Anchor className="h-4 w-4" /> {t.landing.buttons.register} <ArrowRight className="h-4 w-4" />
              </a>
            </Link>
            <Link to="/giris">
              <a className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-900 font-semibold transition active:scale-[0.99]" data-testid="link-login">
                <Navigation className="h-4 w-4" /> {t.landing.buttons.login}
              </a>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-slate-400" /> {t.landing.trustBadges.securePayment}</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-slate-400" /> {t.landing.trustBadges.instantActivation}</span>
            <span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-slate-400" /> {t.landing.trustBadges.globalCoverage}</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/70 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5 text-center text-xs text-slate-400">
          © 2025 AdeGloba Limited · Maritime Starlink Çözümleri
        </div>
      </footer>
    </div>
  );
}
