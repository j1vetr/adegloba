import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import AdminLayout from "@/components/AdminLayout";
import { PackageCheck, AlertTriangle, CheckCircle2, TrendingDown, Package } from "lucide-react";

interface StockItem {
  planId: string;
  planName: string;
  shipName: string;
  total: number;
  assigned: number;
  available: number;
  stockLevel: 'critical' | 'low' | 'adequate';
}

export default function StockManagement() {
  // Get stock data
  const { data: stockData, isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/admin/stock-management"],
  });

  const getStockLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'low':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'adequate':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStockLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'low':
        return <TrendingDown className="w-5 h-5 text-yellow-400" />;
      case 'adequate':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      default:
        return <Package className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStockLevelText = (level: string) => {
    switch (level) {
      case 'critical':
        return 'KRİTİK';
      case 'low':
        return 'DÜŞÜK';
      case 'adequate':
        return 'YETERLİ';
      default:
        return 'BİLİNMİYOR';
    }
  };

  const criticalStock = stockData?.filter(item => item.stockLevel === 'critical') || [];
  const lowStock = stockData?.filter(item => item.stockLevel === 'low') || [];
  const adequateStock = stockData?.filter(item => item.stockLevel === 'adequate') || [];

  if (isLoading) {
    return (
      <AdminLayout title="Stok Yönetimi">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-12 w-12 border-3 border-primary border-t-transparent rounded-full neon-glow"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Stok Yönetimi">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Stok Yönetimi</h1>
          <p className="text-slate-400">Paket kredileri için stok durumunu izleyin ve yönetin</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glassmorphism border-red-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Kritik Stok</p>
                <p className="text-3xl font-bold text-red-400">{criticalStock.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="glassmorphism border-yellow-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Düşük Stok</p>
                <p className="text-3xl font-bold text-yellow-400">{lowStock.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <TrendingDown className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="glassmorphism border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Yeterli Stok</p>
                <p className="text-3xl font-bold text-green-400">{adequateStock.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Critical Stock Alert */}
        {criticalStock.length > 0 && (
          <Card className="glassmorphism border-red-500/20 p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-500/20 mt-1">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">⚠️ Kritik Stok Uyarısı</h4>
                <p className="text-slate-400 text-sm">
                  {criticalStock.length} adet paket kritik stok seviyesinde. Lütfen en kısa sürede kredi ekleyin.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stock Table */}
        <Card className="glassmorphism border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/20">
              <PackageCheck className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white">Stok Durumu</h2>
          </div>

          {!stockData || stockData.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Henüz stok verisi bulunmuyor</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Gemi</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Paket</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-400">Toplam</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-400">Kullanılan</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-400">Mevcut</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-400">Kullanım %</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((item, index) => {
                    const usagePercent = item.total > 0 ? Math.round((item.assigned / item.total) * 100) : 0;
                    
                    return (
                      <tr 
                        key={`${item.planId}-${index}`}
                        className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                        data-testid={`stock-row-${item.planId}`}
                      >
                        <td className="py-4 px-4">
                          <span className="text-slate-300 font-medium">{item.shipName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-white">{item.planName}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-slate-300">{item.total}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-slate-300">{item.assigned}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`font-semibold ${
                            item.stockLevel === 'critical' ? 'text-red-400' : 
                            item.stockLevel === 'low' ? 'text-yellow-400' : 
                            'text-green-400'
                          }`}>
                            {item.available}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  usagePercent >= 90 ? 'bg-red-500' :
                                  usagePercent >= 70 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                            <span className="text-slate-400 text-sm w-12 text-right">{usagePercent}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-center">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${getStockLevelColor(item.stockLevel)}`}>
                              {getStockLevelIcon(item.stockLevel)}
                              <span className="text-xs font-semibold">
                                {getStockLevelText(item.stockLevel)}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="glassmorphism border-slate-700 p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 mt-1">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Stok Seviyeleri Hakkında</h4>
              <ul className="text-slate-400 text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span><strong className="text-red-400">Kritik:</strong> Mevcut stok %10'dan az</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span><strong className="text-yellow-400">Düşük:</strong> Mevcut stok %10-30 arasında</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span><strong className="text-green-400">Yeterli:</strong> Mevcut stok %30'dan fazla</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

      </div>
    </AdminLayout>
  );
}
