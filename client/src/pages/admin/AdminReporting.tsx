import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import AdminLayout from "@/components/AdminLayout";
import {
  Send, Ship as ShipIcon, Mail, CheckCircle2, AlertCircle,
  TrendingUp, ShoppingCart, Users, RefreshCw,
  FileSpreadsheet, ChevronRight, CalendarRange, Calendar,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

const TZ = "Europe/Istanbul";

const TURKISH_MONTHS = [
  { value: "01", label: "Ocak" },
  { value: "02", label: "Şubat" },
  { value: "03", label: "Mart" },
  { value: "04", label: "Nisan" },
  { value: "05", label: "Mayıs" },
  { value: "06", label: "Haziran" },
  { value: "07", label: "Temmuz" },
  { value: "08", label: "Ağustos" },
  { value: "09", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" },
];

const usd = (v: number | string | null | undefined) => {
  const n = Number(v ?? 0);
  return isNaN(n) ? "$0.00" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/* ──────────── küçük bileşenler ──────────── */

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Canlı
    </span>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`block rounded bg-slate-800 animate-pulse ${className}`} />;
}

function MonthProgressBar({ now }: { now: Date }) {
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pct = Math.round((dayOfMonth / daysInMonth) * 100);
  const monthName = format(now, "MMMM", { locale: tr });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-0.5">Dönem İlerlemesi</p>
          <p className="text-white font-semibold capitalize">{monthName} {now.getFullYear()}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-white tabular-nums leading-none">
            {pct}<span className="text-base text-slate-500 font-semibold">%</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{dayOfMonth} / {daysInMonth} gün tamamlandı</p>
        </div>
      </div>

      <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.5)]"
          style={{ left: `calc(${pct}% - 1px)` }}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-slate-600">1 {monthName.slice(0, 3)}</span>
        <span className="text-[10px] text-slate-600">{daysInMonth} {monthName.slice(0, 3)}</span>
      </div>
    </div>
  );
}

/* ──────────── tipler ──────────── */

interface MonthlyStats {
  monthlyOrders: number;
  monthlyRevenue: number;
  monthlyCancelled: number;
  monthlyNewUsers: number;
}

interface EmailLog {
  id: string;
  subject: string;
  toEmail: string;
  status: string;
  sentAt?: string;
  createdAt?: string;
}

/* ──────────── ana bileşen ──────────── */

