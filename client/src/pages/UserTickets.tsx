import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Satellite,
  HeadphonesIcon,
  TicketIcon,
  Inbox,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import { Link } from "wouter";

interface Ticket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  'Açık':       { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/40',   icon: AlertCircle,   label: 'Açık' },
  'Beklemede':  { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/40',  icon: Clock,         label: 'Beklemede' },
  'Cevaplandı': { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/40',  icon: CheckCircle,   label: 'Cevaplandı' },
  'Kapalı':     { color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/40',  icon: XCircle,       label: 'Kapalı' },
};

const priorityConfig: Record<string, { color: string; bg: string; border: string; bar: string }> = {
  'Düşük':  { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  bar: 'bg-green-500' },
  'Orta':   { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  bar: 'bg-amber-500' },
  'Yüksek': { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    bar: 'bg-red-500' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function UserTickets() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ subject: "", message: "", priority: "Orta" });

  const { data: tickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
    enabled: !!user
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.subject.trim()) throw new Error("Konu başlığı gerekli");
      if (!data.message.trim()) throw new Error("Mesaj gerekli");
      const response = await apiRequest('POST', '/api/tickets', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Destek talebiniz oluşturuldu." });
      setIsCreateDialogOpen(false);
      setFormData({ subject: "", message: "", priority: "Orta" });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter(t => t.status === 'Açık').length || 0,
    answered: tickets?.filter(t => t.status === 'Cevaplandı').length || 0,
    closed: tickets?.filter(t => t.status === 'Kapalı').length || 0,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <UserNavigation />

      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-slate-950 to-blue-950/30" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 py-10 max-w-5xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <HeadphonesIcon className="h-8 w-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Destek Merkezi</h1>
                <p className="text-slate-400 text-sm mt-0.5">AdeGloba Starlink · Teknik Destek</p>
              </div>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-900/30 transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Talep Oluştur
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <TicketIcon className="h-5 w-5 text-cyan-400" />
                    Yeni Destek Talebi
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-2">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">Konu Başlığı</label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                      placeholder="Sorunu kısaca özetleyin..."
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">Öncelik</label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData(p => ({ ...p, priority: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:border-cyan-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="Düşük" className="text-white focus:bg-slate-700">🟢 Düşük</SelectItem>
                        <SelectItem value="Orta" className="text-white focus:bg-slate-700">🟡 Orta</SelectItem>
                        <SelectItem value="Yüksek" className="text-white focus:bg-slate-700">🔴 Yüksek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">Mesajınız</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                      placeholder="Sorununuzu detaylıca açıklayın..."
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none focus:border-cyan-500"
                      rows={5}
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button
                      onClick={() => createTicketMutation.mutate(formData)}
                      disabled={createTicketMutation.isPending}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white flex-1 font-medium"
                    >
                      {createTicketMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Talebi Gönder
                    </Button>
                    <Button
                      onClick={() => setIsCreateDialogOpen(false)}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              { label: 'Toplam Talep', value: stats.total, color: 'text-slate-300', icon: TicketIcon },
              { label: 'Açık', value: stats.open, color: 'text-blue-400', icon: AlertCircle },
              { label: 'Cevaplandı', value: stats.answered, color: 'text-green-400', icon: CheckCircle },
              { label: 'Kapalı', value: stats.closed, color: 'text-slate-400', icon: XCircle },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <stat.icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                <div>
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {ticketsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            <span className="text-slate-400">Talepler yükleniyor...</span>
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="p-5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <Inbox className="h-10 w-10 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Henüz destek talebi yok</h3>
            <p className="text-slate-400 text-sm text-center max-w-xs">
              Bir sorunla karşılaştığınızda destek talebi oluşturabilirsiniz. Ekibimiz en kısa sürede yanıt verecektir.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="mt-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              İlk Talebi Oluştur
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-500 text-sm mb-5">{tickets.length} destek talebi listeleniyor</p>
            {tickets.map((ticket: Ticket) => {
              const sc = statusConfig[ticket.status] || statusConfig['Açık'];
              const pc = priorityConfig[ticket.priority] || priorityConfig['Orta'];
              const StatusIcon = sc.icon;

              return (
                <Link key={ticket.id} href={`/destek/${ticket.id}`}>
                  <div className="group relative bg-slate-900/70 border border-slate-800 hover:border-cyan-700/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:bg-slate-900 hover:shadow-lg hover:shadow-cyan-950/40">
                    {/* Priority bar */}
                    <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full ${pc.bar} opacity-60`} />

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pl-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${sc.color}`} />
                          <div>
                            <h3 className="text-white font-medium leading-snug group-hover:text-cyan-300 transition-colors line-clamp-1">
                              {ticket.subject}
                            </h3>
                            <p className="text-slate-500 text-xs mt-1">
                              #{ticket.id.slice(-8)} · {formatDate(ticket.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-6 sm:pl-0">
                        <Badge className={`${pc.bg} ${pc.color} ${pc.border} border text-xs px-2.5 py-0.5 font-normal`}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={`${sc.bg} ${sc.color} ${sc.border} border text-xs px-2.5 py-0.5 font-normal`}>
                          {sc.label}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-500 transition-colors ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
