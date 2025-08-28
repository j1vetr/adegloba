import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle, Eye, EyeOff, Send, Mail, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EmailSettings {
  id?: string;
  provider: 'smtp';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  adminEmail?: string;
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
    queryFn: () => apiRequest('GET', '/api/admin/email-settings'),
  });

  // Manual data fetching - test without React Query
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Manual fetch starting...');
        const response = await fetch('/api/admin/email-settings', {
          credentials: 'include'
        });
        const data = await response.json();
        console.log('📦 Manual fetch result:', data);
        
        if (data) {
          // Map database fields to form fields
          const mappedSettings = {
            id: data.id,
            provider: 'smtp' as const,
            smtpHost: data.smtp_host || '',
            smtpPort: data.smtp_port || 587,
            smtpUser: data.smtp_user || '',
            smtpPass: '', // Don't show password for security
            fromEmail: data.from_email || '',
            fromName: data.from_name || '',
            replyTo: data.reply_to || '',
            adminEmail: data.adminEmail || '',
            isActive: data.is_active ?? true,
          };
          
          console.log('✅ MAPPED SETTINGS:', mappedSettings);
          setFormData(mappedSettings);
          console.log('✅ Form data updated with manual fetch!');
          console.log('📝 Updated formData state:', formData);
        }
      } catch (error) {
        console.error('❌ Manual fetch error:', error);
      }
    };
    
    fetchData();
  }, []); // Run once on mount

  // Update form when settings are loaded (React Query)
  useEffect(() => {
    if (settings) {
      console.log('🔍 RAW API RESPONSE (React Query):', settings);
      console.log('📋 Current formData before update:', formData);
      
      const data = settings as any; // Cast to avoid TypeScript errors
      
      // Map database fields to form fields
      const mappedSettings = {
        id: data.id,
        provider: 'smtp' as const,
        smtpHost: data.smtp_host || data.smtpHost || '',
        smtpPort: data.smtp_port || data.smtpPort || 587,
        smtpUser: data.smtp_user || data.smtpUser || '',
        smtpPass: '', // Don't show password for security
        fromEmail: data.from_email || data.fromEmail || '',
        fromName: data.from_name || data.fromName || '',
        replyTo: data.reply_to || data.replyTo || '',
        adminEmail: data.adminEmail || '',
        isActive: data.is_active ?? data.isActive ?? true,
      };
      
      console.log('✅ MAPPED SETTINGS (React Query):', mappedSettings);
      console.log('📝 Setting form data...');
      setFormData(mappedSettings); // Direct set instead of merge
      console.log('✅ Form data updated!');
    }
  }, [settings]);

  // Save email settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (data: EmailSettings) => 
      apiRequest('POST', '/api/admin/email-settings', data),
    onSuccess: (response) => {
      toast({ title: 'E-posta ayarları başarıyla kaydedildi!' });
      
      // Update form data with saved response (preserve password field)
      const data = response as any;
      const updatedData = {
        id: data.id,
        provider: 'smtp' as const,
        smtpHost: data.smtp_host || data.smtpHost || '',
        smtpPort: data.smtp_port || data.smtpPort || 587,
        smtpUser: data.smtp_user || data.smtpUser || '',
        smtpPass: formData.smtpPass, // Keep current password to prevent clearing
        fromEmail: data.from_email || data.fromEmail || '',
        fromName: data.from_name || data.fromName || '',
        replyTo: data.reply_to || data.replyTo || '',
        adminEmail: data.adminEmail || '',
        isActive: data.is_active ?? data.isActive ?? true,
      };
      
      setFormData(prev => ({ ...prev, ...updatedData }));
      // Don't invalidate cache immediately to prevent form reset
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
      <AdminLayout title="E-posta Ayarları">
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
    <AdminLayout title="E-posta Ayarları">
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
              {/* SMTP Provider (Fixed) */}
              <div className="space-y-2">
                <Label className="text-white">E-posta Sağlayıcı</Label>
                <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">
                  <span className="text-white">SMTP</span>
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="text-white">Admin E-posta</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail || ''}
                    onChange={(e) => updateFormData('adminEmail', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="admin@adegloba.com"
                  />
                  <p className="text-xs text-gray-400">Sipariş bildirimleri bu adrese gönderilir</p>
                </div>
              </div>

              {/* SMTP Settings */}
              <div className="space-y-4">
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
                        data-testid="input-smtp-host"
                      />
                      <div className="text-xs text-yellow-400">Debug: {formData.smtpHost}</div>
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
                        data-testid="input-smtp-user"
                      />
                      <div className="text-xs text-yellow-400">Debug: {formData.smtpUser}</div>
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
                </div>

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