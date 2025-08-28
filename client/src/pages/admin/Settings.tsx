import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    siteName: 'StarLink Marine',
    whatsappNumber: '+447440225375',
    baseUrl: 'https://adegloba.toov.com.tr',
    paypalClientId: '',
    paypalSecret: '',
    paypalEnvironment: 'sandbox',
    defaultLanguage: 'en',
    timezone: 'Europe/Istanbul',
    privacyPolicy: '',
    termsOfService: '',
    cookiePolicy: ''
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
        switch (setting.key) {
          case 'paypalClientId':
            settingsObj.paypalClientId = setting.value || '';
            break;
          case 'paypalClientSecret':
            settingsObj.paypalSecret = setting.value || '';
            break;
          case 'paypalEnvironment':
            settingsObj.paypalEnvironment = setting.value || 'sandbox';
            break;
          default:
            settingsObj[setting.key] = setting.value;
        }
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
        title: "Success",
        description: "Setting updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  const handleSaveSetting = (key: string, value: string, category = 'general') => {
    updateSettingMutation.mutate({ key, value, category });
  };

  const handleSaveAll = () => {
    // Save PayPal settings with proper keys and categories
    const settingsMap = {
      paypalClientId: { key: 'paypalClientId', category: 'payment' },
      paypalSecret: { key: 'paypalClientSecret', category: 'payment' },
      paypalEnvironment: { key: 'paypalEnvironment', category: 'payment' },
      siteName: { key: 'siteName', category: 'general' },
      whatsappNumber: { key: 'whatsappNumber', category: 'general' },
      baseUrl: { key: 'base_url', category: 'general' },
      defaultLanguage: { key: 'defaultLanguage', category: 'general' },
      timezone: { key: 'timezone', category: 'general' },
      privacyPolicy: { key: 'privacyPolicy', category: 'general' },
      termsOfService: { key: 'termsOfService', category: 'general' },
      cookiePolicy: { key: 'cookiePolicy', category: 'general' },
    };

    Object.entries(settings).forEach(([settingKey, value]) => {
      const mapping = settingsMap[settingKey as keyof typeof settingsMap];
      if (mapping) {
        updateSettingMutation.mutate({ 
          key: mapping.key, 
          value: value as string, 
          category: mapping.category 
        });
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">System Settings</h3>
        <Button
          onClick={handleSaveAll}
          disabled={updateSettingMutation.isPending}
          className="bg-neon-cyan text-white hover:bg-neon-cyan/80"
          data-testid="save-all-settings"
        >
          {updateSettingMutation.isPending ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="general-settings">
          <h4 className="text-lg font-semibold text-white mb-4">General Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Site Name</Label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="glassmorphism border-slate-600 text-white"
                data-testid="site-name-input"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Default Language</Label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="w-full px-3 py-2 rounded-lg glassmorphism border border-slate-600 text-white bg-transparent"
                data-testid="language-select"
              >
                <option value="en">English</option>
                <option value="tr">Turkish</option>
              </select>
            </div>
            
            <div>
              <Label className="text-slate-300">Timezone</Label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg glassmorphism border border-slate-600 text-white bg-transparent"
                data-testid="timezone-select"
              >
                <option value="Europe/Istanbul">Europe/Istanbul</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
              </select>
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
                  onClick={() => handleSaveSetting('baseUrl', settings.baseUrl, 'general')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  data-testid="save-base-url"
                >
                  {updateSettingMutation.isPending ? '💫' : '✓'}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">WhatsApp Number</Label>
              <Input
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="glassmorphism border-slate-600 text-white"
                placeholder="+1234567890"
                data-testid="whatsapp-number-input"
              />
            </div>
          </div>
        </Card>

        {/* PayPal Settings */}
        <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="paypal-settings">
          <h4 className="text-lg font-semibold text-white mb-4">PayPal Integration</h4>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Environment</Label>
              <select
                value={settings.paypalEnvironment}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSettings({ ...settings, paypalEnvironment: newValue });
                  // Auto-save on change
                  handleSaveSetting('PAYPAL_ENV', newValue, 'payment');
                }}
                className="w-full px-3 py-2 rounded-lg glassmorphism border border-slate-600 text-white bg-transparent"
                data-testid="paypal-env-select"
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>
            
            <div>
              <Label className="text-slate-300">Client ID</Label>
              <Input
                value={settings.paypalClientId}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSettings({ ...settings, paypalClientId: newValue });
                  // Auto-save on change
                  handleSaveSetting('PAYPAL_CLIENT_ID', newValue, 'payment');
                }}
                className="glassmorphism border-slate-600 text-white"
                placeholder="PayPal Client ID (starts with AX...)"
                data-testid="paypal-client-id-input"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Client Secret</Label>
              <Input
                type="password"
                value={settings.paypalSecret}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSettings({ ...settings, paypalSecret: newValue });
                  // Auto-save on change
                  handleSaveSetting('PAYPAL_CLIENT_SECRET', newValue, 'payment');
                }}
                className="glassmorphism border-slate-600 text-white"
                placeholder="PayPal Client Secret (starts with EL...)"
                data-testid="paypal-secret-input"
              />
            </div>
          </div>
        </Card>

        {/* Legal Pages */}
        <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="legal-settings">
          <h4 className="text-lg font-semibold text-white mb-4">Legal Pages</h4>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Privacy Policy</Label>
              <Textarea
                value={settings.privacyPolicy}
                onChange={(e) => setSettings({ ...settings, privacyPolicy: e.target.value })}
                className="glassmorphism border-slate-600 text-white min-h-32"
                placeholder="Privacy policy content..."
                data-testid="privacy-policy-input"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Terms of Service</Label>
              <Textarea
                value={settings.termsOfService}
                onChange={(e) => setSettings({ ...settings, termsOfService: e.target.value })}
                className="glassmorphism border-slate-600 text-white min-h-32"
                placeholder="Terms of service content..."
                data-testid="terms-service-input"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Cookie Policy</Label>
              <Textarea
                value={settings.cookiePolicy}
                onChange={(e) => setSettings({ ...settings, cookiePolicy: e.target.value })}
                className="glassmorphism border-slate-600 text-white min-h-32"
                placeholder="Cookie policy content..."
                data-testid="cookie-policy-input"
              />
            </div>
          </div>
        </Card>

        {/* System Information */}
        <Card className="glassmorphism rounded-xl p-6 border-transparent" data-testid="system-info">
          <h4 className="text-lg font-semibold text-white mb-4">System Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-neon-green rounded-full"></div>
              <div>
                <div className="text-white font-medium">Database</div>
                <div className="text-sm text-slate-400">Connected</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-neon-green rounded-full"></div>
              <div>
                <div className="text-white font-medium">PayPal</div>
                <div className="text-sm text-slate-400">Configured</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-neon-green rounded-full"></div>
              <div>
                <div className="text-white font-medium">Email Service</div>
                <div className="text-sm text-slate-400">Ready</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-neon-green rounded-full"></div>
              <div>
                <div className="text-white font-medium">WhatsApp Integration</div>
                <div className="text-sm text-slate-400">Active</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Environment Variables Note */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-start space-x-2">
            <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
            <div>
              <h4 className="text-blue-500 font-medium">Environment Configuration</h4>
              <p className="text-slate-400 text-sm">
                Some settings like PayPal credentials should be configured via environment variables for security.
                These settings are provided for convenience but production deployments should use secure environment configuration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
