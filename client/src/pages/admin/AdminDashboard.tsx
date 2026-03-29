import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/AdminLayout";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { Link } from "wouter";
import {
  Users, ShoppingCart, Package, DollarSign,
  Ship, Gift, Clock, CheckCircle, ArrowRight,
  Key, HelpCircle, XCircle, TrendingUp, UserPlus,
  CalendarDays
} from "lucide-react";
import adeGlobaLogo from '@assets/adegloba-1_1756252463127.png';

/* ─────────────────── types ─────────────────── */
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

/* ─────────────────── helpers ─────────────────── */
const usd = (v: number | string | null | undefined, decimals = 2) => {
  const n = Number(v ?? 0);
  if (isNaN(n)) return '$0.00';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

const fmt = (d?: string) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return isNaN(date.getTime()) ? '—' : format(toZonedTime(date, 'Europe/Istanbul'), 'd MMM · HH:mm', { locale: tr });
  } catch { return '—'; }
};

const STATUS: Record<string, { label: string; dot: string }> = {
  pending:   { label: 'Bekliyor',    dot: 'bg-amber-400' },
  paid:      { label: 'Ödendi',      dot: 'bg-blue-400'  },
  completed: { label: 'Tamamlandı',  dot: 'bg-green-400' },
  cancelled: { label: 'İptal',       dot: 'bg-red-400'   },
};

const AVATAR_COLORS = [
  'bg-cyan-700', 'bg-violet-700', 'bg-emerald-700', 'bg-rose-700',
  'bg-amber-700', 'bg-sky-700', 'bg-indigo-700', 'bg-teal-700',
];

function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`block rounded bg-slate-800 animate-pulse ${className}`} />;
}

