import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  DollarSign, Package, TrendingUp, Database,
  Download, FileSpreadsheet, FileText, Ship,
  AlertTriangle, Clock, Trophy,
  ArrowUpRight, Filter, CalendarDays
} from "lucide-react";

/* ─── types ─────────────────────────────────────── */
type DateRange = 'last7days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'specificMonth';

interface ReportData {
  shipId: string; shipName: string;
  totalOrders: number; totalRevenue: number;
  totalDataGB: number; packagesSold: number;
}

/* ─── constants ─────────────────────────────────── */
const MONTHS = [
  { value: '1', label: 'Ocak' }, { value: '2', label: 'Şubat' }, { value: '3', label: 'Mart' },
  { value: '4', label: 'Nisan' }, { value: '5', label: 'Mayıs' }, { value: '6', label: 'Haziran' },
  { value: '7', label: 'Temmuz' }, { value: '8', label: 'Ağustos' }, { value: '9', label: 'Eylül' },
  { value: '10', label: 'Ekim' }, { value: '11', label: 'Kasım' }, { value: '12', label: 'Aralık' },
];
const RANGE_LABELS: Record<DateRange, string> = {
  last7days: 'Son 7 Gün', thisMonth: 'Bu Ay', lastMonth: 'Geçen Ay',
  thisYear: 'Bu Yıl', lastYear: 'Geçen Yıl', specificMonth: 'Belirli Ay',
};
const CHART_COLORS = ['#06b6d4','#8b5cf6','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6'];

/* ─── helpers ───────────────────────────────────── */
const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', color: '#f1f5f9', fontSize: 12 },
  itemStyle: { color: '#94a3b8' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

/* ─── animated counter ──────────────────────────── */
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end = value;
    prev.current = value;
    if (start === end) return;
    const duration = 800;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (end - start) * ease);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString('en-US');
  return <>{prefix}{formatted}{suffix}</>;
}

/* ─── custom donut label ────────────────────────── */
function DonutCenter({ cx, cy, total }: { cx?: number; cy?: number; total: number }) {
  return (
    <g>
      <text x={cx} y={(cy ?? 0) - 6} textAnchor="middle" fill="#94a3b8" fontSize={11}>Toplam</text>
      <text x={cx} y={(cy ?? 0) + 14} textAnchor="middle" fill="#f1f5f9" fontSize={20} fontWeight={700}>{total}</text>
    </g>
  );
}

