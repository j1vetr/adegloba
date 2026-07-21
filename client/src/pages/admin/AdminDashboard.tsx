import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/AdminLayout";
import { Link } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import {
  Users, ShoppingCart, Package, DollarSign, Ship,
  Gift, Key, ArrowRight, HelpCircle, XCircle,
  TrendingUp, UserPlus, CheckCircle, Clock,
  BarChart3, Settings, Bell, Send,
} from "lucide-react";

interface Stats {
  totalRevenue: number; activeUsers: number; activePackages: number;
  totalOrders: number; cancelledOrders: number; pendingOrders: number; activeTickets: number;
}
interface MonthlyStats {
  monthlyOrders: number; monthlyRevenue: number;
  monthlyCancelled: number; monthlyNewUsers: number;
}
interface RecentOrder {
  id: string; createdAt?: string; created_at?: string;
  status: string; totalUsd?: string; total_usd?: string;
  user?: { username: string };
}
interface RecentUser {
  id: string; username: string; createdAt?: string; created_at?: string;
  ship?: { name: string };
}

const usd = (v: number | string | null | undefined) => {
  const n = Number(v ?? 0);
  return isNaN(n) ? "$0.00" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmt = (d?: string) => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "" : format(toZonedTime(dt, "Europe/Istanbul"), "d MMM, HH:mm", { locale: tr });
  } catch { return ""; }
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Bekliyor",     cls: "text-amber-400"  },
  paid:      { label: "Ödendi",       cls: "text-blue-400"   },
  completed: { label: "Tamamlandı",   cls: "text-emerald-400"},
  cancelled: { label: "İptal",        cls: "text-red-400"    },
  refunded:  { label: "İade",         cls: "text-sky-400"    },
  failed:    { label: "Başarısız",    cls: "text-rose-500"   },
  expired:   { label: "Süresi Doldu", cls: "text-slate-500"  },
};

const COLORS = ["bg-cyan-700","bg-violet-700","bg-emerald-700","bg-rose-700","bg-amber-700","bg-sky-700","bg-indigo-700","bg-teal-700"];

