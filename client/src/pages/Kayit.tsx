import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Satellite, Waves, User, Mail, Lock, Ship as ShipIcon, MapPin } from "lucide-react";
import type { Ship } from "@shared/schema";

export default function Kayit() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    ship_id: "",
    address: ""
  });

  // Fetch active ships for dropdown
  const { data: ships, isLoading: shipsLoading } = useQuery<Ship[]>({
    queryKey: ["/api/ships"]
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        // Redirect to user dashboard after successful registration
        setLocation("/panel");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4 space-x-2">
            <div className="relative">
              <Satellite className="h-8 w-8 text-blue-400" />
              <Waves className="h-4 w-4 text-cyan-400 absolute -bottom-1 -right-1" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Starlink Veri Paketleri
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Hesap Oluştur
          </h1>
          <p className="text-slate-400">
            Starlink veri paketlerine erişim için kayıt olun
          </p>
        </div>

        {/* Registration Card */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-center text-white">Kayıt Ol</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Kullanıcı Adı
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                  placeholder="Kullanıcı adınızı girin"
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-posta
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                  placeholder="E-posta adresinizi girin"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Şifre
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                  placeholder="Şifrenizi girin (en az 6 karakter)"
                  data-testid="input-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ship_id" className="text-slate-300 flex items-center gap-2">
                  <ShipIcon className="h-4 w-4" />
                  Gemi
                </Label>
                <Select onValueChange={handleShipChange} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white focus:border-blue-500" data-testid="select-ship">
                    <SelectValue placeholder="Geminizi seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
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
                <Label htmlFor="address" className="text-slate-300 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adres
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 resize-none"
                  placeholder="Faturalama/kargo adresinizi girin..."
                  data-testid="textarea-address"
                />
              </div>

              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kayıt işlemi...
                  </>
                ) : (
                  "Kayıt Ol"
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Zaten hesabınız var mı?{" "}
                <button
                  onClick={() => setLocation("/giris")}
                  className="text-blue-400 hover:text-blue-300 underline"
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
          <p>© 2024 Starlink Veri Paketleri</p>
          <p className="mt-1">Güvenli ve hızlı deniz internet bağlantısı</p>
        </div>
      </div>
    </div>
  );
}