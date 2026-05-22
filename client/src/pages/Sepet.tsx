import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Loader2, ShoppingCart, Trash2, ArrowRight, Shield, Wifi, Calendar, Zap, Tag, Package, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import UserShell from "@/components/UserShell";

interface CartItem {
  id: string; userId: string; planId: string; quantity: number;
  plan?: { id: string; name: string; description: string; dataLimitGb: number; priceUsd: string };
}
interface CartData { items: CartItem[]; subtotal: number; total: number; itemCount: number; }

export default function Sepet() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: cartData, isLoading: cartLoading } = useQuery<CartData>({
    queryKey: ["/api/cart"], enabled: !!user,
  });

  const removeItemMutation = useMutation({
    mutationFn: async (planId: string) => (await apiRequest("DELETE", `/api/cart/${planId}`)).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cart"] }); toast({ title: t.common.removed, description: t.cart.removeSuccess }); },
    onError: (error: any) => toast({ title: t.common.error, description: error.message || t.cart.removeError, variant: "destructive" }),
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/cart/checkout", {})).json(),
    onSuccess: (order) => { window.location.href = `/checkout?orderId=${order.id}`; },
    onError: (error: any) => toast({ title: t.common.error, description: error.message || t.cart.checkoutError, variant: "destructive" }),
  });

  if (authLoading) {
    return <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }
  if (!user) { window.location.href = "/giris"; return null; }

  const formatPrice = (price: string | number) => {
    const n = typeof price === "string" ? parseFloat(price) : price;
    return `$${(n || 0).toFixed(2)}`;
  };
  const item = cartData?.items?.[0];

  return (
    <UserShell title={t.cart.stepCart}>
      <div className="space-y-4">
        {/* Step progress */}
        <div className="flex items-center justify-center gap-0">
          {[
            { label: t.cart.stepCart, step: 1, active: true },
            { label: t.cart.stepCheckout, step: 2, active: false },
            { label: t.cart.stepDone, step: 3, active: false },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  s.active ? "bg-[#FFDD57] text-slate-900" : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}>
                  {s.step}
                </div>
                <span className={`text-xs font-medium ${s.active ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
              </div>
              {i < 2 && <div className={`w-12 sm:w-16 h-px mx-2 mb-5 ${i === 0 && item ? "bg-[#FFDD57]" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        {cartLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
          </div>
        ) : !item ? (
          <div className="user-card-elevated text-center py-12 px-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t.cart.empty}</h3>
            <p className="text-slate-500 text-sm mb-5">{t.cart.emptyDescription}</p>
            <Link href="/paketler">
              <a className="inline-flex items-center gap-2 px-5 h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm">
                <Package className="h-4 w-4" /> {t.cart.browsePackages}
              </a>
            </Link>
          </div>
        ) : (
          <>
            <div className="user-card-elevated overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="chip chip-brand"><Wifi className="h-3 w-3" /> STARLINK MARITIME</span>
                  <button
                    onClick={() => removeItemMutation.mutate(item.planId)}
                    disabled={removeItemMutation.isPending}
                    className="flex items-center gap-1 text-slate-400 hover:text-rose-500 text-xs transition"
                  >
                    {removeItemMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    <span>{t.cart.removeItem || "Kaldır"}</span>
                  </button>
                </div>

                <div className="text-center py-3">
                  <div className="inline-flex items-baseline gap-2">
                    <span className="text-7xl font-black text-slate-900 leading-none tracking-tight">{item.plan?.dataLimitGb}</span>
                    <span className="text-2xl font-black text-slate-500 self-end mb-1">GB</span>
                  </div>
                  <p className="text-slate-700 text-sm mt-2 font-semibold">{item.plan?.name || "Veri Paketi"}</p>
                  {item.plan?.description && <p className="text-slate-500 text-xs mt-1">{item.plan.description}</p>}
                </div>
              </div>

              <div className="px-5 py-4 border-b border-slate-100">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Calendar, label: t.cart.validUntilMonthEnd },
                    { icon: Zap, label: t.cart.instantActivation },
                    { icon: Shield, label: t.cart.sslSecure },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <Icon className="h-4 w-4 text-[#7C5E00]" />
                      <span className="text-slate-600 text-xs leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">{t.cart.unitPrice}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{formatPrice(item.plan?.priceUsd || 0)}</span>
                      <span className="text-slate-400 text-sm">USD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="user-card flex items-center gap-3 p-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700">{t.cart.couponHint}</p>
                <p className="text-xs text-slate-500">{t.cart.couponDescription}</p>
              </div>
            </div>

            <div className="text-center pb-2">
              <Link href="/paketler">
                <a className="text-slate-500 hover:text-slate-900 text-sm">{t.cart.backToPackages}</a>
              </Link>
            </div>

            {/* Sticky bottom CTA (sits above bottom nav) */}
            <div className="fixed left-0 right-0 z-30 bg-white border-t border-slate-200/70" style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}>
              <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 leading-none">{t.cart.totalLabel}</p>
                  <p className="text-xl font-black text-slate-900 leading-tight">{formatPrice(item.plan?.priceUsd || 0)}<span className="text-xs text-slate-400 font-normal ml-1">USD</span></p>
                </div>
                <button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  className="shrink-0 inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm transition active:scale-[0.99] disabled:opacity-60"
                  data-testid="button-checkout-sticky"
                >
                  {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CreditCard className="h-4 w-4" /> {t.cart.proceedToCheckout} <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </UserShell>
  );
}
