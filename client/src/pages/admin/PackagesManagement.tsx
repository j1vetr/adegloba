import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Package, Ship as ShipIcon, DollarSign, Wifi, Edit, Trash2, 
  MoreHorizontal, Eye, EyeOff, Users, Key, Calendar, Download,
  AlertCircle, CheckCircle, TrendingUp, Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Ship, Plan, CredentialPool } from '../../../shared/schema';

interface PlanFormData {
  title: string;
  gbAmount: number;
  speedNote: string;
  validityNote: string;
  priceUsd: string;
  isActive: boolean;
  sortOrder: number;
}

interface PackageStats {
  totalPackages: number;
  activePackages: number;
  inactivePackages: number;
  assignedCredentials: number;
  availableCredentials: number;
  totalRevenue: number;
}

export default function PackagesManagement() {
  const { toast } = useToast();
  const [selectedShip, setSelectedShip] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletePlan, setDeletePlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    title: "",
    gbAmount: 1,
    speedNote: "",
    validityNote: "",
    priceUsd: "0.00",
    isActive: true,
    sortOrder: 0,
  });

  // Fetch ships data
  const { data: ships, isLoading: shipsLoading } = useQuery({
    queryKey: ["/api/admin/ships"],
  });

  // Fetch plans for selected ship
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/admin/plans", selectedShip],
    queryFn: async () => {
      if (!selectedShip) return [];
      const response = await fetch(`/api/admin/ships/${selectedShip}/plans`);
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json();
    },
    enabled: !!selectedShip,
  });

  // Fetch credentials for selected ship
  const { data: credentials, isLoading: credentialsLoading } = useQuery({
    queryKey: ["/api/admin/credential-pools", selectedShip],
    queryFn: async () => {
      if (!selectedShip) return [];
      const response = await fetch(`/api/admin/credential-pools?shipId=${selectedShip}`);
      if (!response.ok) throw new Error('Failed to fetch credentials');
      return response.json();
    },
    enabled: !!selectedShip,
  });

  // Calculate package statistics
  const packageStats: PackageStats = {
    totalPackages: plans?.length || 0,
    activePackages: plans?.filter((p: Plan) => p.isActive).length || 0,
    inactivePackages: plans?.filter((p: Plan) => !p.isActive).length || 0,
    assignedCredentials: credentials?.filter((c: CredentialPool) => c.isAssigned).length || 0,
    availableCredentials: credentials?.filter((c: CredentialPool) => !c.isAssigned).length || 0,
    totalRevenue: plans?.reduce((sum: number, plan: Plan) => sum + parseFloat(plan.priceUsd), 0) || 0,
  };

  // Create plan mutation
  const createMutation = useMutation({
    mutationFn: async (data: PlanFormData & { shipId: string }) => {
      return await apiRequest("POST", "/api/admin/plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans", selectedShip] });
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
      return await apiRequest("PUT", `/api/admin/plans/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans", selectedShip] });
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
      return await apiRequest("DELETE", `/api/admin/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans", selectedShip] });
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
      title: "",
      gbAmount: 1,
      speedNote: "",
      validityNote: "",
      priceUsd: "0.00",
      isActive: true,
      sortOrder: 0,
    });
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      gbAmount: plan.gbAmount,
      speedNote: plan.speedNote || "",
      validityNote: plan.validityNote || "",
      priceUsd: plan.priceUsd,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShip) {
      toast({
        title: "Hata",
        description: "Lütfen bir gemi seçin.",
        variant: "destructive",
      });
      return;
    }

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, shipId: selectedShip });
    }
  };

  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const selectedShipData = ships ? ships.find((ship: Ship) => ship.id === selectedShip) : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Paket Yönetimi</h1>
            <p className="text-gray-400 mt-1">
              Gemi bazlı paket atama sistemi ve kimlik bilgisi yönetimi
            </p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            disabled={!selectedShip}
            className="bg-blue-600 hover:bg-blue-700 text-white neon-glow"
            data-testid="add-package-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Paket Ekle
          </Button>
        </div>

        <Separator className="bg-gray-700" />

        {/* Ship Selection */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShipIcon className="h-5 w-5 text-blue-400" />
              Gemi Seçimi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Gemi Seçin</Label>
                  <Select 
                    value={selectedShip} 
                    onValueChange={setSelectedShip}
                    data-testid="ship-select"
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Bir gemi seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ships ? ships.map((ship: Ship) => (
                        <SelectItem key={ship.id} value={ship.id}>
                          <div className="flex items-center gap-2">
                            <ShipIcon className="h-4 w-4" />
                            {ship.name}
                            {ship.kitNumber && (
                              <Badge variant="outline" className="text-xs">
                                {ship.kitNumber}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedShipData && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Seçilen Gemi</Label>
                    <div className="p-3 bg-gray-800 rounded-md border border-gray-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{selectedShipData.name}</p>
                          {selectedShipData.kitNumber && (
                            <p className="text-gray-400 text-sm">KIT: {selectedShipData.kitNumber}</p>
                          )}
                        </div>
                        <Badge 
                          variant={selectedShipData.isActive ? "default" : "secondary"}
                          className={selectedShipData.isActive ? "bg-green-600" : "bg-gray-600"}
                        >
                          {selectedShipData.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedShip && (
          <>
            {/* Package Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                    <div className="p-2 bg-red-600/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Pasif Paket</p>
                      <p className="text-2xl font-bold text-white">{packageStats.inactivePackages}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-600/20 rounded-lg">
                      <Key className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Atanan Kimlik</p>
                      <p className="text-2xl font-bold text-white">{packageStats.assignedCredentials}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <Users className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Müsait Kimlik</p>
                      <p className="text-2xl font-bold text-white">{packageStats.availableCredentials}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-600/20 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Toplam Gelir</p>
                      <p className="text-2xl font-bold text-white">{formatPrice(packageStats.totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Packages List */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-400" />
                  Paket Listesi - {selectedShipData?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-400">Paketler yükleniyor...</p>
                  </div>
                ) : !plans || plans.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-400">Bu gemi için henüz paket bulunmuyor.</p>
                    <Button
                      onClick={() => setIsFormOpen(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      İlk Paketi Ekle
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan: Plan) => (
                      <Card key={plan.id} className="glass-card border-border/50 hover:border-primary/30 transition-all duration-300 card-hover">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-primary" />
                              <CardTitle className="text-lg text-white">{plan.title}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={plan.isActive ? "default" : "secondary"}
                                className={plan.isActive ? "bg-green-600 text-white" : "bg-gray-600 text-white"}
                              >
                                {plan.isActive ? (
                                  <><Eye className="h-3 w-3 mr-1" /> Aktif</>
                                ) : (
                                  <><EyeOff className="h-3 w-3 mr-1" /> Pasif</>
                                )}
                              </Badge>
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
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Price */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-400">Fiyat</div>
                            <div className="text-xl font-bold text-green-400 flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatPrice(plan.priceUsd)}
                            </div>
                          </div>
                          
                          {/* Data Amount */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-400">Veri Miktarı</div>
                            <div className="text-lg font-semibold text-cyan-400 flex items-center gap-1">
                              <Wifi className="h-4 w-4" />
                              {plan.gbAmount} GB
                            </div>
                          </div>
                          
                          {/* Speed Note */}
                          {plan.speedNote && (
                            <div>
                              <div className="text-sm text-slate-400">Hız Notu</div>
                              <div className="text-sm text-slate-300 line-clamp-2">{plan.speedNote}</div>
                            </div>
                          )}
                          
                          {/* Validity Note */}
                          {plan.validityNote && (
                            <div>
                              <div className="text-sm text-slate-400">Geçerlilik Notu</div>
                              <div className="text-sm text-slate-300 line-clamp-2">{plan.validityNote}</div>
                            </div>
                          )}
                          
                          {/* Sort Order */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-400">Sıralama</div>
                            <div className="text-sm text-slate-300">{plan.sortOrder}</div>
                          </div>
                          
                          {/* Created Date */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(plan.createdAt)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Add/Edit Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingPlan ? "Paket Düzenle" : "Yeni Paket Ekle"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingPlan ? "Mevcut paket bilgilerini güncelleyin." : "Yeni bir veri paketi oluşturun."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">
                  Paket Adı *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Premium Starlink Paketi"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                  data-testid="plan-title-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gbAmount" className="text-slate-300">
                    Veri Miktarı (GB) *
                  </Label>
                  <Input
                    id="gbAmount"
                    type="number"
                    min="1"
                    value={formData.gbAmount}
                    onChange={(e) => setFormData({ ...formData, gbAmount: parseInt(e.target.value) || 1 })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                    data-testid="plan-gb-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceUsd" className="text-slate-300">
                    Fiyat (USD) *
                  </Label>
                  <Input
                    id="priceUsd"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.priceUsd}
                    onChange={(e) => setFormData({ ...formData, priceUsd: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                    data-testid="plan-price-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="speedNote" className="text-slate-300">
                  Hız Notu
                </Label>
                <Textarea
                  id="speedNote"
                  value={formData.speedNote}
                  onChange={(e) => setFormData({ ...formData, speedNote: e.target.value })}
                  placeholder="Hız ile ilgili bilgiler..."
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={2}
                  data-testid="plan-speed-textarea"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validityNote" className="text-slate-300">
                  Geçerlilik Notu
                </Label>
                <Textarea
                  id="validityNote"
                  value={formData.validityNote}
                  onChange={(e) => setFormData({ ...formData, validityNote: e.target.value })}
                  placeholder="Geçerlilik süresi ile ilgili bilgiler..."
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={2}
                  data-testid="plan-validity-textarea"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder" className="text-slate-300">
                    Sıralama Numarası
                  </Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="plan-sort-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Aktif Durumu</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      data-testid="plan-active-switch"
                    />
                    <Label className="text-slate-400 text-sm">
                      {formData.isActive ? "Aktif" : "Pasif"}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="plan-submit-button"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : null}
                  {editingPlan ? "Güncelle" : "Ekle"}
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
                "{deletePlan?.title}" paketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
                data-testid="confirm-delete-button"
              >
                {deleteMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : null}
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}