import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Mail, Lock, Ship as ShipIcon, MapPin, UserPlus, Phone } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useUserAuth } from "@/hooks/useUserAuth";
import type { Ship } from "@shared/schema";
import adeGlobaLogo from '@assets/adegloba-1_1756252463127.png';

export default function Kayit() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    ship_id: "",
    address: ""
  });

  const { user, isLoading: authLoading } = useUserAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/panel");
    }
  }, [user, authLoading, setLocation]);

  // Fetch active ships for dropdown
  const { data: ships, isLoading: shipsLoading } = useQuery<Ship[]>({
    queryKey: ["/api/ships/active"]
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Invalidate user auth cache and redirect to user dashboard after successful registration
        await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
        // Force a brief delay for cache invalidation to take effect
        setTimeout(() => {
          setLocation("/panel");
        }, 100);
      } else {
        setError(data.message || "Kayıt işlemi başarısız");
      }
    } catch (error) {
      setError("Bağlantı hatası oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleShipChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      ship_id: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 py-8">
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
            Sisteme Kayıt
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            AdeGloba Starlink System'e katılın
          </p>
        </div>

        {/* Registration Card */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-white text-xl flex items-center justify-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-400" />
              Yeni Hesap Oluştur
            </CardTitle>
            <p className="text-center text-slate-400 text-sm">
              Sisteme erişim için gerekli bilgileri doldurun
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-slate-300 flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-amber-400" />
                  İsim Soyisim *
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                  placeholder="Adınız ve soyadınızı girin"
                  data-testid="input-full-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-amber-400" />
                  Kullanıcı Adı *
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                  placeholder="Kullanıcı adınızı girin"
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Mail className="h-4 w-4 text-amber-400" />
                  E-posta *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                  placeholder="E-posta adresinizi girin"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-amber-400" />
                  Şifre *
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                  placeholder="Şifrenizi girin (en az 6 karakter)"
                  data-testid="input-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Phone className="h-4 w-4 text-amber-400" />
                  Telefon Numarası *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                  placeholder="Telefon numaranızı girin (ör: +90 532 123 45 67)"
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ship_id" className="text-slate-300 flex items-center gap-2 font-medium">
                  <ShipIcon className="h-4 w-4 text-amber-400" />
                  Gemi Seçin *
                </Label>
                <Select onValueChange={handleShipChange} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white h-12 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm" data-testid="select-ship">
                    <SelectValue placeholder="Geminizi seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800/95 border-slate-600 backdrop-blur-xl">
                    {shipsLoading ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gemiler yükleniyor...
                        </div>
                      </SelectItem>
                    ) : (
                      ships?.map((ship) => (
                        <SelectItem key={ship.id} value={ship.id} className="text-white hover:bg-slate-700">
                          {ship.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-300 flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  Adresiniz
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="bg-slate-800/50 border-slate-600/50 text-white min-h-[80px] placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm resize-none"
                  placeholder="Faturalama/kargo adresinizi girin..."
                  data-testid="textarea-address"
                />
              </div>

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
                data-testid="button-register"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Kayıt işlemi devam ediyor...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Sisteme Kayıt Ol
                  </>
                )}
              </Button>
              
              {/* Private system notice */}
              <p className="text-xs text-slate-500 text-center">
                Bu sistem AdeGloba Starlink System müşterilerine özeldir.
              </p>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Zaten hesabınız var mı?{" "}
                <button
                  onClick={() => setLocation("/giris")}
                  className="text-amber-400 hover:text-amber-300 underline transition-colors"
                  data-testid="link-login"
                >
                  Giriş Yap
                </button>
              </p>
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