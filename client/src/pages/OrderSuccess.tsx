import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import UserShell from "@/components/UserShell";

export default function OrderSuccess() {
  const [, setLocation] = useLocation();
  const [orderDetails, setOrderDetails] = useState<any>(null);

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
        <div className="max-w-md mx-auto user-card-elevated p-6 text-center">
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
      <div className="max-w-md mx-auto space-y-4">
        <div className="user-card-elevated p-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 animate-scale-in">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1.5">Ödemeniz Kabul Edildi</h1>
          <p className="text-sm text-slate-500 mb-5">Hesabınız etkinleştirildi ve paketleriniz kullanıma hazır.</p>

          {(verifiedOrder || orderDetails) && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-5 text-left text-sm space-y-1.5">
              {orderDetails?.orderId && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Sipariş ID</span>
                  <span className="text-slate-900 font-mono text-xs truncate max-w-[180px]">{orderDetails.orderId}</span>
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

          <button
            onClick={() => setLocation("/panel")}
            className="w-full h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm transition active:scale-[0.99] flex items-center justify-center gap-2"
            data-testid="redirect-now-button"
          >
            Müşteri Paneline Git <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          Sorun yaşarsanız · support@adegloba.space
        </p>
      </div>
    </UserShell>
  );
}
