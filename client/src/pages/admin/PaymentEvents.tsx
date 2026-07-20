import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, CreditCard, AlertCircle, CheckCircle2, ShieldBan } from "lucide-react";

const EVENT_TYPE_LABELS: Record<string, string> = {
  complete_payment: "Ödeme Başlatıldı",
  complete_success: "Ödeme Başarılı",
  complete_failed: "Ödeme Başarısız",
  idempotency_block: "Çift Ödeme Engellendi",
  capture_attempt: "Yakalama Denendi",
  capture_success: "Yakalama Başarılı",
  capture_failed: "Yakalama Başarısız",
  create_order: "Sipariş Oluşturuldu",
};

const STATUS_BADGE: Record<string, { label: string; className: string; icon: any }> = {
  ok:      { label: "Başarılı", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  error:   { label: "Hata",     className: "bg-red-500/15 text-red-400 border-red-500/30",             icon: AlertCircle },
  blocked: { label: "Engellendi", className: "bg-amber-500/15 text-amber-400 border-amber-500/30",     icon: ShieldBan },
};

function formatDuration(ms: number | null): string {
  if (ms == null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(ts: string | null): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function PaymentEvents() {
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState("all");
  const [status, setStatus] = useState("all");
  const [paypalOrderId, setPaypalOrderId] = useState("");
  const pageSize = 50;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(eventType !== "all" && { eventType }),
    ...(status !== "all" && { status }),
    ...(paypalOrderId.trim() && { paypalOrderId: paypalOrderId.trim() }),
  });

  const { data, isLoading, refetch, isFetching } = useQuery<{ events: any[]; total: number }>({
    queryKey: ["/api/admin/payment-events", page, eventType, status, paypalOrderId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/payment-events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleFilter = () => { setPage(1); refetch(); };

  return (
    <AdminLayout title="Ödeme Olayları">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-cyan-400" />
              Ödeme Olayları
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Tüm PayPal ödeme adımları ve çift ödeme engellemeleri
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        </div>

        <Card className="bg-slate-900/60 border-slate-700 p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-slate-400 mb-1 block">Olay Türü</label>
              <Select value={eventType} onValueChange={v => { setEventType(v); setPage(1); }}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-slate-400 mb-1 block">Durum</label>
              <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="ok">Başarılı</SelectItem>
                  <SelectItem value="error">Hata</SelectItem>
                  <SelectItem value="blocked">Engellendi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-slate-400 mb-1 block">PayPal Sipariş ID</label>
              <Input
                value={paypalOrderId}
                onChange={e => setPaypalOrderId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleFilter()}
                placeholder="PayPal Order ID ara..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Kayıtlı ödeme olayı bulunamadı.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                    <th className="text-left px-4 py-3">Tarih</th>
                    <th className="text-left px-4 py-3">Olay</th>
                    <th className="text-left px-4 py-3">Durum</th>
                    <th className="text-left px-4 py-3">PayPal Order ID</th>
                    <th className="text-left px-4 py-3">DB Order ID</th>
                    <th className="text-left px-4 py-3">Kullanıcı</th>
                    <th className="text-left px-4 py-3">Tutar</th>
                    <th className="text-left px-4 py-3">Süre</th>
                    <th className="text-left px-4 py-3">Hata</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => {
                    const s = STATUS_BADGE[ev.status] ?? STATUS_BADGE.ok;
                    const Icon = s.icon;
                    return (
                      <tr key={ev.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap font-mono text-xs">
                          {formatDate(ev.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-white">
                          {EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${s.className} border flex items-center gap-1 w-fit text-xs`}>
                            <Icon className="h-3 w-3" />
                            {s.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-cyan-400 max-w-[160px] truncate">
                          {ev.paypalOrderId ?? "-"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[120px] truncate">
                          {ev.dbOrderId ?? "-"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[100px] truncate">
                          {ev.userId ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-mono text-xs">
                          {ev.amountUsd ? `$${ev.amountUsd}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                          {formatDuration(ev.durationMs)}
                        </td>
                        <td className="px-4 py-3 text-red-400 text-xs max-w-[200px] truncate" title={ev.errorMessage ?? ""}>
                          {ev.errorMessage ?? "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{total} kayıt, sayfa {page}/{totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
