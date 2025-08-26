import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Upload, Download,
  Package, Ship as ShipIcon, DollarSign, Calendar, Users, Key, 
  CheckCircle, XCircle, AlertCircle, TrendingUp, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Filter, SortAsc, SortDesc, RefreshCw,
  Settings, Database, Shield, Activity, Zap
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
  validityDays?: number; // DEPRECATED: All packages now valid until end of purchase month
  shipId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  ship?: Ship;
  credentialStats?: {
    total: number;
    available: number;
    assigned: number;
  };
}

interface Credential {
  id: string;
  username: string;
  password: string;
  isAssigned: boolean;
  assignedToOrderId?: string;
  assignedToUserId?: string;
  createdAt: string;
}

type SortField = 'name' | 'price' | 'dataLimit' | 'ship' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PackagesManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShip, setSelectedShip] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCredentialDialog, setShowCredentialDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [selectedPlanForCredentials, setSelectedPlanForCredentials] = useState<Plan | null>(null);
  const [credentialText, setCredentialText] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceUsd: '',
    dataLimitGb: '',
    shipId: '',
    isActive: true
  });

  // Form validation
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Paket adı gereklidir';
    } else if (formData.name.length < 3) {
      errors.name = 'Paket adı en az 3 karakter olmalıdır';
    }
    
    if (!formData.shipId) {
      errors.shipId = 'Gemi seçimi gereklidir';
    }
    
    const price = parseFloat(formData.priceUsd);
    if (!formData.priceUsd || isNaN(price) || price <= 0) {
      errors.priceUsd = 'Geçerli bir fiyat giriniz';
    } else if (price > 10000) {
      errors.priceUsd = 'Fiyat 10,000 USD\'den fazla olamaz';
    }
    
    const dataLimit = parseInt(formData.dataLimitGb);
    if (!formData.dataLimitGb || isNaN(dataLimit) || dataLimit <= 0) {
      errors.dataLimitGb = 'Geçerli veri limiti giriniz';
    } else if (dataLimit > 1000) {
      errors.dataLimitGb = 'Veri limiti 1000 GB\'den fazla olamaz';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const { data: plans = [], isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ['/api/admin/plans'],
    queryFn: () => apiRequest('GET', '/api/admin/plans').then(res => res.json()),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: ships = [] } = useQuery({
    queryKey: ['/api/admin/ships'],
    queryFn: () => apiRequest('GET', '/api/admin/ships').then(res => res.json())
  });

  // Get credentials for selected plan
  const { data: planCredentials = [], isLoading: credentialsLoading } = useQuery({
    queryKey: ['/api/admin/credentials', selectedPlanForCredentials?.id],
    queryFn: () => selectedPlanForCredentials 
      ? apiRequest('GET', `/api/admin/plans/${selectedPlanForCredentials.id}/credentials`).then(res => res.json())
      : Promise.resolve([]),
    enabled: !!selectedPlanForCredentials
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: '✅ Başarılı',
        description: 'Veri paketi başarıyla oluşturuldu ve sisteme eklendi.',
        className: 'bg-green-900/90 border-green-700 text-green-100',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Hata',
        description: error.message || 'Paket oluşturulurken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
        className: 'bg-red-900/90 border-red-700 text-red-100',
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
        title: '✅ Başarılı',
        description: 'Paket bilgileri başarıyla güncellendi ve değişiklikler uygulandı.',
        className: 'bg-green-900/90 border-green-700 text-green-100',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Hata',
        description: error.message || 'Paket güncellenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
        className: 'bg-red-900/90 border-red-700 text-red-100',
      });
    }
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      toast({
        title: '🗑️ Başarılı',
        description: 'Paket başarıyla silindi ve sistemden kaldırıldı.',
        className: 'bg-red-900/90 border-red-700 text-red-100',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Hata',
        description: error.message || 'Paket silinirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
        className: 'bg-red-900/90 border-red-700 text-red-100',
      });
    }
  });

  // Add credentials mutation
  const addCredentialsMutation = useMutation({
    mutationFn: ({ planId, credentials }: { planId: string; credentials: string }) => 
      apiRequest('POST', `/api/admin/plans/${planId}/credentials`, { credentials }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials'] });
      setShowCredentialDialog(false);
      setCredentialText('');
      setSelectedPlanForCredentials(null);
      const count = (data as any)?.count || 0;
      toast({
        title: '🔑 Başarılı',
        description: `${count} adet kimlik bilgisi başarıyla eklendi ve kullanıma hazır.`,
        className: 'bg-blue-900/90 border-blue-700 text-blue-100',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Hata',
        description: error.message || 'Kimlik bilgileri eklenirken hata oluştu. Format kontrol edin.',
        variant: 'destructive',
        className: 'bg-red-900/90 border-red-700 text-red-100',
      });
    }
  });

  // Toggle plan status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest('PUT', `/api/admin/plans/${id}`, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      toast({
        title: variables.isActive ? '✅ Paket Aktifleştirildi' : '⏸️ Paket Devre Dışı',
        description: variables.isActive 
          ? 'Paket aktif duruma getirildi ve satışa sunuldu.'
          : 'Paket devre dışı bırakıldı ve satıştan kaldırıldı.',
        className: variables.isActive 
          ? 'bg-green-900/90 border-green-700 text-green-100'
          : 'bg-blue-900/90 border-blue-700 text-blue-100',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Hata',
        description: error.message || 'Paket durumu değiştirilirken hata oluştu.',
        variant: 'destructive',
        className: 'bg-red-900/90 border-red-700 text-red-100',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priceUsd: '',
      dataLimitGb: '',
      shipId: '',
      isActive: true
    });
    setFormErrors({});
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      priceUsd: plan.priceUsd,
      dataLimitGb: plan.dataLimitGb.toString(),
      shipId: plan.shipId,
      isActive: plan.isActive
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: '⚠️ Form Hatası',
        description: 'Lütfen form hatalarını düzeltip tekrar deneyin.',
        variant: 'destructive',
        className: 'bg-red-900/90 border-red-700 text-red-100',
      });
      return;
    }
    
    const data = {
      ...formData,
      priceUsd: parseFloat(formData.priceUsd).toFixed(2),
      dataLimitGb: parseInt(formData.dataLimitGb)
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const handleAddCredentials = () => {
    if (!selectedPlanForCredentials || !credentialText.trim()) {
      toast({
        title: '⚠️ Eksik Bilgi',
        description: 'Lütfen kimlik bilgilerini girin.',
        variant: 'destructive',
        className: 'bg-red-900/90 border-red-700 text-red-100',
      });
      return;
    }

    addCredentialsMutation.mutate({
      planId: selectedPlanForCredentials.id,
      credentials: credentialText
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <SortAsc className="h-4 w-4 opacity-30" />;
    return sortDirection === 'asc' 
      ? <SortAsc className="h-4 w-4 text-cyan-400" />
      : <SortDesc className="h-4 w-4 text-cyan-400" />;
  };

  // Filter and sort plans
  const filteredAndSortedPlans = plans
    .filter((plan: Plan) => {
      const matchesSearch = 
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.ship?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesShip = selectedShip === 'all' || plan.shipId === selectedShip;
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && plan.isActive) ||
        (statusFilter === 'inactive' && !plan.isActive);
      
      const price = parseFloat(plan.priceUsd);
      const matchesPrice = 
        priceFilter === 'all' ||
        (priceFilter === 'low' && price <= 50) ||
        (priceFilter === 'medium' && price > 50 && price <= 200) ||
        (priceFilter === 'high' && price > 200);
      
      return matchesSearch && matchesShip && matchesStatus && matchesPrice;
    })
    .sort((a: Plan, b: Plan) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = parseFloat(a.priceUsd);
          bValue = parseFloat(b.priceUsd);
          break;
        case 'dataLimit':
          aValue = a.dataLimitGb;
          bValue = b.dataLimitGb;
          break;
        case 'ship':
          aValue = a.ship?.name?.toLowerCase() || '';
          bValue = b.ship?.name?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  
  // Pagination
  const totalFilteredPlans = filteredAndSortedPlans.length;
  const totalPages = Math.ceil(totalFilteredPlans / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFilteredPlans);
  const paginatedPlans = filteredAndSortedPlans.slice(startIndex, endIndex);
  
  const paginationInfo: PaginationInfo = {
    page: currentPage,
    limit: pageSize,
    total: totalFilteredPlans,
    totalPages
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedShip, statusFilter, priceFilter]);

  // Calculate enhanced stats
  const totalPlans = plans.length;
  const activePlans = plans.filter((p: Plan) => p.isActive).length;
  const inactivePlans = totalPlans - activePlans;
  const totalCredentials = plans.reduce((sum: number, p: Plan) => sum + (p.credentialStats?.total || 0), 0);
  const availableCredentials = plans.reduce((sum: number, p: Plan) => sum + (p.credentialStats?.available || 0), 0);
  const assignedCredentials = plans.reduce((sum: number, p: Plan) => sum + (p.credentialStats?.assigned || 0), 0);
  const avgPrice = plans.length > 0 ? plans.reduce((sum: number, p: Plan) => sum + parseFloat(p.priceUsd), 0) / plans.length : 0;
  const totalValue = plans.reduce((sum: number, p: Plan) => sum + parseFloat(p.priceUsd), 0);
  const credentialUtilization = totalCredentials > 0 ? Math.round((assignedCredentials / totalCredentials) * 100) : 0;

  return (
    <AdminLayout title="Paket Yönetimi">
      <div className="space-y-8 p-1">

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="glass-card border-primary/20 hover:border-primary/40 transition-all duration-300 bg-gradient-to-br from-slate-900/20 to-slate-800/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Toplam Paket</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalPlans}</div>
              <p className="text-xs text-slate-400">Sistemdeki tüm paketler</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-green-500/20 hover:border-green-400/40 transition-all duration-300 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-200">Aktif Paketler</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{activePlans}</div>
              <p className="text-xs text-green-300/80">Satışa sunulan paketler</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-red-500/20 hover:border-red-400/40 transition-all duration-300 bg-gradient-to-br from-red-900/20 to-rose-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-200">Pasif Paketler</CardTitle>
              <XCircle className="h-5 w-5 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{inactivePlans}</div>
              <p className="text-xs text-red-300/80">Devre dışı paketler</p>
            </CardContent>
          </Card>

        </div>

        {/* Enhanced Filters */}
        <Card className="glass-card border-primary/20 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Arama ve Filtreleme
              </CardTitle>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="glass-card border-slate-600 hover:border-primary/50 text-slate-200 hover:text-primary"
              >
                {showFilters ? 'Filtreleri Gizle' : 'Gelişmiş Filtreler'}
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
              <Input
                placeholder="Paket adı, gemi adı veya açıklama ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary/50 focus:ring-primary/20 h-12 text-lg"
                data-testid="input-search-packages"
              />
            </div>
            
            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <Label className="text-slate-300 text-sm font-medium">Gemi</Label>
                  <Select value={selectedShip} onValueChange={setSelectedShip}>
                    <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-600 text-white hover:border-primary/50">
                      <SelectValue placeholder="Gemi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🚢 Tüm Gemiler</SelectItem>
                      {ships.map((ship: Ship) => (
                        <SelectItem key={ship.id} value={ship.id}>
                          {ship.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-slate-300 text-sm font-medium">Durum</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-600 text-white hover:border-primary/50">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">📊 Tüm Durumlar</SelectItem>
                      <SelectItem value="active">✅ Aktif Paketler</SelectItem>
                      <SelectItem value="inactive">❌ Pasif Paketler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-slate-300 text-sm font-medium">Fiyat Aralığı</Label>
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-600 text-white hover:border-primary/50">
                      <SelectValue placeholder="Fiyat aralığı" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">💰 Tüm Fiyatlar</SelectItem>
                      <SelectItem value="low">💵 Düşük (≤ $50)</SelectItem>
                      <SelectItem value="medium">💸 Orta ($50-$200)</SelectItem>
                      <SelectItem value="high">💎 Yüksek (&gt; $200)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-slate-300 text-sm font-medium">Sayfa Boyutu</Label>
                  <Select value={pageSize.toString()} onValueChange={(value) => {
                    setPageSize(parseInt(value));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-600 text-white hover:border-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 sonuç</SelectItem>
                      <SelectItem value="10">10 sonuç</SelectItem>
                      <SelectItem value="25">25 sonuç</SelectItem>
                      <SelectItem value="50">50 sonuç</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {/* Filter Summary */}
            <div className="flex items-center justify-between text-sm text-slate-400 pt-2">
              <span>
                {totalPlans} paketten {totalFilteredPlans} sonuç gösteriliyor
                {searchTerm && ` "${searchTerm}" için`}
              </span>
              {(searchTerm || selectedShip !== 'all' || statusFilter !== 'all' || priceFilter !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedShip('all');
                    setStatusFilter('all');
                    setPriceFilter('all');
                    setCurrentPage(1);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-cyan-300 hover:bg-primary/10"
                >
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Plans Table */}
        <Card className="glass-card border-primary/20 bg-gradient-to-br from-slate-900/80 to-slate-800/80">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Paket Listesi
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Sayfa {currentPage} / {totalPages} • Toplam {totalFilteredPlans} sonuç • Sayfa başına {pageSize} öğe
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary border-primary/50">
                  {startIndex + 1}-{endIndex} / {totalFilteredPlans}
                </Badge>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="glass-card bg-gradient-to-r from-primary to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Paket
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin h-12 w-12 border-3 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-slate-400">Paketler yükleniliyor...</p>
                </div>
              </div>
            ) : paginatedPlans.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Package className="h-16 w-16 text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Hiç paket bulunamadı</h3>
                  <p className="text-slate-400">Arama kriterlerinize uygun paket bulunmuyor.</p>
                </div>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="glass-card bg-gradient-to-r from-primary to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  İlk Paketi Oluştur
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sortable Table */}
                <div className="rounded-xl border border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 bg-slate-800/50">
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            Paket Adı
                            {getSortIcon('name')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort('ship')}
                        >
                          <div className="flex items-center gap-2">
                            Gemi
                            {getSortIcon('ship')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort('price')}
                        >
                          <div className="flex items-center gap-2">
                            Fiyat
                            {getSortIcon('price')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort('dataLimit')}
                        >
                          <div className="flex items-center gap-2">
                            Veri Limiti
                            {getSortIcon('dataLimit')}
                          </div>
                        </TableHead>
                        <TableHead className="text-slate-300">Kimlik Durumu</TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-2">
                            Durum
                            {getSortIcon('status')}
                          </div>
                        </TableHead>
                        <TableHead className="text-slate-300">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPlans.map((plan: Plan, index: number) => (
                        <TableRow 
                          key={plan.id} 
                          className="border-slate-700 hover:bg-slate-800/30 transition-colors group"
                          data-testid={`row-package-${index}`}
                        >
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="font-semibold text-white group-hover:text-primary transition-colors">
                                {plan.name}
                              </div>
                              {plan.description && (
                                <div className="text-sm text-slate-400 max-w-xs truncate" title={plan.description}>
                                  {plan.description}
                                </div>
                              )}
                              <div className="text-xs text-slate-500">
                                Oluşturuldu: {format(new Date(plan.createdAt), 'd MMM yyyy', { locale: tr })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ShipIcon className="h-4 w-4 text-blue-400" />
                              <span className="text-slate-200 font-medium">{plan.ship?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-green-400" />
                              <span className="text-white font-bold text-lg">${plan.priceUsd}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Database className="h-4 w-4 text-purple-400" />
                              <span className="text-slate-200 font-medium">{plan.dataLimitGb} GB</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {plan.credentialStats ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                  <span className="text-green-300 font-medium text-sm">
                                    {plan.credentialStats.available} kullanılabilir
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                  <span className="text-blue-300 text-sm">
                                    {plan.credentialStats.total} toplam
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                  <span className="text-red-300 text-sm">
                                    {plan.credentialStats.assigned} atanmış
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-400" />
                                <span className="text-red-400 text-sm">Kimlik yok</span>
                                <Button
                                  onClick={() => {
                                    setSelectedPlanForCredentials(plan);
                                    setShowCredentialDialog(true);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="ml-2 h-6 text-xs border-primary/50 text-primary hover:bg-primary/10"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Ekle
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {plan.isActive ? (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <Badge className="bg-green-600/20 text-green-300 border-green-500/50 hover:bg-green-600/30 hover:border-green-400/70 transition-colors duration-200">
                                  ✅ Aktif
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <Badge className="bg-red-600/20 text-red-300 border-red-500/50 hover:bg-red-600/30 hover:border-red-400/70 transition-colors duration-200">
                                  ❌ Pasif
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0 hover:bg-slate-700/50"
                                    data-testid={`button-actions-${index}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600 min-w-48">
                                  <DropdownMenuLabel className="text-slate-300">Paket İşlemleri</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-slate-600" />
                                  <DropdownMenuItem 
                                    onClick={() => handleEdit(plan)}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Paket Bilgilerini Düzenle
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-600" />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      if (confirm(`"${plan.name}" paketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
                                        deletePlanMutation.mutate(plan.id);
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Kalkalıcı Olarak Sil
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-700">
                    <div className="text-sm text-slate-400">
                      <span className="font-medium text-slate-300">{startIndex + 1}-{endIndex}</span> / <span className="font-medium text-slate-300">{totalFilteredPlans}</span> sonuç gösteriliyor
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="glass-card border-slate-600 hover:border-primary/50 text-slate-200 hover:text-primary disabled:opacity-30"
                      >
                        « İlk
                      </Button>
                      <Button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="glass-card border-slate-600 hover:border-primary/50 text-slate-200 hover:text-primary disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Önceki
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className={currentPage === pageNum
                                ? "bg-primary border-primary text-white"
                                : "glass-card border-slate-600 hover:border-primary/50 text-slate-200 hover:text-primary"
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="glass-card border-slate-600 hover:border-primary/50 text-slate-200 hover:text-primary disabled:opacity-30"
                      >
                        Sonraki
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="glass-card border-slate-600 hover:border-primary/50 text-slate-200 hover:text-primary disabled:opacity-30"
                      >
                        Son »
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Create/Edit Dialog */}
        <Dialog open={showCreateDialog || !!editingPlan} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingPlan(null);
            resetForm();
          }
        }}>
          <DialogContent className="glass-card border-primary/30 bg-gradient-to-br from-slate-900/95 to-slate-800/95 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                {editingPlan ? (
                  <>
                    <Edit className="h-6 w-6 text-primary" />
                    Paket Bilgilerini Düzenle
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6 text-primary" />
                    Yeni Veri Paketi Oluştur
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-base">
                {editingPlan 
                  ? `"${editingPlan.name}" paketinin bilgilerini güncelleyin ve değişikliklerinizi kaydedin.`
                  : 'Gemileriniz için yeni bir Starlink veri paketi oluşturun ve satışa sunun.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              {/* Package Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-cyan-200 font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Paket Adı *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) {
                      setFormErrors({ ...formErrors, name: '' });
                    }
                  }}
                  className={`bg-slate-800/50 border-slate-600 text-white h-12 text-lg placeholder:text-slate-400 focus:border-primary/50 focus:ring-primary/20 ${
                    formErrors.name ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Örn: Premium Starlink Paketi"
                  required
                  data-testid="input-package-name"
                />
                {formErrors.name && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.name}
                  </p>
                )}
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-cyan-200 font-medium flex items-center gap-2">
                  <Edit className="h-4 w-4 text-primary" />
                  Paket Açıklaması
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-800/50 border-slate-600 text-white min-h-20 placeholder:text-slate-400 focus:border-primary/50 focus:ring-primary/20"
                  placeholder="Paketin özelliklerini ve avantajlarını açıklayın..."
                  data-testid="textarea-package-description"
                />
              </div>

              {/* Ship Selection */}
              <div className="space-y-2">
                <Label htmlFor="shipId" className="text-cyan-200 font-medium flex items-center gap-2">
                  <ShipIcon className="h-4 w-4 text-primary" />
                  Hedef Gemi *
                </Label>
                <Select 
                  value={formData.shipId} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, shipId: value });
                    if (formErrors.shipId) {
                      setFormErrors({ ...formErrors, shipId: '' });
                    }
                  }}
                >
                  <SelectTrigger className={`bg-slate-800/50 border-slate-600 text-white h-12 hover:border-primary/50 ${
                    formErrors.shipId ? 'border-red-500 focus:border-red-500' : ''
                  }`}>
                    <SelectValue placeholder="Bu paketin ait olduğu gemiyi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {ships.map((ship: Ship) => (
                      <SelectItem key={ship.id} value={ship.id}>
                        🚢 {ship.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.shipId && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.shipId}
                  </p>
                )}
              </div>

              {/* Price and Data Limit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="priceUsd" className="text-cyan-200 font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Fiyat (USD) *
                  </Label>
                  <Input
                    id="priceUsd"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10000"
                    value={formData.priceUsd}
                    onChange={(e) => {
                      setFormData({ ...formData, priceUsd: e.target.value });
                      if (formErrors.priceUsd) {
                        setFormErrors({ ...formErrors, priceUsd: '' });
                      }
                    }}
                    className={`bg-slate-800/50 border-slate-600 text-white h-12 text-lg placeholder:text-slate-400 focus:border-primary/50 focus:ring-primary/20 ${
                      formErrors.priceUsd ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="99.99"
                    required
                    data-testid="input-package-price"
                  />
                  {formErrors.priceUsd && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.priceUsd}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dataLimitGb" className="text-cyan-200 font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Veri Limiti (GB) *
                  </Label>
                  <Input
                    id="dataLimitGb"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.dataLimitGb}
                    onChange={(e) => {
                      setFormData({ ...formData, dataLimitGb: e.target.value });
                      if (formErrors.dataLimitGb) {
                        setFormErrors({ ...formErrors, dataLimitGb: '' });
                      }
                    }}
                    className={`bg-slate-800/50 border-slate-600 text-white h-12 text-lg placeholder:text-slate-400 focus:border-primary/50 focus:ring-primary/20 ${
                      formErrors.dataLimitGb ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="100"
                    required
                    data-testid="input-package-data-limit"
                  />
                  {formErrors.dataLimitGb && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.dataLimitGb}
                    </p>
                  )}
                </div>
              </div>

              {/* Validity Period Info */}
              <div className="glass-card bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <Label className="text-blue-200 font-semibold text-lg">Geçerlilik Süresi Sistemi</Label>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-blue-300 font-medium">Otomatik Ay Sonu Bitiş</span>
                  </div>
                  <div className="text-sm text-slate-300 leading-relaxed">
                    Tüm veri paketleri, satın alınan ayın son günü saat 23:59'a kadar geçerlidir.
                    Bu sistem, kullanıcıların ay başında paket almalarını teşvik eder.
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-cyan-500">
                    <div className="text-xs text-cyan-300 font-medium mb-1">📅 Örnek Kullanım:</div>
                    <div className="text-xs text-slate-400">
                      15 Ocak 2025'te satın alınan paket → 31 Ocak 2025 saat 23:59'a kadar geçerli
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="glass-card border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white w-full sm:w-auto"
                >
                  ❌ İptal Et
                </Button>
                <Button
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  className="glass-card bg-gradient-to-r from-primary to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-primary/50 text-white hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/20 w-full sm:w-auto"
                  data-testid="button-save-package"
                >
                  {createPlanMutation.isPending || updatePlanMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : editingPlan ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Değişiklikleri Kaydet
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Paketi Oluştur
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Enhanced Credential Management Dialog */}
        <Dialog open={showCredentialDialog} onOpenChange={(open) => {
          if (!open) {
            setShowCredentialDialog(false);
            setSelectedPlanForCredentials(null);
            setCredentialText('');
          }
        }}>
          <DialogContent className="glass-card border-blue-500/30 bg-gradient-to-br from-slate-900/95 to-slate-800/95 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                <Key className="h-6 w-6 text-blue-400" />
                Kimlik Bilgileri Yönetimi
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-base">
                {selectedPlanForCredentials && (
                  <>
                    <strong className="text-blue-300">"{selectedPlanForCredentials.name}"</strong> paketi için kimlik bilgilerini yönetin.
                    Her satırda bir kimlik bilgisi olacak şekilde "kullanıcıadı,şifre" formatında girin.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-6">
              {/* Current Credentials Stats */}
              {selectedPlanForCredentials?.credentialStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="glass-card border-green-500/20 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-300">
                        {selectedPlanForCredentials.credentialStats.available}
                      </div>
                      <div className="text-sm text-green-200">Kullanılabilir</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-red-500/20 bg-gradient-to-br from-red-900/20 to-pink-900/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-300">
                        {selectedPlanForCredentials.credentialStats.assigned}
                      </div>
                      <div className="text-sm text-red-200">Atanmış</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-cyan-900/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-300">
                        {selectedPlanForCredentials.credentialStats.total}
                      </div>
                      <div className="text-sm text-blue-200">Toplam</div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Add New Credentials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-400" />
                  <Label className="text-blue-200 font-medium text-lg">Yeni Kimlik Bilgileri Ekle</Label>
                </div>
                
                <div className="space-y-2">
                  <Textarea
                    value={credentialText}
                    onChange={(e) => setCredentialText(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white min-h-40 font-mono text-sm placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20"
                    placeholder={`Her satırda bir kimlik bilgisi olacak şekilde girin:

user001,password123
user002,password456
user003,password789

Format: kullanıcıadı,şifre`}
                  />
                  
                  <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-cyan-200 font-medium text-sm">Format Kuralları:</span>
                    </div>
                    <ul className="text-xs text-slate-400 space-y-1 ml-6">
                      <li>• Her satırda sadece bir kimlik bilgisi</li>
                      <li>• Kullanıcı adı ve şifre arasında virgül (,) kullanın</li>
                      <li>• Kullanıcı adı ve şifre boş olamaz</li>
                      <li>• Özel karakterler ve boşluklar desteklenir</li>
                      <li>• Aynı kullanıcı adı birden fazla kez kullanılamaz</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCredentialDialog(false);
                    setSelectedPlanForCredentials(null);
                    setCredentialText('');
                  }}
                  className="glass-card border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white w-full sm:w-auto"
                >
                  ❌ İptal Et
                </Button>
                <Button
                  onClick={handleAddCredentials}
                  disabled={addCredentialsMutation.isPending || !credentialText.trim()}
                  className="glass-card bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-blue-500/50 text-white hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 w-full sm:w-auto"
                >
                  {addCredentialsMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Ekleniyor...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Kimlik Bilgilerini Ekle
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}