import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Check, ArrowRight, Loader2, AlertCircle, Copy, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import UserShell from "@/components/UserShell";

export default function OrderSuccess() {
  const [, setLocation] = useLocation();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const copyOrderId = async (id: string) => {
    try { await navigator.clipboard.writeText(id); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch {}
  };

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setOrderDetails({
      orderId: p.get("orderId"),
      amount: p.get("amount"),
      paymentId: p.get("paymentId"),
    });
  }, []);

  const { data: ordersData, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/user/orders"],
    enabled: !!orderDetails?.orderId,
    retry: false,
  });

  const verifiedOrder = ordersData?.find((o: any) => o.id === orderDetails?.orderId);

  if (isLoading) {
    return (
      <UserShell hideBottomNav hideHeader>
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-3" />
          <p className="text-sm text-slate-500">Sipariş detayları kontrol ediliyor...</p>
        </div>
      </UserShell>
    );
  }

  if (error || (!verifiedOrder && orderDetails?.orderId)) {
    return (
      <UserShell title="Sipariş Bulunamadı" showBack backTo="/panel">
        <div className="user-card-elevated p-6 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Sipariş Bulunamadı</h2>
          <p className="text-sm text-slate-500 mb-4">Bu sipariş doğrulanamadı.</p>
          <button onClick={() => setLocation("/panel")}
            className="w-full h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm">
            Panele Dön
          </button>
        </div>
      </UserShell>
    );
  }

  return (
    <UserShell title="Ödeme Başarılı" hideBottomNav>
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 text-xs">
          {["Sepet", "Ödeme", "Onay"].map((s, i) => {
            const isActive = i === 2;
            return (
              <div key={s} className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 ${isActive ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? "bg-[#FFDD57] text-slate-900" : "bg-slate-200 text-slate-500"}`}>
                    {i + 1}
                  </span>
                  {s}
                </span>
                {i < 2 && <span className="w-4 h-px bg-slate-200" />}
              </div>
            );
          })}
        </div>

        <div className="user-card-elevated p-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-[#FFDD57] flex items-center justify-center mb-4 animate-scale-in shadow-[0_4px_16px_rgba(255,221,87,0.4)]">
            <Check className="h-9 w-9 text-slate-900" strokeWidth={3} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1.5">Ödemeniz Alındı</h1>
          <p className="text-sm text-slate-500 mb-5">Hesabınız etkinleştirildi ve paketleriniz kullanıma hazır.</p>

          {(verifiedOrder || orderDetails) && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-5 text-left text-sm space-y-1.5">
              {orderDetails?.orderId && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500">Sipariş ID</span>
                  <button
                    onClick={() => copyOrderId(orderDetails.orderId)}
                    className="flex items-center gap-1.5 text-slate-900 font-mono text-xs hover:text-[#7C5E00] transition"
                    data-testid="button-copy-order-id"
                    aria-label="Sipariş ID kopyala"
                  >
                    <span className="truncate max-w-[160px]">{orderDetails.orderId}</span>
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <Copy className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                  </button>
                </div>
              )}
              {(verifiedOrder?.totalUsd || orderDetails?.amount) && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Tutar</span>
                  <span className="text-emerald-600 font-bold">${verifiedOrder?.totalUsd || orderDetails?.amount}</span>
                </div>
              )}
              {verifiedOrder?.status && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Durum</span>
                  <span className="chip chip-success">Ödendi</span>
                </div>
              )}
              {orderDetails?.paymentId && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Ödeme ID</span>
                  <span className="text-slate-900 font-mono text-xs truncate max-w-[180px]">{orderDetails.paymentId}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={() => setLocation("/panel")}
              className="w-full h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm transition active:scale-[0.99] flex items-center justify-center gap-2"
              data-testid="redirect-now-button"
            >
              Aktif Paketinizi Görün <ArrowRight className="h-4 w-4" />
            </button>
            {orderDetails?.orderId && (
              <a
                href={`/api/orders/${orderDetails.orderId}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition flex items-center justify-center gap-2"
                data-testid="download-invoice-button"
              >
                <Download className="h-4 w-4" /> Faturayı İndir
              </a>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Sorun yaşarsanız · support@adegloba.space
        </p>
      </div>
    </UserShell>
  );
}
