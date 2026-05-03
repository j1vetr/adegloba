import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Link } from "wouter";
import {
  Loader2, Package, Clock, Heart, ShoppingCart, Copy, Wifi, Satellite,
  CalendarDays, History, ChevronRight, HeadphonesIcon, BookOpen, User as UserIcon,
} from "lucide-react";
import UserShell from "@/components/UserShell";
import { FeedbackModal, useFeedbackModal } from "@/components/FeedbackModal";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Ship, FavoritePlan, Plan } from "@shared/schema";

const IST = "Europe/Istanbul";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", timeZone: IST });
const fmtPrice = (p: string | number) => `$${Number(p).toFixed(2)}`;

interface ActivePackage {
  credentialId: string; planName: string; dataLimitGb: number;
  username: string; password: string;
  paidAt: string; assignedAt: string; expiresAt: string;
}

function calcExpiry(paidAt: string, expiresAt: string) {
  if (!expiresAt) {
    const pd = new Date(paidAt);
    expiresAt = new Date(pd.getFullYear(), pd.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
  }
  const exp = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / 86400000));
  const pd = new Date(paidAt);
  const start = new Date(pd.getFullYear(), pd.getMonth(), 1);
  const total = exp.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const pct = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
  return { daysLeft, exp, pct };
}

function CopyBtn({ value, label, testId }: { value: string; label: string; testId?: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); toast({ title: `${label} kopyalandı` }); }
        catch { toast({ title: "Kopyalama başarısız", variant: "destructive" }); }
      }}
      data-testid={testId}
      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
    >
      <Copy className="w-3.5 h-3.5 text-slate-500" />
    </button>
  );
}

