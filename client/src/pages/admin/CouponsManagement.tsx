import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Coupon } from "@shared/schema";

export default function CouponsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: '',
    maxUses: '',
    startsAt: '',
    endsAt: '',
    shipId: '',
    isActive: true
  });

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"]
  });

  const { data: ships } = useQuery({
    queryKey: ["/api/admin/ships"]
  });

  const createCouponMutation = useMutation({
    mutationFn: async (couponData: any) => {
      const response = await apiRequest('POST', '/api/admin/coupons', couponData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coupon created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setIsCreating(false);
      resetForm();
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
        description: error.message || "Failed to create coupon",
        variant: "destructive",
      });
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, couponData }: { id: string; couponData: any }) => {
      const response = await apiRequest('PUT', `/api/admin/coupons/${id}`, couponData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coupon updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setEditingCoupon(null);
      resetForm();
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
        description: error.message || "Failed to update coupon",
        variant: "destructive",
      });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/coupons/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
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
        description: error.message || "Failed to delete coupon",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percent',
      value: '',
      maxUses: '',
      startsAt: '',
      endsAt: '',
      shipId: '',
      isActive: true
    });
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxUses: coupon.maxUses?.toString() || '',
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : '',
      endsAt: coupon.endsAt ? new Date(coupon.endsAt).toISOString().slice(0, 16) : '',
      shipId: coupon.shipId || '',
      isActive: coupon.isActive
    });
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const couponData = {
      ...formData,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
      endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
      shipId: formData.shipId || null
    };
    
    if (editingCoupon) {
      updateCouponMutation.mutate({ id: editingCoupon.id, couponData });
    } else {
      createCouponMutation.mutate(couponData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      deleteCouponMutation.mutate(id);
    }
  };

  const getUsagePercentage = (coupon: Coupon) => {
    if (!coupon.maxUses) return 0;
    return (coupon.uses / coupon.maxUses) * 100;
  };

  if (isLoading) {
    return <div className="text-center">Loading coupons...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Coupons Management</h3>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-neon-cyan text-white hover:bg-neon-cyan/80"
          data-testid="create-coupon-button"
        >
          <i className="fas fa-plus mr-2"></i>Add Coupon
        </Button>
      </div>

      {isCreating && (
        <Card className="glassmorphism rounded-xl p-6 mb-6 border-transparent" data-testid="coupon-form">
          <h4 className="text-lg font-semibold text-white mb-4">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Coupon Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="glassmorphism border-slate-600 text-white"
                  placeholder="e.g., SAVE20"
                  required
                  data-testid="coupon-code-input"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">Type</Label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glassmorphism border border-slate-600 text-white bg-transparent"
                  data-testid="coupon-type-select"
                >
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">
                  Value {formData.type === 'percent' ? '(%)' : '($)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="glassmorphism border-slate-600 text-white"
                  placeholder={formData.type === 'percent' ? '20' : '50.00'}
                  required
                  data-testid="coupon-value-input"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">Max Uses</Label>
                <Input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="glassmorphism border-slate-600 text-white"
                  placeholder="Leave empty for unlimited"
                  data-testid="coupon-max-uses-input"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Start Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  className="glassmorphism border-slate-600 text-white"
                  data-testid="coupon-start-date-input"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">End Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                  className="glassmorphism border-slate-600 text-white"
                  data-testid="coupon-end-date-input"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-slate-300">Ship Restriction (Optional)</Label>
              <select
                value={formData.shipId}
                onChange={(e) => setFormData({ ...formData, shipId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg glassmorphism border border-slate-600 text-white bg-transparent"
                data-testid="coupon-ship-select"
              >
                <option value="">All Ships</option>
                {ships?.map((ship: any) => (
                  <option key={ship.id} value={ship.id}>{ship.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
                data-testid="coupon-active-checkbox"
              />
              <Label htmlFor="isActive" className="text-slate-300">Active</Label>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                type="submit" 
                disabled={createCouponMutation.isPending || updateCouponMutation.isPending}
                className="bg-neon-cyan text-white hover:bg-neon-cyan/80"
                data-testid="save-coupon-button"
              >
                {createCouponMutation.isPending || updateCouponMutation.isPending 
                  ? 'Saving...' 
                  : editingCoupon ? 'Update Coupon' : 'Create Coupon'
                }
              </Button>
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setEditingCoupon(null);
                  resetForm();
                }}
                data-testid="cancel-coupon-button"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Coupons List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons?.map((coupon) => (
          <Card key={coupon.id} className="glassmorphism rounded-xl p-6 border-transparent" data-testid={`coupon-card-${coupon.id}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-lg font-bold text-neon-cyan" data-testid={`coupon-code-${coupon.id}`}>
                {coupon.code}
              </div>
              <Badge 
                className={`${
                  coupon.isActive 
                    ? 'bg-neon-green/20 text-neon-green' 
                    : 'bg-slate-500/20 text-slate-400'
                } border-transparent`}
                data-testid={`coupon-status-${coupon.id}`}
              >
                {coupon.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="text-2xl font-bold text-white" data-testid={`coupon-value-${coupon.id}`}>
                {coupon.type === 'percent' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}
              </div>
              
              <div className="text-sm text-slate-400">
                <i className="fas fa-calendar mr-2"></i>
                {coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString() : 'No start date'} - 
                {coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString() : 'No end date'}
              </div>
              
              {coupon.maxUses && (
                <div className="text-sm text-slate-400" data-testid={`coupon-usage-${coupon.id}`}>
                  <i className="fas fa-chart-bar mr-2"></i>
                  Used: {coupon.uses} / {coupon.maxUses} ({getUsagePercentage(coupon).toFixed(0)}%)
                </div>
              )}
              
              {coupon.shipId && (
                <div className="text-sm text-slate-400">
                  <i className="fas fa-ship mr-2"></i>
                  Ship-specific coupon
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleEdit(coupon)}
                className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 border-transparent"
                data-testid={`edit-coupon-${coupon.id}`}
              >
                <i className="fas fa-edit mr-1"></i>Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(coupon.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                data-testid={`delete-coupon-${coupon.id}`}
              >
                <i className="fas fa-trash mr-1"></i>Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {coupons?.length === 0 && (
        <div className="text-center py-12" data-testid="no-coupons">
          <i className="fas fa-ticket-alt text-6xl text-slate-500 mb-4"></i>
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No coupons found</h3>
          <p className="text-slate-500">Create your first coupon to get started.</p>
        </div>
      )}
    </div>
  );
}
