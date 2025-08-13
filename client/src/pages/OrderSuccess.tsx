import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrderSuccess() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Parse URL parameters for order details
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');
    const paymentId = urlParams.get('paymentId');
    
    setOrderDetails({
      orderId,
      amount,
      paymentId
    });
  }, []);

  // Countdown and auto-redirect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setLocation("/panel");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setLocation]);

  const handleRedirectNow = () => {
    setLocation("/panel");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Success Card */}
        <Card className="glassmorphism border border-green-500/30 bg-slate-900/50 p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Main Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Ödemeniz Kabul Edildi!
            </h1>
            <p className="text-lg text-slate-300 mb-4">
              Başarılı bir şekilde ödeme işleminiz tamamlandı.
            </p>
            
            {orderDetails && (
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-white font-semibold mb-3">Sipariş Detayları:</h3>
                <div className="space-y-2 text-sm">
                  {orderDetails.orderId && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sipariş ID:</span>
                      <span className="text-white font-mono">{orderDetails.orderId}</span>
                    </div>
                  )}
                  {orderDetails.amount && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tutar:</span>
                      <span className="text-green-400 font-semibold">${orderDetails.amount}</span>
                    </div>
                  )}
                  {orderDetails.paymentId && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ödeme ID:</span>
                      <span className="text-white font-mono text-xs">{orderDetails.paymentId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Auto-redirect countdown */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-3 text-cyan-400 mb-4">
              <Clock className="w-5 h-5" />
              <span className="text-lg font-semibold">
                {countdown} saniye içinde müşteri paneline yönlendiriliyorsunuz
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-700 rounded-full h-2 mb-6">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRedirectNow}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl text-base transition-all duration-200 shadow-lg hover:shadow-xl"
              data-testid="redirect-now-button"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Şimdi Panel'e Git
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Hesabınız etkinleştirildi ve tüm paketleriniz kullanıma hazır
              </p>
            </div>
          </div>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm mb-2">
            Herhangi bir sorun yaşarsanız destek ekibimizle iletişime geçin
          </p>
          <div className="flex justify-center space-x-4 text-xs text-slate-500">
            <span>📧 support@adegloba.com</span>
            <span>📱 WhatsApp Destek</span>
          </div>
        </div>
      </div>
    </div>
  );
}