import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Download, FileSpreadsheet, FileText, RefreshCw,
  Ship as ShipIcon, AlertTriangle, TrendingUp, ShoppingCart,
  Database, Package, ArrowUp, ArrowDown, ArrowUpDown, Clock,
  CheckCircle2,
} from "lucide-react";

/* ─── tipler ─── */
type Range = "last7days" | "thisMonth" | "lastMonth" | "thisYear" | "lastYear" | "custom";
type SortField = "totalRevenue" | "totalOrders" | "packagesSold" | "totalDataGB";
type SortDir = "asc" | "desc";

interface ReportRow {
  shipId: string; shipName: string;
  totalOrders: number; totalRevenue: number;
  totalDataGB: number; packagesSold: number;
}
interface InactiveShip {
  shipId: string; shipName: string;
  daysSinceLastOrder: number | null; lastOrderDate: string | null; userCount: number;
}
interface InactiveData { totalInactive: number; totalShips: number; ships: InactiveShip[]; }

/* ─── sabitler ─── */
const QUICK_RANGES: { value: Range; label: string }[] = [
  { value: "last7days",  label: "Son 7 Gün" },
  { value: "thisMonth",  label: "Bu Ay" },
  { value: "lastMonth",  label: "Geçen Ay" },
  { value: "thisYear",   label: "Bu Yıl" },
  { value: "lastYear",   label: "Geçen Yıl" },
  { value: "custom",     label: "Özel" },
];

