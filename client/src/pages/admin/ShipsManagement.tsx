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
  kitNumber: string | null;
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
    kitNumber: "",
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

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const ship = ships?.find((s: Ship) => s.id === id);
      if (!ship) return;
      return await apiRequest("PUT", `/api/admin/ships/${id}`, { isActive: !ship.isActive });
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
      kitNumber: "",
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
      kitNumber: ship.kitNumber || "",
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
      <div className="admin-mobile-responsive space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Gemiler</h1>
            <p className="text-slate-400 text-sm lg:text-base">Sisteme kayıtlı gemileri yönetin</p>
            {Array.isArray(ships) && ships.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 lg:gap-4 mt-2 text-xs lg:text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  Aktif: {ships.filter((ship: Ship) => ship.isActive).length}
                </span>
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  Pasif: {ships.filter((ship: Ship) => !ship.isActive).length}
                </span>
                <span className="text-slate-500">
                  Toplam: {ships.length}
                </span>
              </div>
            )}
          </div>
          <Button 
            onClick={openCreateModal} 
            className="admin-button flex items-center justify-center gap-2 w-full lg:w-auto"
            data-testid="button-create-ship"
          >
            <Plus className="h-5 w-5 flex-shrink-0" />
            <span className="whitespace-nowrap">Yeni Gemi Ekle</span>
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="admin-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Gemi adı veya slug ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="admin-input pl-10 w-full"
                  data-testid="input-search"
                />
              </div>
              <div className="admin-button-group">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "admin-button" : "border-primary/30 text-white hover:bg-primary/10 flex-1 min-w-0"}
                >
                  <span className="truncate">Tümü ({Array.isArray(ships) ? ships.length : 0})</span>
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("active")}
                  className={statusFilter === "active" ? "admin-button" : "border-primary/30 text-white hover:bg-primary/10 flex-1 min-w-0"}
                >
                  <span className="truncate">Aktif ({Array.isArray(ships) ? ships.filter((s: Ship) => s.isActive).length : 0})</span>
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("inactive")}
                  className={statusFilter === "inactive" ? "admin-button" : "border-primary/30 text-white hover:bg-primary/10 flex-1 min-w-0"}
                >
                  <span className="truncate">Pasif ({Array.isArray(ships) ? ships.filter((s: Ship) => !s.isActive).length : 0})</span>
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
              <>
                {/* Desktop Table Layout */}
                <div className="desktop-table-layout admin-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white font-semibold">Gemi Adı</TableHead>
                        <TableHead className="text-white font-semibold hidden md:table-cell">Slug</TableHead>
                        <TableHead className="text-white font-semibold">KIT No</TableHead>
                        <TableHead className="text-white font-semibold">Durum</TableHead>
                        <TableHead className="text-white font-semibold hidden lg:table-cell">Tarih</TableHead>
                        <TableHead className="text-white font-semibold text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShips.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-4">
                              <Ship className="h-12 w-12 text-slate-500" />
                              <div className="text-center">
                                <p className="text-slate-400 font-medium mb-2">
                                  {searchTerm || statusFilter !== "all" ? "Arama kriterlerine uygun gemi bulunamadı" : "Henüz gemi eklenmemiş"}
                                </p>
                                {!searchTerm && statusFilter === "all" && (
                                  <Button onClick={openCreateModal} className="admin-button">
                                    <Plus className="h-4 w-4 mr-2" />
                                    İlk Gemiyi Ekle
                                  </Button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredShips.map((ship: Ship) => (
                          <TableRow key={ship.id} className="group hover:bg-primary/5 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                  <Ship className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-white text-sm lg:text-base truncate">{ship.name}</div>
                                  <div className="md:hidden">
                                    <code className="text-xs bg-slate-800/50 px-2 py-1 rounded text-slate-300 font-mono">
                                      {ship.slug}
                                    </code>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <code className="text-xs lg:text-sm bg-slate-800/50 px-2 py-1 rounded text-slate-300 font-mono">
                                {ship.slug}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="text-slate-300 text-xs lg:text-sm">
                                {ship.kitNumber || (
                                  <span className="text-slate-500 italic">Atanmamış</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {ship.isActive ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1 text-xs">
                                    <CheckCircle className="h-3 w-3 flex-shrink-0" />
                                    <span className="hidden sm:inline">Aktif</span>
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1 text-xs">
                                    <XCircle className="h-3 w-3 flex-shrink-0" />
                                    <span className="hidden sm:inline">Pasif</span>
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="text-slate-300 text-xs">
                                {formatDate(ship.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleMutation.mutate(ship.id)}
                                  disabled={toggleMutation.isPending}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                                  data-testid={`button-toggle-${ship.id}`}
                                  title={ship.isActive ? "Gemii Gizle" : "Gemiyi Göster"}
                                >
                                  {ship.isActive ? <EyeOff className="h-3 w-3 lg:h-4 lg:w-4" /> : <Eye className="h-3 w-3 lg:h-4 lg:w-4" />}
                                </Button>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                                      data-testid={`button-menu-${ship.id}`}
                                    >
                                      <MoreHorizontal className="h-3 w-3 lg:h-4 lg:w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-slate-800/95 border-slate-600 backdrop-blur-xl">
                                    <DropdownMenuItem
                                      onClick={() => openEditModal(ship)}
                                      className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-700/50 cursor-pointer"
                                      data-testid={`menu-edit-${ship.id}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                      Düzenle
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setDeleteShip(ship)}
                                      className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                                      data-testid={`menu-delete-${ship.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Sil
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card Layout */}
                <div className="mobile-card-layout p-4">
                  {filteredShips.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-12">
                      <Ship className="h-16 w-16 text-slate-500" />
                      <div className="text-center">
                        <p className="text-slate-400 font-medium mb-4 text-sm">
                          {searchTerm || statusFilter !== "all" ? "Arama kriterlerine uygun gemi bulunamadı" : "Henüz gemi eklenmemiş"}
                        </p>
                        {!searchTerm && statusFilter === "all" && (
                          <Button onClick={openCreateModal} className="admin-button w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            İlk Gemiyi Ekle
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredShips.map((ship: Ship) => (
                        <div key={ship.id} className="mobile-card-item">
                          <div className="card-header">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                <Ship className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-white text-base truncate">{ship.name}</h3>
                                <code className="text-xs bg-slate-800/50 px-2 py-1 rounded text-slate-300 font-mono block mt-1">
                                  {ship.slug}
                                </code>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              {ship.isActive ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1 text-xs whitespace-nowrap">
                                  <CheckCircle className="h-3 w-3" />
                                  Aktif
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1 text-xs whitespace-nowrap">
                                  <XCircle className="h-3 w-3" />
                                  Pasif
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">KIT Numarası:</span>
                              <span className="text-slate-300 text-right">
                                {ship.kitNumber || (
                                  <span className="text-slate-500 italic">Atanmamış</span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Oluşturma Tarihi:</span>
                              <span className="text-slate-300 text-xs text-right">
                                {formatDate(ship.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="card-actions">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleMutation.mutate(ship.id)}
                              disabled={toggleMutation.isPending}
                              className="border-primary/30 text-white hover:bg-primary/10 flex-1"
                              data-testid={`mobile-toggle-${ship.id}`}
                            >
                              {ship.isActive ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span>Gizle</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span>Göster</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(ship)}
                              className="border-primary/30 text-white hover:bg-primary/10 flex-1"
                              data-testid={`mobile-edit-${ship.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>Düzenle</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteShip(ship)}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1"
                              data-testid={`mobile-delete-${ship.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>Sil</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
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
                  <p className="text-xs text-slate-400">Slug otomatik olarak gemi adından oluşturulacak</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kitNumber" className="text-white">KIT Numarası</Label>
                  <Input
                    id="kitNumber"
                    name="kitNumber"
                    value={formData.kitNumber || ""}
                    onChange={handleInputChange}
                    placeholder="Örn: KIT-2024-001"
                    className="admin-input"
                    data-testid="input-kit-number"
                  />
                  <p className="text-xs text-slate-400">Admin panelinde görüntülenen KIT numarası</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="space-y-1">
                  <Label htmlFor="isActive" className="text-white font-medium">Durum</Label>
                  <p className="text-xs text-slate-400">
                    {formData.isActive 
                      ? "Gemi kayıt formunda görünür olacak" 
                      : "Gemi kayıt formunda gizli olacak"
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${formData.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formData.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={handleSwitchChange}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-700"
                    data-testid="switch-is-active"
                  />
                </div>
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