export default function Panel() {
  const { user, isLoading: authLoading } = useUserAuth() as { user: User & { ship?: Ship }; isLoading: boolean };
  const { t } = useLanguage();

  const shouldShowFeedback = useFeedbackModal(user?.id);
  const [showFeedback, setShowFeedback] = useState(false);
  useEffect(() => {
    if (user?.id && shouldShowFeedback) {
      const tm = setTimeout(() => setShowFeedback(true), 1500);
      return () => clearTimeout(tm);
    }
  }, [user?.id, shouldShowFeedback]);

  const { data: activePackages, isLoading: packagesLoading } = useQuery<ActivePackage[]>({
    queryKey: ["/api/user/active-packages"], enabled: !!user, staleTime: 0, refetchOnMount: "always", refetchInterval: 60000,
  });
  const { data: favorites, isLoading: favoritesLoading } = useQuery<(FavoritePlan & { plan: Plan })[]>({
    queryKey: ["/api/favorites"], enabled: !!user,
  });
  const { data: userOrders } = useQuery<any[]>({
    queryKey: ["/api/user/orders"], enabled: !!user, staleTime: 0,
  });

  const { toast } = useToast();
  const addToCartMutation = useMutation({
    mutationFn: async (planId: string) => (await apiRequest("POST", "/api/cart", { planId, quantity: 1 })).json(),
    onSuccess: () => { toast({ title: t.packages.addedToCart, description: t.packages.addedToCartDesc }); window.location.href = "/sepet"; },
    onError: () => toast({ title: t.common.error, description: "Sepete eklenemedi", variant: "destructive" }),
  });
  const removeFavoriteMutation = useMutation({
    mutationFn: async (planId: string) => { await apiRequest("DELETE", `/api/favorites/${planId}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/favorites"] }); toast({ title: t.packages.removedFromFavorites }); },
    onError: () => toast({ title: t.packages.favoriteError, variant: "destructive" }),
  });

  if (authLoading) {
    return <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>;
  }
  if (!user) { window.location.href = "/giris"; return null; }

  const pkgs = activePackages || [];
  const sortedPkgs = [...pkgs].sort((a, b) => new Date(b.paidAt || b.assignedAt).getTime() - new Date(a.paidAt || a.assignedAt).getTime());

  return (
    <UserShell title="Ana Sayfa">
      {showFeedback && user?.id && <FeedbackModal userId={user.id} onClose={() => setShowFeedback(false)} />}

      <div className="space-y-4">
        {/* Hero */}
        <div className="user-card-elevated p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-[#FFDD57] flex items-center justify-center shrink-0">
              <span className="text-slate-900 font-bold text-lg uppercase">{user.username?.[0] ?? "U"}</span>
            </div>
            <div className="min-w-0">
              <p className="text-slate-900 font-semibold text-base leading-tight truncate">
                {t.dashboard.welcome}, <span className="text-slate-700">{user.username}</span>
              </p>
              {user.ship && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Satellite className="w-3 h-3 text-[#7C5E00]" />
                  <span className="text-[#7C5E00] text-xs font-medium truncate">{user.ship.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Aktif", value: pkgs.length },
              { label: "Sipariş", value: userOrders?.length ?? 0 },
              { label: "Favori", value: favorites?.length ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center">
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-slate-500 text-xs">{label}</p>
              </div>
            ))}
          </div>

          <Link href="/paketler">
            <a className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm transition active:scale-[0.99]" data-testid="button-buy-packages">
              <ShoppingCart className="w-4 h-4" />
              {t.dashboard.purchase.buyDataPackage}
            </a>
          </Link>
        </div>

        {/* Operator-style quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { href: "/paketler", icon: Package,        label: "Paketler",   testId: "qa-packages" },
            { href: "/destek",   icon: HeadphonesIcon, label: "Destek",     testId: "qa-support" },
            { href: "/kilavuz",  icon: BookOpen,       label: "Kılavuz",    testId: "qa-guide" },
            { href: "/profil",   icon: UserIcon,       label: "Profil",     testId: "qa-profile" },
          ].map((qa) => {
            const Icon = qa.icon;
            return (
              <Link key={qa.href} href={qa.href}>
                <a
                  className="user-card flex flex-col items-center justify-center gap-1.5 py-3.5 hover:border-[#FFDD57] active:scale-[0.97] transition"
                  data-testid={qa.testId}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FFF6D6] flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-[#7C5E00]" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">{qa.label}</span>
                </a>
              </Link>
            );
          })}
        </div>

        {/* Recent orders snapshot */}
        {userOrders && userOrders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-[#7C5E00]" /> Son Siparişler
              </h2>
              <Link href="/panel/gecmis"><a className="text-xs text-slate-500 hover:text-slate-900" data-testid="link-all-orders">Tümü ›</a></Link>
            </div>
            <div className="user-card divide-y divide-slate-100">
              {userOrders.slice(0, 3).map((o: any) => (
                <Link key={o.id} href="/panel/gecmis">
                  <a className="flex items-center gap-3 p-3 hover:bg-slate-50 transition" data-testid={`recent-order-${o.id}`}>
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">#{String(o.id).slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-slate-500 truncate">{o.createdAt ? fmtDate(o.createdAt) : ""}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 shrink-0">{fmtPrice(o.total ?? o.amount ?? 0)}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </a>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Active packages */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#7C5E00]" /> Aktif Paketleriniz
            </h2>
            {pkgs.length > 0 && <span className="text-xs text-slate-500">{pkgs.length}</span>}
          </div>

          {packagesLoading ? (
            <div className="user-card flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : sortedPkgs.length === 0 ? (
            <div className="user-card text-center py-10 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Package className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-slate-900 font-semibold text-sm mb-1">{t.dashboard.texts.noActivePackages}</p>
              <p className="text-slate-500 text-xs mb-4">{t.dashboard.texts.noActivePackagesDesc}</p>
              <Link href="/paketler">
                <a className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 text-sm font-semibold">
                  <ShoppingCart className="w-4 h-4" /> {t.dashboard.texts.buyFirstPackage}
                </a>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPkgs.map((pkg) => {
                const purchaseLabel = fmtDate(pkg.paidAt || pkg.assignedAt);
                const { daysLeft, exp, pct } = calcExpiry(pkg.paidAt || pkg.assignedAt, pkg.expiresAt);
                const urgency = daysLeft > 7 ? "ok" : daysLeft > 3 ? "warn" : "danger";
                const barColor = { ok: "bg-emerald-500", warn: "bg-amber-500", danger: "bg-rose-500" }[urgency];
                const dayColor = { ok: "text-emerald-600", warn: "text-amber-600", danger: "text-rose-600" }[urgency];

                return (
                  <div key={pkg.credentialId} className="user-card-elevated overflow-hidden" data-testid={`package-card-${pkg.credentialId}`}>
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-slate-900 leading-none">{pkg.dataLimitGb}</span>
                          <span className="text-base font-bold text-slate-500">GB</span>
                          <span className="text-slate-400 text-xs ml-1">· {pkg.planName}</span>
                        </div>
                        <span className={`chip ${daysLeft > 0 ? "chip-success" : "chip-danger"}`}>{daysLeft > 0 ? "Aktif" : "Bitti"}</span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-500">
                        <CalendarDays className="w-3 h-3" /> Satın alma: {purchaseLabel}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-500"><Clock className="w-3 h-3" /><span>Kalan süre</span></div>
                          <span className={`font-bold text-sm ${dayColor}`}>{daysLeft} gün</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-slate-400 text-xs">Bitiş: {fmtDate(exp.toISOString())}</p>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wifi className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Bağlantı Bilgileri</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Kullanıcı Adı", val: pkg.username, testId: `copy-username-${pkg.credentialId}` },
                          { label: "Şifre", val: pkg.password, testId: `copy-password-${pkg.credentialId}` },
                        ].map(({ label, val, testId }) => (
                          <div key={label} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                            <div className="min-w-0 flex-1">
                              <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                              <p className="text-slate-900 font-mono text-xs font-medium truncate">{val}</p>
                            </div>
                            <CopyBtn value={val} label={label} testId={testId} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Favorites */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" /> Favori Paketler
            </h2>
            {favorites && favorites.length > 0 && <span className="text-xs text-slate-500">{favorites.length}</span>}
          </div>

          {favoritesLoading ? (
            <div className="user-card flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : !favorites || favorites.length === 0 ? (
            <div className="user-card flex items-center gap-3 px-4 py-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-900 font-medium">{t.dashboard.sections.noFavorites ?? "Henüz favori paket yok"}</p>
                <p className="text-xs text-slate-500">Beğendiğiniz paketleri kalp ikonuyla ekleyin.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {favorites.map((fav) => (
                <div key={fav.id} className="user-card flex items-center gap-3 p-3.5" data-testid={`favorite-card-${fav.id}`}>
                  <div className="w-14 h-14 rounded-xl bg-[#FFF6D6] border border-[#FFDD57]/40 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xl font-black text-slate-900 leading-none">{fav.plan.dataLimitGb}</span>
                    <span className="text-xs text-[#7C5E00] font-semibold">GB</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-semibold text-sm truncate">{fav.plan.name}</p>
                    <p className="text-slate-500 text-xs">Starlink</p>
                    <p className="text-slate-900 font-bold text-base mt-0.5">{fmtPrice(fav.plan.priceUsd)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => addToCartMutation.mutate(fav.plan.id)} disabled={addToCartMutation.isPending} className="w-10 h-10 rounded-xl bg-[#FFDD57] hover:brightness-95 flex items-center justify-center transition disabled:opacity-50" data-testid={`button-add-cart-${fav.id}`}>
                      {addToCartMutation.isPending ? <Loader2 className="w-4 h-4 text-slate-900 animate-spin" /> : <ShoppingCart className="w-4 h-4 text-slate-900" />}
                    </button>
                    <button onClick={() => removeFavoriteMutation.mutate(fav.plan.id)} disabled={removeFavoriteMutation.isPending} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-rose-50 flex items-center justify-center transition" data-testid={`button-remove-favorite-${fav.id}`}>
                      {removeFavoriteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" /> : <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* History link */}
        <Link href="/panel/gecmis">
          <a className="user-card flex items-center gap-3 p-4 hover:border-[#FFDD57] transition" data-testid="link-history">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <History className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Sipariş Geçmişi & Süresi Bitmiş Paketler</p>
              <p className="text-xs text-slate-500">Tüm satın alma kayıtlarınızı görüntüleyin</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </Link>
      </div>
    </UserShell>
  );
}
