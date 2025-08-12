import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  Menu,
  X,
  Ship,
  Package,
  Ticket,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Home,
  Plus
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

const menuItems = [
  { href: "/admin", icon: BarChart3, label: "Dashboard", exact: true },
  { href: "/admin/ships", icon: Ship, label: "Gemiler" },
  { href: "/admin/plans", icon: Package, label: "Paketler" },
  { href: "/admin/coupons", icon: Ticket, label: "Kuponlar" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Siparişler" },
  { href: "/admin/users", icon: Users, label: "Kullanıcılar" },
  { href: "/admin/settings", icon: Settings, label: "Ayarlar" },
];

export default function AdminLayout({ children, title, showAddButton, onAddClick }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAdminAuth();

  const isActiveRoute = (href: string, exact = false) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <i className="fas fa-satellite text-white text-sm"></i>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              AdeGloba Admin
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActiveRoute(item.href, item.exact)
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
              onClick={() => setSidebarOpen(false)}
              data-testid={`admin-nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-4 left-4 right-4 space-y-4">
          <div className="px-4 py-3 bg-slate-800/50 rounded-lg">
            <div className="text-sm font-medium text-white">{user?.username}</div>
            <div className="text-xs text-slate-400">Admin Panel</div>
          </div>
          
          <div className="flex space-x-2">
            <Link href="/" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800/50"
              >
                <Home className="h-4 w-4 mr-2" />
                Ana Sayfa
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start text-red-400 hover:text-red-300 hover:bg-red-500/20"
              onClick={logout}
              data-testid="admin-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-slate-400 hover:text-white"
                onClick={() => setSidebarOpen(true)}
                data-testid="mobile-menu-toggle"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div>
                <h1 className="text-xl font-bold text-white">{title}</h1>
                <div className="text-sm text-slate-400">AdeGloba Starlink System - Yönetim Paneli</div>
              </div>
            </div>

            {showAddButton && onAddClick && (
              <Button
                onClick={onAddClick}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                data-testid="admin-add-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ekle
              </Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}