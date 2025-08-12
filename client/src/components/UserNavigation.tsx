import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  MessageSquare, 
  Package, 
  User, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { useUserAuth } from "@/hooks/useUserAuth";

interface UserNavigationProps {
  className?: string;
}

export function UserNavigation({ className = "" }: UserNavigationProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useUserAuth();

  const navigation = [
    {
      name: "Ana Sayfa",
      href: "/panel",
      icon: Home,
      active: location === "/panel"
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
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AG</span>
                </div>
                <span className="text-xl font-bold text-white">
                  AdeGloba Starlink System
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
                    className={`${
                      item.active
                        ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                    } transition-all duration-200`}
                    data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
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
                      className={`w-full justify-start ${
                        item.active
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`mobile-nav-${item.name.toLowerCase().replace(' ', '-')}`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
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