import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  Bell, BellOff, Smartphone, AlertTriangle, CheckCircle,
  TestTube, Loader2, Info, Settings,
} from 'lucide-react';

export function NotificationSettings() {
  const {
    isSupported, isSubscribed, isPermissionGranted, isLoading,
    subscribe, unsubscribe, requestPermission, testNotification,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-900">
            <BellOff className="h-5 w-5 mr-2 text-rose-500" />
            Push Bildirimleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-rose-500 mr-3 flex-shrink-0" />
            <div>
              <p className="text-rose-900 font-medium">Desteklenmiyor</p>
              <p className="text-rose-700 text-sm">Bu tarayıcı push bildirimleri desteklemiyor.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleToggleNotifications = async () => {
    try {
      if (isSubscribed) await unsubscribe();
      else await subscribe();
    } catch {}
  };

  const handleTestNotification = async () => {
    try { await testNotification(); } catch {}
  };

  const getStatusBadge = () => {
    if (!isPermissionGranted) {
      return (
        <Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-50">
          <BellOff className="h-3 w-3 mr-1" /> Kapalı
        </Badge>
      );
    }
    if (isSubscribed) {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
          <CheckCircle className="h-3 w-3 mr-1" /> Aktif
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50">
        <AlertTriangle className="h-3 w-3 mr-1" /> Beklemede
      </Badge>
    );
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-slate-900 text-base">
            <Bell className="h-5 w-5 mr-2 text-[#7C5E00]" />
            Push Bildirimleri
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFF6D6] flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-[#7C5E00]" />
            </div>
            <div>
              <p className="text-slate-900 font-medium text-sm">Anlık Bildirimler</p>
              <p className="text-slate-500 text-xs">Paket güncellemeleri ve önemli duyurular</p>
            </div>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading}
            className="data-[state=checked]:bg-[#FFDD57] data-[state=checked]:[&>span]:bg-slate-900"
          />
        </div>

        {/* Permission */}
        {!isPermissionGranted && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
              <p className="text-amber-900 font-medium text-sm">İzin Gerekli</p>
            </div>
            <p className="text-amber-700 text-xs mb-3">
              Bildirim almak için tarayıcı izni vermeniz gerekiyor.
            </p>
            <Button
              onClick={requestPermission}
              size="sm"
              className="bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold border-0"
              disabled={isLoading}
            >
              <Settings className="h-4 w-4 mr-2" /> İzin Ver
            </Button>
          </div>
        )}

        {/* Test */}
        {isSubscribed && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-900 font-medium text-sm">Test Bildirimi</p>
                <p className="text-blue-700 text-xs">Bildirim sisteminin çalıştığını test edin</p>
              </div>
              <Button
                onClick={handleTestNotification}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-white"
                disabled={isLoading}
              >
                {isLoading
                  ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  : <TestTube className="h-4 w-4 mr-2" />}
                Test Gönder
              </Button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <Info className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-600 space-y-1.5">
              <p><strong className="text-slate-900">Bildirimler şunları içerir:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Paket süresi dolum uyarıları</li>
                <li>Yeni paket teklifleri</li>
                <li>Sistem bakım duyuruları</li>
                <li>Önemli güvenlik güncellemeleri</li>
              </ul>
              <p className="text-[11px] text-slate-400 mt-2">Bildirimleri istediğiniz zaman kapatabilirsiniz.</p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
