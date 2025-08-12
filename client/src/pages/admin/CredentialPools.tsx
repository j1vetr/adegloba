import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Trash2, Key, Ship as ShipIcon, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Ship, CredentialPool } from '@/../shared/schema';

export default function CredentialPools() {
  const [selectedShip, setSelectedShip] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ships
  const { data: ships = [] } = useQuery<Ship[]>({
    queryKey: ['/api/admin/ships'],
    enabled: true
  });

  // Fetch credentials for selected ship
  const { data: credentials = [], isLoading: isLoadingCredentials } = useQuery<CredentialPool[]>({
    queryKey: ['/api/admin/credential-pools', selectedShip],
    enabled: !!selectedShip
  });

  // Fetch credential stats for selected ship
  const { data: credentialStats } = useQuery<{available: number, assigned: number, total: number}>({
    queryKey: ['/api/admin/credential-stats', selectedShip],
    enabled: !!selectedShip
  });

  const createCredentialMutation = useMutation({
    mutationFn: (credentialData: any) => apiRequest('POST', '/api/admin/credential-pools', credentialData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-stats'] });
      setIsCreateOpen(false);
      toast({ title: "Kimlik oluşturuldu", description: "Yeni kimlik başarıyla eklendi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kimlik oluşturulurken bir hata oluştu.", variant: "destructive" });
    }
  });

  const bulkUploadMutation = useMutation({
    mutationFn: (data: { shipId: string; csvContent: string }) => 
      apiRequest('POST', '/api/admin/credential-pools/bulk', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-stats'] });
      setIsBulkUploadOpen(false);
      setCsvContent('');
      toast({ 
        title: "Toplu yükleme tamamlandı", 
        description: `${data.count} kimlik başarıyla eklendi.` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Hata", 
        description: error?.message || "Toplu yükleme sırasında bir hata oluştu.", 
        variant: "destructive" 
      });
    }
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/credential-pools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-stats'] });
      toast({ title: "Kimlik silindi", description: "Kimlik başarıyla silindi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kimlik silinirken bir hata oluştu.", variant: "destructive" });
    }
  });

  const unassignCredentialMutation = useMutation({
    mutationFn: (id: string) => apiRequest('POST', `/api/admin/credential-pools/${id}/unassign`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credential-stats'] });
      toast({ title: "Kimlik serbest bırakıldı", description: "Kimlik başarıyla serbest bırakıldı." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kimlik serbest bırakılırken bir hata oluştu.", variant: "destructive" });
    }
  });

  const handleCreateCredential = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const credentialData = {
      shipId: selectedShip,
      username: formData.get('username') as string,
      password: formData.get('password') as string
    };

    createCredentialMutation.mutate(credentialData);
  };

  const handleBulkUpload = () => {
    if (!csvContent.trim()) {
      toast({ title: "Hata", description: "CSV içeriği boş olamaz.", variant: "destructive" });
      return;
    }

    bulkUploadMutation.mutate({ shipId: selectedShip, csvContent });
  };

  const downloadTemplate = () => {
    const csv = "username,password\nuser1,pass123\nuser2,pass456\nuser3,pass789";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'credential_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Kimlik Havuzu</h1>
          <p className="text-gray-400 mt-1">Captive portal erişim kimliklerini yönetin</p>
        </div>
      </div>

      {/* Ship Selection */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ShipIcon className="h-5 w-5" />
            Gemi Seçimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedShip} onValueChange={setSelectedShip}>
                <SelectTrigger data-testid="select-ship">
                  <SelectValue placeholder="Gemi seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {ships.map((ship) => (
                    <SelectItem key={ship.id} value={ship.id}>
                      {ship.name} ({ship.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {credentialStats && (
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{credentialStats.available}</div>
                  <div className="text-gray-400">Kullanılabilir</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{credentialStats.assigned}</div>
                  <div className="text-gray-400">Atanmış</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{credentialStats.total}</div>
                  <div className="text-gray-400">Toplam</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credentials Management */}
      {selectedShip && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Key className="h-5 w-5" />
              Kimlik Havuzu
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-add-credential">
                    <Plus className="h-4 w-4 mr-2" />
                    Tekil Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Yeni Kimlik Oluştur</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCredential} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Kullanıcı Adı</Label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="kullanici1"
                        required
                        data-testid="input-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Şifre</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        data-testid="input-password"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="submit"
                        disabled={createCredentialMutation.isPending}
                        data-testid="button-save-credential"
                      >
                        {createCredentialMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-bulk-upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Toplu Yükle
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Toplu Kimlik Yükleme</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-300 text-sm">
                        CSV formatında kimlik bilgilerini yapıştırın
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadTemplate}
                        data-testid="button-download-template"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Şablon İndir
                      </Button>
                    </div>
                    <Textarea
                      placeholder="username,password&#10;user1,pass123&#10;user2,pass456"
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                      data-testid="textarea-csv-content"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsBulkUploadOpen(false);
                          setCsvContent('');
                        }}
                      >
                        İptal
                      </Button>
                      <Button
                        onClick={handleBulkUpload}
                        disabled={bulkUploadMutation.isPending || !csvContent.trim()}
                        data-testid="button-upload-csv"
                      >
                        {bulkUploadMutation.isPending ? 'Yükleniyor...' : 'Yükle'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingCredentials ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-2">Kimlikler yükleniyor...</p>
              </div>
            ) : credentials.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Bu gemi için henüz kimlik oluşturulmadı.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="font-mono text-sm">
                        <span className="text-blue-400">{credential.username}</span>
                        <span className="text-gray-500 mx-2">:</span>
                        <span className="text-gray-300">{credential.password}</span>
                      </div>
                      <Badge variant={credential.isAssigned ? "destructive" : "default"}>
                        {credential.isAssigned ? 'Atanmış' : 'Kullanılabilir'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {credential.isAssigned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unassignCredentialMutation.mutate(credential.id)}
                          disabled={unassignCredentialMutation.isPending}
                          data-testid={`button-unassign-credential-${credential.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCredentialMutation.mutate(credential.id)}
                        disabled={deleteCredentialMutation.isPending}
                        data-testid={`button-delete-credential-${credential.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}