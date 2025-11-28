import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Shield, CheckCircle2, AlertTriangle, Eye, EyeOff, LogOut } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useLanguage, LanguageSelector } from "@/contexts/LanguageContext";
import adeGlobaLogo from '@assets/adegloba-1_1756252463127.png';

export default function SifreGuncelle() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user, isLoading: authLoading } = useUserAuth();

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
    passwordsMatch: false
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/giris");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    const password = formData.newPassword;
    setPasswordValidation({
      minLength: password.length >= 12,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      passwordsMatch: password.length > 0 && password === formData.confirmPassword
    });
  }, [formData.newPassword, formData.confirmPassword]);

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

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Yeni şifreler eşleşmiyor");
      setIsLoading(false);
      return;
    }

    if (!passwordValidation.minLength || !passwordValidation.hasLetter || !passwordValidation.hasNumber) {
      setError("Şifre güvenlik gereksinimlerini karşılamıyor");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
        setTimeout(() => {
          setLocation("/panel");
        }, 2000);
      } else {
        setError(data.message || "Şifre güncellenemedi");
      }
    } catch (error) {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
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

  const handleLogout = async () => {
    try {
      await fetch("/api/user/logout", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      setLocation("/giris");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${valid ? 'text-green-400' : 'text-slate-400'}`}>
      {valid ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <div className="h-4 w-4 rounded-full border border-slate-500" />
      )}
      {text}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-32 h-32 sm:w-60 sm:h-60 bg-gradient-to-r from-slate-600/10 to-slate-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Language Selector */}
        <div className="absolute top-0 right-0">
          <LanguageSelector />
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src={adeGlobaLogo} 
              alt="AdeGloba Limited" 
              className="h-16 sm:h-20 object-contain filter drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t.passwordUpdate.title}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            {t.passwordUpdate.subtitle}
          </p>
        </div>

        <Alert className="border-amber-500/50 bg-amber-500/10 backdrop-blur-sm mb-6">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-300">
            {t.passwordUpdate.securityNotice}
          </AlertDescription>
        </Alert>

        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-white text-xl flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              {t.passwordUpdate.title}
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              {t.passwordUpdate.requirements} {t.passwordUpdate.minLength}, {t.passwordUpdate.hasLetter}, {t.passwordUpdate.hasNumber}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-amber-400" />
                  {t.passwordUpdate.currentPassword}
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                    className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm pr-10"
                    placeholder={t.passwordUpdate.currentPasswordPlaceholder}
                    data-testid="input-current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-amber-400" />
                  {t.passwordUpdate.newPassword}
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm pr-10"
                    placeholder={t.passwordUpdate.newPasswordPlaceholder}
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-amber-400" />
                  {t.passwordUpdate.confirmPassword}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm pr-10"
                    placeholder={t.passwordUpdate.confirmPasswordPlaceholder}
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-slate-300 mb-3">{t.passwordUpdate.requirements}</p>
                <ValidationItem valid={passwordValidation.minLength} text={t.passwordUpdate.minLength} />
                <ValidationItem valid={passwordValidation.hasLetter} text={t.passwordUpdate.hasLetter} />
                <ValidationItem valid={passwordValidation.hasNumber} text={t.passwordUpdate.hasNumber} />
                <ValidationItem valid={passwordValidation.passwordsMatch} text={t.passwordUpdate.passwordsMatch} />
              </div>

              {success && (
                <Alert className="border-green-500/50 bg-green-500/10 backdrop-blur-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
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
                disabled={isLoading || !passwordValidation.minLength || !passwordValidation.hasLetter || !passwordValidation.hasNumber || !passwordValidation.passwordsMatch}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold text-base shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                data-testid="button-update-password"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.passwordUpdate.updating}
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    {t.passwordUpdate.updateButton}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleLogout}
                className="w-full h-10 text-slate-400 hover:text-white hover:bg-slate-800/50"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t.passwordUpdate.logoutButton}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-xs mt-6">
          {t.passwordUpdate.securityCompliance}
        </p>
      </div>
    </div>
  );
}
