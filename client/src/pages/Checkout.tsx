import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingCart, Package, CreditCard, Tag, Trash2, CheckCircle, Shield } from "lucide-react";
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
  const [creditCardDrawerOpen, setCreditCardDrawerOpen] = useState(false);

  // Get order ID from URL params (if coming from cart checkout)
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const orderId = urlParams.get('orderId');

  // Fetch cart data
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user && !orderId
  });

  // Fetch specific order if orderId is provided
  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId && !!user
  });

  // Fetch loyalty status for discount
  interface LoyaltyStatus {
    currentTier: string;
    currentDiscount: number;
    monthlyPurchased: number;
    nextTier: string | null;
    gbToNextTier: number | null;
  }
  
  const { data: loyalty } = useQuery<LoyaltyStatus>({
    queryKey: ["/api/user/loyalty"],
    enabled: !!user
  });

  const loyaltyDiscount = loyalty?.currentDiscount || 0;

  // Initialize coupon state from order data when order loads
  useEffect(() => {
    if (orderData && orderData.couponCode && !appliedCoupon) {
      // If order has a coupon but we don't have it in state, fetch coupon details
      validateCouponMutation.mutate(orderData.couponCode);
    }
  }, [orderData, appliedCoupon]);

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      setCouponValidating(true);
      const subtotal = getCurrentSubtotal();
      const items = getCurrentItems();
      const planIds = items.map((item: any) => item.planId || item.plan?.id).filter(Boolean);
      
      const response = await apiRequest('POST', '/api/coupons/validate', { 
        code: code.trim().toUpperCase(), 
        shipId: user?.ship_id,
        subtotal,
        planIds
      });
      return response.json();
    },
    onSuccess: (result) => {
      setCouponValidating(false);
      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon);
        setDiscount(result.discount_amount || 0);
        
        // Show detailed success message
        if (couponCode.trim()) {
          const discountText = result.coupon.discountType === 'percentage' 
            ? `%${result.coupon.discountValue} oranında` 
            : `$${result.coupon.discountValue} tutarında`;
          
          toast({
            title: t.checkout.couponApplied,
            description: `"${result.coupon.code}" ${t.checkout.couponDiscount} ${discountText} ${t.checkout.totalDiscount}: $${result.discount_amount.toFixed(2)}`,
          });
        }
      } else {
        setAppliedCoupon(null);
        setDiscount(0);
        if (couponCode.trim()) {
          const errorMessage = getDetailedErrorMessage(result.reason || result.message);
          toast({
            title: "❌ Kupon Uygulanamadı",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    },
    onError: (error: any) => {
      setCouponValidating(false);
      setAppliedCoupon(null);
      setDiscount(0);
      if (couponCode.trim()) {
        toast({
          title: "❌ Kupon Hatası",
          description: error.message || "Kupon doğrulanamadı. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (paypalOrderId: string) => {
      const endpoint = orderId 
        ? `/api/orders/${orderId}/complete`
        : '/api/cart/complete-payment';
        
      const response = await apiRequest('POST', endpoint, {
        paypalOrderId,
        couponCode: appliedCoupon?.code
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Ödeme Başarılı",
        description: "Siparişiniz başarıyla tamamlandı!",
      });
      
      // Clear cart after successful payment
      if (!orderId) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }
      
      window.location.href = `/order-success?orderId=${result.id || result.orderId}`;
    },
    onError: (error: any) => {
      toast({
        title: "Ödeme Başarısız",
        description: error.message || "Ödeme işlemi başarısız oldu",
        variant: "destructive",
      });
    },
  });

  const getDetailedErrorMessage = (reason: string) => {
    switch (reason) {
      case 'not_found':
        return "Bu kupon kodu geçerli değil. Lütfen kupon kodunuzu kontrol edin.";
      case 'inactive':
        return "Bu kupon şu anda aktif değil.";
      case 'expired':
        return "Bu kuponun geçerlilik süresi dolmuş.";
      case 'not_started':
        return "Bu kupon henüz geçerlilik tarihine ulaşmamış.";
      case 'usage_limit_reached':
        return "Bu kuponun kullanım limiti dolmuş.";
      case 'single_use_already_used':
        return "Bu kuponu daha önce kullandınız. Tek kullanımlık kuponlar sadece bir kez kullanılabilir.";
      case 'minimum_order_not_met':
        return "Bu kupon için minimum sipariş tutarı karşılanmıyor.";
      case 'scope_ship_mismatch':
        return "Bu kupon seçtiğiniz gemiye uygulanamaz.";
      case 'scope_package_mismatch':
        return "Bu kupon sepetinizdeki paketlere uygulanamaz.";
      default:
        return reason || "Kupon geçerli değil.";
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "⚠️ Eksik Bilgi",
        description: "Lütfen kupon kodu girin",
        variant: "destructive",
      });
      return;
    }
    validateCouponMutation.mutate(couponCode);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
    toast({
      title: "🗑️ Kupon Kaldırıldı",
      description: "Kupon sepetinizden kaldırıldı. İndirim iptal edildi.",
    });
  };

  const getCurrentSubtotal = () => {
    if (orderId && orderData) {
      // For orders, use the subtotal before discount
      const orderSubtotal = parseFloat((orderData as any)?.subtotalUsd || '0');
      return orderSubtotal > 0 ? orderSubtotal : parseFloat((orderData as any)?.total || '0');
    }
    if (cartData) {
      return parseFloat((cartData as any)?.subtotal || '0');
    }
    return 0;
  };

  const getCurrentItems = () => {
    if (orderId && orderData) {
      return (orderData as any)?.items || [];
    }
    if (cartData) {
      return (cartData as any)?.items || [];
    }
    return [];
  };

  // Real-time total calculation with loyalty discount
  const currentSubtotal = getCurrentSubtotal();
  const currentCouponDiscount = appliedCoupon ? discount : 0;
  const loyaltyDiscountAmount = currentSubtotal * (loyaltyDiscount / 100);
  const totalDiscountAmount = currentCouponDiscount + loyaltyDiscountAmount;
  const currentDiscount = currentCouponDiscount; // For backward compatibility
  const currentTotal = Math.max(0, currentSubtotal - totalDiscountAmount);

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Giriş Gerekli",
        description: "Ödeme yapmak için giriş yapmalısınız",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = '/giris';
      }, 1500);
    }
  }, [user, authLoading, toast]);

  // Redirect if no cart items and no order
  useEffect(() => {
    if (!authLoading && !cartLoading && !orderLoading && user) {
      const items = getCurrentItems();
      if (!orderId && (!cartData || items.length === 0)) {
        toast({
          title: "Sepet Boş",
          description: "Ödeme yapmak için sepetinize ürün ekleyin",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/paketler';
        }, 1500);
      }
    }
  }, [cartData, orderData, orderId, authLoading, cartLoading, orderLoading, user, toast]);

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

  if (!user) {
    return null; // Redirect handled in useEffect
  }

  const items = getCurrentItems();
  const subtotal = getCurrentSubtotal();
  const total = Math.max(0, subtotal - discount);
  
  // If we have order data with discount, use that total instead
  const finalTotal = (orderId && orderData && orderData.total && !appliedCoupon) 
    ? parseFloat(orderData.total) 
    : total;

  if (items.length === 0) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6 space-x-2">
            <div className="relative">
              <CreditCard className="h-8 w-8 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            {t.checkout.title}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {t.checkout.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Order Details */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center">
                  <Package className="h-5 w-5 mr-2 text-cyan-400" />
                  {t.checkout.orderDetails}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item: any, index: number) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 card-hover cart-item-entrance"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    data-testid={`checkout-item-${item.planId || item.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative group">
                        <Package className="h-10 w-10 text-cyan-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-white mb-1">
                          {item.plan?.name || item.plan?.title || 'Veri Paketi'}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <span>{item.plan?.dataLimitGb || item.plan?.gbAmount}GB</span>
                          <span>•</span>
                          <span>Ay sonu bitiş</span>
                          {item.quantity && item.quantity > 1 && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                {item.quantity}x
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-semibold text-cyan-400 price-highlight">
                        {formatPrice(item.unitPriceUsd || item.plan?.priceUsd || 0)}
                        {item.quantity && item.quantity > 1 && (
                          <div className="text-xs text-slate-400">
                            her biri
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Coupon Section */}
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-green-400" />
                  {t.checkout.couponCode}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input 
                      type="text" 
                      placeholder={t.checkout.couponPlaceholder}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon}
                      className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500 transition-all duration-300 focus:scale-105"
                      data-testid="checkout-coupon-input"
                    />
                    <Button 
                      onClick={appliedCoupon ? removeCoupon : handleApplyCoupon}
                      disabled={couponValidating || validateCouponMutation.isPending || (!appliedCoupon && !couponCode.trim())}
                      className={`btn-interactive transition-all duration-300 ${
                        appliedCoupon 
                          ? "bg-red-500 hover:bg-red-600 text-white" 
                          : "bg-green-500 hover:bg-green-600 text-white animate-pulse-glow"
                      }`}
                      data-testid={appliedCoupon ? "remove-coupon-button" : "apply-coupon-button"}
                    >
                      {(couponValidating || validateCouponMutation.isPending) ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          {appliedCoupon ? "Kaldırılıyor..." : "Kontrol ediliyor..."}
                        </>
                      ) : appliedCoupon ? (
                        <>
                          <Trash2 className="h-4 w-4 mr-1 transition-transform duration-200 hover:scale-110" />
                          Kaldır
                        </>
                      ) : (
                        <>
                          <Tag className="h-4 w-4 mr-1 transition-transform duration-200 hover:scale-110" />
                          {t.checkout.apply}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg success-bounce">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 font-medium flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 animate-pulse" />
                          "{appliedCoupon.code}" uygulandı
                        </span>
                        <span className="text-green-400 font-bold text-lg">
                          -{formatPrice(currentDiscount)}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="text-green-300/90">
                          {appliedCoupon.discountType === 'percentage' 
                            ? `%${appliedCoupon.discountValue} oranında indirim` 
                            : `$${appliedCoupon.discountValue} tutarında indirim`
                          }
                        </p>
                        {appliedCoupon.singleUseOnly && (
                          <p className="text-orange-300/80">
                            ⚠️ Tek kullanımlık kupon
                          </p>
                        )}
                        {appliedCoupon.maxUses && (
                          <p className="text-blue-300/80">
                            📊 Kullanım: {appliedCoupon.usedCount || 0}/{appliedCoupon.maxUses}
                          </p>
                        )}
                        {appliedCoupon.validUntil && (
                          <p className="text-slate-300/80">
                            📅 Geçerlilik: {new Date(appliedCoupon.validUntil).toLocaleDateString('tr-TR')} tarihine kadar
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50 sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-cyan-400" />
                  {t.checkout.orderSummary}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-slate-300">
                    <span>{t.checkout.subtotal}</span>
                    <span className="font-semibold price-highlight" data-testid="checkout-subtotal">
                      {formatPrice(currentSubtotal)}
                    </span>
                  </div>
                  
                  {currentDiscount > 0 && (
                    <div className="flex justify-between text-green-400 animate-slide-in-right">
                      <span className="flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        {t.checkout.couponDiscount}
                      </span>
                      <span className="font-semibold text-green-400 price-highlight" data-testid="checkout-discount">
                        -{formatPrice(currentDiscount)}
                      </span>
                    </div>
                  )}
                  
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between items-center text-yellow-400 animate-slide-in-right bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-2 rounded-lg border border-yellow-500/20" data-testid="checkout-loyalty-discount">
                      <span className="flex items-center">
                        <span className="mr-1">⭐</span>
                        {t.cart?.loyaltyDiscount || 'Sadakat İndirimi'} (%{loyaltyDiscount})
                      </span>
                      <span className="font-semibold text-green-400">
                        -{formatPrice(loyaltyDiscountAmount)}
                      </span>
                    </div>
                  )}
                  
                  <Separator className="bg-slate-600" />
                  
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-white">{t.checkout.total}</span>
                    <span className="text-cyan-400 price-highlight font-bold transition-all duration-500" data-testid="checkout-total">
                      {formatPrice(currentTotal)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-400 text-center space-y-1">
                    <div>Paketler satın alınan ayın sonunda otomatik olarak sona erer</div>
                    <div className="text-xs text-slate-500">
                      Örnek: 15 Ocak'ta alınan paket 31 Ocak 23:59'a kadar geçerli
                    </div>
                  </div>
                </div>

                {/* PayPal Payment */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-sm text-slate-400 mb-4">
                      {t.checkout.securePayment}
                    </div>
                  </div>
                  
                  {currentTotal > 0 ? (
                    <div className="space-y-4 animate-slide-in-up">
                      {/* Credit Card & Debit Card Payment Button */}
                      <Button
                        onClick={() => setCreditCardDrawerOpen(true)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 rounded-xl text-lg btn-interactive transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-blue-500/25"
                        data-testid="credit-card-button"
                      >
                        <CreditCard className="h-6 w-6" />
                        <span>{t.checkout.cardPayment}</span>
                      </Button>
                      
                      <div className="text-center text-sm text-slate-400">
                        <div className="flex items-center justify-center space-x-2">
                          <Shield className="h-4 w-4 text-green-400" />
                          <span>{t.checkout.secure3D || '3D Secure secure payment'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => completeOrderMutation.mutate('')}
                      disabled={completeOrderMutation.isPending}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl text-lg btn-interactive animate-pulse-glow"
                      data-testid="free-checkout-button"
                    >
                      {completeOrderMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-5 w-5 mr-2 animate-pulse" />
                      )}
                      🎉 Ücretsiz Siparişi Tamamla
                    </Button>
                  )}
                </div>

                {/* Security Notice */}
                <div className="text-center text-xs text-slate-400 flex items-center justify-center bg-slate-800/30 p-3 rounded-lg hover:bg-slate-800/50 transition-all duration-300">
                  <div className="mr-2 text-green-400 animate-pulse">🔒</div>
                  <div>
                    <div className="font-medium">{t.checkout.secureSsl}</div>
                    <div>Kart bilgileriniz güvende</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Credit Card Payment Drawer */}
      <CreditCardDrawer
        isOpen={creditCardDrawerOpen}
        onClose={() => setCreditCardDrawerOpen(false)}
        amount={currentTotal.toFixed(2)}
        currency="USD"
        onSuccess={(paymentData) => {
          setCreditCardDrawerOpen(false);
          toast({
            title: "Ödeme Başarılı",
            description: "Kredi kartı ödemesi başarıyla tamamlandı!",
          });
          // Call complete payment with PayPal Order ID
          completeOrderMutation.mutate(paymentData.paypalOrderId || paymentData.orderId || 'card_payment_' + Date.now());
        }}
        onError={(error) => {
          toast({
            title: "Ödeme Hatası",
            description: "Kredi kartı ödemesi başarısız oldu. Lütfen tekrar deneyin.",
            variant: "destructive",
          });
        }}
      />
    </div>
  );
}