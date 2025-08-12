import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Calendar,
  User,
  Ship
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";

interface Ticket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserTickets() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "Orta"
  });

  // Fetch user tickets
  const { data: tickets, isLoading: ticketsLoading, error } = useQuery({
    queryKey: ['/api/tickets'],
    enabled: !!user
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.subject.trim()) {
        throw new Error("Konu başlığı gerekli");
      }
      if (!data.message.trim()) {
        throw new Error("Mesaj gerekli");
      }

      const response = await apiRequest('POST', '/api/tickets', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Destek talebiniz oluşturuldu.",
      });
      setIsCreateDialogOpen(false);
      setFormData({
        subject: "",
        message: "",
        priority: "Orta"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Destek talebi oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateTicket = () => {
    createTicketMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Açık':
        return <AlertCircle className="h-4 w-4 text-green-400" />;
      case 'Beklemede':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'Kapalı':
        return <CheckCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <MessageCircle className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Açık':
        return "bg-green-600/20 text-green-400 border-green-500/30";
      case 'Beklemede':
        return "bg-yellow-600/20 text-yellow-400 border-yellow-500/30";
      case 'Kapalı':
        return "bg-gray-600/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-cyan-600/20 text-cyan-400 border-cyan-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Yüksek':
        return "bg-red-600/20 text-red-400 border-red-500/30";
      case 'Orta':
        return "bg-orange-600/20 text-orange-400 border-orange-500/30";
      case 'Düşük':
        return "bg-blue-600/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-600/20 text-gray-400 border-gray-500/30";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="flex items-center gap-2 text-cyan-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-semibold mb-2">Kullanıcı bulunamadı</h2>
          <p className="text-gray-400">Lütfen giriş yapın.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <UserNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                AdeGloba Starlink System - Destek
              </h1>
              <p className="text-gray-400">
                Destek taleplerinizi görüntüleyin ve yeni talep oluşturun
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  data-testid="button-create-ticket"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Destek Talebi
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-cyan-500/30 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-cyan-400">Yeni Destek Talebi Oluştur</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Konu Başlığı
                    </label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Sorun başlığını kısaca açıklayın"
                      className="bg-gray-800/50 border-cyan-500/30 text-white"
                      data-testid="input-ticket-subject"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Öncelik Seviyesi
                    </label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                      <SelectTrigger className="bg-gray-800/50 border-cyan-500/30 text-white" data-testid="select-ticket-priority">
                        <SelectValue placeholder="Öncelik seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-cyan-500/30">
                        <SelectItem value="Düşük" className="text-white hover:bg-gray-700">Düşük</SelectItem>
                        <SelectItem value="Orta" className="text-white hover:bg-gray-700">Orta</SelectItem>
                        <SelectItem value="Yüksek" className="text-white hover:bg-gray-700">Yüksek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Mesaj
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Sorununuzu detaylarıyla açıklayın"
                      className="bg-gray-800/50 border-cyan-500/30 text-white resize-none"
                      rows={6}
                      data-testid="input-ticket-message"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={handleCreateTicket}
                      disabled={createTicketMutation.isPending}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white flex-1"
                      data-testid="button-submit-ticket"
                    >
                      {createTicketMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Talep Oluştur
                    </Button>
                    <Button
                      onClick={() => setIsCreateDialogOpen(false)}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      data-testid="button-cancel-ticket"
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tickets List */}
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-cyan-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Destek talepleri yükleniyor...</span>
              </div>
            </div>
          ) : error ? (
            <Card className="bg-gray-900/50 border-red-500/30">
              <CardContent className="p-8 text-center">
                <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Yükleme Hatası</h3>
                <p className="text-gray-400">Destek talepleri yüklenirken bir hata oluştu.</p>
              </CardContent>
            </Card>
          ) : !tickets || tickets.length === 0 ? (
            <Card className="bg-gray-900/50 border-cyan-500/30">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Henüz Destek Talebi Yok</h3>
                <p className="text-gray-400 mb-4">
                  Henüz hiç destek talebi oluşturmadınız. İhtiyacınız olduğunda yeni bir talep oluşturabilirsiniz.
                </p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  data-testid="button-create-first-ticket"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Talebi Oluştur
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {tickets.map((ticket: Ticket) => (
                <Card key={ticket.id} className="bg-gray-900/50 border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-colors">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg mb-2 flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          {ticket.subject}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(ticket.createdAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`${getPriorityColor(ticket.priority)} px-3 py-1`}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={`${getStatusColor(ticket.status)} px-3 py-1`}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-300 text-sm">
                        Talep ID: #{ticket.id.slice(-8)}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                        onClick={() => window.location.href = `/destek/${ticket.id}`}
                        data-testid={`button-view-ticket-${ticket.id}`}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Görüntüle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}