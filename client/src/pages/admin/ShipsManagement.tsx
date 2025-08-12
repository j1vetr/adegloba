import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  Search,
  MoreHorizontal,
  Calendar,
  Filter,
  CheckCircle,
  XCircle
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
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

  // Filter ships based on search and status
  const filteredShips = useMemo(() => {
    if (!ships || !Array.isArray(ships)) return [];
    
    return ships.filter((ship: Ship) => {
      const matchesSearch = ship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ship.slug.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "active" && ship.isActive) ||
                           (statusFilter === "inactive" && !ship.isActive);
      
      return matchesSearch && matchesStatus;
    });
  }, [ships, searchTerm, statusFilter]);

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
      setEditingShip(null);
      setIsFormOpen(false);
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

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PUT", `/api/admin/ships/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ships"] });
      toast({
        title: "Başarılı",
        description: "Gemi durumu güncellendi.",
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
    setEditingShip(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      insertShipSchema.parse(formData);
      
      if (editingShip) {
        updateMutation.mutate({ id: editingShip.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doğru şekilde doldurun.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (ship: Ship) => {
    setEditingShip(ship);
    setFormData({
      name: ship.name,
      slug: ship.slug,
      description: ship.description || "",
      imageUrl: ship.imageUrl || "",
      isActive: ship.isActive,
    });
    setIsFormOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout title="Gemi Yönetimi">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gemiler</h1>
            <p className="text-slate-400">Sisteme kayıtlı gemileri yönetin</p>
          </div>
          <Button 
            onClick={openCreateModal} 
            className="admin-button flex items-center gap-2"
            data-testid="button-create-ship"
          >
            <Plus className="h-5 w-5" />
            Yeni Gemi Ekle
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="admin-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Gemi adı veya slug ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="admin-input pl-10"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "admin-button" : "border-primary/30 text-white hover:bg-primary/10"}
                >
                  Tümü ({Array.isArray(ships) ? ships.length : 0})
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("active")}
                  className={statusFilter === "active" ? "admin-button" : "border-primary/30 text-white hover:bg-primary/10"}
                >
                  Aktif ({Array.isArray(ships) ? ships.filter((s: Ship) => s.isActive).length : 0})
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("inactive")}
                  className={statusFilter === "inactive" ? "admin-button" : "border-primary/30 text-white hover:bg-primary/10"}
                >
                  Pasif ({Array.isArray(ships) ? ships.filter((s: Ship) => !s.isActive).length : 0})
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Ships Table */}
        <Card className="admin-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-slate-400">Gemiler yükleniyor...</span>
              </div>
            ) : (
              <div className="admin-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white font-semibold">Gemi Adı</TableHead>
                      <TableHead className="text-white font-semibold">Slug</TableHead>
                      <TableHead className="text-white font-semibold">Durum</TableHead>
                      <TableHead className="text-white font-semibold">Oluşturulma Tarihi</TableHead>
                      <TableHead className="text-white font-semibold text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShips.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <Ship className="h-12 w-12 text-slate-500" />
                            <p className="text-slate-400 font-medium">
                              {searchTerm || statusFilter !== "all" ? "Arama kriterlerine uygun gemi bulunamadı" : "Henüz gemi eklenmemiş"}
                            </p>
                            {!searchTerm && statusFilter === "all" && (
                              <Button onClick={openCreateModal} variant="outline" className="mt-2 border-primary/30 text-white hover:bg-primary/10">
                                <Plus className="h-4 w-4 mr-2" />
                                İlk Gemiyi Ekle
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredShips.map((ship: Ship) => (
                        <TableRow key={ship.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center">
                                <Ship className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium text-white">{ship.name}</div>
                                {ship.description && (
                                  <div className="text-sm text-slate-400 max-w-xs truncate">{ship.description}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-slate-800/50 px-2 py-1 rounded text-slate-300 font-mono">
                              {ship.slug}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={ship.isActive ? "default" : "secondary"}
                                className={ship.isActive 
                                  ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                  : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                }
                              >
                                {ship.isActive ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {ship.isActive ? "Aktif" : "Pasif"}
                              </Badge>
                              <Switch
                                checked={ship.isActive}
                                onCheckedChange={(checked) => 
                                  toggleStatusMutation.mutate({ id: ship.id, isActive: checked })
                                }
                                disabled={toggleStatusMutation.isPending}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-slate-400">
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm">{formatDate(ship.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-primary/10"
                                  data-testid={`button-actions-${ship.id}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800/95 border-slate-700">
                                <DropdownMenuItem 
                                  onClick={() => openEditModal(ship)}
                                  className="text-white hover:bg-primary/10 cursor-pointer"
                                  data-testid={`button-edit-${ship.id}`}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeleteShip(ship)}
                                  className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                                  data-testid={`button-delete-${ship.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Ship Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="admin-card max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">
                {editingShip ? "Gemiyi Düzenle" : "Yeni Gemi Ekle"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingShip 
                  ? "Mevcut gemi bilgilerini güncelleyin"
                  : "Sisteme yeni bir gemi ekleyin"
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Gemi Adı *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Örn: Mavi Yıldız"
                    required
                    className="admin-input"
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-white">Slug *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="Örn: mavi-yildiz"
                    required
                    className="admin-input"
                    data-testid="input-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Açıklama</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  placeholder="Gemi hakkında kısa açıklama..."
                  rows={3}
                  className="admin-input resize-none"
                  data-testid="textarea-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-white">Resim URL'si</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl || ""}
                  onChange={handleInputChange}
                  placeholder="https://example.com/ship-image.jpg"
                  className="admin-input"
                  data-testid="input-image-url"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={handleSwitchChange}
                  className="data-[state=checked]:bg-primary"
                  data-testid="switch-is-active"
                />
                <Label htmlFor="isActive" className="text-white">
                  {formData.isActive ? "Aktif" : "Pasif"}
                </Label>
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="border-slate-600 text-white hover:bg-slate-800"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="admin-button"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingShip ? "Güncelle" : "Oluştur"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Ship Dialog */}
        <Dialog open={!!deleteShip} onOpenChange={() => setDeleteShip(null)}>
          <DialogContent className="admin-card max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Gemiyi Sil</DialogTitle>
              <DialogDescription className="text-slate-400">
                <strong>{deleteShip?.name}</strong> gemisini silmek istediğinize emin misiniz? 
                Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteShip(null)}
                className="border-slate-600 text-white hover:bg-slate-800"
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteShip && deleteMutation.mutate(deleteShip.id)}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Sil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}