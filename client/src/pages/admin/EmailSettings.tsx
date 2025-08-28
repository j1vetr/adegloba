import { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<EmailSettings>({
    provider: 'smtp',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    fromEmail: '',
    fromName: '',
    replyTo: '',
    adminEmail: '',
    isActive: true,
  });

  // Load email settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/email-settings', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Update form with database values
          setFormData({
            id: data.id,
            provider: 'smtp',
            smtpHost: data.smtp_host || '',
            smtpPort: data.smtp_port || 587,
            smtpUser: data.smtp_user || '',
            smtpPass: '', // Never show password
            fromEmail: data.from_email || '',
            fromName: data.from_name || '',
            replyTo: data.reply_to || '',
            adminEmail: data.admin_email || '',
            isActive: data.is_active ?? true,
          });
        }
      } catch (error) {
        console.error('Error loading email settings:', error);
        toast({
          title: "Hata",
          description: "E-posta ayarları yüklenemedi",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "E-posta ayarları kaydedildi",
        });
      } else {
        throw new Error('Kaydetme başarısız');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "E-posta ayarları kaydedilemedi",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle test email
  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Hata",
        description: "Test için e-posta adresi gerekli",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/email-settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ testEmail }),
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Test e-postası gönderildi",
        });
        setTestEmail('');
      } else {
        throw new Error('Test başarısız');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Test e-postası gönderilemedi",
        variant: "destructive"
      });
    }
  };

  // Update form field
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

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Settings className="h-5 w-5" />
              <span>E-posta Sağlayıcı Yapılandırması</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Sistem e-postalarını göndermek için SMTP ayarları yapılandırın
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
                    value={formData.fromEmail}
                    onChange={(e) => updateFormData('fromEmail', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="noreply@domain.com"
                  />
                  <p className="text-xs text-gray-400">Sistem e-postalarında gözükecek gönderen adresi</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName" className="text-white">Gönderen İsmi</Label>
                  <Input
                    id="fromName"
                    value={formData.fromName}
                    onChange={(e) => updateFormData('fromName', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="AdeGloba Starlink System"
                  />
                  <p className="text-xs text-gray-400">E-postalarda görünecek gönderen ismi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="replyTo" className="text-white">Yanıtla Adresi</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    value={formData.replyTo}
                    onChange={(e) => updateFormData('replyTo', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="support@domain.com"
                  />
                  <p className="text-xs text-gray-400">Kullanıcılar yanıt verdiğinde bu adrese gidecek</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="text-white">Admin E-posta</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => updateFormData('adminEmail', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="admin@domain.com"
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
                      value={formData.smtpHost}
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
                      value={formData.smtpUser}
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
                        value={formData.smtpPass}
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

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Test Email Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Send className="h-5 w-5" />
              <span>E-posta Testi</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              E-posta ayarlarınızı test etmek için bir test e-postası gönderin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button 
                onClick={handleTestEmail}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                Test Gönder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}