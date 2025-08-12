import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Giriş başarılı! Admin paneline yönlendiriliyorsunuz.",
      });
      setLocation("/admin");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Giriş başarısız. Kullanıcı adı ve şifrenizi kontrol edin.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Hata",
        description: "Lütfen kullanıcı adı ve şifrenizi girin.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-blue via-space-dark to-space-blue text-slate-200 flex items-center justify-center">
      {/* Stellar background with animated particles */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-neon-purple rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-neon-cyan rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 right-10 w-1.5 h-1.5 bg-neon-purple rounded-full animate-ping"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto">
          <Card className="glassmorphism rounded-2xl p-8 border-transparent">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-satellite text-white text-2xl"></i>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Admin Giriş</h1>
                <p className="text-slate-300">StarLink Marine Yönetim Paneli</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-lg font-semibold text-white">
                    Kullanıcı Adı
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Kullanıcı adınızı girin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 text-lg glassmorphism border-slate-600 hover:border-neon-cyan transition-colors focus:border-neon-cyan focus:ring-neon-cyan/20"
                    data-testid="username-input"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-lg font-semibold text-white">
                    Şifre
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Şifrenizi girin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-lg glassmorphism border-slate-600 hover:border-neon-cyan transition-colors focus:border-neon-cyan focus:ring-neon-cyan/20"
                    data-testid="password-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 text-lg rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold hover:shadow-xl hover:shadow-neon-cyan/25 transition-all transform hover:scale-105 disabled:opacity-50"
                data-testid="login-button"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Giriş Yap
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}