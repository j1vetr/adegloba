import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Zap, Calendar, DollarSign, Ship as ShipIcon, ArrowRight, X, Info, ChevronRight, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import { LoyaltyProgress } from "@/components/LoyaltyProgress";
import { useRef } from "react";
import type { Plan, FavoritePlan } from "@shared/schema";

// Extended plan type with stock information
type PlanWithStock = Plan & {
  availableStock: number;
  inStock: boolean;
};

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
      toast({
        title: t.packages.error,
        description: t.packages.favoriteError || "Favori işlemi başarısız",
        variant: "destructive",
      });
    },
  });

  const scrollToPackage = (planId: string) => {
    const element = cardRefs.current[planId];
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      });
      element.classList.add('ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-slate-900');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-slate-900');
      }, 2000);
    }
  };

  const sortedPlans = userShipPlans?.slice().sort((a, b) => a.dataLimitGb - b.dataLimitGb);

  const addToCartMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/cart', {
        planId: planId,
        quantity: 1
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.packages.addedToCart,
        description: t.packages.addedToCartDesc,
      });
      window.location.href = '/sepet';
    },
    onError: (error: any) => {
      // Parse error response for stock-related errors
      const errorMessage = error.message || "Sepete eklenemedi";
      
      toast({
        title: t.packages.error,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

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

  const formatPrice = (price: string | number) => {
    return `$${Number(price).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="relative">
              <Package className="h-8 w-8 text-blue-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t.packages.dataPackages}
            </span>
          </div>
        </div>

        {/* Monthly Loyalty Progress */}
        <div className="mb-8 max-w-xl mx-auto">
          <LoyaltyProgress />
        </div>

        {/* Quick Access GB Buttons */}
        {sortedPlans && sortedPlans.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-slate-400 font-medium">Hızlı Erişim</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {sortedPlans.map((plan) => (
                <button
                  key={`quick-${plan.id}`}
                  onClick={() => scrollToPackage(plan.id)}
                  className="group relative px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5"
                  data-testid={`quick-access-${plan.dataLimitGb}gb`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {plan.dataLimitGb}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                      GB
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 group-hover:text-slate-400 mt-0.5">
                    ${Number(plan.priceUsd).toFixed(0)}
                  </div>
                  <ChevronRight className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Packages Grid */}
        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-3 text-slate-300">{t.packages.loadingPackages}</span>
          </div>
        ) : userShipPlans?.length ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {userShipPlans.map((plan) => (
              <Card 
                key={plan.id}
                ref={(el) => { cardRefs.current[plan.id] = el; }}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2"
                data-testid={`plan-card-${plan.id}`}
              >
                {/* Glowing Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/20 to-cyan-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative z-10 text-center pb-4">
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteMutation.mutate({ 
                        planId: plan.id, 
                        isFavorite: favoriteIds.has(plan.id) 
                      });
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full transition-all duration-300 hover:scale-110 z-20"
                    data-testid={`button-favorite-${plan.id}`}
                  >
                    <Heart 
                      className={`h-5 w-5 transition-all duration-300 ${
                        favoriteIds.has(plan.id)
                          ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                          : 'text-slate-400 hover:text-red-400'
                      }`} 
                    />
                  </button>

                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <Package className="h-12 w-12 transition-colors duration-300 text-blue-400 group-hover:text-cyan-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold mb-3 transition-colors duration-300 text-white group-hover:text-blue-300">
                    {plan.name}
                  </CardTitle>
                  
                  {/* GB Display - More Prominent */}
                  <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-4 mb-4 border border-blue-500/30">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-white">{plan.dataLimitGb}</span>
                        <span className="text-2xl text-blue-400 font-semibold">GB</span>
                      </div>
                      <p className="text-blue-300 text-sm mt-1 font-medium">{t.packages.highSpeedData}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 space-y-4">
                  {/* Availability Status - Always Available */}
                  <div className="text-center mb-3">
                    <div className="inline-flex items-center px-3 py-1 bg-green-600/20 rounded-full border border-green-500/30">
                      <Package className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm font-medium text-green-400">
                        {t.packages.available}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full border bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30">
                      <DollarSign className="h-5 w-5 mr-1 text-blue-400" />
                      <span className="text-2xl font-bold text-white">{formatPrice(plan.priceUsd)}</span>
                    </div>
                  </div>

                  {/* Features - More Detailed */}
                  <div className="space-y-3 text-sm">
                    {/* Data Limit Feature */}
                    <div className="flex items-center rounded-lg p-3 text-slate-300 bg-slate-800/50">
                      <Package className="h-4 w-4 mr-2 flex-shrink-0 text-blue-400" />
                      <div>
                        <span className="font-medium text-white">{plan.dataLimitGb} GB {t.packages.internetData}</span>
                        <p className="text-xs text-slate-400 mt-1">{t.packages.internetDataDesc}</p>
                      </div>
                    </div>
                    
                    {/* Validity Feature */}
                    <div className="flex items-center rounded-lg p-3 text-slate-300 bg-slate-800/50">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0 text-green-400" />
                      <div>
                        <span className="font-medium text-white">{t.packages.monthEndValidity}</span>
                        <p className="text-xs text-slate-400 mt-1">{t.packages.monthEndValidityDesc}</p>
                      </div>
                    </div>
                    
                    {/* Speed Feature */}
                    <div className="flex items-center rounded-lg p-3 text-slate-300 bg-slate-800/50">
                      <Zap className="h-4 w-4 mr-2 flex-shrink-0 text-yellow-400" />
                      <div>
                        <span className="font-medium text-white">{t.packages.starlinkTech}</span>
                        <p className="text-xs text-slate-400 mt-1">{t.packages.starlinkTechDesc}</p>
                      </div>
                    </div>
                    
                    {plan.description && (
                      <div className="flex items-center rounded-lg p-3 text-slate-300 bg-slate-800/50">
                        <Info className="h-4 w-4 mr-2 flex-shrink-0 text-cyan-400" />
                        <span>{plan.description}</span>
                      </div>
                    )}
                  </div>

                  {/* Purchase Button */}
                  <Button
                    onClick={() => addToCartMutation.mutate(plan.id)}
                    disabled={addToCartMutation.isPending}
                    className="w-full font-semibold py-3 rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/30"
                    data-testid={`button-buy-${plan.id}`}
                  >
                    {addToCartMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.packages.adding}
                      </>
                    ) : (
                      <>
                        {t.packages.addToCart}
                        <Package className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </Button>

                </CardContent>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent transform -skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-slate-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-4">
              {t.packages.noPackagesTitle}
            </h3>
            <p className="text-slate-400 mb-6">
              {t.packages.noPackagesDesc}
            </p>
            <p className="text-sm text-slate-500">
              {t.packages.contactAdmin}
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Card className="bg-slate-900/50 border-slate-700/50 text-center p-6">
            <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">{t.packages.highSpeedTitle}</h3>
            <p className="text-slate-400 text-sm">
              {t.packages.highSpeedDesc}
            </p>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-700/50 text-center p-6">
            <Package className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">{t.packages.flexiblePackagesTitle}</h3>
            <p className="text-slate-400 text-sm">
              {t.packages.flexiblePackagesDesc}
            </p>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-700/50 text-center p-6">
            <ShipIcon className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">{t.packages.shipSpecificTitle}</h3>
            <p className="text-slate-400 text-sm">
              {t.packages.shipSpecificDesc}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}