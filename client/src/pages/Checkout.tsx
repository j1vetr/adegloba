import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, Tag, Trash2, CheckCircle, Shield, Package, ChevronDown, ChevronUp, Lock, Wifi, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from "@/hooks/useUserAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import CreditCardDrawer from "@/components/CreditCardDrawer";

export default function Checkout() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [creditCardDrawerOpen, setCreditCardDrawerOpen] = useState(false);

  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const orderId = urlParams.get('orderId');

  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user && !orderId
  });

  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId && !!user
  });

  useEffect(() => {
    if (orderData && (orderData as any).couponCode && !appliedCoupon) {
      validateCouponMutation.mutate((orderData as any).couponCode);
    }
  }, [orderData]);

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      setCouponValidating(true);
      const subtotal = getCurrentSubtotal();
      const items = getCurrentItems();
      const planIds = items.map((item: any) => item.planId || item.plan?.id).filter(Boolean);
      const response = await apiRequest('POST', '/api/coupons/validate', {
        code: code.trim().toUpperCase(), shipId: user?.ship_id, subtotal, planIds
      });
      return response.json();
    },
    onSuccess: (result) => {
      setCouponValidating(false);
      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon);
        setDiscount(result.discount_amount || 0);
        if (couponCode.trim()) {
          const discountText = result.coupon.discountType === 'percentage'
            ? `%${result.coupon.discountValue} indirim`
            : `$${result.coupon.discountValue} indirim`;
          toast({ title: t.checkout.couponApplied, description: `"${result.coupon.code}" — ${discountText}` });
        }
      } else {
        setAppliedCoupon(null); setDiscount(0);
        if (couponCode.trim()) {
          toast({ title: "Kupon Uygulanamadı", description: getDetailedErrorMessage(result.reason || result.message), variant: "destructive" });
        }
      }
    },
    onError: (error: any) => {
      setCouponValidating(false); setAppliedCoupon(null); setDiscount(0);
      if (couponCode.trim()) {
        toast({ title: "Kupon Hatası", description: error.message || "Kupon doğrulanamadı", variant: "destructive" });
      }
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (paypalOrderId: string) => {
      const endpoint = orderId ? `/api/orders/${orderId}/complete` : '/api/cart/complete-payment';
      const response = await apiRequest('POST', endpoint, { paypalOrderId, couponCode: appliedCoupon?.code });
      return response.json();
    },
    onSuccess: (result) => {
      toast({ title: "Ödeme Başarılı", description: "Siparişiniz başarıyla tamamlandı!" });
      if (!orderId) queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      window.location.href = `/order-success?orderId=${result.id || result.orderId}`;
    },
    onError: (error: any) => {
      toast({ title: "Ödeme Başarısız", description: error.message || "Ödeme işlemi başarısız oldu", variant: "destructive" });
    },
  });

  const getDetailedErrorMessage = (reason: string) => {
    const map: Record<string, string> = {
      not_found: "Bu kupon kodu geçerli değil.",
      inactive: "Bu kupon şu anda aktif değil.",
      expired: "Bu kuponun süresi dolmuş.",
      not_started: "Bu kupon henüz geçerli değil.",
      usage_limit_reached: "Bu kuponun kullanım limiti dolmuş.",
      single_use_already_used: "Bu kuponu daha önce kullandınız.",
      minimum_order_not_met: "Minimum sipariş tutarı karşılanmıyor.",
      scope_ship_mismatch: "Bu kupon seçtiğiniz gemiye uygulanamaz.",
      scope_package_mismatch: "Bu kupon sepetinizdeki paketlere uygulanamaz.",
    };
    return map[reason] || reason || "Kupon geçerli değil.";
  };

  const removeCoupon = () => {
    setAppliedCoupon(null); setDiscount(0); setCouponCode("");
    toast({ title: "Kupon Kaldırıldı", description: "İndirim iptal edildi." });
  };

  const getCurrentSubtotal = () => {
    if (orderId && orderData) {
      const s = parseFloat((orderData as any)?.subtotalUsd || '0');
      return s > 0 ? s : parseFloat((orderData as any)?.total || '0');
    }
    return parseFloat((cartData as any)?.subtotal || '0');
  };

  const getCurrentItems = () => {
    if (orderId && orderData) return (orderData as any)?.items || [];
    return (cartData as any)?.items || [];
  };

  const currentSubtotal = getCurrentSubtotal();
  const currentDiscount = appliedCoupon ? discount : 0;
  const currentTotal = Math.max(0, currentSubtotal - currentDiscount);

  const finalTotal = (orderId && orderData && (orderData as any).total && !appliedCoupon)
    ? parseFloat((orderData as any).total)
    : currentTotal;

  const formatPrice = (price: string | number) => {
    const n = typeof price === 'string' ? parseFloat(price) : price;
    return `$${n.toFixed(2)}`;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      toast({ title: "Giriş Gerekli", description: "Ödeme yapmak için giriş yapmalısınız", variant: "destructive" });
      setTimeout(() => { window.location.href = '/giris'; }, 1500);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && !cartLoading && !orderLoading && user) {
      const items = getCurrentItems();
      if (!orderId && (!cartData || items.length === 0)) {
        setTimeout(() => { window.location.href = '/paketler'; }, 1500);
      }
    }
  }, [cartData, orderData, orderId, authLoading, cartLoading, orderLoading, user]);

  if (authLoading || cartLoading || orderLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <UserNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-slate-300">{t.checkout.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const items = getCurrentItems();
  if (items.length === 0) return null;

  const item = items[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pt-28">

        {/* Compact header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Lock className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t.checkout.title}</h1>
            <p className="text-sm text-slate-400">{t.checkout.description}</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <Shield className="h-3.5 w-3.5 text-green-500" />
            <span>SSL Güvenli</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: Payment section (3 cols) ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Payment methods card */}
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
              {/* Top bar */}
              <div className="h-0.5 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

              <div className="p-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
                  {t.checkout.securePayment}
                </h2>

                {finalTotal > 0 ? (
                  <div className="space-y-3">
                    {/* Credit card button — main CTA */}
                    <Button
                      onClick={() => setCreditCardDrawerOpen(true)}
                      className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-base rounded-xl shadow-lg shadow-blue-900/30 hover:shadow-blue-700/30 transition-all duration-200 flex items-center justify-center gap-3"
                      data-testid="credit-card-button"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>{t.checkout.cardPayment}</span>
                      <span className="ml-auto text-blue-300 font-bold">{formatPrice(finalTotal)}</span>
                    </Button>

                    {/* 3D Secure badge */}
                    <div className="flex items-center justify-center gap-2 py-2">
                      <Shield className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-xs text-slate-500">{t.checkout.secure3D || '3D Secure korumalı ödeme'}</span>
                    </div>

                    {/* Card type icons */}
                    <div className="flex items-center justify-center gap-3 pt-1">
                      {['VISA', 'MC', 'AMEX'].map(brand => (
                        <div key={brand} className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400 font-semibold tracking-wide">
                          {brand}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Free order button */
                  <Button
                    onClick={() => completeOrderMutation.mutate('')}
                    disabled={completeOrderMutation.isPending}
                    className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold text-base rounded-xl"
                    data-testid="free-checkout-button"
                  >
                    {completeOrderMutation.isPending
                      ? <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      : <CheckCircle className="h-5 w-5 mr-2" />
                    }
                    Ücretsiz Siparişi Tamamla
                  </Button>
                )}
              </div>
            </div>

            {/* Coupon section — collapsible */}
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
              <button
                onClick={() => setCouponOpen(!couponOpen)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-800/40 transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-slate-300">{t.checkout.couponCode}</span>
                  {appliedCoupon && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
                      {appliedCoupon.code}
                    </span>
                  )}
                </div>
                {couponOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>

              {couponOpen && (
                <div className="px-6 pb-5 space-y-3 border-t border-slate-700/50">
                  <div className="flex gap-2 pt-4">
                    <Input
                      type="text"
                      placeholder={t.checkout.couponPlaceholder}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon}
                      onKeyDown={(e) => e.key === 'Enter' && !appliedCoupon && couponCode.trim() && validateCouponMutation.mutate(couponCode)}
                      className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 uppercase text-sm"
                      data-testid="checkout-coupon-input"
                    />
                    <Button
                      onClick={appliedCoupon ? removeCoupon : () => validateCouponMutation.mutate(couponCode)}
                      disabled={couponValidating || validateCouponMutation.isPending || (!appliedCoupon && !couponCode.trim())}
                      className={`shrink-0 px-4 text-sm font-semibold ${appliedCoupon ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
                      data-testid={appliedCoupon ? "remove-coupon-button" : "apply-coupon-button"}
                    >
                      {(couponValidating || validateCouponMutation.isPending)
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : appliedCoupon ? "Kaldır" : t.checkout.apply
                      }
                    </Button>
                  </div>

                  {appliedCoupon && (
                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/25 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                        <div>
                          <p className="text-sm text-green-400 font-medium">"{appliedCoupon.code}" uygulandı</p>
                          <p className="text-xs text-green-300/70">
                            {appliedCoupon.discountType === 'percentage'
                              ? `%${appliedCoupon.discountValue} indirim`
                              : `$${appliedCoupon.discountValue} indirim`
                            }
                          </p>
                        </div>
                      </div>
                      <span className="text-green-400 font-bold text-sm">-{formatPrice(currentDiscount)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Order summary (2 cols, sticky) ── */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-800 sticky top-24 overflow-hidden">
              <div className="h-0.5 w-full bg-gradient-to-r from-slate-700 to-slate-600" />

              <div className="p-5">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  {t.checkout.orderDetails}
                </h3>

                {/* Product row */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Wifi className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{item?.plan?.name || item?.plan?.title || 'Veri Paketi'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-slate-400">{item?.plan?.dataLimitGb || item?.plan?.gbAmount}GB</span>
                      <span className="text-slate-600">•</span>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>Ay sonu</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-cyan-400 shrink-0">
                    {formatPrice(item?.unitPriceUsd || item?.plan?.priceUsd || 0)}
                  </span>
                </div>

                {/* Price breakdown */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{t.checkout.subtotal}</span>
                    <span className="text-white" data-testid="checkout-subtotal">{formatPrice(currentSubtotal)}</span>
                  </div>

                  {currentDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400 flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {t.checkout.couponDiscount}
                      </span>
                      <span className="text-green-400 font-semibold" data-testid="checkout-discount">-{formatPrice(currentDiscount)}</span>
                    </div>
                  )}

                  <div className="h-px bg-slate-700" />

                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">{t.checkout.total}</span>
                    <span className="text-xl font-bold text-cyan-400" data-testid="checkout-total">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* Validity note */}
                <div className="mt-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 text-xs text-slate-500 text-center leading-relaxed">
                  Paketler satın alınan ayın sonuna kadar geçerlidir
                </div>

                {/* SSL badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-600">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>{t.checkout.secureSsl}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Credit Card Drawer */}
      <CreditCardDrawer
        isOpen={creditCardDrawerOpen}
        onClose={() => setCreditCardDrawerOpen(false)}
        amount={finalTotal.toFixed(2)}
        currency="USD"
        onSuccess={(paymentData) => {
          setCreditCardDrawerOpen(false);
          toast({ title: "Ödeme Başarılı", description: "Kredi kartı ödemesi başarıyla tamamlandı!" });
          completeOrderMutation.mutate(paymentData.paypalOrderId || paymentData.orderId || 'card_payment_' + Date.now());
        }}
        onError={(error) => {
          toast({ title: "Ödeme Hatası", description: error?.message || "Kart ödemesi başarısız oldu", variant: "destructive" });
        }}
      />
    </div>
  );
}
