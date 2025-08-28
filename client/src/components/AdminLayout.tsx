import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Ship, 
  Package, 
  Gift, 
  ShoppingCart, 
  Users, 
  Settings, 
  Menu, 
  X,
  LogOut,
  ChevronRight,
  Home,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  Key,
  Mail,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navigationCategories = [
  {
    name: 'Genel',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    name: 'Operasyon',
    items: [
      { name: 'Gemiler', href: '/admin/ships', icon: Ship },
      { name: 'Paketler', href: '/admin/packages', icon: Package },
      { name: 'Kimlik Havuzu', href: '/admin/credential-pools', icon: Key },
      { name: 'Kuponlar', href: '/admin/coupons', icon: Gift },
      { name: 'Siparişler', href: '/admin/orders', icon: ShoppingCart },
    ]
  },
  {
    name: 'Kullanıcı Yönetimi',
    items: [
      { name: 'Kullanıcılar', href: '/admin/users', icon: Users },
    ]
  },
  {
    name: 'Finans',
    items: [
      { name: 'Raporlama', href: '/admin/reports', icon: BarChart3 },
    ]
  },
  {
    name: 'Destek',
    items: [
      { name: 'Destek Talepleri', href: '/admin/tickets', icon: HelpCircle },
    ]
  },
  {
    name: 'Sistem',
    items: [
      { name: 'Site Ayarları', href: '/admin/site-settings', icon: Settings },
      { name: 'Genel Ayarlar', href: '/admin/settings', icon: Settings },
      { name: 'E-Mail Ayarları', href: '/admin/email-settings', icon: Mail },
      { name: 'Sistem Logları', href: '/admin/logs', icon: FileText },
    ]
  }
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [location] = useLocation();
  const { user, isLoading } = useAdminAuth();
  const { toast } = useToast();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      window.location.href = '/admin/login';
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Çıkış yapılırken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const breadcrumbItems = () => {
    const pathSegments = location.split('/').filter(Boolean);
    const items = [{ name: 'Ana Sayfa', href: '/' }];
    
    if (pathSegments.length > 0) {
      items.push({ name: 'Yönetim', href: '/admin' });
    }
    
    if (pathSegments.length > 1) {
      const currentPage = navigationCategories
        .flatMap(category => category.items)
        .find(nav => nav.href === location);
      if (currentPage) {
        items.push({ name: currentPage.name, href: location });
      }
    }
    
    return items;
  };

  const isActivePath = (path: string) => {
    if (path === '/admin') {
      return location === '/admin';
    }
    return location.startsWith(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-3 border-primary border-t-transparent rounded-full neon-glow"></div>
      </div>
    );
  }

  return (
    <div className="admin-dark-theme">
      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 admin-sidebar
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/80 to-cyan-500/80 flex items-center justify-center neon-glow">
                <span className="text-white font-bold text-sm">AG</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AdeGloba</h1>
                <p className="text-xs text-slate-400">Starlink System</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 hover:bg-accent/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
            {navigationCategories.map((category) => (
              <div key={category.name} className="mb-4">
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  {category.name}
                  {collapsedCategories.includes(category.name) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                
                {!collapsedCategories.includes(category.name) && (
                  <div className="mt-1 space-y-1">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isActivePath(item.href);
                      
                      return (
                        <Link key={item.name} href={item.href}>
                          <div 
                            className={`
                              sidebar-item group flex items-center px-4 py-3 mx-2 text-sm font-medium transition-all duration-200 cursor-pointer
                              ${isActive ? 'active text-primary' : 'text-slate-300 hover:text-white'}
                            `}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <Icon className={`
                              mr-3 h-5 w-5 flex-shrink-0 transition-all duration-200
                              ${isActive ? 'text-primary' : 'group-hover:text-primary'}
                            `} />
                            {item.name}
                            {isActive && (
                              <div className="ml-auto w-2 h-2 rounded-full bg-primary neon-glow" />
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-primary/20 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-cyan-500/80 flex items-center justify-center neon-glow">
                <span className="text-white font-medium text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.username || 'Admin'}
                </p>
                <p className="text-xs text-slate-400">Sistem Yöneticisi</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-primary/10 transition-all"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navigation */}
        <header className="sticky top-0 z-30 h-14 lg:h-16 admin-topbar">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-2 lg:gap-4 min-w-0 flex-1">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2 h-8 w-8 text-white hover:bg-primary/10 hover:text-primary flex-shrink-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-4 w-4" />
              </Button>

              {/* Page Title for Mobile */}
              <h1 className="lg:hidden text-lg font-semibold text-white truncate">{title}</h1>

              {/* Breadcrumb for Desktop */}
              <nav className="hidden lg:flex items-center space-x-2 text-sm min-w-0">
                {breadcrumbItems().map((item, index) => (
                  <div key={item.href} className="flex items-center space-x-2 min-w-0">
                    {index > 0 && <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />}
                    <Link href={item.href}>
                      <span className={`
                        transition-colors duration-200 cursor-pointer truncate
                        ${index === breadcrumbItems().length - 1 
                          ? 'text-white font-medium' 
                          : 'text-slate-400 hover:text-primary'
                        }
                      `}>
                        {item.name}
                      </span>
                    </Link>
                  </div>
                ))}
              </nav>
            </div>

            {/* Page Title for Desktop */}
            <div className="hidden lg:block flex-shrink-0">
              <h1 className="text-xl font-semibold text-white truncate max-w-[200px]">{title}</h1>
            </div>

            {/* Right side - User info */}
            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
              <div className="hidden md:flex flex-col items-end min-w-0">
                <span className="text-sm font-medium text-white truncate max-w-[100px]">
                  {user?.username || 'Admin'}
                </span>
                <span className="text-xs text-slate-400">Yönetici</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-cyan-500/80 flex items-center justify-center neon-glow flex-shrink-0">
                <span className="text-white font-medium text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}