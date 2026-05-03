import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { XCircle, AlertTriangle, RefreshCw, ArrowLeft, CreditCard } from "lucide-react";
import UserShell from "@/components/UserShell";

type OrderStatus = "cancelled" | "failed" | "pending" | "timeout";

export default function OrderCancel() {
  const [, setLocation] = useLocation();
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("cancelled");
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const status = (p.get("status") as OrderStatus) || "cancelled";
    setOrderStatus(status);
    setOrderDetails({
      orderId: p.get("orderId"),
      amount: p.get("amount"),
      reason: p.get("reason") || defReason(status),
    });
  }, []);

  const defReason = (s: OrderStatus) =>
    ({ cancelled: "Ödeme işlemi kullanıcı tarafından iptal edildi",
       failed: "Ödeme işlemi başarısız oldu",
       pending: "Ödeme işlemi henüz tamamlanmadı",
       timeout: "Ödeme işlemi zaman aşımına uğradı" }[s] || "Ödeme tamamlanamadı");

  const cfg = {
    cancelled: { icon: XCircle, title: "Ödeme İptal Edildi", desc: "Ödeme işleminiz iptal edildi. İstediğiniz zaman tekrar deneyebilirsiniz.", chip: "chip-warning", iconBg: "bg-amber-50 text-amber-600" },
    failed:    { icon: XCircle, title: "Ödeme Başarısız",    desc: "Ödeme işleminiz başarısız oldu. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.", chip: "chip-danger", iconBg: "bg-rose-50 text-rose-600" },
    pending:   { icon: AlertTriangle, title: "Ödeme Bekleniyor", desc: "Ödeme işleminiz henüz tamamlanmadı. Bu durum birkaç dakika sürebilir.", chip: "chip-warning", iconBg: "bg-amber-50 text-amber-600" },
    timeout:   { icon: RefreshCw, title: "İşlem Zaman Aşımı", desc: "Ödeme işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.", chip: "chip-info", iconBg: "bg-sky-50 text-sky-600" },
  }[orderStatus];

  const Icon = cfg.icon;

  return (
    <UserShell title="Ödeme Durumu" showBack backTo="/sepet">
      <div className="max-w-md mx-auto space-y-4">
        <div className="user-card-elevated p-6 text-center">
          <div className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-4 ${cfg.iconBg}`}>
            <Icon className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1.5">{cfg.title}</h1>
          <p className="text-sm text-slate-500 mb-5">{cfg.desc}</p>

          {orderDetails && (orderDetails.reason || orderDetails.orderId || orderDetails.amount) && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-5 text-left text-sm space-y-1.5">
              {orderDetails.reason && (<div className="flex justify-between gap-2"><span className="text-slate-500">Sebep</span><span className="text-slate-900 text-right">{orderDetails.reason}</span></div>)}
              {orderDetails.orderId && (<div className="flex justify-between gap-2"><span className="text-slate-500">Referans</span><span className="text-slate-900 font-mono text-xs truncate max-w-[180px]">{orderDetails.orderId}</span></div>)}
              {orderDetails.amount && (<div className="flex justify-between gap-2"><span className="text-slate-500">Tutar</span><span className="text-slate-900 font-semibold">${orderDetails.amount}</span></div>)}
            </div>
          )}

          <div className="space-y-2">
            {orderStatus !== "pending" && (
              <button
                onClick={() => setLocation("/checkout")}
                className="w-full h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm transition active:scale-[0.99] flex items-center justify-center gap-2"
                data-testid="retry-payment-button"
              >
                <CreditCard className="h-4 w-4" /> Ödemeyi Tekrar Dene
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLocation("/sepet")}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition flex items-center justify-center gap-1.5"
                data-testid="back-to-cart-button"
              >
                <ArrowLeft className="h-4 w-4" /> Sepete Dön
              </button>
              <button
                onClick={() => setLocation("/paketler")}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition"
                data-testid="view-packages-button"
              >
                Paketleri Gör
              </button>
            </div>
          </div>
        </div>

        {(orderStatus === "failed" || orderStatus === "timeout") && (
          <div className="user-card p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Sorun Giderme İpuçları</h3>
            <ul className="space-y-1 text-xs text-slate-500">
              <li>• Kart bilgilerinizin doğru olduğundan emin olun</li>
              <li>• Kartınızda yeterli bakiye bulunduğundan emin olun</li>
              <li>• İnternet bağlantınızı kontrol edin</li>
              <li>• Farklı bir tarayıcı veya cihaz deneyin</li>
            </ul>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          Sorun devam ederse · support@adegloba.space
        </p>
      </div>
    </UserShell>
  );
}
