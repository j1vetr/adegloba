import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  Star,
  Activity,
  AlertCircle,
  UserPlus,
  RefreshCw,
  TrendingUp,
  DollarSign
} from "lucide-react";

interface UserSegment {
  userSegment: {
    userId: string;
    segment: string;
    score: number;
    totalSpent: string;
    orderCount: number;
    lastPurchaseDate: Date | null;
  };
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export default function UserSegmentation() {
  const { user, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [selectedSegment, setSelectedSegment] = useState<string>('all');

  const { data: segmentations, isLoading: segmentationsLoading } = useQuery<UserSegment[]>({
    queryKey: ['/api/admin/segmentation/users'],
    enabled: !!user,
  });

  const updateScoresMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/segmentation/update-scores');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/segmentation/users'] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı segment skorları güncellendi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Skorlar güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-3 border-primary border-t-transparent rounded-full neon-glow"></div>
      </div>
    );
  }

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Hiç alışveriş yapmadı';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const getSegmentBadge = (segment: string) => {
    const configs = {
      'VIP': { label: 'VIP', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: Star },
      'Active': { label: 'Aktif', className: 'bg-green-500/20 text-green-300 border-green-500/30', icon: Activity },
      'Passive': { label: 'Pasif', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Users },
      'At-Risk': { label: 'Risk Altında', className: 'bg-red-500/20 text-red-300 border-red-500/30', icon: AlertCircle },
      'New': { label: 'Yeni', className: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: UserPlus },
    };

    const config = configs[segment as keyof typeof configs] || configs.New;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium border ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </div>
    );
  };

  const filteredSegmentations = selectedSegment === 'all'
    ? segmentations
    : segmentations?.filter(s => s.userSegment.segment === selectedSegment);

  const segmentCounts = {
    all: segmentations?.length || 0,
    VIP: segmentations?.filter(s => s.userSegment.segment === 'VIP').length || 0,
    Active: segmentations?.filter(s => s.userSegment.segment === 'Active').length || 0,
    Passive: segmentations?.filter(s => s.userSegment.segment === 'Passive').length || 0,
    'At-Risk': segmentations?.filter(s => s.userSegment.segment === 'At-Risk').length || 0,
    New: segmentations?.filter(s => s.userSegment.segment === 'New').length || 0,
  };

  const summaryCards = [
    {
      title: "VIP Kullanıcılar",
      value: segmentCounts.VIP,
      description: "Yüksek değerli müşteriler",
      icon: Star,
      color: "text-yellow-400",
      bgColor: "from-yellow-500/20 to-orange-500/20",
      borderColor: "border-yellow-500/30",
      segment: 'VIP'
    },
    {
      title: "Aktif Kullanıcılar",
      value: segmentCounts.Active,
      description: "Düzenli alışveriş yapanlar",
      icon: Activity,
      color: "text-green-400",
      bgColor: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      segment: 'Active'
    },
    {
      title: "Pasif Kullanıcılar",
      value: segmentCounts.Passive,
      description: "Ara sıra alışveriş yapanlar",
      icon: Users,
      color: "text-blue-400",
      bgColor: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      segment: 'Passive'
    },
    {
      title: "Risk Altında",
      value: segmentCounts['At-Risk'],
      description: "Uzun süredir alışveriş yapmayan",
      icon: AlertCircle,
      color: "text-red-400",
      bgColor: "from-red-500/20 to-pink-500/20",
      borderColor: "border-red-500/30",
      segment: 'At-Risk'
    }
  ];

  return (
    <AdminLayout title="Kullanıcı Segmentasyonu">
      <div className="space-y-8 animate-slide-up">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl border border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white neon-text mb-2">
                Kullanıcı Segmentasyonu
              </h1>
              <p className="text-light-gray">
                Kullanıcı grupları, davranış analizi ve segment yönetimi
              </p>
            </div>
            <Button
              onClick={() => updateScoresMutation.mutate()}
              disabled={updateScoresMutation.isPending}
              className="bg-gradient-neon hover:scale-105 transition-all duration-300"
              data-testid="button-update-scores"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${updateScoresMutation.isPending ? 'animate-spin' : ''}`} />
              Skorları Güncelle
            </Button>
          </div>
        </div>

        {/* Segment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                className={`glass-card border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer card-hover ${
                  selectedSegment === card.segment ? 'ring-2 ring-cyan-500/50' : ''
                }`}
                onClick={() => setSelectedSegment(selectedSegment === card.segment ? 'all' : card.segment)}
                data-testid={`card-segment-${index}`}
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
                    {segmentationsLoading ? '...' : card.value}
                  </div>
                  <p className="text-xs text-light-gray">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* User Segmentation Table */}
        <Card className="glass-card border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white neon-text">
                  Kullanıcı Listesi
                  {selectedSegment !== 'all' && (
                    <span className="ml-3 text-base font-normal text-cyan-400">
                      ({getSegmentBadge(selectedSegment)})
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-light-gray">
                  {filteredSegmentations?.length || 0} kullanıcı
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {segmentationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Kullanıcı</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Segment</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Skor</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Toplam Harcama</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Sipariş</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Son Alışveriş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSegmentations && filteredSegmentations.length > 0 ? (
                      filteredSegmentations.map((item, index) => (
                        <tr
                          key={item.user.id}
                          className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                          data-testid={`row-user-${index}`}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-white font-medium">{item.user.username}</div>
                              <div className="text-xs text-slate-400">{item.user.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getSegmentBadge(item.userSegment.segment)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className="h-4 w-4 text-cyan-400" />
                              <span className="text-white font-semibold">{item.userSegment.score}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <DollarSign className="h-4 w-4 text-green-400" />
                              <span className="text-green-400 font-semibold">
                                {formatCurrency(item.userSegment.totalSpent)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-white">
                            {item.userSegment.orderCount}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300 text-sm">
                            {formatDate(item.userSegment.lastPurchaseDate)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          {selectedSegment === 'all' ? 'Henüz veri bulunmuyor' : 'Bu segmentte kullanıcı bulunmuyor'}
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
