import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Loader2, Package, Wifi, Clock, CalendarDays, ShoppingCart,
  Copy, Archive, ChevronRight,
} from "lucide-react";
import UserShell from "@/components/UserShell";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useToast } from "@/hooks/use-toast";

const IST = "Europe/Istanbul";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", timeZone: IST });

interface ActivePackage {
  credentialId: string | null; planName: string; dataLimitGb: number;
  username: string | null; password: string | null;
  paidAt: string; assignedAt: string; expiresAt: string;
  isGift?: boolean;
}

function calcExpiry(paidAt: string, expiresAt: string) {
  if (!expiresAt) {
    const pd = new Date(paidAt);
    expiresAt = new Date(pd.getFullYear(), pd.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
  }
  const exp = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / 86400000));
  const pd = new Date(paidAt);
  const start = new Date(pd.getFullYear(), pd.getMonth(), 1);
  const total = exp.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const pct = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
  return { daysLeft, exp, pct };
}

function CopyBtn({ value, label, testId }: { value: string; label: string; testId?: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); toast({ title: `${label} kopyalandı` }); }
        catch { toast({ title: "Kopyalama başarısız", variant: "destructive" }); }
      }}
      data-testid={testId}
      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
    >
      <Copy className="w-3.5 h-3.5 text-slate-500" />
    </button>
  );
}

export default function Paketlerim() {
  const { user, isLoading: authLoading } = useUserAuth();

  const { data: activePackages, isLoading } = useQuery<ActivePackage[]>({
    queryKey: ["/api/user/active-packages"],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 60000,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!user) { window.location.href = "/giris"; return null; }

  const pkgs = activePackages || [];
  const sorted = [...pkgs].sort(
    (a, b) => new Date(b.paidAt || b.assignedAt).getTime() - new Date(a.paidAt || a.assignedAt).getTime()
  );
  const totalGb = sorted.reduce((s, p) => s + (Number(p.dataLimitGb) || 0), 0);

  return (
    <UserShell title="Paketlerim">
      <div className="space-y-4">

        {/* Summary */}
        <div className="user-card-elevated p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FFF6D6] flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5 text-[#7C5E00]" />
          </div>
          <div className="flex-1">
            <p className="text-slate-500 text-xs">Aktif Paket</p>
            <p className="text-slate-900 font-bold text-base leading-tight">
              {sorted.length} paket
              <span className="text-slate-400 font-medium text-sm"> · {totalGb} GB toplam paket</span>
            </p>
          </div>
          <Link href="/paketler">
            <a className="h-9 px-3 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 text-xs font-semibold flex items-center gap-1.5" data-testid="button-buy-new">
              <ShoppingCart className="w-3.5 h-3.5" /> Yeni Al
            </a>
          </Link>
        </div>

        {/* Active packages list */}
        {isLoading ? (
          <div className="user-card flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="user-card text-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-900 font-semibold text-sm mb-1">Aktif Paketiniz Yok</p>
            <p className="text-slate-500 text-xs mb-4">Bağlanmak için bir paket satın alın.</p>
            <Link href="/paketler">
              <a className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 text-sm font-semibold">
                <ShoppingCart className="w-4 h-4" /> Paket Al
              </a>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((pkg) => {
              const purchaseLabel = fmtDate(pkg.paidAt || pkg.assignedAt);
              const { daysLeft, exp, pct } = calcExpiry(pkg.paidAt || pkg.assignedAt, pkg.expiresAt);
              const urgency = daysLeft > 7 ? "ok" : daysLeft > 3 ? "warn" : "danger";
              const barColor = { ok: "bg-emerald-500", warn: "bg-amber-500", danger: "bg-rose-500" }[urgency];
              const dayColor = { ok: "text-emerald-600", warn: "text-amber-600", danger: "text-rose-600" }[urgency];

              const cardKey = pkg.credentialId || `gift-${pkg.paidAt}-${pkg.planName}`;
              return (
                <div key={cardKey} className="user-card-elevated overflow-hidden" data-testid={`my-package-${cardKey}`}>
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900 leading-none">{pkg.dataLimitGb}</span>
                        <span className="text-base font-bold text-slate-500">GB</span>
                        <span className="text-slate-400 text-xs ml-1">· {pkg.planName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {pkg.isGift && (
                          <span className="chip bg-amber-100 text-amber-700 border-amber-200">🎁 Hediye</span>
                        )}
                        <span className={`chip ${daysLeft > 0 ? "chip-success" : "chip-danger"}`}>
                          {daysLeft > 0 ? "Aktif" : "Bitti"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-500">
                      <CalendarDays className="w-3 h-3" />
                      {pkg.isGift ? "Tanımlanma:" : "Satın alma:"} {purchaseLabel}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500"><Clock className="w-3 h-3" /><span>Kalan süre</span></div>
                        <span className={`font-bold text-sm ${dayColor}`}>{daysLeft} gün</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-slate-400 text-xs">Bitiş: {fmtDate(exp.toISOString())}</p>
                    </div>
                  </div>

                  {!pkg.isGift && pkg.username && (
                    <div className="px-4 py-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wifi className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Bağlantı Bilgileri</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Kullanıcı Adı", val: pkg.username!, testId: `copy-mu-${pkg.credentialId}` },
                          { label: "Şifre", val: pkg.password!, testId: `copy-mp-${pkg.credentialId}` },
                        ].map(({ label, val, testId }) => (
                          <div key={label} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                            <div className="min-w-0 flex-1">
                              <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                              <p className="text-slate-900 font-mono text-xs font-medium truncate">{val}</p>
                            </div>
                            <CopyBtn value={val} label={label} testId={testId} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Expired link */}
        <Link href="/panel/gecmis?tab=expired">
          <a className="user-card flex items-center gap-3 p-4 hover:border-[#FFDD57] transition" data-testid="link-expired">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Archive className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Süresi Bitmiş Paketler</p>
              <p className="text-xs text-slate-500">Geçmiş paket kayıtlarınızı görüntüleyin</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </Link>
      </div>
    </UserShell>
  );
}
