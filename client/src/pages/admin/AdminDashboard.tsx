import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";

interface Stats {
  totalShips: number;
  totalPlans: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neon-cyan"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Hoş Geldiniz!</h1>
          <p className="text-slate-300">StarLink Marine yönetim paneline genel bakış</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-ships">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-2">Toplam Gemiler</p>
                <p className="text-3xl font-bold text-neon-cyan">{stats?.totalShips || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                <i className="fas fa-ship text-neon-cyan text-xl"></i>
              </div>
            </div>
          </Card>

          <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-plans">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-2">Veri Paketleri</p>
                <p className="text-3xl font-bold text-neon-purple">{stats?.totalPlans || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                <i className="fas fa-box text-neon-purple text-xl"></i>
              </div>
            </div>
          </Card>

          <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-orders">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-2">Toplam Siparişler</p>
                <p className="text-3xl font-bold text-neon-green">{stats?.totalOrders || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-neon-green/20 flex items-center justify-center">
                <i className="fas fa-shopping-cart text-neon-green text-xl"></i>
              </div>
            </div>
          </Card>

          <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="stat-revenue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-2">Toplam Gelir</p>
                <p className="text-3xl font-bold text-yellow-400">${stats?.totalRevenue?.toLocaleString() || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-400/20 flex items-center justify-center">
                <i className="fas fa-dollar-sign text-yellow-400 text-xl"></i>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glassmorphism rounded-xl p-6 border-transparent">
            <h3 className="text-xl font-bold text-white mb-4">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <a
                href="/admin/ships"
                className="flex items-center space-x-3 p-3 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors text-neon-cyan"
                data-testid="quick-ships"
              >
                <i className="fas fa-plus"></i>
                <span>Yeni Gemi Ekle</span>
              </a>
              <a
                href="/admin/plans"
                className="flex items-center space-x-3 p-3 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 transition-colors text-neon-purple"
                data-testid="quick-plans"
              >
                <i className="fas fa-plus"></i>
                <span>Yeni Paket Ekle</span>
              </a>
              <a
                href="/admin/coupons"
                className="flex items-center space-x-3 p-3 rounded-lg bg-neon-green/10 hover:bg-neon-green/20 transition-colors text-neon-green"
                data-testid="quick-coupons"
              >
                <i className="fas fa-plus"></i>
                <span>Yeni Kupon Oluştur</span>
              </a>
            </div>
          </Card>

          <Card className="glassmorphism rounded-xl p-6 border-transparent">
            <h3 className="text-xl font-bold text-white mb-4">Son Siparişler</h3>
            <div className="space-y-3">
              <div className="text-center py-8">
                <i className="fas fa-shopping-cart text-4xl text-slate-500 mb-3"></i>
                <p className="text-slate-400">Henüz sipariş bulunmamaktadır</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}