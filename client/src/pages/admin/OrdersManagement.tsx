import { useState, useEffect } from 'react';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AdminLayout from '@/components/AdminLayout';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Search, ShoppingCart, User, Ship as ShipIcon, Package, 
  Edit, Trash2, MoreHorizontal, Eye, Check, X, Clock, DollarSign,
  CheckCircle, AlertCircle, TrendingUp, Users, Calendar, ChevronsUpDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Ship, Plan, User as UserType, Order } from '@shared/schema';

interface OrderFormData {
  userId: string;
  shipId: string;
  planId: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';
  subtotalUsd: string;
  discountUsd: string;
  totalUsd: string;
  couponId?: string;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

interface UserWithShip extends UserType {
  ship: Ship | null;
}

interface OrderWithDetails extends Order {
  user: UserType;
  ship: Ship;
  orderItems: Array<{
    id: string;
    planId: string;
    plan: Plan;
  }>;
}

export default function OrdersManagement() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderWithDetails | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<OrderWithDetails | null>(null);
  const [viewingOrder, setViewingOrder] = useState<OrderWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithShip | null>(null);
  const [selectedShip, setSelectedShip] = useState<string>('');
  
  const [formData, setFormData] = useState<OrderFormData>({
    userId: '',
    shipId: '',
    planId: '',
    status: 'pending',
    subtotalUsd: '0.00',
    discountUsd: '0.00',
    totalUsd: '0.00',
  });

