import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/AdminLayout";
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Activity,
  Ship,
  Ticket
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading } = useAdminAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/admin/recent-orders"],
    enabled: !!user
  });

  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/recent-users"],
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="Erişim Reddedildi">
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <div className="text-6xl text-red-500 mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-4">Erişim Reddedildi</h2>
            <p className="text-slate-400 mb-6">Bu sayfaya erişim için admin yetkisi gereklidir.</p>
            <a href="/admin/login" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300">
              Admin Girişi
            </a>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const formatCurrency = (value: number | string) => {
    return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: 'default' as const, label: 'Ödendi', className: 'bg-green-600 text-white' },
      pending: { variant: 'secondary' as const, label: 'Bekliyor', className: 'bg-yellow-600 text-white' },
      failed: { variant: 'destructive' as const, label: 'Başarısız', className: 'bg-red-600 text-white' },
      expired: { variant: 'secondary' as const, label: 'Süresi Doldu', className: 'bg-gray-600 text-white' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return config;
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats?.totalUsers || 0)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Kayıtlı müşteriler
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Toplam Sipariş</CardTitle>
              <ShoppingCart className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats?.totalOrders || 0)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tüm siparişler
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Toplam Gelir</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(stats?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ödenen siparişler
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Aktif Paketler</CardTitle>
              <Package className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats?.activePlans || 0)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Satışta olan paketler
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-cyan-400" />
                Son Siparişler
              </CardTitle>
              <CardDescription className="text-slate-400">
                En son verilen siparişler ve durumları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              ) : recentOrders?.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.slice(0, 5).map((order: any) => {
                    const statusConfig = getStatusBadge(order.status);
                    return (
                      <div key={order.id} className="flex items-center justify-between py-3 px-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium text-white">#{order.id.slice(-8).toUpperCase()}</div>
                          <div className="text-sm text-slate-400">{order.user?.username || 'Kullanıcı'}</div>
                          <div className="text-xs text-slate-500">{formatDate(order.createdAt)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white mb-1">{formatCurrency(order.totalUsd)}</div>
                          <Badge className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-400">Henüz sipariş bulunmuyor</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Son Kullanıcılar
              </CardTitle>
              <CardDescription className="text-slate-400">
                Yeni kayıt olan kullanıcılar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              ) : recentUsers?.length > 0 ? (
                <div className="space-y-4">
                  {recentUsers.slice(0, 5).map((user: any) => (
                    <div key={user.id} className="flex items-center space-x-4 py-3 px-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.username?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{user.username}</div>
                        <div className="text-sm text-slate-400">{user.email}</div>
                        {user.ship && (
                          <div className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                            <Ship className="h-3 w-3" />
                            {user.ship.name}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 text-right">
                        {formatDate(user.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-400">Henüz kullanıcı bulunmuyor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Ship className="h-4 w-4 text-blue-400" />
                Toplam Gemi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">
                {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (stats?.totalShips || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Ticket className="h-4 w-4 text-yellow-400" />
                Aktif Kuponlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">
                {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (stats?.activeCoupons || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                Bu Ay Gelir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">
                {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(stats?.monthlyRevenue || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}