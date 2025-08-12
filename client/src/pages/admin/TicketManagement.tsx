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
  Search, 
  Filter, 
  Eye,
  MessageSquare,
  Clock,
  User,
  Ship,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Paperclip
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface Ticket {
  id: string;
  subject: string;
  priority: 'Düşük' | 'Orta' | 'Yüksek';
  status: 'Açık' | 'Beklemede' | 'Kapalı';
  userName: string;
  userEmail: string;
  shipName?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageAt: string;
  assignedAdminName?: string;
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

export default function TicketManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const { toast } = useToast();

  // Fetch tickets with filters
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/admin/tickets', search, statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      
      const response = await apiRequest('GET', `/api/admin/tickets?${params}`);
      return response.json();
    }
  });

  // Fetch ticket messages
  const { data: ticketMessages = [] } = useQuery({
    queryKey: ['/api/admin/tickets', selectedTicket?.id, 'messages'],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const response = await apiRequest('GET', `/api/admin/tickets/${selectedTicket.id}/messages`);
      return response.json();
    },
    enabled: !!selectedTicket
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async (data: { message: string; attachments?: string[] }) => {
      if (!selectedTicket) throw new Error("No ticket selected");
      return apiRequest('POST', `/api/admin/tickets/${selectedTicket.id}/messages`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickets'] });
      setReplyMessage("");
      setShowReplyDialog(false);
      toast({
        title: "Başarılı",
        description: "Yanıt gönderildi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Yanıt gönderilemedi",
        variant: "destructive",
      });
    }
  });

  // Update ticket status
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { ticketId: string; status: string }) => {
      return apiRequest('PUT', `/api/admin/tickets/${data.ticketId}/status`, { status: data.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickets'] });
      toast({
        title: "Başarılı",
        description: "Durum güncellendi",
      });
    }
  });

  // File upload handlers
  const handleAttachmentUpload = async () => {
    // Implementation for file upload
    return {
      method: "PUT" as const,
      url: "placeholder-url"
    };
  };

  const handleAttachmentComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    // Handle completed upload
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

  const filteredTickets = tickets.filter((ticket: Ticket) => {
    const matchesSearch = search === "" || 
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(search.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <AdminLayout title="Destek Talepleri">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Destek Talepleri</h1>
            <p className="text-slate-400 mt-1">Kullanıcı destek taleplerini yönetin</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="admin-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Arama</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Başlık, kullanıcı adı, e-posta..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="admin-input pl-10"
                    data-testid="input-ticket-search"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Durum</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="admin-input" data-testid="select-status-filter">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white focus:bg-primary/20">Tümü</SelectItem>
                    <SelectItem value="Açık" className="text-white focus:bg-primary/20">Açık</SelectItem>
                    <SelectItem value="Beklemede" className="text-white focus:bg-primary/20">Beklemede</SelectItem>
                    <SelectItem value="Kapalı" className="text-white focus:bg-primary/20">Kapalı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Öncelik</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="admin-input" data-testid="select-priority-filter">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white focus:bg-primary/20">Tümü</SelectItem>
                    <SelectItem value="Düşük" className="text-white focus:bg-primary/20">Düşük</SelectItem>
                    <SelectItem value="Orta" className="text-white focus:bg-primary/20">Orta</SelectItem>
                    <SelectItem value="Yüksek" className="text-white focus:bg-primary/20">Yüksek</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <span className="text-sm text-slate-400">
                  {filteredTickets.length} talepte {filteredTickets.filter((t: Ticket) => t.status === 'Açık').length} açık
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card className="admin-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">Destek talebi bulunamadı</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="admin-table-header">
                      <tr>
                        <th className="admin-table-cell text-left">Talep</th>
                        <th className="admin-table-cell text-left">Kullanıcı</th>
                        <th className="admin-table-cell text-left">Gemi</th>
                        <th className="admin-table-cell text-left">Öncelik</th>
                        <th className="admin-table-cell text-left">Durum</th>
                        <th className="admin-table-cell text-left">Son Güncelleme</th>
                        <th className="admin-table-cell text-left">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((ticket: Ticket) => (
                        <tr key={ticket.id} className="admin-table-row">
                          <td className="admin-table-cell">
                            <div>
                              <p className="font-medium text-white">{ticket.subject}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <MessageSquare className="h-4 w-4 text-slate-400" />
                                <span className="text-sm text-slate-400">{ticket.messageCount} mesaj</span>
                              </div>
                            </div>
                          </td>
                          <td className="admin-table-cell">
                            <div>
                              <p className="font-medium text-white">{ticket.userName}</p>
                              <p className="text-sm text-slate-400">{ticket.userEmail}</p>
                            </div>
                          </td>
                          <td className="admin-table-cell">
                            <span className="text-slate-300">{ticket.shipName || '-'}</span>
                          </td>
                          <td className="admin-table-cell">
                            <Badge className={priorityColors[ticket.priority]}>
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td className="admin-table-cell">
                            <Badge className={statusColors[ticket.status]}>
                              {ticket.status}
                            </Badge>
                          </td>
                          <td className="admin-table-cell">
                            <span className="text-slate-300">{formatDate(ticket.updatedAt)}</span>
                          </td>
                          <td className="admin-table-cell">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedTicket(ticket)}
                                className="admin-button-outline"
                                data-testid={`button-view-ticket-${ticket.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {ticket.status !== 'Kapalı' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setShowReplyDialog(true);
                                  }}
                                  className="admin-button"
                                  data-testid={`button-reply-ticket-${ticket.id}`}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden">
                  {filteredTickets.map((ticket: Ticket) => (
                    <div key={ticket.id} className="border-b border-slate-700 p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-white pr-2">{ticket.subject}</h3>
                          <div className="flex flex-col gap-1">
                            <Badge className={priorityColors[ticket.priority]}>
                              {ticket.priority}
                            </Badge>
                            <Badge className={statusColors[ticket.status]}>
                              {ticket.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-300">{ticket.userName}</span>
                          </div>
                          {ticket.shipName && (
                            <div className="flex items-center gap-2">
                              <Ship className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-300">{ticket.shipName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-400">{formatDate(ticket.updatedAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTicket(ticket)}
                            className="admin-button-outline flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Görüntüle
                          </Button>
                          {ticket.status !== 'Kapalı' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setShowReplyDialog(true);
                              }}
                              className="admin-button flex-1"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Yanıtla
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Detail Dialog */}
        <Dialog open={!!selectedTicket && !showReplyDialog} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] admin-dialog">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">
                Talep Detayı - {selectedTicket?.subject}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {selectedTicket && (
                <>
                  {/* Ticket Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <Label className="text-slate-400 text-sm">Kullanıcı</Label>
                      <p className="text-white font-medium">{selectedTicket.userName}</p>
                      <p className="text-slate-400 text-sm">{selectedTicket.userEmail}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Öncelik & Durum</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={priorityColors[selectedTicket.priority]}>
                          {selectedTicket.priority}
                        </Badge>
                        <Badge className={statusColors[selectedTicket.status]}>
                          {selectedTicket.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Gemi</Label>
                      <p className="text-white">{selectedTicket.shipName || 'Atanmamış'}</p>
                    </div>
                  </div>

                  {/* Status Actions */}
                  {selectedTicket.status !== 'Kapalı' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({
                          ticketId: selectedTicket.id,
                          status: 'Beklemede'
                        })}
                        className="admin-button-outline"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Beklemeye Al
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({
                          ticketId: selectedTicket.id,
                          status: 'Kapalı'
                        })}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Kapat
                      </Button>
                    </div>
                  )}

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
                              {message.senderType === 'admin' ? 'Yönetici' : 'Kullanıcı'}
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

                  {/* Quick Reply Button */}
                  {selectedTicket.status !== 'Kapalı' && (
                    <Button
                      onClick={() => setShowReplyDialog(true)}
                      className="admin-button w-full"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Yanıt Gönder
                    </Button>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Reply Dialog */}
        <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
          <DialogContent className="max-w-2xl admin-dialog">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">
                Yanıt Gönder - {selectedTicket?.subject}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Mesaj</Label>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Yanıtınızı yazın..."
                  className="admin-input min-h-[120px]"
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
                  buttonClassName="admin-button-outline"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Dosya Seç
                </ObjectUploader>
                <p className="text-xs text-slate-500">
                  PDF, PNG, JPG dosyaları desteklenir. Max 10MB, 3 dosya.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReplyDialog(false);
                    setReplyMessage("");
                  }}
                  className="admin-button-outline"
                >
                  İptal
                </Button>
                <Button
                  onClick={() => sendReplyMutation.mutate({ message: replyMessage })}
                  disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                  className="admin-button"
                  data-testid="button-send-reply"
                >
                  {sendReplyMutation.isPending ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Gönder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}