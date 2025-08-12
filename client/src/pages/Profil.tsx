import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Key
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import type { User as UserType, Ship } from "@shared/schema";

export default function Profil() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch ship data if user has a ship assigned
  const { data: ship, isLoading: shipLoading } = useQuery({
    queryKey: ['/api/ships', user?.ship_id],
    enabled: !!user?.ship_id
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

      const response = await apiRequest('PUT', '/api/user/profile', data);
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
      queryClient.invalidateQueries({ queryKey: ['/api/user/me'] });
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
    if (user) {
      setFormData({
        address: user.address || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
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
    setFormData({
      address: user?.address || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setIsEditing(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="flex items-center gap-2 text-cyan-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-semibold mb-2">Kullanıcı bulunamadı</h2>
          <p className="text-gray-400">Lütfen giriş yapın.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <UserNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              AdeGloba Starlink System - Kullanıcı Profili
            </h1>
            <p className="text-gray-400">
              Hesap bilgilerinizi görüntüleyin ve güncelleyin
            </p>
          </div>

          {/* Profile Card */}
          <Card className="bg-gray-900/50 border-cyan-500/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-cyan-400 text-xl flex items-center gap-2">
                <User className="h-6 w-6" />
                Profil Bilgileri
              </CardTitle>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                  data-testid="button-edit-profile"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Profil Düzenle
                </Button>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {/* Read-only fields */}
                <div className="flex items-center gap-4">
                  <User className="h-5 w-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">Kullanıcı Adı</p>
                    <p className="text-white text-lg bg-gray-800/50 p-2 rounded border border-cyan-500/20">
                      {user?.username || "-"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Bu alan düzenlenemez</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Mail className="h-5 w-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">E-posta</p>
                    <p className="text-white text-lg bg-gray-800/50 p-2 rounded border border-cyan-500/20">
                      {user?.email || "-"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Bu alan düzenlenemez</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <ShipIcon className="h-5 w-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">Atanan Gemi</p>
                    <p className="text-white text-lg bg-gray-800/50 p-2 rounded border border-cyan-500/20">
                      {shipLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin inline" />
                      ) : ship?.name || "Henüz atanmamış"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Bu alan düzenlenemez</p>
                  </div>
                </div>

                <Separator className="bg-cyan-500/20" />

                {/* Editable Address Field */}
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-cyan-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">Adres</p>
                    {isEditing ? (
                      <Textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Teslimat/fatura adresi"
                        className="bg-gray-900/50 border-cyan-500/30 text-white mt-1 resize-none"
                        rows={3}
                        data-testid="input-address"
                      />
                    ) : (
                      <p className="text-white text-lg">{user?.address || "Henüz girilmemiş"}</p>
                    )}
                  </div>
                </div>

                {/* Password Change Section - Only show when editing */}
                {isEditing && (
                  <>
                    <Separator className="bg-cyan-500/20" />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-cyan-400 flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Şifre Değiştir (İsteğe Bağlı)
                      </h3>
                      
                      <div className="grid gap-4">
                        <div className="flex items-center gap-4">
                          <Lock className="h-5 w-5 text-cyan-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-300">Mevcut Şifre</p>
                            <Input
                              type="password"
                              value={formData.currentPassword}
                              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                              placeholder="Mevcut şifrenizi girin"
                              className="bg-gray-900/50 border-cyan-500/30 text-white mt-1"
                              data-testid="input-current-password"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Lock className="h-5 w-5 text-cyan-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-300">Yeni Şifre</p>
                            <Input
                              type="password"
                              value={formData.newPassword}
                              onChange={(e) => handleInputChange('newPassword', e.target.value)}
                              placeholder="Yeni şifrenizi girin (en az 6 karakter)"
                              className="bg-gray-900/50 border-cyan-500/30 text-white mt-1"
                              data-testid="input-new-password"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Lock className="h-5 w-5 text-cyan-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-300">Yeni Şifre Tekrar</p>
                            <Input
                              type="password"
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                              placeholder="Yeni şifrenizi tekrar girin"
                              className="bg-gray-900/50 border-cyan-500/30 text-white mt-1"
                              data-testid="input-confirm-password"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">Kayıt Tarihi</p>
                    <p className="text-white text-lg">
                      {user?.created_at 
                        ? new Date(user.created_at).toLocaleDateString('tr-TR')
                        : "-"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Kaydet
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    data-testid="button-cancel-edit"
                  >
                    <X className="h-4 w-4 mr-2" />
                    İptal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}