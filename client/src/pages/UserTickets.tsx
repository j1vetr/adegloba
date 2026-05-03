import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import {
  Loader2, Plus, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight,
  HeadphonesIcon, TicketIcon, Inbox, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import UserShell from "@/components/UserShell";

interface Ticket { id: string; subject: string; priority: string; status: string; createdAt: string; updatedAt: string; }

const statusConfig: Record<string, { chip: string; icon: any; label: string }> = {
  "Açık":       { chip: "chip-info",    icon: AlertCircle, label: "Açık" },
  "Beklemede":  { chip: "chip-warning", icon: Clock,       label: "Beklemede" },
  "Cevaplandı": { chip: "chip-success", icon: CheckCircle, label: "Cevaplandı" },
  "Kapalı":     { chip: "chip-neutral", icon: XCircle,     label: "Kapalı" },
};
const priorityConfig: Record<string, { chip: string; bar: string }> = {
  "Düşük":  { chip: "chip-success", bar: "bg-emerald-500" },
  "Orta":   { chip: "chip-warning", bar: "bg-amber-500" },
  "Yüksek": { chip: "chip-danger",  bar: "bg-rose-500" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function UserTickets() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ subject: "", message: "", priority: "Orta" });

  const { data: tickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"], enabled: !!user,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.subject.trim()) throw new Error("Konu başlığı gerekli");
      if (!data.message.trim()) throw new Error("Mesaj gerekli");
      return (await apiRequest("POST", "/api/tickets", data)).json();
    },
    onSuccess: () => {
      toast({ title: "Destek talebiniz oluşturuldu." });
      setIsCreateDialogOpen(false);
      setFormData({ subject: "", message: "", priority: "Orta" });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: (error: Error) => toast({ title: "Hata", description: error.message, variant: "destructive" }),
  });

  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter(t => t.status === "Açık").length || 0,
    answered: tickets?.filter(t => t.status === "Cevaplandı").length || 0,
    closed: tickets?.filter(t => t.status === "Kapalı").length || 0,
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <UserShell title="Destek">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header card */}
        <div className="user-card-elevated p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-[#FFF6D6] flex items-center justify-center">
              <HeadphonesIcon className="h-5 w-5 text-[#7C5E00]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-slate-900">Destek Merkezi</h1>
              <p className="text-xs text-slate-500">AdeGloba Starlink · Teknik Destek</p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.99]"
            data-testid="button-open-new-ticket"
          >
            <Plus className="h-4 w-4" /> Yeni Talep Oluştur
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Toplam", value: stats.total, color: "text-slate-900" },
            { label: "Açık", value: stats.open, color: "text-sky-600" },
            { label: "Cevaplandı", value: stats.answered, color: "text-emerald-600" },
            { label: "Kapalı", value: stats.closed, color: "text-slate-500" },
          ].map(s => (
            <div key={s.label} className="user-card p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{s.label}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {ticketsLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
            <span className="text-slate-500 text-sm">Talepler yükleniyor...</span>
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <div className="user-card flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF6D6] flex items-center justify-center">
              <Inbox className="h-7 w-7 text-[#7C5E00]" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Henüz destek talebi yok</h3>
            <p className="text-slate-500 text-xs max-w-xs">Bir sorunla karşılaştığınızda destek talebi oluşturabilirsiniz.</p>
            <button onClick={() => setIsCreateDialogOpen(true)} className="mt-2 px-5 h-11 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" /> İlk Talebi Oluştur
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-slate-500 text-xs">{tickets.length} destek talebi</p>
            {tickets.map((ticket: Ticket) => {
              const sc = statusConfig[ticket.status] || statusConfig["Açık"];
              const pc = priorityConfig[ticket.priority] || priorityConfig["Orta"];
              const StatusIcon = sc.icon;
              return (
                <Link key={ticket.id} href={`/destek/${ticket.id}`}>
                  <a className="block user-card relative p-4 hover:border-[#FFDD57] transition cursor-pointer">
                    <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${pc.bar}`} />
                    <div className="flex items-center gap-3 pl-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <StatusIcon className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{ticket.subject}</h3>
                            <p className="text-slate-500 text-xs mt-0.5">#{ticket.id.slice(-8)} · {formatDate(ticket.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`chip ${pc.chip} hidden sm:inline-flex`}>{ticket.priority}</span>
                        <span className={`chip ${sc.chip}`}>{sc.label}</span>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  </a>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* New ticket bottom sheet */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="new-ticket-sheet">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setIsCreateDialogOpen(false)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="mx-auto w-12 h-1 rounded-full bg-slate-200 mt-2.5 mb-1 sm:hidden" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TicketIcon className="h-5 w-5 text-[#7C5E00]" /> Yeni Destek Talebi
              </h2>
              <button onClick={() => setIsCreateDialogOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">Konu Başlığı</label>
                <input
                  value={formData.subject}
                  onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Sorunu kısaca özetleyin..."
                  className="user-input w-full h-11 px-3.5 text-sm"
                  data-testid="input-ticket-subject"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">Öncelik</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: "Düşük",  cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                    { v: "Orta",   cls: "bg-amber-50 border-amber-200 text-amber-700" },
                    { v: "Yüksek", cls: "bg-rose-50 border-rose-200 text-rose-700" },
                  ].map(({ v, cls }) => (
                    <button
                      key={v}
                      onClick={() => setFormData(p => ({ ...p, priority: v }))}
                      className={`h-11 rounded-xl border text-xs font-semibold transition ${formData.priority === v ? cls : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                      data-testid={`priority-${v}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">Mesajınız</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                  placeholder="Sorununuzu detaylıca açıklayın..."
                  rows={5}
                  className="user-input w-full px-3.5 py-2.5 text-sm resize-none"
                  data-testid="input-ticket-message"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex gap-2 bottom-nav-safe">
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm"
              >
                İptal
              </button>
              <button
                onClick={() => createTicketMutation.mutate(formData)}
                disabled={createTicketMutation.isPending}
                className="flex-1 h-12 rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                data-testid="button-submit-ticket"
              >
                {createTicketMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </UserShell>
  );
}
