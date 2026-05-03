import { useEffect } from "react";
import { Link } from "wouter";
import { useUserAuth } from "@/hooks/useUserAuth";
import { LanguageSelector } from "@/contexts/LanguageContext";
import { ArrowRight, Anchor, Navigation, ShieldCheck } from "lucide-react";
import adeGlobaLogo from "@assets/logo-gu-5770B_1777775485509.png";

export default function Landing() {
  const { user } = useUserAuth();

  useEffect(() => {
    if (user) window.location.href = "/panel";
  }, [user]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-[#F7F8FA] relative overflow-hidden flex flex-col">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#FFDD57]/30 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[440px] h-[440px] rounded-full bg-[#FFE9A0]/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-amber-100/40 blur-3xl" />
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-slate-900" />
        </svg>
      </div>

      {/* Top bar */}
      <header className="relative z-50 px-5 pt-5 sm:pt-6">
        <div className="mx-auto max-w-6xl flex items-center justify-end">
          <LanguageSelector variant="light" />
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10 sm:py-16">
        <div className="w-full max-w-xl text-center animate-fade-in">

          <img
            src={adeGlobaLogo}
            alt="AdeGloba Limited"
            className="h-32 sm:h-44 w-auto mx-auto mb-10 drop-shadow-[0_10px_30px_rgba(124,94,0,0.18)]"
          />

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-md mx-auto">
            <Link to="/kayit">
              <a
                className="group inline-flex items-center justify-center gap-2 px-7 h-13 sm:h-12 rounded-2xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-bold text-sm transition active:scale-[0.99] shadow-[0_10px_30px_-10px_rgba(255,221,87,0.85)]"
                data-testid="link-register"
              >
                <Anchor className="h-4 w-4" />
                Kayıt Ol
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Link>
            <Link to="/giris">
              <a
                className="inline-flex items-center justify-center gap-2 px-7 h-13 sm:h-12 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-900 font-semibold text-sm transition active:scale-[0.99] shadow-sm"
                data-testid="link-login"
              >
                <Navigation className="h-4 w-4" />
                Giriş Yap
              </a>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-5 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SSL</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ISO 27001</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> KVKK</span>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-5 pb-5 text-center text-[11px] text-slate-400">
        © 2025 AdeGloba Limited
      </footer>
    </div>
  );
}
