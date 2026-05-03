import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, User, Mail, Lock, Ship as ShipIcon, MapPin, UserPlus,
  Phone, Home, FileText, AlertCircle, CheckCircle2, Search, ChevronDown, X,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Ship } from "@shared/schema";
import AuthShell from "@/components/AuthShell";

export default function Kayit() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    full_name: "", username: "", email: "", password: "",
    phoneCountryCode: "+90", phoneNumber: "", ship_id: "", address: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [shipPickerOpen, setShipPickerOpen] = useState(false);
  const [shipSearch, setShipSearch] = useState("");
  const shipPickerRef = useRef<HTMLDivElement>(null);

  const { user, isLoading: authLoading } = useUserAuth();
  useEffect(() => { if (!authLoading && user) setLocation("/panel"); }, [user, authLoading, setLocation]);

  const { data: ships, isLoading: shipsLoading } = useQuery<Ship[]>({ queryKey: ["/api/ships/active"] });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredShips = useMemo(() => {
    if (!ships) return [];
    const q = shipSearch.trim().toLowerCase();
    if (!q) return ships;
    return ships.filter(s => s.name.toLowerCase().includes(q));
  }, [ships, shipSearch]);

  const selectedShip = ships?.find(s => s.id === formData.ship_id);

  // Close ship picker on outside click
  useEffect(() => {
    if (!shipPickerOpen) return;
    const onClick = (e: MouseEvent) => {
      if (shipPickerRef.current && !shipPickerRef.current.contains(e.target as Node)) {
        setShipPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [shipPickerOpen]);

  if (authLoading) {
    return <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  const passwordValidation = {
    minLength: formData.password.length >= 12,
    hasLetter: /[a-zA-Z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    isValid: formData.password.length >= 12 && /[a-zA-Z]/.test(formData.password) && /[0-9]/.test(formData.password),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError("");
    if (!passwordValidation.isValid) {
      setError("Şifre en az 12 karakter olmalı ve hem harf hem rakam içermelidir");
      setIsLoading(false); return;
    }
    if (!formData.ship_id) {
      setError(t.auth.chooseShip); setIsLoading(false); return;
    }
    try {
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, phone: `${formData.phoneCountryCode}${formData.phoneNumber}` }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
        setTimeout(() => setLocation("/panel"), 100);
      } else {
        setError(data.message || "Kayıt işlemi başarısız");
      }
    } catch {
      setError("Bağlantı hatası oluştu");
    } finally { setIsLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const Vi = ({ ok, text }: { ok: boolean; text: string }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />} {text}
    </span>
  );

  const FieldLabel = ({ icon: Icon, label, required }: { icon: any; label: string; required?: boolean }) => (
    <label className="text-xs font-medium text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-slate-400" /> {label} {required && <span className="text-rose-500">*</span>}
    </label>
  );

  return (
    <AuthShell
      hero={
        <>
          <h1 className="text-2xl font-bold mb-1">{t.auth.systemRegistration}</h1>
          <p className="text-sm text-slate-800/80">{t.auth.joinMessage}</p>
        </>
      }
    >
      <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-1">
        <UserPlus className="h-4 w-4 text-[#7C5E00]" /> {t.auth.createNewAccount}
      </h2>
      <p className="text-xs text-slate-500 mb-5">{t.auth.systemAccess}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <FieldLabel icon={User} label={t.auth.fullName} required />
          <input name="full_name" value={formData.full_name} onChange={handleChange} required placeholder={t.auth.fullName} className="user-input w-full h-12 px-3.5 text-sm" data-testid="input-full-name" />
        </div>

        <div className="space-y-1.5">
          <FieldLabel icon={User} label={t.auth.usernameOnly} required />
          <input name="username" value={formData.username} onChange={handleChange} required placeholder={t.auth.usernameOnly} className="user-input w-full h-12 px-3.5 text-sm" data-testid="input-username" />
        </div>

        <div className="space-y-1.5">
          <FieldLabel icon={Mail} label={t.auth.emailLabel} required />
          <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder={t.auth.emailPlaceholder} className="user-input w-full h-12 px-3.5 text-sm" data-testid="input-email" />
        </div>

        <div className="space-y-1.5">
          <FieldLabel icon={Lock} label={t.auth.password} required />
          <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="En az 12 karakter, harf ve rakam içermeli" className="user-input w-full h-12 px-3.5 text-sm" data-testid="input-password" />
          {formData.password.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Vi ok={passwordValidation.minLength} text="12+ karakter" />
              <Vi ok={passwordValidation.hasLetter} text="Harf" />
              <Vi ok={passwordValidation.hasNumber} text="Rakam" />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <FieldLabel icon={Phone} label={t.auth.phoneNumber} required />
          <div className="flex gap-2">
            <input name="phoneCountryCode" value={formData.phoneCountryCode} onChange={handleChange} placeholder="+90" className="user-input w-[80px] h-12 px-2 text-center text-sm" data-testid="input-country-code" />
            <input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required placeholder={t.auth.phonePlaceholder} className="user-input flex-1 h-12 px-3.5 text-sm" data-testid="input-phone-number" />
          </div>
        </div>

        {/* Searchable ship combobox */}
        <div className="space-y-1.5" ref={shipPickerRef}>
          <FieldLabel icon={ShipIcon} label={t.auth.selectShip} required />
          <button
            type="button"
            onClick={() => setShipPickerOpen(o => !o)}
            className="user-input w-full h-12 px-3.5 text-sm flex items-center justify-between text-left"
            data-testid="button-open-ship-picker"
            aria-haspopup="listbox"
            aria-expanded={shipPickerOpen}
          >
            <span className={selectedShip ? "text-slate-900 truncate" : "text-slate-400"}>
              {selectedShip ? selectedShip.name : (shipsLoading ? t.auth.loadingShips : t.auth.chooseShip)}
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition ${shipPickerOpen ? "rotate-180" : ""}`} />
          </button>

          {shipPickerOpen && (
            <div className="relative">
              <div className="absolute z-30 mt-1 w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      autoFocus
                      type="text"
                      value={shipSearch}
                      onChange={(e) => setShipSearch(e.target.value)}
                      placeholder="Gemi ara..."
                      className="user-input w-full h-10 pl-9 pr-9 text-sm"
                      data-testid="input-ship-search"
                    />
                    {shipSearch && (
                      <button
                        type="button"
                        onClick={() => setShipSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                        aria-label="Temizle"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div role="listbox" className="max-h-64 overflow-y-auto py-1">
                  {shipsLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> {t.auth.loadingShips}
                    </div>
                  ) : filteredShips.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">Sonuç yok</div>
                  ) : (
                    filteredShips.map(ship => (
                      <button
                        key={ship.id}
                        type="button"
                        role="option"
                        aria-selected={ship.id === formData.ship_id}
                        onClick={() => {
                          setFormData(p => ({ ...p, ship_id: ship.id }));
                          setShipPickerOpen(false); setShipSearch("");
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-slate-50 transition ${
                          ship.id === formData.ship_id ? "bg-[#FFF6D6] text-slate-900" : "text-slate-700"
                        }`}
                        data-testid={`option-ship-${ship.id}`}
                      >
                        <ShipIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{ship.name}</span>
                        {ship.id === formData.ship_id && <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <FieldLabel icon={MapPin} label={t.auth.address} />
          <textarea name="address" value={formData.address} onChange={handleChange} required rows={3} placeholder={t.auth.address} className="user-input w-full px-3.5 py-2.5 text-sm resize-none" data-testid="textarea-address" />
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 pt-1">
          <input
            type="checkbox" id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-[#FFDD57] focus:ring-[#FFDD57]"
            data-testid="checkbox-terms"
          />
          <label htmlFor="terms" className="text-sm text-slate-700 leading-relaxed">
            <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
              <DialogTrigger asChild>
                <button type="button" className="text-[#7C5E00] hover:underline inline-flex items-center gap-1 font-semibold" data-testid="button-view-terms">
                  <FileText className="h-3 w-3" /> {t.auth.termsTitle}
                </button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-3xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#7C5E00]" /> {t.auth.termsTitle}
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="text-slate-700 text-sm space-y-3">
                    <h3 className="text-base font-bold text-slate-900">STARLINK MARITIME SERVICE TERMS</h3>
                    <p>Starlink İnternet Hizmetleri Limited size, müşteri, bu Deniz Hizmet Şartları ("Şartlar") kapsamında iki yönlü uydu tabanlı internet hizmeti ve ekipman sunar.</p>
                    <h4 className="font-semibold text-slate-900 mt-3">1. STARLINK KİT VE HİZMETLERİN SATIN ALINMASI</h4>
                    <p>Starlink, Hizmetleri ve Starlink Kiti'ni Siparişinizde kayıtlı olan yargı alanındaki bir gemi veya deniz tesisi için sağlayacaktır.</p>
                    <h4 className="font-semibold text-slate-900 mt-3">4. DEĞİŞİKLİKLER VE İPTAL</h4>
                    <p>Aylık tekrarlayan ödemeyi durdurabilir, Hizmetleri iptal edebilir ve bu Anlaşmayı Starlink hesabınız aracılığıyla herhangi bir zamanda sonlandırabilirsiniz.</p>
                    <h4 className="font-semibold text-slate-900 mt-3">5. SINIRLI GARANTİ VE SORUMLULUK</h4>
                    <p>Starlink, Starlink Kit'inin ve Hizmetlerin performans hedeflerini karşılamak üzere makul çaba sarf edecektir.</p>
                    <h4 className="font-semibold text-slate-900 mt-3">6. UYUMLULUK</h4>
                    <p>Bu Anlaşma kapsamındaki yükümlülüklerle ilgili olarak geçerli veya ilişkili olan tüm yasalara ve düzenlemelere uymak zorundasınız.</p>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            {" "}'nı okudum ve kabul ediyorum
            {!termsAccepted && <p className="text-xs text-amber-600 mt-1">* {t.auth.termsRequired}</p>}
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !termsAccepted}
          className="w-full h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          data-testid="button-register"
        >
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.auth.registrationProcessing}</> : <><UserPlus className="h-4 w-4" /> {t.auth.registerButton}</>}
        </button>

        <p className="text-xs text-slate-400 text-center">{t.auth.privateSystemNotice}</p>
      </form>

      <div className="mt-5 pt-5 border-t border-slate-100 space-y-3 text-center text-sm">
        <p className="text-slate-500">
          {t.auth.alreadyHaveAccount}{" "}
          <button onClick={() => setLocation("/giris")} className="text-slate-900 font-semibold hover:underline" data-testid="link-login">
            {t.auth.loginNow}
          </button>
        </p>
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="inline-flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 text-sm"
          data-testid="button-home"
        >
          <Home className="h-4 w-4" /> Ana Sayfaya Dön
        </button>
      </div>
    </AuthShell>
  );
}
