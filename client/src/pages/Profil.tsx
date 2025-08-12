import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Ship as ShipIcon, Mail, Calendar, MapPin, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import type { User as UserType, Ship } from "@shared/schema";

export default function Profil() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    address: "",
    ship_id: ""
  });

  // Fetch available ships
  const { data: ships = [], isLoading: shipsLoading } = useQuery<Ship[]>({
    queryKey: ["/api/ships"],
    enabled: !!user
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('PUT', '/api/user/profile', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profil Güncellendi",
        description: "Profil bilgileriniz başarıyla güncellendi.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Profil güncellenemedi",
        variant: "destructive",
      });
    },
  });

  // Initialize form data when user data loads
  React.useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        address: user.address || "",
        ship_id: user.ship_id || ""
      });
    }
  }, [user]);

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      username: user.username || "",
      email: user.email || "",
      address: user.address || "",
      ship_id: user.ship_id || ""
    });
    setIsEditing(false);
  };

  const selectedShip = ships.find(ship => ship.id === formData.ship_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Profil</h1>
            <p className="text-slate-400 mt-1">Hesap bilgilerinizi görüntüleyin ve düzenleyin</p>
          </div>
          
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-lg shadow-blue-500/25"
              data-testid="button-edit-profile"
            >
              <Edit className="h-4 w-4 mr-2" />
              Profili Düzenle
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-slate-600 text-slate-300 hover:text-white"
                data-testid="button-cancel-edit"
              >
                <X className="h-4 w-4 mr-2" />
                İptal
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Kaydet
              </Button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <Card className="bg-slate-900/80 backdrop-blur border-slate-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Hesap Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Basic Info */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Kullanıcı Adı</Label>
                {isEditing ? (
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    data-testid="input-username"
                  />
                ) : (
                  <div className="p-3 bg-slate-800/50 rounded-lg text-white" data-testid="text-username">
                    {user.username || "Belirtilmemiş"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">E-posta</Label>
                {isEditing ? (
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    type="email"
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    data-testid="input-email"
                  />
                ) : (
                  <div className="p-3 bg-slate-800/50 rounded-lg text-white flex items-center gap-2" data-testid="text-email">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {user.email || "Belirtilmemiş"}
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Adres</Label>
                {isEditing ? (
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="Adres bilginizi girin"
                    data-testid="input-address"
                  />
                ) : (
                  <div className="p-3 bg-slate-800/50 rounded-lg text-white flex items-center gap-2" data-testid="text-address">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {user.address || "Belirtilmemiş"}
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* Ship Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShipIcon className="h-5 w-5 text-primary" />
                Gemi Ataması
              </h3>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Atanmış Gemi</Label>
                {isEditing ? (
                  <Select 
                    value={formData.ship_id} 
                    onValueChange={(value) => setFormData({ ...formData, ship_id: value })}
                    disabled={shipsLoading}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-ship">
                      <SelectValue placeholder={shipsLoading ? "Gemiler yükleniyor..." : "Gemi seçin"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="" className="text-white focus:bg-primary/20">Gemi Seçilmemiş</SelectItem>
                      {ships.map((ship) => (
                        <SelectItem key={ship.id} value={ship.id} className="text-white focus:bg-primary/20">
                          {ship.name} ({ship.kitNumber || "Kit yok"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 bg-slate-800/50 rounded-lg" data-testid="text-assigned-ship">
                    {selectedShip ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{selectedShip.name}</div>
                          <div className="text-slate-400 text-sm">
                            Kit: {selectedShip.kitNumber || "Belirtilmemiş"}
                          </div>
                        </div>
                        <Badge className={selectedShip.isActive ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                          {selectedShip.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-slate-400 flex items-center gap-2">
                        <ShipIcon className="h-4 w-4" />
                        Gemi atanmamış
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* Account Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Hesap Bilgileri
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Hesap Oluşturma</Label>
                  <div className="p-3 bg-slate-800/50 rounded-lg text-white" data-testid="text-created-at">
                    {formatDate(user.created_at)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Son Güncelleme</Label>
                  <div className="p-3 bg-slate-800/50 rounded-lg text-white" data-testid="text-updated-at">
                    {formatDate(user.updated_at)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}