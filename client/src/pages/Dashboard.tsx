import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/user/orders"],
    enabled: isAuthenticated
  });

  const buyAgainMutation = useMutation({
    mutationFn: async ({ shipId, planId }: { shipId: string; planId: string }) => {
      const response = await apiRequest('POST', '/api/orders', {
        shipId,
        planId
      });
      return response.json();
    },
    onSuccess: (order) => {
      toast({
        title: "Order Created",
        description: "Your order has been created. Redirecting to checkout...",
      });
      window.location.href = `/checkout?orderId=${order.id}`;
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
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading || ordersLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan"></div>
        </div>
      </Layout>
    );
  }

  const activeOrders = userOrders?.filter((order: any) => order.status === 'paid' && order.daysRemaining > 0) || [];
  const expiredOrders = userOrders?.filter((order: any) => order.status === 'expired' || order.daysRemaining <= 0) || [];
  const totalSpent = userOrders?.filter((order: any) => order.status === 'paid').reduce((sum: number, order: any) => sum + Number(order.totalUsd), 0) || 0;
  const connectedShips = new Set(userOrders?.filter((order: any) => order.status === 'paid').flatMap((order: any) => order.items.map((item: any) => item.shipId))).size;

  return (
    <Layout>
      <section className="py-20 bg-gradient-to-r from-space-blue/30 to-space-dark/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent" data-testid="dashboard-title">
                Dashboard
              </h1>
              <p className="text-xl text-slate-300">Manage your account and view purchase history</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* User Profile Sidebar */}
              <div className="lg:col-span-1">
                <Card className="glassmorphism rounded-2xl p-6 border-transparent">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center" data-testid="user-avatar">
                      <i className="fas fa-user text-white text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-white" data-testid="user-name">
                      {user?.firstName || 'Captain'} {user?.lastName || ''}
                    </h3>
                    <p className="text-slate-400" data-testid="user-email">{user?.email}</p>
                  </div>
                  
                  <nav className="space-y-2">
                    <div className="flex items-center px-4 py-2 rounded-lg bg-neon-cyan/20 text-neon-cyan">
                      <i className="fas fa-chart-line mr-3"></i>Dashboard
                    </div>
                    <Link href="/" className="flex items-center px-4 py-2 rounded-lg hover:bg-space-card transition-colors text-slate-300">
                      <i className="fas fa-ship mr-3"></i>Browse Ships
                    </Link>
                    <div className="flex items-center px-4 py-2 rounded-lg hover:bg-space-card transition-colors text-slate-300 cursor-pointer" onClick={() => document.querySelector('[data-testid="whatsapp-button"]')?.click()}>
                      <i className="fab fa-whatsapp mr-3"></i>Support
                    </div>
                    <button 
                      onClick={() => window.location.href = '/api/logout'}
                      className="flex items-center px-4 py-2 rounded-lg hover:bg-space-card transition-colors text-slate-300 w-full text-left"
                      data-testid="sidebar-logout"
                    >
                      <i className="fas fa-sign-out-alt mr-3"></i>Logout
                    </button>
                  </nav>
                </Card>
              </div>

              {/* Main Dashboard Content */}
              <div className="lg:col-span-3">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-active-plans">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Active Plans</div>
                        <div className="text-2xl font-bold text-neon-green">{activeOrders.length}</div>
                      </div>
                      <i className="fas fa-wifi text-neon-green text-2xl"></i>
                    </div>
                  </Card>
                  
                  <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-total-spent">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Total Spent</div>
                        <div className="text-2xl font-bold text-neon-purple">${totalSpent.toFixed(2)}</div>
                      </div>
                      <i className="fas fa-dollar-sign text-neon-purple text-2xl"></i>
                    </div>
                  </Card>
                  
                  <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-ships-connected">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Ships Connected</div>
                        <div className="text-2xl font-bold text-neon-cyan">{connectedShips}</div>
                      </div>
                      <i className="fas fa-ship text-neon-cyan text-2xl"></i>
                    </div>
                  </Card>
                </div>

                {/* Purchase History */}
                <Card className="glassmorphism rounded-2xl p-6 border-transparent">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Purchase History</h3>
                    <div className="flex space-x-2">
                      <select className="px-3 py-2 rounded-lg glassmorphism border border-slate-600 text-white text-sm bg-transparent" data-testid="filter-status">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  {userOrders && userOrders.length > 0 ? (
                    <div className="space-y-4">
                      {userOrders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-space-card/50 border border-slate-700" data-testid={`order-${order.id}`}>
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r flex items-center justify-center ${
                              order.status === 'paid' && order.daysRemaining > 0 
                                ? 'from-neon-green to-emerald-500' 
                                : order.status === 'expired' || order.daysRemaining <= 0
                                ? 'from-slate-500 to-slate-600'
                                : 'from-yellow-500 to-orange-500'
                            }`}>
                              <i className={`fas ${
                                order.status === 'paid' && order.daysRemaining > 0 
                                  ? 'fa-check' 
                                  : order.status === 'expired' || order.daysRemaining <= 0
                                  ? 'fa-clock'
                                  : 'fa-hourglass-half'
                              } text-white`}></i>
                            </div>
                            <div>
                              <div className="font-semibold text-white">
                                {order.items?.[0]?.plan?.title || 'Data Plan'} - {order.items?.[0]?.ship?.name || 'Ship'}
                              </div>
                              <div className="text-sm text-slate-400">
                                Order #{order.id.slice(0, 8)} • {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">${Number(order.totalUsd).toFixed(2)}</div>
                            <div className="text-sm">
                              {order.status === 'paid' && order.daysRemaining > 0 ? (
                                <>
                                  <Badge className="bg-neon-green/20 text-neon-green border-transparent">Active</Badge>
                                  <div className="text-xs text-slate-400 mt-1">
                                    {order.daysRemaining} days left
                                  </div>
                                </>
                              ) : order.status === 'expired' || order.daysRemaining <= 0 ? (
                                <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 border-transparent">Expired</Badge>
                              ) : (
                                <Badge className="bg-yellow-500/20 text-yellow-500 border-transparent">{order.status}</Badge>
                              )}
                            </div>
                            {order.items?.[0] && (
                              <Button 
                                size="sm"
                                className="mt-2 px-3 py-1 text-xs rounded-lg bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 transition-colors"
                                onClick={() => buyAgainMutation.mutate({
                                  shipId: order.items[0].shipId,
                                  planId: order.items[0].planId
                                })}
                                disabled={buyAgainMutation.isPending}
                                data-testid={`buy-again-${order.id}`}
                              >
                                {buyAgainMutation.isPending ? 'Creating...' : 'Buy Again'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12" data-testid="no-orders">
                      <i className="fas fa-shopping-bag text-6xl text-slate-500 mb-4"></i>
                      <h3 className="text-xl font-semibold text-slate-400 mb-2">No orders yet</h3>
                      <p className="text-slate-500 mb-6">Start by browsing our data packages</p>
                      <Link href="/">
                        <Button className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white">
                          Browse Plans
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
