import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPlanSchema } from "@shared/schema";
import { z } from "zod";
import {
  Package,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Loader2,
  DollarSign,
  Calendar,
  Wifi
} from "lucide-react";

type Plan = {
  id: string;
  title: string;
  gbAmount: number;
  speedNote: string | null;
  validityNote: string | null;
  priceUsd: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type PlanFormData = z.infer<typeof insertPlanSchema>;

export default function PlansManagement() {
  const { toast } = useToast();
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

  const { data: plans, isLoading } = useQuery({
    queryKey: ["/api/admin/plans"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      return await apiRequest("POST", "/api/admin/plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlanFormData> }) => {
      return await apiRequest("PUT", `/api/admin/plans/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
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

  const handleAdd = () => {
    resetForm();
    setEditingPlan(null);
    setIsFormOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setFormData({
      title: plan.title,
      gbAmount: plan.gbAmount,
      speedNote: plan.speedNote || "",
      validityNote: plan.validityNote || "",
      priceUsd: plan.priceUsd,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    });
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  };

  return (
    <AdminLayout title="Paketler" showAddButton onAddClick={handleAdd}>
      <div className="space-y-6">
        {/* Plans Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : plans?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan: Plan) => (
              <Card key={plan.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-400" />
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
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Sıralama: {plan.sortOrder}</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(plan.createdAt)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(plan)}
                      className="flex-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      data-testid={`edit-plan-${plan.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletePlan(plan)}
                      className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      data-testid={`delete-plan-${plan.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Sil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Henüz Paket Yok</h3>
              <p className="text-slate-400 mb-6">İlk veri paketinizi oluşturmak için "Yeni Ekle" butonuna tıklayın.</p>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Paket Ekle
              </Button>
            </CardContent>
          </Card>
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
                <Input
                  id="speedNote"
                  value={formData.speedNote}
                  onChange={(e) => setFormData({ ...formData, speedNote: e.target.value })}
                  placeholder="Örn: Yüksek hız - 100 Mbps'e kadar"
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="plan-speed-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validityNote" className="text-slate-300">
                  Geçerlilik Notu
                </Label>
                <Input
                  id="validityNote"
                  value={formData.validityNote}
                  onChange={(e) => setFormData({ ...formData, validityNote: e.target.value })}
                  placeholder="Örn: 30 gün geçerli"
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="plan-validity-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder" className="text-slate-300">
                  Sıralama
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="plan-sort-input"
                />
                <p className="text-xs text-slate-400">
                  Düşük numara önce gösterilir (0 = en üst)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="plan-active-switch"
                />
                <Label htmlFor="isActive" className="text-slate-300">
                  Aktif durumda
                </Label>
              </div>
            </form>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                İptal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                data-testid="plan-submit-button"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingPlan ? "Güncelle" : "Oluştur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletePlan} onOpenChange={() => setDeletePlan(null)}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Paket Sil</DialogTitle>
              <DialogDescription className="text-slate-400">
                "{deletePlan?.title}" paketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletePlan(null)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                İptal
              </Button>
              <Button
                onClick={() => deletePlan && deleteMutation.mutate(deletePlan.id)}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="confirm-delete-plan"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}