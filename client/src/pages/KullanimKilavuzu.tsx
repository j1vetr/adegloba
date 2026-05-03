import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import UserShell from "@/components/UserShell";
import {
  ShoppingCart, CreditCard, User, HelpCircle, Package, CheckCircle2,
  ArrowRight, Wifi, Globe, Shield, Phone, Mail, ChevronDown, Search,
} from "lucide-react";

interface Step {
  id: number;
  icon: any;
  title: string;
  desc: string;
  details: string[];
  btn: string;
  href: string;
}

export default function KullanimKilavuzu() {
  const [, setLocation] = useLocation();
  const { t: tRaw } = useLanguage();
  const t = tRaw as any;
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(1);

  const steps: Step[] = [
    { id: 1, icon: User, title: t.userGuide?.step1Title || "Hesap Oluşturun", desc: t.userGuide?.step1Desc || "AdeGloba sistemine kayıt olun ve giriş yapın",
      details: [t.userGuide?.step1Detail1, t.userGuide?.step1Detail2, t.userGuide?.step1Detail3, t.userGuide?.step1Detail4].filter(Boolean) as string[],
      btn: t.userGuide?.step1Button || "Giriş Yap", href: "/giris" },
    { id: 2, icon: Package, title: t.userGuide?.step2Title || "Paketleri İnceleyin", desc: t.userGuide?.step2Desc || "Size uygun veri paketlerini keşfedin",
      details: [t.userGuide?.step2Detail1, t.userGuide?.step2Detail2, t.userGuide?.step2Detail3, t.userGuide?.step2Detail4].filter(Boolean) as string[],
      btn: t.userGuide?.step2Button || "Paketleri Gör", href: "/paketler" },
    { id: 3, icon: ShoppingCart, title: t.userGuide?.step3Title || "Sepete Ekleme", desc: t.userGuide?.step3Desc || "Seçtiğiniz paketleri sepete ekleyin",
      details: [t.userGuide?.step3Detail1, t.userGuide?.step3Detail2, t.userGuide?.step3Detail3, t.userGuide?.step3Detail4].filter(Boolean) as string[],
      btn: t.userGuide?.step3Button || "Sepeti Gör", href: "/sepet" },
    { id: 4, icon: CreditCard, title: t.userGuide?.step4Title || "Ödeme ve Aktivasyon", desc: t.userGuide?.step4Desc || "Güvenle ödeyin, anında kullanın",
      details: [t.userGuide?.step4Detail1, t.userGuide?.step4Detail2, t.userGuide?.step4Detail3, t.userGuide?.step4Detail4].filter(Boolean) as string[],
      btn: t.userGuide?.step4Button || "Panel", href: "/panel" },
    { id: 5, icon: User, title: t.userGuide?.step5Title || "Profil Yönetimi", desc: t.userGuide?.step5Desc || "Kişisel bilgilerinizi güncelleyin",
      details: [t.userGuide?.step5Detail1, t.userGuide?.step5Detail2, t.userGuide?.step5Detail3, t.userGuide?.step5Detail4].filter(Boolean) as string[],
      btn: t.userGuide?.step5Button || "Profil", href: "/profil" },
    { id: 6, icon: HelpCircle, title: t.userGuide?.step6Title || "Destek Alma", desc: t.userGuide?.step6Desc || "Profesyonel destek alın",
      details: [t.userGuide?.step6Detail1, t.userGuide?.step6Detail2, t.userGuide?.step6Detail3, t.userGuide?.step6Detail4].filter(Boolean) as string[],
      btn: t.userGuide?.step6Button || "Destek", href: "/destek" },
  ];

  const features = [
    { icon: Wifi,   title: t.userGuide?.instantActivation || "Anlık Aktivasyon", desc: t.userGuide?.instantDesc || "Ödeme sonrası anında aktif" },
    { icon: Globe,  title: t.userGuide?.globalCoverage || "Global Kapsama",       desc: t.userGuide?.globalDesc || "Dünya genelinde erişim" },
    { icon: Shield, title: t.userGuide?.securePayment || "Güvenli Ödeme",         desc: t.userGuide?.secureDesc || "PayPal ile korumalı" },
    { icon: Phone,  title: t.userGuide?.support247 || "7/24 Destek",              desc: t.userGuide?.supportDesc || "Her an ulaşılabilir" },
  ];

  const filteredSteps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return steps;
    return steps.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.details.some(d => d.toLowerCase().includes(q))
    );
  }, [search, steps]);

  return (
    <UserShell title={t.userGuide?.title || "Kullanım Kılavuzu"} showBack backTo="/profil">
      <div className="space-y-4">
        <div className="user-card p-4">
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            {t.userGuide?.stepsTitle || "6 Adımda Starlink Paketi"}
          </h2>
          <p className="text-sm text-slate-500 mb-3">
            {t.userGuide?.stepsSubtitle || "Adımları takip ederek kolayca paket satın alabilirsiniz"}
          </p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Adımlarda ara..."
              className="user-input w-full h-11 pl-10 pr-3 text-sm"
              data-testid="input-guide-search"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="user-card p-3.5">
                <div className="h-9 w-9 rounded-xl bg-[#FFF6D6] text-[#7C5E00] flex items-center justify-center mb-2">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Accordion */}
        <div className="space-y-2.5">
          {filteredSteps.length === 0 && (
            <div className="user-card text-center py-8 px-4">
              <p className="text-sm text-slate-500">"{search}" için sonuç bulunamadı</p>
            </div>
          )}

          {filteredSteps.map((s) => {
            const Icon = s.icon;
            const isOpen = openId === s.id;
            return (
              <div key={s.id} className="user-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition"
                  aria-expanded={isOpen}
                  data-testid={`accordion-step-${s.id}`}
                >
                  <div className="h-10 w-10 rounded-xl bg-[#FFDD57] text-slate-900 flex items-center justify-center font-bold text-sm shrink-0">
                    {s.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-slate-500" /> {s.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{s.desc}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                    <ul className="space-y-1.5 mt-3 mb-3">
                      {s.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setLocation(s.href)}
                      className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      {s.btn} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="user-card-elevated p-5 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-[#FFF6D6] text-[#7C5E00] flex items-center justify-center mb-2.5">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            {t.userGuide?.needHelp || "Yardıma mı ihtiyacınız var?"}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {t.userGuide?.needHelpDesc || "Destek ekibimiz size yardımcı olur"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLocation("/destek")}
              className="h-11 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="h-4 w-4" /> Destek
            </button>
            <button
              onClick={() => window.open("https://wa.me/447440225375", "_blank")}
              className="h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-1.5"
            >
              <Phone className="h-4 w-4" /> WhatsApp
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-500">
            <span className="flex items-center justify-center gap-1.5"><Mail className="h-3.5 w-3.5" /> support@adegloba.space</span>
            <span className="flex items-center justify-center gap-1.5"><Phone className="h-3.5 w-3.5" /> +44 744 022 5375</span>
          </div>
        </div>
      </div>
    </UserShell>
  );
}
