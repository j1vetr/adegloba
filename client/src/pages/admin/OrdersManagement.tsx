import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function OrdersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/admin/orders"]
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/admin/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-neon-green/20 text-neon-green border-transparent">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-transparent">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-500 border-transparent">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-500/20 text-blue-500 border-transparent">Refunded</Badge>;
      case 'expired':
        return <Badge className="bg-slate-500/20 text-slate-400 border-transparent">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredOrders = orders?.filter((order: any) => 
    filterStatus === 'all' || order.status === filterStatus
  ) || [];

  if (isLoading) {
    return <div className="text-center">Loading orders...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Orders Management</h3>
        <div className="flex space-x-2">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg glassmorphism border border-slate-600 text-white text-sm bg-transparent"
            data-testid="filter-status-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <Card className="glassmorphism rounded-xl border-transparent overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Order ID</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Ship</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Plan</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-slate-700/50" data-testid={`order-row-${order.id}`}>
                    <td className="py-4 px-4">
                      <span className="font-mono text-neon-cyan text-sm" data-testid={`order-id-${order.id}`}>
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-white" data-testid={`order-customer-${order.id}`}>
                        {order.user?.firstName || 'N/A'} {order.user?.lastName || ''}
                      </div>
                      <div className="text-sm text-slate-400">{order.user?.email}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-300" data-testid={`order-ship-${order.id}`}>
                      {order.items?.[0]?.ship?.name || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-slate-300" data-testid={`order-plan-${order.id}`}>
                      {order.items?.[0]?.plan?.title || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-white font-semibold" data-testid={`order-amount-${order.id}`}>
                      ${Number(order.totalUsd).toFixed(2)}
                    </td>
                    <td className="py-4 px-4" data-testid={`order-status-${order.id}`}>
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-4 px-4 text-slate-400" data-testid={`order-date-${order.id}`}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'paid' })}
                            className="bg-neon-green/20 text-neon-green hover:bg-neon-green/30 border-transparent"
                            disabled={updateOrderStatusMutation.isPending}
                            data-testid={`mark-paid-${order.id}`}
                          >
                            <i className="fas fa-check mr-1"></i>Mark Paid
                          </Button>
                        )}
                        {order.status === 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'refunded' })}
                            className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 border-transparent"
                            disabled={updateOrderStatusMutation.isPending}
                            data-testid={`refund-${order.id}`}
                          >
                            <i className="fas fa-undo mr-1"></i>Refund
                          </Button>
                        )}
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: 'failed' })}
                            className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border-transparent"
                            disabled={updateOrderStatusMutation.isPending}
                            data-testid={`mark-failed-${order.id}`}
                          >
                            <i className="fas fa-times mr-1"></i>Mark Failed
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-12" data-testid="no-orders">
          <i className="fas fa-shopping-bag text-6xl text-slate-500 mb-4"></i>
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No orders found</h3>
          <p className="text-slate-500">
            {filterStatus === 'all' ? 'No orders have been placed yet.' : `No ${filterStatus} orders found.`}
          </p>
        </div>
      )}
    </div>
  );
}
