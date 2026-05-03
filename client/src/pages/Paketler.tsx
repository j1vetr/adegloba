import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Zap, CreditCard, Heart, Wifi, Shield, Clock, ShoppingCart, Trash2, Check, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Link } from "wouter";
import UserShell from "@/components/UserShell";
import type { Plan, FavoritePlan } from "@shared/schema";

type PlanWithStock = Plan & { availableStock: number; inStock: boolean };

export default function Paketler() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [cartFullDialog, setCartFullDialog] = useState<{ open: boolean; pendingPlanId: string | null }>({ open: false, pendingPlanId: null });
  const [addedSheet, setAddedSheet] = useState<{ open: boolean; plan: PlanWithStock | null }>({ open: false, plan: null });

  const { data: userShipPlans, isLoading: plansLoading } = useQuery<PlanWithStock[]>({
    queryKey: ["/api/user/ship-plans"], enabled: !!user?.ship_id,
  });
  const { data: favorites } = useQuery<(FavoritePlan & { plan: Plan })[]>({
    queryKey: ["/api/favorites"], enabled: !!user,
  });
  const favoriteIds = new Set(favorites?.map(f => f.planId) || []);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ planId, isFavorite }: { planId: string; isFavorite: boolean }) => {
      if (isFavorite) await apiRequest("DELETE", `/api/favorites/${planId}`);
      else await apiRequest("POST", `/api/favorites/${planId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/favorites"] }),
    onError: () => toast({ title: t.packages.error, description: t.packages.favoriteError || "Favori işlemi başarısız", variant: "destructive" }),
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", "/api/cart"); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }),
  });

  const addToCartMutation = useMutation({
    mutationFn: async (planId: string) => {
      const r = await apiRequest("POST", "/api/cart", { planId, quantity: 1 });
      return { data: await r.json(), planId };
    },
    onSuccess: ({ planId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      const plan = sortedPlans?.find((p) => p.id === planId) || null;
      setAddedSheet({ open: true, plan });
    },
    onError: (error: any, planId: string) => {
      const msg: string = error.message || "";
      if (msg.toLowerCase().includes("sepet") || msg.toLowerCase().includes("cart") || msg.toLowerCase().includes("already") || msg.toLowerCase().includes("limit")) {
        setCartFullDialog({ open: true, pendingPlanId: planId });
      } else {
        toast({ title: t.packages.error, description: msg || "Sepete eklenemedi", variant: "destructive" });
      }
    },
  });

  const handleClearAndAdd = async () => {
    const planId = cartFullDialog.pendingPlanId;
    if (!planId) return;
    setCartFullDialog({ open: false, pendingPlanId: null });
    await clearCartMutation.mutateAsync();
    addToCartMutation.mutate(planId);
  };

  const sortedPlans = userShipPlans?.slice().sort((a, b) => a.dataLimitGb - b.dataLimitGb);

  if (authLoading) {
    return <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }
  if (!user) { window.location.href = "/giris"; return null; }

  return (
    <UserShell title={t.packages.dataPackages}>
      <div className="space-y-4">
        {/* Header */}
        <div className="user-card-elevated p-5 text-center">
          <div className="inline-flex items-center gap-1.5 chip chip-brand mb-3">
            <Wifi className="w-3 h-3" /> Starlink Maritime
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">{t.packages.dataPackages}</h1>
          <p className="text-sm text-slate-500">Geminize özel paketler. Ay sonuna kadar geçerli.</p>
        </div>

        {/* Plans */}
        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-3 text-slate-500 text-sm">{t.packages.loadingPackages}</span>
          </div>
        ) : sortedPlans?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedPlans.map((plan) => {
              const isFav = favoriteIds.has(plan.id);
              const isLoading = addToCartMutation.isPending;
              return (
                <div
                  key={plan.id}
                  className="user-card-elevated relative p-5 flex flex-col"
                  data-testid={`plan-card-${plan.id}`}
                >
                  <button
                    onClick={() => toggleFavoriteMutation.mutate({ planId: plan.id, isFavorite: isFav })}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 transition"
                    data-testid={`button-favorite-${plan.id}`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500 text-rose-500" : "text-slate-300 hover:text-rose-400"}`} />
                  </button>

                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{plan.name}</p>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-5xl font-black text-slate-900 leading-none">{plan.dataLimitGb}</span>
                    <span className="text-xl font-bold text-slate-500 ml-1">GB</span>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 min-h-[16px]">
                    {plan.description || t.packages.highSpeedData}
                  </p>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600"><Clock className="w-3.5 h-3.5 text-slate-400" /><span>{t.packages.monthEndValidity}</span></div>
                    <div className="flex items-center gap-2 text-xs text-slate-600"><Zap className="w-3.5 h-3.5 text-slate-400" /><span>{t.packages.starlinkTech}</span></div>
                    <div className="flex items-center gap-2 text-xs text-slate-600"><Shield className="w-3.5 h-3.5 text-slate-400" /><span>Anlık aktivasyon</span></div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <div>
                      <span className="text-xl font-bold text-slate-900">${Number(plan.priceUsd).toFixed(2)}</span>
                      <span className="text-xs text-slate-400 ml-1">USD</span>
                    </div>
                    <button
                      onClick={() => addToCartMutation.mutate(plan.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm transition active:scale-[0.99] disabled:opacity-50"
                      data-testid={`button-buy-${plan.id}`}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /><span>{t.packages.addToCart}</span></>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="user-card text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{t.packages.noPackagesTitle}</h3>
            <p className="text-slate-500 text-sm mb-1">{t.packages.noPackagesDesc}</p>
            <p className="text-slate-400 text-xs">{t.packages.contactAdmin}</p>
          </div>
        )}

        {/* Bottom features */}
        {sortedPlans && sortedPlans.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {[
              { icon: Zap, label: t.packages.highSpeedTitle, sub: t.packages.highSpeedDesc },
              { icon: Shield, label: t.packages.flexiblePackagesTitle, sub: t.packages.flexiblePackagesDesc },
              { icon: Wifi, label: t.packages.shipSpecificTitle, sub: t.packages.shipSpecificDesc },
            ].map(({ icon: Icon, label, sub }, i) => (
              <div key={i} className="user-card flex flex-col items-center text-center p-3.5">
                <Icon className="w-5 h-5 text-[#7C5E00] mb-1.5" />
                <p className="text-slate-900 text-xs font-semibold mb-0.5">{label}</p>
                <p className="text-slate-500 text-xs leading-relaxed hidden sm:block">{sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add-to-cart confirmation bottom sheet */}
      {addedSheet.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="added-to-cart-sheet">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setAddedSheet({ open: false, plan: null })} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="mx-auto w-12 h-1 rounded-full bg-slate-200 mb-4 sm:hidden" />
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">{t.packages.addedToCart || "Sepete Eklendi"}</h3>
            {addedSheet.plan && (
              <p className="text-sm text-slate-500 text-center mb-5">
                <span className="font-semibold text-slate-900">{addedSheet.plan.dataLimitGb}GB</span> · {addedSheet.plan.name}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAddedSheet({ open: false, plan: null })}
                className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
                data-testid="button-continue-shopping"
              >
                Alışverişe Devam
              </button>
              <Link href="/sepet">
                <a
                  onClick={() => setAddedSheet({ open: false, plan: null })}
                  className="h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.99]"
                  data-testid="button-go-to-cart"
                >
                  Sepete Git <ArrowRight className="h-4 w-4" />
                </a>
              </Link>
            </div>
          </div>
        </div>
      )}

      {cartFullDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setCartFullDialog({ open: false, pendingPlanId: null })} />
          <div className="relative w-full max-w-md user-card-elevated overflow-hidden">
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <ShoppingCart className="h-7 w-7 text-amber-600" />
                </div>
              </div>
              <div className="text-center mb-5">
                <h2 className="text-lg font-bold text-slate-900 mb-2">{t.cart.cartFullTitle || "Sepetinizde Zaten Bir Paket Var"}</h2>
                <p className="text-slate-500 text-sm">{t.cart.cartFullDesc || "Yeni bir paket eklemek için önce mevcut paketi satın alın ya da sepetinizi temizleyin."}</p>
              </div>
              <div className="space-y-2">
                <Link href="/sepet">
                  <a onClick={() => setCartFullDialog({ open: false, pendingPlanId: null })} className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm">
                    <ShoppingCart className="h-4 w-4" /> {t.cart.cartFullGoToCart || "Sepete Git"}
                  </a>
                </Link>
                <button
                  onClick={handleClearAndAdd}
                  disabled={clearCartMutation.isPending || addToCartMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-sm transition"
                >
                  {(clearCartMutation.isPending || addToCartMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {t.cart.cartFullClearAndAdd || "Sepeti Temizle ve Ekle"}
                </button>
                <button onClick={() => setCartFullDialog({ open: false, pendingPlanId: null })} className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-2">
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UserShell>
  );
}
