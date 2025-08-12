import { Link, useLocation } from "wouter";
import { useUserAuth } from "@/hooks/useUserAuth";
import WhatsAppButton from "./WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Menu, X } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isLoading, isAuthenticated } = useUserAuth();
  const [location] = useLocation();
  const [cartCount] = useState(0); // TODO: Implement cart state management
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-blue via-space-dark to-space-blue text-slate-200">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glassmorphism">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                <i className="fas fa-satellite text-white text-lg"></i>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AdeGloba Starlink System
              </h1>
            </Link>
            
            <div className="hidden lg:flex items-center space-x-6">
              <Link href="/#ships" className="hover:text-blue-400 transition-colors text-slate-300">Gemiler</Link>
              <Link href="/#plans" className="hover:text-blue-400 transition-colors text-slate-300">Paketler</Link>
              <Link href="/#support" className="hover:text-blue-400 transition-colors text-slate-300">Destek</Link>
              {isAuthenticated && (
                <Link href="/panel" className="hover:text-blue-400 transition-colors text-slate-300">Panel</Link>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden glassmorphism hover:bg-slate-700/50"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-button"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* Desktop Navigation Actions */}
              <div className="hidden lg:flex items-center space-x-3">
                {isAuthenticated && (
                  <Link href="/sepet" className="relative p-2 rounded-lg glassmorphism hover:bg-slate-700/50 transition-all" data-testid="cart-button">
                    <i className="fas fa-shopping-cart text-slate-300"></i>
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-blue-600 text-white min-w-5 h-5 flex items-center justify-center p-1 text-xs" data-testid="cart-count">
                        {cartCount}
                      </Badge>
                    )}
                  </Link>
                )}
                
                {!isLoading && !isAuthenticated ? (
                  <>
                    <Link href="/giris">
                      <Button 
                        variant="ghost" 
                        className="glassmorphism hover:bg-slate-700/50 text-slate-300 hover:text-white"
                        data-testid="login-button"
                      >
                        <i className="fas fa-user mr-2"></i>Giriş Yap
                      </Button>
                    </Link>
                    
                    <Link href="/kayit">
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        data-testid="register-button"
                      >
                        Kayıt Ol
                      </Button>
                    </Link>
                  </>
                ) : isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-right">
                      <div className="text-white font-medium">
                        {user?.username}
                        {user?.ship && (
                          <span className="text-blue-400"> - {user.ship.name}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        AdeGloba Müşteri Sistemi
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="glassmorphism hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300"
                      onClick={() => {
                        fetch('/api/user/logout', { method: 'POST' })
                          .then(() => window.location.href = '/')
                          .catch(() => window.location.href = '/');
                      }}
                      data-testid="logout-button"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Çıkış
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Mobile User Info */}
              <div className="lg:hidden flex items-center space-x-2">
                {isAuthenticated && (
                  <div className="text-sm text-right">
                    <div className="text-white font-medium">{user?.username}</div>
                    {user?.ship && (
                      <div className="text-xs text-blue-400">{user.ship.name}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <div className="space-y-3">
                <Link 
                  href="/#ships" 
                  className="block text-slate-300 hover:text-blue-400 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Gemiler
                </Link>
                <Link 
                  href="/#plans" 
                  className="block text-slate-300 hover:text-blue-400 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Paketler
                </Link>
                <Link 
                  href="/#support" 
                  className="block text-slate-300 hover:text-blue-400 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Destek
                </Link>
                {isAuthenticated && (
                  <>
                    <Link 
                      href="/panel" 
                      className="block text-slate-300 hover:text-blue-400 transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Panel
                    </Link>
                    <Link 
                      href="/sepet" 
                      className="block text-slate-300 hover:text-blue-400 transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sepet {cartCount > 0 && `(${cartCount})`}
                    </Link>
                  </>
                )}
              </div>
              
              {!isAuthenticated ? (
                <div className="pt-4 border-t border-slate-700/50 space-y-3">
                  <Link href="/giris" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start glassmorphism hover:bg-slate-700/50 text-slate-300 hover:text-white"
                      data-testid="mobile-login-button"
                    >
                      <i className="fas fa-user mr-2"></i>Giriş Yap
                    </Button>
                  </Link>
                  
                  <Link href="/kayit" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                      data-testid="mobile-register-button"
                    >
                      Kayıt Ol
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-700/50">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start glassmorphism hover:bg-red-500/20 text-red-400 hover:text-red-300"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      fetch('/api/user/logout', { method: 'POST' })
                        .then(() => window.location.href = '/')
                        .catch(() => window.location.href = '/');
                    }}
                    data-testid="mobile-logout-button"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Çıkış Yap
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* WhatsApp Support */}
      <WhatsAppButton />

      {/* Footer */}
      <footer className="py-16 border-t border-slate-700/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                  <i className="fas fa-satellite text-white text-lg"></i>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  AdeGloba Starlink System
                </h3>
              </div>
              <p className="text-slate-400 mb-4">
                Providing reliable satellite internet connectivity for maritime operations worldwide.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-neon-cyan transition-colors" data-testid="social-twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-slate-400 hover:text-neon-cyan transition-colors" data-testid="social-linkedin">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="#" className="text-slate-400 hover:text-neon-cyan transition-colors" data-testid="social-facebook">
                  <i className="fab fa-facebook"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/#ships" className="hover:text-neon-cyan transition-colors">Data Packages</Link></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Ship Management</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">24/7 Support</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Custom Solutions</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Status Page</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700/50 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 StarLink Marine. All rights reserved. Built with cutting-edge satellite technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
