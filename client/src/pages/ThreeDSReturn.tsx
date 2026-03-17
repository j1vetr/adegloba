import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { Loader2, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Phase = "verifying" | "capturing" | "completing" | "success" | "error";

export default function ThreeDSReturn() {
  const searchString = useSearch();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const orderId = params.get("token");

    if (!orderId) {
      setErrorMsg("Sipariş bilgisi bulunamadı.");
      setPhase("error");
      return;
    }

    const run = async () => {
      try {
        // Step 1: Capture
        setPhase("capturing");
        const captureRes = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        if (!captureRes.ok) {
          const err = await captureRes.json();
          throw new Error(err.message || "3D Secure doğrulaması sonrası ödeme yakalanamadı");
        }

        const captureData = await captureRes.json();
        const captureStatus = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.status;
        const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

        if (captureData.status !== "COMPLETED" || captureStatus !== "COMPLETED") {
          throw new Error(`Ödeme tamamlanamadı (${captureStatus || captureData.status})`);
        }

        // Step 2: Complete payment in our system
        setPhase("completing");
        const completeRes = await fetch("/api/cart/complete-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paypalOrderId: orderId, couponCode: "" }),
        });

        if (!completeRes.ok) {
          const err = await completeRes.json();
          throw new Error(err.message || "Ödeme kaydedilemedi");
        }

        const completeData = await completeRes.json();
        setPhase("success");

        setTimeout(() => {
          window.location.href = `/order-success?orderId=${completeData.orderId}&amount=${completeData.totalUsd}&paymentId=${captureId}`;
        }, 2000);
      } catch (err: any) {
        console.error("[3DS Return] Error:", err);
        setErrorMsg(err.message || "Ödeme işlemi sırasında bir hata oluştu.");
        setPhase("error");
        toast({ title: "Ödeme Hatası", description: err.message, variant: "destructive" });
      }
    };

    run();
  }, []);

  const steps: { id: Phase; label: string }[] = [
    { id: "verifying", label: "3D Secure doğrulanıyor..." },
    { id: "capturing", label: "Ödeme yakalanıyor..." },
    { id: "completing", label: "Sipariş tamamlanıyor..." },
  ];

  const activeIdx = steps.findIndex((s) => s.id === phase);

  return (
    <div className="min-h-screen bg-[#080c18] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.03] p-8">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          {phase !== "success" && phase !== "error" && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <h2 className="text-white font-bold text-lg text-center mb-2">3D Secure İşlemi</h2>
              <p className="text-white/40 text-sm text-center mb-8">Bankanızla ödemeniz doğrulanıyor, lütfen bekleyin.</p>

              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const isDone = activeIdx > idx;
                  const isActive = activeIdx === idx;
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isDone ? "bg-emerald-500/20 border border-emerald-500/30"
                        : isActive ? "bg-blue-500/20 border border-blue-500/30"
                        : "bg-white/5 border border-white/10"
                      }`}>
                        {isDone ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-white/20" />
                        )}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${
                        isDone ? "text-emerald-400" : isActive ? "text-white" : "text-white/30"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {phase === "success" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Ödeme Başarılı!</h2>
              <p className="text-white/40 text-sm">3D Secure doğrulaması tamamlandı. Yönlendiriliyorsunuz...</p>
            </div>
          )}

          {phase === "error" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Ödeme Başarısız</h2>
              <p className="text-white/35 text-sm mb-6">{errorMsg}</p>
              <button
                onClick={() => window.location.href = "/sepet"}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Sepete Geri Dön
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
