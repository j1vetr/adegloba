import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCouponSchema } from "@shared/schema";
import { z } from "zod";
import {
  Ticket,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Loader2,
  Percent,
  Calendar,
  Users,
  DollarSign
} from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  singleUseOnly: boolean;
  createdAt: string;
  updatedAt: string;
};

type CouponFormData = z.infer<typeof insertCouponSchema>;

export default function CouponsManagement() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteCoupon, setDeleteCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: null,
    maxUses: null,
    validFrom: null,
    validUntil: null,
    isActive: true,
    singleUseOnly: false,
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["/api/admin/coupons"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      return await apiRequest("POST", "/api/admin/coupons", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setIsFormOpen(false);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Kupon başarıyla oluşturuldu.",
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<CouponFormData> }) => {
      return await apiRequest("PUT", `/api/admin/coupons/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setIsFormOpen(false);
      setEditingCoupon(null);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Kupon başarıyla güncellendi.",
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
      return await apiRequest("DELETE", `/api/admin/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setDeleteCoupon(null);
      toast({
        title: "Başarılı",
        description: "Kupon başarıyla silindi.",
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
      code: "",
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: null,
      maxUses: null,
      validFrom: null,
      validUntil: null,
      isActive: true,
      singleUseOnly: false,
    });
  };

  const handleAdd = () => {
    resetForm();
    setEditingCoupon(null);
    setIsFormOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxUses: coupon.maxUses,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : null,
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : null,
      isActive: coupon.isActive,
      singleUseOnly: coupon.singleUseOnly || false,
    });
    setEditingCoupon(coupon);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-generate coupon code if empty
    if (!formData.code) {
      const randomCode = 'SAVE' + Math.random().toString(36).substring(2, 8).toUpperCase();
      formData.code = randomCode;
    }

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: formData });
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

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') {
      return `%${value}`;
    }
    return `$${value}`;
  };

  const getStatusColor = (coupon: Coupon) => {
    if (!coupon.isActive) return "bg-gray-600 text-white";
    
    const now = new Date();
    const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null;
    
    if (validUntil && now > validUntil) return "bg-red-600 text-white";
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return "bg-orange-600 text-white";
    
    return "bg-green-600 text-white";
  };

  const getStatusText = (coupon: Coupon) => {
    if (!coupon.isActive) return "Pasif";
    
    const now = new Date();
    const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null;
    
    if (validUntil && now > validUntil) return "Süresi Doldu";
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return "Kullanım Tükendi";
    
    return "Aktif";
  };

  return (
    <AdminLayout title="Kuponlar" showAddButton onAddClick={handleAdd}>
      <div className="space-y-6">
        {/* Coupons Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : coupons?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon: Coupon) => (
              <Card key={coupon.id} className="glass-card border-border/50 hover:border-primary/30 transition-all duration-300 card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg text-white font-mono">{coupon.code}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(coupon)}>
                      {getStatusText(coupon) === "Aktif" ? (
                        <><Eye className="h-3 w-3 mr-1" /> Aktif</>
                      ) : (
                        <><EyeOff className="h-3 w-3 mr-1" /> {getStatusText(coupon)}</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Discount */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">İndirim</div>
                    <div className="text-xl font-bold text-green-400 flex items-center gap-1">
                      {coupon.discountType === 'percentage' ? (
                        <><Percent className="h-4 w-4" /> {coupon.discountValue}%</>
                      ) : (
                        <><DollarSign className="h-4 w-4" /> ${coupon.discountValue}</>
                      )}
                    </div>
                  </div>
                  
                  {/* Usage Stats */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">Kullanım</div>
                    <div className="text-sm font-semibold text-cyan-400 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                      {coupon.singleUseOnly && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded ml-2">
                          Tek Kullanım
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Min Order Amount */}
                  {coupon.minOrderAmount && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-400">Min. Sipariş</div>
                      <div className="text-sm text-slate-300">${coupon.minOrderAmount}</div>
                    </div>
                  )}
                  
                  {/* Validity Period */}
                  {(coupon.validFrom || coupon.validUntil) && (
                    <div>
                      <div className="text-sm text-slate-400">Geçerlilik</div>
                      <div className="text-sm text-slate-300">
                        {coupon.validFrom && formatDate(coupon.validFrom)}
                        {coupon.validFrom && coupon.validUntil && ' - '}
                        {coupon.validUntil && formatDate(coupon.validUntil)}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    Oluşturulma: {formatDate(coupon.createdAt)}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(coupon)}
                      className="flex-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      data-testid={`edit-coupon-${coupon.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteCoupon(coupon)}
                      className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      data-testid={`delete-coupon-${coupon.id}`}
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
              <Ticket className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Henüz Kupon Yok</h3>
              <p className="text-slate-400 mb-6">İlk indirim kuponunuzu oluşturmak için "Yeni Ekle" butonuna tıklayın.</p>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Kupon Ekle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCoupon ? "Kupon Düzenle" : "Yeni Kupon Ekle"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingCoupon ? "Mevcut kupon bilgilerini güncelleyin." : "Yeni bir indirim kuponu oluşturun."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-300">
                  Kupon Kodu
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Boş bırakılırsa otomatik oluşturulur"
                  className="bg-slate-700 border-slate-600 text-white font-mono"
                  data-testid="coupon-code-input"
                />
                <p className="text-xs text-slate-400">
                  Örn: SAVE20, WELCOME10 (boş bırakılırsa otomatik oluşturulur)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType" className="text-slate-300">
                    İndirim Türü *
                  </Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discountType: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="coupon-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="fixed">Sabit Tutar ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue" className="text-slate-300">
                    İndirim Miktarı *
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step={formData.discountType === 'percentage' ? "1" : "0.01"}
                    min="0"
                    max={formData.discountType === 'percentage' ? "100" : undefined}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                    data-testid="coupon-value-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount" className="text-slate-300">
                    Min. Sipariş Tutarı ($)
                  </Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minOrderAmount || ''}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || null })}
                    placeholder="Sınır yok"
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="coupon-min-amount-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUses" className="text-slate-300">
                    Max. Kullanım Sayısı
                  </Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    value={formData.maxUses || ''}
                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || null })}
                    placeholder="Sınırsız"
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="coupon-max-uses-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom" className="text-slate-300">
                    Geçerli Başlangıç
                  </Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={formData.validFrom || ''}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value || null })}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="coupon-valid-from-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validUntil" className="text-slate-300">
                    Geçerli Bitiş
                  </Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil || ''}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value || null })}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="coupon-valid-until-input"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    data-testid="coupon-active-switch"
                  />
                  <Label htmlFor="isActive" className="text-slate-300">
                    Aktif durumda
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="singleUseOnly"
                    checked={formData.singleUseOnly}
                    onCheckedChange={(checked) => setFormData({ ...formData, singleUseOnly: checked })}
                    data-testid="coupon-single-use-switch"
                  />
                  <Label htmlFor="singleUseOnly" className="text-slate-300">
                    Tek kullanım (kullanıcı başına bir kez)
                  </Label>
                </div>
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
                data-testid="coupon-submit-button"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingCoupon ? "Güncelle" : "Oluştur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteCoupon} onOpenChange={() => setDeleteCoupon(null)}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Kupon Sil</DialogTitle>
              <DialogDescription className="text-slate-400">
                "{deleteCoupon?.code}" kuponunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteCoupon(null)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                İptal
              </Button>
              <Button
                onClick={() => deleteCoupon && deleteMutation.mutate(deleteCoupon.id)}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="confirm-delete-coupon"
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