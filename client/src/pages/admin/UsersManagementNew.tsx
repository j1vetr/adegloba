import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { 
  Users, Search, MoreHorizontal, Edit, Trash2, Eye, 
  UserCheck, UserX, Ship as ShipIcon, Mail, Calendar, DollarSign, Package, ShoppingCart, TrendingUp, History, ArrowLeft, Plus 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import type { User, Ship, Order, OrderItem, Plan } from '../../../shared/schema';

interface UserWithDetails extends User {
  ship: Ship;
  orderStats: {
    totalOrders: number;
    totalAmountPaid: number;
    lastOrderDate: string | null;
  };
}

interface OrderWithDetails extends Order {
  orderItems: OrderItem[];
  ship: Ship;
  totalAmount: number;
}

interface UserDetailsProps {
  user: UserWithDetails;
  onBack: () => void;
}

function UserDetails({ user, onBack }: UserDetailsProps) {
  const { data: userOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/admin/users", user.id, "orders"],
  });

  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: tr });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-600', text: 'Bekliyor' },
      'paid': { color: 'bg-green-600', text: 'Ödendi' },
      'expired': { color: 'bg-red-600', text: 'Süresi Doldu' },
      'cancelled': { color: 'bg-gray-600', text: 'İptal' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Kullanıcı Detayları</h1>
          <p className="text-gray-400 mt-1">
            {user.full_name || user.username} için ayrıntılı bilgiler
          </p>
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* User Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-white">{user.orderStats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Toplam Ödeme</p>
                <p className="text-2xl font-bold text-white">{formatPrice(user.orderStats.totalAmountPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <ShipIcon className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Gemi</p>
                <p className="text-lg font-semibold text-white">{user.ship?.name || 'Atanmamış'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-600/20 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Son Sipariş</p>
                <p className="text-sm font-medium text-white">
                  {user.orderStats.lastOrderDate ? formatDate(user.orderStats.lastOrderDate) : 'Hiç sipariş yok'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Profile Information */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-400" />
            Profil Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm">Ad Soyad</Label>
                <p className="text-white font-medium">{user.full_name || 'Belirtilmemiş'}</p>
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Kullanıcı Adı</Label>
                <p className="text-white font-medium">{user.username}</p>
              </div>
              <div>
                <Label className="text-gray-300 text-sm">E-posta</Label>
                <p className="text-white font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {user.email}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm">Kayıt Tarihi</Label>
                <p className="text-white font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(user.created_at)}
                </p>
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Atanmış Gemi</Label>
                <p className="text-white font-medium flex items-center gap-2">
                  <ShipIcon className="h-4 w-4 text-gray-400" />
                  {user.ship?.name || 'Atanmamış'}
                </p>
              </div>
              {user.address && (
                <div>
                  <Label className="text-gray-300 text-sm">Adres</Label>
                  <p className="text-white font-medium">{user.address}</p>
                </div>
              )}
              <div className="pt-2">
                <ManualPackageAssignmentButton userId={user.id} username={user.username} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order History */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <History className="h-5 w-5 text-blue-400" />
            Sipariş Geçmişi ({user.orderStats.totalOrders})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">Siparişler yükleniyor...</p>
            </div>
          ) : !userOrders?.length ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <p className="text-gray-400">Henüz sipariş bulunmuyor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead className="text-gray-300">Sipariş ID</TableHead>
                    <TableHead className="text-gray-300">Gemi</TableHead>
                    <TableHead className="text-gray-300">Paketler</TableHead>
                    <TableHead className="text-gray-300">Toplam Tutar</TableHead>
                    <TableHead className="text-gray-300">Durum</TableHead>
                    <TableHead className="text-gray-300">Tarih</TableHead>
                    <TableHead className="text-gray-300">Son Ödeme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userOrders.map((order: OrderWithDetails) => (
                    <TableRow key={order.id} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell className="font-mono text-cyan-400">
                        #{order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShipIcon className="h-4 w-4 text-blue-400" />
                          <span className="text-white">{order.ship?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {order.orderItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Package className="h-3 w-3 text-green-400" />
                              <span className="text-white">{item.quantity}x</span>
                              <span className="text-gray-300">{item.planTitle}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-green-400 font-semibold">
                          {formatPrice(order.totalAmount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {order.paidAt ? formatDate(order.paidAt) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersManagementNew() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users with order statistics
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users-with-stats"],
  });

  // Filter users
  const filteredUsers = users?.filter((user: UserWithDetails) => {
    const matchesSearch = !searchQuery || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.ship?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) || [];

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-stats"] });
      setDeleteUser(null);
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla silindi.",
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

  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: tr });
  };

  if (selectedUser) {
    return (
      <AdminLayout>
        <UserDetails user={selectedUser} onBack={() => setSelectedUser(null)} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Kullanıcı Yönetimi</h1>
            <p className="text-gray-400 mt-1">
              Sistem kullanıcıları ve sipariş geçmişleri
            </p>
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Search and Filters */}
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Kullanıcı adı, e-posta, ad soyad veya gemi ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                    data-testid="search-users-input"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Kullanıcı Listesi ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Kullanıcılar yükleniyor...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400">
                  {searchQuery 
                    ? 'Filtrelere uygun kullanıcı bulunamadı.' 
                    : 'Henüz kullanıcı bulunmuyor.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Kullanıcı</TableHead>
                      <TableHead className="text-gray-300">Gemi</TableHead>
                      <TableHead className="text-gray-300">Toplam Sipariş</TableHead>
                      <TableHead className="text-gray-300">Toplam Ödeme</TableHead>
                      <TableHead className="text-gray-300">Son Sipariş</TableHead>
                      <TableHead className="text-gray-300">Kayıt Tarihi</TableHead>
                      <TableHead className="text-gray-300 text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: UserWithDetails) => (
                      <TableRow key={user.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-blue-400" />
                              <span className="text-white font-medium">{user.full_name || user.username}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400 text-sm">{user.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.ship ? (
                            <div className="flex items-center gap-2">
                              <ShipIcon className="h-4 w-4 text-green-400" />
                              <span className="text-white">{user.ship.name}</span>
                            </div>
                          ) : (
                            <Badge className="bg-gray-600 text-white">Atanmamış</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-blue-400" />
                            <span className="text-white font-semibold">{user.orderStats.totalOrders}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 font-semibold">
                              {formatPrice(user.orderStats.totalAmountPaid)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {user.orderStats.lastOrderDate ? formatDate(user.orderStats.lastOrderDate) : '-'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Detayları Görüntüle
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteUser(user)}
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
          <AlertDialogContent className="bg-slate-800 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Kullanıcıyı Sil</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                "{deleteUser?.full_name || deleteUser?.username}" kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm sipariş geçmişi de silinecektir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="confirm-delete-user-button"
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

// Manuel Paket Atama Bileşeni
interface ManualPackageAssignmentButtonProps {
  userId: string;
  username: string;
}

function ManualPackageAssignmentButton({ userId, username }: ManualPackageAssignmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [validityDays, setValidityDays] = useState<string>("30");
  const [note, setNote] = useState<string>("");
  const { toast } = useToast();

  // Tüm paketleri getir
  const { data: allPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["/api/plans"],
    enabled: isOpen,
  });

  // Manuel paket atama mutation
  const assignPackageMutation = useMutation({
    mutationFn: async (data: { planId: string; validityDays: number; note?: string }) => {
      return apiRequest(`/api/admin/users/${userId}/assign-package`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: `${username} kullanıcısına paket başarıyla atandı.`,
        variant: "default",
      });
      setIsOpen(false);
      setSelectedPlanId("");
      setValidityDays("30");
      setNote("");
      // Kullanıcı siparişlerini yenile
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Paket ataması sırasında bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  const handleAssign = () => {
    if (!selectedPlanId) {
      toast({
        title: "Hata",
        description: "Lütfen bir paket seçin.",
        variant: "destructive",
      });
      return;
    }

    const days = parseInt(validityDays);
    if (days < 1 || days > 365) {
      toast({
        title: "Hata", 
        description: "Geçerlilik süresi 1-365 gün arasında olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    assignPackageMutation.mutate({
      planId: selectedPlanId,
      validityDays: days,
      note: note || undefined
    });
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        size="sm"
        data-testid="manual-package-assignment-button"
      >
        <Plus className="h-4 w-4 mr-2" />
        Manuel Paket Ekle
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Manuel Paket Atama</DialogTitle>
            <DialogDescription className="text-slate-400">
              {username} kullanıcısına manuel olarak paket atayın.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Paket Seçimi */}
            <div className="space-y-2">
              <Label className="text-gray-300">Paket Seçin</Label>
              <Select 
                value={selectedPlanId} 
                onValueChange={setSelectedPlanId}
                disabled={plansLoading || assignPackageMutation.isPending}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Bir paket seçin..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {allPlans.map((plan: Plan) => (
                    <SelectItem key={plan.id} value={plan.id} className="text-white hover:bg-slate-600">
                      {plan.name} - ${plan.priceUsd}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Geçerlilik Süresi */}
            <div className="space-y-2">
              <Label className="text-gray-300">Geçerlilik Süresi (Gün)</Label>
              <Select value={validityDays} onValueChange={setValidityDays}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="7" className="text-white hover:bg-slate-600">7 Gün</SelectItem>
                  <SelectItem value="15" className="text-white hover:bg-slate-600">15 Gün</SelectItem>
                  <SelectItem value="30" className="text-white hover:bg-slate-600">30 Gün</SelectItem>
                  <SelectItem value="60" className="text-white hover:bg-slate-600">60 Gün</SelectItem>
                  <SelectItem value="90" className="text-white hover:bg-slate-600">90 Gün</SelectItem>
                  <SelectItem value="365" className="text-white hover:bg-slate-600">365 Gün</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Not */}
            <div className="space-y-2">
              <Label className="text-gray-300">Not (Opsiyonel)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Bu atama hakkında not ekleyin..."
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 resize-none"
                rows={3}
                disabled={assignPackageMutation.isPending}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={assignPackageMutation.isPending}
            >
              İptal
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignPackageMutation.isPending || !selectedPlanId}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="confirm-assign-package-button"
            >
              {assignPackageMutation.isPending && (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              )}
              Paketi Ata
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}