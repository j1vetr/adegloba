import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Trash2, ArrowRight, Shield, Wifi, Calendar, Zap, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface CartItem {
  id: string;
  userId: string;
  planId: string;
  quantity: number;
  plan?: {
    id: string;
    name: string;
    description: string;
    dataLimitGb: number;
    priceUsd: string;
  };
}

interface CartData {
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
}

export default function Sepet() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: cartData, isLoading: cartLoading } = useQuery<CartData>({
    queryKey: ["/api/cart"],
    enabled: !!user
  });

  const removeItemMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('DELETE', `/api/cart/${planId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: t.common.removed, description: t.cart.removeSuccess });
    },
    onError: (error: any) => {
      toast({ title: t.common.error, description: error.message || "Ürün kaldırılamadı", variant: "destructive" });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/cart/checkout', {});
      return response.json();
    },
    onSuccess: (order) => {
      toast({ title: t.common.created, description: t.common.redirecting });
      window.location.href = `/checkout?orderId=${order.id}`;
    },
    onError: (error: any) => {
      toast({ title: t.common.error, description: error.message || "Sipariş oluşturulamadı", variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <UserNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  if (!user) { window.location.href = '/giris'; return null; }

  const formatPrice = (price: string | number) => {
    const n = typeof price === 'string' ? parseFloat(price) : price;
    return `$${(n || 0).toFixed(2)}`;
  };

  const item = cartData?.items?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pt-28">

        {/* Page title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingCart className="h-6 w-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">{t.cart.title}</h1>
          </div>
          <p className="text-slate-400 text-sm ml-9">{t.cart.description}</p>
        </div>

        {cartLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : !item ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-6">
              <ShoppingCart className="h-9 w-9 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{t.cart.empty}</h3>
            <p className="text-slate-400 mb-8 max-w-xs">{t.cart.emptyDescription}</p>
            <Button
              onClick={() => window.location.href = '/paketler'}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-xl"
            >
              {t.cart.browsePackages}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ── Product Card (spans 3 cols) ── */}
            <div className="lg:col-span-3">
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl shadow-cyan-900/10">

                {/* Card top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

                {/* Header row */}
                <div className="flex items-start justify-between p-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Wifi className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Starlink Maritime</p>
                      <h2 className="text-lg font-bold text-white leading-tight">{item.plan?.name || 'Veri Paketi'}</h2>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeItemMutation.mutate(item.planId)}
                    disabled={removeItemMutation.isPending}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-40"
                    title="Kaldır"
                  >
                    {removeItemMutation.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />
                    }
                  </button>
                </div>

                {/* GB display */}
                <div className="px-6 pb-5">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-6xl font-black text-white tracking-tight">{item.plan?.dataLimitGb}</span>
                    <span className="text-2xl font-bold text-cyan-400 mb-1">GB</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {item.plan?.description || 'Yüksek Hızlı Deniz İnterneti'}
                  </p>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 px-6 pb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                    <Calendar className="h-3 w-3 text-cyan-400" />
                    Ay sonuna kadar geçerli
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                    <Zap className="h-3 w-3 text-yellow-400" />
                    Anlık aktivasyon
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                    <Shield className="h-3 w-3 text-green-400" />
                    Güvenli ödeme
                  </span>
                </div>

                {/* Price footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-900/60 border-t border-slate-700/50">
                  <span className="text-sm text-slate-400">Birim fiyat</span>
                  <span className="text-2xl font-bold text-cyan-400">{formatPrice(item.plan?.priceUsd || 0)}</span>
                </div>
              </div>

              {/* Coupon hint */}
              <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <Tag className="h-4 w-4 text-green-400 shrink-0" />
                <p className="text-sm text-slate-400">
                  <span className="text-green-400 font-medium">{t.cart.couponHint}</span>
                  {' — '}{t.cart.couponDescription}
                </p>
              </div>
            </div>

            {/* ── Order Summary (spans 2 cols) ── */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-800 p-6 sticky top-24">
                <h3 className="text-base font-semibold text-white mb-5">{t.checkout.orderSummary}</h3>

                {/* Summary rows */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{t.checkout.subtotal}</span>
                    <span className="text-white font-semibold">{formatPrice(cartData?.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Kargo</span>
                    <span className="text-green-400">Ücretsiz</span>
                  </div>
                  <div className="h-px bg-slate-700 my-1" />
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">{t.checkout.total}</span>
                    <span className="text-xl font-bold text-cyan-400">{formatPrice(cartData?.subtotal || 0)}</span>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl text-base transition-all duration-200 shadow-lg shadow-cyan-900/30 hover:shadow-cyan-700/30 group"
                >
                  {checkoutMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-5 w-5 mr-2 group-hover:translate-x-0.5 transition-transform" />
                  )}
                  {checkoutMutation.isPending ? t.cart.checkoutProcessing : t.checkout.proceedToPayment}
                </Button>

                {/* Security */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Shield className="h-3.5 w-3.5 text-green-500" />
                  <span>{t.cart.securityNotice}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
