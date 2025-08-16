import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  Search,
  Filter,
  Eye,
  EyeOff,
  Loader2,
  Percent,
  Calendar,
  Users,
  DollarSign,
  Ship,
  Package,
  Globe,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  FileText,
  Copy,
  CheckCircle,
  AlertCircle
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
  scope: 'general' | 'ship' | 'package';
  applicableShips: string[];
  applicablePlans: string[];
  description: string | null;
  isActive: boolean;
  singleUseOnly: boolean;
  createdAt: string;
  updatedAt: string;
};

type Ship = {
  id: string;
  name: string;
  slug: string;
};

type Plan = {
  id: string;
  name: string;
  shipId: string;
};

type CouponFormData = z.infer<typeof insertCouponSchema>;

interface Filters {
  search: string;
  status: string;
  type: string;
  scope: string;
  dateFrom: string;
  dateTo: string;
}

export default function CouponsManagementNew() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteCoupon, setDeleteCoupon] = useState<Coupon | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    type: 'all',
    scope: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: null,
    maxUses: null,
    validFrom: null,
    validUntil: null,
    scope: 'general',
    applicableShips: [],
    applicablePlans: [],
    description: null,
    isActive: true,
    singleUseOnly: false,
  });

  // Fetch ships and plans for multi-select
  const { data: ships } = useQuery<Ship[]>({
    queryKey: ["/api/admin/ships"],
  });

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ["/api/admin/plans"],
  });

  // Fetch coupons with filtering and pagination
  const { data: couponsResponse, isLoading } = useQuery({
    queryKey: ["/api/admin/coupons", currentPage, pageSize, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value && value !== 'all'))
      });
      
      const response = await fetch(`/api/admin/coupons?${params}`);
      return response.json();
    }
  });

  const coupons = couponsResponse?.coupons || [];
  const totalPages = Math.ceil((couponsResponse?.total || 0) / pageSize);

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
      scope: 'general',
      applicableShips: [],
      applicablePlans: [],
      description: null,
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
      scope: coupon.scope,
      applicableShips: coupon.applicableShips || [],
      applicablePlans: coupon.applicablePlans || [],
      description: coupon.description,
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

    // Validation
    if (formData.scope === 'ship' && formData.applicableShips.length === 0) {
      toast({
        title: "Hata",
        description: "Gemi kapsamı seçildiğinde en az bir gemi seçilmelidir.",
        variant: "destructive",
      });
      return;
    }

    if (formData.scope === 'package' && formData.applicablePlans.length === 0) {
      toast({
        title: "Hata",
        description: "Paket kapsamı seçildiğinde en az bir paket seçilmelidir.",
        variant: "destructive",
      });
      return;
    }

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Kopyalandı",
        description: "Kupon kodu panoya kopyalandı.",
      });
    } catch (err) {
      toast({
        title: "Hata",
        description: "Kopyalama başarısız.",
        variant: "destructive",
      });
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

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'ship': return <Ship className="h-4 w-4" />;
      case 'package': return <Package className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getScopeText = (coupon: Coupon) => {
    switch (coupon.scope) {
      case 'ship': 
        return `Gemi (${coupon.applicableShips?.length || 0})`;
      case 'package': 
        return `Paket (${coupon.applicablePlans?.length || 0})`;
      default: 
        return 'Genel';
    }
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

  const filteredPlans = plans?.filter(plan => 
    formData.scope === 'package' || 
    (formData.scope === 'ship' && formData.applicableShips.includes(plan.shipId))
  ) || [];

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      scope: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  };

  return (
    <AdminLayout title="Kuponlar">
      <div className="space-y-6">
        {/* Add/Edit Form */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-white">
                <Ticket className="h-5 w-5 text-primary" />
                {editingCoupon ? "Kupon Düzenle" : "Yeni Kupon Ekle"}
              </CardTitle>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kupon
              </Button>
            </div>
          </CardHeader>
          {isFormOpen && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </div>

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
                      İndirim Değeri *
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

                {/* Validity and Limits Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="minOrderAmount" className="text-slate-300">
                      Min. Sipariş ($)
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
                      Kullanım Limiti
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

                {/* Scope Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scope" className="text-slate-300">
                      Kapsam *
                    </Label>
                    <Select
                      value={formData.scope}
                      onValueChange={(value: 'general' | 'ship' | 'package') => {
                        setFormData({ 
                          ...formData, 
                          scope: value,
                          applicableShips: value === 'ship' ? formData.applicableShips : [],
                          applicablePlans: value === 'package' ? formData.applicablePlans : []
                        });
                      }}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="general">🌍 Genel (Tüm Gemiler/Paketler)</SelectItem>
                        <SelectItem value="ship">🚢 Belirli Gemiler</SelectItem>
                        <SelectItem value="package">📦 Belirli Paketler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ship Selection for Ship Scope */}
                  {formData.scope === 'ship' && (
                    <div className="space-y-2">
                      <Label className="text-slate-300">Uygulanacak Gemiler *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-800 rounded border border-slate-600">
                        {ships?.map((ship) => (
                          <label key={ship.id} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={formData.applicableShips.includes(ship.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    applicableShips: [...formData.applicableShips, ship.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    applicableShips: formData.applicableShips.filter(id => id !== ship.id)
                                  });
                                }
                              }}
                              className="rounded border-slate-500"
                            />
                            <span className="text-slate-300">{ship.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Package Selection for Package Scope */}
                  {formData.scope === 'package' && (
                    <div className="space-y-2">
                      <Label className="text-slate-300">Uygulanacak Paketler *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-800 rounded border border-slate-600">
                        {filteredPlans.map((plan) => (
                          <label key={plan.id} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={formData.applicablePlans.includes(plan.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    applicablePlans: [...formData.applicablePlans, plan.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    applicablePlans: formData.applicablePlans.filter(id => id !== plan.id)
                                  });
                                }
                              }}
                              className="rounded border-slate-500"
                            />
                            <span className="text-slate-300">{plan.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-300">
                    Açıklama (Opsiyonel)
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                    placeholder="Kupon hakkında açıklama..."
                    className="bg-slate-700 border-slate-600 text-white resize-none"
                    rows={3}
                  />
                </div>

                {/* Options & Settings */}
                <div className="space-y-4 p-4 bg-slate-800/30 rounded-lg border border-slate-600/50">
                  <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-cyan-400" />
                    Kupon Ayarları
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded border border-slate-600">
                      <div className="space-y-1">
                        <Label htmlFor="isActive" className="text-slate-200 font-medium">
                          Aktif Durumda
                        </Label>
                        <p className="text-xs text-slate-400">Kupon kullanıma açık olsun</p>
                      </div>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        data-testid="coupon-active-switch"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded border border-slate-600">
                      <div className="space-y-1">
                        <Label htmlFor="singleUseOnly" className="text-slate-200 font-medium">
                          Tek Kullanım
                        </Label>
                        <p className="text-xs text-slate-400">Kullanıcı başına bir kez kullanılabilir</p>
                      </div>
                      <Switch
                        id="singleUseOnly"
                        checked={formData.singleUseOnly}
                        onCheckedChange={(checked) => setFormData({ ...formData, singleUseOnly: checked })}
                        data-testid="coupon-single-use-switch"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-600">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    data-testid="coupon-submit-button"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingCoupon ? "Güncelle" : "Oluştur"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingCoupon(null);
                      setIsFormOpen(false);
                      resetForm();
                    }}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        {/* Filters and Search */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="h-5 w-5 text-primary" />
              Filtreler ve Arama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm">Kupon Kodu Ara</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Kupon kodunu yazın..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Label className="text-slate-300 text-sm">Durum</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                    <SelectItem value="expired">Süresi Dolmuş</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <Label className="text-slate-300 text-sm">Tür</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="percentage">Yüzde</SelectItem>
                    <SelectItem value="fixed">Sabit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scope Filter */}
              <div>
                <Label className="text-slate-300 text-sm">Kapsam</Label>
                <Select
                  value={filters.scope}
                  onValueChange={(value) => setFilters({ ...filters, scope: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="general">Genel</SelectItem>
                    <SelectItem value="ship">Gemi</SelectItem>
                    <SelectItem value="package">Paket</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Temizle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coupons Table */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">
                Kuponlar ({couponsResponse?.total || 0})
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                Sayfa {currentPage} / {totalPages || 1}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : coupons?.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-2 text-slate-300 font-medium">Kod</th>
                        <th className="text-left py-3 px-2 text-slate-300 font-medium">Tür/Değer</th>
                        <th className="text-left py-3 px-2 text-slate-300 font-medium">Durum</th>
                        <th className="text-left py-3 px-2 text-slate-300 font-medium">Kapsam</th>
                        <th className="text-left py-3 px-2 text-slate-300 font-medium">Kullanım</th>
                        <th className="text-left py-3 px-2 text-slate-300 font-medium">Oluşturulma</th>
                        <th className="text-right py-3 px-2 text-slate-300 font-medium">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon: Coupon) => (
                        <tr key={coupon.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <code className="bg-slate-700 px-2 py-1 rounded text-cyan-400 font-mono text-sm">
                                {coupon.code}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(coupon.code)}
                                className="h-6 w-6 p-0 hover:bg-slate-600"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1 text-green-400 font-semibold">
                              {coupon.discountType === 'percentage' ? (
                                <><Percent className="h-4 w-4" /> {coupon.discountValue}%</>
                              ) : (
                                <><DollarSign className="h-4 w-4" /> ${coupon.discountValue}</>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={getStatusColor(coupon)}>
                              {getStatusText(coupon) === "Aktif" ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Aktif</>
                              ) : (
                                <><AlertCircle className="h-3 w-3 mr-1" /> {getStatusText(coupon)}</>
                              )}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1 text-slate-300">
                              {getScopeIcon(coupon.scope)}
                              <span className="text-sm">{getScopeText(coupon)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-sm text-cyan-400 flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                              {coupon.singleUseOnly && (
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded ml-2">
                                  Tek
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-sm text-slate-400">
                              {formatDate(coupon.createdAt)}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(coupon)}
                                className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                data-testid={`edit-coupon-${coupon.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteCoupon(coupon)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                data-testid={`delete-coupon-${coupon.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {coupons.map((coupon: Coupon) => (
                    <Card key={coupon.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header Row */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <code className="bg-slate-700 px-2 py-1 rounded text-cyan-400 font-mono text-sm">
                                {coupon.code}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(coupon.code)}
                                className="h-6 w-6 p-0 hover:bg-slate-600"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <Badge className={getStatusColor(coupon)}>
                              {getStatusText(coupon) === "Aktif" ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Aktif</>
                              ) : (
                                <><AlertCircle className="h-3 w-3 mr-1" /> {getStatusText(coupon)}</>
                              )}
                            </Badge>
                          </div>

                          {/* Discount Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-green-400 font-semibold">
                              {coupon.discountType === 'percentage' ? (
                                <><Percent className="h-4 w-4" /> {coupon.discountValue}%</>
                              ) : (
                                <><DollarSign className="h-4 w-4" /> ${coupon.discountValue}</>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-slate-300">
                              {getScopeIcon(coupon.scope)}
                              <span className="text-sm">{getScopeText(coupon)}</span>
                            </div>
                          </div>

                          {/* Usage Info */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="text-cyan-400 flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                              {coupon.singleUseOnly && (
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded ml-2">
                                  Tek
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400">
                              {formatDate(coupon.createdAt)}
                            </div>
                          </div>

                          {/* Description */}
                          {coupon.description && (
                            <div className="text-sm text-slate-400 bg-slate-800/50 p-2 rounded">
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{coupon.description}</span>
                              </div>
                            </div>
                          )}

                          {/* Validity Dates */}
                          {(coupon.validFrom || coupon.validUntil) && (
                            <div className="text-sm text-slate-400 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {coupon.validFrom && coupon.validUntil 
                                  ? `${formatDate(coupon.validFrom)} - ${formatDate(coupon.validUntil)}`
                                  : coupon.validFrom 
                                    ? `${formatDate(coupon.validFrom)} →`
                                    : `→ ${formatDate(coupon.validUntil!)}`
                                }
                              </span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(coupon)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                              data-testid={`edit-coupon-mobile-${coupon.id}`}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Düzenle
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteCoupon(coupon)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              data-testid={`delete-coupon-mobile-${coupon.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Sil
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
                    <div className="text-sm text-slate-400">
                      {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, couponsResponse?.total || 0)} / {couponsResponse?.total || 0} kupon
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          const isActive = page === currentPage;
                          return (
                            <Button
                              key={page}
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={isActive 
                                ? "bg-primary text-white" 
                                : "border-slate-600 text-slate-300 hover:bg-slate-700"
                              }
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Ticket className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Kupon Bulunamadı</h3>
                <p className="text-slate-400 mb-6">Arama kriterlerinize uygun kupon bulunamadı.</p>
                <Button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  Filtreleri Temizle
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteCoupon} onOpenChange={() => setDeleteCoupon(null)}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Kupon Sil</DialogTitle>
              <DialogDescription className="text-slate-400">
                "<span className="font-mono text-cyan-400">{deleteCoupon?.code}</span>" kuponunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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