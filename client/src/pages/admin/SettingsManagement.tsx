import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Shield, HeadphonesIcon, Globe, Wifi, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: Date | null;
}

const categoryConfig = {
  general: {
    title: 'Genel Ayarlar',
    icon: Settings,
    fields: [
      { key: 'SITE_NAME', label: 'Site Adı', type: 'text', required: false },
      { key: 'LOGO_URL', label: 'Logo URL', type: 'text', required: false },
      { key: 'CONTACT_EMAIL', label: 'İletişim E-posta', type: 'email', required: false },
      { key: 'DEFAULT_LANGUAGE', label: 'Varsayılan Dil', type: 'text', required: false, disabled: true },
      { key: 'TIMEZONE', label: 'Zaman Dilimi', type: 'text', required: false, disabled: true }
    ]
  },
  payment: {
    title: 'Ödeme Ayarları',
    icon: Shield,
    fields: [
      { key: 'PAYPAL_CLIENT_ID', label: 'PayPal Client ID', type: 'text', required: true },
      { key: 'PAYPAL_CLIENT_SECRET', label: 'PayPal Client Secret', type: 'password', required: true },
      { key: 'PAYPAL_ENV', label: 'PayPal Ortam', type: 'select', required: true, options: [
        { value: 'sandbox', label: 'Sandbox (Test)' },
        { value: 'live', label: 'Live (Canlı)' }
      ]}
    ]
  },
  support: {
    title: 'Destek Ayarları',
    icon: HeadphonesIcon,
    fields: [
      { key: 'WHATSAPP_NUMBER', label: 'WhatsApp Numarası', type: 'text', required: false, placeholder: '+90 XXX XXX XX XX' },
      { key: 'SUPPORT_EMAIL', label: 'Destek E-posta', type: 'email', required: false }
    ]
  },
  captive_portal: {
    title: 'Captive Portal Ayarları',
    icon: Globe,
    fields: [
      { key: 'CAPTIVE_LOGIN_URL', label: 'Captive Portal URL', type: 'text', required: false },
      { key: 'CAPTIVE_PORTAL_MODE', label: 'Captive Portal Modu', type: 'switch', required: false },
      { key: 'WALLED_GARDEN_HINT', label: 'Walled Garden İpucu', type: 'textarea', required: false }
    ]
  },
  radius: {
    title: 'RADIUS Ayarları',
    icon: Wifi,
    fields: [
      { key: 'RADIUS_DB_HOST', label: 'RADIUS DB Host', type: 'text', required: true },
      { key: 'RADIUS_DB_PORT', label: 'RADIUS DB Port', type: 'number', required: true },
      { key: 'RADIUS_DB_USER', label: 'RADIUS DB Kullanıcı', type: 'text', required: true },
      { key: 'RADIUS_DB_PASS', label: 'RADIUS DB Şifre', type: 'password', required: true },
      { key: 'RADIUS_DB_NAME', label: 'RADIUS DB Adı', type: 'text', required: true }
    ]
  }
};

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allSettings, isLoading } = useQuery<Setting[]>({
    queryKey: ['/api/admin/settings'],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, category }: { key: string; value: string; category: string }) => {
      const response = await apiRequest('POST', '/api/admin/settings', { key, value, category });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: 'Başarılı',
        description: 'Ayarlar başarıyla kaydedildi',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Hata',
        description: error.message || 'Ayarlar kaydedilemedi',
        variant: 'destructive',
      });
    }
  });

  useEffect(() => {
    if (allSettings) {
      const settingsMap: Record<string, string> = {};
      allSettings.forEach(setting => {
        settingsMap[setting.key] = setting.value || '';
      });
      setSettings(settingsMap);
    }
  }, [allSettings]);

  const handleSettingUpdate = async (key: string, value: string, category: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    await updateSettingMutation.mutateAsync({ key, value, category });
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderField = (field: any, category: string) => {
    const value = settings[field.key] || '';

    switch (field.type) {
      case 'password':
        const isVisible = showPasswords[field.key];
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.key} className="text-sm font-medium text-gray-200">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => togglePasswordVisibility(field.key)}
                className="h-6 w-6 p-0"
                data-testid={`toggle-password-${field.key}`}
              >
                {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            <Input
              id={field.key}
              type={isVisible ? 'text' : 'password'}
              value={value}
              onChange={(e) => handleSettingUpdate(field.key, e.target.value, category)}
              disabled={field.disabled || updateSettingMutation.isPending}
              className="bg-gray-900/50 border-gray-700 text-gray-100"
              data-testid={`input-${field.key}`}
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium text-gray-200">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.key}
              value={value}
              onChange={(e) => handleSettingUpdate(field.key, e.target.value, category)}
              disabled={field.disabled || updateSettingMutation.isPending}
              className="bg-gray-900/50 border-gray-700 text-gray-100 min-h-[100px]"
              placeholder={field.placeholder}
              data-testid={`textarea-${field.key}`}
            />
          </div>
        );

      case 'switch':
        return (
          <div className="flex items-center space-x-3">
            <Switch
              id={field.key}
              checked={value === 'on'}
              onCheckedChange={(checked) => 
                handleSettingUpdate(field.key, checked ? 'on' : 'off', category)
              }
              disabled={field.disabled || updateSettingMutation.isPending}
              data-testid={`switch-${field.key}`}
            />
            <Label htmlFor={field.key} className="text-sm font-medium text-gray-200">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </Label>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium text-gray-200">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) => handleSettingUpdate(field.key, newValue, category)}
              disabled={field.disabled || updateSettingMutation.isPending}
              data-testid={`select-${field.key}`}
            >
              <SelectTrigger className="bg-gray-900/50 border-gray-700 text-gray-100">
                <SelectValue placeholder="Seçiniz..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {field.options?.map((option: any) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-gray-100 focus:bg-gray-800"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium text-gray-200">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type={field.type || 'text'}
              value={value}
              onChange={(e) => handleSettingUpdate(field.key, e.target.value, category)}
              disabled={field.disabled || updateSettingMutation.isPending}
              className="bg-gray-900/50 border-gray-700 text-gray-100"
              placeholder={field.placeholder}
              data-testid={`input-${field.key}`}
            />
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Ayarlar yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-cyan-400" />
        <h1 className="text-3xl font-bold text-white" data-testid="page-title">Ayarlar</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 bg-gray-900/50 p-1 rounded-lg">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center space-x-2 data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-400 text-gray-400"
                data-testid={`tab-${key}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{config.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(categoryConfig).map(([categoryKey, config]) => (
          <TabsContent key={categoryKey} value={categoryKey}>
            <Card className="bg-gray-900/30 border-gray-700 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl text-white">
                  <config.icon className="h-6 w-6 text-cyan-400" />
                  <span>{config.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {config.fields.map((field) => (
                  <div key={field.key} className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                    {renderField(field, categoryKey)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {updateSettingMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Kaydediliyor...
        </div>
      )}
    </div>
  );
}