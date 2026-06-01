import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import { Gift, Plus, Play, Eye, Trash2, X, ChevronDown, ChevronUp, CheckCircle2, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const IST = "Europe/Istanbul";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: IST });
const fmtDt = (d: string) => new Date(d).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: IST });

const statusChip: Record<string, string> = {
  draft: "bg-slate-700/50 text-slate-300 border-slate-600",
  active: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  completed: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
};
const statusLabel: Record<string, string> = { draft: "Taslak", active: "Aktif", completed: "Tamamlandı" };

interface Campaign {
  id: string; name: string; description: string | null; orderStartDate: string; orderEndDate: string;
  giftDescription: string; giftDataGb: number; giftPlanNameFilter: string | null; minPackageGb: number | null;
  minOrderAmountUsd: string | null; packageNameFilter: string | null; shipIds: string[];
  status: string; executedAt: string | null; totalRecipients: number | null; createdAt: string;
}

interface PreviewUser { userId: string; username: string; fullName: string; phone: string | null; shipName: string; ordersCount: number; }

const empty = {
  name: "", description: "", orderStartDate: "", orderEndDate: "",
  giftDescription: "", giftDataGb: "1", giftPlanNameFilter: "",
  minPackageGb: "", minOrderAmountUsd: "", packageNameFilter: "", shipIds: [] as string[],
};

