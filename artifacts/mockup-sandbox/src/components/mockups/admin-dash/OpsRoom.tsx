import React, { useState, useEffect } from 'react';

export function OpsRoom() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="min-h-screen bg-[#060B12] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-x-hidden p-4 sm:p-6" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #0a192f 0%, #060B12 70%)' }}>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse-cyan {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px #00e5ff, 0 0 20px #00e5ff; }
          50% { opacity: 0.5; box-shadow: 0 0 2px #00e5ff, 0 0 5px #00e5ff; }
        }
        @keyframes pulse-amber {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes ticker {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .crt-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
          z-index: 50;
          opacity: 0.3;
        }
        .data-panel {
          background: rgba(10, 20, 35, 0.6);
          border: 1px solid rgba(0, 229, 255, 0.15);
          box-shadow: inset 0 0 20px rgba(0, 229, 255, 0.02);
          backdrop-filter: blur(4px);
        }
        .data-panel-amber {
          background: rgba(35, 20, 10, 0.6);
          border: 1px solid rgba(255, 183, 0, 0.15);
        }
        .text-glow-cyan { text-shadow: 0 0 8px rgba(0, 229, 255, 0.5); }
        .text-glow-amber { text-shadow: 0 0 8px rgba(255, 183, 0, 0.5); }
        .font-num { font-family: 'Space Mono', 'Courier New', monospace; letter-spacing: -0.05em; }
        
        /* Custom Scrollbar for inner elements */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,229,255,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,229,255,0.4); }
      `}</style>
      
      <div className="crt-overlay"></div>

      <div className="max-w-[1400px] mx-auto space-y-4">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-cyan-500/20 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ animation: 'pulse-cyan 2s infinite' }}></div>
              <h1 className="text-2xl font-bold tracking-wider text-cyan-400 text-glow-cyan uppercase">
                AdeGloba
              </h1>
              <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded">
                Sys-Admin
              </span>
            </div>
            <p className="text-sm text-slate-400 uppercase tracking-widest">
              Gemi Haberleşme Ağı Kontrol Merkezi
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">
              Sistem Saati (UTC+3)
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-cyan-400 font-num text-xl">{formatDate(currentTime)}</span>
              <span className="text-white font-num text-2xl tracking-tight">{formatTime(currentTime)}</span>
            </div>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="data-panel p-4 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors"></div>
            <span className="text-xs uppercase tracking-widest text-slate-400 mb-2">Toplam Gelir</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-num text-white text-glow-cyan">$12,480</span>
              <span className="text-xs text-cyan-400 font-num mb-1">+4.2%</span>
            </div>
          </div>

          <div className="data-panel p-4 flex flex-col justify-between relative overflow-hidden">
            <span className="text-xs uppercase tracking-widest text-slate-400 mb-2">Aktif Kullanıcı</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-num text-white">47</span>
              <span className="text-xs text-cyan-400 font-num mb-1">Çevrimiçi</span>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-cyan-500/20 w-full">
              <div className="h-full bg-cyan-400" style={{ width: '47%' }}></div>
            </div>
          </div>

          <div className="data-panel-amber p-4 flex flex-col justify-between relative overflow-hidden">
            <span className="text-xs uppercase tracking-widest text-amber-500/70 mb-2">Bekleyen Sipariş</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-num text-amber-400 text-glow-amber">3</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-4 bg-amber-500/20" style={{ animation: 'pulse-amber 1s infinite 0.1s' }}></span>
                <span className="w-1.5 h-4 bg-amber-500/50" style={{ animation: 'pulse-amber 1s infinite 0.2s' }}></span>
                <span className="w-1.5 h-4 bg-amber-400" style={{ animation: 'pulse-amber 1s infinite 0.3s' }}></span>
              </div>
            </div>
          </div>

          <div className="data-panel p-4 flex flex-col justify-between relative">
            <span className="text-xs uppercase tracking-widest text-slate-400 mb-2">Açık Destek</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-num text-rose-400">2</span>
              <span className="text-xs text-rose-400 font-num mb-1">Bilet</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column (Reporting & Links) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Reporting */}
            <div className="data-panel p-5 h-[340px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm uppercase tracking-widest text-cyan-400">Aylık Rapor: Temmuz</h2>
                <span className="text-[10px] text-slate-500 font-num">v2.4.1</span>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div>
                  <div className="text-[10px] uppercase text-slate-500 mb-1">Bu Ay Sipariş</div>
                  <div className="text-xl font-num text-white">38</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500 mb-1">Bu Ay Ciro</div>
                  <div className="text-xl font-num text-cyan-400">$9,240</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500 mb-1">İptal</div>
                  <div className="text-xl font-num text-rose-400">4</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500 mb-1">Yeni Üye</div>
                  <div className="text-xl font-num text-emerald-400">11</div>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="mt-auto">
                <div className="text-[10px] uppercase text-slate-500 mb-2">Aktivite Hacmi (Son 7 Gün)</div>
                <div className="flex items-end justify-between h-16 gap-1">
                  {[40, 25, 60, 30, 85, 45, 100].map((height, i) => (
                    <div key={i} className="w-full relative group cursor-crosshair">
                      <div 
                        className={`w-full transition-all duration-500 ${i === 6 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.5)]' : 'bg-cyan-900 hover:bg-cyan-700'}`}
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="data-panel p-4">
              <h2 className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Hızlı Erişim</h2>
              <div className="grid grid-cols-2 gap-2">
                {['Gemiler', 'Paketler', 'Kuponlar', 'Kimlik Havuzu'].map((link) => (
                  <button key={link} className="flex items-center justify-between p-2 bg-slate-900/50 border border-cyan-900/30 hover:border-cyan-500/50 hover:bg-cyan-950/30 transition-colors text-left group">
                    <span className="text-xs text-slate-300 group-hover:text-cyan-400">{link}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 group-hover:text-cyan-400">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Live Feeds) */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Live Orders Log */}
            <div className="data-panel p-0 flex flex-col h-[480px]">
              <div className="p-4 border-b border-cyan-900/30 flex justify-between items-center bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399]" style={{ animation: 'pulse-cyan 1.5s infinite' }}></div>
                  <h2 className="text-xs uppercase tracking-widest text-emerald-400">Canlı Sipariş Akışı</h2>
                </div>
                <span className="text-[10px] font-num text-slate-500">PORT: 8080</span>
              </div>
              
              <div className="p-4 overflow-hidden relative flex-1">
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[#0a1423] z-10"></div>
                <div className="space-y-1">
                  {[
                    { id: 'ORD-8821', ship: 'MV Karadeniz', pkg: 'Global Sınırsız', amt: '$1,200', stat: 'ONAYLANDI', time: '14:23', statColor: 'text-emerald-400' },
                    { id: 'ORD-8820', ship: 'MT Boğaziçi', pkg: 'Akdeniz 50GB', amt: '$450', stat: 'BEKLEMEDE', time: '13:45', statColor: 'text-amber-400' },
                    { id: 'ORD-8819', ship: 'RV Piri Reis', pkg: 'Kutup Pro', amt: '$2,100', stat: 'ONAYLANDI', time: '12:10', statColor: 'text-emerald-400' },
                    { id: 'ORD-8818', ship: 'FV Barbaros', pkg: 'Kıyı 10GB', amt: '$90', stat: 'İPTAL', time: '11:05', statColor: 'text-rose-400' },
                    { id: 'ORD-8817', ship: 'MV Anadolu', pkg: 'Global 100GB', amt: '$850', stat: 'ONAYLANDI', time: '09:30', statColor: 'text-emerald-400' },
                    { id: 'ORD-8816', ship: 'SY Marmara', pkg: 'Hafta Sonu', amt: '$45', stat: 'ONAYLANDI', time: '08:15', statColor: 'text-emerald-400' },
                    { id: 'ORD-8815', ship: 'MT Ege', pkg: 'Akdeniz Sınırsız', amt: '$900', stat: 'ONAYLANDI', time: '07:42', statColor: 'text-emerald-400' },
                  ].map((order, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 hover:bg-white/5 px-2 -mx-2 transition-colors cursor-default group">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-num text-slate-500">{order.id}</span>
                          <span className="text-xs text-slate-200">{order.ship}</span>
                        </div>
                        <span className="text-[10px] text-cyan-600 uppercase">{order.pkg}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-num text-white">{order.amt}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] uppercase font-bold tracking-wider ${order.statColor}`}>{order.stat}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Users List */}
            <div className="data-panel p-0 flex flex-col h-[480px]">
              <div className="p-4 border-b border-cyan-900/30 bg-slate-900/40">
                <h2 className="text-xs uppercase tracking-widest text-cyan-400">Gemi Personeli Bağlantıları</h2>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {[
                    { name: 'Ahmet Yılmaz', ship: 'MV Karadeniz', role: 'Kaptan', ping: '12ms' },
                    { name: 'Mehmet Demir', ship: 'MT Boğaziçi', role: 'Çarkçıbaşı', ping: '45ms' },
                    { name: 'Ayşe Kaya', ship: 'RV Piri Reis', role: 'Araştırmacı', ping: '110ms' },
                    { name: 'Mustafa Çelik', ship: 'MV Anadolu', role: '2. Kaptan', ping: '28ms' },
                    { name: 'Ali Yıldız', ship: 'FV Barbaros', role: 'Güverte', ping: 'OFFLINE' },
                    { name: 'Canan Mutlu', ship: 'SY Marmara', role: 'Misafir', ping: '15ms' },
                  ].map((user, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-cyan-500 text-xs font-bold uppercase">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 truncate">{user.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{user.role} // {user.ship}</div>
                      </div>
                      <div className={`text-[10px] font-num ${user.ping === 'OFFLINE' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {user.ping}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
