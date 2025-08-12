import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, CreditCard, HelpCircle, Wifi, Shield, Save, Check, Loader2, Eye, EyeOff, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import AdminLayout from "@/components/AdminLayout";

interface SettingType {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: string;
}

export default function SettingsManagement() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Fetch settings
  const { data: settingsData = [], isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      return response.json();
    }
  });

  // Convert settings array to object
  useEffect(() => {
    const settingsObj: Record<string, string> = {};
    settingsData.forEach((setting: SettingType) => {
      settingsObj[setting.key] = setting.value;
    });
    setSettings(settingsObj);
  }, [settingsData]);

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (!response.ok) throw new Error('Failed to update setting');
      return response.json();
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      setSavingStates(prev => ({ ...prev, [key]: false }));
      toast({
        title: "Başarılı",
        description: "Ayar güncellendi",
      });
    },
    onError: (_, { key }) => {
      setSavingStates(prev => ({ ...prev, [key]: false }));
      toast({
        title: "Hata",
        description: "Ayar güncellenemedi",
        variant: "destructive",
      });
    }
  });

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSavingStates(prev => ({ ...prev, [key]: true }));
    
    // Debounce the API call
    setTimeout(() => {
      updateSettingMutation.mutate({ key, value });
    }, 1000);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Logo upload handlers
  const handleLogoUploadParameters = async () => {
    const response = await fetch('/api/objects/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL
    };
  };

  const handleLogoUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const logoURL = uploadedFile.uploadURL;
      
      // Update logo setting
      updateSetting('logoUrl', logoURL);
      
      toast({
        title: "Başarılı",
        description: "Logo yüklendi",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Ayarlar">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Ayarlar">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Sistem Ayarları</h1>
            <p className="text-slate-400 mt-1">Uygulama ayarlarını yönetin</p>
          </div>
        </div>

        {/* Genel Ayarlar */}
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Genel Ayarlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Site Başlığı</Label>
                <div className="relative">
                  <Input
                    value={settings.siteTitle || ''}
                    onChange={(e) => updateSetting('siteTitle', e.target.value)}
                    className="admin-input"
                    placeholder="AdeGloba Starlink System"
                  />
                  {savingStates.siteTitle && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Site Açıklaması</Label>
                <div className="relative">
                  <Input
                    value={settings.siteDescription || ''}
                    onChange={(e) => updateSetting('siteDescription', e.target.value)}
                    className="admin-input"
                    placeholder="Starlink veri paketleri satış platformu"
                  />
                  {savingStates.siteDescription && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Sistem E-postası</Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={settings.systemEmail || ''}
                    onChange={(e) => updateSetting('systemEmail', e.target.value)}
                    className="admin-input"
                    placeholder="admin@adegloba.com"
                  />
                  {savingStates.systemEmail && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Destek Telefonu</Label>
                <div className="relative">
                  <Input
                    value={settings.supportPhone || ''}
                    onChange={(e) => updateSetting('supportPhone', e.target.value)}
                    className="admin-input"
                    placeholder="+90 XXX XXX XX XX"
                  />
                  {savingStates.supportPhone && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Logo Upload Section */}
            <div className="space-y-4 border-t border-slate-700 pt-6">
              <h4 className="text-white font-semibold">Marka Ayarları</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">Logo Genişliği (px)</Label>
                  <Input
                    type="number"
                    value={settings.logoWidth || ''}
                    onChange={(e) => updateSetting('logoWidth', e.target.value)}
                    className="admin-input"
                    placeholder="150"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">Logo Yüksekliği (px)</Label>
                  <Input
                    type="number"
                    value={settings.logoHeight || ''}
                    onChange={(e) => updateSetting('logoHeight', e.target.value)}
                    className="admin-input"
                    placeholder="50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">Max Genişlik (%)</Label>
                  <Input
                    type="number"
                    value={settings.logoMaxWidth || ''}
                    onChange={(e) => updateSetting('logoMaxWidth', e.target.value)}
                    className="admin-input"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Logo Dosyası</Label>
                <div className="flex items-center gap-4">
                  {settings.logoUrl && (
                    <div className="flex items-center gap-2">
                      <img 
                        src={settings.logoUrl} 
                        alt="Logo" 
                        className="h-12 max-w-32 object-contain border border-slate-600 rounded bg-white/10 p-2"
                      />
                      <span className="text-slate-400 text-sm">Mevcut logo</span>
                    </div>
                  )}
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={2097152} // 2MB
                    onGetUploadParameters={handleLogoUploadParameters}
                    onComplete={handleLogoUploadComplete}
                    buttonClassName="admin-button"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Logo Yükle
                  </ObjectUploader>
                </div>
                <p className="text-slate-500 text-xs">SVG, PNG desteklenir. Max 2MB.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Bakım Modu</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.maintenanceMode === 'true'}
                  onCheckedChange={(checked) => updateSetting('maintenanceMode', checked ? 'true' : 'false')}
                />
                <span className="text-slate-400 text-sm">
                  {settings.maintenanceMode === 'true' ? 'Aktif' : 'Pasif'}
                </span>
                {savingStates.maintenanceMode && (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ödeme Ayarları */}
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Ödeme Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">PayPal Ortamı</Label>
                <Select
                  value={settings.paypalEnvironment || 'sandbox'}
                  onValueChange={(value) => updateSetting('paypalEnvironment', value)}
                >
                  <SelectTrigger className="admin-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="sandbox" className="text-white focus:bg-primary/20">Test</SelectItem>
                    <SelectItem value="production" className="text-white focus:bg-primary/20">Canlı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Para Birimi</Label>
                <Select
                  value={settings.currency || 'USD'}
                  onValueChange={(value) => updateSetting('currency', value)}
                >
                  <SelectTrigger className="admin-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="USD" className="text-white focus:bg-primary/20">USD</SelectItem>
                    <SelectItem value="EUR" className="text-white focus:bg-primary/20">EUR</SelectItem>
                    <SelectItem value="TRY" className="text-white focus:bg-primary/20">TRY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">PayPal Client ID</Label>
              <div className="relative">
                <Input
                  value={settings.paypalClientId || ''}
                  onChange={(e) => updateSetting('paypalClientId', e.target.value)}
                  className="admin-input"
                  placeholder="PayPal Client ID"
                />
                {savingStates.paypalClientId && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">PayPal Client Secret</Label>
              <div className="relative">
                <Input
                  type={showPasswords.paypalSecret ? "text" : "password"}
                  value={settings.paypalClientSecret || ''}
                  onChange={(e) => updateSetting('paypalClientSecret', e.target.value)}
                  className="admin-input pr-10"
                  placeholder="PayPal Client Secret"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('paypalSecret')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPasswords.paypalSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {savingStates.paypalClientSecret && (
                  <Loader2 className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Destek Ayarları */}
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Destek Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">WhatsApp Numarası</Label>
                <div className="relative">
                  <Input
                    value={settings.whatsappNumber || ''}
                    onChange={(e) => updateSetting('whatsappNumber', e.target.value)}
                    className="admin-input"
                    placeholder="+90 XXX XXX XX XX"
                  />
                  {savingStates.whatsappNumber && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Destek E-postası</Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={settings.supportEmail || ''}
                    onChange={(e) => updateSetting('supportEmail', e.target.value)}
                    className="admin-input"
                    placeholder="support@adegloba.com"
                  />
                  {savingStates.supportEmail && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Otomatik Yanıt Mesajı</Label>
              <div className="relative">
                <Textarea
                  value={settings.autoReplyMessage || ''}
                  onChange={(e) => updateSetting('autoReplyMessage', e.target.value)}
                  className="admin-input min-h-[80px]"
                  placeholder="Talebiniz alınmıştır. En kısa sürede geri dönüş yapacağız."
                />
                {savingStates.autoReplyMessage && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-slate-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}