/* ─────────────────── component ─────────────────── */
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

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const now = toZonedTime(new Date(), 'Europe/Istanbul');
  const monthName = format(now, 'MMMM', { locale: tr });

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6 pb-6">

        {/* ═══════════════ HEADER STRIP ═══════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">
              {format(now, "d MMMM yyyy · EEEE", { locale: tr })}
            </p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Hoş geldin, <span className="text-cyan-400">{user?.username || 'Admin'}</span>
            </h1>
          </div>
          <img src={adeGlobaLogo} alt="AdeGloba" className="h-8 w-auto object-contain opacity-80 self-start sm:self-auto" />
        </div>

        {/* ═══════════════ GENEL ÖZET — 4 KART ═══════════════ */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: 'Toplam Gelir',
              value: sL ? null : usd(stats?.totalRevenue ?? 0),
              sub: `${stats?.totalOrders ?? 0} tamamlanan sipariş`,
              icon: DollarSign, border: 'border-l-emerald-500',
              iconBg: 'bg-emerald-500/10 text-emerald-400',
            },
            {
              label: 'Aktif Kullanıcı',
              value: sL ? null : String(stats?.activeUsers ?? 0),
              sub: `${stats?.activePackages ?? 0} aktif paket`,
              icon: Users, border: 'border-l-cyan-500',
              iconBg: 'bg-cyan-500/10 text-cyan-400',
            },
            {
              label: 'Bekleyen Sipariş',
              value: sL ? null : String(stats?.pendingOrders ?? 0),
              sub: `${stats?.cancelledOrders ?? 0} iptal edildi`,
              icon: ShoppingCart, border: 'border-l-amber-500',
              iconBg: 'bg-amber-500/10 text-amber-400',
            },
            {
              label: 'Açık Destek',
              value: sL ? null : String(stats?.activeTickets ?? 0),
              sub: 'Yanıt bekleyen',
              icon: HelpCircle, border: 'border-l-violet-500',
              iconBg: 'bg-violet-500/10 text-violet-400',
            },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className={`rounded-xl border border-slate-800 border-l-2 ${c.border} bg-slate-900/80 p-4 flex items-center gap-4`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-500 text-[11px] uppercase tracking-wide mb-0.5">{c.label}</p>
                  {c.value === null
                    ? <Skeleton className="w-20 h-6 mb-1" />
                    : <p className="text-white text-xl font-bold leading-none mb-0.5">{c.value}</p>
                  }
                  <p className="text-slate-600 text-[11px] truncate">{c.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══════════════ BU AYİN İSTATİSTİKLERİ ═══════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <p className="text-slate-400 text-sm font-medium capitalize">{monthName} ayı</p>
            <span className="flex-1 h-px bg-slate-800" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Bu Ay Sipariş',
                value: mL ? null : String(monthly?.monthlyOrders ?? 0),
                icon: CheckCircle,
                accent: 'text-green-400', bg: 'bg-green-500/8',
              },
              {
                label: 'Bu Ay Ciro',
                value: mL ? null : usd(monthly?.monthlyRevenue ?? 0),
                icon: TrendingUp,
                accent: 'text-emerald-400', bg: 'bg-emerald-500/8',
              },
              {
                label: 'Bu Ay İptal',
                value: mL ? null : String(monthly?.monthlyCancelled ?? 0),
                icon: XCircle,
                accent: 'text-red-400', bg: 'bg-red-500/8',
              },
              {
                label: 'Yeni Üye',
                value: mL ? null : String(monthly?.monthlyNewUsers ?? 0),
                icon: UserPlus,
                accent: 'text-sky-400', bg: 'bg-sky-500/8',
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className={`rounded-xl border border-slate-800 ${c.bg} p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-500 text-[11px] uppercase tracking-wide">{c.label}</p>
                    <Icon className={`h-3.5 w-3.5 ${c.accent}`} />
                  </div>
                  {c.value === null
                    ? <Skeleton className="w-16 h-7" />
                    : <p className={`text-2xl font-bold leading-none ${c.accent}`}>{c.value}</p>
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════ AKTİVİTE + KULLANICILAR ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Son Siparişler */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-white text-sm font-medium">Son Siparişler</p>
              <Link href="/admin/orders">
                <span className="text-slate-500 hover:text-cyan-400 text-xs flex items-center gap-1 cursor-pointer transition-colors">
                  Tümü <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>

            {oL ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="w-32 h-3" />
                      <Skeleton className="w-20 h-2.5" />
                    </div>
                    <Skeleton className="w-14 h-5 rounded-full" />
                  </div>
                ))}
              </div>
            ) : !recentOrders?.length ? (
              <div className="py-14 text-center text-slate-600 text-sm">Sipariş yok</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {recentOrders.slice(0, 7).map((o) => {
                    const total = o.totalUsd ?? (o as any).total_usd ?? '0';
                    const date  = o.createdAt ?? (o as any).created_at;
                    const s     = STATUS[o.status] ?? STATUS.pending;
                    return (
                      <tr key={o.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium truncate max-w-[110px]">
                            {o.user?.username ?? 'Anonim'}
                          </p>
                          <p className="text-slate-600 text-[11px] mt-0.5">{fmt(date)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-white font-mono font-medium">{usd(total)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
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

          {/* Yeni Kullanıcılar */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-white text-sm font-medium">Yeni Kullanıcılar</p>
              <Link href="/admin/users">
                <span className="text-slate-500 hover:text-cyan-400 text-xs flex items-center gap-1 cursor-pointer transition-colors">
                  Tümü <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>

            {uL ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="w-28 h-3" />
                      <Skeleton className="w-20 h-2.5" />
                    </div>
                    <Skeleton className="w-16 h-2.5" />
                  </div>
                ))}
              </div>
            ) : !recentUsers?.length ? (
              <div className="py-14 text-center text-slate-600 text-sm">Kullanıcı yok</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {recentUsers.slice(0, 7).map((u) => {
                  const date   = u.createdAt ?? u.created_at;
                  const initials = (u.username ?? '?').slice(0, 2).toUpperCase();
                  const color  = AVATAR_COLORS[(u.username?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors">
                      <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-xs font-semibold">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{u.username}</p>
                        <div className="flex items-center gap-1 text-slate-600 text-[11px] mt-0.5">
                          <Ship className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{u.ship?.name ?? 'Gemi seçilmemiş'}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px] shrink-0 text-right">{fmt(date)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════ HIZLI ERİŞİM ═══════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-slate-400 text-sm font-medium">Hızlı Erişim</p>
            <span className="flex-1 h-px bg-slate-800" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Gemiler',        href: '/admin/ships',            icon: Ship,    color: 'bg-blue-600/20 text-blue-400 border-blue-600/30'    },
              { name: 'Paketler',       href: '/admin/packages',         icon: Package, color: 'bg-purple-600/20 text-purple-400 border-purple-600/30'},
              { name: 'Kuponlar',       href: '/admin/coupons',          icon: Gift,    color: 'bg-green-600/20 text-green-400 border-green-600/30'  },
              { name: 'Kimlik Havuzu',  href: '/admin/credential-pools', icon: Key,     color: 'bg-orange-600/20 text-orange-400 border-orange-600/30'},
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.href} href={a.href}>
                  <div className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${a.color}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{a.name}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
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
