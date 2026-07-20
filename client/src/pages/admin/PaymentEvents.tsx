import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, CreditCard, AlertCircle, CheckCircle2, ShieldBan, ChevronDown, ChevronRight } from "lucide-react";

const EVENT_TYPE_LABELS: Record<string, string> = {
  order_create_request: "Sipariş Talebi",
  order_create_success: "Sipariş Oluşturuldu",
  order_create_failed: "Sipariş Oluşturulamadı",
  capture_request: "Ödeme Yakalama Talebi",
  capture_success: "Ödeme Yakalandı",
  capture_failed: "Ödeme Yakalanamadı",
  complete_request: "Tamamlama Talebi",
  complete_success: "Ödeme Tamamlandı",
  complete_failed: "Tamamlama Başarısız",
  duplicate_attempt_blocked: "Çift Ödeme Engellendi",
};

const STATUS_BADGE: Record<string, { label: string; className: string; icon: any }> = {
  ok:      { label: "Başarılı",   className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  error:   { label: "Hata",       className: "bg-red-500/15 text-red-400 border-red-500/30",             icon: AlertCircle },
  blocked: { label: "Engellendi", className: "bg-amber-500/15 text-amber-400 border-amber-500/30",       icon: ShieldBan },
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

function MetadataCell({ metadata }: { metadata: any }) {
  const [open, setOpen] = useState(false);
  if (!metadata) return <span className="text-slate-600">-</span>;
  const preview = typeof metadata === "object"
    ? Object.keys(metadata).slice(0, 2).map(k => `${k}: ${JSON.stringify(metadata[k])}`).join(", ")
    : String(metadata);
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {open ? "Gizle" : "Göster"}
      </button>
      {open && (
        <pre className="mt-1 text-xs text-slate-300 bg-slate-800 rounded p-2 max-w-xs overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
      {!open && (
        <span className="text-xs text-slate-500 truncate block max-w-[180px]">{preview}</span>
      )}
    </div>
  );
}

export default function PaymentEvents() {
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState("all");
  const [status, setStatus] = useState("all");
  const [paypalOrderId, setPaypalOrderId] = useState("");
  const [username, setUsername] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const pageSize = 50;

  const buildParams = () => new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(eventType !== "all" && { eventType }),
    ...(status !== "all" && { status }),
    ...(paypalOrderId.trim() && { paypalOrderId: paypalOrderId.trim() }),
    ...(username.trim() && { username: username.trim() }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const { data, isLoading, refetch, isFetching } = useQuery<{ events: any[]; total: number }>({
    queryKey: ["/api/admin/payment-events", page, eventType, status, paypalOrderId, username, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/admin/payment-events?${buildParams()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleReset = () => {
    setPage(1);
    setEventType("all");
    setStatus("all");
    setPaypalOrderId("");
    setUsername("");
    setStartDate("");
    setEndDate("");
  };

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
              Tüm PayPal ödeme adımları ve çift ödeme engellemeleri ({total} kayıt)
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Olay Türü</label>
              <Select value={eventType} onValueChange={v => { setEventType(v); setPage(1); }}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v} ({k})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Durum</label>
              <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm h-9">
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
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Kullanıcı Adı</label>
              <Input
                value={username}
                onChange={e => { setUsername(e.target.value); setPage(1); }}
                placeholder="kullanici ara..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">PayPal Order ID</label>
              <Input
                value={paypalOrderId}
                onChange={e => { setPaypalOrderId(e.target.value); setPage(1); }}
                placeholder="PayPal ID ara..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Başlangıç Tarihi</label>
              <Input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                className="bg-slate-800 border-slate-700 text-white h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Bitiş Tarihi</label>
              <div className="flex gap-1">
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); setPage(1); }}
                  className="bg-slate-800 border-slate-700 text-white h-9 text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-9 px-2 text-slate-400 hover:text-white"
                  title="Filtreleri Temizle"
                >
                  ×
                </Button>
              </div>
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
                    <th className="text-left px-3 py-3 whitespace-nowrap">Tarih</th>
                    <th className="text-left px-3 py-3">Olay</th>
                    <th className="text-left px-3 py-3">Durum</th>
                    <th className="text-left px-3 py-3">Kullanıcı</th>
                    <th className="text-left px-3 py-3">PayPal Order ID</th>
                    <th className="text-left px-3 py-3">DB Order ID</th>
                    <th className="text-left px-3 py-3">Tutar</th>
                    <th className="text-left px-3 py-3">Süre</th>
                    <th className="text-left px-3 py-3">Hata</th>
                    <th className="text-left px-3 py-3">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => {
                    const s = STATUS_BADGE[ev.status] ?? STATUS_BADGE.ok;
                    const Icon = s.icon;
                    return (
                      <tr key={ev.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors align-top">
                        <td className="px-3 py-3 text-slate-300 whitespace-nowrap font-mono text-xs">
                          {formatDate(ev.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-white text-xs whitespace-nowrap">
                          {EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType}
                        </td>
                        <td className="px-3 py-3">
                          <Badge className={`${s.className} border flex items-center gap-1 w-fit text-xs whitespace-nowrap`}>
                            <Icon className="h-3 w-3" />
                            {s.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {ev.username ? (
                            <span className="text-white font-medium">{ev.username}</span>
                          ) : ev.userId ? (
                            <span className="text-slate-500 font-mono">{ev.userId.slice(0, 8)}…</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-cyan-400 max-w-[140px]">
                          <span className="truncate block" title={ev.paypalOrderId ?? ""}>
                            {ev.paypalOrderId ?? "-"}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-400 max-w-[100px]">
                          <span className="truncate block" title={ev.dbOrderId ?? ""}>
                            {ev.dbOrderId ? ev.dbOrderId.slice(0, 8) + "…" : "-"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-emerald-400 font-mono text-xs whitespace-nowrap">
                          {ev.amountUsd ? `$${ev.amountUsd}` : "-"}
                        </td>
                        <td className="px-3 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                          {formatDuration(ev.durationMs)}
                        </td>
                        <td className="px-3 py-3 text-red-400 text-xs max-w-[160px]">
                          {ev.errorMessage ? (
                            <span className="truncate block" title={ev.errorMessage}>{ev.errorMessage}</span>
                          ) : "-"}
                        </td>
                        <td className="px-3 py-3 text-xs max-w-[200px]">
                          <MetadataCell metadata={ev.metadata} />
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
