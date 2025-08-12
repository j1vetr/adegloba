import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Calendar,
  User,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";

interface TicketMessage {
  id: string;
  message: string;
  senderType: 'user' | 'admin';
  senderId: string;
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

export default function TicketDetail() {
  const { user, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [match, params] = useRoute("/destek/:ticketId");
  const [replyMessage, setReplyMessage] = useState("");

  const ticketId = params?.ticketId;

  // Fetch ticket details with messages
  const { data: ticketData, isLoading: ticketLoading, error } = useQuery({
    queryKey: ['/api/tickets', ticketId],
    enabled: !!user && !!ticketId
  });

  // Send reply mutation
  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!message.trim()) {
        throw new Error("Mesaj boş olamaz");
      }

      const response = await apiRequest('POST', `/api/tickets/${ticketId}/messages`, {
        message: message.trim()
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Yanıtınız gönderildi.",
      });
      setReplyMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Yanıt gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleSendReply = () => {
    replyMutation.mutate(replyMessage);
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
        return "bg-green-600/20 text-green-400 border-green-500/30";
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

  if (!match || !ticketId) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-semibold mb-2">Geçersiz Talep</h2>
          <p className="text-gray-400">Talep bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <UserNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Destek Talebi Detayları
              </h1>
              <p className="text-gray-400">
                Talep ID: #{ticketId?.slice(-8)}
              </p>
            </div>
          </div>

          {ticketLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-cyan-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Talep detayları yükleniyor...</span>
              </div>
            </div>
          ) : error || !ticketData ? (
            <Card className="bg-gray-900/50 border-red-500/30">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Talep Bulunamadı</h3>
                <p className="text-gray-400">Bu talep bulunamadı veya erişim izniniz yok.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Ticket Info */}
              <Card className="bg-gray-900/50 border-cyan-500/30 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-white text-xl mb-2 flex items-center gap-2">
                        {getStatusIcon(ticketData.ticket.status)}
                        {ticketData.ticket.subject}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(ticketData.ticket.createdAt).toLocaleDateString('tr-TR', {
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
                      <Badge className={`${getPriorityColor(ticketData.ticket.priority)} px-3 py-1`}>
                        {ticketData.ticket.priority}
                      </Badge>
                      <Badge className={`${getStatusColor(ticketData.ticket.status)} px-3 py-1`}>
                        {ticketData.ticket.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Messages */}
              <Card className="bg-gray-900/50 border-cyan-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-cyan-400 text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Konuşma Geçmişi
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {ticketData.messages.map((message, index) => (
                    <div key={message.id} className="space-y-4">
                      <div className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl w-full ${
                          message.senderType === 'user' 
                            ? 'bg-cyan-600/20 border-cyan-500/30' 
                            : 'bg-gray-800/50 border-gray-600/30'
                        } border rounded-lg p-4`}>
                          <div className="flex items-center gap-2 mb-2">
                            {message.senderType === 'user' ? (
                              <User className="h-4 w-4 text-cyan-400" />
                            ) : (
                              <Shield className="h-4 w-4 text-purple-400" />
                            )}
                            <span className={`text-sm font-medium ${
                              message.senderType === 'user' ? 'text-cyan-400' : 'text-purple-400'
                            }`}>
                              {message.senderType === 'user' ? 'Siz' : 'Destek Ekibi'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(message.createdAt).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-white whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                      {index < ticketData.messages.length - 1 && (
                        <Separator className="bg-gray-700/50" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Reply Section - Only show if ticket is not closed */}
              {ticketData.ticket.status !== 'Kapalı' && (
                <Card className="bg-gray-900/50 border-cyan-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-cyan-400 text-lg flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Yanıt Gönder
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Yanıtınızı buraya yazın..."
                      className="bg-gray-800/50 border-cyan-500/30 text-white resize-none"
                      rows={6}
                      data-testid="input-reply-message"
                    />
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSendReply}
                        disabled={replyMutation.isPending || !replyMessage.trim()}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        data-testid="button-send-reply"
                      >
                        {replyMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Yanıt Gönder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {ticketData.ticket.status === 'Kapalı' && (
                <Card className="bg-gray-800/50 border-gray-600/30">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">Bu talep kapatılmıştır. Yeni yanıt gönderilemez.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}