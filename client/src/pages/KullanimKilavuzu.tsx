import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  ShoppingCart, 
  CreditCard, 
  User, 
  HelpCircle, 
  Package, 
  CheckCircle,
  ArrowRight,
  Monitor,
  Wifi,
  Globe,
  Shield,
  Phone,
  Mail
} from "lucide-react";

export default function KullanimKilavuzu() {
  const [, setLocation] = useLocation();

  const steps = [
    {
      id: 1,
      title: "Hesap Oluşturun ve Giriş Yapın",
      icon: <User className="w-8 h-8 text-cyan-400" />,
      description: "AdeGloba Starlink sistemine kayıt olun ve güvenli giriş yapın",
      details: [
        "Ana sayfadan 'Kayıt Ol' butonuna tıklayın",
        "E-posta adresinizi ve güçlü bir şifre belirleyin",
        "Hesabınızı doğruladıktan sonra 'Giriş Yap' ile sisteme girin",
        "Profil sayfasından kişisel bilgilerinizi tamamlayın"
      ],
      buttonText: "Giriş Yap",
      buttonAction: () => setLocation("/giris"),
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: 2,
      title: "Paketleri İnceleyin",
      icon: <Package className="w-8 h-8 text-green-400" />,
      description: "Size uygun veri paketlerini keşfedin ve karşılaştırın",
      details: [
        "Müşteri panelinden 'Paketler' bölümüne gidin",
        "Farklı veri limitlerini (50GB, 100GB, 200GB) inceleyin",
        "Fiyatları ve paket özelliklerini karşılaştırın",
        "İhtiyacınıza uygun paketi seçin"
      ],
      buttonText: "Paketleri Gör",
      buttonAction: () => setLocation("/paketler"),
      color: "from-green-500 to-emerald-500"
    },
    {
      id: 3,
      title: "Sepete Ekleme ve Satın Alma",
      icon: <ShoppingCart className="w-8 h-8 text-purple-400" />,
      description: "Seçtiğiniz paketleri sepete ekleyin ve güvenli ödeme yapın",
      details: [
        "Beğendiğiniz paketi 'Sepete Ekle' ile sepete atın",
        "Sepet sayfasından paket detaylarını kontrol edin",
        "Kupon kodunuz varsa uygulayın",
        "PayPal veya kredi kartı ile güvenli ödeme yapın"
      ],
      buttonText: "Sepeti Gör",
      buttonAction: () => setLocation("/sepet"),
      color: "from-purple-500 to-pink-500"
    },
    {
      id: 4,
      title: "Ödeme ve Aktivasyon",
      icon: <CreditCard className="w-8 h-8 text-yellow-400" />,
      description: "Ödemenizi tamamlayın ve paketinizi anında kullanmaya başlayın",
      details: [
        "Ödeme sayfasında bilgilerinizi güvenle girin",
        "PayPal hesabınızla veya kredi kartınızla ödeme yapın",
        "Ödeme onayından sonra paketiniz otomatik aktif olur",
        "Giriş bilgileriniz e-posta ile gönderilir"
      ],
      buttonText: "Panel",
      buttonAction: () => setLocation("/panel"),
      color: "from-yellow-500 to-orange-500"
    },
    {
      id: 5,
      title: "Profil Yönetimi",
      icon: <Monitor className="w-8 h-8 text-indigo-400" />,
      description: "Kişisel bilgilerinizi güncelleyin ve hesabınızı yönetin",
      details: [
        "Müşteri panelinden 'Profil' sayfasına gidin",
        "Ad, soyad ve iletişim bilgilerinizi güncelleyin",
        "Şifrenizi değiştirmek için güvenlik ayarlarını kullanın",
        "Hesap bilgilerinizi düzenli olarak kontrol edin"
      ],
      buttonText: "Profil",
      buttonAction: () => setLocation("/profil"),
      color: "from-indigo-500 to-blue-500"
    },
    {
      id: 6,
      title: "Destek Alma",
      icon: <HelpCircle className="w-8 h-8 text-red-400" />,
      description: "Sorunlarınız için profesyonel destek alın",
      details: [
        "Panelden 'Destek' bölümüne gidin",
        "Yeni destek talebi oluşturun",
        "Sorununuzu detaylı olarak açıklayın",
        "WhatsApp destek hattından anlık yardım alın"
      ],
      buttonText: "Destek",
      buttonAction: () => setLocation("/destek"),
      color: "from-red-500 to-pink-500"
    }
  ];

  const features = [
    {
      icon: <Wifi className="w-6 h-6 text-cyan-400" />,
      title: "Anlık Aktivasyon",
      description: "Ödeme sonrası paketiniz anında aktif olur"
    },
    {
      icon: <Globe className="w-6 h-6 text-green-400" />,
      title: "Global Kapsama",
      description: "Dünyanın her yerinde internet erişimi"
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      title: "Güvenli Ödeme",
      description: "PayPal ve SSL ile korumalı işlemler"
    },
    {
      icon: <Phone className="w-6 h-6 text-purple-400" />,
      title: "7/24 Destek",
      description: "Her an ulaşabileceğiniz teknik destek"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                📚 Kullanım Kılavuzu
              </h1>
              <p className="text-slate-300">
                AdeGloba Starlink sistemini nasıl kullanacağınızı adım adım öğrenin
              </p>
            </div>
            <Button
              onClick={() => setLocation("/panel")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              Panele Dön
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="glassmorphism border border-slate-600/30 bg-slate-800/30 p-4 text-center">
              <div className="flex justify-center mb-3">
                {feature.icon}
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">{feature.title}</h3>
              <p className="text-slate-400 text-xs">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Step by Step Guide */}
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              6 Adımda Starlink Paketi Satın Alın
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Sistemi ilk kez kullanıyorsanız aşağıdaki adımları takip ederek kolayca paket satın alabilirsiniz
            </p>
          </div>

          {steps.map((step, index) => (
            <Card key={step.id} className="glassmorphism border border-slate-600/30 bg-slate-800/30 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
                  {/* Step Number & Icon */}
                  <div className="flex items-center space-x-4 mb-6 lg:mb-0">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-xl`}>
                      {step.id}
                    </div>
                    <div className="hidden lg:block">
                      {step.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-slate-300 mb-4">
                      {step.description}
                    </p>

                    {/* Step Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {step.details.map((detail, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-400 text-sm">{detail}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={step.buttonAction}
                      className={`bg-gradient-to-r ${step.color} hover:opacity-90 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl`}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      {step.buttonText}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Progress Indicator */}
              {index < steps.length - 1 && (
                <div className="h-1 bg-gradient-to-r from-slate-700 to-slate-600">
                  <div 
                    className={`h-full bg-gradient-to-r ${step.color} transition-all duration-500`}
                    style={{ width: `${((index + 1) / steps.length) * 100}%` }}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Support Section */}
        <Card className="glassmorphism border border-slate-600/30 bg-slate-800/30 p-8 mt-12">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">
              Hâlâ Yardıma İhtiyacınız Var mı?
            </h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Herhangi bir adımda zorlanırsanız profesyonel destek ekibimiz size yardımcı olmaktan mutluluk duyar
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setLocation("/destek")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold"
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Destek Talebi Oluştur
              </Button>
              
              <Button
                onClick={() => window.open('https://wa.me/447440225375?text=Merhaba! AdeGloba Starlink sistemi hakkında yardıma ihtiyacım var.', '_blank')}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-semibold"
              >
                <Phone className="w-5 h-5 mr-2" />
                WhatsApp Destek
              </Button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-600/30">
              <div className="flex justify-center space-x-8 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>support@adegloba.space</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>+44 744 022 5375</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}