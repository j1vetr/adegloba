import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import AdminLayout from "@/components/AdminLayout";
import { Send, Calendar, Ship as ShipIcon, Mail, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const turkishMonths = [
  { value: '01', label: 'Ocak' },
  { value: '02', label: 'Şubat' },
  { value: '03', label: 'Mart' },
  { value: '04', label: 'Nisan' },
  { value: '05', label: 'Mayıs' },
  { value: '06', label: 'Haziran' },
  { value: '07', label: 'Temmuz' },
  { value: '08', label: 'Ağustos' },
  { value: '09', label: 'Eylül' },
  { value: '10', label: 'Ekim' },
  { value: '11', label: 'Kasım' },
  { value: '12', label: 'Aralık' },
];

export default function AdminReporting() {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const [reportType, setReportType] = useState<'monthly' | 'daterange'>('monthly');
  const [selectedShip, setSelectedShip] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Get ships for dropdown
  const { data: ships } = useQuery({
    queryKey: ["/api/admin/ships"],
    queryFn: async () => {
      const response = await fetch("/api/admin/ships", {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });
      return response.json();
    },
  });

  // Send report mutation
  const sendReportMutation = useMutation({
    mutationFn: async () => {
      let payload: any = {
        shipId: selectedShip === 'all' ? undefined : selectedShip,
      };

      if (reportType === 'monthly') {
        payload.month = selectedMonth;
        payload.year = selectedYear;
      } else {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }

      return await apiRequest('POST', '/api/admin/reports/send-email', payload);
    },
    onSuccess: () => {
      // Success handled in component
    },
  });

  const handleSendReport = async () => {
    // Clear previous status
    setStatusMessage(null);
    
    // Validation
    if (reportType === 'daterange') {
      if (!startDate || !endDate) {
        setStatusMessage({ 
          type: 'error', 
          message: 'Lütfen başlangıç ve bitiş tarihlerini seçin' 
        });
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setStatusMessage({ 
          type: 'error', 
          message: 'Başlangıç tarihi bitiş tarihinden sonra olamaz' 
        });
        return;
      }
    }

    try {
      const response = await sendReportMutation.mutateAsync();
      
      // Check if response has success field
      if (response && response.success) {
        setStatusMessage({ 
          type: 'success', 
          message: response.message || 'Excel raporu admin e-posta adresinize gönderildi!' 
        });
      } else {
        setStatusMessage({ 
          type: 'error', 
          message: response?.message || 'E-posta gönderimi başarısız oldu. SMTP ayarlarınızı kontrol edin.' 
        });
      }
    } catch (error: any) {
      console.error('Error sending report:', error);
      
      // Parse error message from response
      let errorMessage = 'E-posta gönderimi başarısız oldu';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setStatusMessage({ 
        type: 'error', 
        message: errorMessage + '. SMTP ayarlarınızı Ayarlar sayfasından kontrol edin.' 
      });
    }
  };

  // Generate years for dropdown (last 3 years + current year)
  const years = Array.from({ length: 4 }, (_, i) => String(currentYear - i));

  return (
    <AdminLayout title="Admin Raporlama">
      <div className="space-y-6">
        
        {/* Header Card */}
        <Card className="glassmorphism border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Send className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Admin Raporlama</h2>
              <p className="text-slate-400 text-sm">
                İstediğiniz tarih aralığında veya aya göre finansal raporu Excel formatında e-postanıza gönderin
              </p>
            </div>
          </div>
        </Card>

        {/* Report Configuration Card */}
        <Card className="glassmorphism border-slate-700 p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Rapor Ayarları
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Report Type Selection */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-300">Rapor Türü</Label>
              <Select value={reportType} onValueChange={(value: 'monthly' | 'daterange') => setReportType(value)}>
                <SelectTrigger className="glassmorphism border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="monthly" className="text-white hover:bg-slate-700">
                    Aylık Rapor
                  </SelectItem>
                  <SelectItem value="daterange" className="text-white hover:bg-slate-700">
                    Tarih Aralığı Raporu
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Monthly Report Fields */}
            {reportType === 'monthly' && (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-300">Ay</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="glassmorphism border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {turkishMonths.map((month) => (
                        <SelectItem key={month.value} value={month.value} className="text-white hover:bg-slate-700">
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Yıl</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="glassmorphism border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {years.map((year) => (
                        <SelectItem key={year} value={year} className="text-white hover:bg-slate-700">
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Date Range Fields */}
            {reportType === 'daterange' && (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-300">Başlangıç Tarihi</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="glassmorphism border-slate-600 text-white"
                    data-testid="input-start-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Bitiş Tarihi</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="glassmorphism border-slate-600 text-white"
                    data-testid="input-end-date"
                  />
                </div>
              </>
            )}

            {/* Ship Filter */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <ShipIcon className="w-4 h-4" />
                Gemi Filtresi
              </Label>
              <Select value={selectedShip} onValueChange={setSelectedShip}>
                <SelectTrigger className="glassmorphism border-slate-600 text-white">
                  <SelectValue placeholder="Gemi seçin" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    Tüm Gemiler
                  </SelectItem>
                  {ships?.map((ship: any) => (
                    <SelectItem key={ship.id} value={ship.id} className="text-white hover:bg-slate-700">
                      {ship.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Send Button Card */}
        <Card className="glassmorphism border-slate-700 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-500/20 mt-1">
                <Mail className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">E-Posta Gönderimi</h4>
                <p className="text-slate-400 text-sm">
                  Rapor Excel (.xlsx) formatında admin e-posta adresinize gönderilecektir.
                  <br />
                  E-posta ayarlarınızı kontrol etmek için <span className="text-primary">Ayarlar → Destek Ayarları</span> sayfasını ziyaret edin.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSendReport}
              disabled={sendReportMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white whitespace-nowrap"
              data-testid="button-send-report"
            >
              {sendReportMutation.isPending ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Raporu Gönder
                </>
              )}
            </Button>
          </div>

          {/* Status Messages */}
          {statusMessage && (
            <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
              statusMessage.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${statusMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {statusMessage.type === 'success' ? 'Başarılı!' : 'Hata'}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {statusMessage.message}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* SMTP Info Card */}
        <Card className="glassmorphism border-slate-700 p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 mt-1">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">SMTP Ayarları Bilgisi</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Rapor gönderimi için kullanılan SMTP ayarları <strong className="text-white">veritabanı settings tablosundan</strong> alınmaktadır:
              </p>
              <ul className="text-slate-400 text-sm mt-2 space-y-1 ml-4">
                <li>• <code className="text-blue-300 bg-slate-800 px-1 rounded">admin_email</code> - Raporun gönderileceği e-posta adresi</li>
                <li>• <code className="text-blue-300 bg-slate-800 px-1 rounded">smtp_host</code>, <code className="text-blue-300 bg-slate-800 px-1 rounded">smtp_port</code>, <code className="text-blue-300 bg-slate-800 px-1 rounded">smtp_user</code>, <code className="text-blue-300 bg-slate-800 px-1 rounded">smtp_password</code> - SMTP sunucu bilgileri</li>
              </ul>
              <p className="text-slate-400 text-sm mt-3">
                Bu ayarları değiştirmek için <strong className="text-primary">Ayarlar → Destek Ayarları</strong> sayfasını kullanabilirsiniz.
              </p>
            </div>
          </div>
        </Card>

      </div>
    </AdminLayout>
  );
}
