import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Ship, Plan } from "@shared/schema";

export default function ShipPlans() {
  const { slug } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: ship, isLoading: shipLoading } = useQuery<Ship>({
    queryKey: [`/api/ships/${slug}`]
  });

  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: [`/api/ships/${ship?.id}/plans`],
    enabled: !!ship?.id
  });

  const createOrderMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/orders', {
        shipId: ship?.id,
        planId,
      });
      return response.json();
    },
    onSuccess: (order) => {
      toast({
        title: t.shipPlans.orderCreated,
        description: t.shipPlans.orderCreatedDesc,
      });
      window.location.href = `/checkout?orderId=${order.id}`;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t.shipPlans.unauthorized,
          description: t.shipPlans.unauthorizedDesc,
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t.common.error,
        description: (error as Error).message || t.shipPlans.failedToCreateOrder,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: t.shipPlans.authRequired,
        description: t.shipPlans.authRequiredDesc,
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading || shipLoading || plansLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan"></div>
        </div>
      </Layout>
    );
  }

  if (!ship) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">{t.shipPlans.shipNotFound}</h1>
          <p className="text-slate-400 mb-8">{t.shipPlans.shipNotFoundDesc}</p>
          <Button onClick={() => window.history.back()}>{t.shipPlans.goBack}</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Ship Header */}
      <section className="py-12 bg-gradient-to-r from-space-blue/50 to-space-dark/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {ship.imageUrl && (
              <img 
                src={ship.imageUrl} 
                alt={ship.name} 
                className="w-full md:w-64 h-48 object-cover rounded-xl"
                data-testid="ship-image"
              />
            )}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent" data-testid="ship-name">
                {ship.name}
              </h1>
              <p className="text-xl text-slate-300 mb-4" data-testid="ship-description">
                {ship.description || t.shipPlans.defaultShipDesc}
              </p>
              <Badge className="bg-neon-green/20 text-neon-green border-transparent" data-testid="ship-status">
                <i className="fas fa-circle mr-1 text-xs"></i>{t.shipPlans.active}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Data Plans */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              {t.shipPlans.dataPackagesFor} {ship.name}
            </h2>
            <p className="text-xl text-slate-300">{t.shipPlans.chooseDataPlan}</p>
          </div>

          {plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {plans.map((plan, index) => {
                const isPopular = index === 1;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`glassmorphism rounded-2xl p-6 hover:scale-105 transition-all ${
                      isPopular ? 'border-2 border-neon-purple relative' : 'border-2 border-transparent hover:border-neon-cyan/50'
                    }`}
                    data-testid={`plan-card-${plan.id}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-neon-purple to-neon-cyan text-white px-4 py-1 rounded-full text-sm font-semibold">
                          {t.shipPlans.mostPopular}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${
                        isPopular ? 'from-purple-500 to-pink-500' :
                        index === 0 ? 'from-blue-500 to-cyan-500' :
                        index === 2 ? 'from-green-500 to-emerald-500' :
                        'from-slate-500 to-slate-600'
                      } flex items-center justify-center`}>
                        <i className={`fas ${
                          isPopular ? 'fa-rocket' :
                          index === 0 ? 'fa-wifi' :
                          index === 2 ? 'fa-crown' :
                          'fa-cog'
                        } text-white text-2xl`}></i>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2" data-testid={`plan-title-${plan.id}`}>
                        {plan.title}
                      </h3>
                      <div className="text-4xl font-bold text-neon-cyan mb-2" data-testid={`plan-price-${plan.id}`}>
                        ${Number(plan.priceUsd).toFixed(0)}
                      </div>
                      <div className="text-slate-400">{t.shipPlans.perMonth}</div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center">
                        <i className="fas fa-check text-neon-green mr-3"></i>
                        <span data-testid={`plan-data-${plan.id}`}>{plan.gbAmount} {t.shipPlans.dataAllowance}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-check text-neon-green mr-3"></i>
                        <span data-testid={`plan-speed-${plan.id}`}>{plan.speedNote || t.shipPlans.highSpeed}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-check text-neon-green mr-3"></i>
                        <span data-testid={`plan-validity-${plan.id}`}>{plan.validityNote || t.shipPlans.monthlyRenewal}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-check text-neon-green mr-3"></i>
                        {t.shipPlans.support247}
                      </div>
                    </div>
                    
                    <Button 
                      className={`w-full py-3 rounded-xl transition-all ${
                        isPopular 
                          ? 'bg-gradient-to-r from-neon-purple to-neon-cyan text-white hover:shadow-lg hover:shadow-neon-purple/25' 
                          : 'glassmorphism hover:bg-neon-cyan/20 border border-neon-cyan/30'
                      }`}
                      onClick={() => createOrderMutation.mutate(plan.id)}
                      disabled={createOrderMutation.isPending}
                      data-testid={`add-to-cart-${plan.id}`}
                    >
                      {createOrderMutation.isPending ? t.shipPlans.creatingOrder : t.shipPlans.selectPlan}
                    </Button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-wifi text-6xl text-slate-500 mb-4"></i>
              <h3 className="text-xl font-semibold text-slate-400 mb-2">{t.shipPlans.noDataPlans}</h3>
              <p className="text-slate-500 mb-6">{t.shipPlans.noDataPlansDesc}</p>
              <Button onClick={() => window.history.back()}>{t.shipPlans.goBack}</Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
