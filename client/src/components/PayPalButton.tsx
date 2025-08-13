import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Shield, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreditCardDrawer from "./CreditCardDrawer";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: any) => void;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
  onSuccess,
  onError
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [showCardDrawer, setShowCardDrawer] = useState(false);
  const { toast } = useToast();

  // Load PayPal settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/payment');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error('Expected JSON response but got:', textResponse);
          throw new Error('Invalid response format: expected JSON');
        }
        
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load PayPal settings:', error);
        // Set empty settings to show configuration message
        setSettings({});
      }
    };
    loadSettings();
  }, []);

  // Load PayPal SDK
  useEffect(() => {
    if (!settings?.paypal_client_id || settings.paypal_client_id.trim() === '') {
      console.log('PayPal client ID not available, skipping SDK load');
      return;
    }

    const loadPayPalSDK = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if PayPal SDK is already loaded
        if ((window as any).paypal) {
          console.log('PayPal SDK already loaded');
          setPaypalLoaded(true);
          resolve();
          return;
        }

        // Remove any existing PayPal scripts to avoid conflicts
        const existingScripts = document.querySelectorAll('script[src*="paypal.com/sdk"]');
        existingScripts.forEach(script => script.remove());

        const script = document.createElement('script');
        const clientId = settings.paypal_client_id;
        const environment = settings.paypal_environment || 'sandbox';
        
        // Build PayPal SDK URL with proper parameters
        const sdkUrl = new URL('https://www.paypal.com/sdk/js');
        sdkUrl.searchParams.set('client-id', clientId);
        sdkUrl.searchParams.set('currency', currency);
        sdkUrl.searchParams.set('intent', intent);
        sdkUrl.searchParams.set('components', 'buttons');
        
        // Add sandbox parameter for sandbox environment
        if (environment === 'sandbox') {
          sdkUrl.searchParams.set('disable-funding', 'venmo');
        }
        
        script.src = sdkUrl.toString();
        script.async = true;
        script.defer = true;
        
        console.log('Loading PayPal SDK from:', script.src);
        
        script.onload = () => {
          console.log('PayPal SDK loaded successfully');
          // Wait a moment for PayPal to initialize
          setTimeout(() => {
            if ((window as any).paypal) {
              setPaypalLoaded(true);
              resolve();
            } else {
              reject(new Error('PayPal object not available after SDK load'));
            }
          }, 100);
        };
        
        script.onerror = (error) => {
          console.error('PayPal SDK script failed to load:', error);
          // Check if it's a CORS or client-id validation error
          reject(new Error(`PayPal SDK load failed. Please check client-id: ${clientId.substring(0, 20)}...`));
        };
        
        document.head.appendChild(script);
      });
    };

    const timeoutId = setTimeout(() => {
      loadPayPalSDK().catch((error) => {
        console.error('PayPal SDK load error:', error);
        toast({
          title: "PayPal Yapılandırma Hatası",
          description: "PayPal Client ID geçersiz veya hatalı. Lütfen admin panelinden doğru sandbox Client ID girin.",
          variant: "destructive",
        });
      });
    }, 100); // Small delay to ensure settings are properly loaded

    return () => clearTimeout(timeoutId);
  }, [settings?.paypal_client_id, settings?.paypal_environment, currency, intent, toast]);

  const handlePayPalClick = async () => {
    if (!paypalLoaded || !(window as any).paypal) {
      toast({
        title: "PayPal Hazır Değil",
        description: "PayPal henüz yüklenemedi. Lütfen bekleyin veya sayfayı yenileyin.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Clear any existing PayPal button container
      const container = document.getElementById('paypal-button-container');
      if (container) {
        container.innerHTML = '';
        container.style.display = 'block';
      }

      // Initialize PayPal checkout directly
      const paypal = (window as any).paypal;
      
      paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay',
          height: 40
        },
        createOrder: async () => {
          try {
            // Create PayPal order
            const createResponse = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: parseFloat(amount).toString(),
                currency: currency,
                intent: 'CAPTURE',
              }),
            });

            if (!createResponse.ok) {
              const contentType = createResponse.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const errorData = await createResponse.json();
                throw new Error(errorData.message || 'Order creation failed');
              } else {
                const errorText = await createResponse.text();
                throw new Error(`Order creation failed: ${errorText}`);
              }
            }

            const createData = await createResponse.json();
            console.log('PayPal order created:', createData.id);
            return createData.id;
          } catch (error) {
            console.error('Error creating PayPal order:', error);
            toast({
              title: "Sipariş Oluşturma Hatası",
              description: error instanceof Error ? error.message : "Bilinmeyen hata",
              variant: "destructive",
            });
            throw error;
          }
        },
        onApprove: async (data: any) => {
          try {
            console.log('PayPal payment approved:', data.orderID);
            
            // Capture the payment
            const captureResponse = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: data.orderID,
              }),
            });

            if (!captureResponse.ok) {
              const contentType = captureResponse.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const errorData = await captureResponse.json();
                throw new Error(errorData.message || 'Payment capture failed');
              } else {
                const errorText = await captureResponse.text();
                throw new Error(`Payment capture failed: ${errorText}`);
              }
            }

            const captureData = await captureResponse.json();
            console.log('PayPal payment captured:', captureData);
            
            if (captureData.status === 'COMPLETED') {
              toast({
                title: "Ödeme Başarılı",
                description: "PayPal ödemesi tamamlandı.",
              });
              onSuccess?.(data.orderID);
            } else {
              throw new Error('Payment not completed');
            }
          } catch (error) {
            console.error('Payment capture error:', error);
            toast({
              title: "Ödeme Hatası",
              description: error instanceof Error ? error.message : "Ödeme tamamlanamadı",
              variant: "destructive",
            });
            onError?.(error);
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          toast({
            title: "PayPal Hatası",
            description: "Ödeme işlemi sırasında bir hata oluştu.",
            variant: "destructive",
          });
          onError?.(err);
        },
        onCancel: () => {
          toast({
            title: "Ödeme İptal Edildi",
            description: "PayPal ödemesi iptal edildi.",
            variant: "default",
          });
        }
      }).render('#paypal-button-container').then(() => {
        setIsLoading(false);
        console.log('PayPal buttons rendered successfully');
      }).catch((error: any) => {
        console.error('PayPal render error:', error);
        setIsLoading(false);
        toast({
          title: "PayPal Render Hatası",
          description: "PayPal butonları yüklenemedi.",
          variant: "destructive",
        });
      });

    } catch (error) {
      console.error('PayPal initialization error:', error);
      setIsLoading(false);
      toast({
        title: "PayPal Başlatma Hatası",
        description: error instanceof Error ? error.message : "PayPal başlatılamadı",
        variant: "destructive",
      });
      onError?.(error);
    }
  };

  // Custom styled PayPal/Credit Card button
  const renderCustomButton = () => (
    <div className="space-y-3">
      {/* Main Payment Button */}
      <Button
        onClick={handlePayPalClick}
        disabled={isLoading || !paypalLoaded || !settings?.paypal_client_id}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 rounded-xl text-base transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden"
        data-testid="paypal-payment-button"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Ödeme İşleniyor...
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-full">
              <CreditCard className="h-5 w-5 mr-2" />
              <span className="font-bold">PayPal ile Güvenli Ödeme</span>
            </div>
            <div className="text-xs text-blue-100 mt-1">
              Kredi Kartı & PayPal Hesabı - {formatPrice(amount)}
            </div>
          </>
        )}
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 animate-pulse"></div>
      </Button>

      {/* Credit Card Alternative Button */}
      <Button
        onClick={() => setShowCardDrawer(true)}
        variant="outline"
        className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white py-3 rounded-xl text-sm transition-all duration-200"
        data-testid="credit-card-button"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Kart ile Ödeme (Alternatif)
      </Button>

      {/* Payment Methods Info */}
      <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
        <div className="flex items-center space-x-1">
          <Shield className="h-3 w-3" />
          <span>Güvenli Ödeme</span>
        </div>
        <div className="flex items-center space-x-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>256-bit SSL</span>
        </div>
      </div>

      {/* PayPal Container - Visible when PayPal buttons are rendered */}
      <div id="paypal-button-container" className="mt-2"></div>

      {/* Accepted Payment Methods */}
      <div className="text-center">
        <p className="text-xs text-slate-500 mb-2">Güvenli Ödeme Yöntemleri:</p>
        <div className="flex items-center justify-center space-x-2 text-slate-400">
          <div className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.067 8.478c.492.5.771 1.217.771 1.942 0 .69-.279 1.411-.771 1.942L12 20.428l-8.067-8.066c-.492-.531-.771-1.252-.771-1.942 0-.725.279-1.442.771-1.942C4.453 7.957 5.615 7.5 6.933 7.5c1.357 0 2.481.457 3.067.978L12 10.236l2-1.758C14.586 7.957 15.71 7.5 17.067 7.5c1.318 0 2.48.457 3 .978z"/>
            </svg>
            PayPal
          </div>
          <span className="text-xs bg-slate-700 text-white px-2 py-1 rounded font-medium">Visa</span>
          <span className="text-xs bg-slate-700 text-white px-2 py-1 rounded font-medium">MC</span>
          <span className="text-xs bg-slate-700 text-white px-2 py-1 rounded font-medium">Amex</span>
          <span className="text-xs bg-slate-700 text-white px-2 py-1 rounded font-medium">Discover</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Tüm ödemeler SSL ile şifrelenir</p>
      </div>
    </div>
  );

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return `$${numPrice.toFixed(2)}`;
  };

  // Show loading state while PayPal is initializing
  if (!settings) {
    return (
      <div className="w-full py-4 flex items-center justify-center text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Ödeme sistemi yükleniyor...
      </div>
    );
  }

  // Show error if PayPal is not configured
  if (!settings.paypal_client_id || settings.paypal_client_id.trim() === '') {
    return (
      <div className="w-full p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
        <h3 className="text-amber-400 text-lg font-semibold mb-2">PayPal Yapılandırması Gerekli</h3>
        <p className="text-amber-300 text-sm mb-3">
          PayPal ödemelerini kabul etmek için sandbox veya live PayPal hesabınızdan API anahtarlarını yapılandırmanız gerekiyor.
        </p>
        <div className="text-amber-200 text-xs space-y-2">
          <div className="bg-amber-500/10 p-3 rounded border border-amber-500/20">
            <p className="font-medium text-amber-300 mb-1">Yapılandırma Adımları:</p>
            <p>1. Admin Panel → Ayarlar → PayPal Integration</p>
            <p>2. PayPal Developer Console'dan Client ID alın</p>
            <p>3. Client Secret anahtarını girin</p>
            <p>4. Sandbox veya Live environment seçin</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {renderCustomButton()}
      
      {/* Credit Card Drawer */}
      <CreditCardDrawer
        isOpen={showCardDrawer}
        onClose={() => setShowCardDrawer(false)}
        amount={amount}
        currency={currency}
        onSuccess={(paymentData) => {
          setShowCardDrawer(false);
          onSuccess?.(paymentData.orderId || 'card-payment-success');
        }}
        onError={(error) => {
          setShowCardDrawer(false);
          onError?.(error);
        }}
      />
    </>
  );
}