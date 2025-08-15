import { useQuery } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, Package, History, BarChart3, Calendar, Clock } from "lucide-react";
import { Link } from "wouter";
import { UserNavigation } from "@/components/UserNavigation";
import type { Order, User, Ship } from "@shared/schema";

export default function Panel() {
  const { user, isLoading: authLoading } = useUserAuth() as { user: User & { ship?: Ship }, isLoading: boolean };

  const { data: userOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/user/orders"],
    enabled: !!user
  });

  const { data: activePackages, isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/user/active-packages"],
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
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700/50 rounded-lg p-1">
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