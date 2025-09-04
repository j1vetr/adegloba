export interface Translation {
  // Landing Page
  landing: {
    heroTitle1: string;
    heroTitle2: string;
    heroDescription: string;
    features: {
      starlink: string;
      maritime: string;
      instant: string;
      global: string;
    };
    buttons: {
      register: string;
      login: string;
    };
    trustBadges: {
      securePayment: string;
      instantActivation: string;
      globalCoverage: string;
    };
  };

  // Authentication
  auth: {
    systemLogin: string;
    welcomeMessage: string;
    accountLogin: string;
    username: string;
    password: string;
    loginButton: string;
    registerButton: string;
    notRegistered: string;
    alreadyHaveAccount: string;
    systemRegistration: string;
    noAccount: string;
    loginProcessing: string;
    invalidCredentials: string;
    loginFailed: string;
    registerSuccess: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    confirmPassword: string;
  };

  // Dashboard
  dashboard: {
    title: string;
    welcome: string;
    navigation: {
      home: string;
      packages: string;
      guide: string;
      support: string;
      profile: string;
      cart: string;
      logout: string;
      admin: string;
    };
    sections: {
      activePackages: string;
      expired: string;
      purchaseHistory: string;
    };
  };

  // Checkout & Payment
  checkout: {
    title: string;
    orderSummary: string;
    subtotal: string;
    total: string;
    couponCode: string;
    apply: string;
    securePayment: string;
    paypalPayment: string;
    cardPayment: string;
    processing: string;
    
    // Card Form
    cardInfo: string;
    cardNumber: string;
    cardNumberPlaceholder: string;
    expiryDate: string;
    expiryPlaceholder: string;
    cvv: string;
    cvvPlaceholder: string;
    cardHolder: string;
    cardHolderPlaceholder: string;
    
    // Personal Info
    personalInfo: string;
    emailAddress: string;
    emailPlaceholder: string;
    addressInfo: string;
    address: string;
    addressPlaceholder: string;
    city: string;
    cityPlaceholder: string;
    phoneNumber: string;
    phonePlaceholder: string;
    
    // Success/Error Messages
    paymentSuccess: string;
    paymentSuccessDesc: string;
    paymentError: string;
    paymentCancelled: string;
    paymentFailed: string;
    paymentTimeout: string;
    orderNotFound: string;
    invalidCard: string;
    cardDeclined: string;
    processingError: string;
    
    // Actions
    backToCart: string;
    viewPackages: string;
    retryPayment: string;
    backToPanel: string;
    
    // Order Details
    orderId: string;
    amount: string;
    status: string;
    paid: string;
  };

  // Admin Panel
  admin: {
    title: string;
    navigation: {
      dashboard: string;
      users: string;
      ships: string;
      packages: string;
      orders: string;
      coupons: string;
      settings: string;
      emailMarketing: string;
      reports: string;
      logs: string;
    };
    
    // General Actions
    actions: {
      create: string;
      edit: string;
      delete: string;
      save: string;
      cancel: string;
      search: string;
      filter: string;
      export: string;
      import: string;
      activate: string;
      deactivate: string;
      send: string;
      test: string;
    };
    
    // Status
    status: {
      active: string;
      inactive: string;
      pending: string;
      completed: string;
      failed: string;
      cancelled: string;
    };
  };

  // Support
  support: {
    newTicket: string;
    subject: string;
    priority: string;
    low: string;
    medium: string;
    high: string;
    message: string;
    sendReply: string;
    ticketList: string;
  };

  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    yes: string;
    no: string;
    ok: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    page: string;
    of: string;
    total: string;
    date: string;
    time: string;
    name: string;
    description: string;
    price: string;
    quantity: string;
    category: string;
    type: string;
    details: string;
  };
}

