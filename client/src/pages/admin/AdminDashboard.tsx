import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/AdminLayout";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { Link } from "wouter";
import {
  Users, ShoppingCart, Package, DollarSign, TrendingUp, Activity,
  Ship, Gift, Clock, AlertCircle, CheckCircle, ArrowRight,
  Key, BarChart3, HelpCircle, XCircle, Zap
} from "lucide-react";
import adeGlobaLogo from '@assets/adegloba-1_1756252463127.png';

interface DashboardStats {
  totalRevenue: number;
  activeUsers: number;
  activePackages: number;
  totalOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  activeTickets: number;
}

interface RecentOrder {
  id: string;
  createdAt: string;
  status: string;
  totalUsd?: string;
  total_usd?: string;
  user?: { username: string };
}

interface RecentUser {
  id: string;
  username: string;
  createdAt: string;
  created_at?: string;
  ship?: { name: string };
}

const formatCurrency = (v: number | string | null | undefined) => {
  if (v === null || v === undefined) return '$0';
  const n = Number(v);
  if (isNaN(n)) return '$0';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return format(toZonedTime(date, 'Europe/Istanbul'), 'd MMM HH:mm', { locale: tr });
  } catch { return '—'; }
};

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Bekliyor',    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',  icon: Clock },
  paid:      { label: 'Ödendi',      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',     icon: CheckCircle },
  completed: { label: 'Tamamlandı',  color: 'text-green-400 bg-green-500/10 border-green-500/30',  icon: CheckCircle },
  cancelled: { label: 'İptal',       color: 'text-red-400 bg-red-500/10 border-red-500/30',        icon: XCircle },
};

