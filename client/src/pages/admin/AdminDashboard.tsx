import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/AdminLayout";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
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
  CheckCircle,
  TrendingDown,
  Loader2,
  BarChart3,
  PieChart
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface DashboardStats {
  totalRevenue: number;
  activeUsers: number;
  activePackages: number;
  totalOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  createdAt: string;
  status: string;
  totalUsd?: string;
  total_usd?: string;
  user?: {
    username: string;
  };
}

interface RecentUser {
  id: string;
  username: string;
  createdAt: string;
  created_at?: string;
  ship?: {
    name: string;
  };
}

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface PopularPackage {
  name: string;
  count: number;
  revenue: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'ticket' | 'payment';
  message: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

export default function AdminDashboard() {
  const { user, isLoading } = useAdminAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user
  });

  const { data: recentOrders, isLoading: ordersLoading, error: ordersError } = useQuery<RecentOrder[]>({
    queryKey: ["/api/admin/recent-orders"],
    enabled: !!user
  });

  const { data: recentUsers, isLoading: usersLoading, error: usersError } = useQuery<RecentUser[]>({
    queryKey: ["/api/admin/recent-users"],
    enabled: !!user
  });

  // Fetch revenue data for charts
  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData[]>({
    queryKey: ['/api/admin/dashboard/revenue', timeRange],
    enabled: !!user
  });

  // Fetch popular packages
  const { data: popularPackages, isLoading: packagesLoading } = useQuery<PopularPackage[]>({
    queryKey: ['/api/admin/dashboard/popular-packages'],
    enabled: !!user
  });

  // Fetch recent activities
  const { data: activities, isLoading: activitiesLoading } = useQuery<RecentActivity[]>({
    queryKey: ['/api/admin/dashboard/activities'],
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  const formatChartCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4" />;
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'ticket':
        return <AlertCircle className="w-4 h-4" />;
      case 'payment':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

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
            <h2 className="text-2xl font-bold text-white mb-4">Erişim Reddedildi</h2>
            <p className="text-light-gray mb-6">Bu sayfaya erişim için admin yetkisi gereklidir.</p>
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

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '$0.00';
    const numValue = Number(value);
    if (isNaN(numValue)) return '$0.00';
    return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Tarih bilinmiyor';
    
    try {
      // Parse the date and convert to Istanbul timezone
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Geçersiz tarih';
      }
      
      const istanbulDate = toZonedTime(date, 'Europe/Istanbul');
      return format(istanbulDate, 'd MMM yyyy HH:mm', { locale: tr });
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateString);
      return 'Tarih hatası';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Bekliyor', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: Clock },
      paid: { label: 'Ödendi', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: CheckCircle },
      completed: { label: 'Tamamlandı', className: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle },
      cancelled: { label: 'İptal', className: 'bg-red-500/20 text-red-300 border-red-500/30', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium border ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </div>
    );
  };

  const statCards = [
    {
      title: "Toplam Gelir",
      value: formatCurrency(stats?.totalRevenue || 0),
      description: "Tamamlanan siparişlerden gelir",
      icon: DollarSign,
      trend: "USD",
      trendUp: true,
      color: "text-green-400"
    },
    {
      title: "Aktif Kullanıcılar",
      value: stats?.activeUsers || 0,
      description: "Aktif paketi olan kullanıcılar",
      icon: Users,
      trend: "kullanıcı",
      trendUp: true,
      color: "text-blue-400"
    },
    {
      title: "Tamamlanan Sipariş",
      value: stats?.totalOrders || 0,
      description: "Başarıyla tamamlanan siparişler",
      icon: ShoppingCart,
      trend: "sipariş",
      trendUp: true,
      color: "text-purple-400"
    }
  ];

  return (
    <AdminLayout title="Yönetim Paneli">
      <div className="space-y-8 animate-slide-up">
        {/* Welcome Section */}
        <div className="glass-card p-6 rounded-2xl border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white neon-text mb-2">
                Hoş Geldiniz, {user?.username || 'Admin'}
              </h1>
              <p className="text-light-gray">
                AdeGloba Starlink System yönetim panelindesiniz. Sistem durumu ve son aktivitelerinizi buradan takip edebilirsiniz.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-neon flex items-center justify-center neon-glow mb-2">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-light-gray">Sistem Aktif</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="glass-card border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    {stat.title}
                  </CardTitle>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Icon className={`h-5 w-5 ${(stat as any).color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <p className="text-xs text-slate-400 mb-2">{stat.description}</p>
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
          <Card className="glass-card border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <ShoppingCart className="mr-2 h-5 w-5 text-cyan-400" />
                Son Siparişler
              </CardTitle>
              <CardDescription className="text-slate-400">En son gelen siparişlerin listesi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : ordersError ? (
                <div className="text-center py-8 text-red-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>Siparişler yüklenirken hata oluştu</p>
                </div>
              ) : recentOrders && recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map((order, index) => {
                  // Handle both camelCase and snake_case field names from database
                  const orderTotal = order.totalUsd || (order as any).total_usd || '0';
                  const orderDate = order.createdAt || (order as any).created_at;
                  
                  return (
                    <div key={order.id || index} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-600/50 hover:border-cyan-500/30 transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                          <span className="text-xs font-medium text-cyan-400">#{order.id.slice(-3)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {order.user?.username || 'Anonim Kullanıcı'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(orderDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {formatCurrency(orderTotal)}
                        </p>
                        <div className="mt-1">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Henüz sipariş bulunmuyor</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="glass-card border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Users className="mr-2 h-5 w-5 text-cyan-400" />
                Yeni Kullanıcılar
              </CardTitle>
              <CardDescription className="text-slate-400">Son kayıt olan kullanıcılar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : usersError ? (
                <div className="text-center py-8 text-red-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>Kullanıcılar yüklenirken hata oluştu</p>
                </div>
              ) : recentUsers && recentUsers.length > 0 ? (
                recentUsers.slice(0, 5).map((user, index) => {
                  // Handle both camelCase and snake_case field names from database
                  const userDate = user.createdAt || user.created_at;
                  
                  return (
                    <div key={user.id || index} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-600/50 hover:border-cyan-500/30 transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.username}</p>
                          <div className="flex items-center space-x-2">
                            <Ship className="h-3 w-3 text-slate-400" />
                            <p className="text-xs text-slate-400">
                              {user.ship?.name || 'Gemi seçilmemiş'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          {formatDate(userDate)}
                        </p>
                        <Badge variant="outline" className="mt-1 text-cyan-400 border-cyan-500/50">
                          Yeni
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Henüz kullanıcı bulunmuyor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card className="glass-card border-slate-700/50 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 w-5 text-blue-400" />
                  Gelir Grafiği
                </CardTitle>
                <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-auto">
                  <TabsList className="bg-slate-800/50 border-slate-700">
                    <TabsTrigger value="7d" className="text-xs">7 Gün</TabsTrigger>
                    <TabsTrigger value="30d" className="text-xs">30 Gün</TabsTrigger>
                    <TabsTrigger value="90d" className="text-xs">90 Gün</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="flex items-center justify-center h-80">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8"
                      tickFormatter={formatChartDate}
                    />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: any) => [formatChartCurrency(value), 'Gelir']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Popular Packages */}
          <Card className="glass-card border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Popüler Paketler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {packagesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPie>
                    <Pie
                      data={popularPackages}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {popularPackages?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="glass-card border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Son Aktiviteler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {activities?.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-slate-700/50">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200">{activity.message}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      {getStatusIcon(activity.status)}
                    </div>
                  ))}
                  {(!activities || activities.length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Henüz aktivite yok</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-card border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Star className="mr-2 h-5 w-5 text-cyan-400" />
              Hızlı İşlemler
            </CardTitle>
            <CardDescription className="text-slate-400">Sık kullanılan yönetim işlemleri</CardDescription>
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
                    className="group p-4 rounded-xl bg-slate-800/50 border border-slate-600/30 hover:border-cyan-500/30 transition-all duration-300 card-hover"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-white text-sm group-hover:text-cyan-400 transition-colors duration-200">
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