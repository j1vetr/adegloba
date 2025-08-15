import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart, Package, Trash2, Plus, Minus, DollarSign, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import { useState } from "react";

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
    validityDays?: number; // DEPRECATED: All packages now valid until end of purchase month
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
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);

  const { data: cartData, isLoading: cartLoading } = useQuery<CartData>({
    queryKey: ["/api/cart"],
    enabled: !!user
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ planId, quantity }: { planId: string; quantity: number }) => {
      const response = await apiRequest('PUT', `/api/cart/${planId}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Miktar güncellenemedi",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('DELETE', `/api/cart/${planId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Kaldırıldı",
        description: "Ürün sepetten kaldırıldı",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Ürün kaldırılamadı",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/cart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setAppliedCoupon(null);
      setDiscount(0);
      setCouponCode("");
      toast({
        title: "Temizlendi",
        description: "Sepet temizlendi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Sepet temizlenemedi",
        variant: "destructive",
      });
    },
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
      
      // Calculate discount
      const subtotal = cartData?.subtotal || 0;
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
      description: "Kupon sepetten kaldırıldı",
    });
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/cart/checkout', {
        couponCode: appliedCoupon?.code || undefined
      });
      return response.json();
    },
    onSuccess: (order) => {
      toast({
        title: "Sipariş Oluşturuldu",
        description: "Ödeme sayfasına yönlendiriliyorsunuz...",
      });
      window.location.href = `/checkout?orderId=${order.id}`;
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Sipariş oluşturulamadı",
        variant: "destructive",
      });
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

  if (!user) {
    window.location.href = '/giris';
    return null;
  }

  const formatPrice = (price: string | number) => {
    return `$${Number(price).toFixed(2)}`;
  };

  const updateQuantity = (planId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemMutation.mutate(planId);
    } else {
      updateQuantityMutation.mutate({ planId, quantity: newQuantity });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6 space-x-2">
            <div className="relative">
              <ShoppingCart className="h-8 w-8 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Sepetim
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Paketlerinizi inceleyin ve ödeme işlemine geçin
          </p>
        </div>

        {cartLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="ml-3 text-slate-300">Sepet yükleniyor...</span>
          </div>
        ) : !cartData?.items?.length ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-slate-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-4">
              Sepetiniz Boş
            </h3>
            <p className="text-slate-400 mb-6">
              Paket eklemek için paketler sayfasını ziyaret edin.
            </p>
            <Button 
              onClick={() => window.location.href = '/paketler'}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-xl"
            >
              Paketlere Göz At
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartData.items.map((item) => (
                <Card 
                  key={item.id} 
                  className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300"
                  data-testid={`cart-item-${item.planId}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Package className="h-12 w-12 text-cyan-400" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {item.plan?.name || 'Paket'}
                          </h3>
                          <p className="text-slate-400 text-sm mb-2">
                            {item.plan?.dataLimitGb}GB - Ay sonu bitiş
                          </p>
                          <div className="flex items-center text-cyan-400">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span className="font-semibold">{formatPrice(item.plan?.priceUsd || 0)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.planId, item.quantity - 1)}
                            disabled={updateQuantityMutation.isPending}
                            className="h-8 w-8 p-0 border-slate-600 hover:border-cyan-500 hover:bg-cyan-500/10"
                            data-testid={`decrease-quantity-${item.planId}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="text-white font-semibold min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.planId, item.quantity + 1)}
                            disabled={updateQuantityMutation.isPending}
                            className="h-8 w-8 p-0 border-slate-600 hover:border-cyan-500 hover:bg-cyan-500/10"
                            data-testid={`increase-quantity-${item.planId}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeItemMutation.mutate(item.planId)}
                          disabled={removeItemMutation.isPending}
                          className="h-8 w-8 p-0"
                          data-testid={`remove-item-${item.planId}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Clear Cart */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => clearCartMutation.mutate()}
                  disabled={clearCartMutation.isPending}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  data-testid="clear-cart-button"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sepeti Temizle
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">Sipariş Özeti</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Coupon Code */}
                  <div>
                    <Label className="block text-sm font-medium text-slate-300 mb-2">Kupon Kodu</Label>
                    <div className="flex space-x-2">
                      <Input 
                        type="text" 
                        placeholder="Kupon kodunu girin"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                        className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
                        data-testid="coupon-input"
                      />
                      <Button 
                        onClick={appliedCoupon ? removeCoupon : handleApplyCoupon}
                        disabled={validateCouponMutation.isPending || (!appliedCoupon && !couponCode.trim())}
                        className={appliedCoupon 
                          ? "bg-red-500 hover:bg-red-600 text-white" 
                          : "bg-cyan-500 hover:bg-cyan-600 text-white"
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
                      <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-green-400 text-sm font-medium">
                            {appliedCoupon.code} uygulandı
                          </span>
                          <span className="text-green-400 text-sm font-semibold">
                            -{formatPrice(discount)}
                          </span>
                        </div>
                        <p className="text-green-300/80 text-xs mt-1">
                          {appliedCoupon.type === 'percentage' 
                            ? `%${appliedCoupon.value} indirim` 
                            : `$${appliedCoupon.value} indirim`
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 pt-4 border-t border-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Ara Toplam</span>
                      <span className="text-white font-semibold">{formatPrice(cartData.subtotal)}</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>İndirim</span>
                        <span className="font-semibold">-{formatPrice(discount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-600">
                      <span className="text-white">Toplam</span>
                      <span className="text-cyan-400">{formatPrice((cartData.subtotal || 0) - discount)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={() => checkoutMutation.mutate()}
                    disabled={checkoutMutation.isPending}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl text-lg"
                    data-testid="checkout-button"
                  >
                    {checkoutMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-5 w-5 mr-2" />
                    )}
                    Ödemeye Geç
                  </Button>

                  {/* Security Notice */}
                  <div className="text-center text-xs text-slate-400 flex items-center justify-center">
                    <div className="mr-1">🔒</div>
                    Güvenli 256-bit SSL şifreleme
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}