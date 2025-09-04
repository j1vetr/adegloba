import { useState, useEffect } from "react";
import { X, CreditCard, Lock, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  
  // Fetch user data to auto-populate form
  const { data: user } = useQuery({
    queryKey: ['/api/user/me'],
    enabled: isOpen, // Only fetch when drawer is open
  });

  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    fullName: '', // Single field for full name instead of separate first/last
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

  // Auto-populate form with user data when drawer opens
  useEffect(() => {
    if (isOpen && user) {
      const userData = user as any; // Type assertion for user data
      
      setFormData(prev => ({
        ...prev,
        fullName: userData.full_name || '', // Use full name directly
        email: userData.email || '',
        phone: userData.phone || '',
        addressLine1: userData.address || '',
        city: '', // Keep empty as we don't have separate city field in user
        region: '', // Keep empty as we don't have separate region field in user
        postalCode: '' // Keep empty as we don't have postal code in user
      }));
    }
  }, [isOpen, user]);

  // Detect card brand from number
  const detectCardBrand = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6011|^644|^65/.test(cleaned)) return 'discover';
    return '';
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  // Format expiry date MM/YY
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
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Geçerli bir kart numarası girin';
    }
    
    if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'MM/YY formatında girin';
    }
    
    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'Geçerli CVV girin';
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Ad ve soyadınızı girin';
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    // Adres alanları opsiyonel - sadece doldurulmuşsa kontrol et
    if (formData.addressLine1.trim() && formData.addressLine1.trim().length < 5) {
      newErrors.addressLine1 = 'Adres en az 5 karakter olmalı';
    }

    if (formData.city.trim() && formData.city.trim().length < 2) {
      newErrors.city = 'Şehir adı en az 2 karakter olmalı';
    }

    if (formData.phone.trim() && formData.phone.trim().length < 10) {
      newErrors.phone = 'Telefon numarası en az 10 haneli olmalı';
    }

    console.log('Form validation errors:', newErrors);
    console.log('Form data:', formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Hata",
        description: "Lütfen tüm gerekli alanları doğru şekilde doldurun",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Validate and prepare card details
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.fullName) {
        throw new Error('Eksik kart bilgileri. Lütfen tüm alanları doldurun.');
      }

      const cardPayload = {
        amount: parseFloat(amount).toString(),
        currency: currency,
        intent: 'CAPTURE',
        paymentMethod: 'CARD',
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
            countryCode: 'TR'
          }
        }
      };

      console.log('🔍 Frontend Card Payload:', {
        ...cardPayload,
        cardDetails: {
          ...cardPayload.cardDetails,
          number: cardPayload.cardDetails.number.slice(0, 4) + '****',
          securityCode: '***'
        }
      });

      // Create PayPal order for credit card processing with card details
      const createResponse = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardPayload),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Order creation failed');
      }

      const createData = await createResponse.json();
      console.log('PayPal card order created:', createData);

      // Check if payment is already completed (auto-captured)
      if (createData.status === 'COMPLETED') {
        toast({
          title: "Ödeme Başarılı",
          description: "Kredi kartı ödemesi başarıyla tamamlandı.",
        });
        
        // Call completeOrderMutation with PayPal Order ID
        onSuccess?.({ 
          method: 'card', 
          amount, 
          currency,
          orderId: createData.id,
          paymentId: createData.id,
          paypalOrderId: createData.id  // Pass PayPal Order ID for backend
        });
        return;
      }

      // If not completed, try to capture (fallback for orders not auto-captured)
      toast({
        title: "Kart İşleniyor",
        description: "Kredi kartı bilgileri doğrulanıyor...",
      });
      
      // Simulate PayPal card validation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Capture the payment
      const captureResponse = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: createData.id,
        }),
      });

      if (!captureResponse.ok) {
        const errorData = await captureResponse.json();
        // If already captured, treat as success
        if (errorData.message?.includes('ORDER_ALREADY_CAPTURED')) {
          toast({
            title: "Ödeme Başarılı",
            description: "Kredi kartı ödemesi başarıyla tamamlandı.",
          });
          
          // Call completeOrderMutation with PayPal Order ID
          onSuccess?.({ 
            method: 'card', 
            amount, 
            currency,
            orderId: createData.id,
            paymentId: createData.id,
            paypalOrderId: createData.id  // Pass PayPal Order ID for backend
          });
          return;
        }
        throw new Error(errorData.message || 'Payment capture failed');
      }

      const captureData = await captureResponse.json();
      console.log('PayPal card payment captured:', captureData);

      if (captureData.status === 'COMPLETED') {
        toast({
          title: "Ödeme Başarılı",
          description: "Kredi kartı ödemesi başarıyla tamamlandı.",
        });
        
        // Call completeOrderMutation with PayPal Order ID
        onSuccess?.({ 
          method: 'card', 
          amount, 
          currency,
          orderId: createData.id,
          paymentId: captureData.id,
          paypalOrderId: createData.id  // Pass PayPal Order ID for backend
        });
      } else {
        throw new Error('Payment not completed');
      }
      
    } catch (error) {
      console.error('Credit card payment error:', error);
      toast({
        title: "Ödeme Hatası",
        description: error instanceof Error ? error.message : "Kart ödemesi işlenirken bir hata oluştu",
        variant: "destructive"
      });
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCardIcon = () => {
    switch (cardBrand) {
      case 'visa':
        return <span className="text-blue-400 font-bold text-sm">VISA</span>;
      case 'mastercard':
        return <span className="text-red-400 font-bold text-sm">MC</span>;
      case 'amex':
        return <span className="text-green-400 font-bold text-sm">AMEX</span>;
      default:
        return <CreditCard className="w-4 h-4 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] sm:max-h-[90vh] transform transition-all duration-300 ease-out scale-100">
        <div className="flex flex-col h-full glassmorphism border border-slate-600/30 bg-slate-950/95 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full glassmorphism flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Kart ile Ödeme</h2>
                <p className="text-sm text-slate-400">Güvenli ödeme işlemi</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Card Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Kart Bilgileri
                </h3>
                
                {/* Card Number */}
                <div>
                  <Label className="text-slate-300">Kart Numarası</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      maxLength={19}
                      className={`glassmorphism border-slate-600 text-white placeholder-slate-500 pr-12 h-12 text-lg tracking-wider
                        focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 ${errors.cardNumber ? 'border-red-500' : ''}`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getCardIcon()}
                    </div>
                  </div>
                  {errors.cardNumber && (
                    <p className="text-red-400 text-sm mt-1">{errors.cardNumber}</p>
                  )}
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Son Kullanma</Label>
                    <Input
                      type="text"
                      placeholder="MM/YY"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      maxLength={5}
                      className={`glassmorphism border-slate-600 text-white placeholder-slate-500 h-12 text-lg tracking-wider
                        focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 ${errors.expiryDate ? 'border-red-500' : ''}`}
                    />
                    {errors.expiryDate && (
                      <p className="text-red-400 text-sm mt-1">{errors.expiryDate}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">CVV</Label>
                    <Input
                      type="text"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      maxLength={4}
                      className={`glassmorphism border-slate-600 text-white placeholder-slate-500 h-12 text-lg tracking-wider
                        focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 ${errors.cvv ? 'border-red-500' : ''}`}
                    />
                    {errors.cvv && (
                      <p className="text-red-400 text-sm mt-1">{errors.cvv}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-green-400" />
                  Kişisel Bilgiler
                </h3>
                
                {/* Full Name - Single field */}
                <div>
                  <Label className="text-slate-300">Ad Soyad</Label>
                  <Input
                    type="text"
                    placeholder="Adınız ve soyadınız"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`glassmorphism border-slate-600 text-white placeholder-slate-500 h-12
                      focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 ${errors.fullName ? 'border-red-500' : ''}`}
                  />
                  {errors.fullName && (
                    <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label className="text-slate-300">E-posta Adresi</Label>
                  <Input
                    type="email"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`glassmorphism border-slate-600 text-white placeholder-slate-500 h-12
                      focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Address Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  Adres Bilgileri
                </h3>
                
                {/* Address */}
                <div>
                  <Label className="text-slate-300">Adres</Label>
                  <Input
                    type="text"
                    placeholder="Tam adres bilgilerinizi girin"
                    value={formData.addressLine1}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                    className={`glassmorphism border-slate-600 text-white placeholder-slate-500 h-12
                      focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 ${errors.addressLine1 ? 'border-red-500' : ''}`}
                  />
                  {errors.addressLine1 && (
                    <p className="text-red-400 text-sm mt-1">{errors.addressLine1}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <Label className="text-slate-300">Telefon Numarası</Label>
                  <Input
                    type="tel"
                    placeholder="0532 123 45 67"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`glassmorphism border-slate-600 text-white placeholder-slate-500 h-12
                      focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Footer - Sticky */}
          <div className="border-t border-slate-700/50 p-3 sm:p-4 md:p-6 bg-slate-950/98 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">Güvenli Ödeme</div>
                  <div className="text-slate-400 text-xs sm:text-sm">256-bit SSL şifreli</div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  {amount} {currency.toUpperCase()}
                </div>
                <div className="text-slate-400 text-sm">Toplam tutar</div>
              </div>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 
                hover:from-cyan-600 hover:to-blue-700 text-white border-none shadow-xl shadow-cyan-500/30
                disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  İşleniyor...
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  Ödemeyi Güvenle Tamamla
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}