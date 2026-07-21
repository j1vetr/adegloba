import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle, CheckCircle2, TrendingDown, Package, Plus,
  Upload, RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  Database, ShieldCheck, Key, X,
} from "lucide-react";

interface StockItem {
  planId: string;
  planName: string;
  shipName: string;
  total: number;
  assigned: number;
  available: number;
  stockLevel: "critical" | "low" | "adequate";
}

type SortField = "available" | "total" | "assigned" | "usage" | "planName" | "shipName";
type SortDir = "asc" | "desc";

const LEVEL_META = {
  critical: {
    label: "Kritik",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    bar: "bg-red-500",
    icon: AlertTriangle,
    iconCls: "text-red-400",
    order: 0,
  },
  low: {
    label: "Düşük",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    bar: "bg-amber-400",
    icon: TrendingDown,
    iconCls: "text-amber-400",
    order: 1,
  },
  adequate: {
    label: "Yeterli",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    bar: "bg-emerald-500",
    icon: CheckCircle2,
    iconCls: "text-emerald-400",
    order: 2,
  },
} as const;

function UsageBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-400 text-xs w-9 text-right shrink-0">{pct}%</span>
    </div>
  );
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3 text-cyan-400" /> : <ArrowDown className="h-3 w-3 text-cyan-400" />;
}

