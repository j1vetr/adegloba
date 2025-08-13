import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Shield, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    if (!settings?.paypal_client_id) return;

    const loadPayPalSDK = () => {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).paypal) {
          setPaypalLoaded(true);
          resolve();
          return;
        }

        const script = document.createElement('script');
        const clientId = settings.paypal_client_id;
        const environment = settings.paypal_environment || 'sandbox';
        
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=${intent}`;
        script.async = true;
        
        script.onload = () => {
          setPaypalLoaded(true);
          resolve();
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load PayPal SDK'));
        };
        
        document.body.appendChild(script);
      });
    };

    loadPayPalSDK().catch((error) => {
      console.error('PayPal SDK load error:', error);
      toast({
        title: "PayPal Hatası",
        description: "PayPal yüklenemedi. Lütfen sayfayı yenileyin.",
        variant: "destructive",
      });
    });
  }, [settings, currency, intent, toast]);

  const handlePayPalClick = async () => {
    if (!paypalLoaded || !(window as any).paypal) {
      toast({
        title: "PayPal Hazır Değil",
        description: "PayPal henüz yüklenemedi. Lütfen bekleyin.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create PayPal order
      const createResponse = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
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
      const orderId = createData.id;

      // Initialize PayPal checkout
      const paypal = (window as any).paypal;
      
      paypal.Buttons({
        createOrder: () => orderId,
        onApprove: async (data: any) => {
          try {
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
            
            if (captureData.status === 'COMPLETED') {
              onSuccess?.(data.orderID);
            } else {
              throw new Error('Payment not completed');
            }
          } catch (error) {
            console.error('Payment capture error:', error);
            onError?.(error);
          } finally {
            setIsLoading(false);
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          onError?.(err);
          setIsLoading(false);
        },
        onCancel: () => {
          setIsLoading(false);
          toast({
            title: "Ödeme İptal Edildi",
            description: "PayPal ödemesi iptal edildi.",
            variant: "default",
          });
        }
      }).render('#paypal-button-container');

    } catch (error) {
      console.error('PayPal initialization error:', error);
      setIsLoading(false);
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

      {/* PayPal Container - Hidden but required for PayPal SDK */}
      <div id="paypal-button-container" className="hidden"></div>

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
          PayPal ödeme sistemini kullanabilmek için admin panelinden PayPal ayarlarını yapılandırmanız gerekiyor.
        </p>
        <div className="text-amber-200 text-xs space-y-1">
          <p>• Admin Panel → Ayarlar → PayPal Integration</p>
          <p>• Client ID ve Client Secret değerlerini girin</p>
          <p>• Environment ayarını (Sandbox/Live) seçin</p>
        </div>
      </div>
    );
  }

  return renderCustomButton();
}