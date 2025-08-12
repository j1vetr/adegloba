import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from "@/hooks/useUserAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import PayPalButton from "@/components/PayPalButton";

export default function Checkout() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Get order ID from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const orderId = urlParams.get('orderId');

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId
  });

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/coupons/validate', {
        code,
        shipId: order?.items?.[0]?.shipId
      });
      return response.json();
    },
    onSuccess: (coupon) => {
      setAppliedCoupon(coupon);
      toast({
        title: "Coupon Applied",
        description: `${coupon.code} applied successfully!`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Invalid coupon code",
        variant: "destructive",
      });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (paypalOrderId: string) => {
      const response = await apiRequest('POST', `/api/orders/${orderId}/complete`, {
        paypalOrderId
      });
      return response.json();
    },
    onSuccess: (completedOrder) => {
      toast({
        title: "Payment Successful",
        description: "Your order has been completed successfully!",
      });
      window.location.href = `/order-success?orderId=${completedOrder.id}`;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to complete payment",
        variant: "destructive",
      });
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete checkout.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Redirect if no order ID
  useEffect(() => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "No order found. Please try again.",
        variant: "destructive",
      });
      window.location.href = '/';
    }
  }, [orderId, toast]);

  if (authLoading || orderLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan"></div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Order Not Found</h1>
          <p className="text-slate-400 mb-8">The requested order could not be found.</p>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = Number(order.subtotalUsd);
    if (appliedCoupon.type === 'percent') {
      return subtotal * (Number(appliedCoupon.value) / 100);
    }
    return Number(appliedCoupon.value);
  };

  const discount = calculateDiscount();
  const total = Number(order.subtotalUsd) - discount;

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent" data-testid="checkout-title">
              Checkout
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Details */}
              <div>
                <Card className="glassmorphism rounded-2xl p-6 mb-6 border-transparent">
                  <h3 className="text-xl font-semibold mb-6 text-white">Order Details</h3>
                  
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-space-card/50 border border-slate-700" data-testid={`order-item-${item.id}`}>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                          <i className="fas fa-wifi text-white"></i>
                        </div>
                        <div>
                          <div className="font-semibold text-white" data-testid={`item-plan-${item.id}`}>
                            {item.plan?.title || 'Data Plan'}
                          </div>
                          <div className="text-sm text-slate-400">
                            <span data-testid={`item-ship-${item.id}`}>{item.ship?.name}</span> • 
                            <span data-testid={`item-data-${item.id}`}>{item.plan?.gbAmount} GB</span> • 
                            Monthly
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xl font-bold text-neon-cyan" data-testid={`item-price-${item.id}`}>
                        ${Number(item.unitPriceUsd).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </Card>

                {/* Coupon Section */}
                <Card className="glassmorphism rounded-2xl p-6 border-transparent">
                  <h3 className="text-xl font-semibold mb-6 text-white">Coupon Code</h3>
                  
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 glassmorphism border border-slate-600 text-white placeholder-slate-400 focus:border-neon-cyan"
                        data-testid="coupon-input"
                      />
                      <Button
                        onClick={() => validateCouponMutation.mutate(couponCode)}
                        disabled={validateCouponMutation.isPending || !couponCode}
                        className="px-4 py-2 glassmorphism hover:bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan"
                        data-testid="apply-coupon-button"
                      >
                        {validateCouponMutation.isPending ? 'Applying...' : 'Apply'}
                      </Button>
                    </div>
                    
                    {appliedCoupon && (
                      <div className="text-sm text-neon-green" data-testid="applied-coupon">
                        <i className="fas fa-check mr-1"></i>
                        Coupon applied: <span className="font-semibold">{appliedCoupon.code}</span>
                        {appliedCoupon.type === 'percent' ? ` (-${appliedCoupon.value}%)` : ` (-$${appliedCoupon.value})`}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Payment Section */}
              <div>
                <Card className="glassmorphism rounded-2xl p-6 sticky top-24 border-transparent" data-testid="payment-summary">
                  <h3 className="text-xl font-semibold mb-6 text-white">Payment Summary</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal</span>
                      <span data-testid="checkout-subtotal">${Number(order.subtotalUsd).toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-neon-green">
                        <span>Discount</span>
                        <span data-testid="checkout-discount">-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-600 pt-3">
                      <div className="flex justify-between text-xl font-bold text-white">
                        <span>Total</span>
                        <span data-testid="checkout-total">${total.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        Expires: <span data-testid="checkout-expiry">End of month</span>
                      </div>
                    </div>
                  </div>

                  {/* PayPal Button */}
                  <div className="mb-4" data-testid="paypal-container">
                    <PayPalButton
                      amount={total.toFixed(2)}
                      currency="USD"
                      intent="capture"
                    />
                  </div>

                  {/* Security Notice */}
                  <div className="text-center">
                    <div className="text-xs text-slate-400 flex items-center justify-center">
                      <i className="fas fa-lock mr-1 text-neon-green"></i>
                      Secure 256-bit SSL encryption
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
