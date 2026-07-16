import React from "react";
import { 
  Ship, 
  Users, 
  CreditCard, 
  Tag, 
  Activity, 
  ShieldAlert, 
  BarChart3,
  Search,
  Bell,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Anchor,
  Clock,
  LifeBuoy
} from "lucide-react";

export function FintechCmd() {
  const currentDate = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans p-6 w-full max-w-7xl mx-auto overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes bar-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .animate-bar {
          transform-origin: bottom;
          animation: bar-grow 1s ease-out forwards;
        }
        .gradient-border {
          position: relative;
          background: #111827;
          border-radius: 1rem;
        }
        .gradient-border::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 1rem;
          padding: 1px;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}} />

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] relative">
            <Anchor className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" style={{ animation: 'pulse-ring 2s infinite' }}></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              AdeGloba <span className="text-xs font-mono px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">CMD_CENTER</span>
            </h1>
            <p className="text-sm text-slate-500 font-mono mt-0.5">{currentDate} // SYNC: OK</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-[#1F2937]/50 rounded-full px-4 py-2 border border-slate-700/50">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Gemi, kullanıcı, sipariş ara..." 
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 w-48 focus:w-64 transition-all duration-300"
            />
          </div>
          <button className="relative p-2 rounded-full bg-[#1F2937] hover:bg-[#374151] border border-slate-700/50 transition-colors">
            <Bell className="w-5 h-5 text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-[#0B0F19]"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-emerald-400 font-mono">SYS_ROOT</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <span className="text-sm font-bold text-white">AD</span>
            </div>
          </div>
        </div>
      </header>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Revenue */}
        <div className="gradient-border p-5 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">Toplam Gelir</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">$12,480</h2>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
              <TrendingUp className="w-3 h-3 mr-1" /> +14.2%
            </span>
            <span className="text-xs text-slate-500">geçen aya göre</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="gradient-border p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium mb-1">Aktif Kullanıcı</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">47<span className="text-lg text-slate-500 font-normal">/60</span></h2>
            <p className="text-xs text-violet-400 mt-2 font-mono">+3 bugün</p>
          </div>
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#1F2937"
                strokeWidth="4"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="4"
                strokeDasharray="78, 100"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="gradient-border p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium mb-1">Bekleyen Sipariş</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">3</h2>
            <p className="text-xs text-amber-400 mt-2 font-mono">İşlem gerekiyor</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-[#1F2937] flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-amber-500/20"></div>
             <Clock className="w-6 h-6 text-amber-400 relative z-10" />
          </div>
        </div>

        {/* Open Support */}
        <div className="gradient-border p-5 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">Açık Destek</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">2</h2>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full bg-[#1F2937] h-2 rounded-full overflow-hidden mt-4">
            <div className="bg-rose-500 h-full w-1/4 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Kritik seviye: %25</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Reporting Centerpiece */}
        <div className="lg:col-span-2 gradient-border p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Performans Raporu
                <span className="px-2 py-0.5 bg-slate-800 text-xs text-slate-300 rounded font-mono border border-slate-700">TEMMUZ</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-slate-400 font-mono">son güncelleme: şimdi</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0f1423] rounded-lg p-4 border border-slate-800/50">
              <p className="text-xs text-slate-500 mb-1">Bu Ay Sipariş</p>
              <p className="text-2xl font-bold text-white">38</p>
            </div>
            <div className="bg-[#0f1423] rounded-lg p-4 border border-emerald-900/30">
              <p className="text-xs text-slate-500 mb-1">Bu Ay Ciro</p>
              <p className="text-2xl font-bold text-emerald-400">$9,240</p>
            </div>
            <div className="bg-[#0f1423] rounded-lg p-4 border border-rose-900/30">
              <p className="text-xs text-slate-500 mb-1">İptal</p>
              <p className="text-2xl font-bold text-rose-400">4</p>
            </div>
            <div className="bg-[#0f1423] rounded-lg p-4 border border-violet-900/30">
              <p className="text-xs text-slate-500 mb-1">Yeni Üye</p>
              <p className="text-2xl font-bold text-violet-400">11</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            {/* Progress Bars */}
            <div className="space-y-6 flex flex-col justify-center">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Ay İlerlemesi (Gün 16/31)</span>
                  <span className="text-white font-mono">52%</span>
                </div>
                <div className="w-full bg-[#1F2937] h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-300 h-full w-[52%] rounded-full relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30"></div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Hedef Ciro: $10,000</span>
                  <span className="text-emerald-400 font-mono">92%</span>
                </div>
                <div className="w-full bg-[#1F2937] h-3 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-emerald-500 h-full w-[92%] rounded-full relative shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)50%,rgba(255,255,255,0.15)75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[move_1s_linear_infinite]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Bar Chart */}
            <div className="bg-[#0f1423] rounded-xl p-4 border border-slate-800 flex items-end justify-between h-32 gap-2 relative">
               <div className="absolute top-2 left-2 text-xs text-slate-500 font-mono">Günlük Hacim (7 Gün)</div>
               {[40, 70, 45, 90, 60, 100, 85].map((height, i) => (
                 <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-xs px-2 py-1 rounded text-white transition-opacity font-mono">
                      {height * 10}
                    </div>
                    <div 
                      className="w-full max-w-[24px] bg-gradient-to-t from-emerald-900/50 to-emerald-500/80 rounded-t-sm animate-bar group-hover:from-emerald-800 group-hover:to-emerald-400 transition-colors"
                      style={{ height: `${height}%`, animationDelay: `${i * 0.1}s` }}
                    ></div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="gradient-border p-6">
           <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Hızlı Erişim</h3>
           <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0f1423] border border-slate-800 hover:border-emerald-500/50 hover:bg-[#1a2235] transition-all group">
                <Ship className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 mb-2 transition-colors" />
                <span className="text-sm font-medium text-slate-300">Gemiler</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0f1423] border border-slate-800 hover:border-violet-500/50 hover:bg-[#1a2235] transition-all group">
                <Activity className="w-6 h-6 text-slate-400 group-hover:text-violet-400 mb-2 transition-colors" />
                <span className="text-sm font-medium text-slate-300">Paketler</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0f1423] border border-slate-800 hover:border-amber-500/50 hover:bg-[#1a2235] transition-all group">
                <Tag className="w-6 h-6 text-slate-400 group-hover:text-amber-400 mb-2 transition-colors" />
                <span className="text-sm font-medium text-slate-300">Kuponlar</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0f1423] border border-slate-800 hover:border-blue-500/50 hover:bg-[#1a2235] transition-all group">
                <ShieldAlert className="w-6 h-6 text-slate-400 group-hover:text-blue-400 mb-2 transition-colors" />
                <span className="text-sm font-medium text-slate-300 text-center leading-tight mt-1">Kimlik<br/>Havuzu</span>
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 gradient-border p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#111827]">
            <h3 className="text-lg font-bold text-white">Canlı Sipariş Akışı</h3>
            <button className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center font-mono">
              TÜMÜNÜ GÖR <ChevronRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#0f1423] text-slate-500 font-mono text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-medium tracking-wider">ID</th>
                  <th className="px-5 py-3 font-medium tracking-wider">Gemi Adı</th>
                  <th className="px-5 py-3 font-medium tracking-wider">Paket</th>
                  <th className="px-5 py-3 font-medium tracking-wider">Tutar</th>
                  <th className="px-5 py-3 font-medium tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  { id: "ORD-9942", ship: "MV Karadeniz", plan: "Global 5TB", amount: "$1,250", status: "Ödendi", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
                  { id: "ORD-9941", ship: "MT Ege", plan: "Coastal 1TB", amount: "$350", status: "Bekliyor", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
                  { id: "ORD-9940", ship: "MV Akdeniz", plan: "Global 10TB", amount: "$2,400", status: "Ödendi", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
                  { id: "ORD-9939", ship: "RV Marmara", plan: "Global 5TB", amount: "$1,250", status: "İptal", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
                  { id: "ORD-9938", ship: "FV Boğaziçi", plan: "Coastal 500GB", amount: "$180", status: "Ödendi", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
                  { id: "ORD-9937", ship: "SV Anadolu", plan: "Global 5TB", amount: "$1,250", status: "İade Edildi", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
                  { id: "ORD-9936", ship: "MT İzmir", plan: "Global 1TB", amount: "$450", status: "Ödendi", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
                ].map((order, i) => (
                  <tr key={i} className="hover:bg-[#1a2235]/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-slate-400">{order.id}</td>
                    <td className="px-5 py-3 text-white font-medium flex items-center gap-2">
                      <Ship className="w-4 h-4 text-slate-500" />
                      {order.ship}
                    </td>
                    <td className="px-5 py-3 text-slate-300">{order.plan}</td>
                    <td className="px-5 py-3 text-white font-mono">{order.amount}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${order.color}`}>
                        {order.status === "Bekliyor" && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse"></span>}
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users List */}
        <div className="gradient-border p-5 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
            Son Aktif Kullanıcılar
            <Users className="w-5 h-5 text-slate-500" />
          </h3>
          <div className="flex-1 space-y-4 mt-2">
            {[
              { initials: "AK", name: "Ahmet Yılmaz", ship: "MV Karadeniz", status: "online" },
              { initials: "MO", name: "Mehmet Öztürk", ship: "MT Ege", status: "online" },
              { initials: "ED", name: "Elif Demir", ship: "RV Marmara", status: "offline" },
              { initials: "CK", name: "Can Kaya", ship: "SV Anadolu", status: "online" },
              { initials: "AS", name: "Ayşe Şahin", ship: "FV Boğaziçi", status: "offline" },
              { initials: "BC", name: "Burak Çelik", ship: "MV Akdeniz", status: "online" },
            ].map((user, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-[#1a2235] p-2 -mx-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                      {user.initials}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111827] ${user.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">{user.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Ship className="w-3 h-3" /> {user.ship}
                    </p>
                  </div>
                </div>
                <button className="text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
