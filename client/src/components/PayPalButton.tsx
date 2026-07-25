import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, CheckCircle2, XCircle, Satellite } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  couponCode?: string;
  orderId?: string;   // DB order ID — passed for early linking, not routing
  onSuccess?: (orderId: string) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    paypal: any;
  }
}

// Faz 2 simplification: capture now happens server-side inside /api/cart/complete-payment.
// "capturing" / "captured" frontend steps are removed — the backend does it atomically.
type ProcessingStep = "idle" | "approved" | "completing" | "success" | "error";

const STEPS = [
  { key: "approved",   label: "PayPal onayı alındı",          activeLabel: "PayPal onayı bekleniyor..." },
  { key: "completing", label: "Ödeme ve paket hazırlandı",    activeLabel: "Ödeme işleniyor..." },
  { key: "success",    label: "Paketler etkinleştirildi",     activeLabel: "Paketler etkinleştiriliyor..." },
] as const;

const STEP_ORDER: ProcessingStep[] = ["approved", "completing", "success"];

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
        const done   = current > i;
        const active = current === i;

        return (
          <div key={s.key} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            active ? "bg-blue-50 border border-blue-200" :
            done   ? "bg-green-50 border border-green-200" :
                     "bg-gray-50 border border-transparent"
          }`}>
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
              active ? "bg-blue-500 text-white" :
              done   ? "bg-green-500 text-white" :
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
              done   ? "text-green-700" :
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
  const [isLoading, setIsLoading]           = useState(false);
  const [sdkReady, setSdkReady]             = useState(false);
  const [settings, setSettings]             = useState<any>(null);
  const [clientToken, setClientToken]       = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [errorMessage, setErrorMessage]     = useState<string | undefined>();
  const sdkInstanceRef      = useRef<any>(null);
  const paymentSessionRef   = useRef<any>(null);
  const buttonRef           = useRef<HTMLDivElement>(null);
  const isProcessingRef     = useRef(false);
  const { toast } = useToast();

  // Load PayPal settings
  useEffect(() => {
    fetch('/api/settings/payment')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setSettings(data))
      .catch(err => {
        console.error('Failed to load PayPal settings:', err);
        setSettings({});
      });
  }, []);

  // Fetch client token
  useEffect(() => {
    if (!settings?.paypal_client_id || settings.paypal_client_id.trim() === '') return;
    fetch('/api/paypal/setup')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { if (data.clientToken) setClientToken(data.clientToken); })
      .catch(err => {
        console.error('Failed to fetch client token:', err);
        toast({ title: "PayPal Yapılandırma Hatası", description: "Client token alınamadı.", variant: "destructive" });
      });
  }, [settings?.paypal_client_id, toast]);

  // Load PayPal v6 SDK and initialise
  useEffect(() => {
    if (!clientToken || !settings?.paypal_client_id) return;

    const isProduction = (settings.paypal_environment || 'sandbox') === 'live' || settings.paypal_environment === 'production';
    const sdkBaseUrl   = isProduction
      ? 'https://www.paypal.com/web-sdk/v6/core'
      : 'https://www.sandbox.paypal.com/web-sdk/v6/core';

    const initializeV6 = async () => {
      try {
        if (!window.paypal?.createInstance) { console.error('PayPal v6 createInstance not available'); return; }
        const sdkInstance = await window.paypal.createInstance({
          clientToken, components: ["paypal-payments"],
          pageType: "checkout", clientMetadataId: crypto.randomUUID(),
        });
        sdkInstanceRef.current = sdkInstance;

        const eligible = await sdkInstance.findEligibleMethods({ currencyCode: currency });
        if (eligible.isEligible("paypal")) {
          setupPaymentSession(sdkInstance);
          setSdkReady(true);
        } else {
          toast({ title: "PayPal Kullanılamıyor", description: "Bu para birimi için kullanılamıyor.", variant: "destructive" });
        }
      } catch (err) {
        console.error('PayPal v6 init error:', err);
        toast({ title: "PayPal Başlatma Hatası", description: "Lütfen sayfayı yenileyin.", variant: "destructive" });
      }
    };

    const loadV6SDK = async () => {
      if (window.paypal?.createInstance) { await initializeV6(); return; }
      document.querySelectorAll('script[src*="paypal.com"]').forEach(s => s.remove());
      delete window.paypal;
      const script    = document.createElement('script');
      script.src      = sdkBaseUrl;
      script.async    = true;
      script.onload   = async () => { console.log('PayPal v6 SDK loaded'); await initializeV6(); };
      script.onerror  = () => toast({ title: "PayPal SDK Hatası", description: "v6 SDK yüklenemedi.", variant: "destructive" });
      document.head.appendChild(script);
    };

    loadV6SDK();
    return () => { paymentSessionRef.current = null; sdkInstanceRef.current = null; };
  }, [clientToken, settings?.paypal_client_id, settings?.paypal_environment, currency, toast]);

  // ── Payment session ───────────────────────────────────────────────────────
  const setupPaymentSession = useCallback((sdkInstance: any) => {
    const session = sdkInstance.createPayPalOneTimePaymentSession({

      // Faz 1: Pass dbOrderId so the backend links the PayPal order to our DB
      // order immediately after creation (early link prevents orphan payments).
      createOrder: async () => {
        try {
          const res = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount:   parseFloat(amount).toString(),
              currency,
              intent:   intent.toUpperCase() || 'CAPTURE',
              dbOrderId: orderId || undefined,   // Faz 1 early link
            }),
          });
          if (!res.ok) {
            const err = res.headers.get('content-type')?.includes('application/json')
              ? (await res.json()).message
              : await res.text();
            throw new Error(err || 'Order creation failed');
          }
          const data = await res.json();
          console.log('PayPal order created:', data.id);
          return data.id;
        } catch (err) {
          console.error('Error creating PayPal order:', err);
          toast({ title: "Sipariş Oluşturma Hatası", description: err instanceof Error ? err.message : "Bilinmeyen hata", variant: "destructive" });
          throw err;
        }
      },

      // Faz 2: Capture + fulfillment happen in one backend call.
      // Frontend no longer calls /api/paypal/capture-order separately.
      onApprove: async (data: any) => {
        setProcessingStep("approved");
        try {
          console.log('PayPal payment approved, orderID:', data.orderID);

          // Single backend call handles: capture → mark paid → assign credentials
          setProcessingStep("completing");
          const res = await fetch('/api/cart/complete-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paypalOrderId: data.orderID, couponCode: couponCode || '' }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error((errData as any).message || 'Ödeme tamamlanırken hata oluştu');
          }

          const result = await res.json();
          console.log('Payment completed:', result);

          setProcessingStep("success");
          isProcessingRef.current = false;

          const finalOrderId = result.orderId || result.id || orderId;
          if (onSuccess && finalOrderId) onSuccess(finalOrderId);

          setTimeout(() => {
            window.location.href = `/order-success?orderId=${finalOrderId}&amount=${result.totalUsd || amount}`;
          }, 1500);

        } catch (err) {
          console.error('Payment error:', err);
          isProcessingRef.current = false;
          setIsLoading(false);
          const msg = err instanceof Error ? err.message : "Ödeme tamamlanamadı";
          setErrorMessage(msg);
          setProcessingStep("error");
          setTimeout(() => {
            setProcessingStep("idle");
            window.location.href = `/checkout/cancel?status=failed&amount=${amount}&reason=${encodeURIComponent(msg)}`;
          }, 3000);
          onError?.(err);
        }
      },

      onError: (err: any) => {
        console.error('PayPal SDK error:', err);
        isProcessingRef.current = false;
        setIsLoading(false);
        setProcessingStep("idle");

        let msg = "Ödeme işlemi sırasında bir hata oluştu.";
        let reason = 'PayPal processing error';
        if (err?.name === 'VALIDATION_ERROR')      { msg = "Kart bilgileri geçersiz."; reason = 'Invalid card details'; }
        else if (err?.name === 'INSTRUMENT_DECLINED') { msg = "Kartınız reddedildi. Farklı bir kart deneyin."; reason = 'Card declined'; }
        else if (err?.name === 'UNPROCESSABLE_ENTITY') { msg = "Ödeme işlenemiyor. Kart bilgilerinizi kontrol edin."; reason = 'Unprocessable payment'; }

        toast({ title: "PayPal Hatası", description: msg, variant: "destructive" });
        const env = settings?.paypal_environment || 'sandbox';
        setTimeout(() => {
          window.location.href = `/checkout/cancel?status=failed&amount=${amount}&reason=${encodeURIComponent(reason)}&env=${env}`;
        }, 3000);
        onError?.(err);
      },

      onCancel: () => {
        isProcessingRef.current = false;
        setIsLoading(false);
        setProcessingStep("idle");
        toast({ title: "Ödeme İptal Edildi", description: "PayPal ödemesi iptal edildi.", variant: "default" });
        setTimeout(() => {
          window.location.href = `/checkout/cancel?status=cancelled&amount=${amount}&reason=User cancelled payment`;
        }, 2000);
      },
    });

    paymentSessionRef.current = session;
  }, [amount, currency, intent, couponCode, orderId, toast, onSuccess, onError, settings?.paypal_environment]);

  // Re-create session whenever key props change
  useEffect(() => {
    if (sdkReady && sdkInstanceRef.current) {
      setupPaymentSession(sdkInstanceRef.current);
    }
  }, [amount, currency, couponCode, orderId, sdkReady, setupPaymentSession]);

  const handlePayPalClick = async () => {
    if (isProcessingRef.current) return;
    if (!sdkReady || !paymentSessionRef.current) {
      toast({ title: "PayPal Hazır Değil", description: "Lütfen bekleyin veya sayfayı yenileyin.", variant: "destructive" });
      return;
    }
    isProcessingRef.current = true;
    setIsLoading(true);
    try {
      await paymentSessionRef.current.start();
    } catch (err) {
      console.error('PayPal session start error:', err);
      isProcessingRef.current = false;
      setIsLoading(false);
      toast({ title: "PayPal Başlatma Hatası", description: err instanceof Error ? err.message : "Ödeme penceresi açılamadı", variant: "destructive" });
      onError?.(err);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
          PayPal ödemelerini kabul etmek için Admin Panel → Ayarlar → PayPal Integration bölümünden API anahtarlarını yapılandırın.
        </p>
        <div className="bg-amber-500/10 p-3 rounded border border-amber-500/20 text-xs text-amber-200 space-y-1">
          <p>1. PayPal Developer Console'dan Client ID alın</p>
          <p>2. Client Secret anahtarını girin</p>
          <p>3. Sandbox veya Live environment seçin</p>
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
