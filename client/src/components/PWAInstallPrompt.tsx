import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
      
      if (isStandalone || isInWebAppiOS || isInWebAppChrome) {
        setIsInstalled(true);
        return;
      }

      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Show again after 3 days for mobile users
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const showAfterDays = isMobile ? 3 : 7;
        
        if (daysSinceDismissed < showAfterDays) {
          return;
        }
      }

      // Only show for Android devices
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      if (!isAndroid) {
        return;
      }

      const timer = setTimeout(() => {
        if (deferredPrompt || isAndroid) {
          setShowPrompt(true);
        }
      }, 5000);

      return () => clearTimeout(timer);
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      checkInstalled();
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ PWA install accepted');
          
          // PWA yüklendikten hemen sonra notification permission iste
          setTimeout(async () => {
            try {
              if ('Notification' in window && Notification.permission === 'default') {
                console.log('📱 PWA installed, requesting notification permission...');
                const permission = await Notification.requestPermission();
                
                if (permission === 'granted') {
                  console.log('🔔 Notification permission granted after PWA install');
                  // Sistem otomatik olarak push notification'ları aktif edecek
                } else {
                  console.log('🚫 Notification permission denied after PWA install');
                }
              }
            } catch (error) {
              console.log('📱 Auto notification permission request failed:', error);
            }
          }, 1500); // 1.5 saniye bekle (PWA install animasyonu bitsin)
          
        } else {
          console.log('❌ PWA install dismissed');
          localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('🚨 PWA install error:', error);
      }
    } else {
      // Mobile fallback - show instructions
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        showMobileInstallInstructions();
      }
    }
  };

  const showMobileInstallInstructions = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    let instructions = '';
    if (isAndroid) {
      instructions = 'Chrome menüsünden "Ana ekrana ekle" seçeneğini kullanın.';
    } else if (isiOS) {
      instructions = 'Safari paylaşım butonundan "Ana Ekrana Ekle" seçeneğini kullanın.';
    } else {
      instructions = 'Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini kullanın.';
    }
    
    alert(`📱 AdeGloba Starlink Uygulamasını Ana Ekrana Ekleyin!\n\n${instructions}\n\nBu sayede uygulamaya daha hızlı erişebilirsiniz.`);
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <Card className={`fixed z-50 mx-auto backdrop-blur-sm ${
      isMobile 
        ? 'bottom-0 left-0 right-0 rounded-t-xl rounded-b-none bg-gradient-to-t from-slate-900/95 to-slate-800/95 border-t border-cyan-500/50 border-x-0 border-b-0' 
        : 'bottom-4 left-4 right-4 max-w-md rounded-lg bg-gradient-to-r from-cyan-900/90 to-blue-900/90 border-cyan-500/50'
    } animate-slide-in-up`}>
      <CardContent className={isMobile ? "p-6 pb-8" : "p-4"}>
        <div className={`flex items-start ${isMobile ? 'space-x-4' : 'space-x-3'}`}>
          <div className="flex-shrink-0">
            <div className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} rounded-lg bg-cyan-500/20 flex items-center justify-center`}>
              {isMobile ? (
                <Smartphone className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-cyan-400`} />
              ) : (
                <Monitor className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-cyan-400`} />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`${isMobile ? 'text-lg' : 'text-sm'} font-semibold text-white mb-2`}>
              🚢 AdeGloba Starlink {isMobile ? 'Uygulamasını Ana Ekrana Ekle' : 'Uygulamasını Yükle'}
            </h3>
            <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-cyan-100 mb-4`}>
              {isMobile 
                ? 'Hızlı erişim için telefona yükleyin. Çevrimdışı çalışır ve daha hızlı açılır!' 
                : 'Hızlı erişim için telefon ve bilgisayarınıza yükleyin. Çevrimdışı çalışır!'
              }
            </p>
            
            <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-2'}`}>
              <Button
                onClick={handleInstall}
                size={isMobile ? "default" : "sm"}
                className={`bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold ${
                  isMobile ? 'px-6 py-2 text-base' : 'text-xs px-3 py-1.5'
                }`}
              >
                <Download className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-3 h-3 mr-1'}`} />
                {isMobile ? 'Ana Ekrana Ekle' : 'Yükle'}
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size={isMobile ? "default" : "sm"}
                className={`text-cyan-200 hover:bg-cyan-800/50 ${
                  isMobile ? 'px-4 py-2 text-base' : 'text-xs px-2 py-1.5'
                }`}
              >
                Sonra
              </Button>
            </div>
          </div>
          
          {!isMobile && (
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 text-cyan-300 hover:bg-cyan-800/50 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}