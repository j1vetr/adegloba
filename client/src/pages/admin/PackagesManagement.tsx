import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, MoreHorizontal, Edit, Trash2, Eye, 
  Package, Ship as ShipIcon, DollarSign, Calendar, Users, Key, 
  CheckCircle, XCircle, AlertCircle, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest } from '@/lib/queryClient';

interface Ship {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Plan {
  id: string;
  name: string;
  description?: string;
  priceUsd: string;
  dataLimitGb: number;
  validityDays: number;
  shipId: string;
  isActive: boolean;
  createdAt: string;
  ship?: Ship;
  credentialStats?: {
    total: number;
    available: number;
    assigned: number;
  };
}

export default function PackagesManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShip, setSelectedShip] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceUsd: '',
    dataLimitGb: '',
    validityDays: '30', // Default to 30 days, but will be auto-calculated
    shipId: '',
    isActive: true
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/admin/plans'],
    queryFn: () => apiRequest('GET', '/api/admin/plans').then(res => res.json())
  });

  const { data: ships = [] } = useQuery({
    queryKey: ['/api/admin/ships'],
    queryFn: () => apiRequest('GET', '/api/admin/ships').then(res => res.json())
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: 'Başarılı',
        description: 'Paket başarıyla oluşturuldu',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Paket oluşturulurken hata oluştu',
        variant: 'destructive',
      });
    }
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest('PUT', `/api/admin/plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setEditingPlan(null);
      resetForm();
      toast({
        title: 'Başarılı',
        description: 'Paket başarıyla güncellendi',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Paket güncellenirken hata oluştu',
        variant: 'destructive',
      });
    }
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      toast({
        title: 'Başarılı',
        description: 'Paket başarıyla silindi',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Paket silinirken hata oluştu',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priceUsd: '',
      dataLimitGb: '',
      validityDays: '30',
      shipId: '',
      isActive: true
    });
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      priceUsd: plan.priceUsd,
      dataLimitGb: plan.dataLimitGb.toString(),
      validityDays: plan.validityDays.toString(),
      shipId: plan.shipId,
      isActive: plan.isActive
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      priceUsd: parseFloat(formData.priceUsd).toFixed(2),
      dataLimitGb: parseInt(formData.dataLimitGb),
      validityDays: parseInt(formData.validityDays)
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  // Filter plans
  const filteredPlans = plans.filter((plan: Plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.ship?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShip = selectedShip === 'all' || plan.shipId === selectedShip;
    return matchesSearch && matchesShip;
  });

  // Calculate stats
  const totalPlans = plans.length;
  const activePlans = plans.filter((p: Plan) => p.isActive).length;
  const totalCredentials = plans.reduce((sum: number, p: Plan) => sum + (p.credentialStats?.total || 0), 0);
  const availableCredentials = plans.reduce((sum: number, p: Plan) => sum + (p.credentialStats?.available || 0), 0);

  return (
    <AdminLayout title="Paket Yönetimi">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Paket Yönetimi</h1>
            <p className="text-slate-400 mt-1">Starlink veri paketlerini yönetin</p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="glass-card hover:scale-105 transition-all"
            data-testid="button-create-package"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Paket
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Toplam Paket</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalPlans}</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Aktif Paketler</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activePlans}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Toplam Kimlik</CardTitle>
              <Key className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalCredentials}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Kullanılabilir Kimlik</CardTitle>
              <Users className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{availableCredentials}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Paket veya gemi adıyla ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600 text-white"
                    data-testid="input-search-packages"
                  />
                </div>
              </div>
              <Select value={selectedShip} onValueChange={setSelectedShip}>
                <SelectTrigger className="w-full md:w-[200px] bg-slate-800/50 border-slate-600 text-white">
                  <SelectValue placeholder="Gemi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Gemiler</SelectItem>
                  {ships.map((ship: Ship) => (
                    <SelectItem key={ship.id} value={ship.id}>
                      {ship.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Plans Table */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-white">Paketler</CardTitle>
            <CardDescription className="text-slate-400">
              Tüm veri paketlerini görüntüleyin ve yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Paket</TableHead>
                    <TableHead className="text-slate-300">Gemi</TableHead>
                    <TableHead className="text-slate-300">Fiyat</TableHead>
                    <TableHead className="text-slate-300">Veri Limiti</TableHead>
                    <TableHead className="text-slate-300">Geçerlilik</TableHead>
                    <TableHead className="text-slate-300">Kimlik Durumu</TableHead>
                    <TableHead className="text-slate-300">Durum</TableHead>
                    <TableHead className="text-slate-300">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan: Plan) => (
                    <TableRow key={plan.id} className="border-slate-700">
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{plan.name}</div>
                          {plan.description && (
                            <div className="text-sm text-slate-400">{plan.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShipIcon className="h-4 w-4 text-cyan-400" />
                          <span className="text-slate-300">{plan.ship?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-400" />
                          <span className="text-white font-medium">${plan.priceUsd}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-300">{plan.dataLimitGb} GB</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-300">{plan.validityDays} gün</span>
                      </TableCell>
                      <TableCell>
                        {plan.credentialStats ? (
                          <div className="text-sm">
                            <div className="text-green-400">
                              {plan.credentialStats.available} kullanılabilir
                            </div>
                            <div className="text-slate-400">
                              {plan.credentialStats.total} toplam
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">Kimlik yok</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={plan.isActive ? "default" : "secondary"}
                          className={plan.isActive ? "bg-green-600" : "bg-slate-600"}
                        >
                          {plan.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem onClick={() => handleEdit(plan)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deletePlanMutation.mutate(plan.id)}
                              className="text-red-400"
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
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog || !!editingPlan} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingPlan(null);
            resetForm();
          }
        }}>
          <DialogContent className="glass-card border-primary/20 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingPlan ? 'Paket Düzenle' : 'Yeni Paket Oluştur'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingPlan ? 'Paket bilgilerini güncelleyin' : 'Yeni bir veri paketi oluşturun'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-slate-300">Paket Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-800/50 border-slate-600 text-white"
                  required
                  data-testid="input-package-name"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-slate-300">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-800/50 border-slate-600 text-white"
                  data-testid="textarea-package-description"
                />
              </div>

              <div>
                <Label htmlFor="shipId" className="text-slate-300">Gemi</Label>
                <Select 
                  value={formData.shipId} 
                  onValueChange={(value) => setFormData({ ...formData, shipId: value })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                    <SelectValue placeholder="Gemi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {ships.map((ship: Ship) => (
                      <SelectItem key={ship.id} value={ship.id}>
                        {ship.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priceUsd" className="text-slate-300">Fiyat (USD)</Label>
                  <Input
                    id="priceUsd"
                    type="number"
                    step="0.01"
                    value={formData.priceUsd}
                    onChange={(e) => setFormData({ ...formData, priceUsd: e.target.value })}
                    className="bg-slate-800/50 border-slate-600 text-white"
                    required
                    data-testid="input-package-price"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dataLimitGb" className="text-slate-300">Veri Limiti (GB)</Label>
                  <Input
                    id="dataLimitGb"
                    type="number"
                    value={formData.dataLimitGb}
                    onChange={(e) => setFormData({ ...formData, dataLimitGb: e.target.value })}
                    className="bg-slate-800/50 border-slate-600 text-white"
                    required
                    data-testid="input-package-data-limit"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="validityDays" className="text-slate-300">Geçerlilik (Gün)</Label>
                <Input
                  id="validityDays"
                  type="number"
                  value={formData.validityDays}
                  onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                  className="bg-slate-800/50 border-slate-600 text-white"
                  required
                  data-testid="input-package-validity"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-save-package"
                >
                  {createPlanMutation.isPending || updatePlanMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}