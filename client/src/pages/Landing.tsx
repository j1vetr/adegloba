import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Satellite, Waves, LogIn, ArrowRight, Shield, Zap, Globe, Anchor, Navigation, Activity } from "lucide-react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Loader2 } from "lucide-react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useUserAuth();
  
  // Redirect authenticated users to dashboard
  if (!isLoading && isAuthenticated) {
    window.location.href = '/panel';
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-6xl mx-auto text-center space-y-12">
            
            {/* Header with Logo */}
            <div className="flex items-center justify-center mb-8 space-x-3">
              <div className="relative">
                <Satellite className="h-12 w-12 text-blue-400" />
                <Waves className="h-6 w-6 text-cyan-400 absolute -bottom-1 -right-1" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AdeGloba Starlink System
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-bold leading-tight">
                <div className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Denizde Sınırsız
                </div>
                <div className="text-white mt-2">
                  İnternet Bağlantısı
                </div>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
                Maritime sektörü için özel olarak tasarlanmış Starlink veri paketleri ile 
                okyanusta kesintisiz, yüksek hızlı internet erişimi sağlayın.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/kayit" data-testid="link-register">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-12 py-6 text-xl font-semibold shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105"
                  data-testid="button-register"
                >
                  <Waves className="mr-3 h-6 w-6" />
                  Hemen Başla
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
              
              <Link to="/giris" data-testid="link-login">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-12 py-6 text-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  data-testid="button-login"
                >
                  <LogIn className="mr-3 h-6 w-6" />
                  Giriş Yap
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-4 justify-center mt-12">
              <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 px-4 py-2 text-sm">
                <Shield className="mr-2 h-4 w-4" />
                Güvenli Ödeme
              </Badge>
              <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 px-4 py-2 text-sm">
                <Zap className="mr-2 h-4 w-4" />
                Anında Aktivasyon
              </Badge>
              <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 px-4 py-2 text-sm">
                <Globe className="mr-2 h-4 w-4" />
                Dünya Çapında Kapsama
              </Badge>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Neden AdeGloba Starlink System?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <CardContent className="p-8 text-center space-y-4">
                  <Anchor className="h-12 w-12 text-blue-400 mx-auto" />
                  <h3 className="text-xl font-semibold text-white">Maritime Odaklı</h3>
                  <p className="text-slate-300">
                    Gemiler ve deniz araçları için özel olarak optimize edilmiş çözümler
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300">
                <CardContent className="p-8 text-center space-y-4">
                  <Navigation className="h-12 w-12 text-cyan-400 mx-auto" />
                  <h3 className="text-xl font-semibold text-white">Kolay Yönetim</h3>
                  <p className="text-slate-300">
                    Kullanıcı dostu panel ile veri paketlerinizi kolayca yönetin
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                <CardContent className="p-8 text-center space-y-4">
                  <Activity className="h-12 w-12 text-purple-400 mx-auto" />
                  <h3 className="text-xl font-semibold text-white">7/24 Destek</h3>
                  <p className="text-slate-300">
                    Teknik destek ekibimiz her zaman hizmetinizde
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-slate-800">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="relative">
                <Satellite className="h-8 w-8 text-blue-400" />
                <Waves className="h-4 w-4 text-cyan-400 absolute -bottom-1 -right-1" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AdeGloba Starlink System
              </span>
            </div>
            <p className="text-slate-400">
              © 2025 AdeGloba Starlink System. Tüm hakları saklıdır.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}