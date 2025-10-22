import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface ErrorLog {
  id: string;
  errorType: string;
  severity: string;
  message: string;
  stackTrace: string | null;
  userId: string | null;
  endpoint: string | null;
  resolved: boolean;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt: Date;
}

interface ErrorLogsResponse {
  logs: ErrorLog[];
  total: number;
}

export default function ErrorManagement() {
  const { user, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<string>('all');
  const [resolved, setResolved] = useState<string>('all');
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const pageSize = 20;

  const queryParams = {
    page,
    pageSize,
    ...(severity !== 'all' && { severity }),
    ...(resolved !== 'all' && { resolved: resolved === 'true' })
  };

  const { data: errorData, isLoading: errorsLoading } = useQuery<ErrorLogsResponse>({
    queryKey: ['/api/admin/system/error-logs', queryParams],
    enabled: !!user,
  });

  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId: string) => {
      return await apiRequest(`/api/admin/system/error-logs/${errorId}/resolve`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/error-logs'] });
      setSelectedError(null);
      toast({
        title: "Başarılı",
        description: "Hata çözüldü olarak işaretlendi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Hata çözülürken bir sorun oluştu",
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityBadge = (severity: string) => {
    const configs = {
      'critical': { 
        label: 'Kritik', 
        className: 'bg-red-500/20 text-red-300 border-red-500/30', 
        icon: AlertCircle 
      },
      'error': { 
        label: 'Hata', 
        className: 'bg-orange-500/20 text-orange-300 border-orange-500/30', 
        icon: AlertTriangle 
      },
      'warning': { 
        label: 'Uyarı', 
        className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', 
        icon: AlertTriangle 
      },
      'info': { 
        label: 'Bilgi', 
        className: 'bg-blue-500/20 text-blue-300 border-blue-500/30', 
        icon: Info 
      },
    };

    const config = configs[severity as keyof typeof configs] || configs.info;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium border ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </div>
    );
  };

  const totalPages = errorData ? Math.ceil(errorData.total / pageSize) : 1;

  const unresolvedCount = errorData?.logs.filter(log => !log.resolved).length || 0;
  const criticalCount = errorData?.logs.filter(log => log.severity === 'critical' && !log.resolved).length || 0;

  return (
    <AdminLayout title="Hata Yönetimi">
      <div className="space-y-8 animate-slide-up">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl border border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white neon-text mb-2">
                Hata Yönetimi
              </h1>
              <p className="text-light-gray">
                Sistem hataları, uyarılar ve log kayıtları
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">{unresolvedCount}</div>
                <div className="text-xs text-slate-400">Çözülmemiş</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400 mb-1">{criticalCount}</div>
                <div className="text-xs text-slate-400">Kritik</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass-card border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Filtreler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm text-slate-300 mb-2 block">Önem Derecesi</label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="select-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">Tümü</SelectItem>
                    <SelectItem value="critical" className="text-white">Kritik</SelectItem>
                    <SelectItem value="error" className="text-white">Hata</SelectItem>
                    <SelectItem value="warning" className="text-white">Uyarı</SelectItem>
                    <SelectItem value="info" className="text-white">Bilgi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm text-slate-300 mb-2 block">Durum</label>
                <Select value={resolved} onValueChange={setResolved}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="select-resolved">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">Tümü</SelectItem>
                    <SelectItem value="false" className="text-white">Çözülmemiş</SelectItem>
                    <SelectItem value="true" className="text-white">Çözülmüş</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Logs Table */}
        <Card className="glass-card border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white neon-text">
                  Hata Kayıtları
                </CardTitle>
                <CardDescription className="text-light-gray">
                  {errorData?.total || 0} kayıt bulundu
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {errorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Önem</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Tip</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Mesaj</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Tarih</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Durum</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorData && errorData.logs.length > 0 ? (
                        errorData.logs.map((error, index) => (
                          <tr
                            key={error.id}
                            className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                            data-testid={`row-error-${index}`}
                          >
                            <td className="py-3 px-4">
                              {getSeverityBadge(error.severity)}
                            </td>
                            <td className="py-3 px-4 text-white font-medium">{error.errorType}</td>
                            <td className="py-3 px-4 text-slate-300 max-w-md truncate">
                              {error.message}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-sm">
                              {formatDate(error.createdAt)}
                            </td>
                            <td className="py-3 px-4">
                              {error.resolved ? (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Çözüldü
                                </Badge>
                              ) : (
                                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Bekliyor
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedError(error)}
                                  className="text-cyan-400 hover:text-cyan-300"
                                  data-testid={`button-view-${index}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {!error.resolved && (
                                  <Button
                                    size="sm"
                                    onClick={() => resolveErrorMutation.mutate(error.id)}
                                    disabled={resolveErrorMutation.isPending}
                                    className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
                                    data-testid={`button-resolve-${index}`}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Hata kaydı bulunmuyor
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
                    <div className="text-sm text-slate-400">
                      Sayfa {page} / {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        data-testid="button-next-page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Error Detail Modal */}
        {selectedError && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-slate-700/50 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-white neon-text">
                    Hata Detayları
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedError(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Önem Derecesi</div>
                  <div>{getSeverityBadge(selectedError.severity)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Hata Tipi</div>
                  <div className="text-white font-medium">{selectedError.errorType}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Mesaj</div>
                  <div className="text-white">{selectedError.message}</div>
                </div>
                {selectedError.endpoint && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Endpoint</div>
                    <div className="text-cyan-400 font-mono text-sm">{selectedError.endpoint}</div>
                  </div>
                )}
                {selectedError.stackTrace && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Stack Trace</div>
                    <pre className="text-xs text-slate-300 bg-slate-900/50 p-4 rounded-lg overflow-x-auto">
                      {selectedError.stackTrace}
                    </pre>
                  </div>
                )}
                <div>
                  <div className="text-sm text-slate-400 mb-1">Oluşturulma Tarihi</div>
                  <div className="text-white">{formatDate(selectedError.createdAt)}</div>
                </div>
                {selectedError.resolved && selectedError.resolvedAt && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Çözülme Tarihi</div>
                    <div className="text-green-400">{formatDate(selectedError.resolvedAt)}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
