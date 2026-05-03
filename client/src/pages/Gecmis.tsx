import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Loader2, History, Archive, ChevronLeft, ChevronRight } from "lucide-react";
import UserShell from "@/components/UserShell";

const IST = "Europe/Istanbul";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", timeZone: IST });
const fmtPrice = (p: string | number) => `$${Number(p).toFixed(2)}`;

export default function Gecmis() {
  const { user, isLoading: authLoading } = useUserAuth();
  const [tab, setTab] = useState<"orders" | "expired">("orders");
  const [expiredPage, setExpiredPage] = useState(1);
  const expiredPageSize = 6;

  const { data: userOrders, isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/user/orders"], enabled: !!user, staleTime: 0,
  });
  const { data: expiredData, isLoading: expiredLoading } = useQuery<any>({
    queryKey: ["/api/user/expired-packages", expiredPage],
    queryFn: async () => {
      const r = await fetch(`/api/user/expired-packages?page=${expiredPage}&pageSize=${expiredPageSize}`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!user,
  });

  if (authLoading) {
    return <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>;
  }
  if (!user) { window.location.href = "/giris"; return null; }

  return (
    <UserShell title="Geçmiş" showBack backTo="/panel">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1.5 bg-white border border-slate-200/70 rounded-2xl p-1.5">
          <button
            onClick={() => setTab("orders")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
              tab === "orders" ? "bg-[#FFDD57] text-slate-900" : "text-slate-500 hover:text-slate-900"
            }`}
            data-testid="tab-orders"
          >
            <History className="w-3.5 h-3.5" /> Siparişler
          </button>
          <button
            onClick={() => setTab("expired")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
              tab === "expired" ? "bg-[#FFDD57] text-slate-900" : "text-slate-500 hover:text-slate-900"
            }`}
            data-testid="tab-expired"
          >
            <Archive className="w-3.5 h-3.5" /> Süresi Bitmiş
          </button>
        </div>

        {tab === "orders" && (
          <div className="space-y-3">
            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : userOrders && userOrders.length > 0 ? (
              userOrders.map((order: any) => {
                const isPaid = !!order.paidAt;
                const isCancelled = order.status === "cancelled";
                return (
                  <div key={order.id} className="user-card p-4" data-testid={`order-card-${order.id}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-slate-900 font-semibold text-sm">Sipariş #{order.id.slice(-8)}</p>
                        <p className="text-slate-500 text-xs">{fmtDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-bold text-sm">{fmtPrice(order.totalUsd)}</span>
                        <span className={`chip ${isCancelled ? "chip-danger" : isPaid ? "chip-success" : "chip-warning"}`}>
                          {isCancelled ? "İptal" : isPaid ? "Ödendi" : "Beklemede"}
                        </span>
                      </div>
                    </div>
                    {order.orderItems?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mt-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#FFF6D6] flex items-center justify-center">
                            <span className="text-[#7C5E00] text-xs font-bold">{item.plan?.dataLimitGb}</span>
                          </div>
                          <span className="text-slate-700 text-xs">{item.plan?.name}</span>
                        </div>
                        <span className="text-slate-700 text-xs font-medium">{fmtPrice(item.unitPriceUsd)}</span>
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              <div className="user-card text-center py-12 px-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <History className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-900 font-semibold text-sm mb-1">Sipariş Geçmişi Yok</p>
                <p className="text-slate-500 text-xs">Henüz sipariş vermemişsiniz.</p>
              </div>
            )}
          </div>
        )}

        {tab === "expired" && (
          <div className="space-y-3">
            {expiredLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : expiredData?.packages?.length ? (
              <>
                {expiredData.packages.map((pkg: any) => (
                  <div key={pkg.credentialId} className="user-card overflow-hidden" data-testid={`expired-package-card-${pkg.credentialId}`}>
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-14 h-14 rounded-xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xl font-black text-rose-500 leading-none">{pkg.dataLimitGb}</span>
                        <span className="text-xs text-rose-400 font-semibold">GB</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-slate-900 font-semibold text-sm truncate">{pkg.planName}</p>
                          <span className="chip chip-danger shrink-0 ml-2">Bitti</span>
                        </div>
                        <p className="text-slate-500 text-xs">Satın alma: {fmtDate(pkg.purchaseDate)}</p>
                        <p className="text-rose-500 text-xs">Bitiş: {fmtDate(pkg.expiredDate)}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono">{pkg.username}</span><span>·</span><span className="font-mono">{pkg.maskedPassword}</span>
                      </div>
                      <span className="text-slate-400 text-xs">Kullanılamaz</span>
                    </div>
                  </div>
                ))}

                {expiredData.pagination?.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 text-xs">{expiredData.pagination.currentPage} / {expiredData.pagination.totalPages} sayfa</span>
                    <div className="flex gap-2">
                      <button onClick={() => setExpiredPage(p => Math.max(1, p - 1))} disabled={expiredData.pagination.currentPage === 1} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs disabled:opacity-40 hover:bg-slate-50" data-testid="pagination-prev">
                        <ChevronLeft className="w-3.5 h-3.5" /> Önceki
                      </button>
                      <button onClick={() => setExpiredPage(p => Math.min(expiredData.pagination.totalPages, p + 1))} disabled={expiredData.pagination.currentPage === expiredData.pagination.totalPages} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs disabled:opacity-40 hover:bg-slate-50" data-testid="pagination-next">
                        Sonraki <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="user-card text-center py-12 px-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Archive className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-900 font-semibold text-sm mb-1">Süresi Bitmiş Paket Yok</p>
                <p className="text-slate-500 text-xs">Henüz süresi dolan paketiniz yok.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </UserShell>
  );
}
