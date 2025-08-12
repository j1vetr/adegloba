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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  ArrowLeft,
  MessageSquare,
  Clock,
  User,
  Ship,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Paperclip,
  SortAsc,
  SortDesc,
  Calendar,
  Loader2
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
  userFullName?: string;
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
  'Düşük': 'bg-green-600/20 text-green-400 border-green-500/30',
  'Orta': 'bg-orange-600/20 text-orange-400 border-orange-500/30',
  'Yüksek': 'bg-red-600/20 text-red-400 border-red-500/30'
};

const statusColors = {
  'Açık': 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  'Beklemede': 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  'Kapalı': 'bg-gray-600/20 text-gray-400 border-gray-500/30'
};

export default function TicketManagement() {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterShip, setFilterShip] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [replyMessage, setReplyMessage] = useState('');

  // Fetch tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/admin/tickets'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch ticket details and messages
  const { data: ticketDetail, isLoading: detailLoading } = useQuery<{ticket: Ticket, messages: TicketMessage[]}>({
    queryKey: ['/api/admin/tickets', selectedTicket, 'messages'],
    enabled: !!selectedTicket,
    refetchInterval: 5000, // Refresh every 5 seconds when viewing a ticket
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async (data: { ticketId: string; message: string }) => {
      const response = await apiRequest('POST', `/api/admin/tickets/${data.ticketId}/messages`, {
        message: data.message
      });
      return response;
    },
    onSuccess: () => {
      setReplyMessage('');
      toast({
        title: "Yanıt Gönderildi",
        description: "Yanıtınız başarıyla gönderildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickets', selectedTicket, 'messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Yanıt gönderilirken hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Update priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async (data: { ticketId: string; priority: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/tickets/${data.ticketId}/priority`, {
        priority: data.priority
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Öncelik Güncellendi",
        description: "Ticket önceliği başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickets', selectedTicket, 'messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Öncelik güncellenirken hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { ticketId: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/tickets/${data.ticketId}/status`, {
        status: data.status
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Durum Güncellendi",
        description: "Ticket durumu başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickets', selectedTicket, 'messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Durum güncellenirken hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Filter and sort tickets
  const filteredTickets = tickets.filter((ticket: Ticket) => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesShip = filterShip === 'all' || ticket.shipName === filterShip;
    const matchesSearch = searchTerm === '' || 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesShip && matchesSearch;
  }).sort((a: Ticket, b: Ticket) => {
    const aValue = a[sortBy as keyof Ticket] || '';
    const bValue = b[sortBy as keyof Ticket] || '';
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Get unique ships for filter
  const uniqueShips = Array.from(new Set(tickets.map((ticket: Ticket) => ticket.shipName).filter(Boolean)));

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    sendReplyMutation.mutate({
      ticketId: selectedTicket,
      message: replyMessage.trim()
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    if (diffInHours < 48) return 'Dün';
    return Math.floor(diffInHours / 24) + ' gün önce';
  };

  if (selectedTicket && ticketDetail) {
    const ticket = ticketDetail.ticket;
    const messages = ticketDetail.messages;

    return (
      <AdminLayout title="Ticket Detayı">
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                onClick={() => setSelectedTicket(null)}
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                data-testid="button-back-to-list"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ticket Listesine Dön
              </Button>
              <div className="h-6 w-px bg-cyan-500/30" />
              <h1 className="text-3xl font-bold text-white">
                Ticket Detayı - #{ticket.id.slice(0, 8)}
              </h1>
            </div>

            {/* Ticket Metadata */}
            <Card className="bg-slate-800/80 border-cyan-500/30 shadow-2xl shadow-cyan-500/10 mb-8">
              <CardHeader className="border-b border-cyan-500/20">
                <CardTitle className="text-cyan-400 text-xl">Ticket Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-cyan-300 text-sm font-medium">Konu</Label>
                    <p className="text-white font-medium" data-testid="text-ticket-subject">{ticket.subject}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyan-300 text-sm font-medium">Kullanıcı</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-cyan-400" />
                      <div className="flex flex-col">
                        <span className="text-white" data-testid="text-username">{ticket.userFullName || ticket.userName}</span>
                        <span className="text-xs text-slate-400">@{ticket.userName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyan-300 text-sm font-medium">Gemi</Label>
                    <div className="flex items-center gap-2">
                      <Ship className="h-4 w-4 text-cyan-400" />
                      <span className="text-white" data-testid="text-ship-name">{ticket.shipName || 'Atanmamış'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyan-300 text-sm font-medium">Öncelik</Label>
                    <Select
                      value={ticket.priority}
                      onValueChange={(value) => updatePriorityMutation.mutate({ ticketId: ticket.id, priority: value })}
                      data-testid="select-priority"
                    >
                      <SelectTrigger className="bg-slate-700 border-cyan-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Düşük">
                          <Badge className={priorityColors['Düşük']}>Düşük</Badge>
                        </SelectItem>
                        <SelectItem value="Orta">
                          <Badge className={priorityColors['Orta']}>Orta</Badge>
                        </SelectItem>
                        <SelectItem value="Yüksek">
                          <Badge className={priorityColors['Yüksek']}>Yüksek</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyan-300 text-sm font-medium">Durum</Label>
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => updateStatusMutation.mutate({ ticketId: ticket.id, status: value })}
                      data-testid="select-status"
                    >
                      <SelectTrigger className="bg-slate-700 border-cyan-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Açık">
                          <Badge className={statusColors['Açık']}>Açık</Badge>
                        </SelectItem>
                        <SelectItem value="Beklemede">
                          <Badge className={statusColors['Beklemede']}>Beklemede</Badge>
                        </SelectItem>
                        <SelectItem value="Kapalı">
                          <Badge className={statusColors['Kapalı']}>Kapalı</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyan-300 text-sm font-medium">Oluşturulma Tarihi</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-cyan-400" />
                      <span className="text-white" data-testid="text-created-date">{formatDate(ticket.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversation */}
            <Card className="bg-slate-800/80 border-cyan-500/30 shadow-2xl shadow-cyan-500/10 mb-8">
              <CardHeader className="border-b border-cyan-500/20">
                <CardTitle className="text-cyan-400 text-xl">Konuşma Geçmişi</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6 max-h-96 overflow-y-auto" data-testid="conversation-history">
                  {messages.map((message: TicketMessage) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${
                        message.senderType === 'admin' 
                          ? 'bg-cyan-600/20 border-cyan-500/30' 
                          : 'bg-slate-700/50 border-slate-600/30'
                      } border rounded-lg p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm font-medium ${
                            message.senderType === 'admin' ? 'text-cyan-400' : 'text-slate-300'
                          }`}>
                            {message.senderType === 'admin' ? 'Admin' : message.senderName}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-white whitespace-pre-wrap" data-testid={`message-${message.id}`}>
                          {message.message}
                        </p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2 text-sm">
                                <Paperclip className="h-4 w-4 text-cyan-400" />
                                <a 
                                  href={attachment.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 underline"
                                  data-testid={`attachment-${attachment.id}`}
                                >
                                  {attachment.filename}
                                </a>
                                <span className="text-slate-400">
                                  ({Math.round(attachment.fileSize / 1024)} KB)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reply Box */}
            <Card className="bg-slate-800/80 border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
              <CardHeader className="border-b border-cyan-500/20">
                <CardTitle className="text-cyan-400 text-xl">Yanıt Gönder</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Yanıtınızı buraya yazın..."
                    className="min-h-[120px] bg-slate-700 border-cyan-500/30 text-white placeholder:text-slate-400 resize-none"
                    data-testid="textarea-reply"
                  />
                  <div className="flex justify-between items-center">
                    <ObjectUploader
                      maxNumberOfFiles={5}
                      maxFileSize={10485760}
                      onGetUploadParameters={async () => {
                        try {
                          const response = await apiRequest('POST', '/api/objects/upload');
                          return {
                            method: 'PUT' as const,
                            url: (response as any).uploadURL,
                          };
                        } catch (error) {
                          console.error('Upload error:', error);
                          throw new Error('Failed to get upload URL');
                        }
                      }}
                      onComplete={(result) => {
                        // Handle attachment upload
                      }}
                      buttonClassName="bg-slate-700 border-cyan-500/30 text-cyan-400 hover:bg-cyan-400/10"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Dosya Ekle
                    </ObjectUploader>
                    
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      data-testid="button-send-reply"
                    >
                      {sendReplyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Yanıt Gönder
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Destek Talepleri Yönetimi">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Destek Talepleri Yönetimi
              </h1>
              <p className="text-cyan-300">
                Kullanıcı destek taleplerini görüntüleyin ve yönetin
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-cyan-400" />
              <span className="text-xl font-semibold text-cyan-400" data-testid="text-ticket-count">
                {Array.isArray(tickets) ? tickets.length : 0} Toplam Ticket
              </span>
            </div>
          </div>

          {/* Filters */}
          <Card className="bg-slate-800/80 border-cyan-500/30 shadow-2xl shadow-cyan-500/10 mb-8">
            <CardHeader className="border-b border-cyan-500/20">
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtreler ve Arama
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="text-cyan-300">Durum</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus} data-testid="filter-status">
                    <SelectTrigger className="bg-slate-700 border-cyan-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="Açık">Açık</SelectItem>
                      <SelectItem value="Beklemede">Beklemede</SelectItem>
                      <SelectItem value="Kapalı">Kapalı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-cyan-300">Öncelik</Label>
                  <Select value={filterPriority} onValueChange={setFilterPriority} data-testid="filter-priority">
                    <SelectTrigger className="bg-slate-700 border-cyan-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="Düşük">Düşük</SelectItem>
                      <SelectItem value="Orta">Orta</SelectItem>
                      <SelectItem value="Yüksek">Yüksek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-cyan-300">Gemi</Label>
                  <Select value={filterShip} onValueChange={setFilterShip} data-testid="filter-ship">
                    <SelectTrigger className="bg-slate-700 border-cyan-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {uniqueShips.map((ship) => (
                        <SelectItem key={ship} value={ship!}>{ship}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-cyan-300">Arama</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cyan-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Ticket ID, konu veya kullanıcı..."
                      className="pl-10 bg-slate-700 border-cyan-500/30 text-white placeholder:text-slate-400"
                      data-testid="input-search"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card className="bg-slate-800/80 border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
            <CardHeader className="border-b border-cyan-500/20">
              <CardTitle className="text-cyan-400 text-xl">Ticket Listesi</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ticketsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  <span className="ml-2 text-cyan-300">Yükleniyor...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-cyan-500/20 hover:bg-slate-700/50">
                        <TableHead 
                          className="text-cyan-300 cursor-pointer select-none"
                          onClick={() => handleSort('id')}
                          data-testid="sort-ticket-id"
                        >
                          <div className="flex items-center gap-2">
                            Ticket ID
                            {sortBy === 'id' && (
                              sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-cyan-300 cursor-pointer select-none"
                          onClick={() => handleSort('subject')}
                          data-testid="sort-subject"
                        >
                          <div className="flex items-center gap-2">
                            Konu
                            {sortBy === 'subject' && (
                              sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-cyan-300">Öncelik</TableHead>
                        <TableHead className="text-cyan-300">Durum</TableHead>
                        <TableHead 
                          className="text-cyan-300 cursor-pointer select-none"
                          onClick={() => handleSort('userName')}
                          data-testid="sort-username"
                        >
                          <div className="flex items-center gap-2">
                            Kullanıcı
                            {sortBy === 'userName' && (
                              sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-cyan-300">Gemi</TableHead>
                        <TableHead 
                          className="text-cyan-300 cursor-pointer select-none"
                          onClick={() => handleSort('updatedAt')}
                          data-testid="sort-updated"
                        >
                          <div className="flex items-center gap-2">
                            Son Güncelleme
                            {sortBy === 'updatedAt' && (
                              sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket: Ticket) => (
                        <TableRow 
                          key={ticket.id}
                          className="border-cyan-500/20 hover:bg-slate-700/30 cursor-pointer transition-colors"
                          onClick={() => setSelectedTicket(ticket.id)}
                          data-testid={`ticket-row-${ticket.id}`}
                        >
                          <TableCell className="text-cyan-400 font-mono text-sm">
                            #{ticket.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-white font-medium max-w-xs truncate">
                            {ticket.subject}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${priorityColors[ticket.priority]} border font-medium`}>
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[ticket.status]} border font-medium`}>
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="flex flex-col">
                              <span className="font-medium">{ticket.userFullName || ticket.userName}</span>
                              <span className="text-xs text-slate-400">@{ticket.userName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-cyan-300">
                            {ticket.shipName || (
                              <span className="text-slate-400 italic">Atanmamış</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatRelativeTime(ticket.updatedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredTickets.length === 0 && (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Filtre kriterlerine uygun ticket bulunamadı.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}