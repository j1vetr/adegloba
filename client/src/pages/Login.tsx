import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Loader2, Shield, ArrowRight, Lock, User, AlertCircle, Satellite, Globe, Wifi, Radio } from "lucide-react";
import adeGlobaLogo from '@assets/adegloba-1_1756252463127.png';

export default function Login() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-20 blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-cyan-400 relative" />
          </div>
          <p className="text-slate-400 mt-4 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    setTimeout(() => setLocation("/admin"), 0);
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLocation("/admin");
      } else {
        setError(data.message || "Giriş işlemi başarısız");
      }
    } catch (error) {
      setError("Bağlantı hatası oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950">
          {/* Aurora Effect */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/40 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-cyan-400/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-amber-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '4s' }} />
          </div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
          
          {/* Satellite Connection Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="10%" y1="20%" x2="60%" y2="50%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse" />
            <line x1="20%" y1="80%" x2="70%" y2="40%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '1s' }} />
            <line x1="80%" y1="10%" x2="40%" y2="60%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '2s' }} />
            <circle cx="10%" cy="20%" r="4" fill="#06b6d4" className="animate-pulse" />
            <circle cx="60%" cy="50%" r="6" fill="#f59e0b" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
            <circle cx="20%" cy="80%" r="4" fill="#06b6d4" className="animate-pulse" style={{ animationDelay: '1s' }} />
            <circle cx="80%" cy="10%" r="5" fill="#06b6d4" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          {/* Company Branding */}
          <div className="mb-12">
            <img 
              src={adeGlobaLogo} 
              alt="AdeGloba Limited" 
              className="h-20 xl:h-24 object-contain filter drop-shadow-2xl mb-8"
            />
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
              Denizcilik Starlink
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                İnternet Hizmetleri
              </span>
            </h1>
            <p className="text-lg xl:text-xl text-slate-300 max-w-md leading-relaxed">
              Dünyanın her yerinde kesintisiz deniz internet bağlantısı için güvenilir çözümler sunuyoruz.
            </p>
          </div>
          
          {/* Feature Cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Satellite className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Starlink Uydu Ağı</h3>
                <p className="text-slate-400 text-sm">Düşük gecikme, yüksek hız</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Global Kapsama</h3>
                <p className="text-slate-400 text-sm">Uluslararası sularda bağlantı</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">7/24 Bağlantı</h3>
                <p className="text-slate-400 text-sm">Kesintisiz internet erişimi</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Mobile Background */}
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Desktop Subtle Background */}
        <div className="hidden lg:block absolute inset-0">
          <div className="absolute inset-0 bg-slate-950" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px]" />
        </div>
        
        {/* Form Container */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-10">
              <img 
                src={adeGlobaLogo} 
                alt="AdeGloba Limited" 
                className="h-16 sm:h-20 object-contain filter drop-shadow-lg mx-auto mb-6"
              />
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Yönetim Paneli
              </h1>
              <p className="text-slate-400 text-sm">
                Denizcilik Starlink İnternet Hizmetleri
              </p>
            </div>
            
            {/* Desktop Header */}
            <div className="hidden lg:block text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-6 shadow-lg shadow-cyan-500/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl xl:text-3xl font-bold text-white mb-2">
                Yönetim Paneli
              </h2>
              <p className="text-slate-400">
                Güvenli yönetici girişi
              </p>
            </div>
            
            {/* Login Card */}
            <Card className="bg-slate-900/80 lg:bg-slate-900/60 backdrop-blur-2xl border-slate-800/50 shadow-2xl shadow-black/20">
              <CardContent className="p-8 xl:p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username Input */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-300 font-medium text-sm uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400" />
                      Kullanıcı Adı
                    </Label>
                    <div className="relative group">
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all rounded-xl text-base"
                        placeholder="Kullanıcı adınızı girin"
                        data-testid="input-username"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300 font-medium text-sm uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4 text-cyan-400" />
                      Şifre
                    </Label>
                    <div className="relative group">
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all rounded-xl text-base"
                        placeholder="Şifrenizi girin"
                        data-testid="input-password"
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <Alert className="border-red-500/30 bg-red-500/10 backdrop-blur-sm rounded-xl">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300 ml-2">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 group rounded-xl uppercase tracking-wide"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Giriş Yapılıyor...
                      </>
                    ) : (
                      <>
                        Panele Giriş Yap
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>

                  {/* Security Badge */}
                  <div className="pt-6 border-t border-slate-800/50">
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span>256-bit SSL</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-600" />
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Radio className="w-4 h-4 text-cyan-500" />
                        <span>Güvenli Bağlantı</span>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            {/* System Status */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-slate-500 text-sm">Sistem Aktif</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="relative z-10 py-6 border-t border-slate-800/30">
          <div className="text-center space-y-1 px-4">
            <p className="text-slate-400 text-sm font-medium">
              AdeGloba Starlink System v2.0
            </p>
            <p className="text-slate-600 text-xs">
              © 2025 AdeGloba Limited. Tüm hakları saklıdır.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
