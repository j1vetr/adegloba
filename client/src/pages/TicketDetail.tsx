import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  XCircle,
  User,
  Shield,
  Satellite,
  HeadphonesIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";

interface TicketMessage {
  id: string;
  message: string;
  senderType: 'user' | 'admin';
  senderName: string;
  createdAt: string;
}

interface TicketDetail {
  ticket: {
    id: string;
    subject: string;
    priority: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  messages: TicketMessage[];
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  'Açık':       { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/40',   icon: AlertCircle,  label: 'Açık' },
  'Beklemede':  { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/40',  icon: Clock,        label: 'Beklemede' },
  'Cevaplandı': { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/40',  icon: CheckCircle,  label: 'Cevaplandı' },
  'Kapalı':     { color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/40',  icon: XCircle,      label: 'Kapalı' },
};

const priorityConfig: Record<string, { color: string; bg: string; border: string }> = {
  'Düşük':  { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  'Orta':   { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  'Yüksek': { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function TicketDetail() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [match, params] = useRoute("/destek/:ticketId");
  const [replyMessage, setReplyMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ticketId = params?.ticketId;

  const { data: ticketData, isLoading: ticketLoading, error } = useQuery<TicketDetail>({
    queryKey: ['/api/tickets', ticketId],
    enabled: !!user && !!ticketId,
    refetchInterval: 15000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketData?.messages]);

  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!message.trim()) throw new Error("Mesaj boş olamaz");
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/messages`, { message: message.trim() });
      return response.json();
    },
    onSuccess: () => {
      setReplyMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (replyMessage.trim()) replyMutation.mutate(replyMessage);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  const ticket = ticketData?.ticket;
  const messages = ticketData?.messages || [];
  const sc = ticket ? (statusConfig[ticket.status] || statusConfig['Açık']) : statusConfig['Açık'];
  const pc = ticket ? (priorityConfig[ticket.priority] || priorityConfig['Orta']) : priorityConfig['Orta'];
  const StatusIcon = sc.icon;
  const isClosed = ticket?.status === 'Kapalı';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <UserNavigation />

      {/* Header */}
      <div className="relative border-b border-slate-800 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/30 via-slate-950 to-slate-950" />
        <div className="relative container mx-auto px-4 py-5 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/destek">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Talepler
              </Button>
            </Link>
          </div>

          {ticketLoading ? (
            <div className="h-14 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              <span className="text-slate-400 text-sm">Yükleniyor...</span>
            </div>
          ) : ticket ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                  <HeadphonesIcon className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white leading-tight">{ticket.subject}</h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    #{ticket.id.slice(-8)} · {formatDate(ticket.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pl-10 sm:pl-0">
                <Badge className={`${pc.bg} ${pc.color} ${pc.border} border text-xs`}>{ticket.priority}</Badge>
                <Badge className={`${sc.bg} ${sc.color} ${sc.border} border text-xs flex items-center gap-1`}>
                  <StatusIcon className="h-3 w-3" />
                  {sc.label}
                </Badge>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {ticketLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
          ) : error || !ticketData ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-slate-400">Talep bulunamadı veya erişim izniniz yok.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <MessageCircle className="h-10 w-10 text-slate-600" />
              <p className="text-slate-500 text-sm">Henüz mesaj yok.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Ticket opened notice */}
              <div className="flex justify-center">
                <div className="text-xs text-slate-600 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5">
                  Talep {formatDate(ticket!.createdAt)} tarihinde açıldı
                </div>
              </div>

              {messages.map((message, index) => {
                const isUser = message.senderType === 'user';
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const sameDay = prevMsg && new Date(message.createdAt).toDateString() === new Date(prevMsg.createdAt).toDateString();

                return (
                  <div key={message.id}>
                    {!sameDay && index > 0 && (
                      <div className="flex justify-center my-4">
                        <div className="text-xs text-slate-600 bg-slate-900 border border-slate-800 rounded-full px-4 py-1">
                          {new Date(message.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                        </div>
                      </div>
                    )}

                    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5 ${
                          isUser
                            ? 'bg-cyan-600/20 border border-cyan-500/30'
                            : 'bg-purple-600/20 border border-purple-500/30'
                        }`}>
                          {isUser
                            ? <User className="h-3.5 w-3.5 text-cyan-400" />
                            : <Shield className="h-3.5 w-3.5 text-purple-400" />
                          }
                        </div>

                        {/* Bubble */}
                        <div className={`rounded-2xl px-4 py-3 ${
                          isUser
                            ? 'bg-cyan-600/20 border border-cyan-500/25 rounded-br-md'
                            : 'bg-slate-800/80 border border-slate-700/60 rounded-bl-md'
                        }`}>
                          <div className={`text-xs font-medium mb-1.5 ${isUser ? 'text-cyan-400' : 'text-purple-400'}`}>
                            {isUser ? 'Siz' : '🛡 Destek Ekibi'}
                          </div>
                          <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                            {message.message}
                          </p>
                          <div className={`text-xs mt-2 ${isUser ? 'text-cyan-700 text-right' : 'text-slate-600'}`}>
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
      </div>

      {/* Reply Box */}
      <div className="shrink-0 border-t border-slate-800 bg-slate-950">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          {isClosed ? (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
              <XCircle className="h-4 w-4" />
              Bu talep kapatılmıştır. Yeni yanıt gönderilemez.
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Yanıtınızı yazın... (Ctrl+Enter ile gönder)"
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 resize-none focus:border-cyan-600 rounded-xl pr-4 min-h-[52px] max-h-36"
                  rows={2}
                />
              </div>
              <Button
                onClick={() => replyMutation.mutate(replyMessage)}
                disabled={replyMutation.isPending || !replyMessage.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white h-[52px] w-[52px] rounded-xl p-0 shrink-0 shadow-lg shadow-cyan-950/40 disabled:opacity-40"
              >
                {replyMutation.isPending
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <Send className="h-5 w-5" />
                }
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
