import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useSearch, Link } from "wouter";
import {
  Loader2, Package, History, Clock, Archive, Heart, ShoppingCart, Copy,
  ChevronLeft, ChevronRight, Wifi, Satellite, CalendarDays
} from "lucide-react";
import UserShell from "@/components/UserShell";
import { FeedbackModal, useFeedbackModal } from "@/components/FeedbackModal";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, User, Ship, FavoritePlan, Plan } from "@shared/schema";

const IST = "Europe/Istanbul";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", timeZone: IST });
const fmtPrice = (p: string | number) => `$${Number(p).toFixed(2)}`;

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

function EmptyState({ icon: Icon, title, desc, action }: { icon: any; title: string; desc: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-slate-900 font-semibold text-sm mb-1">{title}</p>
      <p className="text-slate-500 text-xs mb-5 max-w-xs">{desc}</p>
      {action && (
        <Link href={action.href}>
          <a className="px-5 py-2.5 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 text-sm font-semibold">
            {action.label}
          </a>
        </Link>
      )}
    </div>
  );
}

const TABS = [
  { key: "packages", icon: Package, labelKey: "packagesShort" },
  { key: "favorites", icon: Heart, labelKey: "favoritesShort" },
  { key: "history", icon: History, labelKey: "historyShort" },
  { key: "expired", icon: Archive, labelKey: "expiredShort" },
] as const;

