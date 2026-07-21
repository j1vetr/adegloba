import { Link } from "wouter";
import { Home, LayoutDashboard, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        {/* Büyük 404 */}
        <div className="relative mb-6 select-none">
          <p className="text-[120px] sm:text-[160px] font-black leading-none text-slate-800 tracking-tighter">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[120px] sm:text-[160px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-slate-600 to-slate-800 tracking-tighter">
              404
            </p>
          </div>
        </div>

        {/* Mesaj */}
        <h1 className="text-xl font-bold text-white mb-2">
          Sayfa Bulunamadı
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Aradığınız sayfa mevcut değil ya da taşınmış olabilir.
          Adres çubuğunu kontrol edip tekrar deneyin.
        </p>

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 hover:border-slate-600 transition-all w-full sm:w-auto justify-center">
              <Home className="h-4 w-4" />
              Ana Sayfa
            </button>
          </Link>
          <Link href="/admin">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-all w-full sm:w-auto justify-center">
              <LayoutDashboard className="h-4 w-4" />
              Admin Paneli
            </button>
          </Link>
        </div>

        {/* Geri git */}
        <button
          onClick={() => window.history.back()}
          className="mt-5 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Geri Dön
        </button>

      </div>
    </div>
  );
}
