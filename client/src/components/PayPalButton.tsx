import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, CheckCircle2, XCircle, Satellite } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  couponCode?: string;
  orderId?: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    paypal: any;
  }
}

type ProcessingStep = "idle" | "approved" | "capturing" | "captured" | "completing" | "success" | "error";

const STEPS = [
  { key: "approved",   label: "PayPal onayı alındı",           activeLabel: "PayPal onayı bekleniyor..." },
  { key: "capturing",  label: "Para transferi tamamlandı",      activeLabel: "Para transferi yapılıyor..." },
  { key: "completing", label: "Sipariş hazırlandı",             activeLabel: "Sipariş oluşturuluyor..." },
  { key: "success",    label: "Paketler etkinleştirildi",       activeLabel: "Paketler etkinleştiriliyor..." },
] as const;

const STEP_ORDER: ProcessingStep[] = ["approved", "capturing", "captured", "completing", "success"];

function stepIndex(step: ProcessingStep) {
  return STEP_ORDER.indexOf(step);
}

function PaymentOverlay({ step, errorMessage }: { step: ProcessingStep; errorMessage?: string }) {
  if (step === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 flex flex-col items-center gap-5">
        {step === "error" ? (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-lg">Ödeme Tamamlanamadı</p>
              {errorMessage && (
                <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">Yönlendiriliyorsunuz...</p>
            </div>
          </>
        ) : step === "success" ? (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-lg">Ödeme Başarılı!</p>
              <p className="text-sm text-gray-500 mt-1">Sipariş sayfanıza yönlendiriliyorsunuz...</p>
            </div>
            <StepList currentStep={step} />
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <Satellite className="w-7 h-7 text-blue-600 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-lg">Ödemeniz İşleniyor</p>
              <p className="text-xs text-gray-400 mt-1">Lütfen sayfayı kapatmayın</p>
            </div>
            <StepList currentStep={step} />
          </>
        )}
      </div>
    </div>
  );
}

function StepList({ currentStep }: { currentStep: ProcessingStep }) {
  const current = stepIndex(currentStep);

  return (
    <div className="w-full flex flex-col gap-2.5">
      {STEPS.map((s, i) => {
        const done = current > i;
        const active = current === i;

        return (
          <div key={s.key} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            active ? "bg-blue-50 border border-blue-200" :
            done  ? "bg-green-50 border border-green-200" :
                    "bg-gray-50 border border-transparent"
          }`}>
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
              active ? "bg-blue-500 text-white" :
              done  ? "bg-green-500 text-white" :
                      "bg-gray-200 text-gray-400"
            }`}>
              {done ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : active ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-sm font-medium ${
              active ? "text-blue-700" :
              done  ? "text-green-700" :
                      "text-gray-400"
            }`}>
              {active ? s.activeLabel : s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PayPalButton({
  amount,
  currency,
  intent,
  couponCode,
  orderId,
  onSuccess,
  onError
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const sdkInstanceRef = useRef<any>(null);
  const paymentSessionRef = useRef<any>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
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
        // Show overlay immediately when popup closes
        setProcessingStep("approved");

        try {
          console.log('PayPal v6 payment approved:', data.orderID);

          // Step 2: Capture
          setProcessingStep("capturing");
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

          if (captureStatus === 'DECLINED') {
            throw new Error('Ödeme reddedildi — kart bilgilerini kontrol edin');
          }

          if (orderStatus === 'COMPLETED' && (!captureDetails || captureStatus === 'COMPLETED')) {
            // Step 3: Complete order
            setProcessingStep("completing");

            try {
              const endpoint = orderId
                ? `/api/orders/${orderId}/complete`
                : '/api/cart/complete-payment';
              const completeResponse = await fetch(endpoint, {
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

              // Step 4: Success
              setProcessingStep("success");
              isProcessingRef.current = false;

              const finalOrderId = completeData.order?.id || completeData.orderId || completeData.id || orderId;
              if (onSuccess && finalOrderId) onSuccess(finalOrderId);

              setTimeout(() => {
                window.location.href = `/order-success?orderId=${finalOrderId}&amount=${completeData.totalUsd || amount}&paymentId=${captureDetails?.id || captureData.id}`;
              }, 1500);

            } catch (backendError: any) {
              console.error('PayPal v6 backend complete-payment failed:', backendError);
              throw new Error(`Ödeme tamamlanamadı: ${backendError.message}`);
            }
          } else {
            const errorMsg = captureStatus
              ? `Ödeme tamamlanamadı (${captureStatus})`
              : 'PayPal ödemesi tamamlanmadı';
            throw new Error(errorMsg);
          }
        } catch (error) {
          console.error('Payment capture error:', error);
          isProcessingRef.current = false;
          setIsLoading(false);
          const msg = error instanceof Error ? error.message : "Ödeme tamamlanamadı";
          setErrorMessage(msg);
          setProcessingStep("error");

          setTimeout(() => {
            setProcessingStep("idle");
            window.location.href = `/checkout/cancel?status=failed&amount=${amount}&reason=${encodeURIComponent(msg)}`;
          }, 3000);

          onError?.(error);
        }
      },

      onError: (err: any) => {
        console.error('PayPal v6 error:', err);
        isProcessingRef.current = false;
        setIsLoading(false);
        setProcessingStep("idle");

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
        isProcessingRef.current = false;
        setIsLoading(false);
        setProcessingStep("idle");
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
  }, [amount, currency, couponCode, orderId, toast, onSuccess, onError, settings?.paypal_environment]);

  useEffect(() => {
    if (sdkReady && sdkInstanceRef.current) {
      setupPaymentSession(sdkInstanceRef.current);
    }
  }, [amount, currency, couponCode, orderId, sdkReady, setupPaymentSession]);

  const handlePayPalClick = async () => {
    if (isProcessingRef.current) return;

    if (!sdkReady || !paymentSessionRef.current) {
      toast({
        title: "PayPal Hazır Değil",
        description: "PayPal henüz yüklenemedi. Lütfen bekleyin veya sayfayı yenileyin.",
        variant: "destructive",
      });
      return;
    }

    isProcessingRef.current = true;
    setIsLoading(true);

    try {
      await paymentSessionRef.current.start();
    } catch (error) {
      console.error('PayPal v6 session start error:', error);
      isProcessingRef.current = false;
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
    <>
      <PaymentOverlay step={processingStep} errorMessage={errorMessage} />

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
    </>
  );
}
