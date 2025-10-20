import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { XCircle, AlertTriangle, RefreshCw, ArrowLeft, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type OrderStatus = 'cancelled' | 'failed' | 'pending' | 'timeout';

export default function OrderCancel() {
  const [, setLocation] = useLocation();
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('cancelled');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Parse URL parameters and determine order status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status') as OrderStatus || 'cancelled';
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');
    const reason = urlParams.get('reason');
    
    setOrderStatus(status);
    setOrderDetails({
      orderId,
      amount,
      reason: reason || getDefaultReason(status)
    });
  }, []);

  const getDefaultReason = (status: OrderStatus): string => {
    switch (status) {
      case 'cancelled':
        return 'Ödeme işlemi kullanıcı tarafından iptal edildi';
      case 'failed':
        return 'Ödeme işlemi başarısız oldu';
      case 'pending':
        return 'Ödeme işlemi henüz tamamlanmadı';
      case 'timeout':
        return 'Ödeme işlemi zaman aşımına uğradı';
      default:
        return 'Ödeme işlemi tamamlanamadı';
    }
  };

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'cancelled':
        return {
          icon: XCircle,
          title: "Ödeme İptal Edildi",
          description: "Ödeme işleminiz iptal edildi. İstediğiniz zaman tekrar deneyebilirsiniz.",
          bgColor: "from-orange-500/20 to-red-500/20",
          borderColor: "border-orange-500/30",
          iconColor: "text-orange-400",
          accentColor: "text-orange-400"
        };
      case 'failed':
        return {
          icon: XCircle,
          title: "Ödeme Başarısız",
          description: "Ödeme işleminiz başarısız oldu. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.",
          bgColor: "from-red-500/20 to-pink-500/20",
          borderColor: "border-red-500/30",
          iconColor: "text-red-400",
          accentColor: "text-red-400"
        };
      case 'pending':
        return {
          icon: AlertTriangle,
          title: "Ödeme Bekleniyor",
          description: "Ödeme işleminiz henüz tamamlanmadı. Bu durum birkaç dakika sürebilir.",
          bgColor: "from-yellow-500/20 to-orange-500/20",
          borderColor: "border-yellow-500/30",
          iconColor: "text-yellow-400",
          accentColor: "text-yellow-400"
        };
      case 'timeout':
        return {
          icon: RefreshCw,
          title: "İşlem Zaman Aşımı",
          description: "Ödeme işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.",
          bgColor: "from-blue-500/20 to-cyan-500/20",
          borderColor: "border-blue-500/30",
          iconColor: "text-blue-400",
          accentColor: "text-blue-400"
        };
    }
  };

  const statusConfig = getStatusConfig(orderStatus);
  const IconComponent = statusConfig.icon;

  const handleRetryPayment = () => {
    setLocation("/checkout");
  };

  const handleBackToCart = () => {
    setLocation("/sepet");
  };

  const handleGoToPackages = () => {
    setLocation("/paketler");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Status Card */}
        <Card className={`glassmorphism border ${statusConfig.borderColor} bg-gradient-to-br ${statusConfig.bgColor} p-8 text-center`}>
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center`}>
              <IconComponent className={`w-10 h-10 ${statusConfig.iconColor}`} />
            </div>
          </div>

          {/* Main Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              {statusConfig.title}
            </h1>
            <p className="text-lg text-slate-300 mb-6">
              {statusConfig.description}
            </p>
            
            {orderDetails && (
              <Alert className="bg-slate-800/30 border-slate-600/50 mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-slate-300">
                  <div className="space-y-2 text-left">
                    {orderDetails.reason && (
                      <div>
                        <span className="font-medium text-white">Sebep: </span>
                        <span>{orderDetails.reason}</span>
                      </div>
                    )}
                    {orderDetails.orderId && (
                      <div>
                        <span className="font-medium text-white">Referans: </span>
                        <span className="font-mono text-sm">{orderDetails.orderId}</span>
                      </div>
                    )}
                    {orderDetails.amount && (
                      <div>
                        <span className="font-medium text-white">Tutar: </span>
                        <span className={statusConfig.accentColor}>${orderDetails.amount}</span>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {orderStatus !== 'pending' && (
              <Button
                onClick={handleRetryPayment}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl text-base transition-all duration-200 shadow-lg hover:shadow-xl"
                data-testid="retry-payment-button"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Ödemeyi Tekrar Dene
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleBackToCart}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white py-2 rounded-xl text-sm transition-all duration-200"
                data-testid="back-to-cart-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sepete Dön
              </Button>
              
              <Button
                onClick={handleGoToPackages}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white py-2 rounded-xl text-sm transition-all duration-200"
                data-testid="view-packages-button"
              >
                Paketleri Gör
              </Button>
            </div>
          </div>
        </Card>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm mb-2">
            Sorun devam ederse destek ekibimizle iletişime geçin
          </p>
          <div className="flex justify-center space-x-4 text-xs text-slate-500">
            <span>📧 support@adegloba.space</span>
            <span>📱 +44 744 022 5375</span>
            <span>📞 7/24 Teknik Destek</span>
          </div>
        </div>

        {/* Troubleshooting Tips */}
        {(orderStatus === 'failed' || orderStatus === 'timeout') && (
          <Card className="mt-6 glassmorphism border border-slate-600/30 bg-slate-800/30 p-4">
            <h3 className="text-white font-semibold mb-3 text-sm">💡 Sorun Giderme İpuçları:</h3>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• Kart bilgilerinizin doğru olduğundan emin olun</li>
              <li>• Kartınızda yeterli bakiye bulunduğundan emin olun</li>
              <li>• İnternet bağlantınızı kontrol edin</li>
              <li>• Farklı bir tarayıcı veya cihaz deneyin</li>
              <li>• Güvenlik duvarı veya VPN kullanıyorsanız kapatmayı deneyin</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}