/* ─── main component ────────────────────────────── */
export default function Reports() {
  const now = new Date();
  const [selectedShip, setSelectedShip] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
  const [exportOpen, setExportOpen] = useState(false);

  const [inactiveRange, setInactiveRange] = useState<DateRange>('thisMonth');
  const [inactiveMonth, setInactiveMonth] = useState(String(now.getMonth() + 1));
  const [inactiveYear, setInactiveYear] = useState(String(now.getFullYear()));
  const inactiveYears = Array.from({ length: 4 }, (_, i) => String(now.getFullYear() - i));

  /* queries */
  const { data: ships = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/ships"],
    queryFn: async () => (await fetch("/api/admin/ships")).json(),
    staleTime: 0,
  });

  const { data: reportData = [], isLoading } = useQuery<ReportData[]>({
    queryKey: ["/api/admin/reports", selectedShip, dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports?ship=${selectedShip}&range=${dateRange}`, { cache: 'no-cache' });
      return res.json();
    },
    staleTime: 0,
  });

  const inactiveParams = new URLSearchParams(
    inactiveRange === 'specificMonth'
      ? { month: inactiveMonth, year: inactiveYear }
      : { range: inactiveRange }
  );
  const { data: inactiveData, isLoading: inactiveLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/inactive-ships", inactiveRange, inactiveMonth, inactiveYear],
    queryFn: async () => (await fetch(`/api/admin/reports/inactive-ships?${inactiveParams}`)).json(),
    staleTime: 0,
  });

  /* derived */
  const active = reportData.filter(d => d.totalOrders > 0);
  const totals = reportData.reduce((acc, d) => ({
    orders: acc.orders + d.totalOrders,
    revenue: acc.revenue + d.totalRevenue,
    data: acc.data + d.totalDataGB,
    packages: acc.packages + d.packagesSold,
  }), { orders: 0, revenue: 0, data: 0, packages: 0 });

  const sorted = [...reportData].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const maxRevenue = sorted[0]?.totalRevenue || 1;

  /* export */
  const handleExport = (format: 'excel' | 'csv') => {
    const url = `/api/admin/reports/export?ship=${selectedShip}&range=${dateRange}&format=${format}`;
    const a = document.createElement('a');
    a.href = url; a.style.display = 'none';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setExportOpen(false);
  };

  return (
    <AdminLayout title="Raporlama">
      <div className="space-y-5 pb-6">

        {/* ═══ FILTER BAR ═══ */}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Filtrele</span>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] text-slate-500 mb-1">Gemi</p>
              <Select value={selectedShip} onValueChange={setSelectedShip}>
                <SelectTrigger className="h-9 bg-slate-800 border-slate-700 text-white text-sm">
                  <SelectValue placeholder="Tüm Gemiler" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tüm Gemiler</SelectItem>
                  {ships.map((s: any) => (
                    <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-[11px] text-slate-500 mb-1">Dönem</p>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                <SelectTrigger className="h-9 bg-slate-800 border-slate-700 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {(Object.entries(RANGE_LABELS) as [DateRange, string][])
                    .filter(([k]) => k !== 'specificMonth')
                    .map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Dialog open={exportOpen} onOpenChange={setExportOpen}>
                <DialogTrigger asChild>
                  <Button className="h-9 w-full bg-emerald-700/80 hover:bg-emerald-700 text-white text-sm border border-emerald-600/40">
                    <Download className="h-4 w-4 mr-2" />
                    Rapor İndir
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-white">Dışa Aktar</DialogTitle>
                  </DialogHeader>
                  <p className="text-slate-400 text-xs mb-1">
                    <strong className="text-slate-300">{RANGE_LABELS[dateRange]}</strong> · {selectedShip === 'all' ? 'Tüm Gemiler' : ships.find((s: any) => s.id === selectedShip)?.name}
                  </p>
                  <div className="space-y-2 mt-2">
                    <button onClick={() => handleExport('excel')}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-green-900/30 border border-green-700/40 hover:bg-green-900/50 transition-colors">
                      <FileSpreadsheet className="h-5 w-5 text-green-400 shrink-0" />
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">Excel (.xlsx)</p>
                        <p className="text-green-400/70 text-xs">Gelişmiş analiz için önerilen</p>
                      </div>
                    </button>
                    <button onClick={() => handleExport('csv')}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-900/30 border border-blue-700/40 hover:bg-blue-900/50 transition-colors">
                      <FileText className="h-5 w-5 text-blue-400 shrink-0" />
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">CSV (.csv)</p>
                        <p className="text-blue-400/70 text-xs">Evrensel format</p>
                      </div>
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* ═══ KPI CARDS ═══ */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Net Gelir', value: totals.revenue, icon: DollarSign, color: 'border-l-emerald-500', accent: 'text-emerald-400', render: usd },
            { label: 'Ödenen Sipariş', value: totals.orders, icon: Package, color: 'border-l-cyan-500', accent: 'text-cyan-400', render: (n: number) => n.toLocaleString() },
            { label: 'Satılan Veri', value: totals.data, icon: Database, color: 'border-l-violet-500', accent: 'text-violet-400', render: (n: number) => `${n} GB` },
            { label: 'Satılan Paket', value: totals.packages, icon: TrendingUp, color: 'border-l-amber-500', accent: 'text-amber-400', render: (n: number) => n.toLocaleString() },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className={`rounded-xl border border-slate-800 border-l-2 ${c.color} bg-slate-900/80 p-4 flex items-center gap-4`}>
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <Icon className={`h-4 w-4 ${c.accent}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-500 text-[11px] uppercase tracking-wide">{c.label}</p>
                  {isLoading
                    ? <span className="block w-20 h-6 bg-slate-800 rounded animate-pulse mt-1" />
                    : <p className={`text-xl font-bold leading-tight ${c.accent}`}>
                        <AnimatedNumber
                          value={c.value}
                          prefix={c.label === 'Net Gelir' ? '$' : ''}
                          suffix={c.label === 'Satılan Veri' ? ' GB' : ''}
                          decimals={c.label === 'Net Gelir' ? 2 : 0}
                        />
                      </p>
                  }
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ CHARTS ═══ */}
        {!isLoading && active.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Horizontal Bar — Revenue */}
            <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold text-sm">Gemi Bazlı Gelir</p>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />{RANGE_LABELS[dateRange]}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={Math.max(220, active.length * 42)}>
                <BarChart data={active} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number" dataKey="totalRevenue" stroke="#475569" fontSize={10}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    type="category" dataKey="shipName" stroke="#64748b" fontSize={11}
                    width={100} axisLine={false} tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(v: number) => [usd(v), 'Gelir']}
                  />
                  <Bar dataKey="totalRevenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {active.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Donut — Orders */}
            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold text-sm">Sipariş Dağılımı</p>
                <span className="text-[11px] text-slate-500">{totals.orders} toplam</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={active.filter(d => d.totalOrders > 0)}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={88}
                    paddingAngle={3}
                    dataKey="totalOrders"
                    nameKey="shipName"
                    isAnimationActive
                    animationBegin={100}
                    animationDuration={900}
                  >
                    {active.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <DonutCenter total={totals.orders} />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(v: number, _: string, props: any) => [v, props.payload.shipName]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {active.filter(d => d.totalOrders > 0).slice(0, 8).map((d, i) => (
                  <div key={d.shipId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-slate-400 truncate">{d.shipName}</span>
                    </div>
                    <span className="text-slate-300 font-medium ml-2 shrink-0">{d.totalOrders}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ LEADERBOARD TABLE ═══ */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <p className="text-white font-semibold text-sm">Gemi Sıralaması</p>
              <span className="text-slate-600 text-xs">— {RANGE_LABELS[dateRange]}</span>
            </div>
            {selectedShip !== 'all' && (
              <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                {ships.find((s: any) => s.id === selectedShip)?.name}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-6 h-6 bg-slate-800 rounded animate-pulse shrink-0" />
                  <span className="flex-1 h-10 bg-slate-800 rounded animate-pulse" />
                  <span className="w-20 h-10 bg-slate-800 rounded animate-pulse shrink-0" />
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-16 text-center text-slate-600 text-sm">Seçilen dönemde veri bulunamadı</div>
          ) : (
            <div>
              {/* Header row */}
              <div className="grid grid-cols-12 px-5 py-2 text-[11px] text-slate-600 uppercase tracking-wider border-b border-slate-800/60">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Gemi</div>
                <div className="col-span-4">Gelir Oranı</div>
                <div className="col-span-1 text-center">Sipariş</div>
                <div className="col-span-1 text-center">Paket</div>
                <div className="col-span-2 text-right">Gelir</div>
              </div>
              {sorted.map((item, i) => {
                const pct = (item.totalRevenue / maxRevenue) * 100;
                const color = CHART_COLORS[i % CHART_COLORS.length];
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div
                    key={item.shipId}
                    className="grid grid-cols-12 items-center px-5 py-3 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="col-span-1">
                      <span className="text-sm">{i < 3 ? medals[i] : <span className="text-slate-600 text-xs font-mono">{i + 1}</span>}</span>
                    </div>
                    <div className="col-span-3 min-w-0 pr-2">
                      <p className={`text-sm font-medium truncate ${item.totalOrders > 0 ? 'text-white' : 'text-slate-500'}`}>
                        {item.shipName}
                      </p>
                      {item.totalDataGB > 0 && (
                        <p className="text-[10px] text-slate-600">{item.totalDataGB} GB</p>
                      )}
                    </div>
                    <div className="col-span-4 pr-4">
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${pct}%`, background: color, opacity: item.totalRevenue > 0 ? 1 : 0 }}
                        />
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className={`text-sm font-medium ${item.totalOrders > 0 ? 'text-cyan-400' : 'text-slate-700'}`}>
                        {item.totalOrders}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-sm text-slate-400">{item.packagesSold}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={`text-sm font-mono font-medium ${item.totalRevenue > 0 ? 'text-emerald-400' : 'text-slate-700'}`}>
                        {usd(item.totalRevenue)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* Totals row */}
              {sorted.length > 1 && (
                <div className="grid grid-cols-12 items-center px-5 py-3 bg-slate-800/40 border-t border-slate-700">
                  <div className="col-span-1" />
                  <div className="col-span-3">
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Toplam</p>
                  </div>
                  <div className="col-span-4" />
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-bold text-cyan-300">{totals.orders}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-bold text-slate-300">{totals.packages}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-mono font-bold text-emerald-300">{usd(totals.revenue)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ INACTIVE SHIPS ═══ */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-white font-semibold text-sm">Sipariş Geçilmemiş Gemiler</p>
              {inactiveData && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400 bg-amber-500/10">
                  {inactiveData.totalInactive}/{inactiveData.totalShips}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-slate-600">
                <CalendarDays className="h-3.5 w-3.5" />
              </div>
              <Select value={inactiveRange} onValueChange={(v) => setInactiveRange(v as DateRange)}>
                <SelectTrigger className="h-8 w-40 bg-slate-800 border-slate-700 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {(Object.entries(RANGE_LABELS) as [DateRange, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-white text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {inactiveRange === 'specificMonth' && (
                <>
                  <Select value={inactiveMonth} onValueChange={setInactiveMonth}>
                    <SelectTrigger className="h-8 w-28 bg-slate-800 border-slate-700 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {MONTHS.map(m => <SelectItem key={m.value} value={m.value} className="text-white text-xs">{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={inactiveYear} onValueChange={setInactiveYear}>
                    <SelectTrigger className="h-8 w-24 bg-slate-800 border-slate-700 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {inactiveYears.map(y => <SelectItem key={y} value={y} className="text-white text-xs">{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>

          {inactiveLoading ? (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : inactiveData?.ships?.length > 0 ? (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {inactiveData.ships.map((ship: any) => {
                const days = ship.daysSinceLastOrder;
                const urgency =
                  days === null ? { bg: 'bg-red-900/20', border: 'border-red-700/30', dot: 'bg-red-500', text: 'text-red-400', label: 'Hiç sipariş yok' }
                  : days > 60  ? { bg: 'bg-red-900/15', border: 'border-red-700/25', dot: 'bg-red-500', text: 'text-red-400', label: `${days} gün önce` }
                  : days > 30  ? { bg: 'bg-amber-900/15', border: 'border-amber-600/25', dot: 'bg-amber-400', text: 'text-amber-400', label: `${days} gün önce` }
                  :              { bg: 'bg-yellow-900/10', border: 'border-yellow-600/25', dot: 'bg-yellow-400', text: 'text-yellow-300', label: `${days} gün önce` };
                return (
                  <div key={ship.shipId} className={`rounded-xl border ${urgency.border} ${urgency.bg} p-4`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${urgency.dot}`} />
                        <p className="text-white text-sm font-medium truncate">{ship.shipName}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1">
                        <Ship className="h-2.5 w-2.5" />
                        {ship.userCount}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-600" />
                        <span className={`text-xs font-medium ${urgency.text}`}>{urgency.label}</span>
                      </div>
                      {ship.lastOrderDate && (
                        <span className="text-[10px] text-slate-600">
                          {new Date(ship.lastOrderDate).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !inactiveLoading && (
            <div className="py-14 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-1">
                <Ship className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-green-400 font-medium text-sm">Tüm gemiler bu dönemde sipariş vermiş!</p>
              <p className="text-slate-600 text-xs">Seçilen dönemde aktif olmayan gemi yok.</p>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
