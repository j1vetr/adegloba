import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Search, Package, Ship as ShipIcon, Edit, Trash2, MoreHorizontal, 
  DollarSign, Database, Eye, TrendingUp, AlertCircle, CheckCircle, User 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Ship, Plan, CredentialPool } from '../../../shared/schema';

interface PlanFormData {
  shipId: string;
  title: string;
  gbAmount: number;
  speedNote: string;
  validityNote: string;
  priceUsd: string;
  isActive: boolean;
  sortOrder: number;
}

interface PlanWithDetails extends Plan {
  ship: Ship;
  credentialStats: {
    total: number;
    available: number;
    assigned: number;
  };
}

interface PackageStats {
  totalPackages: number;
  activePackages: number;
  totalCredentials: number;
  availableCredentials: number;
  totalRevenuePotential: number;
}

export default function ShipPackagesNew() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanWithDetails | null>(null);
  const [deletePlan, setDeletePlan] = useState<PlanWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shipFilter, setShipFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState<PlanFormData>({
    shipId: '',
    title: '',
    gbAmount: 1,
    speedNote: '',
    validityNote: '30 gün geçerli',
    priceUsd: '0.00',
    isActive: true,
    sortOrder: 0,
  });

  // Fetch plans with ship and credential details
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/admin/ship-packages"],
  });

  // Fetch ships for filters and form
  const { data: ships, isLoading: shipsLoading } = useQuery({
    queryKey: ["/api/admin/ships"],
  });

  // Calculate package statistics
  const packageStats: PackageStats = {
    totalPackages: plans?.length || 0,
    activePackages: plans?.filter((p: PlanWithDetails) => p.isActive).length || 0,
    totalCredentials: plans?.reduce((sum: number, p: PlanWithDetails) => sum + p.credentialStats.total, 0) || 0,
    availableCredentials: plans?.reduce((sum: number, p: PlanWithDetails) => sum + p.credentialStats.available, 0) || 0,
    totalRevenuePotential: plans?.reduce((sum: number, p: PlanWithDetails) => sum + (parseFloat(p.priceUsd) * p.credentialStats.available), 0) || 0,
  };

  // Filter plans
  const filteredPlans = plans?.filter((plan: PlanWithDetails) => {
    const matchesSearch = !searchQuery || 
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.ship?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesShip = shipFilter === 'all' || plan.shipId === shipFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && plan.isActive) ||
      (statusFilter === 'inactive' && !plan.isActive);
    
    return matchesSearch && matchesShip && matchesStatus;
  }) || [];

  // Create plan mutation
  const createMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      return await apiRequest("POST", "/api/admin/ship-packages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ship-packages"] });
      setIsFormOpen(false);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Paket başarıyla oluşturuldu.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update plan mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlanFormData> }) => {
      return await apiRequest("PUT", `/api/admin/ship-packages/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ship-packages"] });
      setIsFormOpen(false);
      setEditingPlan(null);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Paket başarıyla güncellendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/ship-packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ship-packages"] });
      setDeletePlan(null);
      toast({
        title: "Başarılı",
        description: "Paket başarıyla silindi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      shipId: '',
      title: '',
      gbAmount: 1,
      speedNote: '',
      validityNote: '30 gün geçerli',
      priceUsd: '0.00',
      isActive: true,
      sortOrder: 0,
    });
  };

  const handleEdit = (plan: PlanWithDetails) => {
    setEditingPlan(plan);
    setFormData({
      shipId: plan.shipId,
      title: plan.title,
      gbAmount: plan.gbAmount,
      speedNote: plan.speedNote || '',
      validityNote: plan.validityNote || '',
      priceUsd: plan.priceUsd,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.shipId || !formData.title || !formData.priceUsd) {
      toast({
        title: "Hata",
        description: "Lütfen gerekli alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-600 text-white">Aktif</Badge>
    ) : (
      <Badge className="bg-gray-600 text-white">Pasif</Badge>
    );
  };

  const getCredentialStatusBadge = (stats: any) => {
    if (stats.total === 0) {
      return <Badge className="bg-red-600 text-white">Kimlik Yok</Badge>;
    }
    if (stats.available === 0) {
      return <Badge className="bg-orange-600 text-white">Stok Yok</Badge>;
    }
    return <Badge className="bg-green-600 text-white">{stats.available} Uygun</Badge>;
  };

  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: tr });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Gemi Paketleri</h1>
            <p className="text-gray-400 mt-1">
              Gemi bazlı paket yönetimi ve kimlik bilgisi entegrasyonu
            </p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white neon-glow"
            data-testid="add-package-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Paket Ekle
          </Button>
        </div>

        <Separator className="bg-gray-700" />

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Toplam Paket</p>
                  <p className="text-2xl font-bold text-white">{packageStats.totalPackages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Aktif Paket</p>
                  <p className="text-2xl font-bold text-white">{packageStats.activePackages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Database className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Toplam Kimlik</p>
                  <p className="text-2xl font-bold text-white">{packageStats.totalCredentials}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <User className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Uygun Kimlik</p>
                  <p className="text-2xl font-bold text-white">{packageStats.availableCredentials}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-600/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Potansiyel Gelir</p>
                  <p className="text-2xl font-bold text-white">{formatPrice(packageStats.totalRevenuePotential)}</p>
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
                    placeholder="Paket adı veya gemi ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                    data-testid="search-packages-input"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={shipFilter} onValueChange={setShipFilter}>
                  <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Gemi Filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Gemiler</SelectItem>
                    {ships?.map((ship: Ship) => (
                      <SelectItem key={ship.id} value={ship.id}>
                        {ship.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Packages Table */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              Paket Listesi ({filteredPlans.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Paketler yükleniyor...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400">
                  {searchQuery || shipFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Filtrelere uygun paket bulunamadı.' 
                    : 'Henüz paket bulunmuyor.'}
                </p>
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  İlk Paketi Ekle
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Paket Adı</TableHead>
                      <TableHead className="text-gray-300">Gemi</TableHead>
                      <TableHead className="text-gray-300">Veri Miktarı</TableHead>
                      <TableHead className="text-gray-300">Fiyat</TableHead>
                      <TableHead className="text-gray-300">Kimlik Durumu</TableHead>
                      <TableHead className="text-gray-300">Durum</TableHead>
                      <TableHead className="text-gray-300">Oluşturulma</TableHead>
                      <TableHead className="text-gray-300 text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.map((plan: PlanWithDetails) => (
                      <TableRow key={plan.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{plan.title}</span>
                            {plan.speedNote && (
                              <span className="text-gray-400 text-sm">{plan.speedNote}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShipIcon className="h-4 w-4 text-blue-400" />
                            <span className="text-white">{plan.ship?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-green-400" />
                            <span className="text-white">{plan.gbAmount} GB</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-green-400 font-semibold">
                            {formatPrice(plan.priceUsd)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCredentialStatusBadge(plan.credentialStats)}
                          <div className="text-xs text-gray-400 mt-1">
                            {plan.credentialStats.total} toplam
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(plan.isActive)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatDate(plan.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(plan)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Kimlik Bilgilerini Görüntüle
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeletePlan(plan)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Package Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingPlan ? "Paket Düzenle" : "Yeni Paket Ekle"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingPlan ? "Mevcut paket bilgilerini güncelleyin." : "Gemi için yeni bir veri paketi oluşturun."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Gemi Seç *</Label>
                  <Select 
                    value={formData.shipId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, shipId: value }))}
                    disabled={!!editingPlan}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Gemi seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ships?.map((ship: Ship) => (
                        <SelectItem key={ship.id} value={ship.id}>
                          <div className="flex items-center gap-2">
                            <ShipIcon className="h-4 w-4" />
                            {ship.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Paket Adı *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Paket adını girin..."
                    data-testid="package-title-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Veri Miktarı (GB) *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.gbAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, gbAmount: parseInt(e.target.value) || 1 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="gb-amount-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Fiyat (USD) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.priceUsd}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceUsd: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="price-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Hız Notları</Label>
                <Textarea
                  value={formData.speedNote}
                  onChange={(e) => setFormData(prev => ({ ...prev, speedNote: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Hız ve performans notları..."
                  data-testid="speed-note-textarea"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Geçerlilik Notları</Label>
                <Textarea
                  value={formData.validityNote}
                  onChange={(e) => setFormData(prev => ({ ...prev, validityNote: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Geçerlilik süresi ve koşulları..."
                  data-testid="validity-note-textarea"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Sıralama</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="sort-order-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Durum</Label>
                  <Select 
                    value={formData.isActive ? 'active' : 'inactive'} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === 'active' }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="package-submit-button"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  )}
                  {editingPlan ? "Güncelle" : "Oluştur"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletePlan} onOpenChange={() => setDeletePlan(null)}>
          <AlertDialogContent className="bg-slate-800 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Paketi Sil</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                "{deletePlan?.title}" paketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm ilişkili kimlik bilgileri de silinecektir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePlan && deleteMutation.mutate(deletePlan.id)}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="confirm-delete-package-button"
              >
                {deleteMutation.isPending && (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                )}
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}