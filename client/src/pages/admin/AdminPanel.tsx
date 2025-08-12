import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ShipsManagement from "./ShipsManagement";
import PlansManagement from "./PlansManagement";
import OrdersManagement from "./OrdersManagement";
import UsersManagement from "./UsersManagement";
import CouponsManagement from "./CouponsManagement";
import Settings from "./Settings";

export default function AdminPanel() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === 'admin'
  });

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, user?.role, toast]);

  // Parse tab from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const tab = urlParams.get('tab') || 'dashboard';
    setActiveTab(tab);
  }, [location]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setLocation(`/admin?tab=${tab}`);
  };

  if (authLoading || statsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan"></div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-bar' },
    { id: 'ships', label: 'Ships', icon: 'fas fa-ship' },
    { id: 'plans', label: 'Plans', icon: 'fas fa-wifi' },
    { id: 'orders', label: 'Orders', icon: 'fas fa-shopping-bag' },
    { id: 'users', label: 'Users', icon: 'fas fa-users' },
    { id: 'coupons', label: 'Coupons', icon: 'fas fa-ticket-alt' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ships':
        return <ShipsManagement />;
      case 'plans':
        return <PlansManagement />;
      case 'orders':
        return <OrdersManagement />;
      case 'users':
        return <UsersManagement />;
      case 'coupons':
        return <CouponsManagement />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div>
            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-revenue">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">Total Revenue</div>
                    <div className="text-2xl font-bold text-neon-green">${stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
                    <div className="text-xs text-neon-green">This month</div>
                  </div>
                  <i className="fas fa-dollar-sign text-neon-green text-2xl"></i>
                </div>
              </Card>
              
              <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-active-orders">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">Active Orders</div>
                    <div className="text-2xl font-bold text-neon-cyan">{stats?.activeOrders || 0}</div>
                    <div className="text-xs text-neon-cyan">Currently active</div>
                  </div>
                  <i className="fas fa-shopping-cart text-neon-cyan text-2xl"></i>
                </div>
              </Card>
              
              <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-total-orders">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">Total Orders</div>
                    <div className="text-2xl font-bold text-neon-purple">{stats?.totalOrders || 0}</div>
                    <div className="text-xs text-slate-400">All time</div>
                  </div>
                  <i className="fas fa-chart-line text-neon-purple text-2xl"></i>
                </div>
              </Card>
              
              <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-support">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">System Status</div>
                    <div className="text-2xl font-bold text-neon-green">Online</div>
                    <div className="text-xs text-neon-green">All systems operational</div>
                  </div>
                  <i className="fas fa-check-circle text-neon-green text-2xl"></i>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glassmorphism rounded-xl p-6 border-transparent hover:scale-105 transition-transform cursor-pointer" onClick={() => handleTabChange('ships')} data-testid="quick-action-ships">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                    <i className="fas fa-ship text-white text-2xl"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Ships Management</h4>
                  <p className="text-slate-400 text-sm mb-4">Add, edit, or manage ship configurations and their assigned data plans.</p>
                  <Button className="w-full bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 transition-colors border-transparent">
                    Manage Ships
                  </Button>
                </div>
              </Card>

              <Card className="glassmorphism rounded-xl p-6 border-transparent hover:scale-105 transition-transform cursor-pointer" onClick={() => handleTabChange('plans')} data-testid="quick-action-plans">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-purple to-pink-500 flex items-center justify-center">
                    <i className="fas fa-wifi text-white text-2xl"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Data Plans</h4>
                  <p className="text-slate-400 text-sm mb-4">Create and configure data packages with pricing and availability settings.</p>
                  <Button className="w-full bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 transition-colors border-transparent">
                    Manage Plans
                  </Button>
                </div>
              </Card>

              <Card className="glassmorphism rounded-xl p-6 border-transparent hover:scale-105 transition-transform cursor-pointer" onClick={() => handleTabChange('settings')} data-testid="quick-action-settings">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-green to-emerald-500 flex items-center justify-center">
                    <i className="fas fa-cog text-white text-2xl"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">System Settings</h4>
                  <p className="text-slate-400 text-sm mb-4">Configure PayPal integration, WhatsApp support, and global system settings.</p>
                  <Button className="w-full bg-neon-green/20 text-neon-green hover:bg-neon-green/30 transition-colors border-transparent">
                    System Settings
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent" data-testid="admin-title">
                Admin Panel
              </h1>
              <p className="text-xl text-slate-300">Manage ships, plans, orders, and system settings</p>
            </div>

            {/* Admin Navigation Tabs */}
            <Card className="glassmorphism rounded-2xl p-6 border-transparent">
              <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-600 pb-4">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                        : 'hover:bg-space-card text-slate-300 border-transparent'
                    }`}
                    data-testid={`admin-tab-${tab.id}`}
                  >
                    <i className={`${tab.icon} mr-2`}></i>{tab.label}
                  </Button>
                ))}
              </div>

              {renderTabContent()}
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
