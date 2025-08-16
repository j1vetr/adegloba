import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Zap, Calendar, DollarSign, Ship as ShipIcon, ArrowRight, X, Sparkles, Globe, Wifi, Shield, Star, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import type { Plan } from "@shared/schema";

// Extended plan type with stock information
type PlanWithStock = Plan & {
  availableCount: number;
  availableStock: number; // For backwards compatibility
  inStock: boolean;
  shipName: string;
  timestamp: string;
};

export default function Paketler() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userShipPlans, isLoading: plansLoading } = useQuery<PlanWithStock[]>({
    queryKey: ["/api/user/ship-plans"],
    enabled: !!user?.ship_id,
    refetchInterval: 30000, // Refetch every 30 seconds to catch stock updates
    staleTime: 0, // Always fresh data, no cache
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true // Always refetch when component mounts
  });

  const addToCartMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/cart', {
        planId: planId,
        quantity: 1
      });
      return response.json();
    },
    onSuccess: () => {
      // Immediately invalidate and refetch plans to update stock
      queryClient.invalidateQueries({ queryKey: ["/api/user/ship-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      
      toast({
        title: "Sepete Eklendi",
        description: "Paket başarıyla sepete eklendi",
      });
      window.location.href = '/sepet';
    },
    onError: (error: any) => {
      // Parse error response for stock-related errors
      const errorMessage = error.message || "Sepete eklenemedi";
      
      toast({
        title: "Hata",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 relative overflow-hidden">
      {/* Background Animation Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-60 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>
      
      <UserNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Enhanced Header with Glassmorphism */}
        <div className="text-center mb-16">
          <div className="relative">
            {/* Main Header Card with Glassmorphism */}
            <div className="relative backdrop-blur-xl bg-gradient-to-r from-slate-900/40 via-blue-900/20 to-slate-900/40 border border-slate-700/50 rounded-3xl p-8 mb-8 shadow-2xl">
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-50" />
              
              <div className="relative z-10">
                {/* Icon Section */}
                <div className="flex items-center justify-center mb-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                    <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-2xl">
                      <Package className="h-12 w-12 text-white" />
                      <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                </div>
                
                
                <h2 className="text-2xl font-semibold text-white mb-6">
                  AdeGloba Starlink System
                </h2>
                
                <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
                  Geminiz için özel olarak tasarlanmış premium Starlink data paketlerini keşfedin.
                  <br />
                  <span className="text-cyan-400 font-medium">Denizde kesintisiz bağlantı, sınırsız imkanlar.</span>
                </p>
                
                {/* Ship Info with Enhanced Styling */}
                <div className="mt-8 inline-flex items-center px-6 py-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-full">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <ShipIcon className="h-6 w-6 text-blue-400" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                    </div>
                    <span className="text-slate-300 font-medium">Aktif Gemi:</span>
                    <span className="text-white font-bold">{userShipPlans?.[0]?.shipName || 'Belirtilmemiş'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Packages Grid */}
        {plansLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-50 animate-pulse" />
              <Loader2 className="relative h-12 w-12 animate-spin text-white" />
            </div>
            <span className="mt-6 text-slate-300 text-lg font-medium">Paketler yükleniyor...</span>
            <span className="mt-2 text-slate-500 text-sm">En güncel fiyatları getiriyoruz</span>
          </div>
        ) : userShipPlans?.length ? (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {userShipPlans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 border border-slate-700/30 hover:border-0 transition-all duration-700 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-3 transform-gpu"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
                data-testid={`plan-card-${plan.id}`}
              >
                {/* Enhanced Gradient Border */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-purple-500/30 to-blue-500/0 opacity-0 group-hover:opacity-60 transition-opacity duration-700 rounded-xl" />
                
                {/* Glassmorphism Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <CardHeader className="relative z-10 text-center pb-6">
                  {/* Enhanced Icon Section */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative group/icon">
                      <div className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 ${
                        plan.inStock 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover/icon:opacity-70' 
                          : 'bg-slate-500/20'
                      }`} />
                      <div className={`relative p-4 rounded-2xl border transition-all duration-500 ${
                        plan.inStock 
                          ? 'bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-blue-500/30 group-hover:border-cyan-400/60' 
                          : 'bg-slate-800/50 border-slate-600/30'
                      }`}>
                        <Package className={`h-12 w-12 transition-all duration-500 ${
                          plan.inStock 
                            ? 'text-blue-400 group-hover:text-cyan-300 group-hover:scale-110' 
                            : 'text-slate-500'
                        }`} />
                        {plan.inStock && (
                          <>
                            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Title */}
                  <CardTitle className={`text-2xl font-bold mb-4 transition-all duration-500 ${
                    plan.inStock 
                      ? 'text-white group-hover:text-cyan-300 group-hover:scale-105' 
                      : 'text-slate-400'
                  }`}>
                    {plan.name}
                  </CardTitle>
                  
                  {/* Enhanced Data Display */}
                  <div className="flex items-center justify-center mb-4">
                    <div className={`relative px-6 py-3 rounded-2xl border transition-all duration-500 ${
                      plan.inStock 
                        ? 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border-blue-400/30 group-hover:border-cyan-400/60' 
                        : 'bg-slate-800/30 border-slate-600/30'
                    }`}>
                      <div className="flex items-baseline">
                        <span className={`text-4xl font-bold transition-colors duration-500 ${
                          plan.inStock ? 'text-white group-hover:text-cyan-300' : 'text-slate-500'
                        }`}>{plan.dataLimitGb}</span>
                        <span className={`text-xl ml-2 transition-colors duration-500 ${
                          plan.inStock ? 'text-slate-300' : 'text-slate-500'
                        }`}>GB</span>
                        {plan.inStock && (
                          <Globe className="ml-3 h-6 w-6 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 space-y-6">
                  {/* Enhanced Stock Info - Show badge only when out of stock */}
                  <div className="text-center">
                    {plan.inStock === false ? (
                      <div className="relative">
                        <div className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-red-900/40 to-pink-900/40 backdrop-blur-sm rounded-2xl border border-red-400/30">
                          <div className="flex items-center space-x-3">
                            <X className="h-5 w-5 text-red-400" />
                            <div className="text-left">
                              <div className="text-red-300 font-bold text-sm">Stok Bitti</div>
                              <div className="text-red-400/70 text-xs">Yakında Gelecek</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group/stock">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-md opacity-0 group-hover/stock:opacity-30 transition-opacity duration-500" />
                        <div className="relative inline-flex items-center px-5 py-3 bg-gradient-to-r from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-2xl border border-green-400/30">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Shield className="h-5 w-5 text-green-400" />
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                            </div>
                            <div className="text-left">
                              <div className="text-green-300 font-bold text-sm">
                                Adet Stokta: {plan.availableCount}
                              </div>
                              <div className="text-green-400/70 text-xs">Anında Teslimat</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Price Display */}
                  <div className="text-center">
                    <div className="relative group/price">
                      <div className={`absolute inset-0 rounded-2xl blur-lg transition-opacity duration-500 ${
                        plan.inStock 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover/price:opacity-40'
                          : 'bg-slate-500/20'
                      }`} />
                      <div className={`relative inline-flex items-center px-6 py-4 rounded-2xl border transition-all duration-500 ${
                        plan.inStock 
                          ? 'bg-gradient-to-r from-blue-900/50 via-purple-900/30 to-cyan-900/50 border-blue-400/30 group-hover/price:border-cyan-400/60 group-hover/price:scale-105'
                          : 'bg-slate-800/30 border-slate-500/30'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-xl transition-colors duration-500 ${
                            plan.inStock 
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-slate-600/20 text-slate-500'
                          }`}>
                            <DollarSign className="h-6 w-6" />
                          </div>
                          <div className="text-left">
                            <div className={`text-3xl font-bold transition-colors duration-500 ${
                              plan.inStock ? 'text-white group-hover/price:text-cyan-300' : 'text-slate-400'
                            }`}>
                              {formatPrice(plan.priceUsd)}
                            </div>
                            <div className={`text-sm transition-colors duration-500 ${
                              plan.inStock ? 'text-slate-300' : 'text-slate-500'
                            }`}>
                              Tek Seferlik Ödeme
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Features */}
                  <div className="space-y-4">
                    {plan.description && (
                      <div className={`relative group/feature overflow-hidden rounded-2xl transition-all duration-500 ${
                        plan.inStock 
                          ? 'bg-gradient-to-r from-slate-800/60 to-slate-700/40 border border-slate-600/30 hover:border-blue-400/30'
                          : 'bg-slate-800/30 border border-slate-700/20'
                      }`}>
                        <div className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-xl flex-shrink-0 transition-colors duration-500 ${
                              plan.inStock 
                                ? 'bg-blue-500/20 text-blue-400 group-hover/feature:bg-cyan-500/20 group-hover/feature:text-cyan-400'
                                : 'bg-slate-600/20 text-slate-500'
                            }`}>
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <span className={`text-sm font-medium transition-colors duration-500 ${
                                plan.inStock ? 'text-slate-200' : 'text-slate-500'
                              }`}>
                                {plan.description}
                              </span>
                            </div>
                          </div>
                        </div>
                        {plan.inStock && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover/feature:opacity-100 transition-opacity duration-500" />
                        )}
                      </div>
                    )}
                    
                    {/* Additional Feature Items */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`flex items-center p-3 rounded-xl transition-all duration-500 ${
                        plan.inStock 
                          ? 'bg-gradient-to-r from-emerald-900/20 to-green-900/20 border border-emerald-400/20'
                          : 'bg-slate-800/20 border border-slate-600/20'
                      }`}>
                        <Wifi className={`h-4 w-4 mr-2 ${
                          plan.inStock ? 'text-emerald-400' : 'text-slate-500'
                        }`} />
                        <span className={`text-xs font-medium ${
                          plan.inStock ? 'text-emerald-300' : 'text-slate-500'
                        }`}>
                          Yüksek Hız
                        </span>
                      </div>
                      <div className={`flex items-center p-3 rounded-xl transition-all duration-500 ${
                        plan.inStock 
                          ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-400/20'
                          : 'bg-slate-800/20 border border-slate-600/20'
                      }`}>
                        <Shield className={`h-4 w-4 mr-2 ${
                          plan.inStock ? 'text-blue-400' : 'text-slate-500'
                        }`} />
                        <span className={`text-xs font-medium ${
                          plan.inStock ? 'text-blue-300' : 'text-slate-500'
                        }`}>
                          Güvenli
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Button with Green/Red Logic */}
                  <div className="relative group/button">
                    {plan.inStock ? (
                      <Button
                        onClick={() => addToCartMutation.mutate(plan.id)}
                        disabled={addToCartMutation.isPending}
                        className="relative w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg animate-pulse transition-all duration-300 transform hover:scale-105"
                        data-testid={`button-buy-${plan.id}`}
                      >
                        <div className="flex items-center justify-center space-x-3">
                          {addToCartMutation.isPending ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span className="text-lg">Ekleniyor...</span>
                            </>
                          ) : (
                            <>
                              <Rocket className="h-5 w-5" />
                              <span className="text-lg">Hemen Satın Al</span>
                            </>
                          )}
                        </div>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="relative w-full bg-red-500 text-white opacity-70 cursor-not-allowed py-4 px-6 rounded-2xl font-semibold"
                        data-testid={`button-buy-${plan.id}`}
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <X className="h-5 w-5" />
                          <span className="text-lg">Stok Bitti</span>
                        </div>
                      </Button>
                    )}
                  </div>

                </CardContent>

                {/* Enhanced Hover Effects */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  {/* Primary Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent transform -skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000" />
                  {/* Secondary Glow */}
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-cyan-500/10 to-transparent transform skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-200" />
                </div>
                
                {/* Corner Accent */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-tl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-cyan-500/20 to-transparent rounded-br-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="relative max-w-lg mx-auto">
              {/* Enhanced Empty State */}
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-slate-700/30 rounded-3xl p-12">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 via-transparent to-slate-500/10 rounded-3xl" />
                
                <div className="relative">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-400 rounded-2xl blur-xl opacity-30" />
                    <div className="relative p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/60 rounded-2xl border border-slate-600/30">
                      <Package className="h-16 w-16 text-slate-400 mx-auto" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Henüz Paket Bulunamadı
                  </h3>
                  <p className="text-slate-300 mb-6 text-lg leading-relaxed">
                    Seçili gemi için henüz aktif paket bulunmamaktadır.
                  </p>
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 rounded-full border border-blue-400/30">
                    <ShipIcon className="h-4 w-4 text-blue-400 mr-2" />
                    <span className="text-blue-300 text-sm font-medium">
                      Lütfen admin ile iletişime geçin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Info Section */}
        <div className="mt-24 mb-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Neden AdeGloba Starlink?
              </span>
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Denizcilik sektörünün öncü teknolojisiyle gemileriniz için en iyisini sunuyoruz
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Yüksek Hız",
                description: "Starlink uydu teknolojisiyle denizde yüksek hızda internet erişimi",
                gradient: "from-yellow-500 to-orange-500",
                bgGradient: "from-yellow-900/20 to-orange-900/20",
                borderGradient: "from-yellow-400/30 to-orange-400/30"
              },
              {
                icon: Package,
                title: "Esnek Paketler",
                description: "İhtiyacınıza göre farklı GB seçenekleri ve geçerlilik süreleri",
                gradient: "from-blue-500 to-cyan-500",
                bgGradient: "from-blue-900/20 to-cyan-900/20",
                borderGradient: "from-blue-400/30 to-cyan-400/30"
              },
              {
                icon: ShipIcon,
                title: "Gemiye Özel",
                description: "Her gemi için özelleştirilmiş paket seçenekleri ve destek",
                gradient: "from-emerald-500 to-teal-500",
                bgGradient: "from-emerald-900/20 to-teal-900/20",
                borderGradient: "from-emerald-400/30 to-teal-400/30"
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title}
                  className={`group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${feature.bgGradient} border border-slate-700/30 hover:border-0 text-center p-8 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2`}
                  style={{
                    animation: `fadeInUp 0.8s ease-out ${(index + 1) * 0.2}s both`
                  }}
                >
                  {/* Enhanced Gradient Border */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl`} />
                  
                  {/* Background Animation */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-60 transition-opacity duration-700`} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="relative group/icon mb-6">
                      <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                      <div className={`relative p-4 bg-gradient-to-br ${feature.bgGradient} border border-gradient-to-r ${feature.borderGradient} rounded-2xl group-hover:scale-110 transition-transform duration-500`}>
                        <Icon className={`h-10 w-10 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`} />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-300 leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000`} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}