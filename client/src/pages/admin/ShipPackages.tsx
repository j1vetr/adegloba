import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package, Ship as ShipIcon, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Ship, Plan } from '@shared/schema';

export default function ShipPackages() {
  const [selectedShip, setSelectedShip] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ships
  const { data: ships = [] } = useQuery<Ship[]>({
    queryKey: ['/api/admin/ships'],
    enabled: true
  });

  // Fetch packages for selected ship
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<Plan[]>({
    queryKey: ['/api/admin/ship-plans', selectedShip],
    enabled: !!selectedShip
  });

  // Fetch credential stats for selected ship
  const { data: credentialStats } = useQuery<{available: number, assigned: number, total: number}>({
    queryKey: ['/api/admin/credential-stats', selectedShip],
    enabled: !!selectedShip
  });

  const createPlanMutation = useMutation({
    mutationFn: (planData: any) => apiRequest('POST', '/api/admin/plans', planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ship-plans'] });
      setIsCreateOpen(false);
      toast({ title: "Paket oluşturuldu", description: "Yeni paket başarıyla eklendi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Paket oluşturulurken bir hata oluştu.", variant: "destructive" });
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, ...planData }: any) => apiRequest('PATCH', `/api/admin/plans/${id}`, planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ship-plans'] });
      setEditingPlan(null);
      toast({ title: "Paket güncellendi", description: "Paket başarıyla güncellendi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Paket güncellenirken bir hata oluştu.", variant: "destructive" });
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ship-plans'] });
      toast({ title: "Paket silindi", description: "Paket başarıyla silindi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Paket silinirken bir hata oluştu.", variant: "destructive" });
    }
  });

  const handleCreatePlan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const planData = {
      shipId: selectedShip,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      priceUsd: parseFloat(formData.get('priceUsd') as string),
      dataLimitGb: parseInt(formData.get('dataLimitGb') as string),
      // validityDays removed - all packages now expire at end of month
      isActive: formData.get('isActive') === 'on',
      sortOrder: parseInt(formData.get('sortOrder') as string) || 0
    };

    createPlanMutation.mutate(planData);
  };

  const handleUpdatePlan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPlan) return;
    
    const formData = new FormData(event.currentTarget);
    
    const planData = {
      id: editingPlan.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      priceUsd: parseFloat(formData.get('priceUsd') as string),
      dataLimitGb: parseInt(formData.get('dataLimitGb') as string),
      // validityDays removed - all packages now expire at end of month
      isActive: formData.get('isActive') === 'on',
      sortOrder: parseInt(formData.get('sortOrder') as string) || 0
    };

    updatePlanMutation.mutate(planData);
  };

  const PlanForm = ({ plan, onSubmit, isLoading }: { plan?: Plan; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; isLoading: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Paket Adı</Label>
          <Input
            id="name"
            name="name"
            defaultValue={plan?.name || ''}
            placeholder="Örn: Premium Paketi"
            required
            data-testid="input-plan-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceUsd">Fiyat (USD)</Label>
          <Input
            id="priceUsd"
            name="priceUsd"
            type="number"
            step="0.01"
            min="0"
            defaultValue={plan?.priceUsd || ''}
            placeholder="29.99"
            required
            data-testid="input-plan-price"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={plan?.description || ''}
          placeholder="Paket açıklaması..."
          rows={3}
          data-testid="textarea-plan-description"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataLimitGb">Data Limiti (GB)</Label>
          <Input
            id="dataLimitGb"
            name="dataLimitGb"
            type="number"
            min="0"
            defaultValue={plan?.dataLimitGb || ''}
            placeholder="100"
            required
            data-testid="input-plan-data-limit"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Geçerlilik Süresi</Label>
          <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-3">
            <div className="text-cyan-400 font-medium text-sm">Ay sonu bitiş sistemi</div>
            <div className="text-slate-400 text-xs mt-1">
              Tüm paketler satın alınan ayın son gününe kadar geçerlidir.
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sıralama</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={plan?.sortOrder || 0}
            placeholder="0"
            data-testid="input-plan-sort-order"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          name="isActive"
          defaultChecked={plan?.isActive ?? true}
          data-testid="switch-plan-active"
        />
        <Label htmlFor="isActive">Aktif</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={isLoading}
          data-testid="button-save-plan"
        >
          {isLoading ? 'Kaydediliyor...' : (plan ? 'Güncelle' : 'Oluştur')}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gemi Paketleri</h1>
          <p className="text-gray-400 mt-1">Gemilere özel veri paketlerini yönetin</p>
        </div>
      </div>

      {/* Ship Selection */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ShipIcon className="h-5 w-5" />
            Gemi Seçimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedShip} onValueChange={setSelectedShip}>
                <SelectTrigger data-testid="select-ship">
                  <SelectValue placeholder="Gemi seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {ships.map((ship) => (
                    <SelectItem key={ship.id} value={ship.id}>
                      {ship.name} ({ship.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {credentialStats && (
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{credentialStats.available}</div>
                  <div className="text-gray-400">Kullanılabilir</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{credentialStats.assigned}</div>
                  <div className="text-gray-400">Atanmış</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{credentialStats.total}</div>
                  <div className="text-gray-400">Toplam Kimlik</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans Management */}
      {selectedShip && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Package className="h-5 w-5" />
              Paketler
            </CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-plan">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Paket
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Yeni Paket Oluştur</DialogTitle>
                </DialogHeader>
                <PlanForm onSubmit={handleCreatePlan} isLoading={createPlanMutation.isPending} />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingPlans ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-2">Paketler yükleniyor...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Bu gemi için henüz paket oluşturulmadı.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white">{plan.name}</h3>
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          Sıra: {plan.sortOrder}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-green-400 font-medium">${plan.priceUsd}</span>
                        <span className="text-blue-400">{plan.dataLimitGb} GB</span>
                        <span className="text-yellow-400">Ay sonu bitiş</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog open={editingPlan?.id === plan.id} onOpenChange={(open) => !open && setEditingPlan(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPlan(plan)}
                            data-testid={`button-edit-plan-${plan.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">Paket Düzenle</DialogTitle>
                          </DialogHeader>
                          <PlanForm
                            plan={editingPlan || undefined}
                            onSubmit={handleUpdatePlan}
                            isLoading={updatePlanMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePlanMutation.mutate(plan.id)}
                        disabled={deletePlanMutation.isPending}
                        data-testid={`button-delete-plan-${plan.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}