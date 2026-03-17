import { useState, useEffect } from "react";
import { X, Lock, CheckCircle2, ShieldCheck, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

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
  onError
}: CreditCardDrawerProps) {
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['/api/user/me'],
    enabled: isOpen,
  });

  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    region: '',
    city: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardBrand, setCardBrand] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      const userData = user as any;
      setFormData(prev => ({
        ...prev,
        fullName: userData.full_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        addressLine1: userData.address || '',
      }));
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const detectCardBrand = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6011|^644|^65/.test(cleaned)) return 'discover';
    return '';
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
      setCardBrand(detectCardBrand(value));
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (field === 'phone') {
      formattedValue = value.replace(/\D/g, '');
    }
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13)
      newErrors.cardNumber = 'Geçerli bir kart numarası girin';
    if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate))
      newErrors.expiryDate = 'MM/YY formatında girin';
    if (!formData.cvv || formData.cvv.length < 3)
      newErrors.cvv = 'Geçerli CVV girin';
    if (!formData.fullName.trim())
      newErrors.fullName = 'Ad ve soyadınızı girin';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Hata", description: "Lütfen tüm gerekli alanları doldurun", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      // ── Yeni 3DS zorunlu akış ──────────────────────────────────
      const cardPayload = {
        amount: parseFloat(amount).toString(),
        currency,
        cardDetails: {
          number: formData.cardNumber.replace(/\s/g, ''),
          expiryMonth: formData.expiryDate.split('/')[0].padStart(2, '0'),
          expiryYear: '20' + formData.expiryDate.split('/')[1],
          securityCode: formData.cvv,
          name: formData.fullName.trim(),
          billingAddress: {
            addressLine1: formData.addressLine1.trim() || 'N/A',
            addressLine2: formData.addressLine2.trim() || '',
            city: formData.city.trim() || 'Istanbul',
            state: formData.region.trim() || 'TR',
            postalCode: formData.postalCode.trim() || '34000',
            countryCode: 'TR',
          },
        },
      };

      toast({ title: "Güvenli Ödeme", description: "Kart bilgileri 3D Secure ile doğrulanıyor..." });

      const createResponse = await fetch('/api/paypal/create-card-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardPayload),
      });

      if (!createResponse.ok) {
        const errData = await createResponse.json();
        throw new Error(errData.message || 'Sipariş oluşturulamadı');
      }

      const createData = await createResponse.json();

      // ── 3DS yönlendirmesi gerekiyor ───────────────────────────
      if (createData.requiresAction && createData.actionUrl) {
        toast({
          title: "3D Secure Doğrulaması",
          description: "Bankanızın doğrulama sayfasına yönlendiriliyorsunuz...",
        });
        // Kart bilgilerini locale kaydet ki dönüşte sepet bilgisi kaybolmasın
        sessionStorage.setItem('pending_3ds_order', createData.orderId);
        // Tam sayfa yönlendirme — banka 3DS sayfası
        window.location.href = createData.actionUrl;
        return; // setIsProcessing(false) çalışmasın, sayfa değişecek
      }

      // ── 3DS gerekmedi, direkt yakalanabilir ───────────────────
      const captureResponse = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: createData.orderId }),
      });

      if (!captureResponse.ok) {
        const errData = await captureResponse.json();
        throw new Error(errData.message || 'Ödeme yakalanamadı');
      }

      const captureData = await captureResponse.json();
      const captureDetails = captureData.purchase_units?.[0]?.payments?.captures?.[0];

      if (captureData.status === 'COMPLETED' && captureDetails?.status === 'COMPLETED') {
        const completeResponse = await fetch('/api/cart/complete-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paypalOrderId: createData.orderId, couponCode: '' }),
        });
        if (!completeResponse.ok) {
          const errData = await completeResponse.json();
          throw new Error(errData.message || 'Ödeme kaydedilemedi');
        }
        const completeData = await completeResponse.json();
        toast({ title: "Ödeme Başarılı!", description: "Kartınızdan ödeme alındı, paketler etkinleştirildi." });
        setTimeout(() => {
          window.location.href = `/order-success?orderId=${completeData.orderId}&amount=${completeData.totalUsd}&paymentId=${captureDetails.id}`;
        }, 1500);
      } else {
        const st = captureDetails?.status || captureData.status;
        throw new Error(st === 'DECLINED' ? 'Ödeme reddedildi — kart bilgilerini kontrol edin' : `Ödeme tamamlanamadı (${st})`);
      }
    } catch (error) {
      console.error('Credit card payment error:', error);
      toast({
        title: "Ödeme Hatası",
        description: error instanceof Error ? error.message : "Kart ödemesi işlenirken bir hata oluştu",
        variant: "destructive",
      });
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCardBrandLogo = () => {
    if (cardBrand === 'visa') return (
      <div className="flex items-center justify-end">
        <span className="text-white font-black text-xl italic tracking-tight" style={{ fontFamily: 'serif' }}>VISA</span>
      </div>
    );
    if (cardBrand === 'mastercard') return (
      <div className="flex items-center justify-end gap-[-4px]">
        <div className="w-7 h-7 rounded-full bg-red-500 opacity-90" />
        <div className="w-7 h-7 rounded-full bg-yellow-400 opacity-90 -ml-3" />
      </div>
    );
    if (cardBrand === 'amex') return (
      <span className="text-white font-bold text-sm bg-blue-600 px-2 py-1 rounded">AMEX</span>
    );
    return <Wifi className="w-6 h-6 text-white/60 rotate-90" />;
  };

  const maskedCardNumber = () => {
    if (!formData.cardNumber) return '•••• •••• •••• ••••';
    const raw = formData.cardNumber.replace(/\s/g, '');
    const padded = raw.padEnd(16, '•');
    return `${padded.slice(0,4)} ${padded.slice(4,8)} ${padded.slice(8,12)} ${padded.slice(12,16)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Sheet / Modal */}
      <div className="relative w-full sm:max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300 ease-out">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/60 border border-white/5 overflow-hidden">

          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* ── Card Visual Preview ── */}
          <div className="px-6 pt-4 pb-2">
            <div className="relative h-44 w-full max-w-xs mx-auto" style={{ perspective: '1000px' }}>
              <div
                className="relative w-full h-full transition-all duration-700"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Card Front */}
                <div
                  className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    background: cardBrand === 'visa'
                      ? 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #1d4ed8 100%)'
                      : cardBrand === 'mastercard'
                      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                      : 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0e7490 100%)',
                  }}
                >
                  {/* Decorative circles */}
                  <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
                  <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-white/5" />
                  <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-white/5" />

                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-md">
                      <div className="grid grid-cols-2 gap-0.5 p-1">
                        <div className="w-1.5 h-1 bg-yellow-700/50 rounded-sm" />
                        <div className="w-1.5 h-1 bg-yellow-700/50 rounded-sm" />
                        <div className="w-1.5 h-1 bg-yellow-700/50 rounded-sm" />
                        <div className="w-1.5 h-1 bg-yellow-700/50 rounded-sm" />
                      </div>
                    </div>
                    {getCardBrandLogo()}
                  </div>

                  <div className="relative z-10">
                    <p className="text-white/90 text-lg font-mono tracking-widest mb-3 font-medium">
                      {maskedCardNumber()}
                    </p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">Kart Sahibi</p>
                        <p className="text-white font-medium text-sm uppercase tracking-wider truncate max-w-[160px]">
                          {formData.fullName || 'AD SOYAD'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">Son Tarih</p>
                        <p className="text-white font-medium text-sm font-mono">
                          {formData.expiryDate || 'MM/YY'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Back */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  }}
                >
                  <div className="h-10 bg-slate-700/80 mt-6" />
                  <div className="px-5 mt-4">
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-1">CVV</p>
                    <div className="bg-white/10 rounded-md px-4 py-2 flex justify-end">
                      <span className="text-white font-mono tracking-widest">
                        {formData.cvv ? '•'.repeat(formData.cvv.length) : '•••'}
                      </span>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-5">
                    {getCardBrandLogo()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Amount Badge ── */}
          <div className="flex justify-center mb-2">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-full px-5 py-1.5 flex items-center gap-2">
              <span className="text-cyan-400 font-bold text-lg">{amount} {currency.toUpperCase()}</span>
              <Lock className="w-3.5 h-3.5 text-cyan-400/70" />
            </div>
          </div>

          {/* ── Form ── */}
          <div className="px-6 pb-6 space-y-3 max-h-[55vh] overflow-y-auto">

            {/* Card Number */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Kart Numarası</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  onFocus={() => { setFocusedField('cardNumber'); setIsFlipped(false); }}
                  onBlur={() => setFocusedField('')}
                  maxLength={19}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono text-base tracking-widest outline-none transition-all duration-200
                    ${errors.cardNumber ? 'border-red-500/70 bg-red-500/5' : focusedField === 'cardNumber' ? 'border-cyan-500/50 bg-cyan-500/5 shadow-sm shadow-cyan-500/10' : 'border-white/10 hover:border-white/20'}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {cardBrand === 'visa' && <span className="text-blue-400 font-black text-sm italic">VISA</span>}
                  {cardBrand === 'mastercard' && (
                    <div className="flex">
                      <div className="w-4 h-4 rounded-full bg-red-500" />
                      <div className="w-4 h-4 rounded-full bg-yellow-400 -ml-2" />
                    </div>
                  )}
                  {cardBrand === 'amex' && <span className="text-blue-400 font-bold text-xs">AMEX</span>}
                  {!cardBrand && <div className="w-5 h-3.5 rounded bg-white/10" />}
                </div>
              </div>
              {errors.cardNumber && <p className="text-red-400 text-xs">{errors.cardNumber}</p>}
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Son Tarih</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  onFocus={() => { setFocusedField('expiryDate'); setIsFlipped(false); }}
                  onBlur={() => setFocusedField('')}
                  maxLength={5}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono text-base tracking-wider outline-none transition-all duration-200
                    ${errors.expiryDate ? 'border-red-500/70 bg-red-500/5' : focusedField === 'expiryDate' ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'}`}
                />
                {errors.expiryDate && <p className="text-red-400 text-xs">{errors.expiryDate}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">CVV</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="•••"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  onFocus={() => { setFocusedField('cvv'); setIsFlipped(true); }}
                  onBlur={() => { setFocusedField(''); setIsFlipped(false); }}
                  maxLength={4}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono text-base tracking-widest outline-none transition-all duration-200
                    ${errors.cvv ? 'border-red-500/70 bg-red-500/5' : focusedField === 'cvv' ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'}`}
                />
                {errors.cvv && <p className="text-red-400 text-xs">{errors.cvv}</p>}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Kart Üzerindeki Ad</label>
              <input
                type="text"
                placeholder="AD SOYAD"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value.toUpperCase())}
                onFocus={() => { setFocusedField('fullName'); setIsFlipped(false); }}
                onBlur={() => setFocusedField('')}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono text-sm uppercase tracking-widest outline-none transition-all duration-200
                  ${errors.fullName ? 'border-red-500/70 bg-red-500/5' : focusedField === 'fullName' ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'}`}
              />
              {errors.fullName && <p className="text-red-400 text-xs">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">E-posta</label>
              <input
                type="email"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none transition-all duration-200
                  ${errors.email ? 'border-red-500/70 bg-red-500/5' : focusedField === 'email' ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'}`}
              />
              {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
            </div>

            {/* Address + Phone (collapsible look, optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Telefon</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="05xx xxx xx xx"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField('')}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none transition-all duration-200
                    ${errors.phone ? 'border-red-500/70 bg-red-500/5' : focusedField === 'phone' ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'}`}
                />
                {errors.phone && <p className="text-red-400 text-xs">{errors.phone}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Şehir</label>
                <input
                  type="text"
                  placeholder="İstanbul"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  onFocus={() => setFocusedField('city')}
                  onBlur={() => setFocusedField('')}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none transition-all duration-200
                    ${errors.city ? 'border-red-500/70 bg-red-500/5' : focusedField === 'city' ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'}`}
                />
              </div>
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="px-6 pb-6 pt-2 space-y-3">
            {/* Security badges */}
            <div className="flex items-center justify-center gap-4 text-slate-500 text-xs">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500/70" />
                <span>256-bit SSL</span>
              </div>
              <div className="w-px h-3 bg-slate-700" />
              <div className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-cyan-500/70" />
                <span>Güvenli Ödeme</span>
              </div>
              <div className="w-px h-3 bg-slate-700" />
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500/70" />
                <span>PCI DSS</span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full relative overflow-hidden rounded-2xl py-4 font-semibold text-base text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed group"
              style={{
                background: isProcessing
                  ? 'linear-gradient(135deg, #0e7490, #1d4ed8)'
                  : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)',
                boxShadow: isProcessing ? 'none' : '0 0 30px rgba(6, 182, 212, 0.3), 0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              {/* Shine effect */}
              {!isProcessing && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              )}
              <div className="relative flex items-center justify-center gap-2.5">
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>İşleniyor...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Ödemeyi Tamamla — {amount} {currency.toUpperCase()}</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Close button (top right, outside modal on desktop) */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:right-auto sm:-top-4 sm:-right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
