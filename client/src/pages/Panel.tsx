import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Package, History, BarChart3, Ship as ShipIcon, Calendar, CreditCard, User as UserIcon, Edit, Clock } from "lucide-react";
import { Link } from "wouter";
import { UserNavigation } from "@/components/UserNavigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Order, User, Ship } from "@shared/schema";

export default function Panel() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const { data: userOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/user/orders"],
    enabled: !!user
  });

  const { data: activePackages, isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/user/active-packages"],
    enabled: !!user
  });

  const { data: ships } = useQuery({
    queryKey: ["/api/ships"],
    enabled: !!user
  });

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
      day: 'numeric'
    });
  };

  const formatPrice = (price: string | number) => {
    return `$${Number(price).toFixed(2)}`;
  };

  const calculateDaysRemaining = (paidAt: string, validityDays: number) => {
    const paidDate = new Date(paidAt);
    const expirationDate = new Date(paidDate.getTime() + (validityDays * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { daysRemaining: Math.max(0, diffDays), expirationDate };
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { full_name: string; email: string; address: string; ship_id: string }) => {
      return await apiRequest('PUT', '/api/user/profile', data);
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Profil bilgileriniz güncellendi." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/active-packages"] });
      setIsEditProfileOpen(false);
    },
    onError: () => {
      toast({ title: "Hata", description: "Profil güncellenemedi.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              AdeGloba Starlink System - Kontrol Paneli
            </h1>
            <p className="text-slate-400 text-sm lg:text-base">
              Hoş geldiniz, <span className="text-white font-medium">{user.username}</span>
              {user.ship && (
                <> • <span className="text-blue-400 font-medium">Gemi: {user.ship.name}</span></>
              )}
            </p>
          </div>
          <Link href="/paketler">
            <Button className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg" data-testid="button-buy-packages">
              <Package className="mr-2 h-4 w-4" />
              Data Paketi Satın Al
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="packages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700/50 rounded-lg p-1">
            <TabsTrigger 
              value="packages" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-300 transition-all duration-300 rounded-md"
              data-testid="tab-packages"
            >
              <Package className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Paketlerim</span>
              <span className="sm:hidden">Paketler</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-300 transition-all duration-300 rounded-md"
              data-testid="tab-history"
            >
              <History className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Geçmiş Satın Alımlar</span>
              <span className="sm:hidden">Geçmiş</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-300 transition-all duration-300 rounded-md"
              data-testid="tab-profile"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
              <span className="sm:hidden">Profil</span>
            </TabsTrigger>
            <TabsTrigger 
              value="usage" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-300 transition-all duration-300 rounded-md"
              data-testid="tab-usage"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kullanım Bilgileri</span>
              <span className="sm:hidden">Kullanım</span>
            </TabsTrigger>
          </TabsList>

          {/* Active Packages */}
          <TabsContent value="packages" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-blue-400" />
                  Aktif Paketlerim
                </CardTitle>
              </CardHeader>
              <CardContent>
                {packagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                    <span className="ml-3 text-slate-300">Paketler yükleniyor...</span>
                  </div>
                ) : (activePackages as any)?.length ? (
                  <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {(activePackages as any[]).map((pkg: any) => {
                      const { daysRemaining, expirationDate } = calculateDaysRemaining(pkg.paidAt || pkg.assignedAt, pkg.validityDays);
                      const progressPercentage = Math.max(0, (daysRemaining / pkg.validityDays) * 100);
                      
                      return (
                        <Card key={pkg.credentialId} className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10" data-testid={`package-card-${pkg.credentialId}`}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-white text-lg">{pkg.planName}</h3>
                              <Badge className={`text-white border-0 ${
                                daysRemaining > 7 
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                                  : daysRemaining > 3 
                                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600' 
                                  : 'bg-gradient-to-r from-red-600 to-red-700'
                              }`}>
                                {daysRemaining > 0 ? 'Aktif' : 'Süresi Doldu'}
                              </Badge>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 text-slate-300">
                                <Package className="h-4 w-4 text-blue-400" />
                                <span className="font-medium">{pkg.dataLimitGb} GB Data Paketi</span>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-cyan-400" />
                                    <span className="text-slate-300">Kalan Süre</span>
                                  </div>
                                  <span className={`font-semibold ${
                                    daysRemaining > 7 ? 'text-green-400' 
                                    : daysRemaining > 3 ? 'text-yellow-400' 
                                    : 'text-red-400'
                                  }`}>
                                    {daysRemaining} gün
                                  </span>
                                </div>
                                <Progress 
                                  value={progressPercentage} 
                                  className="h-2 bg-slate-700" 
                                  style={{
                                    '--progress-background': daysRemaining > 7 
                                      ? 'linear-gradient(to right, #059669, #10b981)'
                                      : daysRemaining > 3 
                                      ? 'linear-gradient(to right, #d97706, #f59e0b)'
                                      : 'linear-gradient(to right, #dc2626, #ef4444)'
                                  } as React.CSSProperties}
                                />
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <Calendar className="h-3 w-3" />
                                  <span>Bitiş: {formatDate(expirationDate.toISOString())}</span>
                                </div>
                              </div>
                              
                              <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 text-xs font-medium">Kullanıcı Adı:</span>
                                  <span className="text-white font-mono text-sm">{pkg.username}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 text-xs font-medium">Şifre:</span>
                                  <span className="text-white font-mono text-sm">{pkg.password}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <Package className="h-16 w-16 text-slate-400 mx-auto" />
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Henüz Aktif Paket Yok</h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                      AdeGloba Starlink System'de ilk data paketinizi satın alın ve kesintisiz internete başlayın.
                    </p>
                    <Link href="/paketler">
                      <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 text-base font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                        İlk Paketinizi Satın Alın
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchase History */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Geçmiş Satın Alımlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  </div>
                ) : userOrders?.length ? (
                  <div className="space-y-4">
                    {userOrders.map((order: any) => (
                      <Card key={order.id} className="bg-slate-800/50 border-slate-600" data-testid={`order-card-${order.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-white">Sipariş #{order.id.slice(-8)}</p>
                              <p className="text-sm text-slate-400">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-white">{formatPrice(order.totalUsd)}</p>
                              <Badge 
                                className={order.paidAt ? "bg-green-600 text-white" : "bg-yellow-600 text-white"}
                              >
                                {order.paidAt ? "Ödendi" : "Beklemede"}
                              </Badge>
                            </div>
                          </div>
                          {order.orderItems?.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between text-sm text-slate-300">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                <span>{item.plan?.name} ({item.plan?.dataLimitGb} GB)</span>
                              </div>
                              <span>{formatPrice(item.unitPriceUsd)}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">Henüz satın alım geçmişiniz bulunmamaktadır.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Profile */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-blue-400" />
                  Profil Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Profile Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-400">İsim Soyisim</Label>
                      <div className="text-white font-medium">{user?.full_name || 'Belirtilmemiş'}</div>
                    </div>
                    <div>
                      <Label className="text-slate-400">Kullanıcı Adı</Label>
                      <div className="text-white font-medium">{user?.username}</div>
                    </div>
                    <div>
                      <Label className="text-slate-400">E-posta</Label>
                      <div className="text-white font-medium">{user?.email}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-400">Seçili Gemi</Label>
                      <div className="text-blue-400 font-medium">
                        {user?.ship?.name || 'Gemi seçilmemiş'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400">Adres</Label>
                      <div className="text-white font-medium">
                        {user?.address || 'Adres belirtilmemiş'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400">Kayıt Tarihi</Label>
                      <div className="text-slate-300">
                        {user?.created_at ? formatDate(user.created_at) : 'Bilinmiyor'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Edit Profile Button */}
                <div className="pt-4 border-t border-slate-700">
                  <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        data-testid="button-edit-profile"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Profili Düzenle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-white">Profili Düzenle</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          updateProfileMutation.mutate({
                            full_name: formData.get('full_name') as string,
                            email: formData.get('email') as string,
                            address: formData.get('address') as string,
                            ship_id: formData.get('ship_id') as string,
                          });
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="full_name" className="text-slate-300">İsim Soyisim</Label>
                          <Input
                            id="full_name"
                            name="full_name"
                            defaultValue={user?.full_name || ''}
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="input-full-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-slate-300">E-posta</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={user?.email || ''}
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="input-email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ship_id" className="text-slate-300">Gemi Seçimi</Label>
                          <Select name="ship_id" defaultValue={user?.ship_id || ''}>
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
                        </div>
                        <div>
                          <Label htmlFor="address" className="text-slate-300">Adres</Label>
                          <Textarea
                            id="address"
                            name="address"
                            defaultValue={user?.address || ''}
                            rows={3}
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="textarea-address"
                          />
                        </div>
                        <div className="flex gap-3 pt-4">
                          <Button
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                            data-testid="button-save-profile"
                          >
                            {updateProfileMutation.isPending ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kaydediliyor...</>
                            ) : (
                              'Değişiklikleri Kaydet'
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditProfileOpen(false)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            İptal
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Statistics */}
          <TabsContent value="usage" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Kullanım Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">Kullanım istatistikleri yakında eklenecek.</p>
                  <p className="text-sm text-slate-500">
                    Bu bölümde veri kullanım detaylarınızı görebileceksiniz.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}