export default function AdminReporting() {
  const now = toZonedTime(new Date(), TZ);
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const years = Array.from({ length: 4 }, (_, i) => String(currentYear - i));

  const [reportType, setReportType] = useState<"monthly" | "daterange">("monthly");
  const [selectedShip, setSelectedShip] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(now);

  /* Canlı aylık metrikler — 30 sn. aralıklı otomatik yenileme */
  const { data: monthly, isLoading: mL, dataUpdatedAt } = useQuery<MonthlyStats>({
    queryKey: ["/api/admin/stats/monthly"],
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(toZonedTime(new Date(dataUpdatedAt), TZ));
    }
  }, [dataUpdatedAt]);

  const { data: ships } = useQuery<any[]>({
    queryKey: ["/api/admin/ships"],
  });

  const { data: emailLogsData } = useQuery<{ logs: EmailLog[]; total: number }>({
    queryKey: ["/api/admin/email-logs"],
    refetchInterval: 60_000,
  });

  /* Son rapor gönderimlerini filtrele */
  const recentReports: EmailLog[] = (emailLogsData?.logs ?? [])
    .filter((l) => {
      const sub = (l.subject ?? "").toLowerCase();
      return sub.includes("rapor") || sub.includes("excel") || sub.includes("report");
    })
    .slice(0, 5);

  /* Gönder */
  const sendMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string | undefined> = {
        shipId: selectedShip === "all" ? undefined : selectedShip,
      };
      if (reportType === "monthly") {
        payload.month = selectedMonth;
        payload.year = selectedYear;
      } else {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }
      return apiRequest("POST", "/api/admin/reports/send-email", payload);
    },
    onSuccess: (data: any) => {
      setStatusMsg({ type: "success", text: data?.message ?? "Rapor e-postası başarıyla gönderildi" });
    },
    onError: (err: any) => {
      setStatusMsg({ type: "error", text: err?.message ?? "Rapor gönderilemedi" });
    },
  });

  const handleSend = () => {
    setStatusMsg(null);
    if (reportType === "monthly" && (!selectedMonth || !selectedYear)) {
      setStatusMsg({ type: "error", text: "Lütfen ay ve yıl seçiniz" });
      return;
    }
    if (reportType === "daterange") {
      if (!startDate || !endDate) {
        setStatusMsg({ type: "error", text: "Lütfen başlangıç ve bitiş tarihlerini seçin" });
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setStatusMsg({ type: "error", text: "Başlangıç tarihi bitiş tarihinden sonra olamaz" });
        return;
      }
    }
    sendMutation.mutate();
  };

  /* Canlı sayı kartları */
  const statCards = [
    {
      label: "Bu Ay Sipariş",
      value: mL ? null : String(monthly?.monthlyOrders ?? 0),
      icon: ShoppingCart,
      color: "text-sky-400",
    },
    {
      label: "Bu Ay Ciro",
      value: mL ? null : usd(monthly?.monthlyRevenue ?? 0),
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: "Bu Ay İptal",
      value: mL ? null : String(monthly?.monthlyCancelled ?? 0),
      icon: AlertCircle,
      color: "text-rose-400",
    },
    {
      label: "Yeni Üye",
      value: mL ? null : String(monthly?.monthlyNewUsers ?? 0),
      icon: Users,
      color: "text-violet-400",
    },
  ];

  return (
    <AdminLayout title="Raporlama">
      <div className="space-y-5 pb-6">

        {/* Başlık */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Raporlama</h1>
            <p className="text-slate-500 text-sm mt-0.5">Excel raporu oluştur ve e-posta ile gönder</p>
          </div>
          <LiveBadge />
        </div>

        {/* Canlı Dönem Metrikleri */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-5 bg-cyan-500 rounded-full" />
              <p className="text-sm font-semibold text-white">Güncel Dönem</p>
              <span className="text-[11px] text-slate-500 capitalize">
                {format(now, "MMMM yyyy", { locale: tr })}
              </span>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <RefreshCw className="h-3 w-3" />
              {format(lastUpdated, "HH:mm:ss")} itibarıyla
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-800">
            {statCards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="px-5 py-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon className={`h-3.5 w-3.5 ${c.color}`} />
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{c.label}</p>
                  </div>
                  {c.value === null
                    ? <Skeleton className="w-20 h-7" />
                    : <p className={`text-2xl font-black leading-none tabular-nums ${c.color}`}>{c.value}</p>
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Ay İlerlemesi */}
        <MonthProgressBar now={now} />

        {/* Form + Son Gönderimler */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Rapor Form */}
          <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-800">
              <div className="w-1.5 h-5 bg-violet-500 rounded-full" />
              <p className="text-sm font-semibold text-white">Rapor Oluştur</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Rapor Türü — toggle */}
              <div className="flex rounded-lg border border-slate-700 overflow-hidden bg-slate-800/40">
                {(["monthly", "daterange"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setReportType(t)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all ${
                      reportType === t
                        ? "bg-violet-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    {t === "monthly"
                      ? <><Calendar className="h-3.5 w-3.5" /> Aylık</>
                      : <><CalendarRange className="h-3.5 w-3.5" /> Tarih Aralığı</>
                    }
                  </button>
                ))}
              </div>

              {/* Aylık alanlar */}
              {reportType === "monthly" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Ay</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {TURKISH_MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value} className="text-white hover:bg-slate-700">{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Yıl</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {years.map((y) => (
                          <SelectItem key={y} value={y} className="text-white hover:bg-slate-700">{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Tarih aralığı alanları */}
              {reportType === "daterange" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Başlangıç</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-slate-800/60 border-slate-700 text-white h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Bitiş</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-slate-800/60 border-slate-700 text-white h-10"
                    />
                  </div>
                </div>
              )}

              {/* Gemi Filtresi */}
              <div>
                <Label className="text-slate-400 text-xs mb-1.5 flex items-center gap-1.5">
                  <ShipIcon className="h-3 w-3" /> Gemi Filtresi
                </Label>
                <Select value={selectedShip} onValueChange={setSelectedShip}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-10">
                    <SelectValue placeholder="Gemi seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Tüm Gemiler</SelectItem>
                    {ships?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id} className="text-white hover:bg-slate-700">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* E-posta bilgisi + gönder butonu */}
              <div className="pt-1">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 mb-3">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <p className="text-[12px] text-slate-400">
                    Rapor <span className="text-white font-medium">.xlsx</span> formatında admin e-postanıza gönderilir.
                    Adres Ayarlar sayfasından yönetilir.
                  </p>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={sendMutation.isPending}
                  className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all"
                >
                  {sendMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Rapor oluşturuluyor...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Raporu Gönder
                      <Send className="h-3.5 w-3.5 ml-auto" />
                    </span>
                  )}
                </Button>
              </div>

              {/* Durum mesajı */}
              {statusMsg && (
                <div className={`flex items-start gap-3 p-3.5 rounded-lg border text-sm ${
                  statusMsg.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}>
                  {statusMsg.type === "success"
                    ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  }
                  <p>{statusMsg.text}</p>
                </div>
              )}
            </div>
          </div>

          {/* Son Gönderimler */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-800">
              <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
              <p className="text-sm font-semibold text-white">Son Gönderimler</p>
            </div>

            <div className="flex-1 divide-y divide-slate-800/60">
              {recentReports.length === 0 ? (
                <div className="py-12 text-center">
                  <Mail className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-600 text-sm">Henüz rapor gönderilmedi</p>
                  <p className="text-slate-700 text-xs mt-1">İlk raporu sağdaki formdan gönderebilirsin</p>
                </div>
              ) : (
                recentReports.map((log) => {
                  const date = log.sentAt ?? log.createdAt;
                  const ok = log.status === "sent";
                  return (
                    <div key={log.id} className="px-5 py-3.5 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          ok ? "bg-emerald-500/15" : "bg-rose-500/15"
                        }`}>
                          {ok
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            : <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-[13px] font-medium truncate leading-tight">{log.subject}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5 truncate">{log.toEmail}</p>
                          {date && (
                            <p className="text-slate-600 text-[11px] mt-0.5">
                              {format(toZonedTime(new Date(date), TZ), "d MMM · HH:mm", { locale: tr })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-800 mt-auto">
              <a
                href="/admin/email-marketing"
                className="flex items-center justify-between text-slate-500 hover:text-cyan-400 text-[12px] transition-colors group"
              >
                <span>Tüm e-posta logları</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
