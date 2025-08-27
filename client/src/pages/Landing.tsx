import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  Satellite, 
  Waves, 
  Globe, 
  Zap, 
  Shield, 
  Clock, 
  ArrowRight, 
  Star,
  MapPin,
  Wifi,
  TrendingUp,
  CheckCircle,
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
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Star Field Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-orange-500/30 to-yellow-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Starfield */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.8 + 0.2
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 py-20">
          <div className="max-w-7xl mx-auto text-center">
            
            {/* Logo Section */}
            <div className={`transform transition-all duration-2000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <div className="flex items-center justify-center mb-12">
                <img 
                  src={adeGlobaLogo} 
                  alt="AdeGloba Limited" 
                  className="h-20 md:h-28 object-contain filter drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Main Hero Content */}
            <div className={`space-y-12 transform transition-all duration-2000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <div className="space-y-8">
                <h1 className="text-5xl md:text-8xl font-black leading-tight tracking-tight">
                  <div className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-600 bg-clip-text text-transparent mb-4">
                    OKYANUSTA
                  </div>
                  <div className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    SINIR YOK
                  </div>
                </h1>
                
                <p className="text-xl md:text-3xl text-gray-300 max-w-5xl mx-auto leading-relaxed font-light">
                  <span className="text-orange-400 font-semibold">AdeGloba Starlink System</span> ile denizcilik sektörünün 
                  gelecegini yaşayın. <span className="text-cyan-400">Yüksek hızlı uydu internet</span> çözümleri 
                  artık gemilerde!
                </p>
              </div>

              {/* Feature Badges */}
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <Badge className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white px-6 py-3 text-lg border-0 hover:scale-105 transition-transform">
                  <Satellite className="h-5 w-5 mr-2" />
                  Starlink Uydu Ağı
                </Badge>
                <Badge className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 text-lg border-0 hover:scale-105 transition-transform">
                  <Waves className="h-5 w-5 mr-2" />
                  Maritime Özel
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 text-lg border-0 hover:scale-105 transition-transform">
                  <Zap className="h-5 w-5 mr-2" />
                  Anında Aktivasyon
                </Badge>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link to="/kayit" data-testid="link-register">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 hover:from-orange-700 hover:via-orange-600 hover:to-yellow-600 text-white px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 border-0"
                  >
                    <Anchor className="h-6 w-6 mr-3" />
                    Gemini Kaydet
                    <ArrowRight className="h-6 w-6 ml-3" />
                  </Button>
                </Link>
                
                <Link to="/paketler" data-testid="link-packages">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black px-12 py-6 text-xl font-bold transition-all duration-300 hover:scale-105 bg-transparent"
                  >
                    <Globe className="h-6 w-6 mr-3" />
                    Paketleri Keşfet
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>


        {/* Footer */}
        <footer className="py-16 px-4 bg-black border-t border-slate-800">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center mb-8">
              <img 
                src={adeGlobaLogo} 
                alt="AdeGloba Limited" 
                className="h-12 object-contain opacity-80"
              />
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-400">
                © 2025 AdeGloba Limited. Tüm hakları saklıdır.
              </p>
              <p className="text-gray-500 text-sm">
                Maritime Starlink Çözümleri | Denizcilik Teknolojileri | Uydu İnternet Sistemleri
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}