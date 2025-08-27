import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  Satellite, 
  Waves, 
  Globe, 
  Zap, 
  Shield, 
  ArrowRight, 
  Anchor,
  Navigation,
  Signal
} from 'lucide-react';
import adeGlobaLogo from '@assets/adegloba-1_1756252463127.png';

export default function Landing() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Redirect if user is already logged in
    if (user) {
      window.location.href = '/panel';
    }
  }, [user]);

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden relative">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Soft gradient orbs */}
        <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-32 h-32 sm:w-60 sm:h-60 bg-gradient-to-r from-slate-600/10 to-slate-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:60px_60px]" />
        
        {/* Minimal starfield */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-amber-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.4 + 0.1
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-16">
          <div className="max-w-4xl mx-auto text-center w-full">
            
            {/* Logo Section - Mobile optimized */}
            <div className={`transform transition-all duration-2000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="flex items-center justify-center mb-8 sm:mb-12">
                <img 
                  src={adeGlobaLogo} 
                  alt="AdeGloba Limited" 
                  className="h-16 sm:h-20 md:h-24 object-contain filter drop-shadow-lg"
                />
              </div>
            </div>

            {/* Main Hero Content - Mobile first */}
            <div className={`space-y-8 sm:space-y-12 transform transition-all duration-2000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="space-y-6 sm:space-y-8">
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
                  <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2 sm:mb-4">
                    OKYANUSTA
                  </div>
                  <div className="bg-gradient-to-r from-slate-300 via-white to-slate-300 bg-clip-text text-transparent">
                    SINIR YOK
                  </div>
                </h1>
                
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light px-4">
                  <span className="text-amber-400 font-semibold">AdeGloba Starlink System</span> ile geminizde 
                  kesintisiz internet bağlantısının keyfini çıkarın.
                </p>
              </div>

              {/* Feature Badges - Mobile responsive */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 sm:mb-12 px-4">
                <Badge className="bg-gradient-to-r from-amber-600/80 to-yellow-600/80 backdrop-blur-sm text-white px-3 sm:px-4 py-2 text-xs sm:text-sm border-0 hover:scale-105 transition-transform">
                  <Satellite className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Starlink Uydu
                </Badge>
                <Badge className="bg-gradient-to-r from-slate-600/80 to-slate-700/80 backdrop-blur-sm text-white px-3 sm:px-4 py-2 text-xs sm:text-sm border-0 hover:scale-105 transition-transform">
                  <Waves className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Maritime Özel
                </Badge>
                <Badge className="bg-gradient-to-r from-amber-500/80 to-amber-600/80 backdrop-blur-sm text-white px-3 sm:px-4 py-2 text-xs sm:text-sm border-0 hover:scale-105 transition-transform">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Anında Aktif
                </Badge>
              </div>

              {/* CTA Buttons - Mobile first design */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
                <Link to="/kayit" data-testid="link-register">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-700 hover:via-amber-600 hover:to-yellow-600 text-slate-900 px-6 sm:px-8 md:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105 border-0"
                  >
                    <Anchor className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                    Kayıt Ol
                    <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 ml-2 sm:ml-3" />
                  </Button>
                </Link>
                
                <Link to="/giris" data-testid="link-login">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto border-2 border-slate-400/50 text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-300 px-6 sm:px-8 md:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold transition-all duration-300 hover:scale-105 bg-transparent backdrop-blur-sm"
                  >
                    <Navigation className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                    Giriş Yap
                  </Button>
                </Link>
              </div>

              {/* Trust indicators - Mobile optimized */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8 sm:mt-12 px-4">
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-400 bg-slate-800/30 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-full">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                  <span>Güvenli Ödeme</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-400 bg-slate-800/30 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-full">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                  <span>Anında Aktif</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-400 bg-slate-800/30 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-full">
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                  <span>Global Kapsama</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer - Minimal and responsive */}
        <footer className="py-8 sm:py-12 px-4 bg-gradient-to-t from-slate-950 to-transparent border-t border-slate-800/50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <img 
                src={adeGlobaLogo} 
                alt="AdeGloba Limited" 
                className="h-8 sm:h-10 object-contain opacity-70"
              />
            </div>
            
            <div className="space-y-2 sm:space-y-4">
              <p className="text-slate-400 text-sm sm:text-base">
                © 2025 AdeGloba Limited. Tüm hakları saklıdır.
              </p>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed px-4">
                Maritime Starlink Çözümleri • Denizcilik Teknolojileri • Uydu İnternet Sistemleri
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}