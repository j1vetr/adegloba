import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  Eye,
  Search,
  Loader2,
  Calendar,
  Ship,
  Mail,
  User
} from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
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
      <div className="space-y-6">
        {/* Search and Stats */}
        <div className="flex items-center justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Kullanıcı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
              data-testid="search-users-input"
            />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {filteredUsers.length} kullanıcı
            </div>
          </div>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredUsers.map((user: UserData) => (
              <Card key={user.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-green-400" />
                        <div>
                          <div className="font-medium text-white">{user.username}</div>
                          <div className="text-sm text-slate-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>

                      {user.ship && (
                        <div className="flex items-center gap-2">
                          <Ship className="h-4 w-4 text-blue-400" />
                          <div>
                            <div className="text-sm font-medium text-white">{user.ship.name}</div>
                            <div className="text-xs text-slate-400">Gemi: {user.ship.slug}</div>
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(user.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-600 text-white">
                        Aktif
                      </Badge>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                        data-testid={`view-user-${user.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detay
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchTerm ? "Kullanıcı Bulunamadı" : "Henüz Kullanıcı Yok"}
              </h3>
              <p className="text-slate-400">
                {searchTerm 
                  ? "Arama kriterlerinize uygun kullanıcı bulunamadı."
                  : "Henüz hiç kullanıcı kayıt olmamış."
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
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
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400">Gemi ID</div>
                        <div className="font-mono text-white text-sm">{selectedUser.ship.id}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Gemi Adı</div>
                        <div className="text-white">{selectedUser.ship.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Gemi Kodu</div>
                        <div className="text-white">{selectedUser.ship.slug}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Status */}
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <h4 className="font-semibold text-white mb-3">Hesap Durumu</h4>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600 text-white">
                      Aktif Hesap
                    </Badge>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <h4 className="font-semibold text-white mb-3">Aktivite İstatistikleri</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">-</div>
                      <div className="text-xs text-slate-400">Toplam Sipariş</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">-</div>
                      <div className="text-xs text-slate-400">Aktif Paket</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">-</div>
                      <div className="text-xs text-slate-400">Toplam Harcama</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
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