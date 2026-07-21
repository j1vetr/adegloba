import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Database, Download, Trash2, RotateCcw, Plus,
  Shield, Clock, HardDrive, Rows3, AlertTriangle,
  CheckCircle2, Info, Mail,
} from "lucide-react";

interface BackupMeta {
  filename:  string;
  size:      number;
  createdAt: string;
  rowCount?: number;
  version?:  string;
}

const fmtSize = (bytes: number) => {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

const isJson = (f: string) => f.endsWith(".json");

export default function DatabaseBackup() {
  const { toast }  = useToast();
  const qc         = useQueryClient();
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete,  setConfirmDelete]  = useState<string | null>(null);
  const [sendingEmail, setSendingEmail]     = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: backups = [], isLoading } = useQuery<BackupMeta[]>({
    queryKey: ["/api/admin/database/backups"],
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/database/backup"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/database/backups"] });
      toast({ title: "Yedek oluşturuldu", description: "Tüm veriler başarıyla yedeklendi." });
    },
    onError: (e: any) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const restoreMutation = useMutation({
    mutationFn: (filename: string) =>
      apiRequest("POST", "/api/admin/database/restore", { filename }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/database/backups"] });
      toast({
        title: "Geri Yükleme Tamamlandı",
        description: `${data.tablesRestored} tablo, ${data.rowsRestored?.toLocaleString()} satır geri yüklendi.`,
      });
      setConfirmRestore(null);
    },
    onError: (e: any) => {
      toast({ title: "Geri Yükleme Hatası", description: e.message, variant: "destructive" });
      setConfirmRestore(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (filename: string) =>
      apiRequest("DELETE", `/api/admin/database/backups/${encodeURIComponent(filename)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/database/backups"] });
      toast({ title: "Yedek silindi" });
      setConfirmDelete(null);
    },
    onError: (e: any) => {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
      setConfirmDelete(null);
    },
  });

  const handleEmailBackup = async () => {
    setSendingEmail(true);
    try {
      await apiRequest("POST", "/api/admin/database/backup/send-email");
      toast({ title: "E-Posta Gönderildi", description: "Yedek dosyası admin e-postasına gönderildi." });
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownload = (filename: string) => {
    window.open(`/api/admin/database/backups/${encodeURIComponent(filename)}`, "_blank");
  };

  const isBusy = createMutation.isPending || restoreMutation.isPending || deleteMutation.isPending;

  return (
    <AdminLayout title="DB Yedekleme">
      <div className="space-y-6 pb-10 max-w-5xl">

        {/* ── Başlık ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Veritabanı Yedekleme</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Tüm sistem verilerini tek dosyaya yedekle ve geri yükle
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleEmailBackup}
              disabled={isBusy || sendingEmail}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sendingEmail
                ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                : <Mail className="h-4 w-4" />}
              E-Posta İle Gönder
            </button>
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={isBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Plus className="h-4 w-4" />}
              Yeni Yedek Al
            </button>
          </div>
        </div>

        {/* ── Kapsam Bilgisi ── */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-cyan-400" />
            <p className="text-sm font-semibold text-white">Yedek Kapsamı</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Kullanıcılar",  items: "Üyeler, admin hesapları, şifre hash'leri" },
              { label: "Siparişler",    items: "Siparişler, ödeme kayıtları, paket bilgileri" },
              { label: "Sistem",        items: "Ayarlar, e-posta şablonları, kampanyalar" },
              { label: "Kimlik Havuzu", items: "Tüm credentials ve atama durumları" },
            ].map(c => (
              <div key={c.label} className="rounded-lg bg-slate-800/60 p-3">
                <p className="text-white text-xs font-semibold mb-1">{c.label}</p>
                <p className="text-slate-500 text-[11px] leading-relaxed">{c.items}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <Info className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-amber-200/80 text-xs">
              Yedek dosyası JSON formatındadır. Geri yüklerken <strong>mevcut tüm veriler silinir</strong> ve yedekteki verilerle değiştirilir. Bu işlem geri alınamaz.
            </p>
          </div>
        </div>

        {/* ── Yedek Listesi ── */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
            <p className="text-white font-semibold text-sm">Mevcut Yedekler</p>
            <span className="text-slate-600 text-xs">{backups.length} dosya</span>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center gap-3 text-slate-600">
              <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
              <span className="text-sm">Yükleniyor…</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="p-12 text-center">
              <Database className="h-10 w-10 text-slate-800 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Henüz yedek alınmamış</p>
              <p className="text-slate-700 text-xs mt-1">Yukarıdaki "Yeni Yedek Al" butonuna tıklayın</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {backups.map(b => (
                <div key={b.filename} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition-colors">

                  {/* Sol: ikon + dosya adı */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isJson(b.filename) ? "bg-cyan-500/10" : "bg-slate-800"}`}>
                      <Database className={`h-4 w-4 ${isJson(b.filename) ? "text-cyan-400" : "text-slate-500"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{b.filename}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                        <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Clock className="h-3 w-3" />
                          {fmtDate(b.createdAt)}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <HardDrive className="h-3 w-3" />
                          {fmtSize(b.size)}
                        </span>
                        {b.rowCount !== undefined && (
                          <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                            <Rows3 className="h-3 w-3" />
                            {b.rowCount.toLocaleString()} satır
                          </span>
                        )}
                        {b.version && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-500">
                            v{b.version}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sağ: aksiyonlar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownload(b.filename)}
                      disabled={isBusy}
                      title="İndir"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 disabled:opacity-40 transition-all"
                    >
                      <Download className="h-3.5 w-3.5" />
                      İndir
                    </button>

                    {isJson(b.filename) && (
                      <button
                        type="button"
                        onClick={() => setConfirmRestore(b.filename)}
                        disabled={isBusy}
                        title="Geri Yükle"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/30 disabled:opacity-40 transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Geri Yükle
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setConfirmDelete(b.filename)}
                      disabled={isBusy}
                      title="Sil"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 disabled:opacity-40 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Bilgi Kutusu ── */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-white">Otomatik Yedekleme</p>
          </div>
          <p className="text-slate-500 text-sm">
            Sistem her 4 günde bir saat 01:00'de (İstanbul) otomatik yedekleme yapar ve admin e-postasına gönderir.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              { icon: CheckCircle2, color: "text-emerald-400", text: "Tüm tablolar dahil — 24 tablo" },
              { icon: Shield,       color: "text-cyan-400",    text: "JSON format, okunabilir" },
              { icon: RotateCcw,    color: "text-amber-400",   text: "Tek tıkla tam geri yükleme" },
            ].map(({ icon: Icon, color, text }) => (
              <div key={text} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-800/60">
                <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                <span className="text-slate-400 text-xs">{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ══ Geri Yükleme Onay Modalı ══ */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !restoreMutation.isPending && setConfirmRestore(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Geri Yüklemeyi Onayla</p>
                <p className="text-slate-500 text-sm">Bu işlem geri alınamaz</p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
              <p className="text-slate-400 text-xs mb-1">Dosya</p>
              <p className="text-white text-sm font-mono break-all">{confirmRestore}</p>
            </div>

            <p className="text-slate-400 text-sm">
              Mevcut <strong className="text-white">tüm veriler silinecek</strong> ve bu yedekteki verilerle değiştirilecek.
              Aktif oturumlar sonlanacak.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmRestore(null)}
                disabled={restoreMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => restoreMutation.mutate(confirmRestore)}
                disabled={restoreMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {restoreMutation.isPending
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Geri Yükleniyor…</>
                  : <><RotateCcw className="h-4 w-4" /> Evet, Geri Yükle</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Silme Onay Modalı ══ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !deleteMutation.isPending && setConfirmDelete(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Yedeği Sil</p>
                <p className="text-slate-500 text-sm">Bu dosya kalıcı olarak silinecek</p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
              <p className="text-slate-400 text-xs mb-1">Dosya</p>
              <p className="text-white text-sm font-mono break-all">{confirmDelete}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Trash2 className="h-4 w-4" /> Sil</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
