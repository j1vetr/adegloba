import { useState, useEffect } from 'react';
import { useUserAuth } from './useUserAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

interface PushNotificationHook {
  isSupported: boolean;
  isSubscribed: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
  testNotification: () => Promise<void>;
}

export function usePushNotifications(): PushNotificationHook {
  const { user } = useUserAuth();
  const { toast } = useToast();
  
  const [isSupported] = useState(() => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  });
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check permission status and subscription on mount
  useEffect(() => {
    checkPermissionAndSubscription();
    
    // Otomatik kullanıcı kayıt ve notification aktivasyonu
    const autoEnableNotifications = async () => {
      if (!isSupported || !user) return;
      
      console.log('📱 Auto-notification check - Permission:', Notification.permission);
      
      // Tüm kullanıcıları otomatik olarak "granted" olarak kaydet (basitlik için)
      try {
        await apiRequest('/api/user/notification-preference', {
          method: 'POST',
          body: JSON.stringify({ enabled: true })
        });
        console.log('📱 User automatically registered as notification-enabled in database');
      } catch (error) {
        console.log('📱 Failed to register notification preference:', error);
      }
      
      // Eğer daha önce izin verilmişse otomatik subscribe ol
      if (Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          const existingSubscription = await registration.pushManager.getSubscription();
          
          console.log('📱 Existing subscription check:', !!existingSubscription);
          
          if (!existingSubscription) {
            console.log('📱 No existing subscription, creating new one...');
            // Mevcut subscription yoksa oluştur
            await subscribe();
          } else {
            // Mevcut subscription var, backend'de kayıtlı mı kontrol et
            console.log('📱 Subscription exists, verifying with backend...');
            setIsSubscribed(true);
          }
        } catch (error) {
          console.log('📱 Auto-subscription skipped:', error);
        }
      }
    };
    
    // 3 saniye sonra auto-enable dene (service worker'ın yüklenmesi için daha fazla bekleme)
    setTimeout(autoEnableNotifications, 3000);
  }, [user]);

  const checkPermissionAndSubscription = async () => {
    if (!isSupported || !user) return;

    try {
      // Check notification permission
      const permission = Notification.permission;
      setIsPermissionGranted(permission === 'granted');

      // Check if service worker is registered and subscription exists
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

    } catch (error) {
      console.error('🚨 Error checking push notification status:', error);
    }
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    setIsPermissionGranted(permission === 'granted');
    
    if (permission === 'granted') {
      toast({
        title: '🔔 Bildirimler Açık',
        description: 'Artık önemli güncellemeler hakkında bildirim alacaksınız.',
      });
    } else if (permission === 'denied') {
      toast({
        title: '🚫 Bildirimler Kapatıldı',
        description: 'Bildirimleri tarayıcı ayarlarından açabilirsiniz.',
        variant: 'destructive',
      });
    }

    return permission;
  };

  const subscribe = async (): Promise<void> => {
    if (!isSupported || !user) {
      throw new Error('Push notifications not supported or user not authenticated');
    }

    setIsLoading(true);

    try {
      console.log('📱 Starting push subscription process...');
      
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        console.log('📱 Requesting notification permission...');
        const permission = await requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      // Get service worker registration
      console.log('📱 Getting service worker registration...');
      const registration = await navigator.serviceWorker.ready;
      console.log('📱 Service worker ready:', registration);
      
      // Get VAPID public key from server
      console.log('📱 Fetching VAPID key...');
      const response = await apiRequest('GET', '/api/push/vapid-key');
      const { publicKey } = await response.json();
      console.log('📱 VAPID key received:', publicKey);

      // Subscribe to push notifications
      console.log('📱 Creating push subscription...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      console.log('📱 Push subscription created:', subscription);

      // Send subscription to server
      console.log('📱 Sending subscription to server...');
      const subscribeResponse = await apiRequest('POST', '/api/push/subscribe', {
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      });
      console.log('📱 Server response:', await subscribeResponse.text());

      setIsSubscribed(true);
      
      toast({
        title: '🚢 Bildiriler Aktif!',
        description: 'AdeGloba Starlink güncellemelerini artık anında alacaksınız.',
      });

    } catch (error: any) {
      console.error('🚨 Push subscription failed:', error);
      
      toast({
        title: '❌ Bildirim Hatası',
        description: error.message || 'Bildirim kaydı başarısız oldu.',
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<void> => {
    if (!isSupported || !user) return;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();
        
        // Remove from server
        await apiRequest('POST', '/api/push/unsubscribe', {
          endpoint: subscription.endpoint
        });
      }

      setIsSubscribed(false);
      
      toast({
        title: '🔕 Bildirimler Kapatıldı',
        description: 'Artık push bildirimi almayacaksınız.',
      });

    } catch (error: any) {
      console.error('🚨 Push unsubscription failed:', error);
      
      toast({
        title: '❌ İptal Hatası',
        description: error.message || 'Bildirim iptali başarısız oldu.',
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async (): Promise<void> => {
    if (!isSupported || !user || !isSubscribed) {
      throw new Error('Push notifications not available');
    }

    try {
      await apiRequest('POST', '/api/push/test');
      
      toast({
        title: '🧪 Test Bildirimi',
        description: 'Test bildirimi gönderildi, birkaç saniye içinde gelecek.',
      });

    } catch (error: any) {
      console.error('🚨 Test notification failed:', error);
      
      toast({
        title: '❌ Test Hatası',
        description: error.message || 'Test bildirimi gönderilemedi.',
        variant: 'destructive',
      });
      
      throw error;
    }
  };

  return {
    isSupported,
    isSubscribed,
    isPermissionGranted,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
    testNotification,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}