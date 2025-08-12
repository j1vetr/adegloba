import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Users,
  Eye,
  Search,
  Loader2,
  Calendar,
  Ship,
  Mail,
  User,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Ship as ShipType } from "@shared/schema";

type UserData = {
  id: string;
  username: string;
  email: string;
  shipId: string | null;
  created_at: string;
  ship?: {
    id: string;
    name: string;
    slug: string;
  };
};

export default function UsersManagement() {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    ship_id: "",
  });
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: ships } = useQuery<ShipType[]>({
    queryKey: ["/api/ships/active"],
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

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla güncellendi.",
      });
      setEditUser(null);
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
      return await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla silindi.",
      });
      setDeleteUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleEditUser = (user: UserData) => {
    setEditUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      ship_id: user.shipId || "",
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editUser) {
      updateMutation.mutate({ 
        id: editUser.id, 
        data: {
          ...editFormData,
          ship_id: editFormData.ship_id || null
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteUser) {
      deleteMutation.mutate(deleteUser.id);
    }
  };

  const filteredUsers = users?.filter((user: UserData) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.ship?.name.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <AdminLayout title="Kullanıcılar">
      <div className="admin-mobile-responsive space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Kullanıcılar</h1>
            <p className="text-slate-400 text-sm lg:text-base">Sisteme kayıtlı kullanıcıları yönetin</p>
            {Array.isArray(users) && users.length > 0 && (
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary flex-shrink-0" />
                  Toplam: {users.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Search Section */}
        <Card className="admin-card">
          <CardHeader className="pb-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-input pl-10 w-full"
                data-testid="search-users-input"
              />
            </div>
          </CardHeader>
        </Card>

        {/* Users Table */}
        <Card className="admin-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-slate-400">Kullanıcılar yükleniyor...</span>
              </div>
            ) : (
              <>
                {/* Desktop Table Layout */}
                <div className="desktop-table-layout admin-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white font-semibold">Kullanıcı</TableHead>
                        <TableHead className="text-white font-semibold hidden md:table-cell">E-posta</TableHead>
                        <TableHead className="text-white font-semibold">Gemi</TableHead>
                        <TableHead className="text-white font-semibold hidden lg:table-cell">Kayıt Tarihi</TableHead>
                        <TableHead className="text-white font-semibold text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12">
                            <div className="flex flex-col items-center gap-4">
                              <Users className="h-12 w-12 text-slate-500" />
                              <div className="text-center">
                                <p className="text-slate-400 font-medium mb-2">
                                  {searchTerm ? "Arama kriterlerine uygun kullanıcı bulunamadı" : "Henüz kullanıcı eklenmemiş"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user: UserData) => (
                          <TableRow key={user.id} className="group hover:bg-primary/5 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-white text-sm lg:text-base truncate">{user.username}</div>
                                  <div className="md:hidden">
                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                      <Mail className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{user.email}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="text-slate-300 text-sm truncate">{user.email}</div>
                            </TableCell>
                            <TableCell>
                              {user.ship ? (
                                <div className="flex items-center gap-2">
                                  <Ship className="h-4 w-4 text-primary flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-slate-300 text-sm font-medium truncate">{user.ship.name}</div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic text-sm">Atanmamış</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="text-slate-300 text-xs">
                                {formatDate(user.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                                  data-testid={`button-view-${user.id}`}
                                  title="Kullanıcı Detayları"
                                >
                                  <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                                  data-testid={`button-edit-${user.id}`}
                                  title="Kullanıcı Düzenle"
                                >
                                  <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteUser(user)}
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  data-testid={`button-delete-${user.id}`}
                                  title="Kullanıcı Sil"
                                >
                                  <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                                </Button>
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
                  {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-12">
                      <Users className="h-16 w-16 text-slate-500" />
                      <div className="text-center">
                        <p className="text-slate-400 font-medium mb-4 text-sm">
                          {searchTerm ? "Arama kriterlerine uygun kullanıcı bulunamadı" : "Henüz kullanıcı eklenmemiş"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsers.map((user: UserData) => (
                        <div key={user.id} className="mobile-card-item">
                          <div className="card-header">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-white text-base truncate">{user.username}</h3>
                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{user.email}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Atanmış Gemi:</span>
                              <span className="text-slate-300 text-right">
                                {user.ship ? (
                                  <div className="flex items-center gap-1">
                                    <Ship className="h-3 w-3 text-primary flex-shrink-0" />
                                    <span className="truncate">{user.ship.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic">Atanmamış</span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Kayıt Tarihi:</span>
                              <span className="text-slate-300 text-xs text-right">
                                {formatDate(user.created_at)}
                              </span>
                            </div>
                          </div>

                          <div className="card-actions">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                              className="border-primary/30 text-white hover:bg-primary/10 flex-1"
                              data-testid={`mobile-view-${user.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>Detay</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="border-primary/30 text-white hover:bg-primary/10 flex-1"
                              data-testid={`mobile-edit-${user.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>Düzenle</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteUser(user)}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1"
                              data-testid={`mobile-delete-${user.id}`}
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

        {/* User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="admin-card max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">
                Kullanıcı Detayları - {selectedUser?.username}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Kullanıcı bilgileri ve aktiviteleri
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6">
                {/* User Basic Info */}
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Temel Bilgiler
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-400">Kullanıcı ID</div>
                      <div className="font-mono text-white text-sm">{selectedUser.id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Kullanıcı Adı</div>
                      <div className="text-white">{selectedUser.username}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">E-posta</div>
                      <div className="text-white">{selectedUser.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Kayıt Tarihi</div>
                      <div className="text-white">{formatDate(selectedUser.created_at)}</div>
                    </div>
                  </div>
                </div>

                {/* Ship Info */}
                {selectedUser.ship && (
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Ship className="h-4 w-4" />
                      Gemi Bilgileri
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400">Gemi Adı</div>
                        <div className="text-white">{selectedUser.ship.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Gemi Slug</div>
                        <div className="font-mono text-white text-sm">{selectedUser.ship.slug}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="admin-card max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Kullanıcı Düzenle</DialogTitle>
              <DialogDescription className="text-slate-400">
                Kullanıcı bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username" className="text-white">Kullanıcı Adı</Label>
                <Input
                  id="edit-username"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  className="admin-input"
                  data-testid="input-edit-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-white">E-posta</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="admin-input"
                  data-testid="input-edit-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ship" className="text-white">Atanmış Gemi</Label>
                <Select 
                  value={editFormData.ship_id} 
                  onValueChange={(value) => setEditFormData({...editFormData, ship_id: value})}
                >
                  <SelectTrigger className="admin-input" data-testid="select-edit-ship">
                    <SelectValue placeholder="Gemi seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="">Gemi Atanmadı</SelectItem>
                    {ships?.map((ship) => (
                      <SelectItem key={ship.id} value={ship.id} className="text-white focus:bg-primary/20">
                        {ship.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  className="admin-button"
                  disabled={updateMutation.isPending}
                  data-testid="button-update-user"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    'Güncelle'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
          <AlertDialogContent className="admin-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Kullanıcı Silme Onayı
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                <strong>{deleteUser?.username}</strong> kullanıcısını silmek istediğinizden emin misiniz? 
                Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2">
              <AlertDialogCancel 
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setDeleteUser(null)}
              >
                İptal
              </AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 text-white hover:bg-red-700 border-red-600"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete-user"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  'Sil'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AdminLayout>
  );
}