/* ─── yardımcılar ─── */
const usd = (v: number | string) => {
  const n = Number(v ?? 0);
  return isNaN(n) ? "$0.00" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const num = (v: any) => Number(v ?? 0);

function Sk({ w = "w-16", h = "h-5" }: { w?: string; h?: string }) {
  return <span className={`block rounded bg-slate-800 animate-pulse ${w} ${h}`} />;
}

function SortTh({
  label, field, current, dir, onSort, right = false,
}: {
  label: string; field: SortField; current: SortField; dir: SortDir;
  onSort: (f: SortField) => void; right?: boolean;
}) {
  const active = field === current;
  return (
    <th
      className={`px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap ${right ? "text-right" : "text-left"}`}
      onClick={() => onSort(field)}
    >
      <span className={`inline-flex items-center gap-1 ${right ? "flex-row-reverse" : ""}`}>
        {label}
        {active
          ? (dir === "desc" ? <ArrowDown className="h-3 w-3 text-cyan-400" /> : <ArrowUp className="h-3 w-3 text-cyan-400" />)
          : <ArrowUpDown className="h-3 w-3 opacity-25" />
        }
      </span>
    </th>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10);

  const [range, setRange]           = useState<Range>("thisMonth");
  const [ship, setShip]             = useState("all");
  const [customStart, setCustomStart] = useState(monthAgo);
  const [customEnd, setCustomEnd]   = useState(today);
  const [sortField, setSortField]   = useState<SortField>("totalRevenue");
  const [sortDir, setSortDir]       = useState<SortDir>("desc");
  const [exportOpen, setExportOpen] = useState(false);

  /* ─── URL yardımcısı ─── */
  const reportUrl = useMemo(() => {
    const p = new URLSearchParams({ ship, range });
    if (range === "custom") { p.set("startDate", customStart); p.set("endDate", customEnd); }
    return `/api/admin/reports?${p}`;
  }, [ship, range, customStart, customEnd]);

  const inactiveUrl = useMemo(() => {
    const p = new URLSearchParams({ range });
    if (range === "custom") { p.set("startDate", customStart); p.set("endDate", customEnd); }
    return `/api/admin/reports/inactive-ships?${p}`;
  }, [range, customStart, customEnd]);

  /* ─── sorgular ─── */
  const { data: rows = [], isLoading: rL, isFetching: rF, refetch } = useQuery<ReportRow[]>({
    queryKey: [reportUrl],
    queryFn: async () => {
      const res = await fetch(reportUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Veri alınamadı");
      return res.json();
    },
    staleTime: 0,
    enabled: range !== "custom" || (!!customStart && !!customEnd),
  });

  const { data: inactiveData, isLoading: iL } = useQuery<InactiveData>({
    queryKey: [inactiveUrl],
    queryFn: async () => {
      const res = await fetch(inactiveUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Veri alınamadı");
      return res.json();
    },
    staleTime: 0,
    enabled: range !== "custom" || (!!customStart && !!customEnd),
  });

  const { data: ships = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/ships"],
  });

  /* ─── türetilmiş veri ─── */
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const va = num(a[sortField]); const vb = num(b[sortField]);
      return sortDir === "desc" ? vb - va : va - vb;
    });
  }, [rows, sortField, sortDir]);

  const totals = useMemo(() => rows.reduce((acc, r) => ({
    revenue:  acc.revenue  + num(r.totalRevenue),
    orders:   acc.orders   + num(r.totalOrders),
    gb:       acc.gb       + num(r.totalDataGB),
    packages: acc.packages + num(r.packagesSold),
  }), { revenue: 0, orders: 0, gb: 0, packages: 0 }), [rows]);

  const shipShare = useMemo(() => {
    const withRevenue = rows.filter(r => num(r.totalRevenue) > 0);
    const max = Math.max(...withRevenue.map(r => num(r.totalRevenue)), 1);
    return [...withRevenue]
      .sort((a, b) => num(b.totalRevenue) - num(a.totalRevenue))
      .map(r => ({ ...r, pct: Math.round((num(r.totalRevenue) / totals.revenue) * 100) || 0, bar: Math.round((num(r.totalRevenue) / max) * 100) }));
  }, [rows, totals.revenue]);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(f); setSortDir("desc"); }
  };

  /* ─── export ─── */
  const doExport = (fmt: "excel" | "csv") => {
    const p = new URLSearchParams({ ship, range, format: fmt });
    if (range === "custom") { p.set("startDate", customStart); p.set("endDate", customEnd); }
    const a = document.createElement("a");
    a.href = `/api/admin/reports/export?${p}`;
    a.style.display = "none";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setExportOpen(false);
  };

  const rangeLabel = QUICK_RANGES.find(r => r.value === range)?.label ?? "";
  const shipLabel  = ship === "all" ? "Tüm Gemiler" : (ships as any[]).find(s => s.id === ship)?.name ?? "";

  /* ─── render ─── */
  return (
    <AdminLayout title="Raporlama">

      {/* Export Modal */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Raporu İndir</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-xs mb-3">
            <span className="text-white font-medium">{rangeLabel}</span>
            {ship !== "all" && <> · <span className="text-white font-medium">{shipLabel}</span></>}
          </p>
          <div className="space-y-2">
            <button onClick={() => doExport("excel")}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30 hover:bg-emerald-900/40 transition-colors">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <p className="text-white text-sm font-medium">Excel (.xlsx)</p>
                <p className="text-slate-500 text-xs">Tablo ve formüller için önerilen</p>
              </div>
            </button>
            <button onClick={() => doExport("csv")}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-900/20 border border-blue-700/30 hover:bg-blue-900/40 transition-colors">
              <FileText className="h-5 w-5 text-blue-400 shrink-0" />
              <div className="text-left">
                <p className="text-white text-sm font-medium">CSV (.csv)</p>
                <p className="text-slate-500 text-xs">Evrensel metin formatı</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-5 pb-8">

        {/* ── Başlık ── */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Raporlama</h1>
            <p className="text-slate-500 text-sm mt-0.5">Sipariş ve gelir analizi</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={rF}
              className="p-1.5 rounded-md border border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 transition-colors"
              title="Yenile"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${rF ? "animate-spin" : ""}`} />
            </button>
            <Button
              size="sm"
              onClick={() => setExportOpen(true)}
              className="h-8 bg-emerald-700/80 hover:bg-emerald-700 text-white border border-emerald-600/40"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              İndir
            </Button>
          </div>
        </div>

        {/* ── Filtre bar ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dönem sekmeleri */}
          <div className="flex flex-wrap gap-1">
            {QUICK_RANGES.map(r => (
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
          </div>

          {/* Gemi filtresi */}
          <Select value={ship} onValueChange={setShip}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-sm w-40 ml-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Tüm Gemiler</SelectItem>
              {(ships as any[]).map(s => (
                <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Özel tarih aralığı */}
        {range === "custom" && (
          <div className="flex flex-wrap gap-3 items-center p-3 rounded-lg border border-slate-700 bg-slate-800/40">
            <span className="text-xs text-slate-400">Tarih aralığı:</span>
            <input
              type="date" value={customStart} max={customEnd}
              onChange={e => setCustomStart(e.target.value)}
              className="h-8 rounded-md bg-slate-800 border border-slate-700 text-white text-sm px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <span className="text-slate-600 text-sm">—</span>
            <input
              type="date" value={customEnd} min={customStart} max={today}
              onChange={e => setCustomEnd(e.target.value)}
              className="h-8 rounded-md bg-slate-800 border border-slate-700 text-white text-sm px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        )}

        {/* ── KPI kartlar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Ciro",       value: rL ? null : usd(totals.revenue),      icon: TrendingUp,   cls: "text-emerald-400" },
            { label: "Sipariş",    value: rL ? null : String(totals.orders),     icon: ShoppingCart, cls: "text-sky-400" },
            { label: "Satılan GB", value: rL ? null : `${totals.gb} GB`,         icon: Database,     cls: "text-violet-400" },
            { label: "Paket",      value: rL ? null : String(totals.packages),   icon: Package,      cls: "text-amber-400" },
          ].map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${k.cls}`} />
                  <p className="text-xs text-slate-500">{k.label}</p>
                </div>
                {k.value === null
                  ? <Sk w="w-20" h="h-7" />
                  : <p className={`text-2xl font-bold tabular-nums leading-none ${k.cls}`}>{k.value}</p>
                }
              </div>
            );
          })}
        </div>

        {/* ── Gemi tablosu + Çok Satan ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Gemi performans tablosu */}
          <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShipIcon className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-white">Gemi Performansı</p>
              </div>
              <span className="text-xs text-slate-500">{rangeLabel}{ship !== "all" && ` · ${shipLabel}`}</span>
            </div>

            {rL ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Sk key={i} w="w-full" h="h-9" />)}
              </div>
            ) : sorted.length === 0 ? (
              <div className="py-14 text-center">
                <ShipIcon className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-600 text-sm">Bu dönemde veri yok</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-800 bg-slate-800/30">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 w-6">#</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400">Gemi</th>
                      <SortTh label="Sipariş"  field="totalOrders"   current={sortField} dir={sortDir} onSort={handleSort} right />
                      <SortTh label="Ciro"     field="totalRevenue"  current={sortField} dir={sortDir} onSort={handleSort} right />
                      <SortTh label="Paket"    field="packagesSold"  current={sortField} dir={sortDir} onSort={handleSort} right />
                      <SortTh label="GB"       field="totalDataGB"   current={sortField} dir={sortDir} onSort={handleSort} right />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row, i) => (
                      <tr key={row.shipId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-600 text-xs font-mono">{i + 1}</td>
                        <td className="px-3 py-3 text-white font-medium">{row.shipName}</td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{num(row.totalOrders)}</td>
                        <td className="px-3 py-3 text-right text-emerald-400 tabular-nums font-medium">{usd(row.totalRevenue)}</td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{num(row.packagesSold)}</td>
                        <td className="px-3 py-3 text-right text-slate-500 tabular-nums">{num(row.totalDataGB)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {sorted.length > 1 && (
                    <tfoot className="border-t border-slate-700 bg-slate-800/20">
                      <tr>
                        <td className="px-4 py-2.5" />
                        <td className="px-3 py-2.5 text-xs font-semibold text-slate-400">Toplam</td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-300 tabular-nums">{totals.orders}</td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-emerald-400 tabular-nums">{usd(totals.revenue)}</td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-300 tabular-nums">{totals.packages}</td>
                        <td className="px-3 py-2.5 text-right text-xs text-slate-500 tabular-nums">{totals.gb}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

          {/* Gemi Gelir Payı */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-white">Gemi Gelir Payı</p>
              <span className="text-xs text-slate-500">{rangeLabel}</span>
            </div>
            {rL ? (
              <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Sk key={i} w="w-full" h="h-10" />)}</div>
            ) : shipShare.length === 0 ? (
              <div className="py-14 text-center">
                <ShipIcon className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-600 text-sm">Bu dönemde veri yok</p>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {shipShare.map(s => (
                  <div key={s.shipId} className="px-2 py-2 rounded-lg hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-white text-xs font-medium truncate min-w-0">{s.shipName}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-emerald-400 text-xs font-mono font-medium">{usd(s.totalRevenue)}</span>
                        <span className="text-slate-600 text-[11px] w-8 text-right">{s.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-emerald-500"
                        style={{ width: `${s.bar}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Aktif Olmayan Gemiler ── */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-semibold text-white">Sipariş Gelmemiş Gemiler</p>
            </div>
            {!iL && inactiveData && (
              <Badge className={`text-xs border ${
                inactiveData.totalInactive === 0
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {inactiveData.totalInactive} / {inactiveData.totalShips} gemi
              </Badge>
            )}
          </div>

          {iL ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Sk key={i} w="w-full" h="h-9" />)}</div>
          ) : inactiveData?.ships?.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
              <p className="text-emerald-400 text-sm font-medium">Tüm gemiler bu dönemde sipariş verdi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800 bg-slate-800/30">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400">Gemi</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-400">Son Sipariş</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400">Kullanıcı</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-400">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {(inactiveData?.ships ?? []).map(s => {
                    const d = s.daysSinceLastOrder;
                    const { cls, label } =
                      d === null  ? { cls: "bg-red-500/15 text-red-400 border-red-500/30",     label: "Hiç sipariş yok" }
                      : d > 60    ? { cls: "bg-red-500/15 text-red-400 border-red-500/30",     label: `${d} gün önce` }
                      : d > 30    ? { cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", label: `${d} gün önce` }
                      :             { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", label: `${d} gün önce` };
                    return (
                      <tr key={s.shipId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{s.shipName}</td>
                        <td className="px-3 py-3 text-center">
                          {s.lastOrderDate
                            ? <span className="text-slate-400 text-xs">{new Date(s.lastOrderDate).toLocaleDateString("tr-TR")}</span>
                            : <span className="text-slate-600 text-xs">—</span>
                          }
                        </td>
                        <td className="px-3 py-3 text-right text-slate-400 tabular-nums">{s.userCount}</td>
                        <td className="px-3 py-3 text-center">
                          <Badge className={`${cls} border text-[11px] font-medium whitespace-nowrap inline-flex items-center gap-1`}>
                            <Clock className="h-3 w-3" />
                            {label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
