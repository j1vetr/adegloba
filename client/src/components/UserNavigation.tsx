import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  MessageSquare, 
  Package, 
  User, 
  LogOut,
  Menu,
  X,
  ShoppingCart,
  BookOpen
} from "lucide-react";
import { useState } from "react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useQuery } from "@tanstack/react-query";

interface UserNavigationProps {
  className?: string;
}

export function UserNavigation({ className = "" }: UserNavigationProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useUserAuth();

  // Get cart data for badge
  const { data: cartData } = useQuery({
    queryKey: ["/api/cart"],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const navigation = [
    {
      name: "Ana Sayfa",
      href: "/panel",
      icon: Home,
      active: location === "/panel"
    },
    {
      name: "Paketler",
      href: "/paketler",
      icon: Package,
      active: location === "/paketler"
    },
    {
      name: "Kullanım Kılavuzu",
      href: "/kilavuz",
      icon: BookOpen,
      active: location === "/kilavuz"
    },
    {
      name: "Destek",
      href: "/destek",
      icon: MessageSquare,
      active: location === "/destek" || location.startsWith("/destek/")
    },
    {
      name: "Profil",
      href: "/profil",
      icon: User,
      active: location === "/profil"
    },
    {
      name: "Sepet",
      href: "/sepet",
      icon: ShoppingCart,
      active: location === "/sepet",
      badge: cartData?.itemCount > 0 ? cartData.itemCount : undefined
    }
  ];

  const handleLogout = async () => {
    try {
      // Call logout API to clear server session
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear any local storage or session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to homepage
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if API call fails
      window.location.href = "/";
    }
  };

  return (
    <nav className={`glassmorphism border-b border-cyan-500/20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/panel">
              <div className="flex items-center cursor-pointer">
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent hover:from-cyan-300 hover:via-blue-300 hover:to-purple-300 transition-all duration-300">
                  AG Starlink System
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className={`relative ${
                      item.active
                        ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                    } transition-all duration-200`}
                    data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                    {(item as any).badge && (item as any).badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">
                        {(item as any).badge}
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}
            
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700/50">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={item.active ? "default" : "ghost"}
                      className={`w-full justify-start relative ${
                        item.active
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`mobile-nav-${item.name.toLowerCase().replace(' ', '-')}`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                      {(item as any).badge && (item as any).badge > 0 && (
                        <span className="ml-auto bg-red-500 text-white rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">
                          {(item as any).badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })}
              
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                data-testid="mobile-button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}