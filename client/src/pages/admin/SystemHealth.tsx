import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  ShoppingCart,
  Cpu,
  MemoryStick,
  Globe,
  Zap
} from "lucide-react";

interface SystemHealth {
  status: string;
  uptime: number;
  databaseConnected: boolean;
  errorRate: number;
  platform: string;
  hostname: string;
  osType: string;
  osRelease: string;
  cpuUsage: number;
  memoryUsage: number;
  totalMemory: number;
  freeMemory: number;
  nginxStatus?: string;
  nodeVersion: string;
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'Running':
      case 'active':
      case 'Bağlı':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      default:
        return 'text-red-400';
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

  return (
    <AdminLayout title="Sistem Sağlığı">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Sistem Sağlığı & Performans
            </h1>
            <p className="text-slate-400">
              Production sunucu durumu ve performans metrikleri
            </p>
          </div>
          {health && getStatusBadge(health.status)}
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* System Status */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Sistem Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className={`text-2xl font-bold ${getStatusColor(health?.status)}`}>
                  {health?.status === 'healthy' ? 'Sağlıklı' : health?.status || 'Bilinmiyor'}
                </p>
                <p className="text-xs text-slate-500">Genel sistem sağlığı</p>
              </div>
            </CardContent>
          </Card>

          {/* Database */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Veritabanı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className={`text-2xl font-bold ${getStatusColor(health?.databaseConnected ? 'Bağlı' : undefined)}`}>
                  {health?.databaseConnected ? 'Bağlı' : 'Bağlı Değil'}
                </p>
                <p className="text-xs text-slate-500">PostgreSQL durumu</p>
              </div>
            </CardContent>
          </Card>

          {/* Uptime */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Çalışma Süresi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-purple-400">
                  {formatUptime(health?.uptime || 0)}
                </p>
                <p className="text-xs text-slate-500">Kesintisiz çalışma</p>
              </div>
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Hata Oranı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className={`text-2xl font-bold ${health?.errorRate && health.errorRate > 50 ? 'text-red-400' : 'text-green-400'}`}>
                  {health?.errorRate || 0}
                </p>
                <p className="text-xs text-slate-500">Son 1 saatteki hatalar</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Server Information */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5" />
              Sunucu Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* OS Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Globe className="h-4 w-4" />
                  <span>İşletim Sistemi</span>
                </div>
                <p className="text-lg font-medium text-white">{health?.osType || 'N/A'}</p>
                <p className="text-xs text-slate-500">Platform: {health?.platform || 'N/A'}</p>
                <p className="text-xs text-slate-500">Version: {health?.osRelease || 'N/A'}</p>
              </div>

              {/* Hostname */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Server className="h-4 w-4" />
                  <span>Hostname</span>
                </div>
                <p className="text-lg font-medium text-white break-all">{health?.hostname || 'N/A'}</p>
                <p className="text-xs text-slate-500">Sunucu adı</p>
              </div>

              {/* Node Version */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Zap className="h-4 w-4" />
                  <span>Node.js</span>
                </div>
                <p className="text-lg font-medium text-white">{health?.nodeVersion || 'N/A'}</p>
                <p className="text-xs text-slate-500">Runtime version</p>
              </div>

              {/* Nginx Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Globe className="h-4 w-4" />
                  <span>Nginx</span>
                </div>
                <p className={`text-lg font-medium ${getStatusColor(health?.nginxStatus)}`}>
                  {health?.nginxStatus || 'N/A'}
                </p>
                <p className="text-xs text-slate-500">Web server durumu</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CPU Usage */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                CPU Kullanımı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Load Average</span>
                <span className="text-lg font-semibold text-white">{health?.cpuUsage?.toFixed(2) || 0}%</span>
              </div>
              <Progress 
                value={health?.cpuUsage || 0} 
                className="h-3"
              />
              <p className="text-xs text-slate-500">
                {health?.cpuUsage && health.cpuUsage > 80 
                  ? 'Yüksek CPU kullanımı tespit edildi' 
                  : 'CPU kullanımı normal seviyede'}
              </p>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MemoryStick className="h-5 w-5" />
                Bellek Kullanımı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {formatBytes(health?.totalMemory ? health.totalMemory - (health.freeMemory || 0) : 0)} / {formatBytes(health?.totalMemory || 0)}
                </span>
                <span className="text-lg font-semibold text-white">{health?.memoryUsage?.toFixed(2) || 0}%</span>
              </div>
              <Progress 
                value={health?.memoryUsage || 0} 
                className="h-3"
              />
              <p className="text-xs text-slate-500">
                Kullanılabilir: {formatBytes(health?.freeMemory || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Database Statistics */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5" />
              Veritabanı İstatistikleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Total Users */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users className="h-4 w-4" />
                  <span>Kullanıcılar</span>
                </div>
                <p className="text-3xl font-bold text-blue-400">{dbStats?.totalUsers || 0}</p>
              </div>

              {/* Total Orders */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Siparişler</span>
                </div>
                <p className="text-3xl font-bold text-green-400">{dbStats?.totalOrders || 0}</p>
              </div>

              {/* Total Ships */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Server className="h-4 w-4" />
                  <span>Gemiler</span>
                </div>
                <p className="text-3xl font-bold text-purple-400">{dbStats?.totalShips || 0}</p>
              </div>

              {/* Database Size */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <HardDrive className="h-4 w-4" />
                  <span>DB Boyutu</span>
                </div>
                <p className="text-3xl font-bold text-cyan-400">{dbStats?.databaseSize || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto Refresh Notice */}
        <div className="text-center text-sm text-slate-500">
          <p>Sistem metrikleri 30 saniyede bir otomatik güncellenir</p>
        </div>
      </div>
    </AdminLayout>
  );
}
