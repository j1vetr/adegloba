import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Lock, Shield, CheckCircle2, AlertTriangle, Eye, EyeOff, LogOut, AlertCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import AuthShell from "@/components/AuthShell";

export default function SifreGuncelle() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState({ cur: false, n: false, c: false });
  const { user, isLoading: authLoading } = useUserAuth();
  const [v, setV] = useState({ minLength: false, hasLetter: false, hasNumber: false, passwordsMatch: false });

  useEffect(() => { if (!authLoading && !user) setLocation("/giris"); }, [user, authLoading, setLocation]);
  useEffect(() => {
    const p = formData.newPassword;
    setV({
      minLength: p.length >= 12,
      hasLetter: /[a-zA-Z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      passwordsMatch: p.length > 0 && p === formData.confirmPassword,
    });
  }, [formData.newPassword, formData.confirmPassword]);

  if (authLoading) {
    return <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setSuccess("");
    if (formData.newPassword !== formData.confirmPassword) { setError("Yeni şifreler eşleşmiyor"); setIsLoading(false); return; }
    if (!v.minLength || !v.hasLetter || !v.hasNumber) { setError("Şifre güvenlik gereksinimlerini karşılamıyor"); setIsLoading(false); return; }
    try {
      const res = await fetch("/api/user/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: formData.currentPassword, newPassword: formData.newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message);
        await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
        setTimeout(() => setLocation("/panel"), 1500);
      } else setError(data.message || "Şifre güncellenemedi");
    } catch { setError("Bağlantı hatası. Lütfen tekrar deneyin."); }
    finally { setIsLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleLogout = async () => {
    try { await fetch("/api/user/logout", { method: "POST" }); await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] }); setLocation("/giris"); }
    catch (e) { console.error(e); }
  };

  const PasswordField = ({ name, value, onChange, placeholder, label, shown, toggle, testId }: {
    name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string; label: string; shown: boolean; toggle: () => void; testId: string;
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
        <Lock className="h-3 w-3" /> {label}
      </label>
      <div className="relative">
        <input
          name={name} type={shown ? "text" : "password"} value={value} onChange={onChange} required
          placeholder={placeholder} className="user-input w-full h-12 px-4 pr-11 text-sm" data-testid={testId}
        />
        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  const Vi = ({ ok, text }: { ok: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${ok ? "text-emerald-600" : "text-slate-400"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />}
      {text}
    </div>
  );

  return (
    <AuthShell
      hero={
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/30 flex items-center justify-center">
            <Shield className="h-6 w-6 text-slate-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t.passwordUpdate.title}</h1>
            <p className="text-xs text-slate-800/80">{t.passwordUpdate.subtitle}</p>
          </div>
        </div>
      }
    >
      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 mb-4">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>{t.passwordUpdate.securityNotice}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField name="currentPassword" value={formData.currentPassword} onChange={handleChange}
          placeholder={t.passwordUpdate.currentPasswordPlaceholder} label={t.passwordUpdate.currentPassword}
          shown={show.cur} toggle={() => setShow((s) => ({ ...s, cur: !s.cur }))} testId="input-current-password" />
        <PasswordField name="newPassword" value={formData.newPassword} onChange={handleChange}
          placeholder={t.passwordUpdate.newPasswordPlaceholder} label={t.passwordUpdate.newPassword}
          shown={show.n} toggle={() => setShow((s) => ({ ...s, n: !s.n }))} testId="input-new-password" />
        <PasswordField name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
          placeholder={t.passwordUpdate.confirmPasswordPlaceholder} label={t.passwordUpdate.confirmPassword}
          shown={show.c} toggle={() => setShow((s) => ({ ...s, c: !s.c }))} testId="input-confirm-password" />

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-slate-700 mb-2">{t.passwordUpdate.requirements}</p>
          <Vi ok={v.minLength} text={t.passwordUpdate.minLength} />
          <Vi ok={v.hasLetter} text={t.passwordUpdate.hasLetter} />
          <Vi ok={v.hasNumber} text={t.passwordUpdate.hasNumber} />
          <Vi ok={v.passwordsMatch} text={t.passwordUpdate.passwordsMatch} />
        </div>

        {success && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !v.minLength || !v.hasLetter || !v.hasNumber || !v.passwordsMatch}
          className="w-full h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          data-testid="button-update-password"
        >
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.passwordUpdate.updating}</> : t.passwordUpdate.updateButton}
        </button>

        <button
          type="button" onClick={handleLogout}
          className="w-full h-10 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" /> {t.passwordUpdate.logoutButton}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-5">{t.passwordUpdate.securityCompliance}</p>
    </AuthShell>
  );
}
