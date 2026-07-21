import { useState, useEffect, useRef, ReactNode } from 'react';
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
      { name: 'Gemiler',       href: '/admin/ships',            icon: Ship,         desc: 'Gemi Kaydı Ve Yönetimi'      },
      { name: 'Paketler',      href: '/admin/packages',         icon: Package,      desc: 'Veri Paketi Tanımları'        },
      { name: 'Kimlik Havuzu', href: '/admin/credential-pools', icon: Key,          desc: 'Kullanıcı Adı/Şifre Havuzu'  },
      { name: 'Kuponlar',      href: '/admin/coupons',          icon: Gift,         desc: 'İndirim Kuponu Yönetimi'      },
      { name: 'Siparişler',    href: '/admin/orders',           icon: ShoppingCart, desc: 'Sipariş Takibi Ve Yönetimi'  },
      { name: 'Stok Yönetimi', href: '/admin/stock-management', icon: PackageCheck, desc: 'Paket Stok Durumu'            },
    ],
  },
  {
    id: 'kullanicilar', label: 'Kullanıcılar',
    items: [
      { name: 'Kullanıcılar',     href: '/admin/users',   icon: Users,      desc: 'Üye Listesi Ve Profiller'    },
      { name: 'Destek Talepleri', href: '/admin/tickets', icon: HelpCircle, desc: 'Açık Destek Taleplerini Gör' },
    ],
  },
  {
    id: 'raporlar', label: 'Raporlar',
    items: [
      { name: 'Raporlama',      href: '/admin/reports',           icon: BarChart3,  desc: 'Satış Ve Gelir Raporları'        },
      { name: 'Gemi Analitik',  href: '/admin/ship-analytics',    icon: TrendingUp, desc: 'Gemi Bazlı Kullanım Analizi'    },
      { name: 'Mali Raporlar',  href: '/admin/financial-reports', icon: DollarSign, desc: 'Detaylı Mali Tablolar'           },
      { name: 'E-posta Raporu', href: '/admin/admin-reporting',   icon: Mail,       desc: 'E-Posta Gönderim İstatistikleri'},
    ],
  },
  {
    id: 'iletisim', label: 'İletişim',
    items: [
      { name: 'Push Bildirimleri', href: '/admin/push-notifications', icon: Bell, desc: 'Anlık Bildirim Gönder'       },
      { name: 'E-posta Pazarlama', href: '/admin/email-marketing',    icon: Send, desc: 'Toplu E-Posta Kampanyaları'  },
    ],
  },
  {
    id: 'sistem', label: 'Sistem',
    items: [
      { name: 'Site Ayarları',    href: '/admin/site-settings',   icon: Globe,      desc: 'Genel Site Yapılandırması'  },
      { name: 'E-posta Ayarları', href: '/admin/email-settings',  icon: Mail,       desc: 'SMTP Ve Şablon Ayarları'    },
      { name: 'Genel Ayarlar',    href: '/admin/settings',        icon: Settings,   desc: 'Sistem Geneli Ayarlar'      },
      { name: 'DB Yedekleme',     href: '/admin/database-backup', icon: Database,   desc: 'Veritabanı Yedek Al'        },
      { name: 'Sistem Logları',   href: '/admin/logs',            icon: FileText,   desc: 'Sunucu Log Kayıtları'       },
      { name: 'Ödeme Olayları',   href: '/admin/payment-events',  icon: CreditCard, desc: 'PayPal İşlem Geçmişi'       },
    ],
  },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isLoading } = useAdminAuth();
  const { toast } = useToast();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setOpenMenu(null); setMobileOpen(false); }, [location]);

  const openGroup = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(id);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/admin/logout');
      window.location.href = '/login';
    } catch {
      toast({ title: 'Hata', description: 'Çıkış yapılırken bir hata oluştu.', variant: 'destructive' });
    }
  };

  const isActive    = (href: string) => href === '/admin' ? location === '/admin' : location.startsWith(href);
  const groupActive = (g: typeof NAV_GROUPS[0]) => g.items.some(i => isActive(i.href));
  const activeGroup = NAV_GROUPS.find(g => g.id === openMenu) ?? null;

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <img src={adeGlobaLogo} alt="AdeGloba" className="h-14 opacity-50 animate-pulse" />
        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">

      {/* ════════════ NAVBAR ════════════ */}
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800">
        <div className="max-w-screen-xl mx-auto flex items-center h-[80px] px-4 lg:px-8">

          {/* Logo */}
          <Link href="/admin">
            <img
              src={adeGlobaLogo}
              alt="AdeGloba"
              className="h-[60px] w-auto object-contain cursor-pointer shrink-0"
            />
          </Link>

          {/* Desktop nav — solda */}
          <nav
            className="hidden lg:flex items-center gap-0.5 ml-6"
            onMouseLeave={scheduleClose}
          >
            <Link href="/admin">
              <div
                onMouseEnter={() => { cancelClose(); setOpenMenu(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  location === '/admin'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </div>
            </Link>

            {NAV_GROUPS.map(group => {
              const open   = openMenu === group.id;
              const active = groupActive(group);
              return (
                <button
                  key={group.id}
                  type="button"
                  onMouseEnter={() => openGroup(group.id)}
                  onClick={() => setOpenMenu(open ? null : group.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active || open
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {group.label}
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>
              );
            })}
          </nav>

          {/* Sağ: kullanıcı + çıkış */}
          <div className="hidden lg:flex items-center gap-3 ml-auto shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <span className="text-slate-300 text-sm">{user?.username || 'Admin'}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 border border-slate-800 hover:border-red-400/20 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              Çıkış Yap
            </button>
          </div>

          {/* Mobil sağ */}
          <div className="lg:hidden ml-auto flex items-center gap-2">
            <span className="text-slate-500 text-sm hidden sm:block">{user?.username || 'Admin'}</span>
            <button
              type="button"
              onClick={() => setMobileOpen(p => !p)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ════════════ MEGA MENÜ PANELİ ════════════ */}
      {activeGroup && (
        <div
          className="fixed top-[80px] left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 shadow-2xl shadow-black/60"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="max-w-screen-xl mx-auto px-8 py-5">
            {/* Grup başlığı */}
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-3">
              {activeGroup.label}
            </p>
            {/* Öğeler — 2, 3 veya 4 sütun (öğe sayısına göre) */}
            <div className={`grid gap-1 ${
              activeGroup.items.length <= 2 ? 'grid-cols-2' :
              activeGroup.items.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
              'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
            }`}>
              {activeGroup.items.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`group flex flex-col gap-2 p-3.5 rounded-xl cursor-pointer transition-all border ${
                      active
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800/50 border-transparent hover:bg-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        active ? 'bg-cyan-500/20' : 'bg-slate-700/60 group-hover:bg-slate-700'
                      }`}>
                        <Icon className={`h-4 w-4 ${active ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{item.name}</p>
                        <p className={`text-[11px] mt-0.5 leading-tight ${active ? 'text-cyan-400/70' : 'text-slate-600 group-hover:text-slate-500'}`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ MOBİL MENÜ ════════════ */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[80px] bg-slate-950 z-40 overflow-y-auto">
          <div className="p-4 pb-8 space-y-1">
            <Link href="/admin">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer ${
                location === '/admin' ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
              }`}>
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                Dashboard
              </div>
            </Link>

            {NAV_GROUPS.map(group => (
              <div key={group.id} className="pt-3">
                <p className="px-4 pb-1 text-[10px] font-bold tracking-widest uppercase text-slate-600">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link key={item.href} href={item.href}>
                        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm cursor-pointer transition-colors ${
                          active ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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

            <div className="pt-4 border-t border-slate-800 mt-2">
              <button
                type="button"
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

      {/* ════════════ İÇERİK ════════════ */}
      <main>
        <div className="max-w-screen-xl mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>

    </div>
  );
}
