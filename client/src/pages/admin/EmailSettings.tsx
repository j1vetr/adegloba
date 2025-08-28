import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Eye, EyeOff, Send, Mail, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EmailSettings {
  id?: string;
  provider: 'smtp' | 'sendgrid' | 'mailgun';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  sendgridKey?: string;
  mailgunDomain?: string;
  mailgunKey?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  isActive: boolean;
}

export function EmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EmailSettings>({
    provider: 'smtp',
    isActive: true,
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // Fetch email settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/email-settings'],
    queryFn: () => apiRequest('/api/admin/email-settings'),
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Save email settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (data: EmailSettings) => 
      apiRequest('POST', '/api/admin/email-settings', data),
    onSuccess: () => {
      toast({ title: 'E-posta ayarları başarıyla kaydedildi!' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-settings'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Hata', 
        description: error?.message || 'Ayarlar kaydedilemedi',
        variant: 'destructive'
      });
    },
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: (email: string) => 
      apiRequest('POST', '/api/admin/email-settings/test', { testEmail: email }),
    onSuccess: () => {
      toast({ title: 'Test e-postası başarıyla gönderildi!' });
      setTestEmail('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Hata', 
        description: error?.message || 'Test e-postası gönderilemedi',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(formData);
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      toast({ 
        title: 'Hata', 
        description: 'Test için e-posta adresi gerekli',
        variant: 'destructive'
      });
      return;
    }
    testEmailMutation.mutate(testEmail);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Mail className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">E-posta ayarları yükleniyor...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Mail className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">E-posta Ayarları</h1>
        </div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>E-posta Sağlayıcı Yapılandırması</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Sistem e-postalarını göndermek için e-posta sağlayıcınızı yapılandırın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label htmlFor="provider" className="text-white">E-posta Sağlayıcı</Label>
                <Select 
                  value={formData.provider} 
                  onValueChange={(value) => updateFormData('provider', value)}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Sağlayıcı seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="smtp">SMTP</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Common Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail" className="text-white">Gönderen E-posta</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={formData.fromEmail || ''}
                    onChange={(e) => updateFormData('fromEmail', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="no-reply@domain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName" className="text-white">Gönderen Adı</Label>
                  <Input
                    id="fromName"
                    value={formData.fromName || ''}
                    onChange={(e) => updateFormData('fromName', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="AdeGloba Starlink System"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="replyTo" className="text-white">Yanıt Adresi</Label>
                <Input
                  id="replyTo"
                  type="email"
                  value={formData.replyTo || ''}
                  onChange={(e) => updateFormData('replyTo', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="support@domain.com"
                />
              </div>

              {/* Provider Specific Settings */}
              <Tabs value={formData.provider} className="w-full">
                <TabsContent value="smtp" className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">SMTP Ayarları</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost" className="text-white">SMTP Sunucu</Label>
                      <Input
                        id="smtpHost"
                        value={formData.smtpHost || ''}
                        onChange={(e) => updateFormData('smtpHost', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort" className="text-white">Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={formData.smtpPort || ''}
                        onChange={(e) => updateFormData('smtpPort', parseInt(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="587"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser" className="text-white">Kullanıcı Adı</Label>
                      <Input
                        id="smtpUser"
                        value={formData.smtpUser || ''}
                        onChange={(e) => updateFormData('smtpUser', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPass" className="text-white">Şifre</Label>
                      <div className="relative">
                        <Input
                          id="smtpPass"
                          type={showPasswords ? "text" : "password"}
                          value={formData.smtpPass || ''}
                          onChange={(e) => updateFormData('smtpPass', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sendgrid" className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">SendGrid Ayarları</h3>
                  <div className="space-y-2">
                    <Label htmlFor="sendgridKey" className="text-white">API Anahtarı</Label>
                    <div className="relative">
                      <Input
                        id="sendgridKey"
                        type={showPasswords ? "text" : "password"}
                        value={formData.sendgridKey || ''}
                        onChange={(e) => updateFormData('sendgridKey', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white pr-10"
                        placeholder="SG.••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mailgun" className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Mailgun Ayarları</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mailgunDomain" className="text-white">Domain</Label>
                      <Input
                        id="mailgunDomain"
                        value={formData.mailgunDomain || ''}
                        onChange={(e) => updateFormData('mailgunDomain', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="mg.domain.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mailgunKey" className="text-white">API Anahtarı</Label>
                      <div className="relative">
                        <Input
                          id="mailgunKey"
                          type={showPasswords ? "text" : "password"}
                          value={formData.mailgunKey || ''}
                          onChange={(e) => updateFormData('mailgunKey', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white pr-10"
                          placeholder="key-••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Active Switch */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => updateFormData('isActive', checked)}
                />
                <Label htmlFor="isActive" className="text-white">E-posta gönderimi aktif</Label>
              </div>

              {/* Save Button */}
              <Button 
                type="submit" 
                disabled={saveSettingsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saveSettingsMutation.isPending ? (
                  <>
                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ayarları Kaydet
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Test Email Section */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Test E-postası Gönder</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              E-posta ayarlarınızı test etmek için bir test e-postası gönderin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="bg-gray-700 border-gray-600 text-white flex-1"
              />
              <Button 
                onClick={handleTestEmail}
                disabled={testEmailMutation.isPending || !testEmail}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {testEmailMutation.isPending ? (
                  <>
                    <Mail className="h-4 w-4 mr-2 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Test Gönder
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information Alert */}
        <Alert className="bg-blue-900/20 border-blue-500">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-100">
            <strong>Bilgi:</strong> E-posta ayarları kaydedildikten sonra sistem otomatik olarak:
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Kullanıcı kaydında hoş geldin e-postası gönderir</li>
              <li>Sipariş tamamlandığında onay e-postası gönderir</li>
              <li>Admin'e yeni sipariş bildirimi gönderir</li>
              <li>Her ayın 1'i saat 09:10'da aylık rapor gönderir</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
}