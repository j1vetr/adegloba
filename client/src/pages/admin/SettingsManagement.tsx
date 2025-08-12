import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Settings,
  Edit,
  Save,
  Plus,
  Loader2,
  Globe,
  Mail,
  CreditCard,
  Shield,
  Bell,
  Database
} from "lucide-react";

type Setting = {
  key: string;
  value: string;
  description?: string;
  category?: string;
};

const SETTING_CATEGORIES = {
  general: { icon: Settings, label: 'Genel', color: 'text-blue-400' },
  payment: { icon: CreditCard, label: 'Ödeme', color: 'text-green-400' },
  notifications: { icon: Bell, label: 'Bildirimler', color: 'text-yellow-400' },
  security: { icon: Shield, label: 'Güvenlik', color: 'text-red-400' },
  system: { icon: Database, label: 'Sistem', color: 'text-purple-400' },
};

const DEFAULT_SETTINGS = [
  { key: 'site_name', value: 'AdeGloba Starlink System', description: 'Site başlığı', category: 'general' },
  { key: 'site_description', value: 'Deniz araçları için Starlink veri paketleri', description: 'Site açıklaması', category: 'general' },
  { key: 'contact_email', value: 'info@adegloba.com', description: 'İletişim e-postası', category: 'general' },
  { key: 'whatsapp_number', value: '+905xxxxxxxxx', description: 'WhatsApp destek numarası', category: 'general' },
  { key: 'currency', value: 'USD', description: 'Varsayılan para birimi', category: 'payment' },
  { key: 'payment_timeout_minutes', value: '60', description: 'Ödeme zaman aşımı (dakika)', category: 'payment' },
  { key: 'email_notifications', value: 'true', description: 'E-posta bildirimleri aktif', category: 'notifications' },
  { key: 'order_confirmation_email', value: 'true', description: 'Sipariş onay e-postası', category: 'notifications' },
  { key: 'maintenance_mode', value: 'false', description: 'Bakım modu', category: 'system' },
  { key: 'max_orders_per_user', value: '10', description: 'Kullanıcı başına max sipariş', category: 'system' }
];

export default function SettingsManagement() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    description: "",
    category: "general"
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      return await apiRequest("POST", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setIsFormOpen(false);
      setEditingSetting(null);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Ayar başarıyla kaydedildi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize default settings if none exist
  const initializeDefaultSettings = useMutation({
    mutationFn: async () => {
      for (const setting of DEFAULT_SETTINGS) {
        await apiRequest("POST", "/api/admin/settings", setting);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Başarılı",
        description: "Varsayılan ayarlar yüklendi.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      key: "",
      value: "",
      description: "",
      category: "general"
    });
  };

  const handleAdd = () => {
    resetForm();
    setEditingSetting(null);
    setIsFormOpen(true);
  };

  const handleEdit = (setting: Setting) => {
    setFormData({
      key: setting.key,
      value: setting.value,
      description: setting.description || "",
      category: setting.category || "general"
    });
    setEditingSetting(setting);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingMutation.mutate({
      key: formData.key,
      value: formData.value,
      description: formData.description
    });
  };

  const getSettingsByCategory = (category: string) => {
    if (!settings) return [];
    if (category === "all") return settings;
    return settings.filter((setting: Setting) => 
      (setting.category || 'general') === category
    );
  };

  const renderSettingValue = (setting: Setting) => {
    const value = setting.value;
    
    // Boolean values
    if (value === 'true' || value === 'false') {
      return (
        <div className="flex items-center gap-2">
          <Switch 
            checked={value === 'true'}
            onCheckedChange={(checked) => 
              updateSettingMutation.mutate({
                key: setting.key,
                value: checked.toString(),
                description: setting.description
              })
            }
            disabled={updateSettingMutation.isPending}
          />
          <span className="text-sm text-slate-300">
            {value === 'true' ? 'Aktif' : 'Pasif'}
          </span>
        </div>
      );
    }
    
    // Long text values
    if (value.length > 50) {
      return (
        <div className="text-sm text-slate-300">
          {value.substring(0, 50)}...
        </div>
      );
    }
    
    // Regular values
    return <div className="text-sm text-slate-300">{value}</div>;
  };

  const getCategoryIcon = (category: string) => {
    const categoryInfo = SETTING_CATEGORIES[category as keyof typeof SETTING_CATEGORIES] || SETTING_CATEGORIES.general;
    const Icon = categoryInfo.icon;
    return <Icon className={`h-4 w-4 ${categoryInfo.color}`} />;
  };

  const getCategoryLabel = (category: string) => {
    return SETTING_CATEGORIES[category as keyof typeof SETTING_CATEGORIES]?.label || 'Genel';
  };

  return (
    <AdminLayout title="Ayarlar" showAddButton onAddClick={handleAdd}>
      <div className="space-y-6">
        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="text-xs"
          >
            Tümü
          </Button>
          {Object.entries(SETTING_CATEGORIES).map(([key, info]) => {
            const Icon = info.icon;
            return (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className="text-xs"
              >
                <Icon className="h-3 w-3 mr-1" />
                {info.label}
              </Button>
            );
          })}
        </div>

        {/* Settings List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : settings?.length > 0 ? (
          <div className="space-y-4">
            {getSettingsByCategory(selectedCategory).map((setting: Setting) => (
              <Card key={setting.key} className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(setting.category || 'general')}
                        <div>
                          <div className="font-medium text-white">{setting.key}</div>
                          {setting.description && (
                            <div className="text-sm text-slate-400">{setting.description}</div>
                          )}
                          <div className="text-xs text-slate-500">
                            Kategori: {getCategoryLabel(setting.category || 'general')}
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        {renderSettingValue(setting)}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(setting)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      data-testid={`edit-setting-${setting.key}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="text-center py-12">
              <Settings className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Henüz Ayar Yok</h3>
              <p className="text-slate-400 mb-6">Sistem ayarlarını yapılandırmak için ayar ekleyebilirsiniz.</p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleAdd}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Ayar Ekle
                </Button>
                <Button
                  onClick={() => initializeDefaultSettings.mutate()}
                  variant="outline"
                  disabled={initializeDefaultSettings.isPending}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {initializeDefaultSettings.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Varsayılan Ayarları Yükle
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingSetting ? "Ayar Düzenle" : "Yeni Ayar Ekle"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingSetting ? "Mevcut ayarı güncelleyin." : "Yeni bir sistem ayarı oluşturun."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key" className="text-slate-300">
                  Ayar Anahtarı *
                </Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="örn: site_name, max_users"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                  disabled={!!editingSetting}
                  data-testid="setting-key-input"
                />
                <p className="text-xs text-slate-400">
                  Benzersiz bir anahtar adı girin (değiştirilemez)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value" className="text-slate-300">
                  Değer *
                </Label>
                <Textarea
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Ayar değerini girin"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                  rows={3}
                  data-testid="setting-value-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">
                  Açıklama
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bu ayarın ne işe yaradığını açıklayın"
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="setting-description-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-300">
                  Kategori
                </Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md"
                  data-testid="setting-category-select"
                >
                  {Object.entries(SETTING_CATEGORIES).map(([key, info]) => (
                    <option key={key} value={key}>{info.label}</option>
                  ))}
                </select>
              </div>
            </form>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                İptal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateSettingMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                data-testid="setting-submit-button"
              >
                {updateSettingMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-2" />
                {editingSetting ? "Güncelle" : "Kaydet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}