import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Lock, CheckCircle, Navigation, Home } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import adeGlobaLogo from '@assets/adegloba-1_1756252463127.png';

export default function Giris() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: authLoading } = useUserAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/panel");
    }
  }, [user, authLoading, setLocation]);

  // Check for registration success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      setSuccess(t.auth.registerSuccess);
    }
  }, []);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Invalidate user auth cache and redirect to user dashboard
        await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
        // Force a brief delay for cache invalidation to take effect
        setTimeout(() => {
          setLocation("/panel");
        }, 100);
      } else {
        setError(data.message || t.auth.loginFailed);
      }
    } catch (error) {
      setError(t.auth.connectionError);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Subtle background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-32 h-32 sm:w-60 sm:h-60 bg-gradient-to-r from-slate-600/10 to-slate-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src={adeGlobaLogo} 
              alt="AdeGloba Limited" 
              className="h-16 sm:h-20 object-contain filter drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t.auth.systemLogin}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            {t.auth.welcomeMessage}
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-white text-xl flex items-center justify-center gap-2">
              <Navigation className="h-5 w-5 text-amber-400" />
              {t.auth.accountLogin}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-amber-400" />
                  {t.auth.username}
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                  placeholder={t.auth.enterUsername}
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-amber-400" />
                  {t.auth.password}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                  placeholder={t.auth.enterPassword}
                  data-testid="input-password"
                />
              </div>

              {success && (
                <Alert className="border-green-500/50 bg-green-500/10 backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-700 hover:via-amber-600 hover:to-yellow-600 text-slate-900 h-12 text-lg font-bold shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105"
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
                    <Navigation className="mr-2 h-5 w-5" />
                    {t.auth.loginButton}
                  </>
                )}
              </Button>
            </form>

            {/* Register Link & Home Button */}
            <div className="mt-6 text-center space-y-4">
              <p className="text-slate-400 text-sm">
                Henüz hesabınız yok mu?{" "}
                <button
                  onClick={() => setLocation("/kayit")}
                  className="text-amber-400 hover:text-amber-300 underline transition-colors"
                  data-testid="link-register"
                >
                  {t.auth.registerButton}
                </button>
              </p>
              
              <div className="pt-2 border-t border-slate-600/30">
                <button
                  type="button"
                  onClick={() => setLocation("/")}
                  className="flex items-center justify-center gap-2 mx-auto text-slate-400 hover:text-white text-sm transition-colors py-2 px-4 rounded-lg hover:bg-slate-700/30"
                  data-testid="button-home"
                >
                  <Home className="h-4 w-4" />
                  Ana Sayfaya Dön
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <div className="flex items-center justify-center mb-2">
            <img 
              src={adeGlobaLogo} 
              alt="AdeGloba Limited" 
              className="h-6 object-contain opacity-70"
            />
          </div>
          <p>© 2025 AdeGloba Limited</p>
          <p className="mt-1">Güvenli ve hızlı deniz internet bağlantısı</p>
        </div>
      </div>
    </div>
  );
}