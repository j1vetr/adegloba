import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, Mail, Key, Eye, EyeOff,
  Save, Send, CheckCircle2, AlertTriangle, Loader2,
  CreditCard, Phone, AtSign, Server, ShieldCheck,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type Tab = "genel" | "eposta" | "entegrasyon";

interface SettingRow { id: string; key: string; value: string; category: string; }

// ── Sub-components ───────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-5">
      <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
      <h3 className="text-sm font-semibold text-white">{children}</h3>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-slate-400">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-600 leading-relaxed">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm " +
  "placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors";

const selectCls =
  "w-full h-10 px-3 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm " +
  "focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors [&_option]:bg-slate-800";

function PasswordInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
        className={inputCls + " pr-10"}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-cyan-500" : "bg-slate-700"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
      <span className="text-[13px] text-slate-400">{label}</span>
    </div>
  );
}

function SaveBar({
  onSave, isPending, label = "Kaydet",
}: { onSave: () => void; isPending: boolean; label?: string }) {
  return (
    <div className="flex justify-end pt-6 border-t border-slate-800 mt-8">
      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor…</>
          : <><Save className="h-4 w-4" /> {label}</>}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminSettings({ defaultTab = "genel" as Tab }: { defaultTab?: Tab }) {
  const [tab, setTab]   = useState<Tab>(defaultTab);
  const { toast }       = useToast();
  const qc              = useQueryClient();

  // ── General settings state ──────────────────────────────────────────────
  const [gen, setGen] = useState({
    siteName: "AdeGloba Starlink System",
    baseUrl: "https://adegloba.toov.com.tr",
    whatsappNumber: "+447440225375",
    supportEmail: "",
    supportPhone: "",
    defaultLanguage: "tr",
    timezone: "Europe/Istanbul",
    maintenanceMode: "false",
  });

  // ── Email settings state ────────────────────────────────────────────────
  const [em, setEm] = useState({
    fromEmail: "",
    fromName: "",
    replyTo: "",
    adminEmail: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    isActive: true,
  });
  const [testEmailAddr, setTestEmailAddr] = useState("");
  const [sendingTest,   setSendingTest]   = useState(false);

  // ── Integration settings state ──────────────────────────────────────────
  const [integ, setInteg] = useState({
    paypalEnvironment: "sandbox",
    paypalClientId: "",
    paypalClientSecret: "",
    currency: "USD",
    SHIP_QUOTA_API_KEY: "",
  });

  // ── Fetch general/integration settings ─────────────────────────────────
  const { data: settingsData, isLoading: loadingGen } = useQuery<SettingRow[]>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (!settingsData) return;
    const obj: Record<string, string> = {};
    settingsData.forEach(s => { obj[s.key] = s.value; });
    setGen(prev => ({
      siteName:        obj.siteName        ?? prev.siteName,
      baseUrl:         obj.base_url        ?? prev.baseUrl,
      whatsappNumber:  obj.whatsappNumber  ?? prev.whatsappNumber,
      supportEmail:    obj.supportEmail    ?? prev.supportEmail,
      supportPhone:    obj.supportPhone    ?? prev.supportPhone,
      defaultLanguage: obj.defaultLanguage ?? prev.defaultLanguage,
      timezone:        obj.timezone        ?? prev.timezone,
      maintenanceMode: obj.maintenanceMode ?? prev.maintenanceMode,
    }));
    setInteg(prev => ({
      paypalEnvironment:  obj.paypalEnvironment  ?? prev.paypalEnvironment,
      paypalClientId:     obj.paypalClientId     ?? prev.paypalClientId,
      paypalClientSecret: obj.paypalClientSecret ?? prev.paypalClientSecret,
      currency:           obj.currency           ?? prev.currency,
      SHIP_QUOTA_API_KEY: obj.SHIP_QUOTA_API_KEY ?? prev.SHIP_QUOTA_API_KEY,
    }));
  }, [settingsData]);

  // ── Fetch email settings ────────────────────────────────────────────────
  const { data: emailData, isLoading: loadingEmail } = useQuery({
    queryKey: ["/api/admin/email-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-settings", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (!emailData) return;
    setEm(prev => ({
      fromEmail:  emailData.from_email  ?? prev.fromEmail,
      fromName:   emailData.from_name   ?? prev.fromName,
      replyTo:    emailData.reply_to    ?? prev.replyTo,
      adminEmail: emailData.admin_email ?? prev.adminEmail,
      smtpHost:   emailData.smtp_host   ?? prev.smtpHost,
      smtpPort:   emailData.smtp_port   ?? prev.smtpPort,
      smtpUser:   emailData.smtp_user   ?? prev.smtpUser,
      smtpPass:   "",
      isActive:   emailData.is_active   ?? prev.isActive,
    }));
  }, [emailData]);

  // ── Mutations ───────────────────────────────────────────────────────────
  const saveGenMut = useMutation({
    mutationFn: async () => {
      const fields = [
        { key: "siteName",        value: gen.siteName,        category: "general"     },
        { key: "base_url",        value: gen.baseUrl,         category: "general"     },
        { key: "whatsappNumber",  value: gen.whatsappNumber,  category: "general"     },
        { key: "supportEmail",    value: gen.supportEmail,    category: "general"     },
        { key: "supportPhone",    value: gen.supportPhone,    category: "general"     },
        { key: "defaultLanguage", value: gen.defaultLanguage, category: "general"     },
        { key: "timezone",        value: gen.timezone,        category: "general"     },
        { key: "maintenanceMode", value: gen.maintenanceMode, category: "general"     },
      ];
      await Promise.all(fields.map(f => apiRequest("POST", "/api/admin/settings", f)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Kaydedildi", description: "Genel ayarlar güncellendi." });
    },
    onError: (e: any) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const saveEmailMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(em),
      });
      if (!res.ok) throw new Error("Kaydetme başarısız");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
      toast({ title: "Kaydedildi", description: "E-posta ayarları güncellendi." });
    },
    onError: (e: any) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const saveIntegMut = useMutation({
    mutationFn: async () => {
      const fields = [
        { key: "paypalEnvironment",  value: integ.paypalEnvironment,  category: "payment"     },
        { key: "paypalClientId",     value: integ.paypalClientId,     category: "payment"     },
        { key: "paypalClientSecret", value: integ.paypalClientSecret, category: "payment"     },
        { key: "currency",           value: integ.currency,           category: "payment"     },
        { key: "SHIP_QUOTA_API_KEY", value: integ.SHIP_QUOTA_API_KEY, category: "integration" },
      ];
      await Promise.all(fields.map(f => apiRequest("POST", "/api/admin/settings", f)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Kaydedildi", description: "Entegrasyon ayarları güncellendi." });
    },
    onError: (e: any) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const handleTestEmail = async () => {
    if (!testEmailAddr.trim()) {
      toast({ title: "Hata", description: "Test adresi boş olamaz.", variant: "destructive" });
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/email-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ testEmail: testEmailAddr }),
      });
      if (!res.ok) throw new Error("Test başarısız");
      toast({ title: "Gönderildi", description: `${testEmailAddr} adresine test e-postası gönderildi.` });
      setTestEmailAddr("");
    } catch {
      toast({ title: "Hata", description: "Test e-postası gönderilemedi.", variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  const loading = loadingGen || loadingEmail;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Sistem Ayarları">
      <div className="max-w-3xl pb-12">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Sistem Ayarları</h1>
          <p className="text-slate-500 text-sm mt-0.5">Genel yapılandırma, e-posta ve entegrasyon ayarları</p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-8 w-fit">
          {([
            { id: "genel",       label: "Genel Ayarlar",  icon: Globe        },
            { id: "eposta",      label: "E-posta",        icon: Mail         },
            { id: "entegrasyon", label: "Entegrasyon",    icon: CreditCard   },
          ] as const).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <t.icon className="h-3.5 w-3.5 shrink-0" />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 py-16 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Ayarlar yükleniyor…</span>
          </div>
        ) : (
          <>
            {/* ════ GENEL ════ */}
            {tab === "genel" && (
              <div className="space-y-8">

                <section>
                  <SectionTitle icon={Globe}>Site Kimliği</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Site Adı">
                      <input
                        type="text"
                        value={gen.siteName}
                        onChange={e => setGen(g => ({ ...g, siteName: e.target.value }))}
                        placeholder="AdeGloba Starlink System"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Site URL" hint="E-postalardaki bağlantılar bu adresi kullanır">
                      <input
                        type="url"
                        value={gen.baseUrl}
                        onChange={e => setGen(g => ({ ...g, baseUrl: e.target.value }))}
                        placeholder="https://adegloba.toov.com.tr"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </section>

                <section>
                  <SectionTitle icon={Phone}>İletişim</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="WhatsApp Numarası" hint="Uluslararası format: +447440225375">
                      <input
                        type="text"
                        value={gen.whatsappNumber}
                        onChange={e => setGen(g => ({ ...g, whatsappNumber: e.target.value }))}
                        placeholder="+447440225375"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Destek E-postası">
                      <input
                        type="email"
                        value={gen.supportEmail}
                        onChange={e => setGen(g => ({ ...g, supportEmail: e.target.value }))}
                        placeholder="support@adegloba.space"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Destek Telefonu">
                      <input
                        type="text"
                        value={gen.supportPhone}
                        onChange={e => setGen(g => ({ ...g, supportPhone: e.target.value }))}
                        placeholder="+90 XXX XXX XX XX"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </section>

                <section>
                  <SectionTitle icon={Globe}>Tercihler</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Varsayılan Dil">
                      <select
                        value={gen.defaultLanguage}
                        onChange={e => setGen(g => ({ ...g, defaultLanguage: e.target.value }))}
                        className={selectCls}
                      >
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                      </select>
                    </Field>
                    <Field label="Zaman Dilimi">
                      <select
                        value={gen.timezone}
                        onChange={e => setGen(g => ({ ...g, timezone: e.target.value }))}
                        className={selectCls}
                      >
                        <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="America/Los_Angeles">America/Los_Angeles</option>
                      </select>
                    </Field>
                  </div>
                </section>

                <section>
                  <SectionTitle icon={ShieldCheck}>Sistem</SectionTitle>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Bakım Modu</p>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          Aktif iken kullanıcı girişleri engellenir, yalnızca adminler erişebilir
                        </p>
                      </div>
                      <Toggle
                        checked={gen.maintenanceMode === "true"}
                        onChange={v => setGen(g => ({ ...g, maintenanceMode: v ? "true" : "false" }))}
                        label={gen.maintenanceMode === "true" ? "Aktif" : "Pasif"}
                      />
                    </div>
                    {gen.maintenanceMode === "true" && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <p className="text-[11px] text-amber-200/80">Bakım modu aktif — kullanıcılar siteye erişemiyor</p>
                      </div>
                    )}
                  </div>
                </section>

                <SaveBar onSave={() => saveGenMut.mutate()} isPending={saveGenMut.isPending} />
              </div>
            )}

            {/* ════ E-POSTA ════ */}
            {tab === "eposta" && (
              <div className="space-y-8">

                <section>
                  <SectionTitle icon={AtSign}>Gönderen Bilgileri</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Gönderen E-posta" hint="Sistem e-postalarında görünür">
                      <input
                        type="email"
                        value={em.fromEmail}
                        onChange={e => setEm(v => ({ ...v, fromEmail: e.target.value }))}
                        placeholder="noreply@adegloba.space"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Gönderen İsim">
                      <input
                        type="text"
                        value={em.fromName}
                        onChange={e => setEm(v => ({ ...v, fromName: e.target.value }))}
                        placeholder="AdeGloba Starlink"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Yanıtla Adresi" hint="Kullanıcı yanıtladığında bu adrese gider">
                      <input
                        type="email"
                        value={em.replyTo}
                        onChange={e => setEm(v => ({ ...v, replyTo: e.target.value }))}
                        placeholder="support@adegloba.space"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Admin E-posta" hint="Sipariş bildirimleri bu adrese gelir">
                      <input
                        type="email"
                        value={em.adminEmail}
                        onChange={e => setEm(v => ({ ...v, adminEmail: e.target.value }))}
                        placeholder="admin@adegloba.space"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </section>

                <section>
                  <SectionTitle icon={Server}>SMTP Sunucu</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="SMTP Sunucu">
                      <input
                        type="text"
                        value={em.smtpHost}
                        onChange={e => setEm(v => ({ ...v, smtpHost: e.target.value }))}
                        placeholder="smtp.gmail.com"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Port" hint="TLS: 587 · SSL: 465">
                      <input
                        type="number"
                        value={em.smtpPort || ""}
                        onChange={e => setEm(v => ({ ...v, smtpPort: parseInt(e.target.value) || 587 }))}
                        placeholder="587"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Kullanıcı Adı">
                      <input
                        type="text"
                        value={em.smtpUser}
                        onChange={e => setEm(v => ({ ...v, smtpUser: e.target.value }))}
                        placeholder="you@gmail.com"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Şifre" hint="Boş bırakırsanız mevcut şifre korunur">
                      <PasswordInput
                        value={em.smtpPass}
                        onChange={v => setEm(prev => ({ ...prev, smtpPass: v }))}
                        placeholder="Değiştirmek için girin"
                      />
                    </Field>
                  </div>
                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">E-posta Gönderimi</p>
                        <p className="text-[12px] text-slate-500 mt-0.5">Kapalıyken hiçbir sistem e-postası gönderilmez</p>
                      </div>
                      <Toggle
                        checked={em.isActive}
                        onChange={v => setEm(prev => ({ ...prev, isActive: v }))}
                        label={em.isActive ? "Aktif" : "Pasif"}
                      />
                    </div>
                  </div>
                </section>

                <SaveBar onSave={() => saveEmailMut.mutate()} isPending={saveEmailMut.isPending} label="E-posta Ayarlarını Kaydet" />

                {/* Test kutusu - kaydet butonunun altında, ayrı */}
                <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Send className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-semibold text-white">Test E-postası Gönder</p>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={testEmailAddr}
                      onChange={e => setTestEmailAddr(e.target.value)}
                      placeholder="test@example.com"
                      className={inputCls + " flex-1"}
                      onKeyDown={e => e.key === "Enter" && handleTestEmail()}
                    />
                    <button
                      type="button"
                      onClick={handleTestEmail}
                      disabled={sendingTest}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      {sendingTest
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Send className="h-4 w-4" />}
                      Test Gönder
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2">Ayarları kaydettikten sonra test etmeniz önerilir</p>
                </section>
              </div>
            )}

            {/* ════ ENTEGRASYON ════ */}
            {tab === "entegrasyon" && (
              <div className="space-y-8">

                <section>
                  <SectionTitle icon={CreditCard}>PayPal</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Ortam">
                      <select
                        value={integ.paypalEnvironment}
                        onChange={e => setInteg(v => ({ ...v, paypalEnvironment: e.target.value }))}
                        className={selectCls}
                      >
                        <option value="sandbox">Test (Sandbox)</option>
                        <option value="production">Canlı (Production)</option>
                      </select>
                    </Field>
                    <Field label="Para Birimi">
                      <select
                        value={integ.currency}
                        onChange={e => setInteg(v => ({ ...v, currency: e.target.value }))}
                        className={selectCls}
                      >
                        <option value="USD">USD — Amerikan Doları</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="TRY">TRY — Türk Lirası</option>
                      </select>
                    </Field>
                    <Field label="Client ID">
                      <input
                        type="text"
                        value={integ.paypalClientId}
                        onChange={e => setInteg(v => ({ ...v, paypalClientId: e.target.value }))}
                        placeholder="AXxx…"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Client Secret">
                      <PasswordInput
                        value={integ.paypalClientSecret}
                        onChange={v => setInteg(prev => ({ ...prev, paypalClientSecret: v }))}
                        placeholder="Değiştirmek için girin"
                      />
                    </Field>
                  </div>
                  {integ.paypalEnvironment === "production" && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <p className="text-[11px] text-amber-200/80">Canlı ortam seçili — gerçek ödemeler işlenecek</p>
                    </div>
                  )}
                </section>

                <section>
                  <SectionTitle icon={Key}>API Anahtarları</SectionTitle>
                  <div className="space-y-4">
                    <Field
                      label="Gemi Kota API Anahtarı"
                      hint="Dış sistemler GET /api/external/ship-quotas endpointine erişmek için x-api-key header'ında bu anahtarı gönderir. Boş bırakılırsa endpoint devre dışı kalır."
                    >
                      <PasswordInput
                        value={integ.SHIP_QUOTA_API_KEY}
                        onChange={v => setInteg(prev => ({ ...prev, SHIP_QUOTA_API_KEY: v }))}
                        placeholder="Güçlü bir anahtar oluşturun"
                      />
                    </Field>
                  </div>
                </section>

                <SaveBar onSave={() => saveIntegMut.mutate()} isPending={saveIntegMut.isPending} label="Entegrasyon Ayarlarını Kaydet" />
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
