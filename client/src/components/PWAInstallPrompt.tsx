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
        
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          return;
        }
      }

      // Show prompt after 30 seconds to let user explore first
      const timer = setTimeout(() => {
        if (deferredPrompt) {
          setShowPrompt(true);
        }
      }, 30000);

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
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA install accepted');
      } else {
        console.log('❌ PWA install dismissed');
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('🚨 PWA install error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md bg-gradient-to-r from-cyan-900/90 to-blue-900/90 border-cyan-500/50 backdrop-blur-sm animate-slide-in-up">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-1">
              🚢 AdeGloba Starlink Uygulamasını Yükle
            </h3>
            <p className="text-xs text-cyan-100 mb-3">
              Hızlı erişim için telefon ve bilgisayarınıza yükleyin. Çevrimdışı çalışır!
            </p>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs px-3 py-1.5"
              >
                <Download className="w-3 h-3 mr-1" />
                Yükle
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-cyan-200 hover:bg-cyan-800/50 text-xs px-2 py-1.5"
              >
                Sonra
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 text-cyan-300 hover:bg-cyan-800/50 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}