  // Fetch orders data
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
  });

  // Fetch users for customer selection
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
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

  // Calculate order statistics from database values
  const orderStats: OrderStats = {
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter((o: OrderWithDetails) => o.status === 'pending').length || 0,
    // Count both 'paid' and 'completed' as paid for backwards compatibility
    paidOrders: orders?.filter((o: OrderWithDetails) => o.status === 'paid' || o.status === 'completed').length || 0,
    failedOrders: orders?.filter((o: OrderWithDetails) => o.status === 'failed').length || 0,
    cancelledOrders: orders?.filter((o: OrderWithDetails) => o.status === 'cancelled').length || 0,
    // Total Revenue: sum of totalUsd from paid/completed orders only
    totalRevenue: orders?.filter((o: OrderWithDetails) => o.status === 'paid' || o.status === 'completed')
      .reduce((sum: number, order: OrderWithDetails) => {
        const amount = parseFloat(order.totalUsd || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0) || 0,
    // Monthly Revenue: current month's paid/completed orders only
    monthlyRevenue: orders?.filter((o: OrderWithDetails) => {
      if (!o.createdAt || (o.status !== 'paid' && o.status !== 'completed')) return false;
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    }).reduce((sum: number, order: OrderWithDetails) => {
      const amount = parseFloat(order.totalUsd || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0) || 0,
  };

  // Filter orders based on search and status
  const filteredOrders = orders?.filter((order: OrderWithDetails) => {
    const matchesSearch = !searchQuery || 
      order.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.ship?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Create order mutation
  const createMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      return await apiRequest("POST", "/api/admin/orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setIsFormOpen(false);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Sipariş başarıyla oluşturuldu.",
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

  // Update order mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrderFormData> }) => {
      return await apiRequest("PUT", `/api/admin/orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setIsFormOpen(false);
      setEditingOrder(null);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Sipariş başarıyla güncellendi.",
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

  // Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setDeleteOrder(null);
      toast({
        title: "Başarılı",
        description: "Sipariş başarıyla silindi.",
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
      userId: '',
      shipId: '',
      planId: '',
      status: 'pending',
      subtotalUsd: '0.00',
      discountUsd: '0.00',
      totalUsd: '0.00',
    });
    setSelectedUser(null);
    setSelectedShip('');
  };

  const handleEdit = (order: OrderWithDetails) => {
    setEditingOrder(order);
    setSelectedUser({ ...order.user, ship: order.ship });
    setSelectedShip(order.shipId);
    setFormData({
      userId: order.userId,
      shipId: order.shipId,
      planId: order.orderItems?.[0]?.planId || '',
      status: order.status as any,
      subtotalUsd: order.subtotalUsd,
      discountUsd: order.discountUsd,
      totalUsd: order.totalUsd,
      couponId: order.couponId || undefined,
    });
    setIsFormOpen(true);
  };

  const handleUserSelect = (user: UserWithShip) => {
    setSelectedUser(user);
    setFormData(prev => ({ 
      ...prev, 
      userId: user.id,
      shipId: user.ship?.id || '',
    }));
    if (user.ship?.id) {
      setSelectedShip(user.ship.id);
    }
    setUserSearchOpen(false);
  };

  const handleShipChange = (shipId: string) => {
    setSelectedShip(shipId);
    setFormData(prev => ({ 
      ...prev, 
      shipId,
      planId: '', // Reset plan when ship changes
    }));
  };

  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans?.find((p: Plan) => p.id === planId);
    if (selectedPlan) {
      const subtotal = parseFloat(selectedPlan.priceUsd);
      const discount = parseFloat(formData.discountUsd) || 0;
      const total = subtotal - discount;
      
      setFormData(prev => ({
        ...prev,
        planId,
        subtotalUsd: selectedPlan.priceUsd,
        totalUsd: total.toFixed(2),
      }));
    }
  };

  const handleDiscountChange = (discount: string) => {
    const discountValue = parseFloat(discount) || 0;
    const subtotal = parseFloat(formData.subtotalUsd) || 0;
    const total = Math.max(0, subtotal - discountValue);
    
    setFormData(prev => ({
      ...prev,
      discountUsd: discount,
      totalUsd: total.toFixed(2),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.shipId || !formData.planId) {
      toast({
        title: "Hata",
        description: "Lütfen tüm gerekli alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string) => {
    const getStaticBadge = (color: string, bgColor: string, label: string, icon: string) => (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 ${bgColor} rounded-full`}></div>
        <Badge className={`${bgColor}/20 ${color} border-${color.replace('text-', '')}/50 hover:${bgColor}/30 hover:border-${color.replace('text-', '')}/70 transition-colors duration-200`}>
          {icon} {label}
        </Badge>
      </div>
    );

    switch (status) {
      case 'pending':
        return getStaticBadge('text-yellow-300', 'bg-yellow-500', 'Bekliyor', '⏳');
      case 'paid':
      case 'completed': // Handle both statuses for backwards compatibility
        return getStaticBadge('text-green-300', 'bg-green-500', 'Ödendi', '✅');
      case 'failed':
        return getStaticBadge('text-red-300', 'bg-red-500', 'Başarısız', '❌');
      case 'cancelled':
        return getStaticBadge('text-gray-300', 'bg-gray-500', 'İptal Edildi', '🚫');
      case 'refunded':
        return getStaticBadge('text-purple-300', 'bg-purple-500', 'İade Edildi', '↩️');
      case 'expired':
        return getStaticBadge('text-slate-300', 'bg-slate-500', 'Süresi Doldu', '⏰');
      default:
        return getStaticBadge('text-yellow-300', 'bg-yellow-500', 'Bekliyor', '⏳');
    }
  };

  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: tr });
  };

  return (
    <AdminLayout title="Sipariş Yönetimi">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Sipariş Yönetimi</h1>
            <p className="text-gray-400 mt-1">
              Müşteri sipariş atama sistemi ve sipariş durumu yönetimi
            </p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white neon-glow"
            data-testid="add-order-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Sipariş Ekle
          </Button>
        </div>

        <Separator className="bg-gray-700" />

        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Ödenen Siparişler</p>
                  <p className="text-2xl font-bold text-white">{orderStats.paidOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Bekleyen Siparişler</p>
                  <p className="text-2xl font-bold text-white">{orderStats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-600/20 rounded-lg">
                  <X className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">İptal Edilen Siparişler</p>
                  <p className="text-2xl font-bold text-white">{orderStats.cancelledOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-white">{formatPrice(orderStats.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-600/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Aylık Gelir</p>
                  <p className="text-2xl font-bold text-white">{formatPrice(orderStats.monthlyRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Müşteri, email, gemi veya sipariş ID ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                    data-testid="search-orders-input"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Durum filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="pending">Bekleyen</SelectItem>
                    <SelectItem value="paid">Ödenen</SelectItem>
                    <SelectItem value="failed">Başarısız</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                    <SelectItem value="refunded">İade Edildi</SelectItem>
                    <SelectItem value="expired">Süresi Doldu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-400" />
              Sipariş Listesi ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Siparişler yükleniyor...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400">
                  {searchQuery || statusFilter !== 'all' ? 'Filtrelere uygun sipariş bulunamadı.' : 'Henüz sipariş bulunmuyor.'}
                </p>
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  İlk Siparişi Ekle
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Sipariş ID</TableHead>
                      <TableHead className="text-gray-300">Müşteri</TableHead>
                      <TableHead className="text-gray-300">Gemi</TableHead>
                      <TableHead className="text-gray-300">Paket</TableHead>
                      <TableHead className="text-gray-300">Durum</TableHead>
                      <TableHead className="text-gray-300">Tutar</TableHead>
                      <TableHead className="text-gray-300">Tarih</TableHead>
                      <TableHead className="text-gray-300 text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order: OrderWithDetails) => (
                      <TableRow key={order.id} className="border-gray-700 hover:bg-gray-800/50 transition-colors duration-200">
                        <TableCell className="font-mono text-sm text-cyan-400">
                          {order.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{order.user?.full_name || order.user?.username}</span>
                            <span className="text-gray-400 text-sm">{order.user?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShipIcon className="h-4 w-4 text-blue-400" />
                            <span className="text-white">{order.ship?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-green-400" />
                            <span className="text-white">{order.orderItems?.[0]?.plan?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-green-400 font-semibold">{formatPrice(order.totalUsd)}</span>
                            {parseFloat(order.discountUsd) > 0 && (
                              <span className="text-gray-400 text-sm">
                                -{formatPrice(order.discountUsd)} indirim
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(order)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setViewingOrder(order)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Detayları Görüntüle
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteOrder(order)}
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

        {/* Add/Edit Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingOrder ? "Sipariş Düzenle" : "Yeni Sipariş Ekle"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingOrder ? "Mevcut sipariş bilgilerini güncelleyin." : "Müşteri için yeni bir sipariş oluşturun."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Müşteri Seç *</Label>
                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userSearchOpen}
                      className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      data-testid="customer-select"
                    >
                      {selectedUser ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{selectedUser.full_name || selectedUser.username}</span>
                          <span className="text-gray-400">({selectedUser.email})</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Müşteri seçin...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Müşteri ara..." />
                      <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {users?.map((user: UserWithShip) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.username} ${user.email} ${user.full_name || ''}`}
                            onSelect={() => handleUserSelect(user)}
                            className="flex items-center gap-2"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <User className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span>{user.full_name || user.username}</span>
                              <span className="text-sm text-gray-400">{user.email}</span>
                              {user.ship && (
                                <span className="text-xs text-blue-400">{user.ship.name}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Ship Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Gemi Seç *</Label>
                <Select value={selectedShip} onValueChange={handleShipChange}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Gemi seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ships?.map((ship: Ship) => (
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
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plan Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Paket Seç *</Label>
                <Select 
                  value={formData.planId} 
                  onValueChange={handlePlanChange}
                  disabled={!selectedShip || plansLoading}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder={selectedShip ? "Paket seçin..." : "Önce gemi seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map((plan: Plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {plan.title}
                          </div>
                          <div className="text-green-400 font-semibold ml-4">
                            {formatPrice(plan.priceUsd)}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Ara Toplam (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.subtotalUsd}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtotalUsd: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    readOnly
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">İndirim (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discountUsd}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="discount-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Toplam (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalUsd}
                    className="bg-slate-700 border-slate-600 text-white font-bold text-green-400"
                    readOnly
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-slate-300">Sipariş Durumu</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Bekliyor</SelectItem>
                    <SelectItem value="paid">Ödendi</SelectItem>
                    <SelectItem value="failed">Başarısız</SelectItem>
                    <SelectItem value="refunded">İade Edildi</SelectItem>
                    <SelectItem value="expired">Süresi Doldu</SelectItem>
                  </SelectContent>
                </Select>
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
                  data-testid="order-submit-button"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : null}
                  {editingOrder ? "Güncelle" : "Oluştur"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteOrder} onOpenChange={() => setDeleteOrder(null)}>
          <AlertDialogContent className="bg-slate-800 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Siparişi Sil</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Sipariş ID: {deleteOrder?.id.slice(0, 8)}... - Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteOrder && deleteMutation.mutate(deleteOrder.id)}
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

        {/* View Details Modal */}
        <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
          <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Sipariş Detayları
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Sipariş ID: {viewingOrder?.id} - Detaylı sipariş bilgileri
              </DialogDescription>
            </DialogHeader>
            
            {viewingOrder && (
              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Customer Information */}
                <Card className="glass-card border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-400" />
                      Müşteri Bilgileri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300 text-sm">Ad Soyad</Label>
                        <p className="text-white font-medium">{viewingOrder.user?.full_name || viewingOrder.user?.username || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">E-posta</Label>
                        <p className="text-white font-medium">{viewingOrder.user?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Kullanıcı Adı</Label>
                        <p className="text-white font-medium">{viewingOrder.user?.username || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Adres</Label>
                        <p className="text-white font-medium">{viewingOrder.user?.address || 'Belirtilmemiş'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Information */}
                <Card className="glass-card border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-green-400" />
                      Sipariş Bilgileri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-slate-300 text-sm">Gemi</Label>
                        <div className="flex items-center gap-2">
                          <ShipIcon className="h-4 w-4 text-blue-400" />
                          <p className="text-white font-medium">{viewingOrder.ship?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Paket</Label>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-green-400" />
                          <p className="text-white font-medium">{viewingOrder.orderItems?.[0]?.plan?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Durum</Label>
                        <div className="pt-1">
                          {getStatusBadge(viewingOrder.status)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Oluşturulma Tarihi</Label>
                        <p className="text-white font-medium">{viewingOrder.createdAt ? formatDate(viewingOrder.createdAt) : 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Ödenme Tarihi</Label>
                        <p className="text-white font-medium">{viewingOrder.paidAt ? formatDate(viewingOrder.paidAt) : 'Henüz ödenmedi'}</p>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Son Kullanma Tarihi</Label>
                        <p className="text-white font-medium">{viewingOrder.expiresAt ? formatDate(viewingOrder.expiresAt) : 'Belirlenmedi'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card className="glass-card border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      Ödeme Bilgileri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-slate-300 text-sm">Ara Toplam</Label>
                        <p className="text-white font-bold text-lg">{formatPrice(viewingOrder.subtotalUsd)}</p>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">İndirim</Label>
                        <p className="text-red-400 font-bold text-lg">-{formatPrice(viewingOrder.discountUsd)}</p>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Toplam Tutar</Label>
                        <p className="text-green-400 font-bold text-xl">{formatPrice(viewingOrder.totalUsd)}</p>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Para Birimi</Label>
                        <p className="text-white font-medium">{viewingOrder.currency || 'USD'}</p>
                      </div>
                    </div>
                    {viewingOrder.paypalOrderId && (
                      <div>
                        <Label className="text-slate-300 text-sm">PayPal Sipariş ID</Label>
                        <p className="text-cyan-400 font-mono text-sm">{viewingOrder.paypalOrderId}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setViewingOrder(null)}
                className="bg-slate-600 hover:bg-slate-700 text-white"
              >
                Kapat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}