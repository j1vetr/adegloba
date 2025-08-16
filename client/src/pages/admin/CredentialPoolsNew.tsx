import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Search, Package, Upload, Download, Trash2, MoreHorizontal, 
  Edit, User, Check, X, Ship as ShipIcon, AlertCircle, Eye, EyeOff 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Ship, Plan, CredentialPool } from '@shared/schema';

interface CredentialFormData {
  planId: string;
  username: string;
  password: string;
}

interface CredentialStats {
  totalCredentials: number;
  availableCredentials: number;
  assignedCredentials: number;
  planBreakdown: Array<{
    planId: string;
    planTitle: string;
    shipName: string;
    total: number;
    available: number;
    assigned: number;
  }>;
}

interface CredentialWithDetails extends CredentialPool {
  plan: Plan;
  ship: Ship;
}

export default function CredentialPoolsNew() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([]);
  const [deleteCredentials, setDeleteCredentials] = useState<CredentialWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showPasswords, setShowPasswords] = useState(false);
  const [importText, setImportText] = useState('');
  const [selectedPlanForImport, setSelectedPlanForImport] = useState('');
  const [editingCredential, setEditingCredential] = useState<CredentialWithDetails | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedCredentialForAssignment, setSelectedCredentialForAssignment] = useState<CredentialWithDetails | null>(null);
  
  const [formData, setFormData] = useState<CredentialFormData>({
    planId: '',
    username: '',
    password: '',
  });

  // Fetch credentials with plan and ship details
  const { data: credentials, isLoading: credentialsLoading } = useQuery({
    queryKey: ["/api/admin/credentials"],
  });

  // Fetch ships and plans for filters
  const { data: ships, isLoading: shipsLoading } = useQuery({
    queryKey: ["/api/admin/ships"],
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/admin/plans"],
  });

  // Calculate credential statistics
  const credentialStats: CredentialStats = {
    totalCredentials: credentials?.length || 0,
    availableCredentials: credentials?.filter((c: CredentialWithDetails) => !c.isAssigned).length || 0,
    assignedCredentials: credentials?.filter((c: CredentialWithDetails) => c.isAssigned).length || 0,
    planBreakdown: plans?.map((plan: Plan) => {
      const planCredentials = credentials?.filter((c: CredentialWithDetails) => c.planId === plan.id) || [];
      const ship = ships?.find((s: Ship) => s.id === plan.shipId);
      return {
        planId: plan.id,
        planTitle: plan.name,
        shipName: ship?.name || 'Unknown Ship',
        total: planCredentials.length,
        available: planCredentials.filter(c => !c.isAssigned).length,
        assigned: planCredentials.filter(c => c.isAssigned).length,
      };
    }).filter(p => p.total > 0) || [],
  };

  // Filter credentials
  const filteredCredentials = credentials?.filter((credential: CredentialWithDetails) => {
    const matchesSearch = !searchQuery || 
      credential.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credential.plan?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credential.ship?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'available' && !credential.isAssigned) ||
      (statusFilter === 'assigned' && credential.isAssigned);
    
    const matchesPlan = planFilter === 'all' || credential.planId === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  }) || [];

  // Create credential mutation
  const createMutation = useMutation({
    mutationFn: async (data: CredentialFormData) => {
      return await apiRequest("POST", "/api/admin/credentials", data);
    },
    onSuccess: () => {
      // Force complete cache refresh for immediate stock updates
      queryClient.resetQueries({ queryKey: ["/api/admin/credentials"] });
      queryClient.removeQueries({ queryKey: ["/api/user/ship-plans"], exact: false });
      queryClient.resetQueries({ queryKey: ["/api/admin/plans"] });
      
      setIsFormOpen(false);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Kimlik bilgisi başarıyla oluşturuldu. Stok güncellenmiştir.",
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

  // Import credentials mutation
  const importMutation = useMutation({
    mutationFn: async (data: { planId: string; credentials: Array<{ username: string; password: string }> }) => {
      return await apiRequest("POST", "/api/admin/credentials/import", data);
    },
    onSuccess: (data) => {
      // Force complete cache refresh for immediate stock updates
      queryClient.resetQueries({ queryKey: ["/api/admin/credentials"] });
      queryClient.removeQueries({ queryKey: ["/api/user/ship-plans"], exact: false });
      queryClient.resetQueries({ queryKey: ["/api/admin/plans"] });
      
      setIsImportOpen(false);
      setImportText('');
      setSelectedPlanForImport('');
      
      console.log('📦 Stock updated after credential import:', data.updatedStock, 'for plan', selectedPlanForImport);
      
      toast({
        title: "Başarılı",
        description: `${data.created} kimlik bilgisi başarıyla içe aktarıldı. Stok güncellenmiştir.`,
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

  // Edit credential mutation
  const editMutation = useMutation({
    mutationFn: async (data: { id: string; username: string; password: string; planId: string }) => {
      return await apiRequest("PUT", `/api/admin/credentials/${data.id}`, {
        username: data.username,
        password: data.password,
        planId: data.planId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credentials"] });
      setShowEditDialog(false);
      setEditingCredential(null);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Kimlik bilgisi başarıyla güncellendi.",
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

  // Bulk delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await apiRequest("DELETE", "/api/admin/credentials/bulk", { ids });
    },
    onSuccess: () => {
      // Invalidate both admin and user package queries to update stock
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credentials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/ship-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      
      setDeleteCredentials([]);
      setSelectedCredentials([]);
      toast({
        title: "Başarılı",
        description: "Seçili kimlik bilgileri başarıyla silindi. Stok güncellenmiştir.",
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
      planId: '',
      username: '',
      password: '',
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCredentials(filteredCredentials.map((c: CredentialWithDetails) => c.id));
    } else {
      setSelectedCredentials([]);
    }
  };

  const handleSelectCredential = (credentialId: string, checked: boolean) => {
    if (checked) {
      setSelectedCredentials(prev => [...prev, credentialId]);
    } else {
      setSelectedCredentials(prev => prev.filter(id => id !== credentialId));
    }
  };

  const handleBulkDelete = () => {
    const credentialsToDelete = filteredCredentials.filter((c: CredentialWithDetails) => 
      selectedCredentials.includes(c.id)
    );
    setDeleteCredentials(credentialsToDelete);
  };

  const handleImport = () => {
    if (!selectedPlanForImport || !importText.trim()) {
      toast({
        title: "Hata",
        description: "Paket seçin ve kimlik bilgilerini girin.",
        variant: "destructive",
      });
      return;
    }

    const lines = importText.trim().split('\n');
    const credentials: Array<{ username: string; password: string }> = [];

    for (const line of lines) {
      const [username, password] = line.split(',').map(s => s.trim());
      if (username && password) {
        credentials.push({ username, password });
      }
    }

    if (credentials.length === 0) {
      toast({
        title: "Hata",
        description: "Geçerli kimlik bilgisi formatı bulunamadı.",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate({ planId: selectedPlanForImport, credentials });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.planId || !formData.username || !formData.password) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const getStatusBadge = (isAssigned: boolean) => {
    return isAssigned ? (
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-3 h-3 bg-red-400 rounded-full animate-ping opacity-75"></div>
        </div>
        <Badge className="bg-red-600/20 text-red-300 border-red-500/50 animate-pulse">
          ❌ Atanmış
        </Badge>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
        </div>
        <Badge className="bg-green-600/20 text-green-300 border-green-500/50 animate-pulse">
          ✅ Kullanılabilir
        </Badge>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: tr });
  };

  return (
    <AdminLayout title="Kimlik Havuzu Yönetimi">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Kimlik Bilgisi Havuzu</h1>
            <p className="text-gray-400 mt-1">
              Paket bazlı kimlik bilgisi yönetimi ve otomatik sipariş teslimatı
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              data-testid="import-credentials-button"
            >
              <Upload className="mr-2 h-4 w-4" />
              Toplu İçe Aktar
            </Button>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white neon-glow"
              data-testid="add-credential-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kimlik Ekle
            </Button>
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Toplam Kimlik</p>
                  <p className="text-2xl font-bold text-white">{credentialStats.totalCredentials}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 hover:border-green-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-green-500/10 group">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg group-hover:bg-green-500/30 transition-colors duration-300 relative">
                  <Check className="h-5 w-5 text-green-400 group-hover:animate-bounce" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full group-hover:animate-ping opacity-0 group-hover:opacity-75"></div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm group-hover:text-green-300 transition-colors duration-300">Kullanılabilir</p>
                  <p className="text-2xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{credentialStats.availableCredentials}</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1 mt-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse" style={{width: `${credentialStats.totalCredentials > 0 ? (credentialStats.availableCredentials / credentialStats.totalCredentials) * 100 : 0}%`}}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 hover:border-red-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-red-500/10 group">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600/20 rounded-lg group-hover:bg-red-500/30 transition-colors duration-300 relative">
                  <User className="h-5 w-5 text-red-400 group-hover:animate-spin" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full group-hover:animate-ping opacity-0 group-hover:opacity-75"></div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm group-hover:text-red-300 transition-colors duration-300">Atanmış</p>
                  <p className="text-2xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{credentialStats.assignedCredentials}</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1 mt-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-400 to-rose-400 rounded-full animate-pulse" style={{width: `${credentialStats.totalCredentials > 0 ? (credentialStats.assignedCredentials / credentialStats.totalCredentials) * 100 : 0}%`}}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Breakdown */}
        {credentialStats.planBreakdown.length > 0 && (
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-400" />
                Paket Bazlı Dağılım
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {credentialStats.planBreakdown.map((breakdown) => (
                  <div key={breakdown.planId} className="glass-card border-border/30 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-white text-sm">{breakdown.planTitle}</h4>
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                          <ShipIcon className="h-3 w-3" />
                          {breakdown.shipName}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">{breakdown.total}</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">Uygun: {breakdown.available}</span>
                      <span className="text-red-400">Atanmış: {breakdown.assigned}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Kullanıcı adı, paket veya gemi ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                    data-testid="search-credentials-input"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="available">Uygun</SelectItem>
                    <SelectItem value="assigned">Atanmış</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Paket Filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Paketler</SelectItem>
                    {plans?.map((plan: Plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {selectedCredentials.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                <span className="text-gray-300 text-sm">
                  {selectedCredentials.length} kimlik seçildi
                </span>
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="sm"
                  data-testid="bulk-delete-button"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Seçilileri Sil
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credentials Table */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              Kimlik Bilgisi Listesi ({filteredCredentials.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {credentialsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Kimlik bilgileri yükleniyor...</p>
              </div>
            ) : filteredCredentials.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400">
                  {searchQuery || statusFilter !== 'all' || planFilter !== 'all' 
                    ? 'Filtrelere uygun kimlik bilgisi bulunamadı.' 
                    : 'Henüz kimlik bilgisi bulunmuyor.'}
                </p>
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  İlk Kimliği Ekle
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedCredentials.length === filteredCredentials.length}
                          onCheckedChange={handleSelectAll}
                          data-testid="select-all-checkbox"
                        />
                      </TableHead>
                      <TableHead className="text-gray-300">Kullanıcı Adı</TableHead>
                      <TableHead className="text-gray-300">Şifre</TableHead>
                      <TableHead className="text-gray-300">Paket</TableHead>
                      <TableHead className="text-gray-300">Gemi</TableHead>
                      <TableHead className="text-gray-300">Durum</TableHead>
                      <TableHead className="text-gray-300">Oluşturulma</TableHead>
                      <TableHead className="text-gray-300 text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCredentials.map((credential: CredentialWithDetails) => (
                      <TableRow key={credential.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedCredentials.includes(credential.id)}
                            onCheckedChange={(checked) => handleSelectCredential(credential.id, checked as boolean)}
                            data-testid={`select-credential-${credential.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-cyan-400">
                          {credential.username}
                        </TableCell>
                        <TableCell className="font-mono">
                          {showPasswords ? (
                            <span className="text-yellow-400">{credential.password}</span>
                          ) : (
                            <span className="text-gray-500">••••••••</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-400" />
                            <span className="text-white">{credential.plan?.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShipIcon className="h-4 w-4 text-green-400" />
                            <span className="text-white">{credential.ship?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(credential.isAssigned)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatDate(credential.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingCredential(credential);
                                setFormData({
                                  planId: credential.planId,
                                  username: credential.username,
                                  password: credential.password
                                });
                                setShowEditDialog(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Düzenle
                              </DropdownMenuItem>
                              {credential.isAssigned && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCredentialForAssignment(credential);
                                  setShowAssignmentDialog(true);
                                }}>
                                  <User className="mr-2 h-4 w-4" />
                                  Atama Detayları
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteCredentials([credential])}
                                className="text-red-400 hover:text-red-300"
                                disabled={credential.isAssigned}
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

        {/* Add Credential Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Kimlik Bilgisi Ekle</DialogTitle>
              <DialogDescription className="text-slate-400">
                Belirtilen paket için yeni bir kimlik bilgisi oluşturun.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Paket Seç *</Label>
                <Select value={formData.planId} onValueChange={(value) => setFormData(prev => ({ ...prev, planId: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Paket seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map((plan: Plan) => {
                      const ship = ships?.find((s: Ship) => s.id === plan.shipId);
                      return (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {plan.name}
                            <span className="text-gray-400 text-sm">({ship?.name})</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Kullanıcı Adı *</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Kullanıcı adını girin..."
                  data-testid="username-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Şifre *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Şifreyi girin..."
                  data-testid="password-input"
                />
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
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="submit-credential-button"
                >
                  {createMutation.isPending && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  )}
                  Oluştur
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Import Credentials Dialog */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Kimlik Bilgilerini Toplu İçe Aktar</DialogTitle>
              <DialogDescription className="text-slate-400">
                Her satıra bir kimlik bilgisi gelecek şekilde "kullanıcıadı,şifre" formatında girin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Hedef Paket *</Label>
                <Select value={selectedPlanForImport} onValueChange={setSelectedPlanForImport}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Kimlik bilgilerinin ekleneceği paketi seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map((plan: Plan) => {
                      const ship = ships?.find((s: Ship) => s.id === plan.shipId);
                      return (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {plan.name}
                            <span className="text-gray-400 text-sm">({ship?.name})</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Kimlik Bilgileri *</Label>
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`user1,pass123\nuser2,pass456\nuser3,pass789`}
                  className="bg-slate-700 border-slate-600 text-white h-40 font-mono"
                  data-testid="import-credentials-textarea"
                />
                <p className="text-xs text-gray-400">
                  Format: Her satırda "kullanıcıadı,şifre" şeklinde yazın.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsImportOpen(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="import-submit-button"
                >
                  {importMutation.isPending && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  )}
                  İçe Aktar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Credential Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Kimlik Bilgisini Düzenle</DialogTitle>
              <DialogDescription className="text-slate-400">
                Mevcut kimlik bilgisinin kullanıcı adı, şifresi ve paket atamasini düzenleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-plan" className="text-slate-300">Paket</Label>
                <Select
                  value={formData.planId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, planId: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Paket seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map((plan: Plan) => {
                      const ship = ships?.find((s: Ship) => s.id === plan.shipId);
                      return (
                        <SelectItem key={plan.id} value={plan.id}>
                          {ship?.name} - {plan.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-username" className="text-slate-300">Kullanıcı Adı</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Kullanıcı adı girin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password" className="text-slate-300">Şifre</Label>
                <Input
                  id="edit-password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Şifre girin"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingCredential(null);
                  resetForm();
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                İptal
              </Button>
              <Button
                onClick={() => {
                  if (editingCredential && formData.username && formData.password && formData.planId) {
                    editMutation.mutate({
                      id: editingCredential.id,
                      username: formData.username,
                      password: formData.password,
                      planId: formData.planId
                    });
                  }
                }}
                disabled={editMutation.isPending || !formData.username || !formData.password || !formData.planId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editMutation.isPending && (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                )}
                Güncelle
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assignment Details Dialog */}
        <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Atama Detayları</DialogTitle>
              <DialogDescription className="text-slate-400">
                Bu kimlik bilgisinin atama durumu ve detayları.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedCredentialForAssignment && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-400 text-sm">Kullanıcı Adı</Label>
                      <p className="text-white font-medium">{selectedCredentialForAssignment.username}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Durum</Label>
                      <p className="text-white">
                        {selectedCredentialForAssignment.isAssigned ? (
                          <Badge className="bg-red-600/20 text-red-300 border-red-500/50">
                            Atanmış
                          </Badge>
                        ) : (
                          <Badge className="bg-green-600/20 text-green-300 border-green-500/50">
                            Kullanılabilir
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-slate-400 text-sm">Paket</Label>
                    <p className="text-white">
                      {selectedCredentialForAssignment.plan?.name} 
                      <span className="text-slate-400">({selectedCredentialForAssignment.ship?.name})</span>
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-slate-400 text-sm">Oluşturulma Tarihi</Label>
                    <p className="text-white">{formatDate(selectedCredentialForAssignment.createdAt)}</p>
                  </div>
                  
                  {selectedCredentialForAssignment.isAssigned && (
                    <>
                      <Separator className="bg-slate-600" />
                      <div>
                        <Label className="text-slate-400 text-sm">Atandığı Kullanıcı</Label>
                        <p className="text-white">
                          {selectedCredentialForAssignment.assignedToUserId || "Bilinmiyor"}
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-slate-400 text-sm">Atandığı Sipariş</Label>
                        <p className="text-white">
                          {selectedCredentialForAssignment.assignedToOrderId || "Bilinmiyor"}
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => {
                  setShowAssignmentDialog(false);
                  setSelectedCredentialForAssignment(null);
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white"
              >
                Kapat
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteCredentials.length > 0} onOpenChange={() => setDeleteCredentials([])}>
          <AlertDialogContent className="bg-slate-800 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Kimlik Bilgilerini Sil</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                {deleteCredentials.length === 1 
                  ? `"${deleteCredentials[0]?.username}" kimlik bilgisini silmek istediğinizden emin misiniz?`
                  : `${deleteCredentials.length} kimlik bilgisini silmek istediğinizden emin misiniz?`
                }
                Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deleteCredentials.map(c => c.id))}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="confirm-delete-credentials-button"
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