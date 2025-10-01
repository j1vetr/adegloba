import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AdminLayout from "@/components/AdminLayout";
import { BarChart3, TrendingUp, DollarSign, Package, Download, FileSpreadsheet, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type DateRange = 'last7days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';

interface ReportData {
  shipId: string;
  shipName: string;
  totalOrders: number;
  totalRevenue: number;
  totalDataGB: number;
  packagesSold: number;
}

export default function Reports() {
  const [selectedShip, setSelectedShip] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Export function
  const handleExport = (format: 'excel' | 'csv') => {
    const params = new URLSearchParams({
      ship: selectedShip,
      range: dateRange,
      format: format
    });
    
    // Create a temporary link to trigger download
    const url = `/api/admin/reports/export?${params.toString()}`;
    const link = document.createElement('a');
    link.href = url;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExportDialogOpen(false);
  };

  // Get ships for dropdown
  const { data: ships } = useQuery({
    queryKey: ["/api/admin/ships"],
    queryFn: async () => {
      const response = await fetch("/api/admin/ships", {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });
      return response.json();
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the result
  });

  // Get report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/admin/reports", selectedShip, dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/reports?ship=${selectedShip}&range=${dateRange}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });
      return response.json();
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the result
  });

  const dateRangeOptions = {
    'last7days': 'Son 7 Gün',
    'thisMonth': 'Bu Ay',
    'lastMonth': 'Geçen Ay', 
    'thisYear': 'Bu Yıl',
    'lastYear': 'Geçen Yıl'
  };

  const totalStats = reportData ? {
    totalOrders: reportData.reduce((sum: number, item: ReportData) => sum + item.totalOrders, 0),
    totalRevenue: reportData.reduce((sum: number, item: ReportData) => sum + item.totalRevenue, 0),
    totalDataGB: reportData.reduce((sum: number, item: ReportData) => sum + item.totalDataGB, 0),
    packagesSold: reportData.reduce((sum: number, item: ReportData) => sum + item.packagesSold, 0),
  } : null;

  return (
    <AdminLayout title="Finans Raporlaması">
      <div className="space-y-6">
        
        {/* Filters */}
        <Card className="glassmorphism border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Raporlama Filtreleri
            </h2>
            
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Rapor İndir
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Rapor Dışa Aktarım</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-slate-300 text-sm">
                    Mevcut filtrelere göre raporu istediğiniz formatta indirin:
                  </p>
                  
                  <div className="grid gap-3">
                    <Button
                      onClick={() => handleExport('excel')}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-4 h-auto justify-start"
                    >
                      <FileSpreadsheet className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Excel Dosyası (.xlsx)</div>
                        <div className="text-sm text-green-200">Gelişmiş analiz için önerilen format</div>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => handleExport('csv')}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 h-auto justify-start"
                    >
                      <FileText className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">CSV Dosyası (.csv)</div>
                        <div className="text-sm text-blue-200">Evrensel format, tüm uygulamalarda açılır</div>
                      </div>
                    </Button>
                  </div>
                  
                  <div className="text-xs text-slate-400 mt-4 p-3 bg-slate-800/50 rounded-lg">
                    <strong>Mevcut Filtreler:</strong><br/>
                    Gemi: {selectedShip === 'all' ? 'Tüm Gemiler' : ships?.find((s: any) => s.id === selectedShip)?.name || 'Seçili Gemi'}<br/>
                    Tarih: {dateRangeOptions[dateRange]}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Gemi Seçimi</Label>
              <Select value={selectedShip} onValueChange={setSelectedShip}>
                <SelectTrigger className="glassmorphism border-slate-600 text-white">
                  <SelectValue placeholder="Gemi seçin" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    Tüm Gemiler
                  </SelectItem>
                  {ships?.map((ship: any) => (
                    <SelectItem key={ship.id} value={ship.id} className="text-white hover:bg-slate-700">
                      {ship.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Tarih Aralığı</Label>
              <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                <SelectTrigger className="glassmorphism border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {Object.entries(dateRangeOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-white hover:bg-slate-700">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Summary Stats */}
        {totalStats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glassmorphism border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Ödenen Siparişler</p>
                  <p className="text-2xl font-bold text-white">{totalStats.totalOrders}</p>
                </div>
              </div>
            </Card>

            <Card className="glassmorphism border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Net Gelir</p>
                  <p className="text-2xl font-bold text-white">${totalStats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card className="glassmorphism border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Satılan Paketler</p>
                  <p className="text-2xl font-bold text-white">{totalStats.packagesSold}</p>
                </div>
              </div>
            </Card>

            <Card className="glassmorphism border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <BarChart3 className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Satılan Veri (GB)</p>
                  <p className="text-2xl font-bold text-white">{totalStats.totalDataGB}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Charts Section */}
        {reportData && reportData.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue Bar Chart */}
            <Card className="glassmorphism border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Gemi Bazlı Gelir Dağılımı</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="shipName" 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gelir']}
                  />
                  <Bar dataKey="totalRevenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Orders Pie Chart */}
            <Card className="glassmorphism border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Gemi Bazlı Sipariş Dağılımı</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.filter(item => item.totalOrders > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ shipName, totalOrders }) => `${shipName}: ${totalOrders}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalOrders"
                  >
                    {reportData.map((entry, index) => {
                      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* Detailed Report Table */}
        <Card className="glassmorphism border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Gemi Bazlı Detaylar - {dateRangeOptions[dateRange]}
          </h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-slate-400">Raporlar yükleniyor...</div>
            </div>
          ) : reportData && reportData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-2 text-slate-300 font-medium">Gemi Adı</th>
                    <th className="text-right py-3 px-2 text-slate-300 font-medium">Ödenen Siparişler</th>
                    <th className="text-right py-3 px-2 text-slate-300 font-medium">Satılan Paketler</th>
                    <th className="text-right py-3 px-2 text-slate-300 font-medium">Satılan Veri (GB)</th>
                    <th className="text-right py-3 px-2 text-slate-300 font-medium">Net Gelir ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item: ReportData, index: number) => (
                    <tr key={item.shipId} className={index % 2 === 0 ? 'bg-slate-800/50' : ''}>
                      <td className="py-3 px-2 text-white font-medium">{item.shipName}</td>
                      <td className="py-3 px-2 text-right text-blue-400">{item.totalOrders}</td>
                      <td className="py-3 px-2 text-right text-purple-400">{item.packagesSold}</td>
                      <td className="py-3 px-2 text-right text-yellow-400">{item.totalDataGB}</td>
                      <td className="py-3 px-2 text-right text-green-400">${item.totalRevenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-400">Seçilen kriterlerde rapor bulunamadı.</div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}