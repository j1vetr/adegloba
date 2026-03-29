import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Ship, Package, Gift, ShoppingCart, Users,
  Settings, Menu, X, LogOut, ChevronRight, HelpCircle, FileText,
  Key, Mail, BarChart3, Bell, PackageCheck, Activity, TrendingUp,
  Send, Database, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import adeGlobaLogo from '@assets/adegloba-1_1756252463127.png';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const NAV = [
  {
    section: null,
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    section: 'İşlemler',
    items: [
      { name: 'Gemiler',         href: '/admin/ships',           icon: Ship },
      { name: 'Paketler',        href: '/admin/packages',        icon: Package },
      { name: 'Kimlik Havuzu',   href: '/admin/credential-pools',icon: Key },
      { name: 'Kuponlar',        href: '/admin/coupons',         icon: Gift },
      { name: 'Siparişler',      href: '/admin/orders',          icon: ShoppingCart },
      { name: 'Stok Yönetimi',   href: '/admin/stock-management',icon: PackageCheck },
    ],
  },
  {
    section: 'Kullanıcılar',
    items: [
      { name: 'Kullanıcılar',      href: '/admin/users',   icon: Users },
      { name: 'Destek Talepleri',  href: '/admin/tickets', icon: HelpCircle },
    ],
  },
  {
    section: 'Raporlar',
    items: [
      { name: 'Raporlama',     href: '/admin/reports',         icon: BarChart3 },
      { name: 'Gemi Analitik', href: '/admin/ship-analytics',  icon: TrendingUp },
    ],
  },
  {
    section: 'İletişim',
    items: [
      { name: 'Push Bildirimleri', href: '/admin/push-notifications', icon: Bell },
      { name: 'E-posta Pazarlama', href: '/admin/email-marketing',    icon: Send },
    ],
  },
  {
    section: 'Sistem',
    items: [
      { name: 'Site Ayarları',       href: '/admin/site-settings',    icon: Globe },
      { name: 'E-posta Ayarları',    href: '/admin/email-settings',   icon: Mail },
      { name: 'Genel Ayarlar',       href: '/admin/settings',         icon: Settings },
      { name: 'DB Yedekleme',        href: '/admin/database-backup',  icon: Database },
      { name: 'Sistem Logları',      href: '/admin/logs',             icon: FileText },
    ],
  },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, isLoading } = useAdminAuth();
  const { toast } = useToast();

  useEffect(() => { setSidebarOpen(false); }, [location]);

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      window.location.href = '/admin/login';
    } catch {
      toast({ title: 'Hata', description: 'Çıkış yapılırken bir hata oluştu', variant: 'destructive' });
    }
  };

  const isActive = (href: string) =>
    href === '/admin' ? location === '/admin' : location.startsWith(href);

  const currentPage = NAV.flatMap(g => g.items).find(i => isActive(i.href));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src={adeGlobaLogo} alt="AdeGloba" className="h-10 opacity-60 animate-pulse" />
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-slate-950 border-r border-slate-800/80">
      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-slate-800/80 shrink-0">
        <Link href="/admin">
          <div className="flex items-center cursor-pointer">
            <img src={adeGlobaLogo} alt="AdeGloba" className="h-14 w-auto object-contain" />
          </div>
        </Link>
        <button
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map((group) => (
          <div key={group.section ?? 'top'}>
            {group.section && (
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
                {group.section}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`
                    relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                    text-sm font-medium transition-all duration-150 group
                    ${active
                      ? 'bg-cyan-500/10 text-cyan-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                    }
                  `}>
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400 rounded-full" />
                    )}
                    <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 px-3 py-3 border-t border-slate-800/80">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.username || 'Admin'}</p>
            <p className="text-slate-500 text-[10px]">Sistem Yöneticisi</p>
          </div>
          <button
            onClick={handleLogout}
            title="Çıkış Yap"
            className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — Desktop always visible, Mobile drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 lg:relative lg:flex lg:w-56 shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* Right side */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 lg:px-6 bg-slate-950 border-b border-slate-800/80 gap-4">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <nav className="hidden lg:flex items-center gap-1 text-sm min-w-0">
              <Link href="/admin">
                <span className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">Yönetim</span>
              </Link>
              {currentPage && location !== '/admin' && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                  <span className="text-slate-200 font-medium truncate">{currentPage.name}</span>
                </>
              )}
            </nav>

            {/* Mobile page title */}
            <span className="lg:hidden text-white font-semibold text-base truncate">{title}</span>
          </div>

          {/* Right — page title on desktop + user pill */}
          <div className="flex items-center gap-3 shrink-0">
            <h1 className="hidden lg:block text-slate-200 font-semibold text-sm">{title}</h1>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <span className="text-slate-300 text-xs">{user?.username || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
