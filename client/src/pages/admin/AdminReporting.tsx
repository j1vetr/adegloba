import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import {
  TrendingUp, ShoppingCart, Users, XCircle, RefreshCw,
  FileSpreadsheet, Send, Ship as ShipIcon, Mail,
  CheckCircle2, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown,
  Download, Calendar, CalendarRange,
} from "lucide-react";

/* ─── sabitler ─── */
const TZ = "Europe/Istanbul";
const RANGES = [
  { value: "last7days", label: "Son 7 Gün" },
  { value: "thisMonth", label: "Bu Ay" },
  { value: "lastMonth", label: "Geçen Ay" },
  { value: "thisYear",  label: "Bu Yıl" },
] as const;
type Range = typeof RANGES[number]["value"];

const MONTHS = [
  { value: "01", label: "Ocak" },  { value: "02", label: "Şubat" },
  { value: "03", label: "Mart" },  { value: "04", label: "Nisan" },
  { value: "05", label: "Mayıs" }, { value: "06", label: "Haziran" },
  { value: "07", label: "Temmuz" },{ value: "08", label: "Ağustos" },
  { value: "09", label: "Eylül" }, { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" }, { value: "12", label: "Aralık" },
];

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  paid:       { label: "Ödendi",        cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  pending:    { label: "Bekliyor",      cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  cancelled:  { label: "İptal",         cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  failed:     { label: "Başarısız",     cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  expired:    { label: "Süresi Doldu",  cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
  refunded:   { label: "İade",          cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

/* ─── yardımcılar ─── */
const usd = (v: number | string | null | undefined) => {
  const n = Number(v ?? 0);
  return isNaN(n) ? "$0" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function Sk({ w = "w-16", h = "h-5" }: { w?: string; h?: string }) {
  return <span className={`block rounded bg-slate-800 animate-pulse ${w} ${h}`} />;
}

type SortDir = "asc" | "desc";
function SortBtn({ active, dir, onClick }: { active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <button onClick={onClick} className="ml-1 inline-flex opacity-60 hover:opacity-100">
      {active ? (dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
}

/* ─── tipler ─── */
interface MonthlyStats { monthlyOrders: number; monthlyRevenue: number; monthlyCancelled: number; monthlyNewUsers: number; }
interface OverallStats { totalRevenue: number; activeUsers: number; totalOrders: number; }
interface ReportItem { shipId: string; shipName: string; totalOrders: number; totalRevenue: number; totalDataGB: number; packagesSold: number; }
interface PlanItem { planId: string; planName: string; shipName: string; totalSold: number; totalRevenue: number; averagePrice: number; }
interface OrderItem {
  id: string; status: string; totalUsd: string; createdAt: string;
  user?: { username: string; email: string; full_name?: string | null };
  shipId?: string;
}

/* ═══════════════════════════════════════════════════════ */
export default function AdminReporting() {
  const { toast } = useToast();
  const now = toZonedTime(new Date(), TZ);

  /* filtre / sıralama state */
  const [range, setRange]         = useState<Range>("thisMonth");
  const [sortField, setSortField] = useState<keyof ReportItem>("totalRevenue");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");

  /* e-posta raporu form state */
  const [reportType, setReportType]       = useState<"monthly" | "daterange">("monthly");
  const [selectedShip, setSelectedShip]   = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear]   = useState(String(now.getFullYear()));
  const [startDate, setStartDate]         = useState("");
  const [endDate, setEndDate]             = useState("");
  const [statusMsg, setStatusMsg]         = useState<{ type: "success" | "error"; text: string } | null>(null);

  const years = Array.from({ length: 4 }, (_, i) => String(now.getFullYear() - i));

  /* ─── sorgular ─── */
  const { data: monthly, isLoading: mL } = useQuery<MonthlyStats>({
    queryKey: ["/api/admin/stats/monthly"],
    refetchInterval: 60_000,
  });

  const { data: overall } = useQuery<OverallStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: reports, isLoading: rL, isFetching: rF, refetch: refetchReports } = useQuery<ReportItem[]>({
    queryKey: [`/api/admin/reports?range=${range}`],
  });

  const { data: plans, isLoading: pL } = useQuery<PlanItem[]>({
    queryKey: ["/api/admin/financial/package-profitability"],
  });

  const { data: recentOrders, isLoading: oL } = useQuery<OrderItem[]>({
    queryKey: ["/api/admin/recent-orders"],
    refetchInterval: 60_000,
  });

  const { data: ships } = useQuery<any[]>({
    queryKey: ["/api/admin/ships"],
  });

  /* ─── gemi tablosu sıralama ─── */
  const sortedReports = useMemo(() => {
    if (!reports) return [];
    return [...reports].sort((a, b) => {
      const va = Number(a[sortField] ?? 0);
      const vb = Number(b[sortField] ?? 0);
      return sortDir === "desc" ? vb - va : va - vb;
    });
  }, [reports, sortField, sortDir]);

  const topPlans = useMemo(() => {
    if (!plans) return [];
    return [...plans].sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue)).slice(0, 10);
  }, [plans]);

  const handleSort = (field: keyof ReportItem) => {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  };

  /* ─── e-posta raporu gönder ─── */
  const sendMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string | undefined> = {
        shipId: selectedShip === "all" ? undefined : selectedShip,
      };
      if (reportType === "monthly") {
        payload.month = selectedMonth;
        payload.year  = selectedYear;
      } else {
        payload.startDate = startDate;
        payload.endDate   = endDate;
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
      setStatusMsg({ type: "error", text: "Ay ve yıl seçiniz" }); return;
    }
    if (reportType === "daterange") {
      if (!startDate || !endDate) { setStatusMsg({ type: "error", text: "Tarih aralığı seçiniz" }); return; }
      if (new Date(startDate) > new Date(endDate)) { setStatusMsg({ type: "error", text: "Başlangıç, bitiş tarihinden sonra olamaz" }); return; }
    }
    sendMutation.mutate();
  };

  /* ─── KPI kartları ─── */
  const kpis = [
    { label: "Bu Ay Ciro",    value: mL ? null : usd(monthly?.monthlyRevenue),    icon: TrendingUp,   cls: "text-emerald-400" },
    { label: "Bu Ay Sipariş", value: mL ? null : String(monthly?.monthlyOrders ?? 0), icon: ShoppingCart, cls: "text-sky-400" },
    { label: "Bu Ay İptal",   value: mL ? null : String(monthly?.monthlyCancelled ?? 0), icon: XCircle, cls: "text-rose-400" },
    { label: "Yeni Üye",      value: mL ? null : String(monthly?.monthlyNewUsers ?? 0), icon: Users,   cls: "text-violet-400" },
  ];

  const rangeLabel = RANGES.find(r => r.value === range)?.label ?? "";

  /* ─── render ─── */
  return (
    <AdminLayout title="Raporlama">
      <div className="space-y-5 pb-8">

        {/* Başlık */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Raporlama</h1>
            <p className="text-slate-500 text-sm mt-0.5">Sipariş ve gelir analizi</p>
          </div>
          <a
            href={`/api/admin/reports/export?range=${range}&format=xlsx`}
            className="inline-flex items-center gap-2 px-3 h-8 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Excel İndir
          </a>
        </div>

        {/* KPI kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${k.cls}`} />
                  <p className="text-xs text-slate-500 truncate">{k.label}</p>
                </div>
                {k.value === null
                  ? <Sk w="w-20" h="h-7" />
                  : <p className={`text-2xl font-bold tabular-nums leading-none ${k.cls}`}>{k.value}</p>
                }
              </div>
            );
          })}
        </div>

        {/* Dönem seçici */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 mr-1">Dönem:</span>
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1 rounded-md text-sm font-medium border transition-all ${
                range === r.value
                  ? "bg-cyan-600 border-cyan-600 text-white"
                  : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() => refetchReports()}
            disabled={rF}
            className="ml-auto p-1.5 rounded-md border border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${rF ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Gemi Performansı + Çok Satan Paketler */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Gemi tablosu */}
          <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShipIcon className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-white">Gemi Performansı</p>
              </div>
              <span className="text-xs text-slate-500">{rangeLabel}</span>
            </div>

            {rL ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Sk key={i} w="w-full" h="h-9" />)}
              </div>
            ) : !sortedReports.length ? (
              <div className="py-12 text-center text-slate-600">
                <ShipIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Bu dönemde veri yok</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-800 bg-slate-800/30">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400">Gemi</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 whitespace-nowrap">
                        Sipariş <SortBtn active={sortField === "totalOrders"} dir={sortDir} onClick={() => handleSort("totalOrders")} />
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 whitespace-nowrap">
                        Ciro <SortBtn active={sortField === "totalRevenue"} dir={sortDir} onClick={() => handleSort("totalRevenue")} />
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 whitespace-nowrap">
                        Paket <SortBtn active={sortField === "packagesSold"} dir={sortDir} onClick={() => handleSort("packagesSold")} />
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 whitespace-nowrap hidden sm:table-cell">
                        GB <SortBtn active={sortField === "totalDataGB"} dir={sortDir} onClick={() => handleSort("totalDataGB")} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedReports.map((row, i) => (
                      <tr key={row.shipId} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i === 0 ? "bg-cyan-500/5" : ""}`}>
                        <td className="px-4 py-3 text-white font-medium">{row.shipName}</td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{Number(row.totalOrders)}</td>
                        <td className="px-3 py-3 text-right text-emerald-400 tabular-nums font-medium">{usd(row.totalRevenue)}</td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{Number(row.packagesSold)}</td>
                        <td className="px-3 py-3 text-right text-slate-500 tabular-nums hidden sm:table-cell">{Number(row.totalDataGB)} GB</td>
                      </tr>
                    ))}
                  </tbody>
                  {sortedReports.length > 1 && (
                    <tfoot className="border-t border-slate-700 bg-slate-800/20">
                      <tr>
                        <td className="px-4 py-2.5 text-xs font-semibold text-slate-400">Toplam</td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-300 tabular-nums">
                          {sortedReports.reduce((s, r) => s + Number(r.totalOrders), 0)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-emerald-400 tabular-nums">
                          {usd(sortedReports.reduce((s, r) => s + Number(r.totalRevenue), 0))}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-300 tabular-nums">
                          {sortedReports.reduce((s, r) => s + Number(r.packagesSold), 0)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-slate-500 tabular-nums hidden sm:table-cell">
                          {sortedReports.reduce((s, r) => s + Number(r.totalDataGB), 0)} GB
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

          {/* Çok Satan Paketler */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-white">Çok Satan Paketler</p>
              <span className="text-xs text-slate-500">Tüm zamanlar</span>
            </div>

            {pL ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Sk key={i} w="w-full" h="h-9" />)}
              </div>
            ) : !topPlans.length ? (
              <div className="py-12 text-center text-slate-600 text-sm">Henüz satış yok</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-800 bg-slate-800/30">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400">Paket</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400">Satış</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400">Ciro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPlans.map((p, i) => (
                      <tr key={p.planId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white text-xs font-medium leading-tight">{p.planName}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">{p.shipName}</p>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{Number(p.totalSold)}</td>
                        <td className="px-3 py-3 text-right text-emerald-400 tabular-nums text-xs font-medium">{usd(p.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Son Siparişler */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <p className="text-sm font-semibold text-white">Son Siparişler</p>
            <span className="text-xs text-slate-500">Son 10 kayıt</span>
          </div>

          {oL ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Sk key={i} w="w-full" h="h-10" />)}
            </div>
          ) : !recentOrders?.length ? (
            <div className="py-12 text-center text-slate-600 text-sm">Henüz sipariş yok</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800 bg-slate-800/30">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400">Kullanıcı</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400">Tutar</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-400">Durum</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 hidden sm:table-cell">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => {
                    const st = ORDER_STATUS[order.status] ?? { label: order.status, cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
                    const name = order.user?.full_name || order.user?.username || order.user?.email || "—";
                    const date = order.createdAt
                      ? format(toZonedTime(new Date(order.createdAt), TZ), "d MMM HH:mm", { locale: tr })
                      : "—";
                    return (
                      <tr key={order.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white text-sm leading-tight">{name}</p>
                          {order.user?.email && name !== order.user.email && (
                            <p className="text-slate-500 text-[11px] mt-0.5 truncate max-w-[180px]">{order.user.email}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-emerald-400 tabular-nums font-medium">{usd(order.totalUsd)}</td>
                        <td className="px-3 py-3 text-center">
                          <Badge className={`${st.cls} border text-[11px] font-medium whitespace-nowrap`}>{st.label}</Badge>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-500 text-xs tabular-nums hidden sm:table-cell">{date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rapor Gönder */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
            <FileSpreadsheet className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-white">Excel Raporu Gönder</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Tür toggle */}
            <div className="flex rounded-lg border border-slate-700 overflow-hidden bg-slate-800/40 w-fit">
              {(["monthly", "daterange"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setReportType(t)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all ${
                    reportType === t ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  {t === "monthly" ? <><Calendar className="h-3.5 w-3.5" /> Aylık</> : <><CalendarRange className="h-3.5 w-3.5" /> Tarih Aralığı</>}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Dönem alanları */}
              {reportType === "monthly" ? (
                <>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Ay</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {MONTHS.map(m => <SelectItem key={m.value} value={m.value} className="text-white">{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Yıl</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {years.map(y => <SelectItem key={y} value={y} className="text-white">{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Başlangıç</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-800 border-slate-700 text-white h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Bitiş</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-800 border-slate-700 text-white h-9 text-sm" />
                  </div>
                </>
              )}

              {/* Gemi filtresi */}
              <div>
                <Label className="text-slate-400 text-xs mb-1.5 flex items-center gap-1">
                  <ShipIcon className="h-3 w-3" /> Gemi
                </Label>
                <Select value={selectedShip} onValueChange={setSelectedShip}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">Tüm Gemiler</SelectItem>
                    {ships?.map((s: any) => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-[12px] text-slate-500 bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                Rapor <span className="text-white font-medium">.xlsx</span> olarak admin e-postanıza gönderilir
              </div>

              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700 text-white h-9 ml-auto"
              >
                {sendMutation.isPending ? (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Gönderiliyor...</>
                ) : (
                  <><Send className="h-3.5 w-3.5 mr-1.5" /> Raporu Gönder</>
                )}
              </Button>
            </div>

            {statusMsg && (
              <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-lg border text-sm ${
                statusMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}>
                {statusMsg.type === "success"
                  ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                }
                {statusMsg.text}
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
