import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertShipSchema } from "@shared/schema";
import { z } from "zod";
import {
  Ship,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Loader2,
  Image,
  Calendar
} from "lucide-react";

type Ship = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ShipFormData = z.infer<typeof insertShipSchema>;

export default function ShipsManagement() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShip, setEditingShip] = useState<Ship | null>(null);
  const [deleteShip, setDeleteShip] = useState<Ship | null>(null);
  const [formData, setFormData] = useState<ShipFormData>({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
  });

  const { data: ships, isLoading } = useQuery({
    queryKey: ["/api/admin/ships"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ShipFormData) => {
      return await apiRequest("POST", "/api/admin/ships", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ships"] });
      setIsFormOpen(false);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Gemi başarıyla oluşturuldu.",
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShipFormData> }) => {
      return await apiRequest("PUT", `/api/admin/ships/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ships"] });
      setIsFormOpen(false);
      setEditingShip(null);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Gemi başarıyla güncellendi.",
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
      return await apiRequest("DELETE", `/api/admin/ships/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ships"] });
      setDeleteShip(null);
      toast({
        title: "Başarılı",
        description: "Gemi başarıyla silindi.",
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
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      isActive: true,
    });
  };

  const handleAdd = () => {
    resetForm();
    setEditingShip(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ship: Ship) => {
    setFormData({
      name: ship.name,
      slug: ship.slug,
      description: ship.description || "",
      imageUrl: ship.imageUrl || "",
      isActive: ship.isActive,
    });
    setEditingShip(ship);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate slug from name if empty
    if (!formData.slug && formData.name) {
      formData.slug = formData.name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    if (editingShip) {
      updateMutation.mutate({ id: editingShip.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout title="Gemiler" showAddButton onAddClick={handleAdd}>
      <div className="space-y-6">
        {/* Ships Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : ships?.length > 0 ? (
          <div className="glass-card border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <th className="text-left px-6 py-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Ship className="h-4 w-4 text-primary" />
                        Gemi Adı
                      </div>
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-white">Slug</th>
                    <th className="text-left px-6 py-4 font-semibold text-white">Durum</th>
                    <th className="text-left px-6 py-4 font-semibold text-white">Oluşturulma Tarihi</th>
                    <th className="text-center px-6 py-4 font-semibold text-white">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {ships.map((ship: Ship, index: number) => (
                    <tr 
                      key={ship.id}
                      className={`
                        table-row-hover border-b border-slate-800/50 
                        ${index % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-800/20'}
                        hover:bg-primary/5 hover:border-primary/20
                        transition-all duration-300
                      `}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                            <Ship className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{ship.name}</div>
                            {ship.description && (
                              <div className="text-sm text-slate-400 truncate max-w-xs">
                                {ship.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 bg-slate-800 text-primary rounded text-sm font-mono">
                          {ship.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          className={`
                            ${ship.isActive 
                              ? "bg-green-600/20 text-green-400 border-green-500/30" 
                              : "bg-gray-600/20 text-gray-400 border-gray-500/30"
                            } backdrop-blur-sm
                          `}
                        >
                          {ship.isActive ? (
                            <><Eye className="h-3 w-3 mr-1" /> Aktif</>
                          ) : (
                            <><EyeOff className="h-3 w-3 mr-1" /> Pasif</>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ship.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(ship)}
                            className="futuristic-btn text-primary hover:text-primary hover:bg-primary/20 hover:scale-105"
                            data-testid={`edit-ship-${ship.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteShip(ship)}
                            className="futuristic-btn text-red-400 hover:text-red-300 hover:bg-red-500/20 hover:scale-105"
                            data-testid={`delete-ship-${ship.id}`}
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
          </div>
        ) : (
          <Card className="glass-card border-border/50 text-center py-16">
            <CardContent className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center">
                <Ship className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Henüz Gemi Yok</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                İlk geminizi oluşturmak için "Yeni Ekle" butonuna tıklayın ve gemi bilgilerini doldurun.
              </p>
              <Button
                onClick={handleAdd}
                className="btn-neon mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Gemi Ekle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="glass-card border-primary/30 max-w-lg bg-slate-900/95 backdrop-blur-xl">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-white text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Ship className="h-5 w-5 text-primary" />
                </div>
                {editingShip ? "Gemi Düzenle" : "Yeni Gemi Ekle"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingShip ? "Mevcut gemi bilgilerini güncelleyin." : "Yeni bir gemi oluşturun."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300 font-medium">
                  Gemi Adı *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: M/V Ocean Star"
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 
                    focus:border-primary/50 focus:ring-primary/20 focus:ring-2 
                    transition-all duration-200 backdrop-blur-sm"
                  required
                  data-testid="ship-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-slate-300 font-medium">
                  Slug
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Boş bırakılırsa otomatik oluşturulur"
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 
                    focus:border-primary/50 focus:ring-primary/20 focus:ring-2 
                    transition-all duration-200 backdrop-blur-sm font-mono"
                  data-testid="ship-slug-input"
                />
                <p className="text-xs text-slate-400">
                  URL'de kullanılacak benzersiz kod (örn: ocean-star)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300 font-medium">
                  Açıklama
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Gemi hakkında kısa açıklama..."
                  className="bg-slate-800/50 border-slate-600/50 text-white min-h-[100px]
                    focus:border-primary/50 focus:ring-primary/20 focus:ring-2 
                    transition-all duration-200 backdrop-blur-sm resize-none"
                  rows={3}
                  data-testid="ship-description-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-slate-300 font-medium">
                  Resim URL
                </Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/ship.jpg"
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 
                    focus:border-primary/50 focus:ring-primary/20 focus:ring-2 
                    transition-all duration-200 backdrop-blur-sm"
                  data-testid="ship-image-input"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="ship-active-switch"
                />
                <Label htmlFor="isActive" className="text-slate-300">
                  Aktif durumda
                </Label>
              </div>
            </form>

            <DialogFooter className="pt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500
                  transition-all duration-200 hover:scale-105"
              >
                İptal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-neon"
                data-testid="ship-submit-button"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingShip ? "Güncelle" : "Oluştur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteShip} onOpenChange={() => setDeleteShip(null)}>
          <DialogContent className="glass-card border-red-500/30 max-w-md bg-slate-900/95 backdrop-blur-xl">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-white text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                Gemi Sil
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                <span className="font-medium text-red-400">"{deleteShip?.name}"</span> gemisini silmek istediğinizden emin misiniz? 
                Bu işlem geri alınamaz ve tüm ilişkili veriler kaybolacaktır.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteShip(null)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500
                  transition-all duration-200 hover:scale-105"
              >
                İptal
              </Button>
              <Button
                onClick={() => deleteShip && deleteMutation.mutate(deleteShip.id)}
                disabled={deleteMutation.isPending}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 
                  text-white transition-all duration-200 hover:scale-105"
                data-testid="confirm-delete-ship"
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