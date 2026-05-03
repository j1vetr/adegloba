import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Loader2, User, Lock, CheckCircle, AlertCircle, Eye, EyeOff,
  Satellite, Zap, Headphones, ShieldCheck,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useLanguage, LanguageSelector } from "@/contexts/LanguageContext";
import adeGlobaLogo from "@assets/logo-gu-5770B_1777775485509.png";

export default function Giris() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, isLoading: authLoading } = useUserAuth();

  useEffect(() => {
    document.documentElement.style.background = "#F7F8FA";
    return () => { document.documentElement.style.background = ""; };
  }, []);

  useEffect(() => {
    if (!authLoading && user) setLocation("/panel");
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") setSuccess(t.auth.registerSuccess);
  }, [t.auth.registerSuccess]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
        setTimeout(() => setLocation(data.requiresPasswordReset ? "/sifre-guncelle" : "/panel"), 100);
      } else {
        setError(data.message || t.auth.loginFailed);
      }
    } catch {
      setError(t.auth.connectionError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="min-h-screen bg-[#F7F8FA] relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#FFDD57]/30 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[440px] h-[440px] rounded-full bg-[#FFE9A0]/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-amber-100/40 blur-3xl" />
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
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

      {/* Top bar with language selector */}
      <header className="relative z-50 px-5 pt-4 sm:pt-6 flex items-center justify-between max-w-6xl mx-auto">
        <img src={adeGlobaLogo} alt="AdeGloba Limited" className="h-16 w-auto md:hidden" />
        <div className="hidden md:block w-9" />
        <LanguageSelector variant="light" />
      </header>

      {/* Main grid */}
      <main className="relative z-10 mx-auto max-w-6xl px-5 pt-6 pb-10 md:pt-12 md:pb-16">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: brand storytelling (desktop only) */}
          <section className="hidden md:flex flex-col items-start animate-fade-in">
            <img src={adeGlobaLogo} alt="AdeGloba Limited" className="h-32 lg:h-40 w-auto mb-8" />

            <p className="text-base lg:text-lg text-slate-600 max-w-md leading-relaxed">
              Maritime Starlink ile gemilerinize anında, kararlı ve güvenli internet.
              AdeGloba Limited paneliyle paketinizi seçin, ödeme yapın, denizdeyken bağlanın.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {[
                { icon: Satellite, label: "Starlink Hızı" },
                { icon: Zap, label: "Anında Aktivasyon" },
                { icon: Headphones, label: "7/24 Destek" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/80 backdrop-blur border border-slate-200 text-slate-700 text-sm font-medium shadow-sm"
                >
                  <Icon className="w-4 h-4 text-[#7C5E00]" />
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SSL</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ISO 27001</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> KVKK Uyumlu</span>
            </div>
          </section>

          {/* Right: login form card */}
          <section className="animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.15)] p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t.auth.systemLogin}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.auth.welcomeMessage}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    {t.auth.usernameOrEmail}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      name="username" type="text" value={formData.username} onChange={handleChange} required
                      placeholder={t.auth.enterUsername}
                      className="user-input w-full h-12 pl-10 pr-4 text-sm"
                      data-testid="input-username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    {t.auth.password}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required
                      placeholder={t.auth.enterPassword}
                      className="user-input w-full h-12 pl-10 pr-11 text-sm"
                      data-testid="input-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {success && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> {success}
                  </div>
                )}
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 animate-shake">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
                  </div>
                )}

                <button
                  type="submit" disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-bold text-sm transition active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_8px_20px_-8px_rgba(255,221,87,0.7)]"
                  data-testid="button-login"
                >
                  {isLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Giriş yapılıyor...</>
                    : t.auth.loginButton}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-center text-sm">
                <p className="text-slate-500">
                  Henüz hesabınız yok mu?{" "}
                  <button onClick={() => setLocation("/kayit")} className="text-slate-900 font-semibold hover:underline" data-testid="link-register">
                    {t.auth.registerButton}
                  </button>
                </p>
                <button
                  onClick={() => setLocation("/sifremi-unuttum")}
                  className="text-slate-500 hover:text-slate-900 transition text-sm"
                  data-testid="link-forgot-password"
                >
                  {t.auth.forgotPassword}
                </button>
              </div>

              {/* Mobile trust row */}
              <div className="md:hidden mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /> SSL</span>
                <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /> ISO 27001</span>
                <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /> KVKK</span>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 mt-5">© 2025 AdeGloba Limited</p>
          </section>
        </div>
      </main>
    </div>
  );
}
