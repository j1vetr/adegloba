import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import {
  Bell,
  Send,
  Users,
  Ship as ShipIcon,
  Loader2,
  TestTube,
  MessageSquare,
  Target,
  Smartphone,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  target: 'all' | 'ships' | 'user';
  targetIds?: string[];
  requireInteraction?: boolean;
}

export default function PushNotifications() {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<NotificationPayload>({
    title: '',
    body: '',
    url: '',
    target: 'all',
    targetIds: [],
    requireInteraction: false
  });

  // Fetch ships for targeting
  const { data: ships, isLoading: shipsLoading } = useQuery({
    queryKey: ['/api/admin/ships'],
  });

  // Fetch users for targeting  
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (payload: NotificationPayload) => {
      const response = await apiRequest('POST', '/api/admin/push/send', payload);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '📢 Bildirim Gönderildi',
        description: `${data.sentCount || 0} kullanıcıya başarıyla gönderildi.`,
      });
      // Reset form
      setFormData({
        title: '',
        body: '',
        url: '',
        target: 'all',
        targetIds: [],
        requireInteraction: false
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Gönderim Hatası',
        description: error.message || 'Bildirim gönderilemedi.',
        variant: 'destructive',
      });
    },
  });

  // Send test notification
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/push/test');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '🧪 Test Bildirimi',
        description: 'Test bildirimi admin hesabına gönderildi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Test Hatası',
        description: error.message || 'Test bildirimi gönderilemedi.',
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: keyof NotificationPayload, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendNotification = () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      toast({
        title: '⚠️ Eksik Bilgi',
        description: 'Başlık ve mesaj alanları zorunludur.',
        variant: 'destructive',
      });
      return;
    }

    sendNotificationMutation.mutate(formData);
  };

  const getTargetBadge = () => {
    switch (formData.target) {
      case 'all':
        return (
          <Badge className="bg-blue-900/50 text-blue-200 border-blue-500/30">
            <Users className="h-3 w-3 mr-1" />
            Tüm Kullanıcılar
          </Badge>
        );
      case 'ships':
        return (
          <Badge className="bg-cyan-900/50 text-cyan-200 border-cyan-500/30">
            <ShipIcon className="h-3 w-3 mr-1" />
            Seçili Gemiler
          </Badge>
        );
      case 'user':
        return (
          <Badge className="bg-green-900/50 text-green-200 border-green-500/30">
            <Target className="h-3 w-3 mr-1" />
            Belirli Kullanıcı
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Push Bildirimleri</h1>
          <p className="text-slate-400">
            Kullanıcılara anlık bildirimler gönderin
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Notification Form */}
          <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-200">
                <MessageSquare className="h-5 w-5 mr-2 text-cyan-400" />
                Yeni Bildirim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">
                  Başlık *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="🚢 AdeGloba Starlink Bildirimi"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  maxLength={50}
                />
                <p className="text-xs text-slate-500">
                  {formData.title.length}/50 karakter
                </p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="body" className="text-slate-300">
                  Mesaj *
                </Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => handleInputChange('body', e.target.value)}
                  placeholder="Paketinizin süresi yakında dolacak. Yenilemeyi unutmayın!"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
                  maxLength={200}
                />
                <p className="text-xs text-slate-500">
                  {formData.body.length}/200 karakter
                </p>
              </div>

              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-slate-300">
                  Yönlendirme URL (İsteğe bağlı)
                </Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="/paketler"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500">
                  Bildirimi tıkladığında açılacak sayfa
                </p>
              </div>

              {/* Target Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Hedef Kitle
                </Label>
                <Select
                  value={formData.target}
                  onValueChange={(value) => handleInputChange('target', value)}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                    <SelectItem value="ships">Belirli Gemiler</SelectItem>
                    <SelectItem value="user">Belirli Kullanıcı</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center mt-2">
                  {getTargetBadge()}
                </div>
              </div>

              {/* Ship Selection */}
              {formData.target === 'ships' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Gemiler
                  </Label>
                  <Select
                    value={formData.targetIds?.[0] || ''}
                    onValueChange={(value) => handleInputChange('targetIds', [value])}
                    disabled={shipsLoading}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                      <SelectValue placeholder="Gemi seçin..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {ships?.map((ship: any) => (
                        <SelectItem key={ship.id} value={ship.id}>
                          {ship.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* User Selection */}
              {formData.target === 'user' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Kullanıcı
                  </Label>
                  <Select
                    value={formData.targetIds?.[0] || ''}
                    onValueChange={(value) => handleInputChange('targetIds', [value])}
                    disabled={usersLoading}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                      <SelectValue placeholder="Kullanıcı seçin..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Send Button */}
              <Button
                onClick={handleSendNotification}
                disabled={sendNotificationMutation.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
              >
                {sendNotificationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Bildirimi Gönder
              </Button>

            </CardContent>
          </Card>

          {/* Quick Actions & Stats */}
          <div className="space-y-6">
            
            {/* Test Notification */}
            <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-200">
                  <TestTube className="h-5 w-5 mr-2 text-green-400" />
                  Test Bildirimi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm mb-4">
                  Admin hesabınıza test bildirimi gönderin
                </p>
                <Button
                  onClick={() => sendTestMutation.mutate()}
                  disabled={sendTestMutation.isPending}
                  variant="outline"
                  className="w-full border-green-500/50 text-green-200 hover:bg-green-900/30"
                >
                  {sendTestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Gönder
                </Button>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-200">
                  <MessageSquare className="h-5 w-5 mr-2 text-purple-400" />
                  Hızlı Şablonlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800/50"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      title: '⚠️ Paket Süresi Dolacak',
                      body: 'Starlink paketinizin süresi 3 gün içinde dolacak. Kesintisiz hizmet için yenileyin.',
                      url: '/paketler'
                    }));
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-2 text-yellow-400" />
                  Süre Dolumu Uyarısı
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800/50"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      title: '🎉 Yeni Paket Teklifleri',
                      body: 'Gemiler için özel indirimli Starlink paketleri! Hemen inceleyin.',
                      url: '/paketler'
                    }));
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  Promo Teklifi
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800/50"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      title: '🔧 Sistem Bakımı',
                      body: 'Planlı bakım nedeniyle geçici kesinti olabilir. Detaylar için web sitemizi ziyaret edin.',
                      url: '/destek'
                    }));
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-400" />
                  Bakım Duyurusu
                </Button>

              </CardContent>
            </Card>

            {/* Notification Info */}
            <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-200">
                  <Smartphone className="h-5 w-5 mr-2 text-slate-400" />
                  Bildirim Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center">
                  <Bell className="h-4 w-4 mr-2 text-cyan-400" />
                  <span>Push bildirimleri PWA ve modern tarayıcılarda çalışır</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-green-400" />
                  <span>Kullanıcılar bildirimleri kapatabilir</span>
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-2 text-purple-400" />
                  <span>Hedefleme gemi ve kullanıcı bazında yapılabilir</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}