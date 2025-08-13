import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingCart, Package, CreditCard, Tag, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from "@/hooks/useUserAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import CardPaymentButton from "@/components/CardPaymentButton";

export default function Checkout() {
  const [location] = useLocation();
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);

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

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/coupons/validate', { 
        code, 
        shipId: user?.ship_id 
      });
      return response.json();
    },
    onSuccess: (coupon) => {
      setAppliedCoupon(coupon);
      
      // Calculate discount based on current total
      const subtotal = getCurrentSubtotal();
      let discountAmount = 0;
      
      if (coupon.type === 'percentage') {
        discountAmount = (subtotal * parseFloat(coupon.value)) / 100;
        if (coupon.maxDiscount && discountAmount > parseFloat(coupon.maxDiscount)) {
          discountAmount = parseFloat(coupon.maxDiscount);
        }
      } else if (coupon.type === 'fixed') {
        discountAmount = Math.min(parseFloat(coupon.value), subtotal);
      }
      
      setDiscount(discountAmount);
      toast({
        title: "Kupon Uygulandı",
        description: `${coupon.code} kuponu başarıyla uygulandı`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Kupon Hatası",
        description: error.message || "Kupon geçerli değil",
        variant: "destructive",
      });
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

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Hata",
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
      title: "Kupon Kaldırıldı",
      description: "Kupon kaldırıldı",
    });
  };

  const getCurrentSubtotal = () => {
    if (orderId && orderData) {
      return parseFloat(orderData.subtotalUsd || orderData.total || 0);
    }
    if (cartData) {
      return parseFloat(cartData.subtotal || 0);
    }
    return 0;
  };

  const getCurrentItems = () => {
    if (orderId && orderData) {
      return orderData.items || [];
    }
    if (cartData) {
      return cartData.items || [];
    }
    return [];
  };

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
            <p className="text-slate-300">Ödeme sayfası yükleniyor...</p>
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
            Ödeme
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Siparişinizi tamamlayın ve Starlink bağlantınızı başlatın
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Order Details */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center">
                  <Package className="h-5 w-5 mr-2 text-cyan-400" />
                  Sipariş Detayları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                    data-testid={`checkout-item-${item.planId || item.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Package className="h-10 w-10 text-cyan-400" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-white mb-1">
                          {item.plan?.name || item.plan?.title || 'Veri Paketi'}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <span>{item.plan?.dataLimitGb || item.plan?.gbAmount}GB</span>
                          <span>•</span>
                          <span>{item.plan?.validityDays || 30} Gün</span>
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
                      <div className="text-lg font-semibold text-cyan-400">
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
                  Kupon Kodu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input 
                      type="text" 
                      placeholder="Kupon kodunu girin"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon}
                      className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
                      data-testid="checkout-coupon-input"
                    />
                    <Button 
                      onClick={appliedCoupon ? removeCoupon : handleApplyCoupon}
                      disabled={validateCouponMutation.isPending || (!appliedCoupon && !couponCode.trim())}
                      className={appliedCoupon 
                        ? "bg-red-500 hover:bg-red-600 text-white" 
                        : "bg-green-500 hover:bg-green-600 text-white"
                      }
                      data-testid={appliedCoupon ? "remove-coupon-button" : "apply-coupon-button"}
                    >
                      {validateCouponMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : appliedCoupon ? (
                        <Trash2 className="h-4 w-4" />
                      ) : (
                        <Tag className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 text-sm font-medium flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {appliedCoupon.code} uygulandı
                        </span>
                        <span className="text-green-400 text-sm font-semibold">
                          -{formatPrice(discount)}
                        </span>
                      </div>
                      <p className="text-green-300/80 text-xs mt-1">
                        {appliedCoupon.type === 'percentage' 
                          ? `%${appliedCoupon.value} indirim` 
                          : `${formatPrice(appliedCoupon.value)} indirim`
                        }
                      </p>
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
                  Ödeme Özeti
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-slate-300">
                    <span>Ara Toplam</span>
                    <span className="font-semibold" data-testid="checkout-subtotal">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>İndirim</span>
                      <span className="font-semibold" data-testid="checkout-discount">
                        -{formatPrice(discount)}
                      </span>
                    </div>
                  )}
                  
                  <Separator className="bg-slate-600" />
                  
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-white">Toplam</span>
                    <span className="text-cyan-400" data-testid="checkout-total">
                      {formatPrice(total)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-400 text-center">
                    Paketler ay sonunda otomatik olarak sona erer
                  </div>
                </div>

                {/* Card Payment */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-sm text-slate-400 mb-4">
                      Güvenli ödeme ile tamamlayın
                    </div>
                  </div>
                  
                  {total > 0 ? (
                    <div data-testid="card-payment-container">
                      <CardPaymentButton
                        amount={total.toFixed(2)}
                        currency="USD"
                        onSuccess={(orderId: string) => {
                          completeOrderMutation.mutate(orderId);
                        }}
                        onError={(error: any) => {
                          toast({
                            title: "Ödeme Hatası",
                            description: "Ödeme işlemi başarısız oldu",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <Button
                      onClick={() => completeOrderMutation.mutate('')}
                      disabled={completeOrderMutation.isPending}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl text-lg"
                      data-testid="free-checkout-button"
                    >
                      {completeOrderMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-5 w-5 mr-2" />
                      )}
                      Ücretsiz Siparişi Tamamla
                    </Button>
                  )}
                </div>

                {/* Security Notice */}
                <div className="text-center text-xs text-slate-400 flex items-center justify-center bg-slate-800/30 p-3 rounded-lg">
                  <div className="mr-2 text-green-400">🔒</div>
                  <div>
                    <div className="font-medium">Güvenli 256-bit SSL şifreleme</div>
                    <div>Kart bilgileriniz güvende</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}