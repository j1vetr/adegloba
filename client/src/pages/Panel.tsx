import { useQuery } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, History, BarChart3, Ship as ShipIcon, Calendar, CreditCard } from "lucide-react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import type { Order, User } from "@shared/schema";

export default function Panel() {
  const { user, isLoading: authLoading } = useUserAuth();

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Kullanıcı Paneli
            </h1>
            <p className="text-slate-400 mt-2">
              Hoş geldiniz, {user.username} • {user.ship?.name}
            </p>
          </div>
          <Link href="/paketler">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" data-testid="button-buy-packages">
              <Package className="mr-2 h-4 w-4" />
              Data Paketi Al
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="packages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700">
            <TabsTrigger 
              value="packages" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-packages"
            >
              <Package className="mr-2 h-4 w-4" />
              Paketlerim
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-history"
            >
              <History className="mr-2 h-4 w-4" />
              Geçmiş Satın Alımlar
            </TabsTrigger>
            <TabsTrigger 
              value="usage" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-usage"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Kullanım Bilgileri
            </TabsTrigger>
          </TabsList>

          {/* Active Packages */}
          <TabsContent value="packages" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Aktif Paketlerim
                </CardTitle>
              </CardHeader>
              <CardContent>
                {packagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  </div>
                ) : activePackages?.length ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activePackages.map((pkg: any) => (
                      <Card key={pkg.id} className="bg-slate-800/50 border-slate-600" data-testid={`package-card-${pkg.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-white">{pkg.title}</h3>
                            <Badge className="bg-green-600 text-white">Aktif</Badge>
                          </div>
                          <div className="space-y-2 text-sm text-slate-300">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              {pkg.gbAmount} GB
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Bitiş: {formatDate(pkg.expiresAt)}
                            </div>
                            <div className="flex items-center gap-2">
                              <ShipIcon className="h-4 w-4" />
                              {user.ship?.name}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">Henüz aktif paketiniz bulunmamaktadır.</p>
                    <Link href="/paketler">
                      <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
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
                                {item.plan?.title} ({item.plan?.gbAmount} GB)
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
    </Layout>
  );
}