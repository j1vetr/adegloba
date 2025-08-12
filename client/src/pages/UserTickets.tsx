import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  HelpCircle, 
  Plus,
  MessageSquare,
  Clock,
  Send,
  Paperclip,
  Eye
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserNavigation } from "@/components/UserNavigation";
import { useUserAuth } from "@/hooks/useUserAuth";

interface UserTicket {
  id: string;
  subject: string;
  priority: 'Düşük' | 'Orta' | 'Yüksek';
  status: 'Açık' | 'Beklemede' | 'Kapalı';
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageAt: string;
  hasUnreadAdmin: boolean;
}

interface TicketMessage {
  id: string;
  message: string;
  senderType: 'user' | 'admin';
  senderName: string;
  createdAt: string;
  attachments?: Array<{
    id: string;
    filename: string;
    fileUrl: string;
    fileSize: number;
  }>;
}

const priorityColors = {
  'Düşük': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Orta': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Yüksek': 'bg-red-500/10 text-red-400 border-red-500/20'
};

const statusColors = {
  'Açık': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Beklemede': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Kapalı': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
};

export default function UserTickets() {
  const { user, isAuthenticated } = useUserAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    priority: "Orta"
  });
  const [replyMessage, setReplyMessage] = useState("");

  // Fetch user tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/tickets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tickets');
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Fetch ticket messages
  const { data: ticketMessages = [] } = useQuery({
    queryKey: ['/api/tickets', selectedTicket?.id, 'messages'],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const response = await apiRequest('GET', `/api/tickets/${selectedTicket.id}/messages`);
      return response.json();
    },
    enabled: !!selectedTicket
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof newTicket) => {
      const response = await apiRequest('POST', '/api/tickets', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      setNewTicket({ subject: "", message: "", priority: "Orta" });
      setShowCreateDialog(false);
      toast({
        title: "Başarılı",
        description: "Destek talebi oluşturuldu",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Talep oluşturulamadı",
        variant: "destructive",
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; attachments?: string[] }) => {
      if (!selectedTicket) throw new Error("No ticket selected");
      const response = await apiRequest('POST', `/api/tickets/${selectedTicket.id}/messages`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', selectedTicket?.id, 'messages'] });
      setReplyMessage("");
      toast({
        title: "Başarılı",
        description: "Mesaj gönderildi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi",
        variant: "destructive",
      });
    }
  });

  // File upload handlers
  const handleAttachmentUpload = async () => {
    return {
      method: "PUT" as const,
      url: "placeholder-url"
    };
  };

  const handleAttachmentComplete = (result: any) => {
    console.log("Upload completed:", result);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const handleViewTicket = (ticket: UserTicket) => {
    setSelectedTicket(ticket);
    setShowTicketDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Destek</h1>
            <p className="text-slate-400 mt-1">Destek taleplerini yönetin</p>
          </div>
          
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-lg shadow-blue-500/25 neon-glow"
            data-testid="button-create-ticket"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Talep Oluştur
          </Button>
        </div>

        {/* Tickets List */}
        <Card className="bg-slate-900/80 backdrop-blur border-slate-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Destek Taleplerim
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">Henüz destek talebiniz bulunmuyor</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  İlk Talebinizi Oluşturun
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket: UserTicket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => handleViewTicket(ticket)}
                    data-testid={`card-ticket-${ticket.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-white mb-1">{ticket.subject}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {ticket.messageCount} mesaj
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDate(ticket.updatedAt)}
                              </div>
                            </div>
                          </div>
                          {ticket.hasUnreadAdmin && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={priorityColors[ticket.priority]}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={statusColors[ticket.status]}>
                          {ticket.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTicket(ticket);
                          }}
                          className="border-slate-600 text-slate-300 hover:text-white hover:border-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Ticket Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Yeni Destek Talebi</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Konu</Label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Talebinizin konusunu yazın"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  data-testid="input-ticket-subject"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Öncelik</Label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-ticket-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Düşük" className="text-white focus:bg-primary/20">Düşük</SelectItem>
                    <SelectItem value="Orta" className="text-white focus:bg-primary/20">Orta</SelectItem>
                    <SelectItem value="Yüksek" className="text-white focus:bg-primary/20">Yüksek</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Mesaj</Label>
                <Textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  placeholder="Sorununuzu detaylı olarak açıklayın..."
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 min-h-[120px]"
                  data-testid="textarea-ticket-message"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="border-slate-600 text-slate-300 hover:text-white"
                >
                  İptal
                </Button>
                <Button
                  onClick={() => createTicketMutation.mutate(newTicket)}
                  disabled={!newTicket.subject.trim() || !newTicket.message.trim() || createTicketMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  data-testid="button-submit-ticket"
                >
                  {createTicketMutation.isPending ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : null}
                  Talep Oluştur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ticket Detail Dialog */}
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">
                {selectedTicket?.subject}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedTicket && (
                <>
                  {/* Ticket Info */}
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge className={priorityColors[selectedTicket.priority]}>
                        {selectedTicket.priority}
                      </Badge>
                      <Badge className={statusColors[selectedTicket.status]}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-400">
                      {formatDate(selectedTicket.createdAt)} tarihinde oluşturuldu
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {ticketMessages.map((message: TicketMessage) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg ${
                          message.senderType === 'admin' 
                            ? 'bg-primary/10 border-l-4 border-primary ml-8' 
                            : 'bg-slate-800/50 border-l-4 border-slate-600 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {message.senderName}
                            </span>
                            <Badge variant="outline">
                              {message.senderType === 'admin' ? 'Yönetici' : 'Sen'}
                            </Badge>
                          </div>
                          <span className="text-sm text-slate-400">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-300 whitespace-pre-wrap">{message.message}</p>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {message.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <Paperclip className="h-4 w-4" />
                                {attachment.filename}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  {selectedTicket.status !== 'Kapalı' && (
                    <div className="space-y-4 border-t border-slate-700 pt-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Yanıt</Label>
                        <Textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Yanıtınızı yazın..."
                          className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
                          data-testid="textarea-reply-message"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">Dosya Ekle</Label>
                        <ObjectUploader
                          maxNumberOfFiles={3}
                          maxFileSize={10485760}
                          onGetUploadParameters={handleAttachmentUpload}
                          onComplete={handleAttachmentComplete}
                          buttonClassName="border-slate-600 text-slate-300 hover:text-white hover:border-primary"
                        >
                          <Paperclip className="h-4 w-4 mr-2" />
                          Dosya Seç
                        </ObjectUploader>
                        <p className="text-xs text-slate-500">
                          PDF, PNG, JPG dosyaları desteklenir. Max 10MB, 3 dosya.
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => sendMessageMutation.mutate({ message: replyMessage })}
                          disabled={!replyMessage.trim() || sendMessageMutation.isPending}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                          data-testid="button-send-message"
                        >
                          {sendMessageMutation.isPending ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Gönder
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}