import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Ship } from "@shared/schema";

export default function Landing() {
  const { data: ships, isLoading } = useQuery<Ship[]>({
    queryKey: ["/api/ships"]
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Stellar background with animated particles */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-neon-purple rounded-full animate-ping"></div>
          <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-neon-cyan via-white to-neon-purple bg-clip-text text-transparent">
              Satellite Internet
              <br />for Maritime
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-slate-300 max-w-3xl mx-auto">
              Connect your fleet with high-speed Starlink data packages. Reliable internet coverage across all oceans.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold hover:shadow-xl hover:shadow-neon-cyan/25 transition-all transform hover:scale-105"
                onClick={() => document.getElementById('ships')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="select-ship-button"
              >
                <i className="fas fa-ship mr-2"></i>
                Select Your Ship
              </Button>
              <Button 
                variant="ghost"
                className="px-8 py-4 rounded-xl glassmorphism hover:bg-space-card transition-all"
                data-testid="view-demo-button"
              >
                <i className="fas fa-play mr-2"></i>
                View Demo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Card className="glassmorphism rounded-xl p-6 hover:scale-105 transition-transform border-transparent" data-testid="stat-uptime">
              <div className="text-3xl font-bold text-neon-cyan mb-2">99.9%</div>
              <div className="text-slate-300">Uptime Reliability</div>
            </Card>
            <Card className="glassmorphism rounded-xl p-6 hover:scale-105 transition-transform border-transparent" data-testid="stat-ships">
              <div className="text-3xl font-bold text-neon-purple mb-2">500+</div>
              <div className="text-slate-300">Ships Connected</div>
            </Card>
            <Card className="glassmorphism rounded-xl p-6 hover:scale-105 transition-transform border-transparent" data-testid="stat-coverage">
              <div className="text-3xl font-bold text-neon-green mb-2">24/7</div>
              <div className="text-slate-300">Global Coverage</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Ship Selection Section */}
      <section id="ships" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              Select Your Vessel
            </h2>
            <p className="text-xl text-slate-300">Choose your ship to view available data packages</p>
          </div>

          {ships && ships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ships.map((ship) => (
                <Card 
                  key={ship.id} 
                  className="glassmorphism rounded-2xl p-6 hover:scale-105 transition-all cursor-pointer group neon-glow border-transparent"
                  data-testid={`ship-card-${ship.slug}`}
                >
                  <Link href={`/ships/${ship.slug}`}>
                    {ship.imageUrl && (
                      <img 
                        src={ship.imageUrl} 
                        alt={`${ship.name}`} 
                        className="w-full h-48 object-cover rounded-xl mb-4" 
                      />
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-bold text-white">{ship.name}</h3>
                      <div className="px-3 py-1 rounded-full bg-neon-green/20 text-neon-green text-sm">
                        <i className="fas fa-circle mr-1"></i>Active
                      </div>
                    </div>
                    
                    <p className="text-slate-300 mb-4">
                      {ship.description || 'Maritime vessel requiring reliable satellite connectivity for operations and crew.'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-400">
                        <i className="fas fa-ship mr-1"></i>Vessel
                      </div>
                      <Button className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-white group-hover:shadow-lg transition-all">
                        View Plans <i className="fas fa-arrow-right ml-1"></i>
                      </Button>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-ship text-6xl text-slate-500 mb-4"></i>
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No ships available</h3>
              <p className="text-slate-500">Please contact support for ship registration.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