export const translations: Record<'tr' | 'en', Translation> = {
  tr: {
    landing: {
      heroTitle1: "AÇIK DENİZDE",
      heroTitle2: "SINIR YOK",
      heroDescription: "ile geminizde kesintisiz internet bağlantısının keyfini çıkarın.",
      features: {
        starlink: "Starlink Uydu",
        maritime: "Maritime Özel",
        instant: "Anında Aktif",
        global: "Global Kapsama"
      },
      buttons: {
        register: "Kayıt Ol",
        login: "Giriş Yap"
      },
      trustBadges: {
        securePayment: "Güvenli Ödeme",
        instantActivation: "Anında Aktif",
        globalCoverage: "Global Kapsama"
      }
    },
    
    auth: {
      systemLogin: "Sistem Girişi",
      welcomeMessage: "AdeGloba Starlink System'e hoş geldiniz",
      accountLogin: "Hesabıma Giriş",
      username: "Kullanıcı Adı / E-posta",
      password: "Şifre",
      loginButton: "Giriş Yap",
      registerButton: "Kayıt Ol",
      notRegistered: "Kayıtlı değil misiniz?",
      alreadyHaveAccount: "Zaten hesabınız var mı?",
      systemRegistration: "Sisteme Kayıt",
      noAccount: "Hesabınız yok mu?",
      loginProcessing: "Giriş Yapılıyor...",
      invalidCredentials: "Kullanıcı Adı / E-posta veya şifre hatalı",
      loginFailed: "Giriş işlemi başarısız",
      registerSuccess: "Kayıt başarılı! Şimdi giriş yapabilirsiniz.",
      fullName: "Ad Soyad",
      email: "E-posta Adresi",
      phone: "Telefon Numarası",
      address: "Adres",
      confirmPassword: "Şifre Tekrar"
    },
    
    dashboard: {
      title: "AdeGloba Starlink System - Kontrol Paneli",
      welcome: "Hoş geldiniz",
      navigation: {
        home: "Ana Sayfa",
        packages: "Paketler",
        guide: "Kullanım Kılavuzu",
        support: "Destek",
        profile: "Profil",
        cart: "Sepet",
        logout: "Çıkış",
        admin: "Yönetim Paneli"
      },
      sections: {
        activePackages: "Aktif Paketlerim",
        expired: "Süresi Doldu",
        purchaseHistory: "Geçmiş Satın Alımlar"
      }
    },
    
    checkout: {
      title: "Ödeme Sayfası",
      orderSummary: "Sipariş Özeti",
      subtotal: "Ara Toplam",
      total: "Toplam",
      couponCode: "Kupon Kodu",
      apply: "Uygula",
      securePayment: "Güvenli Ödeme",
      paypalPayment: "PayPal ile Ödeme",
      cardPayment: "Kart ile Ödeme",
      processing: "İşleniyor...",
      
      cardInfo: "Kart Bilgileri",
      cardNumber: "Kart Numarası",
      cardNumberPlaceholder: "Geçerli bir kart numarası girin",
      expiryDate: "Son Kullanma",
      expiryPlaceholder: "MM/YY formatında girin",
      cvv: "CVV",
      cvvPlaceholder: "Geçerli CVV girin",
      cardHolder: "Ad Soyad",
      cardHolderPlaceholder: "Ad ve soyadınızı girin",
      
      personalInfo: "Kişisel Bilgiler",
      emailAddress: "E-posta Adresi",
      emailPlaceholder: "Geçerli bir e-posta adresi girin",
      addressInfo: "Adres Bilgileri",
      address: "Adres",
      addressPlaceholder: "Tam adres bilgilerinizi girin",
      city: "Şehir",
      cityPlaceholder: "Şehir adı girin",
      phoneNumber: "Telefon Numarası",
      phonePlaceholder: "0532 123 45 67",
      
      paymentSuccess: "Ödeme Başarılı",
      paymentSuccessDesc: "Siparişiniz başarıyla tamamlandı!",
      paymentError: "Ödeme Hatası",
      paymentCancelled: "Ödeme İptal Edildi",
      paymentFailed: "Ödeme Başarısız",
      paymentTimeout: "İşlem Zaman Aşımı",
      orderNotFound: "Sipariş Bulunamadı",
      invalidCard: "Kart bilgileri geçersiz. Lütfen doğru bilgilerle tekrar deneyin.",
      cardDeclined: "Kartınız reddedildi. Farklı bir kart deneyin veya bankanızla iletişime geçin.",
      processingError: "Ödeme işlenemiyor. Kart bilgilerinizi kontrol edin.",
      
      backToCart: "Sepete Dön",
      viewPackages: "Paketleri Gör",
      retryPayment: "Ödemeyi Tekrar Dene",
      backToPanel: "Panele Dön",
      
      orderId: "Sipariş ID",
      amount: "Tutar",
      status: "Durum",
      paid: "Ödendi"
    },
    
    admin: {
      title: "AdeGloba Starlink System - Yönetim Paneli",
      navigation: {
        dashboard: "Ana Sayfa",
        users: "Kullanıcılar",
        ships: "Gemiler",
        packages: "Paketler",
        orders: "Siparişler",
        coupons: "Kuponlar",
        settings: "Ayarlar",
        emailMarketing: "E-posta Pazarlama",
        reports: "Raporlar",
        logs: "Sistem Logları"
      },
      
      actions: {
        create: "Oluştur",
        edit: "Düzenle",
        delete: "Sil",
        save: "Kaydet",
        cancel: "İptal",
        search: "Ara",
        filter: "Filtrele",
        export: "Dışa Aktar",
        import: "İçe Aktar",
        activate: "Aktif Et",
        deactivate: "Pasif Et",
        send: "Gönder",
        test: "Test"
      },
      
      status: {
        active: "Aktif",
        inactive: "Pasif",
        pending: "Bekliyor",
        completed: "Tamamlandı",
        failed: "Başarısız",
        cancelled: "İptal Edildi"
      }
    },
    
    support: {
      newTicket: "Yeni Destek Talebi",
      subject: "Konu Başlığı",
      priority: "Öncelik Seviyesi",
      low: "Düşük",
      medium: "Orta",
      high: "Yüksek",
      message: "Mesaj",
      sendReply: "Yanıt Gönder",
      ticketList: "Ticket Listesi"
    },
    
    common: {
      loading: "Yükleniyor...",
      error: "Hata",
      success: "Başarılı",
      warning: "Uyarı",
      info: "Bilgi",
      yes: "Evet",
      no: "Hayır",
      ok: "Tamam",
      close: "Kapat",
      back: "Geri",
      next: "İleri",
      previous: "Önceki",
      page: "Sayfa",
      of: "of",
      total: "Toplam",
      date: "Tarih",
      time: "Saat",
      name: "İsim",
      description: "Açıklama",
      price: "Fiyat",
      quantity: "Adet",
      category: "Kategori",
      type: "Tür",
      details: "Detaylar"
    }
  },
  
  en: {
    landing: {
      heroTitle1: "UNLIMITED",
      heroTitle2: "ON THE HIGH SEAS",
      heroDescription: "Enjoy uninterrupted internet connectivity on your vessel.",
      features: {
        starlink: "Starlink Satellite",
        maritime: "Maritime Special",
        instant: "Instant Activation",
        global: "Global Coverage"
      },
      buttons: {
        register: "Sign Up",
        login: "Sign In"
      },
      trustBadges: {
        securePayment: "Secure Payment",
        instantActivation: "Instant Activation",
        globalCoverage: "Global Coverage"
      }
    },
    
    auth: {
      systemLogin: "System Login",
      welcomeMessage: "Welcome to AdeGloba Starlink System",
      accountLogin: "Account Login",
      username: "Username / Email",
      password: "Password",
      loginButton: "Sign In",
      registerButton: "Sign Up",
      notRegistered: "Not registered?",
      alreadyHaveAccount: "Already have an account?",
      systemRegistration: "System Registration",
      noAccount: "Don't have an account?",
      loginProcessing: "Signing In...",
      invalidCredentials: "Invalid username/email or password",
      loginFailed: "Login failed",
      registerSuccess: "Registration successful! You can now sign in.",
      fullName: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      address: "Address",
      confirmPassword: "Confirm Password"
    },
    
    dashboard: {
      title: "AdeGloba Starlink System - Control Panel",
      welcome: "Welcome",
      navigation: {
        home: "Home",
        packages: "Packages",
        guide: "User Guide",
        support: "Support",
        profile: "Profile",
        cart: "Cart",
        logout: "Logout",
        admin: "Admin Panel"
      },
      sections: {
        activePackages: "My Active Packages",
        expired: "Expired",
        purchaseHistory: "Purchase History"
      }
    },
    
    checkout: {
      title: "Checkout",
      orderSummary: "Order Summary",
      subtotal: "Subtotal",
      total: "Total",
      couponCode: "Coupon Code",
      apply: "Apply",
      securePayment: "Secure Payment",
      paypalPayment: "Pay with PayPal",
      cardPayment: "Pay with Card",
      processing: "Processing...",
      
      cardInfo: "Card Information",
      cardNumber: "Card Number",
      cardNumberPlaceholder: "Enter a valid card number",
      expiryDate: "Expiry Date",
      expiryPlaceholder: "Enter in MM/YY format",
      cvv: "CVV",
      cvvPlaceholder: "Enter valid CVV",
      cardHolder: "Cardholder Name",
      cardHolderPlaceholder: "Enter your full name",
      
      personalInfo: "Personal Information",
      emailAddress: "Email Address",
      emailPlaceholder: "Enter a valid email address",
      addressInfo: "Address Information",
      address: "Address",
      addressPlaceholder: "Enter your complete address",
      city: "City",
      cityPlaceholder: "Enter city name",
      phoneNumber: "Phone Number",
      phonePlaceholder: "+1 234 567 8900",
      
      paymentSuccess: "Payment Successful",
      paymentSuccessDesc: "Your order has been completed successfully!",
      paymentError: "Payment Error",
      paymentCancelled: "Payment Cancelled",
      paymentFailed: "Payment Failed",
      paymentTimeout: "Transaction Timeout",
      orderNotFound: "Order Not Found",
      invalidCard: "Invalid card details. Please try again with correct information.",
      cardDeclined: "Your card was declined. Please try a different card or contact your bank.",
      processingError: "Payment cannot be processed. Please check your card details.",
      
      backToCart: "Back to Cart",
      viewPackages: "View Packages",
      retryPayment: "Retry Payment",
      backToPanel: "Back to Panel",
      
      orderId: "Order ID",
      amount: "Amount",
      status: "Status",
      paid: "Paid"
    },
    
    admin: {
      title: "AdeGloba Starlink System - Admin Panel",
      navigation: {
        dashboard: "Dashboard",
        users: "Users",
        ships: "Ships",
        packages: "Packages",
        orders: "Orders",
        coupons: "Coupons",
        settings: "Settings",
        emailMarketing: "Email Marketing",
        reports: "Reports",
        logs: "System Logs"
      },
      
      actions: {
        create: "Create",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        cancel: "Cancel",
        search: "Search",
        filter: "Filter",
        export: "Export",
        import: "Import",
        activate: "Activate",
        deactivate: "Deactivate",
        send: "Send",
        test: "Test"
      },
      
      status: {
        active: "Active",
        inactive: "Inactive",
        pending: "Pending",
        completed: "Completed",
        failed: "Failed",
        cancelled: "Cancelled"
      }
    },
    
    support: {
      newTicket: "New Support Ticket",
      subject: "Subject",
      priority: "Priority Level",
      low: "Low",
      medium: "Medium",
      high: "High",
      message: "Message",
      sendReply: "Send Reply",
      ticketList: "Ticket List"
    },
    
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      warning: "Warning",
      info: "Info",
      yes: "Yes",
      no: "No",
      ok: "OK",
      close: "Close",
      back: "Back",
      next: "Next",
      previous: "Previous",
      page: "Page",
      of: "of",
      total: "Total",
      date: "Date",
      time: "Time",
      name: "Name",
      description: "Description",
      price: "Price",
      quantity: "Quantity",
      category: "Category",
      type: "Type",
      details: "Details"
    }
  }
};