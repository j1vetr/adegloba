import { useState, useEffect } from "react";
import { X, Lock, ShieldCheck, CreditCard, CheckCircle2, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreditCardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  currency: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: any) => void;
}

export default function CreditCardDrawer({
  isOpen,
  onClose,
  amount,
  currency,
  onSuccess,
  onError,
}: CreditCardDrawerProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const c = t.checkout;

  const { data: user } = useQuery({ queryKey: ["/api/user/me"], enabled: isOpen });

  const [formData, setFormData] = useState({ cardNumber: "", expiryDate: "", cvv: "", fullName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardBrand, setCardBrand] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      const u = user as any;
      setFormData((p) => ({ ...p, fullName: u.full_name || "" }));
    }
  }, [isOpen, user]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const detectBrand = (v: string) => {
    const n = v.replace(/\s/g, "");
    if (/^4/.test(n)) return "visa";
    if (/^5[1-5]/.test(n)) return "mastercard";
    if (/^3[47]/.test(n)) return "amex";
    return "";
  };

  const fmtCard = (v: string) => {
    const c = v.replace(/\s/g, "");
    return (c.match(/.{1,4}/g) || [c]).join(" ");
  };

  const fmtExpiry = (v: string) => {
    const c = v.replace(/\D/g, "");
    return c.length >= 2 ? `${c.slice(0, 2)}/${c.slice(2, 4)}` : c;
  };

  const handleChange = (field: string, value: string) => {
    let v = value;
    if (field === "cardNumber") { v = fmtCard(value); setCardBrand(detectBrand(value)); }
    else if (field === "expiryDate") v = fmtExpiry(value);
    else if (field === "cvv") v = value.replace(/\D/g, "").slice(0, 4);
    setFormData((p) => ({ ...p, [field]: v }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, "").length < 13)
      e.cardNumber = c.cardNumberPlaceholder || "Enter a valid card number";
    if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate))
      e.expiryDate = c.expiryFormatError || "MM/YY";
    if (!formData.cvv || formData.cvv.length < 3)
      e.cvv = c.cvvPlaceholder || "Enter valid CVV";
    if (!formData.fullName.trim())
      e.fullName = c.cardHolderPlaceholder || "Enter your full name";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({ title: t.common.error, description: c.formErrorDesc, variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const payload = {
        amount: parseFloat(amount).toString(),
        currency,
        intent: "CAPTURE",
        paymentMethod: "CARD",
        cardDetails: {
          number: formData.cardNumber.replace(/\s/g, ""),
          expiryMonth: formData.expiryDate.split("/")[0].padStart(2, "0"),
          expiryYear: "20" + formData.expiryDate.split("/")[1],
          securityCode: formData.cvv,
          name: formData.fullName.trim(),
          billingAddress: { addressLine1: "1 Main St", addressLine2: "", city: "Istanbul", state: "", postalCode: "34000", countryCode: "TR" },
        },
      };

      const createRes = await fetch("/api/paypal/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!createRes.ok) throw new Error((await createRes.json()).message || "Order creation failed");
      const createData = await createRes.json();

      // Immediately register the PayPal order ID in our DB so the auto-cancel service
      // knows payment is in-flight and will not cancel this order during slow 3DS flows.
      fetch("/api/cart/register-paypal-order", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paypalOrderId: createData.id }),
      }).catch(() => { /* non-critical — complete-payment handles recovery anyway */ });

      toast({ title: c.processingCard, description: c.processingCardDesc });
      await new Promise((r) => setTimeout(r, 2000));

      const captureRes = await fetch("/api/paypal/capture-order", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: createData.id }),
      });
      if (!captureRes.ok) throw new Error((await captureRes.json()).message || c.paymentFailedDesc);
      const captureData = await captureRes.json();

      const captureDetails = captureData.purchase_units?.[0]?.payments?.captures?.[0];
      if (captureData.status === "COMPLETED" && captureDetails?.status === "COMPLETED") {
        toast({ title: c.verifyingPayment, description: c.verifyingPaymentDesc });
        const completeRes = await fetch("/api/cart/complete-payment", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paypalOrderId: createData.id, couponCode: "" }),
        });
        if (!completeRes.ok) throw new Error((await completeRes.json()).message || c.paymentErrorCardDesc);
        const completeData = await completeRes.json();
        toast({ title: c.paymentSuccess, description: c.paymentSuccessActivated });
        setTimeout(() => {
          window.location.href = `/order-success?orderId=${completeData.orderId}&amount=${completeData.totalUsd}&paymentId=${captureDetails.id}`;
        }, 1500);
      } else {
        throw new Error(captureDetails?.status === "DECLINED" ? c.declinedMsg : `${c.paymentFailedDesc} (${captureDetails?.status || captureData.status})`);
      }
    } catch (err) {
      console.error("Card payment error:", err);
      toast({ title: c.paymentError, description: err instanceof Error ? err.message : c.paymentErrorCardDesc, variant: "destructive" });
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const maskedNumber = () => {
    const raw = formData.cardNumber.replace(/\s/g, "").padEnd(16, "•");
    return `${raw.slice(0,4)} ${raw.slice(4,8)} ${raw.slice(8,12)} ${raw.slice(12,16)}`;
  };

  const BrandLogo = () => {
    if (cardBrand === "visa") return <span className="text-white font-black text-xl italic" style={{ fontFamily: "serif" }}>VISA</span>;
    if (cardBrand === "mastercard") return (
      <div className="flex"><div className="w-6 h-6 rounded-full bg-red-500/90" /><div className="w-6 h-6 rounded-full bg-yellow-400/90 -ml-2.5" /></div>
    );
    if (cardBrand === "amex") return <span className="text-white font-bold text-xs bg-blue-600 px-1.5 py-0.5 rounded">AMEX</span>;
    return <Wifi className="w-5 h-5 text-white/40 rotate-90" />;
  };

  const inputBase = "w-full border rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 text-sm outline-none transition-all duration-150 bg-white";
  const inputIdle = "border-slate-200 hover:border-slate-300";
  const inputFocus = "border-[#FFDD57] ring-2 ring-[#FFDD57]/30 shadow-sm";
  const inputError = "border-red-400 bg-red-50";

  const fieldClass = (field: string) =>
    `${inputBase} ${errors[field] ? inputError : focusedField === field ? inputFocus : inputIdle}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300 ease-out">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-slate-200" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF6D6] flex items-center justify-center">
                <CreditCard className="w-4.5 h-4.5 text-[#7C5E00]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{c.cardPayment}</p>
                <p className="text-xs text-slate-500">{c.securePayment}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* 3D Card Visual */}
          <div className="px-5 pt-4 pb-3">
            <div className="relative h-40 w-full max-w-xs mx-auto" style={{ perspective: "1000px" }}>
              <div
                className="relative w-full h-full transition-all duration-700"
                style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 rounded-2xl p-4 flex flex-col justify-between overflow-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    background: cardBrand === "visa"
                      ? "linear-gradient(135deg,#1e3a5f,#2563eb)"
                      : cardBrand === "mastercard"
                      ? "linear-gradient(135deg,#1a1a2e,#0f3460)"
                      : "linear-gradient(135deg,#0f172a,#0e7490)",
                  }}
                >
                  <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/5" />
                  <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-9 h-6 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 grid grid-cols-2 gap-0.5 p-1">
                      {[...Array(4)].map((_, i) => <div key={i} className="bg-yellow-700/40 rounded-sm" />)}
                    </div>
                    <BrandLogo />
                  </div>
                  <div className="relative z-10">
                    <p className="text-white/90 text-base font-mono tracking-widest mb-2">{maskedNumber()}</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">{c.cardHolderPreview}</p>
                        <p className="text-white text-xs font-medium uppercase tracking-wide truncate max-w-[140px]">
                          {formData.fullName || c.cardHolderPlaceholder}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">{c.expiryPreview}</p>
                        <p className="text-white text-xs font-mono">{formData.expiryDate || "MM/YY"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg,#1e293b,#0f172a)" }}
                >
                  <div className="h-9 bg-slate-700/80 mt-5" />
                  <div className="px-4 mt-3">
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">{c.cvv}</p>
                    <div className="bg-white/10 rounded px-3 py-1.5 flex justify-end">
                      <span className="text-white font-mono text-sm tracking-widest">
                        {formData.cvv ? "•".repeat(formData.cvv.length) : "•••"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount pill */}
          <div className="flex justify-center mb-3">
            <div className="inline-flex items-center gap-2 bg-[#FFF6D6] border border-[#FFDD57]/50 rounded-full px-4 py-1.5">
              <Lock className="w-3 h-3 text-[#7C5E00]" />
              <span className="text-[#7C5E00] font-bold text-sm">{amount} {currency.toUpperCase()}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 space-y-3 max-h-[40vh] overflow-y-auto">

            {/* Card Number */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.cardNumber}</label>
              <div className="relative">
                <input
                  type="text" name="ccnumber" autoComplete="cc-number" inputMode="numeric"
                  placeholder="1234 5678 9012 3456" value={formData.cardNumber} maxLength={19}
                  onChange={(e) => handleChange("cardNumber", e.target.value)}
                  onFocus={() => { setFocusedField("cardNumber"); setIsFlipped(false); }}
                  onBlur={() => setFocusedField("")}
                  className={fieldClass("cardNumber") + " font-mono tracking-widest pr-12"}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {cardBrand === "visa" && <span className="text-blue-600 font-black text-sm italic">VISA</span>}
                  {cardBrand === "mastercard" && <div className="flex"><div className="w-4 h-4 rounded-full bg-red-500" /><div className="w-4 h-4 rounded-full bg-yellow-400 -ml-2" /></div>}
                  {cardBrand === "amex" && <span className="text-blue-600 font-bold text-xs">AMEX</span>}
                  {!cardBrand && <CreditCard className="w-4 h-4 text-slate-300" />}
                </div>
              </div>
              {errors.cardNumber && <p className="text-red-500 text-xs">{errors.cardNumber}</p>}
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.expiryDate}</label>
                <input
                  type="text" name="ccexp" autoComplete="cc-exp" inputMode="numeric"
                  placeholder="MM/YY" value={formData.expiryDate} maxLength={5}
                  onChange={(e) => handleChange("expiryDate", e.target.value)}
                  onFocus={() => { setFocusedField("expiryDate"); setIsFlipped(false); }}
                  onBlur={() => setFocusedField("")}
                  className={fieldClass("expiryDate") + " font-mono tracking-wider"}
                />
                {errors.expiryDate && <p className="text-red-500 text-xs">{errors.expiryDate}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.cvv}</label>
                <input
                  type="text" name="cvc" autoComplete="cc-csc" inputMode="numeric"
                  placeholder="•••" value={formData.cvv} maxLength={4}
                  onChange={(e) => handleChange("cvv", e.target.value)}
                  onFocus={() => { setFocusedField("cvv"); setIsFlipped(true); }}
                  onBlur={() => { setFocusedField(""); setIsFlipped(false); }}
                  className={fieldClass("cvv") + " font-mono tracking-widest"}
                />
                {errors.cvv && <p className="text-red-500 text-xs">{errors.cvv}</p>}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.cardHolderLabel}</label>
              <input
                type="text" name="ccname" autoComplete="cc-name"
                placeholder={c.cardHolderPlaceholder?.toUpperCase()} value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value.toUpperCase())}
                onFocus={() => { setFocusedField("fullName"); setIsFlipped(false); }}
                onBlur={() => setFocusedField("")}
                className={fieldClass("fullName") + " uppercase tracking-widest"}
              />
              {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
            </div>
          </form>

          {/* Footer */}
          <div className="px-5 pt-3 pb-5 mt-2 space-y-3">
            {/* Security badges */}
            <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />256-bit SSL</span>
              <span className="w-px h-3 bg-slate-200" />
              <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-slate-400" />{c.securePayment}</span>
              <span className="w-px h-3 bg-slate-200" />
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />PCI DSS</span>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full h-14 rounded-2xl font-bold text-base text-slate-900 bg-[#FFDD57] hover:brightness-95 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-between px-5"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2 mx-auto">
                  <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  {c.processingBtn}
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {c.completePayment}
                  </span>
                  <span className="font-black tabular-nums">{amount} {currency.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
