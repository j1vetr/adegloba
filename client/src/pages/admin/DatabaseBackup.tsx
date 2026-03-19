import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Clock,
  FileArchive,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Backup {
  filename: string;
  size: number;
  createdAt: string;
  path: string;
}

export default function DatabaseBackup() {
  const { toast } = useToast();
  const [restoring, setRestoring] = useState<string | null>(null);

  // Fetch backups list
  const { data: backups, isLoading, refetch } = useQuery<Backup[]>({
    queryKey: ['/api/admin/database/backups']
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/database/backup', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Veritabanı yedeği oluşturuldu',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Yedekleme başarısız oldu',
        variant: 'destructive',
      });
    },
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      setRestoring(filename);
      const response = await apiRequest('POST', '/api/admin/database/restore', {
        filename
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Veritabanı geri yüklendi. Sayfa yenileniyor...',
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Geri yükleme başarısız oldu',
        variant: 'destructive',
      });
      setRestoring(null);
    },
  });

  // Send backup via email mutation
  const sendBackupEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/database/backup/send-email', {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'E-posta Gönderildi',
        description: data.message || 'Yedek e-posta ile iletildi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'E-posta gönderilemedi. E-posta ayarlarını kontrol edin.',
        variant: 'destructive',
      });
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      const response = await apiRequest('DELETE', `/api/admin/database/backups/${filename}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Yedek dosyası silindi',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Silme işlemi başarısız oldu',
        variant: 'destructive',
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadBackup = (filename: string) => {
    window.open(`/api/admin/database/backups/${filename}`, '_blank');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-400" />
              Veritabanı Yedekleme
            </h1>
            <p className="text-slate-400">Veritabanı yedeklerini oluşturun ve geri yükleyin</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="admin-button-secondary"
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="button-refresh-backups"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-cyan-700 text-cyan-400 hover:bg-cyan-950/40"
              onClick={() => sendBackupEmailMutation.mutate()}
              disabled={sendBackupEmailMutation.isPending}
              data-testid="button-send-backup-email"
              title="Şu an yedek alır ve admin e-postasına gönderir"
            >
              {sendBackupEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  E-posta ile Yedekle
                </>
              )}
            </Button>
            <Button
              className="admin-button-primary"
              onClick={() => createBackupMutation.mutate()}
              disabled={createBackupMutation.isPending}
              data-testid="button-create-backup"
            >
              {createBackupMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <FileArchive className="w-4 h-4 mr-2" />
                  Yeni Yedek Oluştur
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Warning Card */}
        <Card className="admin-card border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">⚠️ Önemli Uyarılar</h3>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Geri yükleme işlemi mevcut veritabanını <strong>tamamen siler</strong> ve yedekle değiştirir</li>
                  <li>• İşlemden önce mutlaka yeni bir yedek oluşturun</li>
                  <li>• Geri yükleme sırasında sistem kullanılamaz olacaktır</li>
                  <li>• Production ortamında bu işlemi yapmadan önce bakım modu açın</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backups List */}
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-purple-400" />
              Mevcut Yedekler
            </CardTitle>
            <CardDescription className="text-slate-400">
              Toplam {backups?.length || 0} yedek dosyası
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="ml-3 text-slate-300">Yedekler yükleniyor...</span>
              </div>
            ) : backups && backups.length > 0 ? (
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div
                    key={backup.filename}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-blue-500/30 transition-all"
                    data-testid={`backup-item-${backup.filename}`}
                  >
                    <div className="flex items-start gap-3 mb-3 sm:mb-0">
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <FileArchive className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">{backup.filename}</h3>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {formatFileSize(backup.size)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(backup.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="admin-button-secondary flex-1 sm:flex-none"
                        onClick={() => downloadBackup(backup.filename)}
                        data-testid={`button-download-${backup.filename}`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        İndir
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-900 text-green-400 hover:bg-green-950/50 flex-1 sm:flex-none"
                            disabled={restoreBackupMutation.isPending}
                            data-testid={`button-restore-${backup.filename}`}
                          >
                            {restoring === backup.filename ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Geri Yükleniyor...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Geri Yükle
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-red-400" />
                              Veritabanını Geri Yükle?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-300">
                              <strong className="text-red-400">DİKKAT:</strong> Bu işlem mevcut tüm veritabanını silecek ve 
                              <strong className="text-white"> {backup.filename}</strong> yedeğiyle değiştirecektir.
                              <br /><br />
                              Bu işlem <strong>geri alınamaz</strong>. Devam etmeden önce yeni bir yedek oluşturun.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
                              İptal
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => restoreBackupMutation.mutate(backup.filename)}
                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                            >
                              Evet, Geri Yükle
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-900 text-red-400 hover:bg-red-950/50"
                            data-testid={`button-delete-${backup.filename}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Yedeği Sil?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-300">
                              <strong>{backup.filename}</strong> yedeğini silmek istediğinizden emin misiniz?
                              Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
                              İptal
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBackupMutation.mutate(backup.filename)}
                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileArchive className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-4">Henüz yedek oluşturulmamış</p>
                <Button
                  className="admin-button-primary"
                  onClick={() => createBackupMutation.mutate()}
                  disabled={createBackupMutation.isPending}
                >
                  <FileArchive className="w-4 h-4 mr-2" />
                  İlk Yedeği Oluştur
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto Backup Info Card */}
        <Card className="admin-card border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">🕐 Otomatik E-posta Yedekleme</h3>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Her gece <strong className="text-cyan-400">01:00</strong> (İstanbul saati) otomatik yedek alınır</li>
                  <li>• Yedek, admin e-posta adresine SQL dosyası olarak gönderilir</li>
                  <li>• <strong className="text-cyan-400">E-posta ile Yedekle</strong> butonu ile istediğiniz zaman manuel olarak tetikleyebilirsiniz</li>
                  <li>• E-posta gönderimi için SMTP ayarlarının aktif olması gerekir</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="admin-card border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">💡 Yedekleme İpuçları</h3>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Önemli işlemlerden önce mutlaka yedek alın</li>
                  <li>• E-posta ile gelen yedekleri bilgisayarınıza veya cloud'a kaydedin</li>
                  <li>• Eski sunucu yedeklerini manuel olarak silin veya arşivleyin</li>
                  <li>• Test amaçlı geri yüklemeleri staging ortamında yapın</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
