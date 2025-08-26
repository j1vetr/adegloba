import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, Package, History, Calendar, Clock, Info, ChevronLeft, ChevronRight, Archive, Zap } from "lucide-react";
import { Link } from "wouter";
import { UserNavigation } from "@/components/UserNavigation";
import type { Order, User, Ship } from "@shared/schema";

export default function Panel() {
  const { user, isLoading: authLoading } = useUserAuth() as { user: User & { ship?: Ship }, isLoading: boolean };
  const [expiredPage, setExpiredPage] = useState(1);
  const expiredPageSize = 6;

  const { data: userOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/user/orders"],
    enabled: !!user
  });

  const { data: activePackages, isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/user/active-packages"],
    enabled: !!user
  });

  const { data: expiredPackagesData, isLoading: expiredLoading } = useQuery({
    queryKey: ["/api/user/expired-packages", expiredPage],
    queryFn: async () => {
      const response = await fetch(`/api/user/expired-packages?page=${expiredPage}&pageSize=${expiredPageSize}`);
      if (!response.ok) throw new Error('Failed to fetch expired packages');
      return response.json();
    },
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

  const calculateExpiryInfo = (paidAt: string, expiresAt: string) => {
    if (!expiresAt) {
      // Fallback for old orders without expiresAt
      const paidDate = new Date(paidAt);
      const endOfMonth = new Date(paidDate.getFullYear(), paidDate.getMonth() + 1, 0, 23, 59, 59, 999);
      expiresAt = endOfMonth.toISOString();
    }
    
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate progress from start of month to end of month
    const paidDate = new Date(paidAt);
    const startOfMonth = new Date(paidDate.getFullYear(), paidDate.getMonth(), 1);
    const totalMonthDuration = expirationDate.getTime() - startOfMonth.getTime();
    const elapsed = now.getTime() - startOfMonth.getTime();
    const progressPercentage = totalMonthDuration > 0 ? Math.max(0, Math.min(100, ((totalMonthDuration - Math.max(0, diffTime)) / totalMonthDuration) * 100)) : 0;
    
    return { daysRemaining: Math.max(0, diffDays), expirationDate, progressPercentage };
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
              value="expired" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-300 transition-all duration-300 rounded-md"
              data-testid="tab-expired"
            >
              <Archive className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Süresi Bitmiş Paketlerim</span>
              <span className="sm:hidden">Bitmiş</span>
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
                      const { daysRemaining, expirationDate, progressPercentage } = calculateExpiryInfo(pkg.paidAt || pkg.assignedAt, pkg.expiresAt);
                      
                      return (
                        <Card key={pkg.credentialId} className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10" data-testid={`package-card-${pkg.credentialId}`}>
                          <CardContent className="p-6">
                            <div className="text-center mb-6">
                              <h3 className="font-bold text-white text-xl mb-3">{pkg.planName}</h3>
                              
                              {/* GB Display - Prominent */}
                              <div className="bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-xl p-4 mb-4 border border-blue-500/50">
                                <div className="flex items-baseline justify-center gap-1">
                                  <span className="text-4xl font-bold text-white">{pkg.dataLimitGb}</span>
                                  <span className="text-2xl text-blue-400 font-semibold">GB</span>
                                </div>
                                <p className="text-blue-300 text-sm mt-1 font-medium">Starlink Data Paketi</p>
                              </div>
                              
                              <Badge className={`text-white border-0 px-4 py-1 text-sm font-semibold ${
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
                              
                              <div className="space-y-3">
                                {/* Package Features */}
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="bg-slate-700/30 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-sm text-white mb-1">
                                      <Zap className="h-4 w-4 text-yellow-400" />
                                      <span className="font-medium">Yüksek Hızlı İnternet</span>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                      Starlink uydu teknolojisi ile düşük gecikme
                                    </div>
                                  </div>
                                  
                                  <div className="bg-slate-700/30 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-sm text-white mb-1">
                                      <Info className="h-4 w-4 text-cyan-400" />
                                      <span className="font-medium">Ay Sonu Bitiş Sistemi</span>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                      Bu paket {formatDate(expirationDate.toISOString())} tarihinde sona erecek
                                    </div>
                                  </div>
                                </div>
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
                                  <span>Ay sonu bitiş: {formatDate(expirationDate.toISOString())}</span>
                                </div>
                              </div>
                              
                              {/* Credentials Section */}
                              <div className="bg-gradient-to-r from-slate-700/40 to-slate-600/40 rounded-lg p-4 border border-slate-600/50">
                                <div className="flex items-center gap-2 text-sm text-cyan-400 mb-3">
                                  <Package className="h-4 w-4" />
                                  <span className="font-medium">Bağlantı Bilgileri</span>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-sm font-medium">Kullanıcı Adı:</span>
                                    <span className="text-white font-mono text-sm bg-slate-800/50 px-2 py-1 rounded">{pkg.username}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-sm font-medium">Şifre:</span>
                                    <span className="text-white font-mono text-sm bg-slate-800/50 px-2 py-1 rounded">{pkg.password}</span>
                                  </div>
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

          {/* Expired Packages */}
          <TabsContent value="expired" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Archive className="h-5 w-5 text-red-400" />
                  Süresi Bitmiş Paketlerim
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiredLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-red-400" />
                    <span className="ml-3 text-slate-300">Bitmiş paketler yükleniyor...</span>
                  </div>
                ) : expiredPackagesData?.packages?.length ? (
                  <div className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {expiredPackagesData.packages.map((pkg: any) => (
                        <Card key={pkg.credentialId} className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/50 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10" data-testid={`expired-package-card-${pkg.credentialId}`}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-white text-lg">{pkg.planName}</h3>
                              <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0">
                                Süresi Doldu
                              </Badge>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 text-slate-300">
                                <Package className="h-4 w-4 text-red-400" />
                                <span className="font-medium">{pkg.dataLimitGb} GB Data Paketi</span>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-medium">Satın Alma:</span>
                                    <span className="text-slate-300">{formatDate(pkg.purchaseDate)}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-medium">Bitiş:</span>
                                    <span className="text-red-400 font-medium">{formatDate(pkg.expiredDate)}</span>
                                  </div>
                                </div>
                                
                                <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-xs font-medium">Kullanıcı Adı:</span>
                                    <span className="text-white font-mono text-sm">{pkg.username}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-xs font-medium">Şifre:</span>
                                    <span className="text-white font-mono text-sm">{pkg.maskedPassword}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-2">
                                    Bu bilgiler artık kullanılamaz
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {expiredPackagesData.pagination && expiredPackagesData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                          Toplam {expiredPackagesData.pagination.totalCount} paket • Sayfa {expiredPackagesData.pagination.currentPage} / {expiredPackagesData.pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpiredPage(prev => Math.max(1, prev - 1))}
                            disabled={expiredPackagesData.pagination.currentPage === 1}
                            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                            data-testid="pagination-prev"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Önceki
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpiredPage(prev => Math.min(expiredPackagesData.pagination.totalPages, prev + 1))}
                            disabled={expiredPackagesData.pagination.currentPage === expiredPackagesData.pagination.totalPages}
                            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                            data-testid="pagination-next"
                          >
                            Sonraki
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <Archive className="h-16 w-16 text-slate-400 mx-auto" />
                      <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Süresi Bitmiş Paket Yok</h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                      Henüz süresi dolmuş paketiniz bulunmamaktadır. Aktif paketleriniz sona erdiğinde burada görünecek.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}