import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Home, Package, ShoppingCart, HeadphonesIcon, User,
  ChevronLeft, Bell,
} from "lucide-react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { LanguageSelector } from "@/contexts/LanguageContext";
import adeGlobaLogo from "@assets/adegloba-1_1756252463127.png";

interface UserShellProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backTo?: string;
  rightSlot?: ReactNode;
  hideBottomNav?: boolean;
  hideHeader?: boolean;
  noPadding?: boolean;
}

interface CartItem { id: string; quantity: number; }
interface CartResponse { items: CartItem[]; itemCount: number; subtotal: number; total: number; }

export default function UserShell({
  children, title, showBack = false, backTo, rightSlot,
  hideBottomNav = false, hideHeader = false, noPadding = false,
}: UserShellProps) {
  const [location, setLocation] = useLocation();
  const { user } = useUserAuth();

  const { data: cart } = useQuery<CartResponse>({
    queryKey: ["/api/cart"],
    enabled: !!user,
    refetchInterval: 30000,
  });
  const cartCount = typeof cart?.itemCount === "number"
    ? cart.itemCount
    : (Array.isArray(cart?.items) ? cart!.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0);

  // Lock html background to light for user pages
  useEffect(() => {
    document.documentElement.style.background = "#F7F8FA";
    return () => { document.documentElement.style.background = ""; };
  }, []);

  const goBack = () => {
    if (backTo) setLocation(backTo);
    else if (window.history.length > 1) window.history.back();
    else setLocation("/panel");
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 flex flex-col">
      {!hideHeader && (
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/70">
          <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-3">
            {showBack ? (
              <button
                onClick={goBack}
                className="-ml-2 p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition"
                data-testid="button-header-back"
                aria-label="Geri"
              >
                <ChevronLeft className="h-5 w-5 text-slate-700" />
              </button>
            ) : (
              <Link href="/panel">
                <img src={adeGlobaLogo} alt="AdeGloba" className="h-7 w-auto cursor-pointer" />
              </Link>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-base font-semibold text-slate-900 truncate" data-testid="text-page-title">
                  {title}
                </h1>
              )}
            </div>
            {rightSlot}
            <LanguageSelectorLight />
          </div>
        </header>
      )}

      <main className={`flex-1 mx-auto w-full max-w-3xl ${noPadding ? "" : "px-4 py-4"} ${hideBottomNav ? "" : "pb-bottom-nav"}`}>
        {children}
      </main>

      {!hideBottomNav && <BottomNav location={location} cartCount={cartCount} />}
    </div>
  );
}

function BottomNav({ location, cartCount }: { location: string; cartCount: number }) {
  const tabs = [
    { id: "panel",    href: "/panel",    label: "Ana Sayfa", icon: Home,            match: ["/panel"] },
    { id: "paketler", href: "/paketler", label: "Paketler",  icon: Package,         match: ["/paketler"] },
    { id: "sepet",    href: "/sepet",    label: "Sepet",     icon: ShoppingCart,    match: ["/sepet", "/checkout"], center: true, badge: cartCount },
    { id: "destek",   href: "/destek",   label: "Destek",    icon: HeadphonesIcon,  match: ["/destek"] },
    { id: "profil",   href: "/profil",   label: "Profil",    icon: User,            match: ["/profil", "/kilavuz"] },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200/70 bottom-nav-safe">
      <div className="mx-auto max-w-3xl px-2 h-[68px] grid grid-cols-5">
        {tabs.map((t) => {
          const active = t.match.some((m) => location === m || location.startsWith(m + "/"));
          const Icon = t.icon;

          if (t.center) {
            return (
              <Link key={t.id} href={t.href}>
                <a
                  className="flex flex-col items-center justify-center gap-0.5 relative -mt-5"
                  data-testid={`nav-${t.id}`}
                >
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-md transition active:scale-95 ${
                    active
                      ? "bg-[#FFDD57] text-slate-900"
                      : "bg-[#FFDD57] text-slate-900 hover:brightness-105"
                  }`}>
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                    {t.badge && t.badge > 0 ? (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
                        {t.badge > 9 ? "9+" : t.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className={`text-[10px] font-medium mt-1 ${active ? "text-slate-900" : "text-slate-500"}`}>
                    {t.label}
                  </span>
                </a>
              </Link>
            );
          }

          return (
            <Link key={t.id} href={t.href}>
              <a
                className="flex flex-col items-center justify-center gap-1 transition active:scale-95"
                data-testid={`nav-${t.id}`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-slate-900" : "text-slate-400"}`}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span className={`text-[11px] ${active ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
                  {t.label}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function LanguageSelectorLight() {
  return (
    <div className="theme-light-language">
      <LanguageSelector />
    </div>
  );
}
