import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import {
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface FinancialSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalDiscounts: number;
}

interface PackageProfitability {
  planId: string;
  planName: string;
  shipName: string;
  totalSold: number;
  totalRevenue: number;
  averagePrice: number;
}

interface RevenueOverTime {
  period: string;
  revenue: number;
  orders: number;
}

export default function FinancialReports() {
  const { user, isLoading: authLoading } = useAdminAuth();
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
    }

    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const { startDate, endDate } = getDateRange();

  const { data: summary, isLoading: summaryLoading } = useQuery<FinancialSummary>({
    queryKey: ['/api/admin/financial/summary', { startDate, endDate }],
    enabled: !!user,
  });

  const { data: profitability, isLoading: profitabilityLoading } = useQuery<PackageProfitability[]>({
    queryKey: ['/api/admin/financial/package-profitability'],
    enabled: !!user,
  });

  const { data: revenueOverTime, isLoading: revenueLoading } = useQuery<RevenueOverTime[]>({
    queryKey: ['/api/admin/financial/revenue-over-time', { period, startDate, endDate }],
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

  const summaryCards = [
    {
      title: "Toplam Gelir",
      value: formatCurrency(summary?.totalRevenue || 0),
      description: `${formatNumber(summary?.totalOrders || 0)} sipariş`,
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30"
    },
    {
      title: "Ortalama Sipariş",
      value: formatCurrency(summary?.averageOrderValue || 0),
      description: "Sipariş başına gelir",
      icon: TrendingUp,
      color: "text-blue-400",
      bgColor: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30"
    },
    {
      title: "Toplam İndirim",
      value: formatCurrency(summary?.totalDiscounts || 0),
      description: "Kupon ve indirimler",
      icon: Package,
      color: "text-purple-400",
      bgColor: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30"
    }
  ];

  return (
    <AdminLayout title="Finansal Raporlar">
      <div className="space-y-8 animate-slide-up">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl border border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white neon-text mb-2">
                Finansal Raporlar
              </h1>
              <p className="text-light-gray">
                Gelir analizi, paket karlılık ve finansal performans raporları
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white" data-testid="select-daterange">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="7days" className="text-white">Son 7 Gün</SelectItem>
                  <SelectItem value="30days" className="text-white">Son 30 Gün</SelectItem>
                  <SelectItem value="90days" className="text-white">Son 90 Gün</SelectItem>
                  <SelectItem value="all" className="text-white">Tüm Zamanlar</SelectItem>
                </SelectContent>
              </Select>
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
                data-testid={`card-financial-${index}`}
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
                    {summaryLoading ? '...' : card.value}
                  </div>
                  <p className="text-xs text-light-gray">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Package Profitability */}
        <Card className="glass-card border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white neon-text">
                  Paket Karlılık Analizi
                </CardTitle>
                <CardDescription className="text-light-gray">
                  Paket bazında satış ve gelir performansı
                </CardDescription>
              </div>
              <Package className="h-6 w-6 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            {profitabilityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Paket Adı</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Gemi</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Satılan</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Toplam Gelir</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Ortalama Fiyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitability && profitability.length > 0 ? (
                      profitability.map((item, index) => (
                        <tr
                          key={item.planId}
                          className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                          data-testid={`row-package-${index}`}
                        >
                          <td className="py-3 px-4 text-white font-medium">{item.planName}</td>
                          <td className="py-3 px-4 text-slate-300">{item.shipName}</td>
                          <td className="py-3 px-4 text-right text-white">{formatNumber(item.totalSold)}</td>
                          <td className="py-3 px-4 text-right text-green-400 font-semibold">
                            {formatCurrency(item.totalRevenue)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            {formatCurrency(item.averagePrice)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
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

        {/* Revenue Over Time */}
        <Card className="glass-card border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white neon-text">
                  Gelir Trendi
                </CardTitle>
                <CardDescription className="text-light-gray">
                  Zaman bazında gelir analizi
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                  <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-white" data-testid="select-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="daily" className="text-white">Günlük</SelectItem>
                    <SelectItem value="monthly" className="text-white">Aylık</SelectItem>
                    <SelectItem value="yearly" className="text-white">Yıllık</SelectItem>
                  </SelectContent>
                </Select>
                <TrendingUp className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Dönem</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Gelir</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Sipariş Sayısı</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Ortalama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueOverTime && revenueOverTime.length > 0 ? (
                      revenueOverTime.slice(0, 10).map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                          data-testid={`row-revenue-${index}`}
                        >
                          <td className="py-3 px-4 text-white font-medium">{item.period}</td>
                          <td className="py-3 px-4 text-right text-green-400 font-semibold">
                            {formatCurrency(item.revenue)}
                          </td>
                          <td className="py-3 px-4 text-right text-white">{formatNumber(item.orders)}</td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            {formatCurrency(item.orders > 0 ? item.revenue / item.orders : 0)}
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
