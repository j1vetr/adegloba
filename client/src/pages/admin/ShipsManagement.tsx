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
        {/* Ships Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : ships?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ships.map((ship: Ship) => (
              <Card key={ship.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ship className="h-5 w-5 text-blue-400" />
                      <CardTitle className="text-lg text-white">{ship.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={ship.isActive ? "default" : "secondary"}
                        className={ship.isActive ? "bg-green-600 text-white" : "bg-gray-600 text-white"}
                      >
                        {ship.isActive ? (
                          <><Eye className="h-3 w-3 mr-1" /> Aktif</>
                        ) : (
                          <><EyeOff className="h-3 w-3 mr-1" /> Pasif</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-400">Slug</div>
                    <div className="text-sm font-mono text-blue-400">{ship.slug}</div>
                  </div>
                  
                  {ship.description && (
                    <div>
                      <div className="text-sm text-slate-400">Açıklama</div>
                      <div className="text-sm text-slate-300 line-clamp-2">{ship.description}</div>
                    </div>
                  )}
                  
                  {ship.imageUrl && (
                    <div>
                      <div className="text-sm text-slate-400 flex items-center gap-1">
                        <Image className="h-3 w-3" />
                        Resim URL
                      </div>
                      <div className="text-sm text-blue-400 truncate">{ship.imageUrl}</div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    Oluşturulma: {formatDate(ship.createdAt)}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(ship)}
                      className="flex-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      data-testid={`edit-ship-${ship.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteShip(ship)}
                      className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      data-testid={`delete-ship-${ship.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Sil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="text-center py-12">
              <Ship className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Henüz Gemi Yok</h3>
              <p className="text-slate-400 mb-6">İlk geminizi oluşturmak için "Yeni Ekle" butonuna tıklayın.</p>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Gemi Ekle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingShip ? "Gemi Düzenle" : "Yeni Gemi Ekle"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingShip ? "Mevcut gemi bilgilerini güncelleyin." : "Yeni bir gemi oluşturun."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Gemi Adı *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: M/V Ocean Star"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                  data-testid="ship-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-slate-300">
                  Slug
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Boş bırakılırsa otomatik oluşturulur"
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="ship-slug-input"
                />
                <p className="text-xs text-slate-400">
                  URL'de kullanılacak benzersiz kod (örn: ocean-star)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">
                  Açıklama
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Gemi hakkında kısa açıklama..."
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                  data-testid="ship-description-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-slate-300">
                  Resim URL
                </Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/ship.jpg"
                  className="bg-slate-700 border-slate-600 text-white"
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                İptal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
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
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Gemi Sil</DialogTitle>
              <DialogDescription className="text-slate-400">
                "{deleteShip?.name}" gemisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteShip(null)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                İptal
              </Button>
              <Button
                onClick={() => deleteShip && deleteMutation.mutate(deleteShip.id)}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
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