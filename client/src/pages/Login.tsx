import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Loader2, Satellite, Waves, Shield, Lock, User } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

  // Redirect if already authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (isAuthenticated) {
    setTimeout(() => setLocation("/admin"), 0);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg1OSwgMTMwLCAyNDYsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Enhanced Header */}
        <div className="text-center mb-8 space-y-4">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl backdrop-blur-sm border border-blue-500/30">
              <div className="relative">
                <Satellite className="h-12 w-12 text-blue-400" />
                <Waves className="h-6 w-6 text-cyan-400 absolute -bottom-2 -right-2" />
                <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              AdeGloba Starlink System
            </h1>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Yönetim Paneli Girişi</span>
            </div>
          </div>
        </div>

        {/* Enhanced Login Card */}
        <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
              <Lock className="h-5 w-5" />
              <span className="text-lg font-semibold">Güvenli Giriş</span>
            </div>
            <p className="text-center text-sm text-slate-400">
              Lütfen yönetici bilgilerinizle giriş yapın
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 text-sm font-medium">
                  Kullanıcı Adı
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Kullanıcı adınızı girin"
                    data-testid="input-username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                  Şifre
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Şifrenizi girin"
                    data-testid="input-password"
                  />
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="border-red-500/50 bg-red-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertDescription className="text-red-400 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-6 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Yönetim Paneline Giriş Yap
                  </>
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-400 text-center">
                <Shield className="inline h-3 w-3 mr-1" />
                Bu sayfa şifrelenmiş bağlantı ile korunmaktadır
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-slate-400 text-sm">
            AdeGloba Starlink System v1.0
          </p>
          <p className="text-slate-500 text-xs">
            © 2024 Tüm hakları saklıdır
          </p>
        </div>
      </div>
    </div>
  );
}