export default function Panel() {
  const { user, isLoading: authLoading } = useUserAuth() as { user: User & { ship?: Ship }; isLoading: boolean };
  const { t } = useLanguage();
  const [expiredPage, setExpiredPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const expiredPageSize = 6;
  const searchString = useSearch();

  const shouldShowFeedback = useFeedbackModal(user?.id);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (user?.id && shouldShowFeedback) {
      const tm = setTimeout(() => setShowFeedback(true), 1500);
      return () => clearTimeout(tm);
    }
  }, [user?.id, shouldShowFeedback]);

  const getInitialTab = () => {
    const p = new URLSearchParams(searchString).get("tab");
    return p && ["packages", "favorites", "history", "expired"].includes(p) ? p : "packages";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);
  useEffect(() => {
    const p = new URLSearchParams(searchString).get("tab");
    if (p && ["packages", "favorites", "history", "expired"].includes(p)) setActiveTab(p);
  }, [searchString]);

  const { data: userOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/user/orders"], enabled: !!user, staleTime: 0, refetchOnMount: "always", refetchInterval: 60000,
  });
  const { data: activePackages, isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/user/active-packages"], enabled: !!user, staleTime: 0, refetchOnMount: "always", refetchInterval: 60000,
  });
  const { data: expiredPackagesData, isLoading: expiredLoading } = useQuery({
    queryKey: ["/api/user/expired-packages", expiredPage],
    queryFn: async () => {
      const r = await fetch(`/api/user/expired-packages?page=${expiredPage}&pageSize=${expiredPageSize}`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!user,
  });
  const { data: favorites, isLoading: favoritesLoading } = useQuery<(FavoritePlan & { plan: Plan })[]>({
    queryKey: ["/api/favorites"], enabled: !!user,
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

  const pkgs = activePackages as any[] | undefined;
  const tabLabel: Record<string, string> = {
    packagesShort: t.dashboard.sections.packagesShort ?? "Paketler",
    favoritesShort: t.dashboard.sections.favoritesShort ?? "Fav",
    historyShort: t.dashboard.sections.historyShort ?? "Geçmiş",
    expiredShort: t.dashboard.sections.expiredShort ?? "Bitmiş",
  };

  return (
    <UserShell title="Ana Sayfa">
      {showFeedback && user?.id && <FeedbackModal userId={user.id} onClose={() => setShowFeedback(false)} />}

      <div className="max-w-2xl mx-auto space-y-4">
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
              { label: "Aktif", value: pkgs?.length ?? 0 },
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

        {/* Tabs */}
        <div className="flex gap-1.5 bg-white border border-slate-200/70 rounded-2xl p-1.5">
          {TABS.map(({ key, icon: Icon, labelKey }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              data-testid={`tab-${key}`}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === key ? "bg-[#FFDD57] text-slate-900" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tabLabel[labelKey]}</span>
            </button>
          ))}
        </div>

        {/* Active packages */}
        {activeTab === "packages" && (
          <div className="space-y-3">
            {packagesLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : pkgs?.length ? (() => {
              const dateKey = (pkg: any) => new Date(pkg.paidAt || pkg.assignedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: IST });
              const rawKey = (pkg: any) => new Date(pkg.paidAt || pkg.assignedAt).toLocaleDateString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: IST });
              const uniqueDates = Array.from(
                new Map(pkgs.map((p: any) => [rawKey(p), { raw: rawKey(p), label: dateKey(p), ts: new Date(p.paidAt || p.assignedAt).getTime() }])).values()
              ).sort((a, b) => b.ts - a.ts);
              const filtered = selectedDate ? pkgs.filter((p: any) => rawKey(p) === selectedDate) : pkgs;
              const sorted = [...filtered].sort((a: any, b: any) => new Date(b.paidAt || b.assignedAt).getTime() - new Date(a.paidAt || a.assignedAt).getTime());

              return (
                <>
                  {uniqueDates.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                      <div className="flex items-center gap-1.5 shrink-0 text-slate-500"><CalendarDays className="w-3.5 h-3.5" /><span className="text-xs">Tarih:</span></div>
                      <button onClick={() => setSelectedDate(null)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${!selectedDate ? "bg-[#FFF6D6] border-[#FFDD57] text-[#7C5E00]" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"}`}>Tümü ({pkgs.length})</button>
                      {uniqueDates.map(({ raw, label }) => {
                        const count = pkgs.filter((p: any) => rawKey(p) === raw).length;
                        return (
                          <button key={raw} onClick={() => setSelectedDate(raw === selectedDate ? null : raw)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${selectedDate === raw ? "bg-[#FFF6D6] border-[#FFDD57] text-[#7C5E00]" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"}`}>
                            {label} {count > 1 && `(${count})`}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {sorted.map((pkg: any) => {
                    const purchaseLabel = dateKey(pkg);
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
                </>
              );
            })() : (
              <EmptyState icon={Package} title={t.dashboard.texts.noActivePackages} desc={t.dashboard.texts.noActivePackagesDesc} action={{ label: t.dashboard.texts.buyFirstPackage, href: "/paketler" }} />
            )}
          </div>
        )}

        {/* Favorites */}
        {activeTab === "favorites" && (
          <div className="space-y-3">
            {favoritesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : favorites?.length ? (
              favorites.map((fav) => (
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
              ))
            ) : (
              <EmptyState icon={Heart} title={t.dashboard.sections.noFavorites ?? "Henüz Favori Paket Yok"} desc={t.dashboard.sections.noFavoritesDesc ?? "Beğendiğiniz paketleri favorilere ekleyin."} action={{ label: t.dashboard.sections.browsePackages ?? "Paketleri Keşfet", href: "/paketler" }} />
            )}
          </div>
        )}

        {/* History */}
        {activeTab === "history" && (
          <div className="space-y-3">
            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : userOrders?.length ? (
              (userOrders as any[]).map((order: any) => {
                const isPaid = !!order.paidAt;
                const isCancelled = order.status === "cancelled";
                return (
                  <div key={order.id} className="user-card p-4" data-testid={`order-card-${order.id}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-slate-900 font-semibold text-sm">Sipariş #{order.id.slice(-8)}</p>
                        <p className="text-slate-500 text-xs">{fmtDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-bold text-sm">{fmtPrice(order.totalUsd)}</span>
                        <span className={`chip ${isCancelled ? "chip-danger" : isPaid ? "chip-success" : "chip-warning"}`}>
                          {isCancelled ? "İptal" : isPaid ? "Ödendi" : "Beklemede"}
                        </span>
                      </div>
                    </div>
                    {order.orderItems?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mt-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#FFF6D6] flex items-center justify-center">
                            <span className="text-[#7C5E00] text-xs font-bold">{item.plan?.dataLimitGb}</span>
                          </div>
                          <span className="text-slate-700 text-xs">{item.plan?.name}</span>
                        </div>
                        <span className="text-slate-700 text-xs font-medium">{fmtPrice(item.unitPriceUsd)}</span>
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              <EmptyState icon={History} title="Sipariş Geçmişi Yok" desc={t.dashboard.texts.noPurchaseHistory} />
            )}
          </div>
        )}

        {/* Expired */}
        {activeTab === "expired" && (
          <div className="space-y-3">
            {expiredLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : expiredPackagesData?.packages?.length ? (
              <>
                {expiredPackagesData.packages.map((pkg: any) => (
                  <div key={pkg.credentialId} className="user-card overflow-hidden" data-testid={`expired-package-card-${pkg.credentialId}`}>
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-14 h-14 rounded-xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xl font-black text-rose-500 leading-none">{pkg.dataLimitGb}</span>
                        <span className="text-xs text-rose-400 font-semibold">GB</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-slate-900 font-semibold text-sm truncate">{pkg.planName}</p>
                          <span className="chip chip-danger shrink-0 ml-2">Bitti</span>
                        </div>
                        <p className="text-slate-500 text-xs">Satın alma: {fmtDate(pkg.purchaseDate)}</p>
                        <p className="text-rose-500 text-xs">Bitiş: {fmtDate(pkg.expiredDate)}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono">{pkg.username}</span><span>·</span><span className="font-mono">{pkg.maskedPassword}</span>
                      </div>
                      <span className="text-slate-400 text-xs">Kullanılamaz</span>
                    </div>
                  </div>
                ))}

                {expiredPackagesData.pagination?.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 text-xs">{expiredPackagesData.pagination.currentPage} / {expiredPackagesData.pagination.totalPages} sayfa</span>
                    <div className="flex gap-2">
                      <button onClick={() => setExpiredPage(p => Math.max(1, p - 1))} disabled={expiredPackagesData.pagination.currentPage === 1} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs disabled:opacity-40 hover:bg-slate-50" data-testid="pagination-prev">
                        <ChevronLeft className="w-3.5 h-3.5" /> Önceki
                      </button>
                      <button onClick={() => setExpiredPage(p => Math.min(expiredPackagesData.pagination.totalPages, p + 1))} disabled={expiredPackagesData.pagination.currentPage === expiredPackagesData.pagination.totalPages} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs disabled:opacity-40 hover:bg-slate-50" data-testid="pagination-next">
                        Sonraki <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState icon={Archive} title={t.dashboard.texts.noExpiredPackages} desc={t.dashboard.texts.noExpiredPackagesDesc} />
            )}
          </div>
        )}
      </div>
    </UserShell>
  );
}
