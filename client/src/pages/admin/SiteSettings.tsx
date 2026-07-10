import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import AdminLayout from "@/components/AdminLayout";

export default function SiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'AdeGloba Starlink System',
    baseUrl: 'https://adegloba.toov.com.tr',
    whatsappNumber: '+447440225375',
    defaultLanguage: 'tr',
    timezone: 'Europe/Istanbul',
    SHIP_QUOTA_API_KEY: '',
  });

  // Load current settings from server
  const { data: currentSettings } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/settings");
      return response.json();
    },
  });

  // Update local settings when server data loads
  useEffect(() => {
    if (currentSettings) {
      const settingsObj: any = {};
      currentSettings.forEach((setting: any) => {
        settingsObj[setting.key] = setting.value;
      });
      setSettings(prev => ({ ...prev, ...settingsObj }));
    }
  }, [currentSettings]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, category = 'general' }: { key: string; value: string; category?: string }) => {
      const response = await apiRequest('POST', '/api/admin/settings', { key, value, category });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ayar güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Yetkisiz",
          description: "Bu işlem için yetkiniz yok",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Hata",
          description: "Ayar güncellenirken bir hata oluştu",
          variant: "destructive",
        });
      }
    },
  });

  const handleSaveSetting = (key: string, value: string, category: string = 'general') => {
    updateSettingMutation.mutate({ key, value, category });
  };

  // Mapping for form field names to database keys
  const fieldMapping = {
    siteName: { key: 'siteName', category: 'general' },
    baseUrl: { key: 'base_url', category: 'general' },
    whatsappNumber: { key: 'whatsappNumber', category: 'general' },
    defaultLanguage: { key: 'defaultLanguage', category: 'general' },
    timezone: { key: 'timezone', category: 'general' },
    SHIP_QUOTA_API_KEY: { key: 'SHIP_QUOTA_API_KEY', category: 'integration' },
  };

  return (
    <AdminLayout title="Site Ayarları">
      <div className="space-y-6">
        <Card className="glassmorphism border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Site Ayarları</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Site Adı</Label>
              <div className="flex gap-2">
                <Input
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="glassmorphism border-slate-600 text-white flex-1"
                  placeholder="AdeGloba Starlink System"
                  data-testid="site-name-input"
                />
                <Button
                  onClick={() => handleSaveSetting('siteName', settings.siteName, 'general')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  data-testid="save-site-name"
                >
                  {updateSettingMutation.isPending ? '💫' : '✓'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Site URL</Label>
              <div className="flex gap-2">
                <Input
                  value={settings.baseUrl}
                  onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                  className="glassmorphism border-slate-600 text-white flex-1"
                  placeholder="https://adegloba.toov.com.tr"
                  data-testid="base-url-input"
                />
                <Button
                  onClick={() => handleSaveSetting('base_url', settings.baseUrl, 'general')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  data-testid="save-base-url"
                >
                  {updateSettingMutation.isPending ? '💫' : '✓'}
                </Button>
              </div>
              <p className="text-sm text-slate-400">E-postalardaki linkler bu URL'yi kullanacak</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">WhatsApp Numarası</Label>
              <div className="flex gap-2">
                <Input
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="glassmorphism border-slate-600 text-white flex-1"
                  placeholder="+447440225375"
                  data-testid="whatsapp-number-input"
                />
                <Button
                  onClick={() => handleSaveSetting('whatsappNumber', settings.whatsappNumber, 'general')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  data-testid="save-whatsapp-number"
                >
                  {updateSettingMutation.isPending ? '💫' : '✓'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Varsayılan Dil</Label>
              <div className="flex gap-2">
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glassmorphism border border-slate-600 text-white bg-transparent flex-1"
                  data-testid="language-select"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
                <Button
                  onClick={() => handleSaveSetting('defaultLanguage', settings.defaultLanguage, 'general')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  data-testid="save-default-language"
                >
                  {updateSettingMutation.isPending ? '💫' : '✓'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Zaman Dilimi</Label>
              <div className="flex gap-2">
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glassmorphism border border-slate-600 text-white bg-transparent flex-1"
                  data-testid="timezone-select"
                >
                  <option value="Europe/Istanbul">Europe/Istanbul</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                </select>
                <Button
                  onClick={() => handleSaveSetting('timezone', settings.timezone, 'general')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  data-testid="save-timezone"
                >
                  {updateSettingMutation.isPending ? '💫' : '✓'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glassmorphism border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-2">Entegrasyon API Anahtarları</h2>
          <p className="text-sm text-slate-400 mb-6">
            Dış sistemlerin (örn. gemi kota takip sistemi) API'lerimize erişmesi için kullanılan anahtarlar. Bu anahtarı dış sisteme verirken isteklerinde <code className="text-slate-300">x-api-key</code> header'ında göndermeleri gerektiğini belirtin.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Gemi Kota API Anahtarı</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.SHIP_QUOTA_API_KEY}
                    onChange={(e) => setSettings({ ...settings, SHIP_QUOTA_API_KEY: e.target.value })}
                    className="glassmorphism border-slate-600 text-white pr-10"
                    placeholder="Gemi kota API anahtarını girin"
                    data-testid="ship-quota-api-key-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Button
                  onClick={() => handleSaveSetting('SHIP_QUOTA_API_KEY', settings.SHIP_QUOTA_API_KEY, 'integration')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  data-testid="save-ship-quota-api-key"
                >
                  {updateSettingMutation.isPending ? '💫' : '✓'}
                </Button>
              </div>
              <p className="text-sm text-slate-400">
                GET /api/external/ship-quotas adresine erişim için gereken anahtar. Boş bırakılırsa bu adres devre dışı kalır (401/500 döner).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}