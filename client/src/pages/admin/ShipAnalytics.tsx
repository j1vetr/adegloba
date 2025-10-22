import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/AdminLayout";
import {
  Ship,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";

interface ShipAnalytics {
  shipId: string;
  shipName: string;
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  totalPackagesSold: number;
}

interface ShipPerformance {
  shipId: string;
  shipName: string;
  monthlyRevenue: number;
  monthlyOrders: number;
  growthRate: number;
}

export default function ShipAnalyticsPage() {
  const { user, isLoading: authLoading } = useAdminAuth();

  const { data: analytics, isLoading: analyticsLoading } = useQuery<ShipAnalytics[]>({
    queryKey: ['/api/admin/analytics/ships'],
    enabled: !!user,
  });

  const { data: performance, isLoading: performanceLoading } = useQuery<ShipPerformance[]>({
    queryKey: ['/api/admin/analytics/ships/performance'],
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-3 border-primary border-t-transparent rounded-full neon-glow"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('tr-TR');
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const totalRevenue = analytics?.reduce((sum, ship) => sum + ship.totalRevenue, 0) || 0;
  const totalOrders = analytics?.reduce((sum, ship) => sum + ship.totalOrders, 0) || 0;
  const totalUsers = analytics?.reduce((sum, ship) => sum + ship.activeUsers, 0) || 0;

  const summaryCards = [
    {
      title: "Toplam Gemi Geliri",
      value: formatCurrency(totalRevenue),
      description: `${formatNumber(totalOrders)} sipariş`,
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30"
    },
    {
      title: "Aktif Gemiler",
      value: analytics?.length || 0,
      description: "Satış yapan gemiler",
      icon: Ship,
      color: "text-blue-400",
      bgColor: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30"
    },
    {
      title: "Toplam Kullanıcı",
      value: formatNumber(totalUsers),
      description: "Tüm gemilerde",
      icon: Users,
      color: "text-purple-400",
      bgColor: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30"
    }
  ];

  return (
    <AdminLayout title="Gemi Bazlı Analitik">
      <div className="space-y-8 animate-slide-up">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white neon-text mb-2">
                Gemi Bazlı Analitik
              </h1>
              <p className="text-light-gray">
                Gemi performansı, gelir analizi ve karşılaştırma raporları
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-neon flex items-center justify-center neon-glow mb-2">
                  <Ship className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-light-gray">Gemi Analizi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                className="glass-card border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 card-hover"
                data-testid={`card-ship-summary-${index}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    {card.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${card.bgColor} border ${card.borderColor} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white mb-1" data-testid={`value-${index}`}>
                    {analyticsLoading ? '...' : card.value}
                  </div>
                  <p className="text-xs text-light-gray">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Ship Analytics Table */}
        <Card className="glass-card border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white neon-text">
                  Gemi Performans Tablosu
                </CardTitle>
                <CardDescription className="text-light-gray">
                  Tüm gemilerin detaylı performans metrikleri
                </CardDescription>
              </div>
              <Activity className="h-6 w-6 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Gemi Adı</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Toplam Gelir</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Sipariş</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Kullanıcı</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Paket Satışı</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Ort. Sipariş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics && analytics.length > 0 ? (
                      analytics.map((ship, index) => (
                        <tr
                          key={ship.shipId}
                          className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                          data-testid={`row-ship-${index}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Ship className="h-4 w-4 text-cyan-400" />
                              <span className="text-white font-medium">{ship.shipName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-green-400 font-semibold">
                            {formatCurrency(ship.totalRevenue)}
                          </td>
                          <td className="py-3 px-4 text-right text-white">
                            {formatNumber(ship.totalOrders)}
                          </td>
                          <td className="py-3 px-4 text-right text-blue-400">
                            {formatNumber(ship.activeUsers)}
                          </td>
                          <td className="py-3 px-4 text-right text-white">
                            {formatNumber(ship.totalPackagesSold)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            {formatCurrency(ship.totalOrders > 0 ? ship.totalRevenue / ship.totalOrders : 0)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Henüz veri bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Performance Comparison */}
        <Card className="glass-card border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white neon-text">
                  Aylık Performans Karşılaştırma
                </CardTitle>
                <CardDescription className="text-light-gray">
                  Bu ay ve geçen aya göre büyüme oranı
                </CardDescription>
              </div>
              <TrendingUp className="h-6 w-6 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Gemi Adı</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Bu Ay Gelir</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Bu Ay Sipariş</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Büyüme Oranı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance && performance.length > 0 ? (
                      performance.map((ship, index) => (
                        <tr
                          key={ship.shipId}
                          className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                          data-testid={`row-performance-${index}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Ship className="h-4 w-4 text-cyan-400" />
                              <span className="text-white font-medium">{ship.shipName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-green-400 font-semibold">
                            {formatCurrency(ship.monthlyRevenue)}
                          </td>
                          <td className="py-3 px-4 text-right text-white">
                            {formatNumber(ship.monthlyOrders)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {ship.growthRate >= 0 ? (
                                <>
                                  <TrendingUp className="h-4 w-4 text-green-400" />
                                  <span className="text-green-400 font-semibold">
                                    {formatPercentage(ship.growthRate)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="h-4 w-4 text-red-400" />
                                  <span className="text-red-400 font-semibold">
                                    {formatPercentage(ship.growthRate)}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Henüz veri bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
