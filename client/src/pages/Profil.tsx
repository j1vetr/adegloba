import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, User, Ship as ShipIcon, Mail, Calendar, MapPin, Edit, Save, X,
  Lock, Key, Phone, BookOpen, LogOut, AlertTriangle, Trash2, Eye, EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NotificationSettings } from "@/components/NotificationSettings";
import UserShell from "@/components/UserShell";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import type { User as UserType, Ship } from "@shared/schema";
import { COUNTRY_CODES, findCountryByPhone } from "@/lib/countryCodes";

export default function Profil() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const LANG_LOCALE: Record<string, string> = { tr: "tr-TR", en: "en-US", ru: "ru-RU" };
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showPwSheet, setShowPwSheet] = useState(false);
  const [showCloseSheet, setShowCloseSheet] = useState(false);
  const [closureConfirm, setClosureConfirm] = useState("");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwShow, setPwShow] = useState({ c: false, n: false, cf: false });

  const [formData, setFormData] = useState({
    full_name: "", email: "", phoneCountryCode: "+90", phoneNumber: "",
    ship_id: "", address: "",
  });

  const { data: user, isLoading: authLoading } = useQuery<UserType & { ship?: Ship }>({
    queryKey: ["/api/user/me"], refetchInterval: 30000,
  });
  const { data: ships } = useQuery<Ship[]>({ queryKey: ["/api/ships"], enabled: !!user });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const submit = { ...data, phone: `${data.phoneCountryCode}${data.phoneNumber}` };
      return (await apiRequest("PUT", "/api/user/profile", submit)).json();
    },
    onSuccess: () => {
      toast({ title: t.common.success, description: t.profile.saveChanges });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/active-packages"] });
    },
    onError: (error: Error) => toast({ title: t.common.error, description: error.message, variant: "destructive" }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!pw.current) throw new Error(t.profile.currentPasswordLabel);
      if (!pw.next) throw new Error(t.profile.newPasswordMin12);
      if (pw.next !== pw.confirm) throw new Error(t.passwordUpdate.passwordMismatch);
      if (pw.next.length < 12) throw new Error(t.passwordUpdate.minLength);
      return (await apiRequest("POST", "/api/user/update-password", {
        currentPassword: pw.current, newPassword: pw.next,
      })).json();
    },
    onSuccess: () => {
      toast({ title: t.passwordUpdate.successMessage });
      setShowPwSheet(false);
      setPw({ current: "", next: "", confirm: "" });
    },
    onError: (error: Error) => toast({ title: t.common.error, description: error.message, variant: "destructive" }),
  });

  const closeAccountMutation = useMutation({
    mutationFn: async () => {
      return (await apiRequest("POST", "/api/user/request-account-closure", {})).json();
    },
    onSuccess: () => {
      toast({ title: t.common.success, description: t.profile.closeAccountDesc });
      setShowCloseSheet(false);
      setClosureConfirm("");
    },
    onError: (error: Error) => toast({ title: t.common.error, description: error.message, variant: "destructive" }),
  });

  React.useEffect(() => {
    if (user) {
      const phone = user.phone || "";
      const { code: cc, rest: num } = phone ? findCountryByPhone(phone) : { code: "+90", rest: "" };
      setFormData({
        full_name: user.full_name || "", email: user.email || "",
        phoneCountryCode: cc, phoneNumber: num,
        ship_id: user.ship_id || "", address: user.address || "",
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => setFormData(p => ({ ...p, [field]: value }));

  const handleLogout = async () => {
    try {
      await fetch("/api/user/logout", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      window.location.href = "/giris";
    } catch (e) { console.error(e); }
  };

  if (authLoading) return <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  if (!user) { window.location.href = "/giris"; return null; }

  const FieldLabel = ({ icon: Icon, label }: { icon: any; label: string }) => (
    <label className="text-xs font-medium text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-slate-400" /> {label}
    </label>
  );
  const Display = ({ children }: { children: React.ReactNode }) => (
    <div className="text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 text-sm min-h-[44px] flex items-center">
      {children}
    </div>
  );

  return (
    <UserShell title={t.dashboard.navigation.profile}>
      <div className="space-y-4">
        {/* Header */}
        <div className="user-card-elevated p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-xl bg-[#FFDD57] flex items-center justify-center shrink-0">
              <span className="text-slate-900 font-bold text-lg uppercase">{user.username?.[0] ?? "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{user.full_name || user.username}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 h-10 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 text-sm font-semibold flex items-center gap-1.5"
                data-testid="button-edit-profile"
              >
                <Edit className="h-3.5 w-3.5" /> {t.profile.edit ?? t.profile.editProfile}
              </button>
            )}
          </div>
        </div>

        {/* Profile fields */}
        <div className="user-card p-5 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel icon={User} label={t.profile.username} />
            <Display>{user.username || "-"}</Display>
            <p className="text-xs text-slate-400">{t.profile.cannotChange}</p>
          </div>

          <div className="space-y-1.5">
            <FieldLabel icon={Mail} label={t.profile.email} />
            {isEditing ? (
              <input type="email" value={formData.email} onChange={e => handleChange("email", e.target.value)} placeholder={t.profile.emailPlaceholder ?? t.profile.email} className="user-input w-full h-11 px-3.5 text-sm" data-testid="input-email" />
            ) : <Display>{user.email || (t.profile.notFilled ?? "-")}</Display>}
          </div>

          <div className="space-y-1.5">
            <FieldLabel icon={User} label={t.profile.fullName} />
            {isEditing ? (
              <input value={formData.full_name} onChange={e => handleChange("full_name", e.target.value)} placeholder={t.profile.fullNamePlaceholder ?? t.profile.fullName} className="user-input w-full h-11 px-3.5 text-sm" data-testid="input-full-name" />
            ) : <Display>{user.full_name || (t.profile.notFilled ?? "-")}</Display>}
          </div>

          <div className="space-y-1.5">
            <FieldLabel icon={Phone} label={t.profile.phoneNumber} />
            {isEditing ? (
              <div className="flex gap-2">
                <select value={formData.phoneCountryCode} onChange={e => handleChange("phoneCountryCode", e.target.value)} className="user-input w-[110px] h-11 px-2 text-sm" data-testid="input-country-code">
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input value={formData.phoneNumber} onChange={e => handleChange("phoneNumber", e.target.value)} placeholder="532 123 45 67" className="user-input flex-1 h-11 px-3.5 text-sm" data-testid="input-phone-number" />
              </div>
            ) : <Display>{user.phone || (t.profile.notFilled ?? "-")}</Display>}
          </div>

          <div className="space-y-1.5">
            <FieldLabel icon={ShipIcon} label={t.profile.selectShip} />
            {isEditing ? (
              <select value={formData.ship_id} onChange={e => handleChange("ship_id", e.target.value)} className="user-input w-full h-11 px-3.5 text-sm" data-testid="select-ship">
                <option value="">{t.profile.selectShipOption ?? t.profile.selectShip}</option>
                {ships?.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            ) : <Display>{user.ship?.name || (t.profile.noShipSelected ?? "-")}</Display>}
            {isEditing && <p className="text-xs text-[#7C5E00]">{t.profile.shipChangeNote}</p>}
          </div>

          <div className="space-y-1.5">
            <FieldLabel icon={MapPin} label={t.profile.address} />
            {isEditing ? (
              <textarea value={formData.address} onChange={e => handleChange("address", e.target.value)} placeholder={t.profile.addressPlaceholder ?? t.profile.address} rows={3} className="user-input w-full px-3.5 py-2.5 text-sm resize-none" data-testid="input-address" />
            ) : <Display>{user.address || (t.profile.notFilled ?? "-")}</Display>}
          </div>

          <div className="space-y-1.5">
            <FieldLabel icon={Calendar} label={t.profile.registrationDate} />
            <Display>{user.created_at ? new Date(user.created_at).toLocaleDateString(LANG_LOCALE[language] ?? "tr-TR", { year: "numeric", month: "long", day: "numeric" }) : "-"}</Display>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => updateProfileMutation.mutate(formData)}
                disabled={updateProfileMutation.isPending}
                className="flex-1 h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t.profile.save ?? t.profile.saveChanges}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm flex items-center justify-center gap-2"
                data-testid="button-cancel-edit"
              >
                <X className="h-4 w-4" /> {t.profile.cancel}
              </button>
            </div>
          )}
        </div>

        {/* Security card */}
        <div className="user-card p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF6D6] flex items-center justify-center shrink-0">
              <Key className="h-4 w-4 text-[#7C5E00]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">{t.profile.security}</h3>
              <p className="text-xs text-slate-500">{t.profile.securityDesc}</p>
            </div>
          </div>
          <button
            onClick={() => setShowPwSheet(true)}
            className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium text-sm flex items-center justify-center gap-2 transition"
            data-testid="button-open-password-sheet"
          >
            <Lock className="h-4 w-4" /> {t.profile.changePasswordBtn ?? t.profile.changePassword}
          </button>
        </div>

        {/* Quick links */}
        <div className="user-card p-2">
          <Link href="/kilavuz">
            <a className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition">
              <div className="w-9 h-9 rounded-xl bg-[#FFF6D6] flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-[#7C5E00]" />
              </div>
              <span className="flex-1 text-sm font-medium text-slate-900">{t.profile.userGuideLink ?? t.guide.title}</span>
              <span className="text-slate-400">›</span>
            </a>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-rose-50 transition text-left" data-testid="button-logout">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <LogOut className="h-4 w-4 text-rose-600" />
            </div>
            <span className="flex-1 text-sm font-medium text-rose-600">{t.profile.logout ?? t.dashboard.navigation.logout}</span>
          </button>
        </div>

        <NotificationSettings />

        {/* Account closure (danger zone) */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-rose-900">{t.profile.closeAccount}</h3>
              <p className="text-xs text-rose-700/80">{t.profile.closeAccountDesc}</p>
            </div>
          </div>
          <button
            onClick={() => setShowCloseSheet(true)}
            className="w-full h-11 rounded-xl bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-medium text-sm flex items-center justify-center gap-2 transition"
            data-testid="button-open-close-account"
          >
            <Trash2 className="h-4 w-4" /> {t.profile.closeAccountRequest}
          </button>
        </div>
      </div>

      {/* Password change sheet */}
      <BottomSheet
        open={showPwSheet}
        onClose={() => setShowPwSheet(false)}
        title={<><Lock className="h-4 w-4 text-[#7C5E00]" /> {t.profile.changePasswordBtn ?? t.profile.changePassword}</>}
        testId="password-sheet"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setShowPwSheet(false)}
              className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm"
            >
              {t.profile.cancel}
            </button>
            <button
              onClick={() => changePasswordMutation.mutate()}
              disabled={changePasswordMutation.isPending}
              className="flex-1 h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              data-testid="button-submit-password-change"
            >
              {changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t.profile.update ?? t.profile.saveChanges}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {([
            { k: "current", label: t.profile.currentPasswordLabel ?? t.profile.currentPassword, show: pwShow.c, setShow: () => setPwShow(s => ({ ...s, c: !s.c })) },
            { k: "next", label: t.profile.newPasswordMin12 ?? t.profile.newPassword, show: pwShow.n, setShow: () => setPwShow(s => ({ ...s, n: !s.n })) },
            { k: "confirm", label: t.profile.confirmPasswordRepeat ?? t.profile.confirmPassword, show: pwShow.cf, setShow: () => setPwShow(s => ({ ...s, cf: !s.cf })) },
          ] as const).map(({ k, label, show, setShow }) => (
            <div key={k} className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">{label}</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={pw[k]}
                  onChange={e => setPw(p => ({ ...p, [k]: e.target.value }))}
                  className="user-input w-full h-12 px-3.5 pr-11 text-sm"
                  data-testid={`input-pw-${k}`}
                />
                <button
                  type="button" onClick={setShow}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                  aria-label={show ? (t.profile.hide ?? "Hide") : (t.profile.show ?? "Show")}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* Account closure sheet */}
      <BottomSheet
        open={showCloseSheet}
        onClose={() => { setShowCloseSheet(false); setClosureConfirm(""); }}
        title={<><AlertTriangle className="h-4 w-4 text-rose-600" /> {t.profile.closeAccountRequest}</>}
        testId="close-account-sheet"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCloseSheet(false); setClosureConfirm(""); }}
              className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm"
            >
              {t.profile.dismiss ?? t.profile.cancel}
            </button>
            <button
              onClick={() => closeAccountMutation.mutate()}
              disabled={closureConfirm.toUpperCase() !== (t.profile.closeAccountConfirmWord ?? "KAPAT") || closeAccountMutation.isPending}
              className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="button-confirm-close-account"
            >
              {closeAccountMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {t.profile.submitRequest}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 space-y-1.5">
            <p className="font-semibold">{t.profile.closeAccountWarningTitle}</p>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              <li>{t.profile.closeAccountBullet1}</li>
              <li>{t.profile.closeAccountBullet2}</li>
              <li>{t.profile.closeAccountBullet3}</li>
            </ul>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
              {t.profile.typeToConfirm} <span className="font-mono text-rose-600">{t.profile.closeAccountConfirmWord}</span>
            </label>
            <input
              value={closureConfirm}
              onChange={e => setClosureConfirm(e.target.value)}
              placeholder={t.profile.closeAccountConfirmWord}
              className="user-input w-full h-12 px-3.5 text-sm uppercase font-mono"
              data-testid="input-closure-confirm"
            />
          </div>
        </div>
      </BottomSheet>
    </UserShell>
  );
}
