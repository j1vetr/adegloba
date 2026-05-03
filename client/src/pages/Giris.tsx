import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, User, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useLanguage, LanguageSelector } from "@/contexts/LanguageContext";
import adeGlobaLogo from "@assets/adegloba-1_1756252463127.png";

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
    if (!authLoading && user) setLocation("/panel");
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") setSuccess(t.auth.registerSuccess);
  }, []);

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
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <header className="bg-white border-b border-slate-200/70">
        <div className="mx-auto max-w-md px-4 h-14 flex items-center justify-between">
          <img src={adeGlobaLogo} alt="AdeGloba" className="h-7 w-auto" />
          <LanguageSelector />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-1.5">{t.auth.systemLogin}</h1>
            <p className="text-sm text-slate-500">{t.auth.welcomeMessage}</p>
          </div>

          <div className="user-card-elevated p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                  {t.auth.usernameOrEmail}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder={t.auth.enterUsername}
                    className="user-input w-full h-12 pl-10 pr-4 text-sm"
                    data-testid="input-username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                  {t.auth.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder={t.auth.enterPassword}
                    className="user-input w-full h-12 pl-10 pr-11 text-sm"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                  >
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
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm transition active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
                data-testid="button-login"
              >
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Giriş yapılıyor...</> : t.auth.loginButton}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100 space-y-3 text-center text-sm">
              <p className="text-slate-500">
                Henüz hesabınız yok mu?{" "}
                <button onClick={() => setLocation("/kayit")} className="text-slate-900 font-semibold hover:underline" data-testid="link-register">
                  {t.auth.registerButton}
                </button>
              </p>
              <button
                onClick={() => setLocation("/sifremi-unuttum")}
                className="text-slate-500 hover:text-slate-900 transition"
                data-testid="link-forgot-password"
              >
                {t.auth.forgotPassword}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © 2025 AdeGloba Limited
          </p>
        </div>
      </main>
    </div>
  );
}
