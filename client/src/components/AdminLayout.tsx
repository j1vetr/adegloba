import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Çıkış yapıldı.",
      });
      queryClient.clear();
      setLocation("/login");
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Çıkış işlemi başarısız.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const menuItems = [
    { path: "/admin", label: "Dashboard", icon: "fas fa-tachometer-alt" },
    { path: "/admin/ships", label: "Gemiler", icon: "fas fa-ship" },
    { path: "/admin/plans", label: "Paketler", icon: "fas fa-box" },
    { path: "/admin/coupons", label: "Kuponlar", icon: "fas fa-ticket-alt" },
    { path: "/admin/orders", label: "Siparişler", icon: "fas fa-shopping-cart" },
    { path: "/admin/settings", label: "Ayarlar", icon: "fas fa-cog" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-blue via-space-dark to-space-blue text-slate-200">
      {/* Stellar background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-neon-purple rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse"></div>
      </div>

      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition duration-200 ease-in-out lg:static lg:inset-0`}>
        <Card className="h-full glassmorphism rounded-none border-r border-slate-700/50">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                  <i className="fas fa-satellite text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">StarLink Marine</h1>
                  <p className="text-xs text-slate-400">Admin Panel</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      location === item.path
                        ? 'bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 text-neon-cyan border border-neon-cyan/30'
                        : 'text-slate-300 hover:bg-space-card hover:text-white'
                    }`}
                    data-testid={`menu-${item.path.replace('/admin', '').replace('/', '') || 'dashboard'}`}
                  >
                    <i className={`${item.icon} text-lg`}></i>
                    <span className="font-medium">{item.label}</span>
                  </button>
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-700/50">
              <Button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="w-full bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 hover:text-red-300"
                data-testid="logout-button"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                {logoutMutation.isPending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Navigation */}
        <header className="sticky top-0 z-30 glassmorphism border-b border-slate-700/50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-slate-400 hover:text-white"
                  data-testid="mobile-menu-button"
                >
                  <i className="fas fa-bars text-xl"></i>
                </button>
                <div className="ml-4 lg:ml-0">
                  <h2 className="text-xl font-semibold text-white">
                    {menuItems.find(item => item.path === location)?.label || 'Admin Panel'}
                  </h2>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-300">
                  <i className="fas fa-user-circle mr-2"></i>
                  Admin
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 relative z-10">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}