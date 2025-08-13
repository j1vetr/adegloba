import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Calendar, User, Package, Key, ShoppingCart, Settings, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/components/AdminLayout';
interface LogWithDetails {
  id: string;
  category: string;
  action: string;
  userId?: string;
  adminId?: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  userName?: string;
  adminName?: string;
  entityName?: string;
}

export default function SystemLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  // Fetch system logs
  const { data: logs, isLoading } = useQuery<LogWithDetails[]>({
    queryKey: ["/api/admin/logs", currentPage, pageSize, searchQuery, categoryFilter, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(actionFilter !== 'all' && { action: actionFilter }),
      });
      
      const response = await fetch(`/api/admin/logs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds to show new logs
  });

  // Get unique categories and actions for filters
  const categories = [
    { value: 'all', label: 'Tüm Kategoriler' },
    { value: 'user_action', label: 'Kullanıcı İşlemleri' },
    { value: 'package_creation', label: 'Paket İşlemleri' },
    { value: 'credential_assignment', label: 'Kimlik Atamaları' },
    { value: 'order_processing', label: 'Sipariş İşlemleri' },
    { value: 'admin_action', label: 'Admin İşlemleri' },
  ];

  const actions = [
    { value: 'all', label: 'Tüm İşlemler' },
    { value: 'login', label: 'Giriş' },
    { value: 'logout', label: 'Çıkış' },
    { value: 'register', label: 'Kayıt' },
    { value: 'create_package', label: 'Paket Oluşturma' },
    { value: 'update_package', label: 'Paket Güncelleme' },
    { value: 'delete_package', label: 'Paket Silme' },
    { value: 'assign_credential', label: 'Kimlik Atama' },
    { value: 'create_credential', label: 'Kimlik Oluşturma' },
    { value: 'delete_credential', label: 'Kimlik Silme' },
    { value: 'process_order', label: 'Sipariş İşleme' },
    { value: 'update_order', label: 'Sipariş Güncelleme' },
    { value: 'admin_login', label: 'Admin Giriş' },
    { value: 'settings_update', label: 'Ayar Güncelleme' },
  ];

  const toggleRowExpansion = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      user_action: { label: 'Kullanıcı', variant: 'default' as const, icon: User },
      package_creation: { label: 'Paket', variant: 'secondary' as const, icon: Package },
      credential_assignment: { label: 'Kimlik', variant: 'outline' as const, icon: Key },
      order_processing: { label: 'Sipariş', variant: 'destructive' as const, icon: ShoppingCart },
      admin_action: { label: 'Admin', variant: 'default' as const, icon: Settings },
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || { 
      label: category, 
      variant: 'default' as const, 
      icon: FileText 
    };
    
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = !searchQuery || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.adminName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress?.includes(searchQuery);
    
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesCategory && matchesAction;
  }) || [];

  return (
    <AdminLayout title="Sistem Logları">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sistem Logları</h1>
          <p className="text-gray-400">
            Platform etkinliklerini ve kullanıcı işlemlerini izleyin ve analiz edin.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Toplam Log</p>
                  <p className="text-lg font-semibold text-white">{logs?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Kullanıcı İşlemleri</p>
                  <p className="text-lg font-semibold text-white">
                    {logs?.filter(l => l.category === 'user_action').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Paket İşlemleri</p>
                  <p className="text-lg font-semibold text-white">
                    {logs?.filter(l => l.category === 'package_creation').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-400">Sipariş İşlemleri</p>
                  <p className="text-lg font-semibold text-white">
                    {logs?.filter(l => l.category === 'order_processing').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="İşlem, kullanıcı, IP adresi ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                    data-testid="search-logs-input"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="İşlem" />
                  </SelectTrigger>
                  <SelectContent>
                    {actions.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Sistem Logları ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Henüz log kaydı bulunmuyor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Tarih/Saat</TableHead>
                      <TableHead className="text-gray-300">Kategori</TableHead>
                      <TableHead className="text-gray-300">İşlem</TableHead>
                      <TableHead className="text-gray-300">Kullanıcı</TableHead>
                      <TableHead className="text-gray-300">IP Adresi</TableHead>
                      <TableHead className="text-gray-300">Detaylar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <React.Fragment key={log.id}>
                        <TableRow className="border-gray-700 hover:bg-gray-800/50">
                          <TableCell className="text-gray-300 font-mono text-xs">
                            {formatDateTime(log.createdAt!)}
                          </TableCell>
                          <TableCell>
                            {getCategoryBadge(log.category)}
                          </TableCell>
                          <TableCell className="text-white">
                            {actions.find(a => a.value === log.action)?.label || log.action}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {log.userName || log.adminName || '-'}
                          </TableCell>
                          <TableCell className="text-gray-300 font-mono text-xs">
                            {log.ipAddress || '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(log.id)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              {expandedRows.has(log.id) ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Gizle
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Görüntüle
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(log.id) && (
                          <TableRow className="border-gray-700">
                            <TableCell colSpan={6} className="bg-gray-800/30 p-4">
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-400">Varlık Türü:</span>{' '}
                                    <span className="text-white">{log.entityType || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Varlık ID:</span>{' '}
                                    <span className="text-white font-mono">{log.entityId || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">User Agent:</span>{' '}
                                    <span className="text-white text-xs">{log.userAgent || '-'}</span>
                                  </div>
                                </div>
                                {log.details && (
                                  <div>
                                    <span className="text-gray-400">Ek Detaylar:</span>
                                    <pre className="mt-1 p-2 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredLogs.length > pageSize && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Önceki
            </Button>
            <span className="flex items-center px-4 text-gray-300">
              Sayfa {currentPage}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={filteredLogs.length < pageSize}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Sonraki
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}