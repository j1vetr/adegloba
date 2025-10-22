import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Loader2, Satellite, Shield, ArrowRight, Lock, User, AlertCircle } from "lucide-react";

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
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    setTimeout(() => setLocation("/admin"), 0);
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Gradient Orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Grid Background */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />

          {/* Diagonal Lines */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500 to-transparent" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
            <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-cyan-500 to-transparent" style={{ clipPath: 'polygon(100% 100%, 0 100%, 100% 0)' }} />
          </div>
        </div>

        {/* Login Container */}
        <div className="relative z-10 w-full max-w-[480px]">
          {/* Logo & Title Section */}
          <div className="text-center mb-10">
            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                {/* Outer Glow Ring */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-20 blur-xl animate-pulse" />
                
                {/* Icon Container */}
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Satellite className="w-10 h-10 text-white" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
              Ade Globa Systems
            </h1>
            <p className="text-slate-400 text-lg mb-2">
              Yönetim Paneli
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Sistem Aktif</span>
            </div>
          </div>

          {/* Login Card */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-800 shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Input */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-300 font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
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
                      className="h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-10"
                      placeholder="Kullanıcı adınızı girin"
                      data-testid="input-username"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400" />
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
                      className="h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-10"
                      placeholder="Şifrenizi girin"
                      data-testid="input-password"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <Alert className="border-red-500/30 bg-red-500/10 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300 ml-2">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold text-base shadow-lg hover:shadow-blue-500/50 transition-all duration-300 group"
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
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>SSL Şifreli Güvenli Bağlantı</span>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-2">
            <p className="text-slate-400 text-sm font-medium">
              Ade Globa Systems v2.0
            </p>
            <p className="text-slate-600 text-xs">
              © 2025 Tüm hakları saklıdır
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
