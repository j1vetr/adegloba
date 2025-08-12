import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ShoppingCart,
  Eye,
  Loader2,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Ship
} from "lucide-react";

type Order = {
  id: string;
  userId: string;
  totalUsd: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string | null;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  items?: Array<{
    id: string;
    planTitle: string;
    gbAmount: number;
    priceUsd: number;
  }>;
};

export default function OrdersManagement() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PUT", `/api/admin/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Başarılı",
        description: "Sipariş durumu güncellendi.",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return "bg-green-600 text-white";
      case 'pending': return "bg-yellow-600 text-white";
      case 'expired': return "bg-red-600 text-white";
      case 'cancelled': return "bg-gray-600 text-white";
      default: return "bg-blue-600 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'pending': return <Clock className="h-3 w-3 mr-1" />;
      case 'expired': return <XCircle className="h-3 w-3 mr-1" />;
      case 'cancelled': return <XCircle className="h-3 w-3 mr-1" />;
      default: return <AlertCircle className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return "Ödendi";
      case 'pending': return "Bekliyor";
      case 'expired': return "Süresi Doldu";
      case 'cancelled': return "İptal Edildi";
      default: return status;
    }
  };

  const filteredOrders = orders?.filter((order: Order) => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  }) || [];

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  return (
    <AdminLayout title="Siparişler">
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Durum filtresi" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all">Tüm Siparişler</SelectItem>
              <SelectItem value="pending">Bekleyen</SelectItem>
              <SelectItem value="paid">Ödenen</SelectItem>
              <SelectItem value="expired">Süresi Dolan</SelectItem>
              <SelectItem value="cancelled">İptal Edilen</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-sm text-slate-400">
            {filteredOrders.length} sipariş gösteriliyor
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order: Order) => (
              <Card key={order.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-blue-400" />
                        <div>
                          <div className="font-medium text-white">#{order.id.slice(0, 8)}</div>
                          <div className="text-sm text-slate-400">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>

                      {order.user && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="text-sm font-medium text-white">{order.user.username}</div>
                            <div className="text-xs text-slate-400">{order.user.email}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-lg font-bold text-green-400">
                        <DollarSign className="h-4 w-4" />
                        {formatPrice(order.totalUsd)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </Badge>

                      {order.expiresAt && order.status === 'pending' && (
                        <div className="text-xs text-slate-400">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Bitiş: {formatDate(order.expiresAt)}
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                        data-testid={`view-order-${order.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detay
                      </Button>

                      {order.status === 'pending' && (
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-32 h-8 bg-slate-700 border-slate-600 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="pending">Bekliyor</SelectItem>
                            <SelectItem value="paid">Ödendi</SelectItem>
                            <SelectItem value="cancelled">İptal Et</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {statusFilter === "all" ? "Henüz Sipariş Yok" : "Bu Durumda Sipariş Yok"}
              </h3>
              <p className="text-slate-400">
                {statusFilter === "all" 
                  ? "Henüz hiç sipariş oluşturulmamış."
                  : `${getStatusText(statusFilter)} durumunda sipariş bulunmuyor.`
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                Sipariş Detayları - #{selectedOrder?.id.slice(0, 8)}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Sipariş bilgileri ve içeriği
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-400">Sipariş ID</div>
                    <div className="font-mono text-white">{selectedOrder.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Durum</div>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {getStatusIcon(selectedOrder.status)}
                      {getStatusText(selectedOrder.status)}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Oluşturulma</div>
                    <div className="text-white">{formatDate(selectedOrder.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Toplam Tutar</div>
                    <div className="text-lg font-bold text-green-400">{formatPrice(selectedOrder.totalUsd)}</div>
                  </div>
                  {selectedOrder.expiresAt && (
                    <>
                      <div>
                        <div className="text-sm text-slate-400">Bitiş Tarihi</div>
                        <div className="text-white">{formatDate(selectedOrder.expiresAt)}</div>
                      </div>
                    </>
                  )}
                </div>

                {/* User Info */}
                {selectedOrder.user && (
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Kullanıcı Bilgileri
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400">Kullanıcı Adı</div>
                        <div className="text-white">{selectedOrder.user.username}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">E-posta</div>
                        <div className="text-white">{selectedOrder.user.email}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Sipariş İçeriği
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Ship className="h-5 w-5 text-blue-400" />
                            <div>
                              <div className="font-medium text-white">{item.planTitle}</div>
                              <div className="text-sm text-slate-400">{item.gbAmount} GB veri paketi</div>
                            </div>
                          </div>
                          <div className="text-lg font-bold text-green-400">
                            {formatPrice(item.priceUsd)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}