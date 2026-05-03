import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, User, Ship as ShipIcon, Mail, Calendar, MapPin, Edit, Save, X,
  Lock, Key, Phone, BookOpen, LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NotificationSettings } from "@/components/NotificationSettings";
import UserShell from "@/components/UserShell";
import { Link } from "wouter";
import type { User as UserType, Ship } from "@shared/schema";

const COUNTRY_CODES = [
  { code: "+90", country: "Türkiye" }, { code: "+1", country: "ABD/Kanada" },
  { code: "+44", country: "İngiltere" }, { code: "+49", country: "Almanya" },
  { code: "+33", country: "Fransa" }, { code: "+39", country: "İtalya" },
  { code: "+34", country: "İspanya" }, { code: "+31", country: "Hollanda" },
  { code: "+7", country: "Rusya" }, { code: "+86", country: "Çin" },
  { code: "+81", country: "Japonya" }, { code: "+91", country: "Hindistan" },
  { code: "+61", country: "Avustralya" }, { code: "+971", country: "BAE" },
];

export default function Profil() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "", email: "", phoneCountryCode: "+90", phoneNumber: "",
    ship_id: "", address: "", currentPassword: "", newPassword: "", confirmPassword: "",
  });

  const { data: user, isLoading: authLoading } = useQuery<UserType & { ship?: Ship }>({
    queryKey: ["/api/user/me"], refetchInterval: 30000,
  });
  const { data: ships } = useQuery<Ship[]>({ queryKey: ["/api/ships"], enabled: !!user });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (data.newPassword || data.currentPassword) {
        if (!data.currentPassword) throw new Error("Mevcut şifre gerekli");
        if (!data.newPassword) throw new Error("Yeni şifre gerekli");
        if (data.newPassword !== data.confirmPassword) throw new Error("Yeni şifreler eşleşmiyor");
        if (data.newPassword.length < 6) throw new Error("Yeni şifre en az 6 karakter olmalı");
      }
      const submit = { ...data, phone: `${data.phoneCountryCode}${data.phoneNumber}` };
      return (await apiRequest("PUT", "/api/user/profile", submit)).json();
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Profil bilgileriniz güncellendi." });
      setIsEditing(false);
      setFormData(p => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/active-packages"] });
    },
    onError: (error: Error) => toast({ title: "Hata", description: error.message || "Profil güncellenirken bir hata oluştu.", variant: "destructive" }),
  });

  React.useEffect(() => {
    if (user) {
      const phone = user.phone || "";
      let cc = "+90"; let num = "";
      if (phone) {
        const m = COUNTRY_CODES.find(c => phone.startsWith(c.code));
        if (m) { cc = m.code; num = phone.substring(m.code.length); } else num = phone;
      }
      setFormData({
        full_name: user.full_name || "", email: user.email || "",
        phoneCountryCode: cc, phoneNumber: num,
        ship_id: user.ship_id || "", address: user.address || "",
        currentPassword: "", newPassword: "", confirmPassword: "",
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

  const Field = ({ icon: Icon, label, children }: any) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" /> {label}
      </label>
      {children}
    </div>
  );
  const Display = ({ children }: any) => (
    <div className="text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 text-sm min-h-[44px] flex items-center">
      {children}
    </div>
  );

  return (
    <UserShell title="Profil">
      <div className="max-w-2xl mx-auto space-y-4">
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
                <Edit className="h-3.5 w-3.5" /> Düzenle
              </button>
            )}
          </div>
        </div>

        {/* Profile fields */}
        <div className="user-card p-5 space-y-4">
          <Field icon={User} label="Kullanıcı Adı">
            <Display>{user?.username || "-"}</Display>
            <p className="text-xs text-slate-400">Bu alan değiştirilemez</p>
          </Field>

          <Field icon={Mail} label="E-posta">
            {isEditing ? (
              <input type="email" value={formData.email} onChange={e => handleChange("email", e.target.value)} placeholder="E-posta adresiniz" className="user-input w-full h-11 px-3.5 text-sm" data-testid="input-email" />
            ) : <Display>{user?.email || "Henüz girilmemiş"}</Display>}
          </Field>

          <Field icon={User} label="İsim Soyisim">
            {isEditing ? (
              <input value={formData.full_name} onChange={e => handleChange("full_name", e.target.value)} placeholder="Ad Soyad" className="user-input w-full h-11 px-3.5 text-sm" data-testid="input-full-name" />
            ) : <Display>{user?.full_name || "Henüz girilmemiş"}</Display>}
          </Field>

          <Field icon={Phone} label="Telefon Numarası">
            {isEditing ? (
              <div className="flex gap-2">
                <input value={formData.phoneCountryCode} onChange={e => handleChange("phoneCountryCode", e.target.value)} placeholder="+90" className="user-input w-[80px] h-11 px-2 text-center text-sm" data-testid="input-country-code" />
                <input value={formData.phoneNumber} onChange={e => handleChange("phoneNumber", e.target.value)} placeholder="532 123 45 67" className="user-input flex-1 h-11 px-3.5 text-sm" data-testid="input-phone-number" />
              </div>
            ) : <Display>{user?.phone || "Henüz girilmemiş"}</Display>}
          </Field>

          <Field icon={ShipIcon} label="Seçili Gemi">
            {isEditing ? (
              <select value={formData.ship_id} onChange={e => handleChange("ship_id", e.target.value)} className="user-input w-full h-11 px-3.5 text-sm" data-testid="select-ship">
                <option value="">Gemi seçin...</option>
                {ships?.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            ) : <Display>{user?.ship?.name || "Gemi seçilmemiş"}</Display>}
            {isEditing && <p className="text-xs text-[#7C5E00]">Gemi değiştirildiğinde paket atamaları yenilenecek</p>}
          </Field>

          <Field icon={MapPin} label="Adres">
            {isEditing ? (
              <textarea value={formData.address} onChange={e => handleChange("address", e.target.value)} placeholder="Teslimat/fatura adresi" rows={3} className="user-input w-full px-3.5 py-2.5 text-sm resize-none" data-testid="input-address" />
            ) : <Display>{user?.address || "Henüz girilmemiş"}</Display>}
          </Field>

          {isEditing && (
            <>
              <div className="h-px bg-slate-100 my-2" />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#7C5E00]" /> Şifre Değiştir (İsteğe Bağlı)
                </h3>
                <Field icon={Lock} label="Mevcut Şifre">
                  <input type="password" value={formData.currentPassword} onChange={e => handleChange("currentPassword", e.target.value)} placeholder="Mevcut şifreniz" className="user-input w-full h-11 px-3.5 text-sm" data-testid="input-current-password" />
                </Field>
                <Field icon={Lock} label="Yeni Şifre">
                  <input type="password" value={formData.newPassword} onChange={e => handleChange("newPassword", e.target.value)} placeholder="En az 6 karakter" className="user-input w-full h-11 px-3.5 text-sm" data-testid="input-new-password" />
                </Field>
                <Field icon={Lock} label="Yeni Şifre Tekrar">
                  <input type="password" value={formData.confirmPassword} onChange={e => handleChange("confirmPassword", e.target.value)} placeholder="Yeni şifreyi tekrar girin" className="user-input w-full h-11 px-3.5 text-sm" data-testid="input-confirm-password" />
                </Field>
              </div>
            </>
          )}

          <Field icon={Calendar} label="Kayıt Tarihi">
            <Display>{user?.created_at ? new Date(user.created_at).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" }) : "-"}</Display>
          </Field>

          {isEditing && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => updateProfileMutation.mutate(formData)}
                disabled={updateProfileMutation.isPending}
                className="flex-1 h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Kaydet
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm flex items-center justify-center gap-2"
                data-testid="button-cancel-edit"
              >
                <X className="h-4 w-4" /> İptal
              </button>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="user-card p-2">
          <Link href="/kullanim-kilavuzu">
            <a className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition">
              <div className="w-9 h-9 rounded-xl bg-[#FFF6D6] flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-[#7C5E00]" />
              </div>
              <span className="flex-1 text-sm font-medium text-slate-900">Kullanım Kılavuzu</span>
              <span className="text-slate-400">›</span>
            </a>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-rose-50 transition text-left">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <LogOut className="h-4 w-4 text-rose-600" />
            </div>
            <span className="flex-1 text-sm font-medium text-rose-600">Çıkış Yap</span>
          </button>
        </div>

        <NotificationSettings />
      </div>
    </UserShell>
  );
}
