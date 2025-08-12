import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import type { Ship } from "@shared/schema";

export default function Landing() {
  const { data: ships, isLoading } = useQuery<Ship[]>({
    queryKey: ["/api/ships"]
  });

  const [selectedShip, setSelectedShip] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to Replit Auth login
    window.location.href = '/api/login';
  };

  const handleShipSelect = (shipSlug: string) => {
    setSelectedShip(shipSlug);
    if (shipSlug) {
      // Redirect to ship plans page
      window.location.href = `/ships/${shipSlug}`;
    }
  };

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
      {/* Stellar background with animated particles */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-neon-purple rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-neon-cyan rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 right-10 w-1.5 h-1.5 bg-neon-purple rounded-full animate-ping"></div>
      </div>

      {/* Main Content */}
      <section className="relative py-20 min-h-screen flex items-center">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            
            {/* Left Column - Ship Selection */}
            <div className="space-y-8">
              <Card className="glassmorphism rounded-2xl p-8 border-transparent">
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <i className="fas fa-ship text-4xl text-neon-cyan mb-4"></i>
                    <h2 className="text-2xl font-bold text-white mb-2">Gemi Seçin</h2>
                    <p className="text-slate-300">Veri paketlerini görüntülemek için geminizi seçin</p>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="ship-select" className="text-lg font-semibold text-white">
                      Gemi
                    </Label>
                    <Select onValueChange={handleShipSelect} value={selectedShip}>
                      <SelectTrigger 
                        className="w-full h-14 text-lg glassmorphism border-slate-600 hover:border-neon-cyan transition-colors focus:border-neon-cyan focus:ring-neon-cyan/20"
                        data-testid="ship-select"
                      >
                        <SelectValue placeholder="Gemi seçiniz..." />
                      </SelectTrigger>
                      <SelectContent className="glassmorphism border-slate-600">
                        {ships && ships.length > 0 ? (
                          ships.map((ship) => (
                            <SelectItem 
                              key={ship.id} 
                              value={ship.slug}
                              className="hover:bg-neon-cyan/10 focus:bg-neon-cyan/10 text-white"
                              data-testid={`ship-option-${ship.slug}`}
                            >
                              <div className="flex items-center space-x-3">
                                <i className="fas fa-ship text-neon-cyan"></i>
                                <span>{ship.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-ships" disabled className="text-slate-400">
                            Kayıtlı gemi bulunmamaktadır
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    
                    {ships && ships.length === 0 && (
                      <div className="text-center py-8">
                        <i className="fas fa-exclamation-triangle text-3xl text-amber-500 mb-3"></i>
                        <p className="text-slate-400">Kayıtlı gemi bulunmamaktadır</p>
                        <p className="text-sm text-slate-500 mt-2">
                          Gemi kaydı için destek ile iletişime geçin
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Login Form */}
            <div className="space-y-8">
              <Card className="glassmorphism rounded-2xl p-8 border-transparent">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="text-center mb-6">
                    <i className="fas fa-user-circle text-4xl text-neon-purple mb-4"></i>
                    <h2 className="text-2xl font-bold text-white mb-2">Giriş Yap</h2>
                    <p className="text-slate-300">Hesabınıza erişim sağlayın</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-lg font-semibold text-white">
                        E-posta
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 text-lg glassmorphism border-slate-600 hover:border-neon-purple transition-colors focus:border-neon-purple focus:ring-neon-purple/20"
                        data-testid="email-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password" className="text-lg font-semibold text-white">
                        Şifre
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 text-lg glassmorphism border-slate-600 hover:border-neon-purple transition-colors focus:border-neon-purple focus:ring-neon-purple/20"
                        data-testid="password-input"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-semibold hover:shadow-xl hover:shadow-neon-purple/25 transition-all transform hover:scale-105"
                    data-testid="login-submit-button"
                  >
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Giriş Yap
                  </Button>
                  
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => window.location.href = '/api/login'}
                      className="text-neon-cyan hover:text-neon-purple transition-colors underline"
                      data-testid="register-link"
                    >
                      Hesabınız yok mu? Kayıt Olun
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