function Sk({ w = "w-16", h = "h-5" }: { w?: string; h?: string }) {
  return <span className={`block rounded bg-slate-800 animate-pulse ${w} ${h}`} />;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAdminAuth();

  const { data: stats, isLoading: sL } = useQuery<Stats>({ queryKey: ["/api/admin/stats"], enabled: !!user });
  const { data: monthly, isLoading: mL } = useQuery<MonthlyStats>({ queryKey: ["/api/admin/stats/monthly"], enabled: !!user });
  const { data: recentOrders, isLoading: oL } = useQuery<RecentOrder[]>({ queryKey: ["/api/admin/recent-orders"], enabled: !!user });
  const { data: recentUsers, isLoading: uL } = useQuery<RecentUser[]>({ queryKey: ["/api/admin/recent-users"], enabled: !!user });

  if (authLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const now = toZonedTime(new Date(), "Europe/Istanbul");
  const pending = stats?.pendingOrders ?? 0;
  const tickets = stats?.activeTickets ?? 0;

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6 pb-8">

        {/* ── Başlık ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Yönetim Paneli</h1>
            <p className="text-slate-500 text-sm mt-0.5 capitalize">
              {format(now, "d MMMM yyyy, EEEE", { locale: tr })}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Sistem Aktif
          </div>
        </div>

        {/* ── Aksiyon Uyarıları ── */}
        {!sL && (pending > 0 || tickets > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pending > 0 && (
              <Link href="/admin/orders">
                <div className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/8 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-amber-400 shrink-0" />
                    <p className="text-amber-200 text-sm"><span className="font-bold">{pending}</span> bekleyen sipariş</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>
            )}
            {tickets > 0 && (
              <Link href="/admin/tickets">
                <div className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/8 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-violet-400 shrink-0" />
                    <p className="text-violet-200 text-sm"><span className="font-bold">{tickets}</span> açık destek talebi</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-violet-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>
            )}
          </div>
        )}

        {/* ── Bu Ay — Ana Metrikler ── */}
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">
            {format(now, "MMMM yyyy", { locale: tr })} — Bu Ay
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Ciro",       value: mL ? null : usd(monthly?.monthlyRevenue ?? 0), icon: TrendingUp,  accent: "text-emerald-400", border: "border-emerald-500/15", bg: "bg-emerald-500/5"  },
              { label: "Sipariş",    value: mL ? null : String(monthly?.monthlyOrders ?? 0), icon: CheckCircle, accent: "text-sky-400",     border: "border-sky-500/15",     bg: "bg-sky-500/5"      },
              { label: "İptal",      value: mL ? null : String(monthly?.monthlyCancelled ?? 0), icon: XCircle,    accent: "text-red-400",     border: "border-red-500/15",     bg: "bg-red-500/5"      },
              { label: "Yeni Üye",   value: mL ? null : String(monthly?.monthlyNewUsers ?? 0), icon: UserPlus,   accent: "text-violet-400",  border: "border-violet-500/15",  bg: "bg-violet-500/5"   },
            ].map(c => {
              const Icon = c.icon;
              return (
                <div key={c.label} className={`rounded-xl border ${c.border} ${c.bg} px-5 py-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-slate-400 text-xs font-medium">{c.label}</p>
                    <Icon className={`h-4 w-4 ${c.accent}`} />
                  </div>
                  {c.value === null
                    ? <Sk w="w-24" h="h-8" />
                    : <p className={`text-3xl font-bold tabular-nums leading-none ${c.accent}`}>{c.value}</p>
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Genel Durum ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Toplam Ciro",     value: sL ? null : usd(stats?.totalRevenue ?? 0),    sub: `${stats?.totalOrders ?? 0} toplam sipariş`,  icon: DollarSign, accent: "text-emerald-400" },
            { label: "Aktif Kullanıcı", value: sL ? null : String(stats?.activeUsers ?? 0),  sub: `${stats?.activePackages ?? 0} aktif paket`,   icon: Users,      accent: "text-cyan-400"    },
            { label: "Aktif Paket",     value: sL ? null : String(stats?.activePackages ?? 0),sub: `${stats?.cancelledOrders ?? 0} iptal sipariş`,icon: Package,    accent: "text-amber-400"   },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <Icon className={`h-5 w-5 ${c.accent}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-500 text-xs mb-0.5">{c.label}</p>
                  {c.value === null
                    ? <Sk w="w-16" h="h-6" />
                    : <p className="text-white text-xl font-bold tabular-nums leading-tight">{c.value}</p>
                  }
                  {c.sub && <p className="text-slate-600 text-[11px] truncate mt-0.5">{c.sub}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Son Siparişler + Son Üyeler ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Son Siparişler */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <p className="text-white font-semibold text-sm">Son Siparişler</p>
              <Link href="/admin/orders">
                <span className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer">
                  Tümünü Gör <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>

            {oL ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Sk key={i} w="w-full" h="h-11" />)}
              </div>
            ) : !recentOrders?.length ? (
              <div className="py-16 text-center text-slate-600 text-sm">Henüz sipariş yok</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800/60">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Kullanıcı</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Tutar</th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentOrders ?? []).slice(0, 8).map(o => {
                    const total = o.totalUsd ?? (o as any).total_usd ?? "0";
                    const date  = o.createdAt ?? (o as any).created_at;
                    const s     = STATUS[o.status] ?? STATUS.pending;
                    return (
                      <tr key={o.id} className="border-b border-slate-800/40 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-white font-medium truncate max-w-[130px]">{o.user?.username ?? "Anonim"}</p>
                          {date && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="h-2.5 w-2.5 text-slate-700 shrink-0" />
                              <p className="text-slate-600 text-[11px]">{fmt(date)}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-white font-mono font-semibold">{usd(total)}</p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-xs font-medium ${s.cls}`}>{s.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Son Üyeler */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <p className="text-white font-semibold text-sm">Son Üyeler</p>
              <Link href="/admin/users">
                <span className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer">
                  Tümünü Gör <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>

            {uL ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Sk w="w-9" h="h-9" />
                    <div className="flex-1 space-y-1.5"><Sk w="w-28" h="h-3.5" /><Sk w="w-20" h="h-3" /></div>
                    <Sk w="w-14" h="h-3" />
                  </div>
                ))}
              </div>
            ) : !recentUsers?.length ? (
              <div className="py-16 text-center text-slate-600 text-sm">Henüz üye yok</div>
            ) : (
              <div>
                {(recentUsers ?? []).slice(0, 8).map(u => {
                  const date     = u.createdAt ?? u.created_at;
                  const initials = (u.username ?? "?").slice(0, 2).toUpperCase();
                  const color    = COLORS[(u.username?.charCodeAt(0) ?? 0) % COLORS.length];
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-xs font-bold">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{u.username}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Ship className="h-2.5 w-2.5 text-slate-700 shrink-0" />
                          <p className="text-slate-600 text-[11px] truncate">{u.ship?.name ?? "Gemi seçilmemiş"}</p>
                        </div>
                      </div>
                      {date && <p className="text-slate-600 text-[11px] shrink-0">{fmt(date)}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Hızlı Erişim ── */}
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">Hızlı Erişim</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: "Gemiler",         href: "/admin/ships",            icon: Ship,        accent: "text-blue-400",   hover: "hover:border-blue-700/50 hover:bg-blue-600/5"   },
              { name: "Siparişler",      href: "/admin/orders",           icon: ShoppingCart,accent: "text-amber-400",  hover: "hover:border-amber-700/50 hover:bg-amber-600/5"  },
              { name: "Kullanıcılar",    href: "/admin/users",            icon: Users,       accent: "text-cyan-400",   hover: "hover:border-cyan-700/50 hover:bg-cyan-600/5"    },
              { name: "Paketler",        href: "/admin/packages",         icon: Package,     accent: "text-purple-400", hover: "hover:border-purple-700/50 hover:bg-purple-600/5"},
              { name: "Kuponlar",        href: "/admin/coupons",          icon: Gift,        accent: "text-green-400",  hover: "hover:border-green-700/50 hover:bg-green-600/5"  },
              { name: "Kimlik Havuzu",   href: "/admin/credential-pools", icon: Key,         accent: "text-orange-400", hover: "hover:border-orange-700/50 hover:bg-orange-600/5"},
              { name: "Raporlama",       href: "/admin/reports",          icon: BarChart3,   accent: "text-sky-400",    hover: "hover:border-sky-700/50 hover:bg-sky-600/5"      },
              { name: "Sistem Ayarları", href: "/admin/settings",         icon: Settings,    accent: "text-slate-400",  hover: "hover:border-slate-600/50 hover:bg-slate-700/20" },
            ].map(a => {
              const Icon = a.icon;
              return (
                <Link key={a.href} href={a.href}>
                  <div className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-900/40 cursor-pointer transition-all ${a.hover}`}>
                    <Icon className={`h-4 w-4 shrink-0 ${a.accent}`} />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors truncate">{a.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
