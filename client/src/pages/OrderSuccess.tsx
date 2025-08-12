import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OrderSuccess() {
  const [location] = useLocation();
  
  // Get order ID from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const orderId = urlParams.get('orderId');

  const { data: order, isLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId
  });

  if (isLoading) {
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
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* Success Animation */}
            <div className="mb-8" data-testid="success-animation">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-green to-emerald-500 flex items-center justify-center animate-bounce">
                <i className="fas fa-check text-white text-4xl"></i>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent" data-testid="success-title">
                Order Successful!
              </h1>
              <p className="text-xl text-slate-300 mb-2">
                Your payment has been processed successfully
              </p>
              <p className="text-slate-400">
                Order ID: <span className="font-mono text-neon-cyan" data-testid="order-id">#{order.id}</span>
              </p>
            </div>

            {/* Order Details */}
            <Card className="glassmorphism rounded-2xl p-6 mb-8 text-left border-transparent" data-testid="order-details">
              <h3 className="text-xl font-semibold mb-4 text-white text-center">Order Details</h3>
              
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-space-card/50 border border-slate-700 mb-4" data-testid={`order-item-${item.id}`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-green to-emerald-500 flex items-center justify-center">
                      <i className="fas fa-check text-white"></i>
                    </div>
                    <div>
                      <div className="font-semibold text-white" data-testid={`item-plan-${item.id}`}>
                        {item.plan?.title || 'Data Plan'}
                      </div>
                      <div className="text-sm text-slate-400">
                        <span data-testid={`item-ship-${item.id}`}>{item.ship?.name}</span> • 
                        <span data-testid={`item-data-${item.id}`}>{item.plan?.gbAmount} GB</span> • 
                        Monthly Plan
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-white" data-testid={`item-price-${item.id}`}>
                      ${Number(item.unitPriceUsd).toFixed(2)}
                    </div>
                    <Badge className="bg-neon-green/20 text-neon-green border-transparent mt-1">
                      Active
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Payment Summary */}
              <div className="border-t border-slate-600 pt-4 mt-4">
                <div className="flex justify-between text-slate-300 mb-2">
                  <span>Subtotal</span>
                  <span data-testid="success-subtotal">${Number(order.subtotalUsd).toFixed(2)}</span>
                </div>
                {Number(order.discountUsd) > 0 && (
                  <div className="flex justify-between text-neon-green mb-2">
                    <span>Discount</span>
                    <span data-testid="success-discount">-${Number(order.discountUsd).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total Paid</span>
                  <span data-testid="success-total">${Number(order.totalUsd).toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="glassmorphism rounded-2xl p-6 mb-8 border-transparent" data-testid="next-steps">
              <h3 className="text-xl font-semibold mb-4 text-white">What's Next?</h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center text-sm font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-medium text-white">Service Activation</div>
                    <div className="text-sm text-slate-400">Your data plan will be activated within 15 minutes.</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center text-sm font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="font-medium text-white">Configuration Details</div>
                    <div className="text-sm text-slate-400">You'll receive setup instructions via email.</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center text-sm font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-medium text-white">24/7 Support</div>
                    <div className="text-sm text-slate-400">Contact our support team if you need assistance.</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button className="px-8 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold hover:shadow-xl hover:shadow-neon-cyan/25 transition-all" data-testid="view-dashboard-button">
                  <i className="fas fa-chart-line mr-2"></i>
                  View Dashboard
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="ghost" className="px-8 py-3 rounded-xl glassmorphism hover:bg-space-card transition-all" data-testid="browse-more-button">
                  <i className="fas fa-ship mr-2"></i>
                  Browse More Plans
                </Button>
              </Link>
            </div>

            {/* Support Contact */}
            <div className="mt-12 text-center">
              <p className="text-slate-400 mb-2">Need help? Contact our support team</p>
              <Button 
                variant="ghost" 
                className="text-neon-green hover:text-neon-green/80"
                onClick={() => document.querySelector('[data-testid="whatsapp-button"]')?.click()}
                data-testid="contact-support-button"
              >
                <i className="fab fa-whatsapp mr-2"></i>
                WhatsApp Support
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
