import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import WhatsAppButton from "./WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [cartCount] = useState(0); // TODO: Implement cart state management

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
              <h1 className="text-xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                StarLink Marine
              </h1>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/#ships" className="hover:text-neon-cyan transition-colors">Ships</Link>
              <Link href="/#plans" className="hover:text-neon-cyan transition-colors">Plans</Link>
              <Link href="/#support" className="hover:text-neon-cyan transition-colors">Support</Link>
              {isAuthenticated && (
                <Link href="/dashboard" className="hover:text-neon-cyan transition-colors">Dashboard</Link>
              )}
              {user?.role === 'admin' && (
                <Link href="/admin" className="hover:text-neon-cyan transition-colors">Admin</Link>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {isAuthenticated && (
                <Link href="/cart" className="relative p-2 rounded-lg glassmorphism hover:bg-space-card transition-all" data-testid="cart-button">
                  <i className="fas fa-shopping-cart text-slate-300"></i>
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-neon-purple text-white min-w-5 h-5 flex items-center justify-center p-1 text-xs" data-testid="cart-count">
                      {cartCount}
                    </Badge>
                  )}
                </Link>
              )}
              
              {!isLoading && !isAuthenticated ? (
                <>
                  <Button 
                    variant="ghost" 
                    className="glassmorphism hover:bg-space-card"
                    onClick={() => window.location.href = '/api/login'}
                    data-testid="login-button"
                  >
                    <i className="fas fa-user mr-2"></i>Login
                  </Button>
                  
                  <Button 
                    className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white hover:shadow-lg hover:shadow-neon-cyan/25"
                    onClick={() => window.location.href = '/api/login'}
                    data-testid="register-button"
                  >
                    Register
                  </Button>
                </>
              ) : isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-sm">
                    <div className="text-white font-medium">{user?.firstName || 'User'}</div>
                    <div className="text-xs text-slate-400">{user?.email}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="glassmorphism hover:bg-space-card"
                    onClick={() => window.location.href = '/api/logout'}
                    data-testid="logout-button"
                  >
                    Logout
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
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
                <h3 className="text-xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                  StarLink Marine
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
