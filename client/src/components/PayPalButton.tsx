import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  couponCode?: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    paypal: any;
  }
}

export default function PayPalButton({
  amount,
  currency,
  intent,
  couponCode,
  onSuccess,
  onError
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const sdkInstanceRef = useRef<any>(null);
  const paymentSessionRef = useRef<any>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/payment');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format');
        }
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load PayPal settings:', error);
        setSettings({});
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!settings?.paypal_client_id || settings.paypal_client_id.trim() === '') return;

    const fetchClientToken = async () => {
      try {
        const response = await fetch('/api/paypal/setup');
        if (!response.ok) throw new Error('Failed to get client token');
        const data = await response.json();
        if (data.clientToken) {
          setClientToken(data.clientToken);
        }
      } catch (error) {
        console.error('Failed to fetch client token:', error);
        toast({
          title: "PayPal Yapılandırma Hatası",
          description: "PayPal client token alınamadı. Lütfen ayarları kontrol edin.",
          variant: "destructive",
        });
      }
    };
    fetchClientToken();
  }, [settings?.paypal_client_id, toast]);

  useEffect(() => {
    if (!clientToken || !settings?.paypal_client_id) return;

    const environment = settings.paypal_environment || 'sandbox';
    const isProduction = environment === 'live' || environment === 'production';
    const sdkBaseUrl = isProduction
      ? 'https://www.paypal.com/web-sdk/v6/core'
      : 'https://www.sandbox.paypal.com/web-sdk/v6/core';

    const loadV6SDK = async () => {
      if (window.paypal?.createInstance) {
        await initializeV6();
        return;
      }

      const existingScripts = document.querySelectorAll('script[src*="paypal.com"]');
      existingScripts.forEach(script => script.remove());
      delete window.paypal;

      const script = document.createElement('script');
      script.src = sdkBaseUrl;
      script.async = true;

      script.onload = async () => {
        console.log('PayPal v6 SDK loaded');
        await initializeV6();
      };

      script.onerror = (error) => {
        console.error('PayPal v6 SDK load failed:', error);
        toast({
          title: "PayPal SDK Hatası",
          description: "PayPal v6 SDK yüklenemedi.",
          variant: "destructive",
        });
      };

      document.head.appendChild(script);
    };

    const initializeV6 = async () => {
      try {
        if (!window.paypal?.createInstance) {
          console.error('PayPal v6 createInstance not available');
          return;
        }

        const sdkInstance = await window.paypal.createInstance({
          clientToken: clientToken,
          components: ["paypal-payments"],
          pageType: "checkout",
          clientMetadataId: crypto.randomUUID(),
        });

        sdkInstanceRef.current = sdkInstance;
        console.log('PayPal v6 SDK instance created');

        const eligibleMethods = await sdkInstance.findEligibleMethods({
          currencyCode: currency,
        });

        if (eligibleMethods.isEligible("paypal")) {
          setupPaymentSession(sdkInstance);
          setSdkReady(true);
        } else {
          console.warn('PayPal payment method not eligible');
          toast({
            title: "PayPal Kullanılamıyor",
            description: "PayPal şu an bu para birimi için kullanılamıyor.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('PayPal v6 initialization error:', error);
        toast({
          title: "PayPal Başlatma Hatası",
          description: "PayPal v6 SDK başlatılamadı. Lütfen sayfayı yenileyin.",
          variant: "destructive",
        });
      }
    };

    loadV6SDK();

    return () => {
      paymentSessionRef.current = null;
      sdkInstanceRef.current = null;
    };
  }, [clientToken, settings?.paypal_client_id, settings?.paypal_environment, currency, toast]);

  const setupPaymentSession = useCallback((sdkInstance: any) => {
    const session = sdkInstance.createPayPalOneTimePaymentSession({
      createOrder: async () => {
        try {
          const createResponse = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: parseFloat(amount).toString(),
              currency: currency,
              intent: intent.toUpperCase() || 'CAPTURE',
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
          console.log('PayPal v6 order created:', createData.id);
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
          console.log('PayPal v6 payment approved:', data.orderID);

          const captureResponse = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
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
          console.log('PayPal v6 payment captured:', captureData);

          const orderStatus = captureData.status;
          const captureDetails = captureData.purchase_units?.[0]?.payments?.captures?.[0];
          const captureStatus = captureDetails?.status;

          console.log('PayPal v6 strict validation:', {
            orderStatus,
            captureStatus,
            captureId: captureDetails?.id,
            processorResponse: captureDetails?.processor_response
          });

          if (captureStatus === 'DECLINED') {
            throw new Error('Ödeme reddedildi - kart bilgilerini kontrol edin');
          }

          if (orderStatus === 'COMPLETED' && (!captureDetails || captureStatus === 'COMPLETED')) {
            toast({
              title: "Ödeme Kontrol Ediliyor",
              description: "PayPal ödemesi doğrulandı, işleminiz tamamlanıyor...",
            });

            try {
              const completeResponse = await fetch('/api/cart/complete-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paypalOrderId: data.orderID,
                  couponCode: couponCode || ''
                }),
              });

              if (!completeResponse.ok) {
                const errorData = await completeResponse.json();
                throw new Error(errorData.message || 'Ödeme tamamlanırken hata oluştu');
              }

              const completeData = await completeResponse.json();
              console.log('PayPal v6 order completed:', completeData);

              toast({
                title: "Ödeme Başarılı!",
                description: "PayPal ödemesi tamamlandı ve paketler etkinleştirildi. Yönlendiriliyorsunuz...",
              });

              setTimeout(() => {
                window.location.href = `/order-success?orderId=${completeData.orderId}&amount=${completeData.totalUsd}&paymentId=${captureDetails?.id || captureData.id}`;
              }, 1500);

            } catch (backendError: any) {
              console.error('PayPal v6 backend complete-payment failed:', backendError);
              throw new Error(`PayPal ödeme işlemi tamamlanamadı: ${backendError.message}`);
            }
          } else {
            const errorMsg = captureStatus
              ? `Ödeme tamamlanamadı (${captureStatus})`
              : 'PayPal ödemesi tamamlanmadı';
            throw new Error(errorMsg);
          }
        } catch (error) {
          console.error('Payment capture error:', error);
          toast({
            title: "Ödeme Hatası",
            description: error instanceof Error ? error.message : "Ödeme tamamlanamadı",
            variant: "destructive",
          });

          const environment = settings?.paypal_environment || 'sandbox';
          setTimeout(() => {
            window.location.href = `/checkout/cancel?status=failed&amount=${amount}&reason=${encodeURIComponent(error instanceof Error ? error.message : 'Payment processing failed')}`;
          }, 2000);

          onError?.(error);
        }
      },

      onError: (err: any) => {
        console.error('PayPal v6 error:', err);
        setIsLoading(false);

        let errorMessage = "Ödeme işlemi sırasında bir hata oluştu.";
        let errorReason = 'PayPal processing error';
        const environment = settings?.paypal_environment || 'sandbox';

        if (err && typeof err === 'object') {
          if (err.name === 'VALIDATION_ERROR') {
            errorMessage = "Kart bilgileri geçersiz. Lütfen doğru bilgilerle tekrar deneyin.";
            errorReason = 'Invalid card details';
          } else if (err.name === 'INSTRUMENT_DECLINED') {
            errorMessage = "Kartınız reddedildi. Farklı bir kart deneyin veya bankanızla iletişime geçin.";
            errorReason = 'Card declined';
          } else if (err.name === 'UNPROCESSABLE_ENTITY') {
            errorMessage = "Ödeme işlenemiyor. Kart bilgilerinizi kontrol edin.";
            errorReason = 'Unprocessable payment';
          }
        }

        toast({
          title: "PayPal Hatası",
          description: errorMessage,
          variant: "destructive",
        });

        setTimeout(() => {
          window.location.href = `/checkout/cancel?status=failed&amount=${amount}&reason=${encodeURIComponent(errorReason)}&env=${environment}`;
        }, 3000);

        onError?.(err);
      },

      onCancel: () => {
        setIsLoading(false);
        toast({
          title: "Ödeme İptal Edildi",
          description: "PayPal ödemesi iptal edildi.",
          variant: "default",
        });

        setTimeout(() => {
          window.location.href = `/checkout/cancel?status=cancelled&amount=${amount}&reason=User cancelled payment`;
        }, 2000);
      }
    });

    paymentSessionRef.current = session;
  }, [amount, currency, couponCode, toast, onSuccess, onError, settings?.paypal_environment]);

  useEffect(() => {
    if (sdkReady && sdkInstanceRef.current) {
      setupPaymentSession(sdkInstanceRef.current);
    }
  }, [amount, currency, couponCode, sdkReady, setupPaymentSession]);

  const handlePayPalClick = async () => {
    if (!sdkReady || !paymentSessionRef.current) {
      toast({
        title: "PayPal Hazır Değil",
        description: "PayPal henüz yüklenemedi. Lütfen bekleyin veya sayfayı yenileyin.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await paymentSessionRef.current.start();
    } catch (error) {
      console.error('PayPal v6 session start error:', error);
      setIsLoading(false);
      toast({
        title: "PayPal Başlatma Hatası",
        description: error instanceof Error ? error.message : "PayPal ödeme penceresi açılamadı",
        variant: "destructive",
      });
      onError?.(error);
    }
  };

  if (!settings) {
    return (
      <div className="w-full py-4 flex items-center justify-center text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Ödeme sistemi yükleniyor...
      </div>
    );
  }

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
    <div className="space-y-3">
      <Button
        onClick={handlePayPalClick}
        disabled={isLoading || !sdkReady}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden"
        data-testid="paypal-payment-button"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Ödeme İşleniyor...
          </div>
        ) : !sdkReady ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            PayPal Yükleniyor...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a9.159 9.159 0 0 1-.354 1.888c-1.171 5.04-4.484 6.930-8.854 6.930H9.577a.5.5 0 0 0-.496.58l-.466 2.956-.132.84a.318.318 0 0 0 .314.37h2.4a.5.5 0 0 0 .496-.42l.020-.124.382-2.42.025-.134a.5.5 0 0 1 .496-.42h.312c3.634 0 6.479-1.476 7.314-5.738.348-1.781.167-3.27-.784-4.32z"/>
            </svg>
            <span className="font-semibold">PayPal ile Ödeme</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 animate-pulse"></div>
      </Button>

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

      <div ref={buttonRef}></div>

      <div className="text-center">
        <p className="text-xs text-slate-500">Tüm ödemeler 256-bit SSL ile şifrelenir</p>
      </div>
    </div>
  );
}