import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Zap, ShoppingCart, Heart, Wifi, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import { useRef } from "react";
import type { Plan, FavoritePlan } from "@shared/schema";

type PlanWithStock = Plan & {
  availableStock: number;
  inStock: boolean;
};

const TIER_STYLES = [
  {
    gradient: 'from-blue-600/20 via-blue-500/10 to-transparent',
    accent: 'from-blue-500 to-cyan-400',
    glow: 'hover:shadow-blue-500/20',
    border: 'hover:border-blue-500/40',
    badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    dot: 'bg-blue-400',
  },
  {
    gradient: 'from-cyan-600/20 via-cyan-500/10 to-transparent',
    accent: 'from-cyan-500 to-teal-400',
    glow: 'hover:shadow-cyan-500/20',
    border: 'hover:border-cyan-500/40',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    dot: 'bg-cyan-400',
  },
  {
    gradient: 'from-violet-600/20 via-violet-500/10 to-transparent',
    accent: 'from-violet-500 to-purple-400',
    glow: 'hover:shadow-violet-500/20',
    border: 'hover:border-violet-500/40',
    badge: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    dot: 'bg-violet-400',
  },
  {
    gradient: 'from-emerald-600/20 via-emerald-500/10 to-transparent',
    accent: 'from-emerald-500 to-green-400',
    glow: 'hover:shadow-emerald-500/20',
    border: 'hover:border-emerald-500/40',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  {
    gradient: 'from-orange-600/20 via-orange-500/10 to-transparent',
    accent: 'from-orange-500 to-amber-400',
    glow: 'hover:shadow-orange-500/20',
    border: 'hover:border-orange-500/40',
    badge: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    dot: 'bg-orange-400',
  },
  {
    gradient: 'from-pink-600/20 via-pink-500/10 to-transparent',
    accent: 'from-pink-500 to-rose-400',
    glow: 'hover:shadow-pink-500/20',
    border: 'hover:border-pink-500/40',
    badge: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
    dot: 'bg-pink-400',
  },
];

export default function Paketler() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { data: userShipPlans, isLoading: plansLoading } = useQuery<PlanWithStock[]>({
    queryKey: ["/api/user/ship-plans"],
    enabled: !!user?.ship_id
  });

  const { data: favorites } = useQuery<(FavoritePlan & { plan: Plan })[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user
  });

  const favoriteIds = new Set(favorites?.map(f => f.planId) || []);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ planId, isFavorite }: { planId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await apiRequest('DELETE', `/api/favorites/${planId}`);
      } else {
        await apiRequest('POST', `/api/favorites/${planId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: () => {
      toast({ title: t.packages.error, description: t.packages.favoriteError || "Favori işlemi başarısız", variant: "destructive" });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/cart', { planId, quantity: 1 });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t.packages.addedToCart, description: t.packages.addedToCartDesc });
      window.location.href = '/sepet';
    },
    onError: (error: any) => {
      toast({ title: t.packages.error, description: error.message || "Sepete eklenemedi", variant: "destructive" });
    },
  });

  const sortedPlans = userShipPlans?.slice().sort((a, b) => a.dataLimitGb - b.dataLimitGb);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <UserNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/giris';
    return null;
  }

  return (
    <div className="min-h-screen bg-[#080c14]">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-600/5 blur-[120px]" />
      </div>

      <UserNavigation />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-4">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400 text-xs font-medium tracking-wider uppercase">Starlink Maritime</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {t.packages.dataPackages}
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Geminize özel internet paketleri. Ay sonuna kadar geçerli, kesintisiz bağlantı.
          </p>
        </div>

        {/* ── Quick Access Pill Buttons ── */}
        {sortedPlans && sortedPlans.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {sortedPlans.map((plan, i) => {
              const style = TIER_STYLES[i % TIER_STYLES.length];
              return (
                <button
                  key={`q-${plan.id}`}
                  onClick={() => {
                    cardRefs.current[plan.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white/5 ${style.border} hover:bg-white/10 transition-all duration-200 text-sm font-medium text-white/80 hover:text-white`}
                  data-testid={`quick-access-${plan.dataLimitGb}gb`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {plan.dataLimitGb} GB
                </button>
              );
            })}
          </div>
        )}

        {/* ── Plans Grid ── */}
        {plansLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
            <span className="ml-3 text-slate-400 text-sm">{t.packages.loadingPackages}</span>
          </div>
        ) : sortedPlans?.length ? (
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {sortedPlans.map((plan, i) => {
              const style = TIER_STYLES[i % TIER_STYLES.length];
              const isFav = favoriteIds.has(plan.id);
              const isLoading = addToCartMutation.isPending;

              return (
                <div
                  key={plan.id}
                  ref={(el) => { cardRefs.current[plan.id] = el; }}
                  className={`group relative flex flex-col bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl ${style.glow} ${style.border} hover:-translate-y-1`}
                  data-testid={`plan-card-${plan.id}`}
                >
                  {/* Gradient top glow */}
                  <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r ${style.accent} opacity-60`} />
                  <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${style.gradient} opacity-60`} />

                  {/* Favorite button */}
                  <button
                    onClick={() => toggleFavoriteMutation.mutate({ planId: plan.id, isFavorite: isFav })}
                    className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    data-testid={`button-favorite-${plan.id}`}
                  >
                    <Heart className={`w-4 h-4 transition-all duration-300 ${isFav ? 'fill-red-500 text-red-500' : 'text-white/30 hover:text-red-400'}`} />
                  </button>

                  <div className="relative z-10 p-5 flex flex-col flex-1">
                    {/* Plan name */}
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">{plan.name}</p>

                    {/* GB hero number */}
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-6xl font-black bg-gradient-to-r ${style.accent} bg-clip-text text-transparent leading-none`}>
                        {plan.dataLimitGb}
                      </span>
                      <span className="text-2xl font-bold text-white/60 ml-1">GB</span>
                    </div>

                    {/* Plan description or default */}
                    <p className="text-xs text-white/35 mb-5 min-h-[16px]">
                      {plan.description || t.packages.highSpeedData}
                    </p>

                    {/* Features mini-list */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0 text-white/30" />
                        <span>{t.packages.monthEndValidity}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Zap className="w-3.5 h-3.5 flex-shrink-0 text-white/30" />
                        <span>{t.packages.starlinkTech}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Shield className="w-3.5 h-3.5 flex-shrink-0 text-white/30" />
                        <span>Anlık aktivasyon</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/[0.06] mb-4" />

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-2xl font-bold text-white">
                          ${Number(plan.priceUsd).toFixed(2)}
                        </span>
                        <span className="text-xs text-white/30 ml-1">USD</span>
                      </div>

                      <button
                        onClick={() => addToCartMutation.mutate(plan.id)}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 bg-gradient-to-r ${style.accent} hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                        data-testid={`button-buy-${plan.id}`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            <span>{t.packages.addToCart}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
              <Wifi className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t.packages.noPackagesTitle}</h3>
            <p className="text-slate-400 text-sm mb-1">{t.packages.noPackagesDesc}</p>
            <p className="text-slate-500 text-xs">{t.packages.contactAdmin}</p>
          </div>
        )}

        {/* ── Bottom Feature Strip ── */}
        {sortedPlans && sortedPlans.length > 0 && (
          <div className="mt-12 grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: t.packages.highSpeedTitle, sub: t.packages.highSpeedDesc },
              { icon: Shield, label: t.packages.flexiblePackagesTitle, sub: t.packages.flexiblePackagesDesc },
              { icon: Wifi, label: t.packages.shipSpecificTitle, sub: t.packages.shipSpecificDesc },
            ].map(({ icon: Icon, label, sub }, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Icon className="w-5 h-5 text-white/30 mb-2" />
                <p className="text-white/60 text-xs font-medium mb-1">{label}</p>
                <p className="text-white/25 text-xs leading-relaxed hidden sm:block">{sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