export default function GiftCampaigns() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmExecuteId, setConfirmExecuteId] = useState<string | null>(null);

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({ queryKey: ["/api/admin/gift-campaigns"] });

  const { data: previewData, isLoading: previewLoading } = useQuery<PreviewUser[]>({
    queryKey: ["/api/admin/gift-campaigns", previewId, "preview"],
    queryFn: async () => {
      const r = await fetch(`/api/admin/gift-campaigns/${previewId}/preview`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!previewId,
  });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/gift-campaigns", data),
    onSuccess: () => { toast({ title: "Kampanya oluşturuldu" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-campaigns"] }); resetForm(); },
    onError: () => toast({ title: "Hata", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/admin/gift-campaigns/${id}`, data),
    onSuccess: () => { toast({ title: "Kampanya güncellendi" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-campaigns"] }); resetForm(); },
    onError: () => toast({ title: "Hata", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/gift-campaigns/${id}`),
    onSuccess: () => { toast({ title: "Silindi" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-campaigns"] }); },
    onError: () => toast({ title: "Hata", variant: "destructive" }),
  });

  const executeMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/gift-campaigns/${id}/execute`),
    onSuccess: (data: any) => {
      toast({ title: `✅ Kampanya uygulandı — ${data.recipientCount} kullanıcıya hediye gönderildi` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-campaigns"] });
      setConfirmExecuteId(null);
    },
    onError: (e: any) => toast({ title: "Hata", description: e?.message, variant: "destructive" }),
  });

  const resetForm = () => { setForm({ ...empty }); setShowForm(false); setEditId(null); };

  const openEdit = (c: Campaign) => {
    setForm({
      name: c.name, description: c.description || "",
      orderStartDate: c.orderStartDate.slice(0, 10), orderEndDate: c.orderEndDate.slice(0, 10),
      giftDescription: c.giftDescription, giftDataGb: String(c.giftDataGb),
      giftPlanNameFilter: c.giftPlanNameFilter || "",
      minPackageGb: c.minPackageGb != null ? String(c.minPackageGb) : "",
      minOrderAmountUsd: c.minOrderAmountUsd || "", packageNameFilter: c.packageNameFilter || "",
      shipIds: c.shipIds || [],
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name, description: form.description || null,
      orderStartDate: form.orderStartDate, orderEndDate: form.orderEndDate,
      giftDescription: form.giftDescription, giftDataGb: Number(form.giftDataGb),
      giftPlanNameFilter: form.giftPlanNameFilter || null,
      minPackageGb: form.minPackageGb ? Number(form.minPackageGb) : null,
      minOrderAmountUsd: form.minOrderAmountUsd || null,
      packageNameFilter: form.packageNameFilter || null,
      shipIds: [],
    };
    if (editId) updateMut.mutate({ id: editId, data: payload });
    else createMut.mutate(payload);
  };

  const inputCls = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm placeholder-slate-500 outline-none focus:border-[#FFDD57]/60 focus:ring-1 focus:ring-[#FFDD57]/20 transition";
  const labelCls = "text-slate-400 text-xs font-semibold uppercase tracking-wide block mb-1";

  return (
    <AdminLayout title="Hediye Kampanyaları" icon={<Gift className="w-5 h-5 text-yellow-400" />}>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Hediye Kampanyaları</h1>
            <p className="text-slate-400 text-sm mt-0.5">Seçili tarihlerde sipariş veren kullanıcılara toplu hediye gönderin</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FFDD57] text-slate-900 rounded-xl font-semibold text-sm hover:brightness-95 transition"
          >
            <Plus className="w-4 h-4" /> Yeni Kampanya
          </button>
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">{editId ? "Kampanyayı Düzenle" : "Yeni Kampanya Oluştur"}</h2>
              <button onClick={resetForm} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Kampanya Adı *</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ramazan Bayramı 2025" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Açıklama</label>
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Opsiyonel açıklama" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Sipariş Başlangıç Tarihi *</label>
                  <input required type="date" value={form.orderStartDate} onChange={e => setForm(p => ({ ...p, orderStartDate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Sipariş Bitiş Tarihi *</label>
                  <input required type="date" value={form.orderEndDate} onChange={e => setForm(p => ({ ...p, orderEndDate: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Hediye Açıklaması *</label>
                  <input required value={form.giftDescription} onChange={e => setForm(p => ({ ...p, giftDescription: e.target.value }))} placeholder="1 GB Bayram Hediyesi" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Hediye GB *</label>
                  <input required type="number" min="1" value={form.giftDataGb} onChange={e => setForm(p => ({ ...p, giftDataGb: e.target.value }))} className={inputCls} />
                </div>
              </div>

              {/* Gift plan selection */}
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 space-y-1">
                <label className={labelCls + " text-yellow-400/80"}>🎁 Hediye Edilecek Paket (Anahtar Kelime)</label>
                <input
                  value={form.giftPlanNameFilter}
                  onChange={e => setForm(p => ({ ...p, giftPlanNameFilter: e.target.value }))}
                  placeholder="Örn: 1 GB"
                  className={inputCls}
                />
                <p className="text-slate-500 text-xs">
                  Her kullanıcının gemisinde bu kelimeyi içeren paket otomatik bulunur ve sipariş kalemi oluşturulur.
                  Boş bırakılırsa sipariş kalemi eklenmez — sadece kayıt tutulur.
                </p>
                <p className="text-yellow-500/70 text-xs mt-1">
                  💡 Tüm gemilerde "1 GB" ile başlayan paketler için <strong>1 GB</strong> yazmanız yeterli.
                </p>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Filtreler (Opsiyonel)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Min. Paket GB</label>
                    <input type="number" min="1" value={form.minPackageGb} onChange={e => setForm(p => ({ ...p, minPackageGb: e.target.value }))} placeholder="Örn: 5" className={inputCls} />
                    <p className="text-slate-500 text-xs mt-1">Bu GB ve üzeri paket almış olanlar</p>
                  </div>
                  <div>
                    <label className={labelCls}>Min. Sipariş Tutarı ($)</label>
                    <input type="number" min="0" step="0.01" value={form.minOrderAmountUsd} onChange={e => setForm(p => ({ ...p, minOrderAmountUsd: e.target.value }))} placeholder="Örn: 50" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Paket Adı İçeriyor</label>
                    <input value={form.packageNameFilter} onChange={e => setForm(p => ({ ...p, packageNameFilter: e.target.value }))} placeholder="Örn: 10 GB" className={inputCls} />
                    <p className="text-slate-500 text-xs mt-1">Kısmi eşleşme (büyük/küçük harf duyarsız)</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 text-sm hover:bg-slate-700/50 transition">
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-[#FFDD57] text-slate-900 font-semibold text-sm hover:brightness-95 disabled:opacity-50 transition"
                >
                  {editId ? "Güncelle" : "Kampanya Oluştur"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Campaign List */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-500">Yükleniyor...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Gift className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold">Henüz kampanya yok</p>
            <p className="text-slate-600 text-sm mt-1">Bayram, özel gün veya sadakat hediyesi oluşturun</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-white font-semibold">{c.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusChip[c.status] || statusChip.draft}`}>
                          {statusLabel[c.status] || c.status}
                        </span>
                      </div>
                      {c.description && <p className="text-slate-400 text-xs mb-2">{c.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmtDate(c.orderStartDate)} — {fmtDate(c.orderEndDate)}</span>
                        <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5 text-yellow-400" /><span className="text-yellow-300 font-medium">{c.giftDescription}</span></span>
                        {c.status === 'completed' && c.totalRecipients != null && (
                          <span className="flex items-center gap-1 text-emerald-400"><Users className="w-3.5 h-3.5" />{c.totalRecipients} kullanıcı</span>
                        )}
                      </div>
                      {c.executedAt && (
                        <p className="text-slate-500 text-xs mt-1">Uygulandı: {fmtDt(c.executedAt)}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Preview */}
                      <button
                        onClick={() => setPreviewId(previewId === c.id ? null : c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 text-slate-300 text-xs hover:bg-slate-600 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Önizle
                      </button>

                      {/* Execute */}
                      {c.status !== 'completed' && (
                        <button
                          onClick={() => setConfirmExecuteId(c.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-xs hover:bg-emerald-600/30 transition"
                        >
                          <Play className="w-3.5 h-3.5" /> Uygula
                        </button>
                      )}

                      {/* Edit */}
                      {c.status !== 'completed' && (
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}

                      {/* Delete */}
                      <button onClick={() => deleteMut.mutate(c.id)} className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Filter pills */}
                  {(c.giftPlanNameFilter || c.minPackageGb || c.minOrderAmountUsd || c.packageNameFilter) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {c.giftPlanNameFilter && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-300 border border-yellow-700/40">🎁 Hediye Paketi: "{c.giftPlanNameFilter}"</span>}
                      {c.minPackageGb && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/30">Min {c.minPackageGb} GB paket</span>}
                      {c.minOrderAmountUsd && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-300 border border-purple-800/30">Min ${c.minOrderAmountUsd} sipariş</span>}
                      {c.packageNameFilter && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/30 text-orange-300 border border-orange-800/30">Uygunluk: "{c.packageNameFilter}"</span>}
                    </div>
                  )}
                </div>

                {/* Preview Panel */}
                {previewId === c.id && (
                  <div className="border-t border-slate-700 p-5 bg-slate-900/40">
                    {previewLoading ? (
                      <p className="text-slate-400 text-sm text-center py-4">Hesaplanıyor...</p>
                    ) : previewData && previewData.length > 0 ? (
                      <>
                        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-400" />
                          {previewData.length} kullanıcı bu kampanyadan yararlanacak
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {previewData.map(u => (
                            <div key={u.userId} className="flex items-center justify-between bg-slate-800/60 rounded-xl px-3 py-2.5">
                              <div>
                                <p className="text-white text-xs font-medium">{u.fullName || u.username}</p>
                                <p className="text-slate-400 text-xs">@{u.username} · {u.shipName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-slate-300 text-xs">{u.ordersCount} sipariş</p>
                                <p className="text-slate-500 text-xs">{u.phone ? '📱' : '📵'} {u.phone || 'Telefon yok'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-400 text-sm text-center py-4">
                        Bu filtrelerle uygun kullanıcı bulunamadı.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Execute Confirm Modal */}
        {confirmExecuteId && (() => {
          const camp = campaigns.find(c => c.id === confirmExecuteId);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-slate-950/70" onClick={() => setConfirmExecuteId(null)} />
              <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-white font-bold text-center mb-2">Kampanyayı Uygula</h3>
                <p className="text-slate-400 text-sm text-center mb-1">
                  <span className="text-white font-semibold">"{camp?.name}"</span> kampanyası uygulanacak.
                </p>
                <p className="text-slate-500 text-xs text-center mb-5">
                  Uygun kullanıcılara hediye siparişi oluşturulacak ve WhatsApp bildirimi gönderilecek. Bu işlem geri alınamaz.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmExecuteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 text-sm hover:bg-slate-700/50 transition">
                    Vazgeç
                  </button>
                  <button
                    onClick={() => executeMut.mutate(confirmExecuteId!)}
                    disabled={executeMut.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 disabled:opacity-50 transition"
                  >
                    {executeMut.isPending ? "Uygulanıyor..." : "Evet, Uygula"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </AdminLayout>
  );
}
