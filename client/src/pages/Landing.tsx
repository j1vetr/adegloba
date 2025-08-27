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

        {/* Features Section */}
        <section className="py-32 px-4 bg-gradient-to-b from-transparent to-slate-950/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">
                  Neden AdeGloba?
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-orange-500/20 backdrop-blur-sm hover:border-orange-500/40 transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Signal className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Yüksek Hız</h3>
                  <p className="text-gray-300 leading-relaxed">
                    500 Mbps'e kadar download hızı ile okyanusta da kara kadar hızlı internet
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Global Kapsama</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Dünya çapında kesintisiz bağlantı, hangi denizde olursanız olun
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-500/40 transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Güvenli Bağlantı</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Maritime standardlarında şifreli ve güvenli veri iletimi
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-green-500/20 backdrop-blur-sm hover:border-green-500/40 transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">7/24 Destek</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Maritime uzmanlarımızdan kesintisiz teknik destek alın
                  </p>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-yellow-500/20 backdrop-blur-sm hover:border-yellow-500/40 transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Esnek Paketler</h3>
                  <p className="text-gray-300 leading-relaxed">
                    İhtiyacınıza göre aylık veya yıllık data paket seçenekleri
                  </p>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Navigation className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Kolay Kurulum</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Profesyonel kurulum ve konfigürasyon hizmetleri dahil
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-32 px-4 bg-gradient-to-b from-slate-950/50 to-black">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-16">
              <span className="bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">
                Rakamlarla AdeGloba
              </span>
            </h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="text-5xl md:text-7xl font-black bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  500+
                </div>
                <div className="text-xl text-gray-300">Aktif Gemi</div>
              </div>
              
              <div className="space-y-4">
                <div className="text-5xl md:text-7xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  50TB+
                </div>
                <div className="text-xl text-gray-300">Aylık Data Transferi</div>
              </div>
              
              <div className="space-y-4">
                <div className="text-5xl md:text-7xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  99.9%
                </div>
                <div className="text-xl text-gray-300">Uptime Garantisi</div>
              </div>
              
              <div className="space-y-4">
                <div className="text-5xl md:text-7xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-xl text-gray-300">Teknik Destek</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-12 md:p-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-8">
                <span className="bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">
                  Hemen Başla
                </span>
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
                Gemini kaydet, paketi seç, internete bağlan!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link to="/kayit">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 hover:from-orange-700 hover:via-orange-600 hover:to-yellow-600 text-white px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 border-0"
                  >
                    <Satellite className="h-6 w-6 mr-3" />
                    Ücretsiz Kayıt Ol
                    <ArrowRight className="h-6 w-6 ml-3" />
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