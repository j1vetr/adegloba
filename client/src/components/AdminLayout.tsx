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
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navigation = [
  { name: 'Panel', href: '/admin', icon: LayoutDashboard },
  { name: 'Gemiler', href: '/admin/ships', icon: Ship },
  { name: 'Paketler', href: '/admin/plans', icon: Package },
  { name: 'Kuponlar', href: '/admin/coupons', icon: Gift },
  { name: 'Siparişler', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Kullanıcılar', href: '/admin/users', icon: Users },
  { name: 'Ayarlar', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const breadcrumbItems = () => {
    const pathSegments = location.split('/').filter(Boolean);
    const items = [{ name: 'Ana Sayfa', href: '/' }];
    
    if (pathSegments.length > 0) {
      items.push({ name: 'Yönetim', href: '/admin' });
    }
    
    if (pathSegments.length > 1) {
      const currentPage = navigation.find(nav => nav.href === location);
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
    <div className="min-h-screen bg-background">
      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        glass
      `}>
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-neon flex items-center justify-center neon-glow">
                <span className="text-white font-bold text-sm">AG</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground neon-text">AdeGloba</h1>
                <p className="text-xs text-light-gray">Starlink System</p>
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
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary border-l-3 border-primary active-item neon-glow' 
                      : 'text-white hover:text-primary hover:bg-accent/10'
                    }
                  `}>
                    <Icon className={`
                      mr-3 h-5 w-5 flex-shrink-0 transition-all duration-200
                      ${isActive ? 'text-primary animate-glow-pulse' : 'group-hover:text-foreground'}
                    `} />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-border p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-neon flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.username || 'Admin'}
                </p>
                <p className="text-xs text-light-gray">Sistem Yöneticisi</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white hover:text-primary hover:bg-accent/10"
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
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-border glass">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2 hover:bg-accent/10"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm">
                {breadcrumbItems().map((item, index) => (
                  <div key={item.href} className="flex items-center space-x-2">
                    {index > 0 && <ChevronRight className="h-4 w-4 text-light-gray" />}
                    <Link href={item.href}>
                      <span className={`
                        transition-colors duration-200 cursor-pointer
                        ${index === breadcrumbItems().length - 1 
                          ? 'text-white font-medium' 
                          : 'text-light-gray hover:text-primary'
                        }
                      `}>
                        {item.name}
                      </span>
                    </Link>
                  </div>
                ))}
              </nav>
            </div>

            {/* Page Title */}
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            </div>

            {/* Right side - could add notifications, profile menu, etc. */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-gradient-neon flex items-center justify-center neon-glow">
                <span className="text-white font-medium text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 animate-slide-up">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}