export default function AdminDashboard() {
  const { user, isLoading } = useAdminAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"], enabled: !!user,
  });
  const { data: recentOrders, isLoading: ordersLoading } = useQuery<RecentOrder[]>({
    queryKey: ["/api/admin/recent-orders"], enabled: !!user,
  });
  const { data: recentUsers, isLoading: usersLoading } = useQuery<RecentUser[]>({
    queryKey: ["/api/admin/recent-users"], enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const now = toZonedTime(new Date(), 'Europe/Istanbul');
  const greeting = now.getHours() < 12 ? 'Günaydın' : now.getHours() < 18 ? 'İyi günler' : 'İyi akşamlar';

  const statCards = [
    {
      label: 'Toplam Gelir',
      value: formatCurrency(stats?.totalRevenue ?? 0),
      sub: 'Tamamlanan ödemeler',
      icon: DollarSign,
      accent: 'text-emerald-400',
      ring: 'ring-emerald-500/20',
      bg: 'bg-emerald-500/8',
      glow: 'shadow-emerald-950',
    },
    {
      label: 'Aktif Kullanıcı',
      value: stats?.activeUsers ?? 0,
      sub: 'Aktif paketi olanlar',
      icon: Users,
      accent: 'text-cyan-400',
      ring: 'ring-cyan-500/20',
      bg: 'bg-cyan-500/8',
      glow: 'shadow-cyan-950',
    },
    {
      label: 'Bekleyen Sipariş',
      value: stats?.pendingOrders ?? 0,
      sub: 'Ödeme bekleniyor',
      icon: ShoppingCart,
      accent: 'text-amber-400',
      ring: 'ring-amber-500/20',
      bg: 'bg-amber-500/8',
      glow: 'shadow-amber-950',
    },
    {
      label: 'Açık Destek',
      value: stats?.activeTickets ?? 0,
      sub: 'Yanıt bekleyen talepler',
      icon: HelpCircle,
      accent: 'text-violet-400',
      ring: 'ring-violet-500/20',
      bg: 'bg-violet-500/8',
      glow: 'shadow-violet-950',
    },
  ];

  const quickActions = [
    { name: 'Gemiler',        href: '/admin/ships',           icon: Ship,      color: 'from-blue-600 to-cyan-600' },
    { name: 'Paketler',       href: '/admin/packages',        icon: Package,   color: 'from-purple-600 to-pink-600' },
    { name: 'Kuponlar',       href: '/admin/coupons',         icon: Gift,      color: 'from-green-600 to-emerald-600' },
    { name: 'Kimlik Havuzu',  href: '/admin/credential-pools',icon: Key,       color: 'from-orange-600 to-amber-600' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">

        {/* ── Welcome ── */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/30 to-transparent pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={adeGlobaLogo} alt="AdeGloba" className="h-10 w-auto object-contain shrink-0" />
              <div>
                <h1 className="text-xl font-bold text-white">
                  {greeting}, <span className="text-cyan-400">{user?.username || 'Admin'}</span>
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {format(now, "d MMMM yyyy · EEEE", { locale: tr })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-slate-300 text-xs font-medium">Sistem Aktif</span>
            </div>
          </div>

          {/* Quick summary row */}
          {!statsLoading && stats && (
            <div className="relative mt-5 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-500 text-xs">Tamamlanan Sipariş</p>
                <p className="text-white font-semibold text-lg">{stats.totalOrders}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Aktif Paket</p>
                <p className="text-white font-semibold text-lg">{stats.activePackages}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">İptal Sipariş</p>
                <p className="text-red-400 font-semibold text-lg">{stats.cancelledOrders}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Toplam Gelir</p>
                <p className="text-emerald-400 font-semibold text-lg">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`relative rounded-2xl border border-slate-800 bg-slate-900 p-5 overflow-hidden shadow-lg ${card.glow}/20`}
              >
                <div className={`absolute inset-0 ${card.bg} pointer-events-none`} />
                <div className="relative">
                  <div className={`inline-flex p-2 rounded-xl ring-1 ${card.ring} ${card.bg} mb-3`}>
                    <Icon className={`h-5 w-5 ${card.accent}`} />
                  </div>
                  <div className={`text-2xl sm:text-3xl font-bold ${card.accent} leading-none mb-1`}>
                    {statsLoading ? (
                      <span className="block w-16 h-7 bg-slate-800 rounded animate-pulse" />
                    ) : card.value}
                  </div>
                  <p className="text-slate-400 text-xs">{card.label}</p>
                  <p className="text-slate-600 text-[10px] mt-0.5">{card.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Recent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Orders */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-cyan-400" />
                <h2 className="text-white font-semibold text-sm">Son Siparişler</h2>
              </div>
              <Link href="/admin/orders">
                <span className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer">
                  Tümü <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
            <div className="divide-y divide-slate-800/60">
              {ordersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse shrink-0" />
                      <div className="space-y-1.5">
                        <div className="w-24 h-3 bg-slate-800 rounded animate-pulse" />
                        <div className="w-16 h-2.5 bg-slate-800 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="w-14 h-5 bg-slate-800 rounded animate-pulse" />
                  </div>
                ))
              ) : recentOrders && recentOrders.length > 0 ? (
                recentOrders.slice(0, 6).map((order) => {
                  const total = order.totalUsd || (order as any).total_usd || '0';
                  const date = order.createdAt || (order as any).created_at;
                  const s = statusMap[order.status] || statusMap.pending;
                  const SIcon = s.icon;
                  return (
                    <div key={order.id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-mono text-slate-400">#{order.id.slice(-3)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {order.user?.username || 'Anonim'}
                          </p>
                          <p className="text-slate-500 text-xs">{formatDate(date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white text-sm font-medium">{formatCurrency(total)}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${s.color}`}>
                          <SIcon className="h-2.5 w-2.5" />
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center">
                  <ShoppingCart className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                  <p className="text-slate-500 text-sm">Sipariş bulunamadı</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <h2 className="text-white font-semibold text-sm">Yeni Kullanıcılar</h2>
              </div>
              <Link href="/admin/users">
                <span className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer">
                  Tümü <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
            <div className="divide-y divide-slate-800/60">
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 animate-pulse shrink-0" />
                      <div className="space-y-1.5">
                        <div className="w-24 h-3 bg-slate-800 rounded animate-pulse" />
                        <div className="w-16 h-2.5 bg-slate-800 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="w-12 h-4 bg-slate-800 rounded animate-pulse" />
                  </div>
                ))
              ) : recentUsers && recentUsers.length > 0 ? (
                recentUsers.slice(0, 6).map((u) => {
                  const date = u.createdAt || u.created_at;
                  const initials = u.username?.slice(0, 2).toUpperCase() || 'U';
                  const colors = ['from-cyan-600 to-blue-600', 'from-purple-600 to-pink-600', 'from-green-600 to-teal-600', 'from-orange-600 to-amber-600'];
                  const color = colors[u.username?.charCodeAt(0) % colors.length || 0];
                  return (
                    <div key={u.id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-xs font-semibold">{initials}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{u.username}</p>
                          <div className="flex items-center gap-1 text-slate-500 text-xs">
                            <Ship className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{u.ship?.name || 'Gemi seçilmemiş'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-slate-500 text-xs">{formatDate(date)}</p>
                        <Badge variant="outline" className="mt-1 text-[10px] text-cyan-400 border-cyan-800 bg-cyan-500/5 px-1.5 py-0">
                          Yeni
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center">
                  <Users className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                  <p className="text-slate-500 text-sm">Kullanıcı bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-amber-400" />
            <h2 className="text-white font-semibold text-sm">Hızlı Erişim</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <div className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 cursor-pointer">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-slate-300 text-xs font-medium text-center group-hover:text-white transition-colors">
                      {action.name}
                    </span>
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
