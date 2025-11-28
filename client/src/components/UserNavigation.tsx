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
  BookOpen,
  Heart
} from "lucide-react";
import { useState } from "react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useQuery } from "@tanstack/react-query";
import { useLanguage, LanguageSelector } from "@/contexts/LanguageContext";

interface UserNavigationProps {
  className?: string;
}

export function UserNavigation({ className = "" }: UserNavigationProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useUserAuth();
  const { t } = useLanguage();

  // Get cart data for badge
  const { data: cartData } = useQuery({
    queryKey: ["/api/cart"],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const navigation = [
    {
      name: t.dashboard.navigation.home,
      href: "/panel",
      icon: Home,
      active: location === "/panel"
    },
    {
      name: t.dashboard.navigation.packages,
      href: "/paketler",
      icon: Package,
      active: location === "/paketler"
    },
    {
      name: t.dashboard.navigation.guide,
      href: "/kilavuz",
      icon: BookOpen,
      active: location === "/kilavuz"
    },
    {
      name: t.dashboard.navigation.support,
      href: "/destek",
      icon: MessageSquare,
      active: location === "/destek" || location.startsWith("/destek/")
    },
    {
      name: t.dashboard.navigation.profile,
      href: "/profil",
      icon: User,
      active: location === "/profil"
    },
    {
      name: t.dashboard.navigation.cart,
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
                <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-blue-500 bg-clip-text text-transparent hover:from-yellow-300 hover:via-amber-300 hover:to-blue-400 transition-all duration-300">
                  ADS
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
            
            {/* Language Selector */}
            <LanguageSelector className="mx-2" />
            
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t.dashboard.navigation.logout}
            </Button>
          </div>

          {/* Mobile menu button with language selector */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Language Selector - Mobile */}
            <LanguageSelector className="scale-90" />
            
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
                {t.dashboard.navigation.logout}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-cyan-500/30 safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {/* Paketler */}
          <Link href="/paketler">
            <button
              className={`flex flex-col items-center justify-center w-full py-2 px-4 rounded-xl transition-all duration-300 ${
                location === "/paketler"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-slate-400 hover:text-cyan-300"
              }`}
              data-testid="mobile-bottom-packages"
            >
              <Package className={`h-5 w-5 mb-1 ${location === "/paketler" ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : ""}`} />
              <span className="text-xs font-medium">{t.dashboard.navigation.packages}</span>
            </button>
          </Link>

          {/* Favoriler */}
          <Link href="/panel?tab=favorites">
            <button
              className={`flex flex-col items-center justify-center w-full py-2 px-4 rounded-xl transition-all duration-300 ${
                location === "/panel" && typeof window !== "undefined" && window.location.search.includes("tab=favorites")
                  ? "bg-pink-500/20 text-pink-400"
                  : "text-slate-400 hover:text-pink-300"
              }`}
              data-testid="mobile-bottom-favorites"
            >
              <Heart className={`h-5 w-5 mb-1 ${location === "/panel" && typeof window !== "undefined" && window.location.search.includes("tab=favorites") ? "fill-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" : ""}`} />
              <span className="text-xs font-medium">{t.dashboard.sections.favorites}</span>
            </button>
          </Link>

          {/* Profil */}
          <Link href="/profil">
            <button
              className={`flex flex-col items-center justify-center w-full py-2 px-4 rounded-xl transition-all duration-300 ${
                location === "/profil"
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-400 hover:text-amber-300"
              }`}
              data-testid="mobile-bottom-profile"
            >
              <User className={`h-5 w-5 mb-1 ${location === "/profil" ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : ""}`} />
              <span className="text-xs font-medium">{t.dashboard.navigation.profile}</span>
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}