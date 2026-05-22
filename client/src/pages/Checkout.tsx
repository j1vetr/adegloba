import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, CreditCard, Tag, CheckCircle, Shield, ChevronDown, ChevronUp, Lock, Wifi, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from "@/hooks/useUserAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import CreditCardDrawer from "@/components/CreditCardDrawer";
import UserShell from "@/components/UserShell";

interface CartItem {
  id: string; planId?: string; quantity: number; unitPriceUsd?: string;
  plan?: { id: string; name?: string; title?: string; dataLimitGb?: number; gbAmount?: number; priceUsd?: string };
}
interface CartData { items: CartItem[]; itemCount: number; subtotal: number | string; total: number | string; }
interface OrderData {
  items?: CartItem[]; couponCode?: string;
  subtotalUsd?: string; total?: string;
}

export default function Checkout() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountType: string; discountValue: number } | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [creditCardDrawerOpen, setCreditCardDrawerOpen] = useState(false);

  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const orderId = urlParams.get("orderId");

  const { data: cartData, isLoading: cartLoading } = useQuery<CartData>({
    queryKey: ["/api/cart"], enabled: !!user && !orderId,
  });
  const { data: orderData, isLoading: orderLoading } = useQuery<OrderData>({
    queryKey: [`/api/orders/${orderId}`], enabled: !!orderId && !!user,
  });

  useEffect(() => {
    if (orderData?.couponCode && !appliedCoupon) {
      validateCouponMutation.mutate(orderData.couponCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData]);

  const getCurrentSubtotal = (): number => {
    if (orderId && orderData) {
      const s = parseFloat(orderData.subtotalUsd || "0");
      return s > 0 ? s : parseFloat(orderData.total || "0");
    }
    return parseFloat(String(cartData?.subtotal ?? "0"));
  };
  const getCurrentItems = (): CartItem[] => {
    if (orderId && orderData) return orderData.items || [];
    return cartData?.items || [];
  };

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      setCouponValidating(true);
      const subtotal = getCurrentSubtotal();
      const items = getCurrentItems();
      const planIds = items.map(it => it.planId || it.plan?.id).filter(Boolean);
      const response = await apiRequest("POST", "/api/coupons/validate", {
        code: code.trim().toUpperCase(), shipId: user?.ship_id, subtotal, planIds,
      });
      return response.json();
    },
    onSuccess: (result) => {
      setCouponValidating(false);
      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon);
        setDiscount(result.discount_amount || 0);
        if (couponCode.trim()) {
          const dt = result.coupon.discountType === "percentage" ? `%${result.coupon.discountValue} ${t.checkout.couponDiscount}` : `$${result.coupon.discountValue} ${t.checkout.couponDiscount}`;
          toast({ title: t.checkout.couponApplied, description: `"${result.coupon.code}" — ${dt}` });
        }
      } else {
        setAppliedCoupon(null); setDiscount(0);
        if (couponCode.trim()) {
          toast({ title: t.checkout.couponNotApplied, description: getDetailedErrorMessage(result.reason || result.message), variant: "destructive" });
        }
      }
    },
    onError: (error: Error) => {
      setCouponValidating(false); setAppliedCoupon(null); setDiscount(0);
      if (couponCode.trim()) toast({ title: t.checkout.couponErrorMsg, description: error.message || t.checkout.couponValidationError, variant: "destructive" });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (paypalOrderId: string) => {
      const endpoint = orderId ? `/api/orders/${orderId}/complete` : "/api/cart/complete-payment";
      return (await apiRequest("POST", endpoint, { paypalOrderId, couponCode: appliedCoupon?.code })).json();
    },
    onSuccess: (result) => {
      toast({ title: t.checkout.paymentSuccess, description: t.checkout.paymentSuccessDesc });
      if (!orderId) queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      window.location.href = `/order-success?orderId=${result.id || result.orderId}`;
    },
    onError: (error: Error) => toast({ title: t.checkout.paymentFailed, description: error.message || t.checkout.paymentFailedDesc, variant: "destructive" }),
  });

  const getDetailedErrorMessage = (reason: string) => {
    const map: Record<string, string> = {
      not_found: "Bu kupon kodu geçerli değil.", inactive: "Bu kupon şu anda aktif değil.",
      expired: "Bu kuponun süresi dolmuş.", not_started: "Bu kupon henüz geçerli değil.",
      usage_limit_reached: "Bu kuponun kullanım limiti dolmuş.", single_use_already_used: "Bu kuponu daha önce kullandınız.",
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

  const currentSubtotal = getCurrentSubtotal();
  const currentDiscount = appliedCoupon ? discount : 0;
  const currentTotal = Math.max(0, currentSubtotal - currentDiscount);
  const finalTotal = (orderId && orderData?.total && !appliedCoupon)
    ? parseFloat(orderData.total) : currentTotal;

  const formatPrice = (price: string | number) => {
    const n = typeof price === "string" ? parseFloat(price) : price;
    return `$${n.toFixed(2)}`;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      toast({ title: t.checkout.loginRequired, description: t.checkout.loginRequiredDesc, variant: "destructive" });
      setTimeout(() => { window.location.href = "/giris"; }, 1500);
    }
  }, [user, authLoading, toast]);

  useEffect(() => {
    if (!authLoading && !cartLoading && !orderLoading && user) {
      const items = getCurrentItems();
      if (!orderId && (!cartData || items.length === 0)) {
        setTimeout(() => { window.location.href = "/paketler"; }, 1500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartData, orderData, orderId, authLoading, cartLoading, orderLoading, user]);

  if (authLoading || cartLoading || orderLoading) {
    return (
      <UserShell title={t.cart.stepCheckout} hideBottomNav showBack backTo="/sepet">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-3" />
          <p className="text-slate-500 text-sm">{t.checkout.loading}</p>
        </div>
      </UserShell>
    );
  }
  if (!user) return null;
  const items = getCurrentItems();
  if (items.length === 0) return null;
  const item = items[0];

  return (
    <UserShell title={t.cart.stepCheckout} hideBottomNav showBack backTo="/sepet">
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 text-xs">
          {[t.cart.stepCart, t.cart.stepCheckout, t.cart.stepDone].map((s, i) => {
            const isActive = i === 1;
            const isPast = i < 1;
            return (
              <div key={s} className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 ${isActive ? "text-slate-900 font-semibold" : isPast ? "text-slate-700" : "text-slate-400"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? "bg-[#FFDD57] text-slate-900" : isPast ? "bg-slate-300 text-slate-700" : "bg-slate-200 text-slate-500"
                  }`}>
                    {i + 1}
                  </span>
                  {s}
                </span>
                {i < 2 && <span className={`w-4 h-px ${isPast ? "bg-slate-300" : "bg-slate-200"}`} />}
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="user-card-elevated p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.checkout.orderDetails}</h3>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#FFF6D6] flex items-center justify-center shrink-0">
              <Wifi className="h-4 w-4 text-[#7C5E00]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{item?.plan?.name || item?.plan?.title || t.packages.highSpeedData}</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                <span>{item?.plan?.dataLimitGb || item?.plan?.gbAmount}GB</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {t.cart.monthEndExpiry}</span>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-900 shrink-0">{formatPrice(item?.unitPriceUsd || item?.plan?.priceUsd || 0)}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">{t.checkout.subtotal}</span><span className="text-slate-900" data-testid="checkout-subtotal">{formatPrice(currentSubtotal)}</span></div>
            {currentDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-emerald-600 inline-flex items-center gap-1"><Tag className="h-3 w-3" />{t.checkout.couponDiscount}</span>
                <span className="text-emerald-600 font-semibold" data-testid="checkout-discount">-{formatPrice(currentDiscount)}</span>
              </div>
            )}
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between items-center">
              <span className="text-slate-900 font-semibold">{t.checkout.total}</span>
              <span className="text-xl font-bold text-slate-900" data-testid="checkout-total">{formatPrice(finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* Coupon */}
        <div className="user-card overflow-hidden">
          <button onClick={() => setCouponOpen(!couponOpen)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900">{t.checkout.couponCode}</span>
              {appliedCoupon && <span className="chip chip-success">{appliedCoupon.code}</span>}
            </div>
            {couponOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {couponOpen && (
            <div className="px-4 pb-4 pt-3 space-y-3 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.checkout.couponPlaceholder}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon}
                  onKeyDown={(e) => e.key === "Enter" && !appliedCoupon && couponCode.trim() && validateCouponMutation.mutate(couponCode)}
                  className="user-input flex-1 h-11 px-3 text-sm uppercase"
                  data-testid="checkout-coupon-input"
                />
                <button
                  onClick={appliedCoupon ? removeCoupon : () => validateCouponMutation.mutate(couponCode)}
                  disabled={couponValidating || validateCouponMutation.isPending || (!appliedCoupon && !couponCode.trim())}
                  className={`shrink-0 px-4 h-11 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${appliedCoupon ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-[#FFDD57] hover:brightness-95 text-slate-900"}`}
                  data-testid={appliedCoupon ? "remove-coupon-button" : "apply-coupon-button"}
                >
                  {(couponValidating || validateCouponMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : appliedCoupon ? t.checkout.removeCoupon : t.checkout.apply}
                </button>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm text-emerald-700 font-medium">"{appliedCoupon.code}" {t.checkout.couponAppliedSuffix}</p>
                      <p className="text-xs text-emerald-600">
                        {appliedCoupon.discountType === "percentage" ? `%${appliedCoupon.discountValue} ${t.checkout.couponDiscount}` : `$${appliedCoupon.discountValue} ${t.checkout.couponDiscount}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-emerald-600 font-bold text-sm">-{formatPrice(currentDiscount)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="user-card-elevated p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{t.checkout.securePayment}</h2>

          {finalTotal > 0 ? (
            <div className="space-y-4">
              <button
                onClick={() => setCreditCardDrawerOpen(true)}
                className="w-full h-14 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-bold text-base transition active:scale-[0.99] flex items-center justify-between px-5"
                data-testid="credit-card-button"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t.checkout.payWithCard}
                </span>
                <span className="font-black tabular-nums">{formatPrice(finalTotal)}</span>
              </button>

              <div className="flex items-center justify-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-600" /> SSL</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3 text-emerald-600" /> 3D Secure</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-600" /> PCI DSS</span>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                {["VISA", "MC", "AMEX"].map(brand => (
                  <div key={brand} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-semibold tracking-wide">{brand}</div>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => completeOrderMutation.mutate("")}
              disabled={completeOrderMutation.isPending}
              className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2"
              data-testid="free-checkout-button"
            >
              {completeOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {t.checkout.freeOrder}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          {t.checkout.monthEndNote}
        </p>
      </div>

      <CreditCardDrawer
        isOpen={creditCardDrawerOpen}
        onClose={() => setCreditCardDrawerOpen(false)}
        amount={finalTotal.toFixed(2)}
        currency="USD"
        onSuccess={(paymentData) => {
          setCreditCardDrawerOpen(false);
          toast({ title: t.checkout.paymentSuccess, description: t.checkout.paymentSuccessCard });
          completeOrderMutation.mutate(paymentData?.paypalOrderId || paymentData?.orderId || "card_payment_" + Date.now());
        }}
        onError={(error) => {
          toast({ title: t.checkout.paymentError, description: error?.message || t.checkout.paymentFailedDesc, variant: "destructive" });
        }}
      />
    </UserShell>
  );
}
