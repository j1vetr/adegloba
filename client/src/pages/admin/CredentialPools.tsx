import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Plus, Upload, Trash2, Key, Ship as ShipIcon, Download, X, FileText, Search, Filter, MoreHorizontal, Calendar, Users, CheckCircle, XCircle, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Ship, CredentialPool } from '../../../shared/schema';

export default function CredentialPools() {
  const [selectedShip, setSelectedShip] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [credentialText, setCredentialText] = useState('');
  const [importResults, setImportResults] = useState<{success: number, errors: string[]} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ships
  const { data: ships = [] } = useQuery<Ship[]>({
    queryKey: ['/api/admin/ships']
  });

  // Fetch credentials for selected ship
  const { data: credentials = [], isLoading: isLoadingCredentials } = useQuery<CredentialPool[]>({
    queryKey: ['/api/admin/credential-pools', selectedShip],
    enabled: !!selectedShip
  });

  // Fetch credential stats for selected ship
  const { data: credentialStats } = useQuery<{available: number, assigned: number, total: number}>({
    queryKey: ['/api/admin/credential-stats', selectedShip],
    enabled: !!selectedShip
  });

  // Filter and paginate credentials
  const filteredCredentials = useMemo(() => {
    let filtered = credentials;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(credential => 
        credential.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(credential => 
        statusFilter === 'assigned' ? credential.isAssigned : !credential.isAssigned
      );
    }

    return filtered;
  }, [credentials, searchQuery, statusFilter]);

  const paginatedCredentials = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCredentials.slice(startIndex, startIndex + pageSize);
  }, [filteredCredentials, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredCredentials.length / pageSize);

  const createCredentialMutation = useMutation({
    mutationFn: (credentialData: any) => apiRequest('POST', '/api/admin/credential-pools', credentialData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-stats'] });
      setIsCreateOpen(false);
      toast({ title: "Kimlik oluşturuldu", description: "Yeni kimlik başarıyla eklendi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kimlik oluşturulurken bir hata oluştu.", variant: "destructive" });
    }
  });

  const bulkImportMutation = useMutation({
    mutationFn: (data: { shipId: string; credentialText: string }) => 
      apiRequest('POST', '/api/admin/credential-pools/bulk-import', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-stats'] });
      setImportResults({ success: data.success, errors: data.errors || [] });
      setCredentialText('');
      if (data.errors?.length > 0) {
        setIsBulkImportOpen(true); // Keep dialog open to show errors
      } else {
        setIsBulkImportOpen(false);
      }
      toast({ 
        title: "İçe aktarma tamamlandı", 
        description: `${data.success} kimlik eklendi.${data.errors?.length ? ` ${data.errors.length} hata.` : ''}` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Hata", 
        description: error?.message || "İçe aktarma sırasında bir hata oluştu.", 
        variant: "destructive" 
      });
    }
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/credential-pools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-stats'] });
      toast({ title: "Kimlik silindi", description: "Kimlik başarıyla silindi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kimlik silinirken bir hata oluştu.", variant: "destructive" });
    }
  });

  const unassignCredentialMutation = useMutation({
    mutationFn: (id: string) => apiRequest('POST', `/api/admin/credential-pools/${id}/unassign`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-stats'] });
      toast({ title: "Kimlik serbest bırakıldı", description: "Kimlik başarıyla serbest bırakıldı." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kimlik serbest bırakılırken bir hata oluştu.", variant: "destructive" });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => 
      Promise.all(ids.map(id => apiRequest('DELETE', `/api/admin/credential-pools/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-stats'] });
      setSelectedCredentials([]);
      toast({ title: "Kimlikler silindi", description: "Seçili kimlikler başarıyla silindi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kimlikler silinirken bir hata oluştu.", variant: "destructive" });
    }
  });

  const handleCreateCredential = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const credentialData = {
      shipId: selectedShip,
      username: formData.get('username') as string,
      password: formData.get('password') as string
    };

    createCredentialMutation.mutate(credentialData);
  };

  const handleBulkImport = () => {
    if (!credentialText.trim()) {
      toast({ title: "Hata", description: "Kimlik bilgileri boş olamaz.", variant: "destructive" });
      return;
    }

    // Validate format (each line should be username,password)
    const lines = credentialText.trim().split('\n');
    const invalidLines = lines.filter((line, index) => {
      const parts = line.split(',');
      return parts.length !== 2 || !parts[0].trim() || !parts[1].trim();
    });

    if (invalidLines.length > 0) {
      toast({ 
        title: "Format Hatası", 
        description: "Her satır 'kullanıcıadı,şifre' formatında olmalıdır.", 
        variant: "destructive" 
      });
      return;
    }

    bulkImportMutation.mutate({ shipId: selectedShip, credentialText });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCredentials(paginatedCredentials.map(c => c.id));
    } else {
      setSelectedCredentials([]);
    }
  };

  const handleSelectCredential = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCredentials(prev => [...prev, id]);
    } else {
      setSelectedCredentials(prev => prev.filter(credId => credId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedCredentials.length === 0) return;
    
    bulkDeleteMutation.mutate(selectedCredentials);
  };

  return (
    <AdminLayout title="Kimlik Havuzu">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Kimlik Havuzu</h1>
            <p className="text-gray-400 mt-1">Captive portal erişim kimliklerini yönetin</p>
          </div>
          
          {/* Ship Selection Stats */}
          {credentialStats && selectedShip && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{credentialStats.available}</div>
                <div className="text-gray-400">Kullanılabilir</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-400">{credentialStats.assigned}</div>
                <div className="text-gray-400">Atanmış</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">{credentialStats.total}</div>
                <div className="text-gray-400">Toplam</div>
              </div>
            </div>
          )}
        </div>

        {/* Ship Selection */}
        <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShipIcon className="h-5 w-5" />
              Gemi Seçimi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedShip} onValueChange={setSelectedShip}>
              <SelectTrigger data-testid="select-ship" className="w-full md:w-1/2">
                <SelectValue placeholder="Yönetilecek gemiyi seçin..." />
              </SelectTrigger>
              <SelectContent>
                {ships.map((ship) => (
                  <SelectItem key={ship.id} value={ship.id}>
                    {ship.name} ({ship.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Credentials Management */}
        {selectedShip && (
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Key className="h-5 w-5" />
                  Kimlik Yönetimi
                </CardTitle>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-add-credential">
                        <Plus className="h-4 w-4 mr-2" />
                        Tekil Ekle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Yeni Kimlik Oluştur</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateCredential} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Kullanıcı Adı</Label>
                          <Input
                            id="username"
                            name="username"
                            placeholder="kullanici1"
                            required
                            data-testid="input-username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Şifre</Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            data-testid="input-password"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="submit"
                            disabled={createCredentialMutation.isPending}
                            data-testid="button-save-credential"
                          >
                            {createCredentialMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-bulk-import">
                        <FileText className="h-4 w-4 mr-2" />
                        Toplu İçe Aktar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-white">Toplu Kimlik İçe Aktarma</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Her satırda bir kimlik bilgisi, virgülle ayrılmış: kullanıcıadı,şifre
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="credential-text" className="text-sm text-gray-300">
                            Kimlik Bilgileri (her satır: kullanıcıadı,şifre)
                          </Label>
                          <Textarea
                            id="credential-text"
                            placeholder="user1,pass123&#10;user2,pass456&#10;user3,pass789"
                            value={credentialText}
                            onChange={(e) => setCredentialText(e.target.value)}
                            rows={12}
                            className="font-mono text-sm bg-gray-800 border-gray-600"
                            data-testid="textarea-credential-text"
                          />
                          <p className="text-xs text-gray-500">
                            Örnek: user1,pass123 (her satırda bir kimlik)
                          </p>
                        </div>

                        {importResults && (
                          <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg">
                            <h4 className="font-semibold text-white mb-2">İçe Aktarma Sonuçları</h4>
                            <div className="flex gap-4 mb-2">
                              <span className="text-green-400">✓ Başarılı: {importResults.success}</span>
                              {importResults.errors.length > 0 && (
                                <span className="text-red-400">✗ Hata: {importResults.errors.length}</span>
                              )}
                            </div>
                            {importResults.errors.length > 0 && (
                              <div className="text-red-400 text-sm max-h-32 overflow-y-auto">
                                {importResults.errors.map((error, index) => (
                                  <div key={index}>• {error}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsBulkImportOpen(false);
                              setCredentialText('');
                              setImportResults(null);
                            }}
                          >
                            {importResults ? 'Kapat' : 'İptal'}
                          </Button>
                          {!importResults && (
                            <Button
                              onClick={handleBulkImport}
                              disabled={bulkImportMutation.isPending || !credentialText.trim()}
                              data-testid="button-import-credentials"
                            >
                              {bulkImportMutation.isPending ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Kullanıcı adı ile ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      <SelectItem value="assigned">Atanmış</SelectItem>
                      <SelectItem value="available">Kullanılabilir</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {selectedCredentials.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteMutation.isPending}
                      data-testid="button-bulk-delete"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil ({selectedCredentials.length})
                    </Button>
                  )}
                </div>
              </div>

              {/* Credentials Table */}
              {isLoadingCredentials ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Kimlikler yükleniyor...</p>
                </div>
              ) : filteredCredentials.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {searchQuery || statusFilter !== 'all' ? 'Arama kriterlerine uygun kimlik bulunamadı.' : 'Henüz kimlik bulunmuyor.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700 hover:bg-gray-800/50">
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedCredentials.length === paginatedCredentials.length && paginatedCredentials.length > 0}
                                onCheckedChange={handleSelectAll}
                                data-testid="checkbox-select-all"
                              />
                            </TableHead>
                            <TableHead className="text-gray-300">Kullanıcı Adı</TableHead>
                            <TableHead className="text-gray-300">Durum</TableHead>
                            <TableHead className="text-gray-300 hidden sm:table-cell">Oluşturulma</TableHead>
                            <TableHead className="text-gray-300 w-24">İşlemler</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCredentials.map((credential) => (
                            <TableRow key={credential.id} className="border-gray-700 hover:bg-gray-800/30">
                              <TableCell>
                                <Checkbox
                                  checked={selectedCredentials.includes(credential.id)}
                                  onCheckedChange={(checked) => handleSelectCredential(credential.id, checked as boolean)}
                                  data-testid={`checkbox-credential-${credential.id}`}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm text-white">
                                {credential.username}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={credential.isAssigned ? "destructive" : "secondary"}
                                  className={credential.isAssigned ? "bg-red-900/50 text-red-300" : "bg-green-900/50 text-green-300"}
                                >
                                  {credential.isAssigned ? (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Atanmış
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Kullanılabilir
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-400 text-sm hidden sm:table-cell">
                                {format(new Date(credential.createdAt), 'dd.MM.yyyy HH:mm')}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" data-testid={`button-actions-${credential.id}`}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                    {credential.isAssigned && (
                                      <DropdownMenuItem
                                        onClick={() => unassignCredentialMutation.mutate(credential.id)}
                                        disabled={unassignCredentialMutation.isPending}
                                        className="text-yellow-400 hover:bg-gray-700"
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Serbest Bırak
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => deleteCredentialMutation.mutate(credential.id)}
                                      disabled={deleteCredentialMutation.isPending}
                                      className="text-red-400 hover:bg-gray-700"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Sil
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-400">
                        {filteredCredentials.length} kimlik bulundu, sayfa {currentPage} / {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          data-testid="button-prev-page"
                        >
                          Önceki
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          data-testid="button-next-page"
                        >
                          Sonraki
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}