function AddSingleModal({ item, open, onClose }: { item: StockItem | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/credentials", data),
    onSuccess: () => {
      toast({ title: "Kimlik bilgisi eklendi", description: `${item?.planName} için yeni giriş eklendi.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stock-management"] });
      setUsername(""); setPassword(""); onClose();
    },
    onError: (e: any) => {
      toast({ title: "Hata", description: e?.message || "Eklenemedi", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !username.trim() || !password.trim()) return;
    mutation.mutate({ planId: item.planId, username: username.trim(), password: password.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setUsername(""); setPassword(""); onClose(); } }}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-cyan-400" />
            Kimlik Bilgisi Ekle
          </DialogTitle>
        </DialogHeader>
        {item && (
          <div className="mb-2 px-3 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 flex gap-2">
            <span className="text-slate-500">Paket:</span>
            <span className="font-medium text-white">{item.planName}</span>
            <span className="text-slate-500 ml-auto">{item.shipName}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Kullanıcı Adı</Label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="kullanici@ornek.com"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Şifre</Label>
            <Input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Şifre"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400">İptal</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {mutation.isPending ? "Ekleniyor..." : "Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkImportModal({ item, open, onClose }: { item: StockItem | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [text, setText] = useState("");

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/credentials/import", data),
    onSuccess: (data: any) => {
      const count = data?.imported ?? "?";
      toast({ title: `${count} kimlik bilgisi içe aktarıldı`, description: `${item?.planName} için stok güncellendi.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stock-management"] });
      setText(""); onClose();
    },
    onError: (e: any) => {
      toast({ title: "Hata", description: e?.message || "İçe aktarılamadı", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !text.trim()) return;
    mutation.mutate({ planId: item.planId, credentials: text.trim() });
  };

  const lineCount = text.trim() ? text.trim().split("\n").filter(l => l.trim()).length : 0;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setText(""); onClose(); } }}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-cyan-400" />
            Toplu İçe Aktarma
          </DialogTitle>
        </DialogHeader>
        {item && (
          <div className="px-3 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 flex gap-2">
            <span className="text-slate-500">Paket:</span>
            <span className="font-medium text-white">{item.planName}</span>
            <span className="text-slate-500 ml-auto">{item.shipName}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-sm">Kimlik Bilgileri</Label>
              {lineCount > 0 && (
                <span className="text-xs text-cyan-400">{lineCount} satır</span>
              )}
            </div>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={"kullanici1,sifre1\nkullanici2,sifre2\nkullanici3,sifre3"}
              rows={8}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 font-mono text-sm resize-none"
            />
            <p className="text-slate-500 text-xs">Her satıra bir kimlik bilgisi. Format: <code className="text-slate-400">kullanici,sifre</code></p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400">İptal</Button>
            <Button
              type="submit"
              disabled={mutation.isPending || lineCount === 0}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {mutation.isPending ? "Aktarılıyor..." : `${lineCount} Satırı Aktar`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function StockManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [shipFilter, setShipFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("available");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [addTarget, setAddTarget] = useState<StockItem | null>(null);
  const [importTarget, setImportTarget] = useState<StockItem | null>(null);

  const { data: stockData, isLoading, refetch, isFetching } = useQuery<StockItem[]>({
    queryKey: ["/api/admin/stock-management"],
    refetchInterval: 60000,
  });

  const ships = useMemo(() => {
    if (!stockData) return [];
    return [...new Set(stockData.map(s => s.shipName))].sort();
  }, [stockData]);

  const filtered = useMemo(() => {
    if (!stockData) return [];
    let list = stockData.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = !q || item.planName.toLowerCase().includes(q) || item.shipName.toLowerCase().includes(q);
      const matchShip = shipFilter === "all" || item.shipName === shipFilter;
      const matchLevel = levelFilter === "all" || item.stockLevel === levelFilter;
      return matchSearch && matchShip && matchLevel;
    });

    list = [...list].sort((a, b) => {
      let va: any, vb: any;
      switch (sortField) {
        case "available":  va = Number(a.available); vb = Number(b.available); break;
        case "total":      va = Number(a.total);     vb = Number(b.total);     break;
        case "assigned":   va = Number(a.assigned);  vb = Number(b.assigned);  break;
        case "usage":      va = Number(a.total) > 0 ? Number(a.assigned) / Number(a.total) : 0; vb = Number(b.total) > 0 ? Number(b.assigned) / Number(b.total) : 0; break;
        case "planName":   va = a.planName;  vb = b.planName;  break;
        case "shipName":   va = a.shipName;  vb = b.shipName;  break;
        default:           va = a.available; vb = b.available;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return LEVEL_META[a.stockLevel].order - LEVEL_META[b.stockLevel].order;
    });

    return list;
  }, [stockData, search, shipFilter, levelFilter, sortField, sortDir]);

  const stats = useMemo(() => {
    if (!stockData) return { total: 0, available: 0, assigned: 0, critical: 0 };
    return {
      total:     stockData.reduce((s, i) => s + Number(i.total), 0),
      available: stockData.reduce((s, i) => s + Number(i.available), 0),
      assigned:  stockData.reduce((s, i) => s + Number(i.assigned), 0),
      critical:  stockData.filter(i => i.stockLevel === "critical").length,
    };
  }, [stockData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const thClass = "px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap";
  const thBtn = (field: SortField, label: string, right = false) => (
    <th className={`${thClass} ${right ? "text-right" : "text-left"}`} onClick={() => handleSort(field)}>
      <span className={`inline-flex items-center gap-1 ${right ? "flex-row-reverse" : ""}`}>
        {label}
        <SortIcon field={field} current={sortField} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <AdminLayout title="Stok Yönetimi">
      <AddSingleModal item={addTarget} open={!!addTarget} onClose={() => setAddTarget(null)} />
      <BulkImportModal item={importTarget} open={!!importTarget} onClose={() => setImportTarget(null)} />

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Stok Yönetimi</h1>
            <p className="text-slate-500 text-sm mt-0.5">Kimlik bilgisi havuzu — plan bazlı stok durumu</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Toplam Kimlik",  value: stats.total,    icon: Database,    cls: "text-slate-300", bg: "bg-slate-700/40" },
            { label: "Müsait",         value: stats.available, icon: ShieldCheck, cls: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Atanmış",        value: stats.assigned,  icon: Key,         cls: "text-blue-400",   bg: "bg-blue-500/10" },
            { label: "Kritik Plan",    value: stats.critical,  icon: AlertTriangle, cls: stats.critical > 0 ? "text-red-400" : "text-slate-400", bg: stats.critical > 0 ? "bg-red-500/10" : "bg-slate-700/40" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="bg-slate-900/60 border-slate-700 px-4 py-3 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <Icon className={`h-4 w-4 ${s.cls}`} />
                </div>
                <div>
                  <p className="text-slate-500 text-xs">{s.label}</p>
                  <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Paket veya gemi ara..."
              className="bg-slate-800 border-slate-700 text-white pl-8 h-8 text-sm placeholder:text-slate-600"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={shipFilter} onValueChange={setShipFilter}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-sm w-40">
              <SelectValue placeholder="Tüm Gemiler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Gemiler</SelectItem>
              {ships.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-sm w-36">
              <SelectValue placeholder="Tüm Seviyeler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Seviyeler</SelectItem>
              <SelectItem value="critical">Kritik</SelectItem>
              <SelectItem value="low">Düşük</SelectItem>
              <SelectItem value="adequate">Yeterli</SelectItem>
            </SelectContent>
          </Select>
          {(search || shipFilter !== "all" || levelFilter !== "all") && (
            <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white px-2"
              onClick={() => { setSearch(""); setShipFilter("all"); setLevelFilter("all"); }}>
              <X className="h-3.5 w-3.5 mr-1" /> Temizle
            </Button>
          )}
          <span className="ml-auto text-slate-500 text-xs">{filtered.length} plan</span>
        </div>

        {/* Table */}
        <Card className="bg-slate-900/60 border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Yükleniyor...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Package className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Eşleşen plan bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700/80 bg-slate-800/40">
                  <tr>
                    {thBtn("shipName",  "Gemi")}
                    {thBtn("planName",  "Paket")}
                    {thBtn("total",     "Toplam",   true)}
                    {thBtn("assigned",  "Atanmış",  true)}
                    {thBtn("available", "Müsait",   true)}
                    {thBtn("usage",     "Kullanım", false)}
                    <th className={`${thClass} text-center`}>Durum</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => {
                    const meta = LEVEL_META[item.stockLevel];
                    const Icon = meta.icon;
                    return (
                      <tr key={`${item.planId}-${i}`}
                        className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{item.shipName}</td>
                        <td className="px-3 py-3 text-white font-medium whitespace-nowrap">{item.planName}</td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{item.total}</td>
                        <td className="px-3 py-3 text-right text-slate-400 tabular-nums">{item.assigned}</td>
                        <td className={`px-3 py-3 text-right font-semibold tabular-nums ${meta.iconCls}`}>
                          {item.available}
                        </td>
                        <td className="px-3 py-3 min-w-[130px]">
                          <UsageBar used={item.assigned} total={item.total} />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center">
                            <Badge className={`${meta.badge} border flex items-center gap-1.5 text-xs font-medium whitespace-nowrap`}>
                              <Icon className="h-3 w-3" />
                              {meta.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Kimlik Bilgisi Ekle"
                              onClick={() => setAddTarget(item)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Toplu İçe Aktar"
                              onClick={() => setImportTarget(item)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                            >
                              <Upload className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 px-1">
          {Object.entries(LEVEL_META).map(([key, m]) => {
            const Icon = m.icon;
            return (
              <span key={key} className="flex items-center gap-1.5">
                <Icon className={`h-3 w-3 ${m.iconCls}`} />
                <span className={m.iconCls}>{m.label}:</span>
                {key === "critical" && "müsait stok yok veya çok az"}
                {key === "low" && "%10–30 arasında"}
                {key === "adequate" && "%30'dan fazla müsait"}
              </span>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
