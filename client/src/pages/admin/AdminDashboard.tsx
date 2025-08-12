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
  Gift,
  Star,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-3 border-primary border-t-transparent rounded-full neon-glow"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="Erişim Reddedildi">
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md glass-card p-8 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Erişim Reddedildi</h2>
            <p className="text-muted-foreground mb-6">Bu sayfaya erişim için admin yetkisi gereklidir.</p>
            <a 
              href="/admin/login" 
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-neon text-white rounded-xl hover:scale-105 transition-all duration-300 neon-glow font-medium"
            >
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
      pending: { label: 'Bekliyor', variant: 'secondary', icon: Clock },
      completed: { label: 'Tamamlandı', variant: 'default', icon: CheckCircle },
      cancelled: { label: 'İptal', variant: 'destructive', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge 
        variant={config.variant as any}
        className="flex items-center gap-1 px-2 py-1 rounded-lg font-medium"
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const statCards = [
    {
      title: "Toplam Gelir",
      value: formatCurrency(stats?.totalRevenue || 0),
      description: "Bu ayki toplam gelir",
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true
    },
    {
      title: "Aktif Kullanıcılar",
      value: stats?.totalUsers || 0,
      description: "Kayıtlı kullanıcı sayısı",
      icon: Users,
      trend: "+5.2%",
      trendUp: true
    },
    {
      title: "Toplam Sipariş",
      value: stats?.totalOrders || 0,
      description: "Bu ayki sipariş sayısı",
      icon: ShoppingCart,
      trend: "+8.1%",
      trendUp: true
    },
    {
      title: "Aktif Paketler",
      value: stats?.totalPlans || 0,
      description: "Mevcut veri paketleri",
      icon: Package,
      trend: "2 yeni",
      trendUp: true
    }
  ];

  return (
    <AdminLayout title="Yönetim Paneli">
      <div className="space-y-8 animate-slide-up">
        {/* Welcome Section */}
        <div className="glass-card p-6 rounded-2xl border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground neon-text mb-2">
                Hoş Geldiniz, {user?.username || 'Admin'}
              </h1>
              <p className="text-muted-foreground">
                AdeGloba Starlink System yönetim panelindesiniz. Sistem durumu ve son aktivitelerinizi buradan takip edebilirsiniz.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-neon flex items-center justify-center neon-glow mb-2">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">Sistem Aktif</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="glass-card border-border/50 hover:border-primary/30 transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mb-2">{stat.description}</p>
                  <div className={`flex items-center text-xs ${
                    stat.trendUp ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.trend}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <ShoppingCart className="mr-2 h-5 w-5 text-primary" />
                Son Siparişler
              </CardTitle>
              <CardDescription>En son gelen siparişlerin listesi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : recentOrders?.length > 0 ? (
                recentOrders.slice(0, 5).map((order: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/30 hover:border-primary/20 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">#{order.id.slice(-3)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {order.user?.username || 'Anonim Kullanıcı'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Henüz sipariş bulunmuyor</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Yeni Kullanıcılar
              </CardTitle>
              <CardDescription>Son kayıt olan kullanıcılar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : recentUsers?.length > 0 ? (
                recentUsers.slice(0, 5).map((user: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/30 hover:border-primary/20 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-neon flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.username}</p>
                        <div className="flex items-center space-x-2">
                          <Ship className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {user.ship?.name || 'Gemi seçilmemiş'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        Yeni
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Henüz kullanıcı bulunmuyor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Star className="mr-2 h-5 w-5 text-primary" />
              Hızlı İşlemler
            </CardTitle>
            <CardDescription>Sık kullanılan yönetim işlemleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Yeni Gemi Ekle', href: '/admin/ships', icon: Ship, color: 'from-blue-500 to-cyan-500' },
                { name: 'Paket Yönetimi', href: '/admin/plans', icon: Package, color: 'from-purple-500 to-pink-500' },
                { name: 'Kupon Oluştur', href: '/admin/coupons', icon: Gift, color: 'from-green-500 to-emerald-500' },
                { name: 'Sistem Ayarları', href: '/admin/settings', icon: Activity, color: 'from-orange-500 to-red-500' }
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <a
                    key={index}
                    href={action.href}
                    className="group p-4 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 transition-all duration-300 card-hover"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors duration-200">
                      {action.name}
                    </h3>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}