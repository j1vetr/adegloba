import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/AdminLayout";
import {
  Activity,
  Database,
  Clock,
  AlertCircle,
  CheckCircle,
  Server,
  HardDrive,
  Users,
  ShoppingCart
} from "lucide-react";

interface SystemHealth {
  status: string;
  uptime: number;
  databaseConnected: boolean;
  errorRate: number;
}

interface DatabaseStats {
  totalUsers: number;
  totalOrders: number;
  totalShips: number;
  totalPlans: number;
  databaseSize: string;
}

export default function SystemHealthPage() {
  const { user, isLoading: authLoading } = useAdminAuth();

  const { data: health, isLoading: healthLoading } = useQuery<SystemHealth>({
    queryKey: ['/api/admin/system/health'],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: dbStats, isLoading: statsLoading } = useQuery<DatabaseStats>({
    queryKey: ['/api/admin/system/database-stats'],
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-3 border-primary border-t-transparent rounded-full neon-glow"></div>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} gün ${hours} saat`;
    } else if (hours > 0) {
      return `${hours} saat ${minutes} dakika`;
    } else {
      return `${minutes} dakika`;
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      'healthy': { 
        label: 'Sağlıklı', 
        className: 'bg-green-500/20 text-green-300 border-green-500/30', 
        icon: CheckCircle 
      },
      'degraded': { 
        label: 'Performans Düşük', 
        className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', 
        icon: AlertCircle 
      },
      'error': { 
        label: 'Hata', 
        className: 'bg-red-500/20 text-red-300 border-red-500/30', 
        icon: AlertCircle 
      },
    };

    const config = configs[status as keyof typeof configs] || configs.error;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border ${config.className}`}>
        <Icon className="h-5 w-5" />
        {config.label}
      </div>
    );
  };

  const healthCards = [
    {
      title: "Sistem Durumu",
      value: health?.status || 'unknown',
      description: "Genel sistem sağlığı",
      icon: Activity,
      color: health?.status === 'healthy' ? "text-green-400" : "text-red-400",
      bgColor: health?.status === 'healthy' ? "from-green-500/20 to-emerald-500/20" : "from-red-500/20 to-pink-500/20",
      borderColor: health?.status === 'healthy' ? "border-green-500/30" : "border-red-500/30",
      isStatus: true
    },
    {
      title: "Veritabanı",
      value: health?.databaseConnected ? 'Bağlı' : 'Bağlı Değil',
      description: "PostgreSQL durumu",
      icon: Database,
      color: health?.databaseConnected ? "text-blue-400" : "text-red-400",
      bgColor: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30"
    },
    {
      title: "Çalışma Süresi",
      value: formatUptime(health?.uptime || 0),
      description: "Kesintisiz çalışma",
      icon: Clock,
      color: "text-purple-400",
      bgColor: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30"
    },
    {
      title: "Hata Oranı",
      value: `${health?.errorRate || 0}`,
      description: "Son 1 saatteki hatalar",
      icon: AlertCircle,
      color: health?.errorRate && health.errorRate > 50 ? "text-red-400" : "text-green-400",
      bgColor: "from-orange-500/20 to-red-500/20",
      borderColor: "border-orange-500/30"
    }
  ];

  const dbStatsCards = [
    {
      title: "Toplam Kullanıcı",
      value: dbStats?.totalUsers || 0,
      description: "Kayıtlı kullanıcı sayısı",
      icon: Users,
      color: "text-blue-400"
    },
    {
      title: "Toplam Sipariş",
      value: dbStats?.totalOrders || 0,
      description: "Tüm siparişler",
      icon: ShoppingCart,
      color: "text-green-400"
    },
    {
      title: "Toplam Gemi",
      value: dbStats?.totalShips || 0,
      description: "Aktif gemiler",
      icon: Server,
      color: "text-purple-400"
    },
    {
      title: "Veritabanı Boyutu",
      value: dbStats?.databaseSize || 'N/A',
      description: "Disk kullanımı",
      icon: HardDrive,
      color: "text-cyan-400"
    }
  ];

  return (
    <AdminLayout title="Sistem Sağlığı">
      <div className="space-y-8 animate-slide-up">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white neon-text mb-2">
                Sistem Sağlığı & Performans
              </h1>
              <p className="text-light-gray">
                Sistem durumu, veritabanı metrikleri ve performans izleme
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-neon flex items-center justify-center neon-glow mb-2">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-light-gray">Canlı İzleme</span>
              </div>
            </div>
          </div>
        </div>

        {/* Health Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {healthCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                className="glass-card border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 card-hover"
                data-testid={`card-health-${index}`}
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
                  {card.isStatus ? (
                    <div className="mb-2" data-testid={`value-${index}`}>
                      {healthLoading ? (
                        <div className="text-slate-400">Yükleniyor...</div>
                      ) : (
                        getStatusBadge(card.value)
                      )}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-white mb-1" data-testid={`value-${index}`}>
                      {healthLoading ? '...' : card.value}
                    </div>
                  )}
                  <p className="text-xs text-light-gray">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Database Statistics */}
        <Card className="glass-card border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white neon-text">
                  Veritabanı İstatistikleri
                </CardTitle>
                <CardDescription className="text-light-gray">
                  Veritabanı boyutu ve kayıt sayıları
                </CardDescription>
              </div>
              <Database className="h-6 w-6 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dbStatsCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="glass-card p-4 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-all"
                    data-testid={`stat-db-${index}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center">
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div className="text-sm font-medium text-slate-300">{stat.title}</div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1" data-testid={`stat-value-${index}`}>
                      {statsLoading ? '...' : stat.value}
                    </div>
                    <div className="text-xs text-light-gray">{stat.description}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="glass-card border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white neon-text">
              Sistem Bilgileri
            </CardTitle>
            <CardDescription className="text-light-gray">
              Detaylı sistem metrikleri ve yapılandırma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-blue-400" />
                  <span className="text-slate-300">Platform</span>
                </div>
                <span className="text-white font-medium">AdeGloba Starlink System</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">Veritabanı Tipi</span>
                </div>
                <span className="text-white font-medium">PostgreSQL (Neon)</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-purple-400" />
                  <span className="text-slate-300">Zaman Dilimi</span>
                </div>
                <span className="text-white font-medium">Europe/Istanbul (UTC+3)</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  <span className="text-slate-300">Otomatik Yenileme</span>
                </div>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Aktif (30 saniye)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
