import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  HelpCircle, 
  Menu, 
  X,
  LogOut,
  User,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserAuth } from '@/hooks/useUserAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

// Simplified user navigation - only Ana Sayfa and Destek
const userNavigation = [
  { name: 'Ana Sayfa', href: '/dashboard', icon: Home },
  { name: 'Destek', href: '/tickets', icon: HelpCircle },
];

export default function Layout({ children, title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useUserAuth();
  const { toast } = useToast();

  // Get unread ticket count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['/api/user/tickets/unread-count'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/tickets/unread-count');
      return response.json();
    },
    enabled: isAuthenticated
  });

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      window.location.href = '/';
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Çıkış yapılırken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location === '/dashboard' || location === '/';
    }
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-30">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link href="/">
                <div className="flex items-center space-x-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center neon-glow">
                    <span className="text-white font-bold text-sm">AG</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">AdeGloba</h1>
                    <p className="text-xs text-slate-400">Starlink System</p>
                  </div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              {isAuthenticated && (
                <nav className="hidden md:flex space-x-6">
                  {userNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActivePath(item.href);
                    
                    return (
                      <Link key={item.name} href={item.href}>
                        <div className={`
                          flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
                          ${isActive 
                            ? 'text-primary bg-primary/10 border border-primary/20' 
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }
                        `}>
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                          {item.name === 'Destek' && unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Mobile menu button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden text-slate-300 hover:text-white"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>

                  {/* User info */}
                  <div className="hidden md:flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {user?.username}
                      </p>
                      <p className="text-xs text-slate-400">Kullanıcı</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Logout button */}
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="text-slate-300 hover:text-white hidden md:flex"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Çıkış
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                    Giriş Yap
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Mobile sidebar header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">AG</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AdeGloba</h1>
                <p className="text-xs text-slate-400">Starlink System</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-slate-300" />
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isAuthenticated && (
            <nav className="flex-1 space-y-2 p-4">
              {userNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.href);
                
                return (
                  <Link key={item.name} href={item.href}>
                    <div 
                      className={`
                        flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer rounded-lg
                        ${isActive ? 'text-primary bg-primary/10 border border-primary/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'}
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                      {item.name === 'Destek' && unreadCount > 0 && (
                        <Badge className="ml-auto bg-red-500 text-white">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Mobile user section */}
          {isAuthenticated && (
            <div className="border-t border-slate-800 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-slate-400">Kullanıcı</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}