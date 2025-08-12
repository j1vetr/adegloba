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
import type { Ship } from "@shared/schema";

export default function ShipsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingShip, setEditingShip] = useState<Ship | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    isActive: true
  });

  const { data: ships, isLoading } = useQuery<Ship[]>({
    queryKey: ["/api/admin/ships"]
  });

  const createShipMutation = useMutation({
    mutationFn: async (shipData: any) => {
      const response = await apiRequest('POST', '/api/admin/ships', shipData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ship created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ships"] });
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
        description: error.message || "Failed to create ship",
        variant: "destructive",
      });
    },
  });

  const updateShipMutation = useMutation({
    mutationFn: async ({ id, shipData }: { id: string; shipData: any }) => {
      const response = await apiRequest('PUT', `/api/admin/ships/${id}`, shipData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ship updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ships"] });
      setEditingShip(null);
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
        description: error.message || "Failed to update ship",
        variant: "destructive",
      });
    },
  });

  const deleteShipMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/ships/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ship deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ships"] });
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
        description: error.message || "Failed to delete ship",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      isActive: true
    });
  };

  const handleEdit = (ship: Ship) => {
    setEditingShip(ship);
    setFormData({
      name: ship.name,
      slug: ship.slug,
      description: ship.description || '',
      imageUrl: ship.imageUrl || '',
      isActive: ship.isActive
    });
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingShip) {
      updateShipMutation.mutate({ id: editingShip.id, shipData: formData });
    } else {
      createShipMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this ship?')) {
      deleteShipMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading ships...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Ships Management</h3>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-neon-cyan text-white hover:bg-neon-cyan/80"
          data-testid="create-ship-button"
        >
          <i className="fas fa-plus mr-2"></i>Add Ship
        </Button>
      </div>

      {isCreating && (
        <Card className="glassmorphism rounded-xl p-6 mb-6 border-transparent" data-testid="ship-form">
          <h4 className="text-lg font-semibold text-white mb-4">
            {editingShip ? 'Edit Ship' : 'Create New Ship'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Ship Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="glassmorphism border-slate-600 text-white"
                  placeholder="e.g., AL-1 Atlantis"
                  required
                  data-testid="ship-name-input"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="glassmorphism border-slate-600 text-white"
                  placeholder="e.g., al-1-atlantis"
                  required
                  data-testid="ship-slug-input"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="glassmorphism border-slate-600 text-white"
                placeholder="Ship description..."
                data-testid="ship-description-input"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Image URL</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="glassmorphism border-slate-600 text-white"
                placeholder="https://..."
                data-testid="ship-image-input"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
                data-testid="ship-active-checkbox"
              />
              <Label htmlFor="isActive" className="text-slate-300">Active</Label>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                type="submit" 
                disabled={createShipMutation.isPending || updateShipMutation.isPending}
                className="bg-neon-cyan text-white hover:bg-neon-cyan/80"
                data-testid="save-ship-button"
              >
                {createShipMutation.isPending || updateShipMutation.isPending 
                  ? 'Saving...' 
                  : editingShip ? 'Update Ship' : 'Create Ship'
                }
              </Button>
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setEditingShip(null);
                  resetForm();
                }}
                data-testid="cancel-ship-button"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Ships List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ships?.map((ship) => (
          <Card key={ship.id} className="glassmorphism rounded-xl p-6 border-transparent" data-testid={`ship-card-${ship.id}`}>
            {ship.imageUrl && (
              <img 
                src={ship.imageUrl} 
                alt={ship.name} 
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
            )}
            
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-white" data-testid={`ship-name-${ship.id}`}>
                {ship.name}
              </h4>
              <Badge 
                className={`${
                  ship.isActive 
                    ? 'bg-neon-green/20 text-neon-green' 
                    : 'bg-slate-500/20 text-slate-400'
                } border-transparent`}
                data-testid={`ship-status-${ship.id}`}
              >
                {ship.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <p className="text-slate-400 text-sm mb-2" data-testid={`ship-slug-${ship.id}`}>
              Slug: {ship.slug}
            </p>
            
            {ship.description && (
              <p className="text-slate-300 text-sm mb-4" data-testid={`ship-description-${ship.id}`}>
                {ship.description.slice(0, 100)}...
              </p>
            )}
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleEdit(ship)}
                className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 border-transparent"
                data-testid={`edit-ship-${ship.id}`}
              >
                <i className="fas fa-edit mr-1"></i>Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(ship.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                data-testid={`delete-ship-${ship.id}`}
              >
                <i className="fas fa-trash mr-1"></i>Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {ships?.length === 0 && (
        <div className="text-center py-12" data-testid="no-ships">
          <i className="fas fa-ship text-6xl text-slate-500 mb-4"></i>
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No ships found</h3>
          <p className="text-slate-500">Create your first ship to get started.</p>
        </div>
      )}
    </div>
  );
}
