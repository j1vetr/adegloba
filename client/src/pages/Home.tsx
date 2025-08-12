import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { Ship } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const { data: ships, isLoading } = useQuery<Ship[]>({
    queryKey: ["/api/ships"]
  });

  const { data: userOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/user/orders"]
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

  return (
    <Layout>
      {/* Welcome Section */}
      <section className="py-12 bg-gradient-to-r from-space-blue/50 to-space-dark/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              Welcome back, {user?.firstName || 'Captain'}!
            </h1>
            <p className="text-xl text-slate-300">
              Manage your fleet connectivity and view your active data packages
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      {!ordersLoading && userOrders && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-active-plans">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">Active Plans</div>
                    <div className="text-2xl font-bold text-neon-green">
                      {userOrders.filter((order: any) => order.status === 'paid' && order.daysRemaining > 0).length}
                    </div>
                  </div>
                  <i className="fas fa-wifi text-neon-green text-2xl"></i>
                </div>
              </Card>
              
              <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-total-spent">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">Total Spent</div>
                    <div className="text-2xl font-bold text-neon-purple">
                      ${userOrders.filter((order: any) => order.status === 'paid').reduce((sum: number, order: any) => sum + Number(order.totalUsd), 0).toFixed(2)}
                    </div>
                  </div>
                  <i className="fas fa-dollar-sign text-neon-purple text-2xl"></i>
                </div>
              </Card>
              
              <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-ships-connected">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">Ships Connected</div>
                    <div className="text-2xl font-bold text-neon-cyan">
                      {new Set(userOrders.filter((order: any) => order.status === 'paid').flatMap((order: any) => order.items.map((item: any) => item.shipId))).size}
                    </div>
                  </div>
                  <i className="fas fa-ship text-neon-cyan text-2xl"></i>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/ships" className="group">
              <Card className="glassmorphism rounded-xl p-6 hover:scale-105 transition-all cursor-pointer border-transparent" data-testid="action-browse-ships">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-ship text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Browse Ships</h3>
                  <p className="text-slate-400">View available ships and data packages</p>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard" className="group">
              <Card className="glassmorphism rounded-xl p-6 hover:scale-105 transition-all cursor-pointer border-transparent" data-testid="action-view-orders">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-purple to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-history text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">View Orders</h3>
                  <p className="text-slate-400">Check your purchase history and active plans</p>
                </div>
              </Card>
            </Link>

            <div className="group cursor-pointer" onClick={() => document.getElementById('whatsapp-button')?.click()}>
              <Card className="glassmorphism rounded-xl p-6 hover:scale-105 transition-all border-transparent" data-testid="action-get-support">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fab fa-whatsapp text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Get Support</h3>
                  <p className="text-slate-400">Contact our support team via WhatsApp</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Available Ships */}
      <section className="py-12 bg-gradient-to-r from-space-blue/30 to-space-dark/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
            Available Ships
          </h2>

          {ships && ships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ships.slice(0, 6).map((ship) => (
                <Card 
                  key={ship.id} 
                  className="glassmorphism rounded-2xl p-6 hover:scale-105 transition-all cursor-pointer group border-transparent"
                  data-testid={`ship-card-${ship.slug}`}
                >
                  <Link href={`/ships/${ship.slug}`}>
                    {ship.imageUrl && (
                      <img 
                        src={ship.imageUrl} 
                        alt={ship.name} 
                        className="w-full h-32 object-cover rounded-xl mb-4" 
                      />
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">{ship.name}</h3>
                      <Badge variant="secondary" className="bg-neon-green/20 text-neon-green border-transparent">
                        <i className="fas fa-circle mr-1 text-xs"></i>Active
                      </Badge>
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-4">
                      {ship.description?.slice(0, 80)}...
                    </p>
                    
                    <Button className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-white group-hover:shadow-lg transition-all">
                      View Plans <i className="fas fa-arrow-right ml-1"></i>
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-ship text-6xl text-slate-500 mb-4"></i>
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No ships available</h3>
              <p className="text-slate-500">Please contact support for ship registration.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
