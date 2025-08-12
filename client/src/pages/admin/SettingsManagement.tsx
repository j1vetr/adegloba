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
import { Settings, Shield, HeadphonesIcon, Globe, Wifi, Eye, EyeOff, Save, Check } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';

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
  const [savingField, setSavingField] = useState<string | null>(null);
  const [successField, setSuccessField] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allSettings, isLoading } = useQuery<Setting[]>({
    queryKey: ['/api/admin/settings'],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, category }: { key: string; value: string; category: string }) => {
      setSavingField(key);
      const response = await apiRequest('POST', '/api/admin/settings', { key, value, category });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      setSavingField(null);
      setSuccessField(variables.key);
      setTimeout(() => setSuccessField(null), 2000);
    },
    onError: (error: Error, variables) => {
      setSavingField(null);
      toast({
        title: 'Hata',
        description: error.message || 'Ayar kaydedilemedi',
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
    const isSaving = savingField === field.key;
    const isSuccess = successField === field.key;

    const getFieldIcon = () => {
      if (isSaving) return <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />;
      if (isSuccess) return <Check className="h-4 w-4 text-green-400" />;
      return null;
    };

    switch (field.type) {
      case 'password':
        const isVisible = showPasswords[field.key];
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-1">
              <Label htmlFor={field.key} className="text-sm font-medium text-slate-300">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </Label>
            </div>
            <div className="lg:col-span-2 space-y-2">
              <div className="relative">
                <Input
                  id={field.key}
                  type={isVisible ? 'text' : 'password'}
                  value={value}
                  onChange={(e) => handleSettingUpdate(field.key, e.target.value, category)}
                  disabled={field.disabled || isSaving}
                  className="bg-slate-900/50 border-slate-700/50 text-slate-100 h-11 pr-20 
                    focus:border-primary/50 focus:ring-primary/20 focus:ring-2 
                    transition-all duration-200 backdrop-blur-sm"
                  placeholder={field.placeholder}
                  data-testid={`input-${field.key}`}
                />
                <div className="absolute right-2 top-2 flex items-center space-x-1">
                  {getFieldIcon()}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePasswordVisibility(field.key)}
                    className="h-7 w-7 p-0 hover:bg-slate-800/50 text-slate-400 hover:text-slate-300"
                    data-testid={`toggle-password-${field.key}`}
                  >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'textarea':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-1">
              <Label htmlFor={field.key} className="text-sm font-medium text-slate-300">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </Label>
            </div>
            <div className="lg:col-span-2 space-y-2">
              <div className="relative">
                <Textarea
                  id={field.key}
                  value={value}
                  onChange={(e) => handleSettingUpdate(field.key, e.target.value, category)}
                  disabled={field.disabled || isSaving}
                  className="bg-slate-900/50 border-slate-700/50 text-slate-100 min-h-[100px]
                    focus:border-primary/50 focus:ring-primary/20 focus:ring-2 
                    transition-all duration-200 backdrop-blur-sm resize-none"
                  placeholder={field.placeholder}
                  data-testid={`textarea-${field.key}`}
                />
                {getFieldIcon() && (
                  <div className="absolute right-3 top-3">
                    {getFieldIcon()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'switch':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            <div className="lg:col-span-1">
              <Label htmlFor={field.key} className="text-sm font-medium text-slate-300">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </Label>
            </div>
            <div className="lg:col-span-2 flex items-center space-x-3">
              <Switch
                id={field.key}
                checked={value === 'on'}
                onCheckedChange={(checked) => 
                  handleSettingUpdate(field.key, checked ? 'on' : 'off', category)
                }
                disabled={field.disabled || isSaving}
                className="data-[state=checked]:bg-primary"
                data-testid={`switch-${field.key}`}
              />
              <span className="text-xs text-slate-400">
                {value === 'on' ? 'Aktif' : 'Pasif'}
              </span>
              {getFieldIcon()}
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-1">
              <Label htmlFor={field.key} className="text-sm font-medium text-slate-300">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </Label>
            </div>
            <div className="lg:col-span-2 space-y-2">
              <div className="relative">
                <Select
                  value={value}
                  onValueChange={(newValue) => handleSettingUpdate(field.key, newValue, category)}
                  disabled={field.disabled || isSaving}
                  data-testid={`select-${field.key}`}
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-700/50 text-slate-100 h-11
                    focus:border-primary/50 focus:ring-primary/20 focus:ring-2 
                    transition-all duration-200 backdrop-blur-sm">
                    <SelectValue placeholder="Seçiniz..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 border-slate-700/50 backdrop-blur-sm">
                    {field.options?.map((option: any) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-slate-100 focus:bg-slate-800/50 focus:text-primary"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getFieldIcon() && (
                  <div className="absolute right-12 top-3">
                    {getFieldIcon()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-1">
              <Label htmlFor={field.key} className="text-sm font-medium text-slate-300">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </Label>
            </div>
            <div className="lg:col-span-2 space-y-2">
              <div className="relative">
                <Input
                  id={field.key}
                  type={field.type || 'text'}
                  value={value}
                  onChange={(e) => handleSettingUpdate(field.key, e.target.value, category)}
                  disabled={field.disabled || isSaving}
                  className="bg-slate-900/50 border-slate-700/50 text-slate-100 h-11 pr-12
                    focus:border-primary/50 focus:ring-primary/20 focus:ring-2 
                    transition-all duration-200 backdrop-blur-sm
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={field.placeholder}
                  data-testid={`input-${field.key}`}
                />
                {getFieldIcon() && (
                  <div className="absolute right-3 top-3">
                    {getFieldIcon()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Ayarlar">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Sistem Ayarları">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 
              border border-cyan-500/30 flex items-center justify-center backdrop-blur-sm">
              <Settings className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="page-title">
                Sistem Ayarları
              </h1>
              <p className="text-slate-400 text-sm">
                AdeGloba Starlink System yapılandırması
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 bg-slate-900/30 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg
                    data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600/20 data-[state=active]:to-blue-600/20
                    data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30
                    text-slate-400 hover:text-slate-300 transition-all duration-200
                    text-xs lg:text-sm font-medium"
                  data-testid={`tab-${key}`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">{config.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Contents */}
          {Object.entries(categoryConfig).map(([categoryKey, config]) => (
            <TabsContent key={categoryKey} value={categoryKey} className="space-y-6">
              <Card className="bg-slate-900/20 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-6 border-b border-slate-700/50">
                  <CardTitle className="flex items-center space-x-3 text-xl text-white">
                    <config.icon className="h-6 w-6 text-cyan-400" />
                    <span>{config.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  {config.fields.map((field) => (
                    <div key={field.key} 
                      className="bg-slate-800/20 p-6 rounded-xl border border-slate-700/30 
                        backdrop-blur-sm hover:bg-slate-800/30 transition-all duration-200"
                    >
                      {renderField(field, categoryKey)}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Success notification */}
        {successField && (
          <div className="fixed top-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 
            text-white px-6 py-3 rounded-xl shadow-2xl border border-green-500/30 backdrop-blur-sm
            animate-in slide-in-from-right-full duration-300">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5" />
              <span className="font-medium">Ayar başarıyla kaydedildi</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}