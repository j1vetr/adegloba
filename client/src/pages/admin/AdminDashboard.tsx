import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/AdminLayout";
import { Link } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import {
  Users, ShoppingCart, Package, DollarSign, Ship,
  Gift, Clock, CheckCircle, ArrowRight, Key, HelpCircle,
  XCircle, TrendingUp, UserPlus, CalendarDays, BarChart3,
  Settings, Bell, Send, Globe,
} from "lucide-react";

/* ─── tipler ─── */
interface Stats {
  totalRevenue: number;
  activeUsers: number;
  activePackages: number;
  totalOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  activeTickets: number;
}
interface MonthlyStats {
  monthlyOrders: number;
  monthlyRevenue: number;
  monthlyCancelled: number;
  monthlyNewUsers: number;
}
interface RecentOrder {
  id: string;
  createdAt?: string;
  created_at?: string;
  status: string;
  totalUsd?: string;
  total_usd?: string;
  user?: { username: string };
}
interface RecentUser {
  id: string;
  username: string;
  createdAt?: string;
  created_at?: string;
  ship?: { name: string };
}

/* ─── yardımcılar ─── */
const usd = (v: number | string | null | undefined) => {
  const n = Number(v ?? 0);
  return isNaN(n) ? "$0.00" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmt = (d?: string) => {
  if (!d) return "Bilinmiyor";
  try {
    const date = new Date(d);
    return isNaN(date.getTime())
      ? "Bilinmiyor"
      : format(toZonedTime(date, "Europe/Istanbul"), "d MMM, HH:mm", { locale: tr });
  } catch { return "Bilinmiyor"; }
};

const STATUS: Record<string, { label: string; dot: string }> = {
  pending:   { label: "Bekliyor",    dot: "bg-amber-400"  },
  paid:      { label: "Ödendi",      dot: "bg-blue-400"   },
  completed: { label: "Tamamlandı",  dot: "bg-green-400"  },
  cancelled: { label: "İptal",       dot: "bg-red-400"    },
  refunded:  { label: "İade",        dot: "bg-sky-400"    },
  failed:    { label: "Başarısız",   dot: "bg-rose-600"   },
  expired:   { label: "Süresi Doldu",dot: "bg-slate-500"  },
};

const AVATAR_COLORS = [
  "bg-cyan-700","bg-violet-700","bg-emerald-700","bg-rose-700",
  "bg-amber-700","bg-sky-700","bg-indigo-700","bg-teal-700",
];

function Sk({ w = "w-16", h = "h-5" }: { w?: string; h?: string }) {
  return <span className={`block rounded bg-slate-800 animate-pulse ${w} ${h}`} />;
}

/* ══════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, isLoading } = useAdminAuth();

  const { data: stats, isLoading: sL } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"], enabled: !!user,
  });
  const { data: monthly, isLoading: mL } = useQuery<MonthlyStats>({
    queryKey: ["/api/admin/stats/monthly"], enabled: !!user,
  });
  const { data: recentOrders, isLoading: oL } = useQuery<RecentOrder[]>({
    queryKey: ["/api/admin/recent-orders"], enabled: !!user,
  });
  const { data: recentUsers, isLoading: uL } = useQuery<RecentUser[]>({
    queryKey: ["/api/admin/recent-users"], enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const now = toZonedTime(new Date(), "Europe/Istanbul");
  const pendingOrders = stats?.pendingOrders ?? 0;
  const openTickets   = stats?.activeTickets ?? 0;

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-5 pb-8">

        {/* ── Başlık ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-slate-600 text-xs capitalize">
              {format(now, "d MMMM yyyy, EEEE", { locale: tr })}
            </p>
            <h1 className="text-xl font-bold text-white mt-0.5">
              Merhaba,{" "}
              <span className="text-cyan-400">{user?.username || "Admin"}</span>
            </h1>
          </div>
        </div>

        {/* ── Aksiyon Uyarıları (yalnızca gerektiğinde) ── */}
        {!sL && (pendingOrders > 0 || openTickets > 0) && (
          <div className="flex flex-col sm:flex-row gap-2">
            {pendingOrders > 0 && (
              <Link href="/admin/orders" className="flex-1">
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <p className="text-amber-300 text-sm font-medium truncate">
                      <span className="font-bold">{pendingOrders}</span> bekleyen sipariş var
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            )}
            {openTickets > 0 && (
              <Link href="/admin/tickets" className="flex-1">
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-violet-500/25 bg-violet-500/5 hover:bg-violet-500/10 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
                    <p className="text-violet-300 text-sm font-medium truncate">
                      <span className="font-bold">{openTickets}</span> açık destek talebi
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-violet-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            )}
          </div>
        )}

        {/* ── Bu Ay ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-3.5 w-3.5 text-slate-600" />
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
              {format(now, "MMMM", { locale: tr })} Ayı
            </p>
            <span className="flex-1 h-px bg-slate-800/80" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Ciro",      value: mL ? null : usd(monthly?.monthlyRevenue ?? 0), icon: TrendingUp,  accent: "text-emerald-400" },
              { label: "Sipariş",   value: mL ? null : String(monthly?.monthlyOrders ?? 0), icon: CheckCircle, accent: "text-sky-400"     },
              { label: "İptal",     value: mL ? null : String(monthly?.monthlyCancelled ?? 0), icon: XCircle,    accent: "text-red-400"      },
              { label: "Yeni Üye",  value: mL ? null : String(monthly?.monthlyNewUsers ?? 0), icon: UserPlus,   accent: "text-violet-400"   },
            ].map(c => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${c.accent}`} />
                    <p className="text-xs text-slate-500">{c.label}</p>
                  </div>
                  {c.value === null
                    ? <Sk w="w-20" h="h-7" />
                    : <p className={`text-2xl font-bold tabular-nums leading-none ${c.accent}`}>{c.value}</p>
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Genel Durum ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Toplam Ciro",
              value: sL ? null : usd(stats?.totalRevenue ?? 0),
              sub:   sL ? "" : `${stats?.totalOrders ?? 0} sipariş (tüm zamanlar)`,
              icon: DollarSign, accent: "text-emerald-400",
            },
            {
              label: "Aktif Kullanıcı",
              value: sL ? null : String(stats?.activeUsers ?? 0),
              sub:   sL ? "" : `${stats?.activePackages ?? 0} aktif paket`,
              icon: Users, accent: "text-cyan-400",
            },
            {
              label: "Aktif Paket",
              value: sL ? null : String(stats?.activePackages ?? 0),
              sub:   sL ? "" : `${stats?.cancelledOrders ?? 0} iptal sipariş`,
              icon: Package, accent: "text-amber-400",
            },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <Icon className={`h-4 w-4 ${c.accent}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-500 text-xs">{c.label}</p>
                  {c.value === null
                    ? <Sk w="w-16" h="h-5" />
                    : <p className="text-white text-lg font-bold leading-tight tabular-nums">{c.value}</p>
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-sm font-semibold text-white">Son Siparişler</p>
              </div>
              <Link href="/admin/orders">
                <span className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer">
                  Tümü <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>

            {oL ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Sk w="w-full" h="h-10" />
                  </div>
                ))}
              </div>
            ) : !recentOrders?.length ? (
              <div className="py-14 text-center text-slate-600 text-sm">Henüz sipariş yok</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {recentOrders.slice(0, 7).map(o => {
                    const total = o.totalUsd ?? (o as any).total_usd ?? "0";
                    const date  = o.createdAt ?? (o as any).created_at;
                    const s     = STATUS[o.status] ?? STATUS.pending;
                    return (
                      <tr key={o.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="text-white font-medium truncate max-w-[120px]">
                            {o.user?.username ?? "Anonim"}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5 text-slate-700 shrink-0" />
                            <p className="text-slate-600 text-[11px]">{fmt(date)}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <p className="text-white font-mono font-medium">{usd(total)}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-300">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Son Üyeler */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-sm font-semibold text-white">Son Üyeler</p>
              </div>
              <Link href="/admin/users">
                <span className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer">
                  Tümü <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>

            {uL ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Sk w="w-9" h="h-9" />
                    <div className="flex-1 space-y-1.5">
                      <Sk w="w-28" h="h-3" />
                      <Sk w="w-20" h="h-2.5" />
                    </div>
                    <Sk w="w-14" h="h-2.5" />
                  </div>
                ))}
              </div>
            ) : !recentUsers?.length ? (
              <div className="py-14 text-center text-slate-600 text-sm">Henüz üye yok</div>
            ) : (
              <div>
                {recentUsers.slice(0, 7).map(u => {
                  const date     = u.createdAt ?? u.created_at;
                  const initials = (u.username ?? "?").slice(0, 2).toUpperCase();
                  const color    = AVATAR_COLORS[(u.username?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-xs font-semibold">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{u.username}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Ship className="h-2.5 w-2.5 text-slate-700 shrink-0" />
                          <p className="text-slate-600 text-[11px] truncate">
                            {u.ship?.name ?? "Gemi seçilmemiş"}
                          </p>
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px] shrink-0">{fmt(date)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Hızlı Erişim ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Hızlı Erişim</p>
            <span className="flex-1 h-px bg-slate-800/80" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: "Gemiler",          href: "/admin/ships",            icon: Ship,      color: "text-blue-400   border-blue-800/40   hover:border-blue-600/40   hover:bg-blue-600/5"   },
              { name: "Siparişler",       href: "/admin/orders",           icon: ShoppingCart, color: "text-amber-400  border-amber-800/40  hover:border-amber-600/40  hover:bg-amber-600/5"  },
              { name: "Kullanıcılar",     href: "/admin/users",            icon: Users,     color: "text-cyan-400   border-cyan-800/40   hover:border-cyan-600/40   hover:bg-cyan-600/5"   },
              { name: "Paketler",         href: "/admin/packages",         icon: Package,   color: "text-purple-400 border-purple-800/40 hover:border-purple-600/40 hover:bg-purple-600/5" },
              { name: "Kuponlar",         href: "/admin/coupons",          icon: Gift,      color: "text-green-400  border-green-800/40  hover:border-green-600/40  hover:bg-green-600/5"  },
              { name: "Kimlik Havuzu",    href: "/admin/credential-pools", icon: Key,       color: "text-orange-400 border-orange-800/40 hover:border-orange-600/40 hover:bg-orange-600/5" },
              { name: "Raporlama",        href: "/admin/reports",          icon: BarChart3, color: "text-sky-400    border-sky-800/40    hover:border-sky-600/40    hover:bg-sky-600/5"    },
              { name: "Sistem Ayarları",  href: "/admin/settings",         icon: Settings,  color: "text-slate-400  border-slate-700/40  hover:border-slate-600/40  hover:bg-slate-700/20" },
            ].map(a => {
              const Icon = a.icon;
              return (
                <Link key={a.href} href={a.href}>
                  <div className={`group flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-slate-900/40 cursor-pointer transition-all ${a.color}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors truncate">{a.name}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
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
