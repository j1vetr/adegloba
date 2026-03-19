import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Button } from "@/components/ui/button";
import {
  Loader2, ShoppingCart, Trash2, ArrowRight,
  Shield, Wifi, Calendar, Zap, Tag, Check,
  ChevronRight, Package, CreditCard, Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

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
      window.location.href = `/checkout?orderId=${order.id}`;
    },
    onError: (error: any) => {
      toast({ title: t.common.error, description: error.message || "Sipariş oluşturulamadı", variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080c14]">
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
    <div className="min-h-screen bg-[#080c14]">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-cyan-600/8 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-700/5 blur-[80px]" />
      </div>

      <UserNavigation />

      <div className="relative max-w-xl mx-auto px-4 sm:px-6 py-10 pt-28">

        {/* ── Step Progress ── */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {[
            { label: "Sepet", step: 1, active: true, done: false },
            { label: "Ödeme", step: 2, active: false, done: false },
            { label: "Tamamlandı", step: 3, active: false, done: false },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s.done
                    ? 'bg-green-500 text-white'
                    : s.active
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40'
                    : 'bg-slate-800 border border-slate-700 text-slate-500'
                }`}>
                  {s.done ? <Check className="h-4 w-4" /> : s.step}
                </div>
                <span className={`text-xs font-medium ${s.active ? 'text-cyan-400' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`w-16 sm:w-24 h-px mx-2 mb-5 ${i === 0 && item ? 'bg-cyan-500/40' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        {cartLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-400 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">{t.cart.loading}</p>
            </div>
          </div>

        ) : !item ? (
          /* ── Empty State ── */
          <div className="text-center py-20">
            <div className="relative inline-flex mb-8">
              <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-700/60 flex items-center justify-center">
                <ShoppingCart className="h-10 w-10 text-slate-600" />
              </div>
              <div className="absolute inset-0 rounded-3xl bg-cyan-500/5 blur-xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{t.cart.empty}</h3>
            <p className="text-slate-400 mb-10 max-w-xs mx-auto text-sm leading-relaxed">{t.cart.emptyDescription}</p>
            <Link href="/paketler">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-cyan-900/30">
                <Package className="h-4 w-4 mr-2" />
                {t.cart.browsePackages}
              </Button>
            </Link>
          </div>

        ) : (
          <>
            {/* ── Main Product Card ── */}
            <div className="relative rounded-3xl overflow-hidden border border-white/8 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-2xl shadow-black/50 backdrop-blur-sm">

              {/* Gradient header section */}
              <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-8 pt-8 pb-6 border-b border-white/5">
                {/* Glow blob behind number */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Brand tag */}
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-cyan-400 text-xs font-semibold tracking-wider uppercase">Starlink Maritime</span>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeItemMutation.mutate(item.planId)}
                    disabled={removeItemMutation.isPending}
                    className="group flex items-center gap-1.5 text-slate-600 hover:text-red-400 transition-colors text-xs"
                  >
                    {removeItemMutation.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                    }
                    <span>{t.cart.removeItem || "Kaldır"}</span>
                  </button>
                </div>

                {/* GB Hero Number */}
                <div className="relative text-center py-4">
                  <div className="inline-flex items-baseline gap-2">
                    <span className="text-8xl sm:text-9xl font-black text-white tracking-tighter leading-none" style={{ textShadow: '0 0 80px rgba(6,182,212,0.3)' }}>
                      {item.plan?.dataLimitGb}
                    </span>
                    <span className="text-3xl font-black text-cyan-400 mb-2 self-end">GB</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2 font-medium">
                    {item.plan?.name || 'Veri Paketi'}
                  </p>
                  {item.plan?.description && (
                    <p className="text-slate-600 text-xs mt-1">
                      {item.plan.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Features section */}
              <div className="px-8 py-5 border-b border-white/5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Calendar, label: t.cart.validUntilMonthEnd || "Ay sonuna kadar", color: "text-blue-400", bg: "bg-blue-500/10" },
                    { icon: Zap, label: t.cart.instantActivation || "Anlık aktivasyon", color: "text-yellow-400", bg: "bg-yellow-500/10" },
                    { icon: Shield, label: "SSL Güvenli", color: "text-green-400", bg: "bg-green-500/10" },
                  ].map(({ icon: Icon, label, color, bg }) => (
                    <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/3 border border-white/5 text-center">
                      <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <span className="text-slate-400 text-xs leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price + CTA section */}
              <div className="px-8 py-6">
                {/* Price row */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t.cart.unitPrice || "Toplam tutar"}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">{formatPrice(item.plan?.priceUsd || 0)}</span>
                      <span className="text-slate-500 text-sm">USD</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-cyan-900/40 hover:shadow-cyan-700/40 transition-all duration-200 group"
                >
                  {checkoutMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {t.cart.checkoutProcessing}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      {t.checkout?.proceedToPayment || "Ödemeye Geç"}
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>

                {/* Security row */}
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Shield className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs">{t.cart.securityNotice}</span>
                  </div>
                  <span className="text-slate-700">·</span>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Star className="h-3 w-3 text-yellow-600" />
                    <span className="text-xs">PayPal korumalı</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Coupon hint ── */}
            <div className="mt-4 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white/3 border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-green-400">{t.cart.couponHint}</p>
                <p className="text-xs text-slate-500">{t.cart.couponDescription}</p>
              </div>
            </div>

            {/* ── Bottom nav ── */}
            <div className="mt-6 flex items-center justify-center">
              <Link href="/paketler">
                <button className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 text-sm transition-colors group">
                  <ChevronRight className="h-4 w-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                  Paketlere Dön
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
