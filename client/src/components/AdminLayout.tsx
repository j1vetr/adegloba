import { useState, useRef, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Ship, Package, Gift, ShoppingCart, Users,
  Settings, Menu, X, LogOut, ChevronDown, HelpCircle, FileText,
  Key, Mail, BarChart3, Bell, PackageCheck, TrendingUp,
  Send, Database, Globe, CreditCard, DollarSign,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import adeGlobaLogo from '@assets/adegloba-1_1756252463127.png';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

/* ─── Nav yapısı ─── */
const NAV_GROUPS = [
  {
    id: 'islemler',
    label: 'İşlemler',
    cols: 2,
    items: [
      { name: 'Gemiler',         href: '/admin/ships',            icon: Ship },
      { name: 'Paketler',        href: '/admin/packages',         icon: Package },
      { name: 'Kimlik Havuzu',   href: '/admin/credential-pools', icon: Key },
      { name: 'Kuponlar',        href: '/admin/coupons',          icon: Gift },
      { name: 'Siparişler',      href: '/admin/orders',           icon: ShoppingCart },
      { name: 'Stok Yönetimi',   href: '/admin/stock-management', icon: PackageCheck },
    ],
  },
  {
    id: 'kullanicilar',
    label: 'Kullanıcılar',
    cols: 1,
    items: [
      { name: 'Kullanıcılar',     href: '/admin/users',   icon: Users },
      { name: 'Destek Talepleri', href: '/admin/tickets', icon: HelpCircle },
    ],
  },
  {
    id: 'raporlar',
    label: 'Raporlar',
    cols: 2,
    items: [
      { name: 'Raporlama',       href: '/admin/reports',           icon: BarChart3 },
      { name: 'Gemi Analitik',   href: '/admin/ship-analytics',    icon: TrendingUp },
      { name: 'Mali Raporlar',   href: '/admin/financial-reports', icon: DollarSign },
      { name: 'E-posta Raporu',  href: '/admin/admin-reporting',   icon: Mail },
    ],
  },
  {
    id: 'iletisim',
    label: 'İletişim',
    cols: 1,
    items: [
      { name: 'Push Bildirimleri', href: '/admin/push-notifications', icon: Bell },
      { name: 'E-posta Pazarlama', href: '/admin/email-marketing',    icon: Send },
    ],
  },
  {
    id: 'sistem',
    label: 'Sistem',
    cols: 2,
    items: [
      { name: 'Site Ayarları',    href: '/admin/site-settings',    icon: Globe },
      { name: 'E-posta Ayarları', href: '/admin/email-settings',   icon: Mail },
      { name: 'Genel Ayarlar',    href: '/admin/settings',         icon: Settings },
      { name: 'DB Yedekleme',     href: '/admin/database-backup',  icon: Database },
      { name: 'Sistem Logları',   href: '/admin/logs',             icon: FileText },
      { name: 'Ödeme Olayları',   href: '/admin/payment-events',   icon: CreditCard },
    ],
  },
];

/* ══════════════════════════════════════════════════════════ */
export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isLoading } = useAdminAuth();
  const { toast } = useToast();
  const navRef = useRef<HTMLDivElement>(null);

  /* Sayfa değişince menüleri kapat */
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location]);

  /* Dışarı tıklayınca dropdown kapat */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Escape tuşu */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenMenu(null); setMobileOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/admin/logout');
      window.location.href = '/login';
    } catch {
      toast({ title: 'Hata', description: 'Çıkış yapılırken bir hata oluştu.', variant: 'destructive' });
    }
  };

  const isActive = (href: string) =>
    href === '/admin' ? location === '/admin' : location.startsWith(href);

  const isGroupActive = (group: typeof NAV_GROUPS[0]) =>
    group.items.some(item => isActive(item.href));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src={adeGlobaLogo} alt="AdeGloba" className="h-12 opacity-60 animate-pulse" />
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">

      {/* ══════════ NAVBAR ══════════ */}
      <header
        ref={navRef}
        className="sticky top-0 z-50 h-[60px] bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 flex items-center px-4 lg:px-6 gap-4 shrink-0"
      >
        {/* Logo */}
        <Link href="/admin">
          <img
            src={adeGlobaLogo}
            alt="AdeGloba"
            className="h-11 w-auto object-contain cursor-pointer shrink-0"
          />
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto">

          {/* Dashboard — direct link */}
          <Link href="/admin">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors whitespace-nowrap ${
              location === '/admin'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}>
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
              Dashboard
            </div>
          </Link>

          {/* Dropdown gruplar */}
          {NAV_GROUPS.map(group => {
            const groupActive = isGroupActive(group);
            const open = openMenu === group.id;
            return (
              <div key={group.id} className="relative">
                <button
                  onClick={() => setOpenMenu(open ? null : group.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    groupActive || open
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {group.label}
                  <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown panel */}
                {open && (
                  <div className={`absolute top-full left-0 mt-2 rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/50 p-1.5 ${
                    group.cols === 2 ? 'grid grid-cols-2 gap-0.5 min-w-[280px]' : 'flex flex-col gap-0.5 min-w-[190px]'
                  }`}>
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link key={item.href} href={item.href}>
                          <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                            active
                              ? 'bg-cyan-500/10 text-cyan-300'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}>
                            <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <span className="truncate">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Sağ: kullanıcı + çıkış ── */}
        <div className="hidden lg:flex items-center gap-3 ml-auto shrink-0">
          <span className="text-slate-500 text-sm select-none">{user?.username || 'Admin'}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 border border-slate-800/80 hover:border-red-400/20 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Çıkış Yap
          </button>
        </div>

        {/* ── Mobil: sağ taraf ── */}
        <div className="lg:hidden flex items-center gap-2 ml-auto">
          <span className="text-slate-500 text-sm">{user?.username || 'Admin'}</span>
          <button
            onClick={() => { setMobileOpen(!mobileOpen); setOpenMenu(null); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Menü"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ══════════ MOBİL ÇEKMECE ══════════ */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[60px] bg-slate-950 z-40 overflow-y-auto">
          <div className="p-4">
            {/* Dashboard */}
            <Link href="/admin">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer mb-1 ${
                location === '/admin'
                  ? 'bg-cyan-500/10 text-cyan-300'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}>
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                Dashboard
              </div>
            </Link>

            {/* Gruplar */}
            {NAV_GROUPS.map(group => (
              <div key={group.id} className="mt-4">
                <p className="px-4 pb-1 text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link key={item.href} href={item.href}>
                        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm cursor-pointer transition-colors ${
                          active
                            ? 'bg-cyan-500/10 text-cyan-300'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}>
                          <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-600'}`} />
                          {item.name}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Çıkış */}
            <div className="mt-6 border-t border-slate-800 pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ İÇERİK ══════════ */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>

    </div>
  );
}
