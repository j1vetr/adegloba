import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Plan } from "@shared/schema";

export default function PlansManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    gbAmount: 0,
    speedNote: '',
    validityNote: '',
    priceUsd: '',
    isActive: true,
    sortOrder: 0
  });

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/admin/plans"]
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      const response = await apiRequest('POST', '/api/admin/plans', planData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Plan created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
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
        description: error.message || "Failed to create plan",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, planData }: { id: string; planData: any }) => {
      const response = await apiRequest('PUT', `/api/admin/plans/${id}`, planData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Plan updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setEditingPlan(null);
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
        description: error.message || "Failed to update plan",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/plans/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
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
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      gbAmount: 0,
      speedNote: '',
      validityNote: '',
      priceUsd: '',
      isActive: true,
      sortOrder: 0
    });
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      gbAmount: plan.gbAmount,
      speedNote: plan.speedNote || '',
      validityNote: plan.validityNote || '',
      priceUsd: plan.priceUsd,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder
    });
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, planData: formData });
    } else {
      createPlanMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      deletePlanMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading plans...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Plans Management</h3>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-neon-cyan text-white hover:bg-neon-cyan/80"
          data-testid="create-plan-button"
        >
          <i className="fas fa-plus mr-2"></i>Add Plan
        </Button>
      </div>

      {isCreating && (
        <Card className="glassmorphism rounded-xl p-6 mb-6 border-transparent" data-testid="plan-form">
          <h4 className="text-lg font-semibold text-white mb-4">
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Plan Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="glassmorphism border-slate-600 text-white"
                  placeholder="e.g., Professional"
                  required
                  data-testid="plan-title-input"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">Data Amount (GB)</Label>
                <Input
                  type="number"
                  value={formData.gbAmount}
                  onChange={(e) => setFormData({ ...formData, gbAmount: parseInt(e.target.value) || 0 })}
                  className="glassmorphism border-slate-600 text-white"
                  placeholder="25"
                  required
                  data-testid="plan-gb-input"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.priceUsd}
                  onChange={(e) => setFormData({ ...formData, priceUsd: e.target.value })}
                  className="glassmorphism border-slate-600 text-white"
                  placeholder="399.00"
                  required
                  data-testid="plan-price-input"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="glassmorphism border-slate-600 text-white"
                  placeholder="0"
                  data-testid="plan-sort-input"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-slate-300">Speed Note</Label>
              <Input
                value={formData.speedNote}
                onChange={(e) => setFormData({ ...formData, speedNote: e.target.value })}
                className="glassmorphism border-slate-600 text-white"
                placeholder="e.g., High-speed priority"
                data-testid="plan-speed-input"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Validity Note</Label>
              <Input
                value={formData.validityNote}
                onChange={(e) => setFormData({ ...formData, validityNote: e.target.value })}
                className="glassmorphism border-slate-600 text-white"
                placeholder="e.g., Monthly renewal"
                data-testid="plan-validity-input"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
                data-testid="plan-active-checkbox"
              />
              <Label htmlFor="isActive" className="text-slate-300">Active</Label>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                type="submit" 
                disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                className="bg-neon-cyan text-white hover:bg-neon-cyan/80"
                data-testid="save-plan-button"
              >
                {createPlanMutation.isPending || updatePlanMutation.isPending 
                  ? 'Saving...' 
                  : editingPlan ? 'Update Plan' : 'Create Plan'
                }
              </Button>
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setEditingPlan(null);
                  resetForm();
                }}
                data-testid="cancel-plan-button"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <Card key={plan.id} className="glassmorphism rounded-xl p-6 border-transparent" data-testid={`plan-card-${plan.id}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-white" data-testid={`plan-title-${plan.id}`}>
                {plan.title}
              </h4>
              <Badge 
                className={`${
                  plan.isActive 
                    ? 'bg-neon-green/20 text-neon-green' 
                    : 'bg-slate-500/20 text-slate-400'
                } border-transparent`}
                data-testid={`plan-status-${plan.id}`}
              >
                {plan.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="text-2xl font-bold text-neon-cyan mb-2" data-testid={`plan-price-${plan.id}`}>
              ${Number(plan.priceUsd).toFixed(0)}
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="text-sm text-slate-300" data-testid={`plan-data-${plan.id}`}>
                <i className="fas fa-database mr-2"></i>{plan.gbAmount} GB
              </div>
              {plan.speedNote && (
                <div className="text-sm text-slate-400" data-testid={`plan-speed-${plan.id}`}>
                  <i className="fas fa-tachometer-alt mr-2"></i>{plan.speedNote}
                </div>
              )}
              {plan.validityNote && (
                <div className="text-sm text-slate-400" data-testid={`plan-validity-${plan.id}`}>
                  <i className="fas fa-calendar mr-2"></i>{plan.validityNote}
                </div>
              )}
              <div className="text-sm text-slate-400" data-testid={`plan-sort-${plan.id}`}>
                <i className="fas fa-sort mr-2"></i>Sort: {plan.sortOrder}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleEdit(plan)}
                className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 border-transparent"
                data-testid={`edit-plan-${plan.id}`}
              >
                <i className="fas fa-edit mr-1"></i>Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(plan.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                data-testid={`delete-plan-${plan.id}`}
              >
                <i className="fas fa-trash mr-1"></i>Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {plans?.length === 0 && (
        <div className="text-center py-12" data-testid="no-plans">
          <i className="fas fa-wifi text-6xl text-slate-500 mb-4"></i>
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No plans found</h3>
          <p className="text-slate-500">Create your first data plan to get started.</p>
        </div>
      )}
    </div>
  );
}
