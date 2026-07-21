import { useState, useEffect, ReactNode } from 'react';
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

interface AdminLayoutProps { children: ReactNode; title: string; }

const NAV_GROUPS = [
  {
    id: 'islemler', label: 'İşlemler',
    items: [
      { name: 'Gemiler',       href: '/admin/ships',            icon: Ship         },
      { name: 'Paketler',      href: '/admin/packages',         icon: Package      },
      { name: 'Kimlik Havuzu', href: '/admin/credential-pools', icon: Key          },
      { name: 'Kuponlar',      href: '/admin/coupons',          icon: Gift         },
      { name: 'Siparişler',    href: '/admin/orders',           icon: ShoppingCart },
      { name: 'Stok Yönetimi', href: '/admin/stock-management', icon: PackageCheck },
    ],
  },
  {
    id: 'kullanicilar', label: 'Kullanıcılar',
    items: [
      { name: 'Kullanıcılar',     href: '/admin/users',   icon: Users      },
      { name: 'Destek Talepleri', href: '/admin/tickets', icon: HelpCircle },
    ],
  },
  {
    id: 'raporlar', label: 'Raporlar',
    items: [
      { name: 'Raporlama',      href: '/admin/reports',           icon: BarChart3  },
      { name: 'Gemi Analitik',  href: '/admin/ship-analytics',    icon: TrendingUp },
      { name: 'Mali Raporlar',  href: '/admin/financial-reports', icon: DollarSign },
      { name: 'E-posta Raporu', href: '/admin/admin-reporting',   icon: Mail       },
    ],
  },
  {
    id: 'iletisim', label: 'İletişim',
    items: [
      { name: 'Push Bildirimleri', href: '/admin/push-notifications', icon: Bell },
      { name: 'E-posta Pazarlama', href: '/admin/email-marketing',    icon: Send },
    ],
  },
  {
    id: 'sistem', label: 'Sistem',
    items: [
      { name: 'Site Ayarları',    href: '/admin/site-settings',   icon: Globe      },
      { name: 'E-posta Ayarları', href: '/admin/email-settings',  icon: Mail       },
      { name: 'Genel Ayarlar',    href: '/admin/settings',        icon: Settings   },
      { name: 'DB Yedekleme',     href: '/admin/database-backup', icon: Database   },
      { name: 'Sistem Logları',   href: '/admin/logs',            icon: FileText   },
      { name: 'Ödeme Olayları',   href: '/admin/payment-events',  icon: CreditCard },
    ],
  },
];

const SIDEBAR_W = 'w-[240px]';

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [location] = useLocation();
  const { user, isLoading } = useAdminAuth();
  const { toast } = useToast();

  const isActive    = (href: string) => href === '/admin' ? location === '/admin' : location.startsWith(href);
  const groupActive = (g: typeof NAV_GROUPS[0]) => g.items.some(i => isActive(i.href));

  // Auto-expand the active group on load/navigation
  useEffect(() => {
    setMobileOpen(false);
    const expanded: Record<string, boolean> = {};
    NAV_GROUPS.forEach(g => { if (groupActive(g)) expanded[g.id] = true; });
    setOpenGroups(prev => ({ ...prev, ...expanded }));
  }, [location]);

  const toggleGroup = (id: string) =>
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/admin/logout');
      window.location.href = '/login';
    } catch {
      toast({ title: 'Hata', description: 'Çıkış yapılırken bir hata oluştu.', variant: 'destructive' });
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <img src={adeGlobaLogo} alt="AdeGloba" className="h-16 opacity-50 animate-pulse" />
        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800 shrink-0">
        <Link href="/admin" onClick={() => setMobileOpen(false)}>
          <img
            src={adeGlobaLogo}
            alt="AdeGloba"
            className="h-14 w-auto object-contain cursor-pointer"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

        {/* Dashboard */}
        <Link href="/admin" onClick={() => setMobileOpen(false)}>
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            location === '/admin'
              ? 'bg-cyan-500/10 text-cyan-300'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}>
            <LayoutDashboard className={`h-4 w-4 shrink-0 ${location === '/admin' ? 'text-cyan-400' : 'text-slate-500'}`} />
            Dashboard
          </div>
        </Link>

        {/* Groups */}
        {NAV_GROUPS.map(group => {
          const isOpen   = !!openGroups[group.id];
          const isGActive = groupActive(group);
          return (
            <div key={group.id}>
              {/* Group header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isGActive && !isOpen
                    ? 'text-cyan-300 bg-cyan-500/5'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{group.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Group items */}
              {isOpen && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-slate-800 space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                        <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                          active
                            ? 'bg-cyan-500/10 text-cyan-300'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}>
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-600'}`} />
                          {item.name}
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

      {/* Kullanıcı + Çıkış */}
      <div className="shrink-0 border-t border-slate-800 p-3 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <span className="text-slate-300 text-sm truncate">{user?.username || 'Admin'}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-950">

      {/* ════════ DESKTOP SIDEBAR ════════ */}
      <aside className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 ${SIDEBAR_W} bg-slate-900 border-r border-slate-800`}>
        <SidebarContent />
      </aside>

      {/* ════════ MOBİL OVERLAY ════════ */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 ${SIDEBAR_W} bg-slate-900 border-r border-slate-800`}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ════════ İÇERİK ════════ */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen">

        {/* Mobil topbar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-slate-950 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src={adeGlobaLogo} alt="AdeGloba" className="h-8 w-auto object-contain" />
        </header>

        <main className="flex-1">
          <div className="max-w-screen-xl mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
