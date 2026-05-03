import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import AuthShell from "@/components/AuthShell";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(t.auth.passwordResetSecurity); setEmail("");
      } else {
        setError(data.message || t.auth.passwordResetError);
      }
    } catch {
      setError(t.auth.connectionError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      hero={
        <>
          <h1 className="text-2xl font-bold mb-1">{t.auth.forgotPasswordTitle}</h1>
          <p className="text-sm text-slate-800/80">{t.auth.forgotPasswordDescription}</p>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Mail className="h-3 w-3" /> {t.auth.emailLabel}
          </label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder={t.auth.emailPlaceholder}
            className="user-input w-full h-12 px-4 text-sm"
            data-testid="input-email"
          />
        </div>

        {success && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <button
          type="submit" disabled={isLoading}
          className="w-full h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm transition active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
          data-testid="button-reset"
        >
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.auth.sendingPasswordReset}</> : t.auth.sendPasswordReset}
        </button>
      </form>

      <button
        onClick={() => setLocation("/giris")}
        className="mt-5 w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition"
        data-testid="button-back-login"
      >
        <ArrowLeft className="h-4 w-4" /> {t.auth.backToLogin}
      </button>
    </AuthShell>
  );
}
