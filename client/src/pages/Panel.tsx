import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useSearch } from "wouter";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Package, History, Clock, Archive,
  Heart, ShoppingCart, Copy, ChevronLeft, ChevronRight,
  Wifi, Satellite, RotateCcw
} from "lucide-react";
import { Link } from "wouter";
import { UserNavigation } from "@/components/UserNavigation";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, User, Ship, FavoritePlan, Plan } from "@shared/schema";
import adeGlobaLogo from '@assets/adegloba-1_1756252463127.png';

/* ─── helpers ─────────────────────────────────────────────── */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtPrice = (p: string | number) => `$${Number(p).toFixed(2)}`;

function calcExpiry(paidAt: string, expiresAt: string) {
  if (!expiresAt) {
    const pd = new Date(paidAt);
    expiresAt = new Date(pd.getFullYear(), pd.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
  }
  const exp = new Date(expiresAt);
  const now = new Date();
  const diffMs = exp.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / 86400000));
  const pd = new Date(paidAt);
  const start = new Date(pd.getFullYear(), pd.getMonth(), 1);
  const total = exp.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const pct = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
  return { daysLeft, exp, pct };
}

/* ─── sub-components ──────────────────────────────────────── */

function CopyButton({ value, label, testId }: { value: string; label: string; testId?: string }) {
  const { toast } = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} kopyalandı`, variant: "default" });
    } catch {
      toast({ title: "Kopyalama başarısız", variant: "destructive" });
    }
  };
  return (
    <button
      onClick={copy}
      data-testid={testId}
      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
    >
      <Copy className="w-3.5 h-3.5 text-white/40 hover:text-white/70" />
    </button>
  );
}

function EmptyState({ icon: Icon, title, desc, action }: { icon: any; title: string; desc: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-white/25" />
      </div>
      <p className="text-white/70 font-semibold text-base mb-1">{title}</p>
      <p className="text-white/35 text-sm mb-6 max-w-xs">{desc}</p>
      {action && (
        <Link href={action.href}>
          <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            {action.label}
          </button>
        </Link>
      )}
    </div>
  );
}

/* ─── main component ──────────────────────────────────────── */
const TABS = [
  { key: 'packages', icon: Package,  labelKey: 'packagesShort' },
  { key: 'favorites', icon: Heart,    labelKey: 'favoritesShort' },
  { key: 'history',  icon: History,  labelKey: 'historyShort' },
  { key: 'expired',  icon: Archive,  labelKey: 'expiredShort' },
] as const;

export default function Panel() {
  const { user, isLoading: authLoading } = useUserAuth() as { user: User & { ship?: Ship }; isLoading: boolean };
  const { toast } = useToast();
  const { t } = useLanguage();
  const [expiredPage, setExpiredPage] = useState(1);
  const expiredPageSize = 6;
  const searchString = useSearch();

  const getInitialTab = () => {
    const p = new URLSearchParams(searchString).get('tab');
    return (p && ['packages','favorites','history','expired'].includes(p)) ? p : 'packages';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const p = new URLSearchParams(searchString).get('tab');
    if (p && ['packages','favorites','history','expired'].includes(p)) setActiveTab(p);
  }, [searchString]);

  const { data: userOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/user/orders"], enabled: !!user
  });
  const { data: activePackages, isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/user/active-packages"], enabled: !!user
  });
  const { data: expiredPackagesData, isLoading: expiredLoading } = useQuery({
    queryKey: ["/api/user/expired-packages", expiredPage],
    queryFn: async () => {
      const r = await fetch(`/api/user/expired-packages?page=${expiredPage}&pageSize=${expiredPageSize}`);
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    enabled: !!user
  });
  const { data: favorites, isLoading: favoritesLoading } = useQuery<(FavoritePlan & { plan: Plan })[]>({
    queryKey: ["/api/favorites"], enabled: !!user
  });

  const addToCartMutation = useMutation({
    mutationFn: async (planId: string) => {
      const r = await apiRequest('POST', '/api/cart', { planId, quantity: 1 });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: t.packages.addedToCart, description: t.packages.addedToCartDesc });
      window.location.href = '/sepet';
    },
    onError: () => toast({ title: t.common.error, description: "Sepete eklenemedi", variant: "destructive" }),
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (planId: string) => { await apiRequest('DELETE', `/api/favorites/${planId}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: t.packages.removedFromFavorites });
    },
    onError: () => toast({ title: t.packages.favoriteError, variant: "destructive" }),
  });

  if (authLoading) return (
    <div className="min-h-screen bg-[#080c18] flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
    </div>
  );

  if (!user) { window.location.href = '/giris'; return null; }

  const pkgs = activePackages as any[] | undefined;
  const tabLabel: Record<string, string> = {
    packagesShort: t.dashboard.sections.packagesShort ?? 'Paketler',
    favoritesShort: t.dashboard.sections.favoritesShort ?? 'Fav',
    historyShort: t.dashboard.sections.historyShort ?? 'Geçmiş',
    expiredShort: t.dashboard.sections.expiredShort ?? 'Bitmiş',
  };

  return (
    <div className="min-h-screen bg-[#080c18]">
      {/* ── ambient glows ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-blue-700/8 blur-[100px]" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-cyan-700/6 blur-[90px]" />
      </div>

      <UserNavigation />

      <div className="relative max-w-2xl mx-auto px-4 pt-5 pb-28">

        {/* ══════════════════════════════════════════
            HERO CARD — user identity + quick action
            ══════════════════════════════════════ */}
        <div className="relative rounded-2xl overflow-hidden mb-5">
          {/* background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a4a] via-[#111827] to-[#0d1929]" />
          {/* decorative circles */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-cyan-500/8 blur-2xl" />
          {/* top accent line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

          <div className="relative p-5">
            {/* logo + title row */}
            <div className="flex items-center gap-3 mb-5">
              <img src={adeGlobaLogo} alt="AdeGloba" className="h-9 object-contain drop-shadow-lg" />
              <div>
                <p className="text-white font-bold text-base leading-none">Kontrol Paneli</p>
                <p className="text-white/40 text-xs mt-0.5">Starlink Maritime</p>
              </div>
            </div>

            {/* user info */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg uppercase">
                  {user.username?.[0] ?? 'U'}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold text-base leading-tight">
                  {t.dashboard.welcome}, <span className="text-cyan-300">{user.username}</span>
                </p>
                {user.ship && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Satellite className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-400 text-xs font-medium">{user.ship.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Aktif Paket', value: pkgs?.length ?? 0, color: 'text-emerald-400' },
                { label: 'Sipariş', value: userOrders?.length ?? 0, color: 'text-blue-400' },
                { label: 'Favori', value: favorites?.length ?? 0, color: 'text-pink-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-white/35 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link href="/paketler">
              <button
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                data-testid="button-buy-packages"
              >
                <ShoppingCart className="w-4 h-4" />
                {t.dashboard.purchase.buyDataPackage}
              </button>
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            TAB BAR
            ══════════════════════════════════════ */}
        <div className="flex gap-2 mb-5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1.5">
          {TABS.map(({ key, icon: Icon, labelKey }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              data-testid={`tab-${key}`}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === key
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tabLabel[labelKey]}</span>
              <span className="sm:hidden">{tabLabel[labelKey]}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            ACTIVE PACKAGES
            ══════════════════════════════════════ */}
        {activeTab === 'packages' && (
          <div className="space-y-4">
            {packagesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              </div>
            ) : pkgs?.length ? (
              pkgs.map((pkg: any) => {
                const { daysLeft, exp, pct } = calcExpiry(pkg.paidAt || pkg.assignedAt, pkg.expiresAt);
                const urgency = daysLeft > 7 ? 'green' : daysLeft > 3 ? 'amber' : 'red';
                const progressColor = { green: 'from-emerald-500 to-teal-400', amber: 'from-amber-500 to-orange-400', red: 'from-red-500 to-rose-400' }[urgency];
                const dayTextColor = { green: 'text-emerald-400', amber: 'text-amber-400', red: 'text-red-400' }[urgency];

                return (
                  <div
                    key={pkg.credentialId}
                    className="rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.03]"
                    data-testid={`package-card-${pkg.credentialId}`}
                  >
                    {/* card header */}
                    <div className="relative bg-gradient-to-r from-[#0f1e38] to-[#091220] px-5 pt-5 pb-4">
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{pkg.planName}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-white leading-none">{pkg.dataLimitGb}</span>
                            <span className="text-xl font-bold text-white/50 ml-1">GB</span>
                          </div>
                          <p className="text-cyan-400/70 text-xs mt-1">Starlink Data Paketi</p>
                        </div>

                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                          daysLeft > 0
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${daysLeft > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                          {daysLeft > 0 ? 'Aktif' : 'Süresi Doldu'}
                        </div>
                      </div>

                      {/* progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-white/40">
                            <Clock className="w-3 h-3" />
                            <span>Kalan süre</span>
                          </div>
                          <span className={`font-bold ${dayTextColor}`}>{daysLeft} gün</span>
                        </div>

                        {/* custom gradient progress bar */}
                        <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <p className="text-white/25 text-xs">Bitiş: {fmtDate(exp.toISOString())}</p>
                      </div>
                    </div>

                    {/* credentials */}
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Wifi className="w-3.5 h-3.5 text-cyan-400/60" />
                        <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Bağlantı Bilgileri</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: 'Kullanıcı Adı', val: pkg.username, testId: `copy-username-${pkg.credentialId}` },
                          { label: 'Şifre', val: pkg.password, testId: `copy-password-${pkg.credentialId}` },
                        ].map(({ label, val, testId }) => (
                          <div key={label} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-4 py-3 border border-white/[0.05]">
                            <div>
                              <p className="text-white/35 text-xs mb-0.5">{label}</p>
                              <p className="text-white font-mono text-sm font-medium">{val}</p>
                            </div>
                            <CopyButton value={val} label={label} testId={testId} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={Package}
                title={t.dashboard.texts.noActivePackages}
                desc={t.dashboard.texts.noActivePackagesDesc}
                action={{ label: t.dashboard.texts.buyFirstPackage, href: '/paketler' }}
              />
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            FAVORITES
            ══════════════════════════════════════ */}
        {activeTab === 'favorites' && (
          <div className="space-y-3">
            {favoritesLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-pink-400" /></div>
            ) : favorites?.length ? (
              favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4"
                  data-testid={`favorite-card-${fav.id}`}
                >
                  {/* GB badge */}
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-600/20 to-rose-600/10 border border-pink-500/20 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-black text-white leading-none">{fav.plan.dataLimitGb}</span>
                    <span className="text-xs text-pink-400 font-semibold">GB</span>
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{fav.plan.name}</p>
                    <p className="text-white/40 text-xs">{fav.plan.dataLimitGb} GB · Starlink</p>
                    <p className="text-white font-bold text-base mt-1">{fmtPrice(fav.plan.priceUsd)}</p>
                  </div>

                  {/* actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => addToCartMutation.mutate(fav.plan.id)}
                      disabled={addToCartMutation.isPending}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                      data-testid={`button-add-cart-${fav.id}`}
                    >
                      {addToCartMutation.isPending
                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                        : <ShoppingCart className="w-4 h-4 text-white" />}
                    </button>
                    <button
                      onClick={() => removeFavoriteMutation.mutate(fav.plan.id)}
                      disabled={removeFavoriteMutation.isPending}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/20 transition-colors"
                      data-testid={`button-remove-favorite-${fav.id}`}
                    >
                      {removeFavoriteMutation.isPending
                        ? <Loader2 className="w-3.5 h-3.5 text-white/40 animate-spin" />
                        : <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Heart}
                title={t.dashboard.sections.noFavorites ?? 'Henüz Favori Paket Yok'}
                desc={t.dashboard.sections.noFavoritesDesc ?? 'Beğendiğiniz paketleri favorilere ekleyerek hızlıca satın alabilirsiniz.'}
                action={{ label: t.dashboard.sections.browsePackages ?? 'Paketleri Keşfet', href: '/paketler' }}
              />
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            PURCHASE HISTORY
            ══════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {ordersLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-400" /></div>
            ) : userOrders?.length ? (
              (userOrders as any[]).map((order: any) => {
                const isPaid = !!order.paidAt;
                const isCancelled = order.status === 'cancelled';
                return (
                  <div
                    key={order.id}
                    className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4"
                    data-testid={`order-card-${order.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold text-sm">Sipariş #{order.id.slice(-8)}</p>
                        <p className="text-white/35 text-xs">{fmtDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{fmtPrice(order.totalUsd)}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isCancelled ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                          : isPaid ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        }`}>
                          {isCancelled ? 'İptal' : isPaid ? 'Ödendi' : 'Beklemede'}
                        </span>
                      </div>
                    </div>

                    {order.orderItems?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                            <span className="text-blue-400 text-xs font-bold">{item.plan?.dataLimitGb}</span>
                          </div>
                          <span className="text-white/60 text-xs">{item.plan?.name}</span>
                        </div>
                        <span className="text-white/60 text-xs font-medium">{fmtPrice(item.unitPriceUsd)}</span>
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={History}
                title="Sipariş Geçmişi Yok"
                desc={t.dashboard.texts.noPurchaseHistory}
              />
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            EXPIRED PACKAGES
            ══════════════════════════════════════ */}
        {activeTab === 'expired' && (
          <div className="space-y-3">
            {expiredLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-red-400" /></div>
            ) : expiredPackagesData?.packages?.length ? (
              <>
                {expiredPackagesData.packages.map((pkg: any) => (
                  <div
                    key={pkg.credentialId}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden"
                    data-testid={`expired-package-card-${pkg.credentialId}`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* GB */}
                      <div className="w-14 h-14 rounded-xl bg-red-500/8 border border-red-500/15 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xl font-black text-white/50 leading-none">{pkg.dataLimitGb}</span>
                        <span className="text-xs text-red-400/60 font-semibold">GB</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white/60 font-semibold text-sm">{pkg.planName}</p>
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/15 text-red-400 text-xs font-semibold">Bitti</span>
                        </div>
                        <p className="text-white/25 text-xs">Satın alma: {fmtDate(pkg.purchaseDate)}</p>
                        <p className="text-red-400/50 text-xs">Bitiş: {fmtDate(pkg.expiredDate)}</p>
                      </div>
                    </div>
                    {/* credentials (masked) */}
                    <div className="border-t border-white/5 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-white/25">
                        <span className="font-mono">{pkg.username}</span>
                        <span>·</span>
                        <span className="font-mono">{pkg.maskedPassword}</span>
                      </div>
                      <span className="text-white/20 text-xs">Kullanılamaz</span>
                    </div>
                  </div>
                ))}

                {/* pagination */}
                {expiredPackagesData.pagination?.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-white/30 text-xs">
                      {expiredPackagesData.pagination.currentPage} / {expiredPackagesData.pagination.totalPages} sayfa
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpiredPage(p => Math.max(1, p - 1))}
                        disabled={expiredPackagesData.pagination.currentPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-white/50 text-xs disabled:opacity-30 hover:bg-white/10 transition-colors"
                        data-testid="pagination-prev"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Önceki
                      </button>
                      <button
                        onClick={() => setExpiredPage(p => Math.min(expiredPackagesData.pagination.totalPages, p + 1))}
                        disabled={expiredPackagesData.pagination.currentPage === expiredPackagesData.pagination.totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-white/50 text-xs disabled:opacity-30 hover:bg-white/10 transition-colors"
                        data-testid="pagination-next"
                      >
                        Sonraki <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={Archive}
                title={t.dashboard.texts.noExpiredPackages}
                desc={t.dashboard.texts.noExpiredPackagesDesc}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}
