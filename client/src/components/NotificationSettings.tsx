import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  Bell,
  BellOff,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  TestTube,
  Loader2,
  Info,
  Settings
} from 'lucide-react';

export function NotificationSettings() {
  console.log('🔔 NotificationSettings component rendering...');
  
  const {
    isSupported,
    isSubscribed,
    isPermissionGranted,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
    testNotification,
  } = usePushNotifications();
  
  console.log('🔔 Push notification state:', { isSupported, isSubscribed, isPermissionGranted });

  if (!isSupported) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-200">
            <BellOff className="h-5 w-5 mr-2 text-red-400" />
            Push Bildirimleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
            <div>
              <p className="text-red-200 font-medium">Desteklenmiyor</p>
              <p className="text-red-300 text-sm">
                Bu tarayıcı push bildirimleri desteklemiyor.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleToggleNotifications = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleTestNotification = async () => {
    try {
      await testNotification();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const getStatusBadge = () => {
    if (!isPermissionGranted) {
      return (
        <Badge variant="destructive" className="bg-red-900/50 text-red-200">
          <BellOff className="h-3 w-3 mr-1" />
          Kapalı
        </Badge>
      );
    }
    
    if (isSubscribed) {
      return (
        <Badge className="bg-green-900/50 text-green-200 border-green-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aktif
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-yellow-900/50 text-yellow-200 border-yellow-500/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Beklemede
      </Badge>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-slate-200">
            <Bell className="h-5 w-5 mr-2 text-cyan-400" />
            Push Bildirimleri
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Notification Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-cyan-400" />
            <div>
              <p className="text-slate-200 font-medium">Anlık Bildirimler</p>
              <p className="text-slate-400 text-sm">
                Starlink paket güncellemeleri ve önemli duyurular
              </p>
            </div>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading}
            className="data-[state=checked]:bg-cyan-500"
          />
        </div>

        {/* Permission Request */}
        {!isPermissionGranted && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <p className="text-yellow-200 font-medium">İzin Gerekli</p>
            </div>
            <p className="text-yellow-300 text-sm mb-4">
              Bildirim almak için tarayıcı izni vermeniz gerekiyor.
            </p>
            <Button
              onClick={requestPermission}
              variant="outline"
              size="sm"
              className="border-yellow-500/50 text-yellow-200 hover:bg-yellow-900/30"
              disabled={isLoading}
            >
              <Settings className="h-4 w-4 mr-2" />
              İzin Ver
            </Button>
          </div>
        )}

        {/* Test Notification */}
        {isSubscribed && (
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 font-medium">Test Bildirimi</p>
                <p className="text-blue-300 text-sm">
                  Bildirim sisteminin çalıştığını test edin
                </p>
              </div>
              <Button
                onClick={handleTestNotification}
                variant="outline"
                size="sm"
                className="border-blue-500/50 text-blue-200 hover:bg-blue-900/30"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Gönder
              </Button>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-slate-400 space-y-2">
              <p>
                <strong className="text-slate-300">Bildirimler şunları içerir:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Paket süresi dolum uyarıları</li>
                <li>Yeni paket teklifleri</li>
                <li>Sistem bakım duyuruları</li>
                <li>Önemli güvenlik güncellemeleri</li>
              </ul>
              <p className="text-xs text-slate-500 mt-3">
                Bildirimleri istediğiniz zaman kapatabilirsiniz.
              </p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}