import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreditCardDrawer from "./CreditCardDrawer";

interface CardPaymentButtonProps {
  amount: string;
  currency?: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
}

export default function CardPaymentButton({ 
  amount, 
  currency = "USD", 
  onSuccess, 
  onError,
  disabled = false 
}: CardPaymentButtonProps) {
  const [showCardDrawer, setShowCardDrawer] = useState(false);

  return (
    <>
      <div className="space-y-3">
        {/* Credit Card Payment Button */}
        <Button
          onClick={() => setShowCardDrawer(true)}
          disabled={disabled}
          className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 active:from-amber-600 active:to-amber-800 text-black font-bold py-4 px-6 rounded-xl text-base transition-all duration-300 shadow-lg hover:shadow-2xl relative overflow-hidden focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 transform hover:scale-105 active:scale-95"
          data-testid="credit-card-button"
        >
          <div className="flex items-center justify-center relative z-10">
            <CreditCard className="w-5 h-5 mr-3" />
            <span>Kredi Kartı ile Ödeme</span>
          </div>
          
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-300/30 to-amber-500/30 animate-pulse"></div>
          
          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 -skew-x-12 transform translate-x-full group-hover:translate-x-0"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
        </Button>

        {/* Secure Payment Info */}
        <div className="text-center space-y-1">
          <p className="text-xs text-slate-500">Tüm ödemeler 256-bit SSL ile şifrelenir</p>
          <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Güvenli Ödeme</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Hızlı İşlem</span>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Card Drawer */}
      <CreditCardDrawer
        open={showCardDrawer}
        onClose={() => setShowCardDrawer(false)}
        amount={amount}
        currency={currency}
        onSuccess={(orderId) => {
          setShowCardDrawer(false);
          onSuccess?.(orderId);
        }}
        onError={(error) => {
          setShowCardDrawer(false);
          onError?.(error);
        }}
      />
    </>
  );
}