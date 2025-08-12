import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Cart() {
  // TODO: Implement proper cart state management
  const [cartItems] = useState([]);
  const [couponCode, setCouponCode] = useState("");

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent" data-testid="cart-title">
              Shopping Cart
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <Card className="glassmorphism rounded-2xl p-6 border-transparent">
                  <h3 className="text-xl font-semibold mb-6 text-white">Cart Items</h3>
                  
                  {cartItems.length > 0 ? (
                    <div className="space-y-4" data-testid="cart-items">
                      {/* Cart items will be rendered here */}
                    </div>
                  ) : (
                    <div className="text-center py-12" data-testid="empty-cart">
                      <i className="fas fa-shopping-cart text-6xl text-slate-500 mb-4"></i>
                      <h3 className="text-xl font-semibold text-slate-400 mb-2">Your cart is empty</h3>
                      <p className="text-slate-500 mb-6">Add some data plans to get started</p>
                      <Button 
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white"
                        onClick={() => window.location.href = '/'}
                        data-testid="browse-plans-button"
                      >
                        Browse Plans
                      </Button>
                    </div>
                  )}
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="glassmorphism rounded-2xl p-6 sticky top-24 border-transparent" data-testid="order-summary">
                  <h3 className="text-xl font-semibold mb-6 text-white">Order Summary</h3>
                  
                  {/* Coupon Code */}
                  <div className="mb-6">
                    <Label className="block text-sm font-medium text-slate-300 mb-2">Coupon Code</Label>
                    <div className="flex space-x-2">
                      <Input 
                        type="text" 
                        placeholder="Enter coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 glassmorphism border border-slate-600 text-white placeholder-slate-400 focus:border-neon-cyan"
                        data-testid="coupon-input"
                      />
                      <Button 
                        className="px-4 py-2 glassmorphism hover:bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan"
                        data-testid="apply-coupon-button"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal</span>
                      <span data-testid="subtotal">$0.00</span>
                    </div>
                    <div className="border-t border-slate-600 pt-3">
                      <div className="flex justify-between text-xl font-bold text-white">
                        <span>Total</span>
                        <span data-testid="total">$0.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button 
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold hover:shadow-xl hover:shadow-neon-cyan/25 transition-all mb-4"
                    disabled={cartItems.length === 0}
                    data-testid="checkout-button"
                  >
                    <i className="fab fa-paypal mr-2"></i>
                    Pay with PayPal
                  </Button>

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
