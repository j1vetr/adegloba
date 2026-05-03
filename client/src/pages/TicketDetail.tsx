import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useRoute } from "wouter";
import {
  Loader2, Send, Clock, CheckCircle, AlertCircle, MessageCircle, XCircle,
  User, Shield, HeadphonesIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserShell from "@/components/UserShell";

interface TicketMessage { id: string; message: string; senderType: "user" | "admin"; senderName: string; createdAt: string; }
interface TicketDetail {
  ticket: { id: string; subject: string; priority: string; status: string; createdAt: string; updatedAt: string };
  messages: TicketMessage[];
}

const statusConfig: Record<string, { chip: string; icon: any; label: string }> = {
  "Açık":       { chip: "chip-info",    icon: AlertCircle, label: "Açık" },
  "Beklemede":  { chip: "chip-warning", icon: Clock,       label: "Beklemede" },
  "Cevaplandı": { chip: "chip-success", icon: CheckCircle, label: "Cevaplandı" },
  "Kapalı":     { chip: "chip-neutral", icon: XCircle,     label: "Kapalı" },
};
const priorityConfig: Record<string, { chip: string }> = {
  "Düşük":  { chip: "chip-success" },
  "Orta":   { chip: "chip-warning" },
  "Yüksek": { chip: "chip-danger" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function TicketDetail() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/destek/:ticketId");
  const [replyMessage, setReplyMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ticketId = params?.ticketId;

  const { data: ticketData, isLoading: ticketLoading, error } = useQuery<TicketDetail>({
    queryKey: ["/api/tickets", ticketId],
    enabled: !!user && !!ticketId,
    refetchInterval: 15000,
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [ticketData?.messages]);

  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!message.trim()) throw new Error("Mesaj boş olamaz");
      return (await apiRequest("POST", `/api/tickets/${ticketId}/messages`, { message: message.trim() })).json();
    },
    onSuccess: () => {
      setReplyMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: (error: Error) => toast({ title: "Hata", description: error.message, variant: "destructive" }),
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (replyMessage.trim()) replyMutation.mutate(replyMessage);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>;
  }

  const ticket = ticketData?.ticket;
  const messages = ticketData?.messages || [];
  const sc = ticket ? (statusConfig[ticket.status] || statusConfig["Açık"]) : statusConfig["Açık"];
  const pc = ticket ? (priorityConfig[ticket.priority] || priorityConfig["Orta"]) : priorityConfig["Orta"];
  const StatusIcon = sc.icon;
  const isClosed = ticket?.status === "Kapalı";

  return (
    <UserShell title="Destek Detayı" showBack backTo="/destek" hideBottomNav>
      <div className="flex flex-col gap-3 min-h-[calc(100vh-200px)]">
        {/* Header card */}
        {ticketLoading ? (
          <div className="user-card p-4 flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /><span className="text-slate-500 text-sm">Yükleniyor...</span></div>
        ) : ticket ? (
          <div className="user-card-elevated p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF6D6] flex items-center justify-center shrink-0">
                <HeadphonesIcon className="h-5 w-5 text-[#7C5E00]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-slate-900 leading-tight">{ticket.subject}</h1>
                <p className="text-slate-500 text-xs mt-0.5">#{ticket.id.slice(-8)} · {formatDate(ticket.createdAt)}</p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className={`chip ${pc.chip}`}>{ticket.priority}</span>
                  <span className={`chip ${sc.chip} inline-flex items-center gap-1`}><StatusIcon className="h-3 w-3" />{sc.label}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Messages */}
        <div className="user-card flex-1 p-4 overflow-y-auto">
          {ticketLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : error || !ticketData ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <AlertCircle className="h-9 w-9 text-rose-500" />
              <p className="text-slate-500 text-sm text-center">Talep bulunamadı veya erişim izniniz yok.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <MessageCircle className="h-9 w-9 text-slate-300" />
              <p className="text-slate-400 text-sm">Henüz mesaj yok.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">
                  Talep {formatDate(ticket!.createdAt)} tarihinde açıldı
                </div>
              </div>

              {messages.map((message, index) => {
                const isUser = message.senderType === "user";
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const sameDay = prevMsg && new Date(message.createdAt).toDateString() === new Date(prevMsg.createdAt).toDateString();

                return (
                  <div key={message.id}>
                    {!sameDay && index > 0 && (
                      <div className="flex justify-center my-3">
                        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">
                          {new Date(message.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                        </div>
                      </div>
                    )}
                    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5 ${isUser ? "bg-[#FFF6D6]" : "bg-slate-100"}`}>
                          {isUser ? <User className="h-3.5 w-3.5 text-[#7C5E00]" /> : <Shield className="h-3.5 w-3.5 text-slate-500" />}
                        </div>
                        <div className={`rounded-2xl px-3.5 py-2.5 ${isUser ? "bg-[#FFDD57] text-slate-900 rounded-br-md" : "bg-slate-100 text-slate-900 rounded-bl-md"}`}>
                          <div className={`text-xs font-semibold mb-1 ${isUser ? "text-slate-700" : "text-slate-500"}`}>
                            {isUser ? "Siz" : "Destek Ekibi"}
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                          <div className={`text-[10px] mt-1.5 ${isUser ? "text-slate-700/70 text-right" : "text-slate-500"}`}>
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Reply box */}
        <div className="user-card-elevated p-3 sticky bottom-2">
          {isClosed ? (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
              <XCircle className="h-4 w-4" /> Bu talep kapatılmıştır. Yeni yanıt gönderilemez.
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Yanıtınızı yazın... (Ctrl+Enter ile gönder)"
                className="user-input flex-1 px-3.5 py-2.5 text-sm resize-none min-h-[52px] max-h-32"
                rows={2}
              />
              <button
                onClick={() => replyMutation.mutate(replyMessage)}
                disabled={replyMutation.isPending || !replyMessage.trim()}
                className="h-[52px] w-[52px] rounded-xl bg-[#FFDD57] hover:brightness-95 text-slate-900 disabled:opacity-40 flex items-center justify-center shrink-0"
              >
                {replyMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </UserShell>
  );
}
