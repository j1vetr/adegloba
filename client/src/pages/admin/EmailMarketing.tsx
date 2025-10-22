import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Mail, 
  Users, 
  Send, 
  Eye, 
  FileText, 
  Target, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
  Globe,
  Trash2,
  Package,
  PackageX,
  Timer
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  created_at: string;
  last_login_at: string | null;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  recipient_count: number;
  sent_count: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  created_at: string;
  sent_at: string | null;
}

export default function EmailMarketing() {
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: '',
    recipientType: 'all', // all, active, inactive, selected, withPackages, withoutPackages, expiringSoon
    selectedUsers: [] as string[],
    useTemplate: false,
    selectedTemplate: '',
    previewMode: false
  });

  // Load data
  useEffect(() => {
    loadUsers();
    loadTemplates();
    loadCampaigns();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/admin/email-marketing/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Kullanıcılar yüklenirken hata oluştu',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/email-marketing/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Templates load error:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/email-marketing/campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Campaigns load error:', error);
    }
  };

  const getRecipientUsers = () => {
    switch (emailForm.recipientType) {
      case 'all':
        return users;
      case 'active':
        return users.filter(user => user.last_login_at && 
          new Date(user.last_login_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      case 'inactive':
        return users.filter(user => !user.last_login_at || 
          new Date(user.last_login_at) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      case 'selected':
        return users.filter(user => emailForm.selectedUsers.includes(user.id));
      case 'withPackages':
        // This will be handled by backend - for now show all
        return users;
      case 'withoutPackages':
        // This will be handled by backend - for now show all
        return users;
      case 'expiringSoon':
        // This will be handled by backend - for now show all
        return users;
      default:
        return [];
    }
  };

  const deleteTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    const confirm = window.confirm(
      `"${template?.name}" şablonunu silmek istediğinizden emin misiniz?`
    );

    if (!confirm) return;

    try {
      await apiRequest('DELETE', `/api/admin/email-marketing/templates/${templateId}`);
      toast({
        title: 'Başarılı',
        description: 'Şablon silindi'
      });
      loadTemplates();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Şablon silinirken hata oluştu',
        variant: 'destructive'
      });
    }
  };

  const viewTemplate = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEmailForm(prev => ({
        ...prev,
        selectedTemplate: templateId,
        subject: template.subject,
        content: template.content
      }));
      
      // Switch to the email sending tab to show the loaded template
      setActiveTab('compose');
      
      // Show success notification
      toast({
        title: 'Başarılı',
        description: `"${template.name}" şablonu yüklendi`
      });
    }
  };

  const saveAsTemplate = async () => {
    if (!emailForm.subject || !emailForm.content) {
      toast({
        title: 'Hata',
        description: 'Konu ve içerik alanları dolu olmalıdır',
        variant: 'destructive'
      });
      return;
    }

    try {
      const templateName = prompt('Şablon adı girin:');
      if (!templateName) return;

      await apiRequest('POST', '/api/admin/email-marketing/templates', {
        name: templateName,
        subject: emailForm.subject,
        content: emailForm.content
      });

      toast({
        title: 'Başarılı',
        description: 'Şablon kaydedildi'
      });

      loadTemplates();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Şablon kaydedilirken hata oluştu',
        variant: 'destructive'
      });
    }
  };

  const sendEmail = async () => {
    if (!emailForm.subject || !emailForm.content) {
      toast({
        title: 'Hata',
        description: 'Konu ve içerik alanları dolu olmalıdır',
        variant: 'destructive'
      });
      return;
    }

    const recipients = getRecipientUsers();
    if (recipients.length === 0) {
      toast({
        title: 'Hata',
        description: 'En az bir alıcı seçmelisiniz',
        variant: 'destructive'
      });
      return;
    }

    const confirm = window.confirm(
      `${recipients.length} kullanıcıya e-mail gönderilecek. Devam etmek istiyor musunuz?`
    );

    if (!confirm) return;

    try {
      setSending(true);
      await apiRequest('POST', '/api/admin/email-marketing/send', {
        subject: emailForm.subject,
        content: emailForm.content,
        recipientType: emailForm.recipientType,
        selectedUsers: emailForm.selectedUsers
      });

      toast({
        title: 'Başarılı',
        description: `${recipients.length} kullanıcıya e-mail gönderildi`
      });

      // Reset form
      setEmailForm(prev => ({
        ...prev,
        subject: '',
        content: '',
        selectedUsers: []
      }));

      loadCampaigns();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'E-mail gönderilirken hata oluştu',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const recipientCount = getRecipientUsers().length;

  return (
    <AdminLayout title="E-mail Pazarlama">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">E-mail Pazarlama</h1>
            <p className="text-slate-400 mt-1">Kullanıcılara toplu e-mail gönder</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-slate-300">
              <Users className="w-4 h-4 mr-1" />
              {users.length} Kullanıcı
            </Badge>
            <Badge variant="outline" className="text-slate-300">
              <FileText className="w-4 h-4 mr-1" />
              {templates.length} Şablon
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose">
              <Mail className="w-4 h-4 mr-2" />
              E-mail Oluştur
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <Target className="w-4 h-4 mr-2" />
              Kampanyalar
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-2" />
              Şablonlar
            </TabsTrigger>
          </TabsList>

          {/* Email Compose Tab */}
          <TabsContent value="compose" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Email Composer */}
              <div className="lg:col-span-2">
                <Card className="admin-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      E-mail Oluştur
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Template Selection */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={emailForm.useTemplate}
                          onCheckedChange={(checked) => 
                            setEmailForm(prev => ({ ...prev, useTemplate: checked }))
                          }
                        />
                        <Label className="text-slate-300">Şablon kullan</Label>
                      </div>
                      
                      {emailForm.useTemplate && (
                        <Select onValueChange={handleTemplateSelect}>
                          <SelectTrigger className="admin-input flex-1">
                            <SelectValue placeholder="Şablon seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Subject */}
                    <div>
                      <Label className="text-slate-300">Konu</Label>
                      <Input
                        placeholder="E-mail konusu"
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm(prev => ({ 
                          ...prev, subject: e.target.value 
                        }))}
                        className="admin-input"
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <Label className="text-slate-300">İçerik</Label>
                      <Textarea
                        placeholder="E-mail içeriği (HTML destekler)"
                        value={emailForm.content}
                        onChange={(e) => setEmailForm(prev => ({ 
                          ...prev, content: e.target.value 
                        }))}
                        className="admin-input min-h-[300px]"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        HTML etiketleri kullanabilirsiniz. Değişkenler: {'{kullanici_adi}'}, {'{email}'}, {'{telefon}'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={saveAsTemplate}
                        variant="outline"
                        className="admin-button-secondary"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Şablon Olarak Kaydet
                      </Button>
                      
                      <Button
                        onClick={() => setEmailForm(prev => ({ 
                          ...prev, previewMode: !prev.previewMode 
                        }))}
                        variant="outline"
                        className="admin-button-secondary"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {emailForm.previewMode ? 'Düzenleme' : 'Önizleme'}
                      </Button>
                    </div>

                    {/* Preview */}
                    {emailForm.previewMode && emailForm.content && (
                      <Card className="admin-card">
                        <CardHeader>
                          <CardTitle className="text-sm text-slate-300">Önizleme</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-white p-4 rounded text-black">
                            <h3 className="font-bold mb-2">{emailForm.subject}</h3>
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: emailForm.content
                                  .replace(/{kullanici_adi}/g, 'Örnek Kullanıcı')
                                  .replace(/{email}/g, 'ornek@email.com')
                                  .replace(/{telefon}/g, '+90 555 123 45 67')
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recipients & Send */}
              <div className="space-y-6">
                {/* Recipient Selection */}
                <Card className="admin-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Alıcılar ({recipientCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Alıcı Grubu</Label>
                      <Select 
                        value={emailForm.recipientType}
                        onValueChange={(value) => setEmailForm(prev => ({ 
                          ...prev, recipientType: value, selectedUsers: [] 
                        }))}
                      >
                        <SelectTrigger className="admin-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <div className="flex items-center">
                              <Globe className="w-4 h-4 mr-2" />
                              Tüm Kullanıcılar ({users.length})
                            </div>
                          </SelectItem>
                          <SelectItem value="active">
                            <div className="flex items-center">
                              <UserCheck className="w-4 h-4 mr-2" />
                              Aktif Kullanıcılar ({users.filter(u => u.last_login_at && 
                                new Date(u.last_login_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length})
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <div className="flex items-center">
                              <UserX className="w-4 h-4 mr-2" />
                              Pasif Kullanıcılar ({users.filter(u => !u.last_login_at || 
                                new Date(u.last_login_at) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length})
                            </div>
                          </SelectItem>
                          <SelectItem value="withPackages">
                            <div className="flex items-center">
                              <Package className="w-4 h-4 mr-2" />
                              Paket Almış Kullanıcılar
                            </div>
                          </SelectItem>
                          <SelectItem value="withoutPackages">
                            <div className="flex items-center">
                              <PackageX className="w-4 h-4 mr-2" />
                              Paket Almamış Kullanıcılar
                            </div>
                          </SelectItem>
                          <SelectItem value="expiringSoon">
                            <div className="flex items-center">
                              <Timer className="w-4 h-4 mr-2" />
                              Paketi Dolmak Üzere Olanlar
                            </div>
                          </SelectItem>
                          <SelectItem value="selected">Seçili Kullanıcılar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Individual User Selection */}
                    {emailForm.recipientType === 'selected' && (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {users.map(user => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={emailForm.selectedUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEmailForm(prev => ({ 
                                    ...prev, 
                                    selectedUsers: [...prev.selectedUsers, user.id] 
                                  }));
                                } else {
                                  setEmailForm(prev => ({ 
                                    ...prev, 
                                    selectedUsers: prev.selectedUsers.filter(id => id !== user.id) 
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm text-slate-300">
                              {user.full_name || user.username} ({user.email})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Send Button */}
                    <Button
                      onClick={sendEmail}
                      disabled={sending || !emailForm.subject || !emailForm.content || recipientCount === 0}
                      className="w-full admin-button-primary"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {recipientCount} Kullanıcıya Gönder
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="admin-card">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">İstatistikler</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Toplam Kullanıcı</span>
                      <span className="text-white">{users.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Aktif Kullanıcı</span>
                      <span className="text-green-400">
                        {users.filter(u => u.last_login_at && 
                          new Date(u.last_login_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Seçili Alıcı</span>
                      <span className="text-blue-400">{recipientCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card className="admin-card">
              <CardHeader>
                <CardTitle className="text-white">Gönderilen Kampanyalar</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Henüz kampanya gönderilmemiş</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map(campaign => (
                      <div key={campaign.id} className="border border-slate-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-medium">{campaign.subject}</h3>
                            <p className="text-sm text-slate-400 mt-1">
                              {campaign.sent_count} / {campaign.recipient_count} gönderildi
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(campaign.created_at).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          <Badge variant={
                            campaign.status === 'sent' ? 'default' :
                            campaign.status === 'sending' ? 'secondary' :
                            campaign.status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {campaign.status === 'sent' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {campaign.status === 'sending' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                            {campaign.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {campaign.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                            {campaign.status === 'sent' ? 'Gönderildi' :
                             campaign.status === 'sending' ? 'Gönderiliyor' :
                             campaign.status === 'failed' ? 'Başarısız' : 'Taslak'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card className="admin-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>E-mail Şablonları</span>
                  <Badge variant="outline" className="text-slate-300">
                    {templates.length} Şablon
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Henüz şablon oluşturulmamış</p>
                    <p className="text-slate-500 text-sm mt-2">E-mail oluştur sekmesinden yeni şablon kaydedin</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {templates.map(template => (
                      <div key={template.id} className="border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-lg mb-1">{template.name}</h3>
                            <p className="text-sm text-slate-400 mb-3">{template.subject}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>Oluşturulma: {new Date(template.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => viewTemplate(template)}
                              variant="outline"
                              size="sm"
                              className="admin-button-secondary"
                              data-testid={`button-preview-template-${template.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Önizle
                            </Button>
                            <Button
                              onClick={() => handleTemplateSelect(template.id)}
                              variant="outline"
                              size="sm"
                              className="admin-button-primary"
                              data-testid={`button-use-template-${template.id}`}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Kullan
                            </Button>
                            <Button
                              onClick={() => deleteTemplate(template.id)}
                              variant="outline"
                              size="sm"
                              className="border-red-900 text-red-400 hover:bg-red-950/50"
                              data-testid={`button-delete-template-${template.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Template Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl">{previewTemplate?.name}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Konu: {previewTemplate?.subject}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <div className="bg-white rounded-lg p-6">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: previewTemplate?.content
                      .replace(/{kullanici_adi}/g, 'Örnek Kullanıcı')
                      .replace(/{email}/g, 'ornek@email.com')
                      .replace(/{telefon}/g, '+90 555 123 45 67') || ''
                  }}
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  onClick={() => setShowPreviewModal(false)}
                  variant="outline"
                  className="admin-button-secondary"
                  data-testid="button-close-preview"
                >
                  Kapat
                </Button>
                <Button
                  onClick={() => {
                    if (previewTemplate) {
                      handleTemplateSelect(previewTemplate.id);
                      setShowPreviewModal(false);
                    }
                  }}
                  className="admin-button-primary"
                  data-testid="button-use-from-preview"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Bu Şablonu Kullan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}