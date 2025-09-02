import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  User,
  Ship as ShipIcon,
  Mail,
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  Lock,
  Key,
  Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import { NotificationSettings } from "@/components/NotificationSettings";
import type { User as UserType, Ship } from "@shared/schema";

export default function Profil() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Country codes for phone number parsing
  const countryCodes = [
    { code: "+90", country: "Türkiye", flag: "🇹🇷" },
    { code: "+1", country: "ABD", flag: "🇺🇸" },
    { code: "+44", country: "İngiltere", flag: "🇬🇧" },
    { code: "+49", country: "Almanya", flag: "🇩🇪" },
    { code: "+33", country: "Fransa", flag: "🇫🇷" },
    { code: "+39", country: "İtalya", flag: "🇮🇹" },
    { code: "+34", country: "İspanya", flag: "🇪🇸" },
    { code: "+31", country: "Hollanda", flag: "🇳🇱" },
    { code: "+32", country: "Belçika", flag: "🇧🇪" },
    { code: "+41", country: "İsviçre", flag: "🇨🇭" },
    { code: "+43", country: "Avusturya", flag: "🇦🇹" },
    { code: "+45", country: "Danimarka", flag: "🇩🇰" },
    { code: "+46", country: "İsveç", flag: "🇸🇪" },
    { code: "+47", country: "Norveç", flag: "🇳🇴" },
    { code: "+358", country: "Finlandiya", flag: "🇫🇮" },
    { code: "+7", country: "Rusya", flag: "🇷🇺" },
    { code: "+86", country: "Çin", flag: "🇨🇳" },
    { code: "+81", country: "Japonya", flag: "🇯🇵" },
    { code: "+82", country: "Güney Kore", flag: "🇰🇷" },
    { code: "+91", country: "Hindistan", flag: "🇮🇳" },
    { code: "+61", country: "Avustralya", flag: "🇦🇺" },
    { code: "+55", country: "Brezilya", flag: "🇧🇷" },
    { code: "+54", country: "Arjantin", flag: "🇦🇷" },
    { code: "+52", country: "Meksika", flag: "🇲🇽" },
    { code: "+27", country: "Güney Afrika", flag: "🇿🇦" },
    { code: "+20", country: "Mısır", flag: "🇪🇬" },
    { code: "+966", country: "Suudi Arabistan", flag: "🇸🇦" },
    { code: "+971", country: "BAE", flag: "🇦🇪" },
    { code: "+964", country: "Irak", flag: "🇮🇶" },
    { code: "+98", country: "İran", flag: "🇮🇷" }
  ];
  


  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phoneCountryCode: "+90",
    phoneNumber: "",
    ship_id: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch user profile with ship information
  const { data: user, isLoading: authLoading } = useQuery<UserType & { ship?: Ship }>({
    queryKey: ['/api/user/me'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch ships for dropdown
  const { data: ships } = useQuery<Ship[]>({
    queryKey: ["/api/ships"],
    enabled: !!user
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Validate password fields if password change is attempted
      if (data.newPassword || data.currentPassword) {
        if (!data.currentPassword) {
          throw new Error("Mevcut şifre gerekli");
        }
        if (!data.newPassword) {
          throw new Error("Yeni şifre gerekli");
        }
        if (data.newPassword !== data.confirmPassword) {
          throw new Error("Yeni şifreler eşleşmiyor");
        }
        if (data.newPassword.length < 6) {
          throw new Error("Yeni şifre en az 6 karakter olmalı");
        }
      }

      // Combine phone country code and number
      const submitData = {
        ...data,
        phone: `${data.phoneCountryCode}${data.phoneNumber}`
      };
      
      const response = await apiRequest('PUT', '/api/user/profile', submitData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Profil bilgileriniz güncellendi.",
      });
      setIsEditing(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      // Refresh user data and packages if ship was changed
      queryClient.invalidateQueries({ queryKey: ['/api/user/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/active-packages'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Profil güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Initialize form data when user data loads
  React.useEffect(() => {
    console.log('👤 User data for form init:', user);
    console.log('👤 User keys:', user ? Object.keys(user) : 'no user');
    console.log('👤 User full_name:', user?.full_name);
    console.log('👤 User phone:', user?.phone);
    console.log('👤 User address:', user?.address);
    if (user) {
      // Parse phone number
      const phone = user.phone || "";
      let phoneCountryCode = "+90";
      let phoneNumber = "";
      
      console.log('📞 Parsing phone:', phone);
      
      if (phone) {
        // Find matching country code
        const matchingCountry = countryCodes.find(country => phone.startsWith(country.code));
        if (matchingCountry) {
          phoneCountryCode = matchingCountry.code;
          phoneNumber = phone.substring(matchingCountry.code.length);
        } else {
          phoneNumber = phone;
        }
      }
      
      const newFormData = {
        full_name: user.full_name || "",
        email: user.email || "",
        phoneCountryCode,
        phoneNumber,
        ship_id: user.ship_id || "",
        address: user.address || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      };
      
      console.log('📝 Setting form data:', newFormData);
      setFormData(newFormData);
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    // Parse phone number
    const phone = user?.phone || "";
    let phoneCountryCode = "+90";
    let phoneNumber = "";
    
    if (phone) {
      const matchingCountry = countryCodes.find(country => phone.startsWith(country.code));
      if (matchingCountry) {
        phoneCountryCode = matchingCountry.code;
        phoneNumber = phone.substring(matchingCountry.code.length);
      } else {
        phoneNumber = phone;
      }
    }
    
    setFormData({
      full_name: user?.full_name || "",
      email: user?.email || "",
      phoneCountryCode,
      phoneNumber,
      ship_id: user?.ship_id || "",
      address: user?.address || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setIsEditing(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <UserNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/giris';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              AdeGloba Starlink System - Profil
            </h1>
            <p className="text-slate-400">
              Profil bilgilerinizi görüntüleyin ve güncelleyin
            </p>
          </div>

          {/* Profile Card */}
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <User className="h-6 w-6 text-blue-400" />
                Profil Bilgileri
              </CardTitle>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white w-full sm:w-auto"
                  data-testid="button-edit-profile"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Profil Düzenle
                </Button>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {/* Read-only Username field */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-400" />
                    Kullanıcı Adı
                  </Label>
                  <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                    {user?.username || "-"}
                  </div>
                  <p className="text-xs text-slate-500">Bu alan değiştirilemez</p>
                </div>

                {/* Editable Email field */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-cyan-400" />
                    E-posta
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="E-posta adresiniz"
                      className="bg-slate-700 border-slate-600 text-white"
                      data-testid="input-email"
                    />
                  ) : (
                    <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                      {user?.email || "Henüz girilmemiş"}
                    </div>
                  )}
                </div>

                {/* Editable Name field */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <User className="h-4 w-4 text-green-400" />
                    İsim Soyisim
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Ad Soyad"
                      className="bg-slate-700 border-slate-600 text-white"
                      data-testid="input-full-name"
                    />
                  ) : (
                    <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                      {user?.full_name || "Henüz girilmemiş"}
                    </div>
                  )}
                </div>

                {/* Editable Phone field */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-400" />
                    Telefon Numarası
                  </Label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        value={formData.phoneCountryCode}
                        onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)}
                        placeholder="+90"
                        className="bg-slate-700 border-slate-600 text-white w-[80px] text-center"
                        data-testid="input-country-code"
                      />
                      <Input
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="532 123 45 67"
                        className="bg-slate-700 border-slate-600 text-white flex-1"
                        data-testid="input-phone-number"
                      />
                    </div>
                  ) : (
                    <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                      {user?.phone || "Henüz girilmemiş"}
                    </div>
                  )}
                </div>

                {/* Editable Ship Selection */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <ShipIcon className="h-4 w-4 text-purple-400" />
                    Seçili Gemi
                  </Label>
                  {isEditing ? (
                    <Select value={formData.ship_id} onValueChange={(value) => handleInputChange('ship_id', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-ship">
                        <SelectValue placeholder="Gemi seçin..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {(ships as Ship[])?.map((ship) => (
                          <SelectItem key={ship.id} value={ship.id} className="text-white focus:bg-slate-600">
                            {ship.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                      {user?.ship?.name || "Gemi seçilmemiş"}
                    </div>
                  )}
                  {isEditing && (
                    <p className="text-xs text-blue-400">Gemi değiştirildiğinde paket atamaları yenilenecek</p>
                  )}
                </div>

                <Separator className="bg-slate-700" />

                {/* Editable Address Field */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-400" />
                    Adres
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Teslimat/fatura adresi"
                      className="bg-slate-700 border-slate-600 text-white resize-none min-h-[80px]"
                      rows={3}
                      data-testid="input-address"
                    />
                  ) : (
                    <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600 min-h-[80px] whitespace-pre-wrap">
                      {user?.address || "Henüz girilmemiş"}
                    </div>
                  )}
                </div>

                {/* Password Change Section - Only show when editing */}
                {isEditing && (
                  <>
                    <Separator className="bg-slate-700" />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Key className="h-5 w-5 text-yellow-400" />
                        Şifre Değiştir (İsteğe Bağlı)
                      </h3>
                      
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-400 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-red-400" />
                            Mevcut Şifre
                          </Label>
                          <Input
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                            placeholder="Mevcut şifrenizi girin"
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="input-current-password"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-400 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-green-400" />
                            Yeni Şifre
                          </Label>
                          <Input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => handleInputChange('newPassword', e.target.value)}
                            placeholder="Yeni şifrenizi girin (en az 6 karakter)"
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="input-new-password"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-400 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-green-400" />
                            Yeni Şifre Tekrar
                          </Label>
                          <Input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            placeholder="Yeni şifrenizi tekrar girin"
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="input-confirm-password"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-pink-400" />
                    Kayıt Tarihi
                  </Label>
                  <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                    {user?.created_at 
                      ? new Date(user.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        })
                      : "-"
                    }
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white flex-1 sm:flex-initial"
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Değişiklikleri Kaydet
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1 sm:flex-initial"
                    data-testid="button-cancel-edit"
                  >
                    <X className="h-4 w-4 mr-2" />
                    İptal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <NotificationSettings />
        </div>
      </div>
    </div>
  );
}