import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useLanguage, LanguageSelector } from "@/contexts/LanguageContext";
import adeGlobaLogo from "@assets/adegloba-1_1756252463127.png";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(t.auth.passwordResetSent);
        setEmail("");
      } else {
        setError(data.message || t.auth.passwordResetError);
      }
    } catch (error) {
      setError(t.auth.connectionError);
    } finally {
      setIsLoading(false);
    }
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
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src={adeGlobaLogo} 
              alt="AdeGloba Limited" 
              className="h-16 sm:h-20 object-contain filter drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t.auth.forgotPasswordTitle}</h1>
          <p className="text-slate-400 text-sm sm:text-base">{t.auth.forgotPasswordDescription}</p>
        </div>

        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-2xl">
          <CardHeader className="pb-6">
            <div className="text-center text-white text-xl flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-amber-400" />
              <span className="font-semibold">{t.auth.emailLabel}</span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
                  placeholder={t.auth.emailPlaceholder}
                  data-testid="input-email"
                />
              </div>

              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <AlertDescription className="text-green-400">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-700 hover:via-amber-600 hover:to-yellow-600 text-slate-900 h-12 text-lg font-bold shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105"
                disabled={isLoading}
                data-testid="button-reset"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t.auth.sendingPasswordReset}
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-5 w-5" />
                    {t.auth.sendPasswordReset}
                  </>
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setLocation("/giris")}
                className="flex items-center justify-center gap-2 mx-auto text-slate-400 hover:text-white text-sm transition-colors py-2 px-4 rounded-lg hover:bg-slate-700/30"
                data-testid="button-back-login"
              >
                <ArrowLeft className="h-4 w-4" />
                {t.auth.backToLogin}
              </button>
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