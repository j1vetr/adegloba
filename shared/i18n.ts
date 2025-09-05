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
    usernameOrEmail: string;
    usernameOnly: string;
    emailLabel: string;
    phoneNumber: string;
    selectShip: string;
    chooseShip: string;
    loadingShips: string;
    loginNow: string;
    joinMessage: string;
    createNewAccount: string;
    systemAccess: string;
    registrationProcessing: string;
    privateSystemNotice: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    phonePlaceholder: string;
  };

  // Dashboard & Panel
  dashboard: {
    title: string;
    welcome: string;
    systemNotice: string;
    managementDescription: string;
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
      packagesShort: string;
      historyShort: string;
      expiredShort: string;
    };
    stats: {
      activePlans: string;
      totalSpent: string;
      shipsConnected: string;
    };
    purchase: {
      buyDataPackage: string;
      createOrder: string;
      buyAgain: string;
      noOrdersYet: string;
      startBrowsing: string;
      browsePlans: string;
    };
    status: {
      active: string;
      expired: string;
      pending: string;
      paid: string;
      completed: string;
      failed: string;
      refunded: string;
      cancelled: string;
      daysLeft: string;
    };
    texts: {
      loadingPackages: string;
      noActivePackages: string;
      noActivePackagesDesc: string;
      buyFirstPackage: string;
      noPurchaseHistory: string;
      ship: string;
      expiredPackagesTitle: string;
      loadingExpiredPackages: string;
      noExpiredPackages: string;
      noExpiredPackagesDesc: string;
      paginationText: string;
    };
  };

  packages: {
    title: string;
    subtitle: string;
    shipId: string;
    unspecified: string;
    dataPackages: string;
    loadingPackages: string;
    highSpeedData: string;
    available: string;
    monthEndValidity: string;
    monthEndValidityDesc: string;
    starlinkTech: string;
    starlinkTechDesc: string;
    internetData: string;
    internetDataDesc: string;
    addToCart: string;
    adding: string;
    addedToCart: string;
    addedToCartDesc: string;
    error: string;
    noPackagesTitle: string;
    noPackagesDesc: string;
    contactAdmin: string;
    highSpeedTitle: string;
    highSpeedDesc: string;
    flexiblePackagesTitle: string;
    flexiblePackagesDesc: string;
    shipSpecificTitle: string;
    shipSpecificDesc: string;
  };

  // Profile
  profile: {
    title: string;
    personalInfo: string;
    editProfile: string;
    saveChanges: string;
    cancel: string;
    username: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    selectShip: string;
    address: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    registrationDate: string;
    changePassword: string;
    cannotChange: string;
  };


  // User Guide
  guide: {
    title: string;
    subtitle: string;
    sections: string;
  };


  // Cart Page
  cart: {
    title: string;
    description: string;
    loading: string;
    empty: string;
    emptyDescription: string;
    browsePackages: string;
    clearCart: string;
    clearCartConfirm: string;
    quantity: string;
    remove: string;
    removeSuccess: string;
    clearSuccess: string;
    checkoutProcessing: string;
    securityNotice: string;
    monthEndExpiry: string;
    couponHint: string;
    couponDescription: string;
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
    proceedToPayment: string;
    
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
    removed: string;
    cleared: string;
    created: string;
    copied: string;
    copiedDescription: string;
    redirecting: string;
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

export const translations: Record<'tr' | 'en' | 'ru', Translation> = {
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
      enterUsername: "Kullanıcı adı veya e-posta adresinizi girin",
      enterPassword: "Şifrenizi girin",
      enterEmail: "E-posta adresinizi girin",
      connectionError: "Bağlantı hatası oluştu",
      loggingIn: "Giriş Yapılıyor...",
      joinMessage: "AdeGloba Starlink System'e katılın",
      createNewAccount: "Yeni Hesap Oluştur",
      systemAccess: "Sisteme erişim için gerekli bilgileri doldurun",
      fullName: "İsim Soyisim",
      phoneNumber: "Telefon Numarası",
      selectShip: "Gemi Seçin",
      address: "Adresiniz",
      chooseShip: "Geminizi seçin",
      loadingShips: "Gemiler yükleniyor...",
      passwordMinLength: "Şifrenizi girin (en az 6 karakter)",
      registering: "Kayıt oluşturuluyor...",
      loginNow: "Şimdi Giriş Yap",
      usernameOrEmail: "Kullanıcı Adı / E-posta",
      usernameOnly: "Kullanıcı Adı",
      emailLabel: "E-posta",
      phoneNumber: "Telefon",
      selectShip: "Gemi Seçimi",
      chooseShip: "Gemi seçiniz",
      loadingShips: "Gemiler yükleniyor...",
      loginNow: "Giriş yap",
      joinMessage: "Denizde güvenilir internet bağlantısı için sisteme katılın",
      createNewAccount: "Yeni Hesap Oluştur",
      systemAccess: "Sistem erişimi için lütfen bilgilerinizi girin",
      registrationProcessing: "Kayıt işlemi devam ediyor...",
      privateSystemNotice: "Bu sistem AdeGloba Starlink System müşterilerine özeldir.",
      emailPlaceholder: "E-posta adresinizi girin",
      passwordPlaceholder: "Şifrenizi girin (en az 6 karakter)",
      phonePlaceholder: "532 123 45 67"
    },
    profile: {
      fullName: "Ad Soyad",
      email: "E-posta Adresi",
      phone: "Telefon Numarası",
      address: "Adres",
      confirmPassword: "Şifre Tekrar"
    },
    
    dashboard: {
      title: "AdeGloba Starlink System - Kontrol Paneli",
      welcome: "Hoş geldiniz",
      systemNotice: "Bu sistem AdeGloba Starlink System müşterilerine özeldir.",
      managementDescription: "Hesabınızı yönetin ve satın alma geçmişinizi görüntüleyin",
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
        purchaseHistory: "Geçmiş Satın Alımlar",
        packagesShort: "Paketler",
        historyShort: "Geçmiş",
        expiredShort: "Bitmiş"
      },
      stats: {
        activePlans: "Aktif Planlar",
        totalSpent: "Toplam Harcama",
        shipsConnected: "Bağlı Gemiler"
      },
      purchase: {
        buyDataPackage: "Data Paketi Satın Al",
        createOrder: "Oluşturuluyor...",
        buyAgain: "Tekrar Satın Al",
        noOrdersYet: "Henüz sipariş yok",
        startBrowsing: "Data paketlerimize göz atmaya başlayın",
        browsePlans: "Paketlere Göz At"
      },
      status: {
        active: "Aktif",
        expired: "Süresi Doldu",
        pending: "Beklemede",
        paid: "Ödendi",
        completed: "Tamamlandı",
        failed: "Başarısız",
        refunded: "İade Edildi",
        cancelled: "İptal Edildi",
        daysLeft: "gün kaldı"
      },
      texts: {
        loadingPackages: "Paketler yükleniyor...",
        noActivePackages: "Henüz Aktif Paket Yok",
        noActivePackagesDesc: "AdeGloba Starlink System'de ilk data paketinizi satın alın ve kesintisiz internete başlayın.",
        buyFirstPackage: "İlk Paketinizi Satın Alın",
        noPurchaseHistory: "Henüz satın alım geçmişiniz bulunmamaktadır.",
        ship: "Gemi:",
        expiredPackagesTitle: "Süresi Doldu Paketlerim",
        loadingExpiredPackages: "Bitmiş paketler yükleniyor...",
        noExpiredPackages: "Bitmiş Paket Yok",
        noExpiredPackagesDesc: "Henüz süresi dolmuş paketiniz bulunmamaktadır. Aktif paketleriniz sona erdiğinde burada görünecek.",
        paginationText: "Toplam {total} paket • Sayfa {current} / {totalPages}"
      }
    },

    packages: {
      title: "AdeGloba Starlink System - Data Paketleri",
      subtitle: "Geminiz için özel olarak tasarlanmış Starlink data paketlerini keşfedin",
      shipId: "Gemi ID:",
      unspecified: "Belirtilmemiş",
      dataPackages: "Data Paketleri",
      loadingPackages: "Paketler yükleniyor...",
      highSpeedData: "Yüksek Hızlı Data",
      available: "Satışta",
      monthEndValidity: "Ay Sonu Geçerlilik",
      monthEndValidityDesc: "Paket ay sonuna kadar aktif",
      starlinkTech: "Starlink Teknolojisi",
      starlinkTechDesc: "Düşük gecikme, yüksek hız",
      internetData: "İnternet",
      internetDataDesc: "Yüksek hızlı deniz interneti",
      addToCart: "Sepete Ekle",
      adding: "Ekleniyor...",
      addedToCart: "Sepete Eklendi",
      addedToCartDesc: "Paket başarıyla sepete eklendi",
      error: "Hata",
      noPackagesTitle: "Henüz Paket Bulunamadı",
      noPackagesDesc: "Seçili gemi için henüz aktif paket bulunmamaktadır.",
      contactAdmin: "Lütfen admin ile iletişime geçin.",
      highSpeedTitle: "Yüksek Hız",
      highSpeedDesc: "Starlink uydu teknolojisiyle denizde yüksek hızda internet erişimi",
      flexiblePackagesTitle: "Esnek Paketler",
      flexiblePackagesDesc: "İhtiyacınıza göre farklı GB seçenekleri ve geçerlilik süreleri",
      shipSpecificTitle: "Gemiye Özel",
      shipSpecificDesc: "Her gemi için özelleştirilmiş paket seçenekleri"
    },

    profile: {
      title: "AdeGloba Starlink System - Profil",
      personalInfo: "Profil Bilgileri",
      editProfile: "Profil Düzenle",
      saveChanges: "Değişiklikleri Kaydet",
      cancel: "İptal",
      username: "Kullanıcı Adı",
      email: "E-posta",
      fullName: "İsim Soyisim",
      phoneNumber: "Telefon Numarası",
      selectShip: "Gemi Seçin",
      address: "Adresiniz",
      currentPassword: "Mevcut Şifre",
      newPassword: "Yeni Şifre",
      confirmPassword: "Yeni Şifre Tekrar",
      registrationDate: "Kayıt Tarihi",
      changePassword: "Şifre Değiştir (İsteğe Bağlı)",
      cannotChange: "Bu alan değiştirilemez"
    },

    cart: {
      title: "Sepetim",
      description: "Paketlerinizi inceleyin ve ödeme işlemine geçin",
      loading: "Sepet yükleniyor...",
      empty: "Sepetiniz Boş",
      emptyDescription: "Paket eklemek için paketler sayfasını ziyaret edin.",
      browsePackages: "Paketlere Göz At",
      clearCart: "Sepeti Temizle",
      clearCartConfirm: "Tüm ürünleri sepetten çıkarmak istediğinizden emin misiniz?",
      quantity: "Adet",
      remove: "Kaldır",
      removeSuccess: "Ürün sepetten kaldırıldı",
      clearSuccess: "Sepet temizlendi",
      checkoutProcessing: "Ödeme işlemi hazırlanıyor...",
      securityNotice: "Güvenli 256-bit SSL şifreleme",
      monthEndExpiry: "Ay sonu bitiş",
      couponHint: "Kupon kodu var mı?",
      couponDescription: "Ödeme sayfasında kupon kodunuzu girebilirsiniz"
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
      description: "Siparişinizi tamamlayın ve Starlink bağlantınızı başlatın",
      orderDetails: "Sipariş Detayları",
      couponPlaceholder: "Kupon kodunu girin",
      applyCoupon: "Uygula",
      couponDiscount: "indirim",
      totalDiscount: "toplam indirim",
      couponApplied: "Kupon Uygulandı",
      paymentSuccess: "Ödeme Başarılı",
      paymentFailed: "Ödeme Başarısız",
      secureSsl: "Güvenli 256-bit SSL şifreleme",
      loading: "Ödeme sayfası yükleniyor...",
      proceedToPayment: "Ödemeye Devam Et",
      secure3D: "3D Secure ile güvenli ödeme",
      cardPayment: "Kart ile Ödeme",
      processing: "İşleniyor...",
      proceedToPayment: "Ödemeye Geç",
      
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
      couponApplied: "✅ Kupon Başarıyla Uygulandı!",
      couponDiscount: "kuponunuz",
      totalDiscount: "indirim sağladı. Toplam indirimi",
      couponError: "❌ Kupon Hatası",
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
      ticketList: "Ticket Listesi",
      title: "Destek Talepleri Yönetimi",
      description: "Kullanıcı destek taleplerini görüntüleyin ve yeni talep oluşturun",
      createTicket: "Yeni Destek Talebi",
      ticketId: "Talep ID",
      goBack: "Geri Dön",
      ticketNotFound: "Talep Bulunamadı",
      ticketInfo: "Talep Bilgileri",
      status: "Durum",
      createdAt: "Oluşturulma Tarihi",
      conversationHistory: "Konuşma Geçmişi",
      replyPlaceholder: "Yanıtınızı buraya yazın...",
      replySent: "Yanıtınız gönderildi.",
      replyError: "Yanıt gönderilirken bir hata oluştu.",
      ticketClosed: "Bu talep kapatılmıştır. Yeni yanıt gönderilemez.",
      subjectLabel: "Konu Başlığı",
      priorityLevel: "Öncelik Seviyesi",
      messageLabel: "Mesaj",
      messageRequired: "Mesaj boş olamaz",
      you: "Siz",
      supportTeam: "Destek Ekibi",
      open: "Açık",
      closed: "Kapalı",
      totalTickets: "Toplam Ticket",
      noTicketsYet: "Henüz destek talebi oluşturmadınız...",
      createFirstTicket: "İlk Talebi Oluştur"
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
      removed: "Kaldırıldı",
      cleared: "Temizlendi",
      created: "Sipariş Oluşturuldu",
      copied: "Kopyalandı",
      copiedDescription: "panoya kopyalandı",
      redirecting: "Ödeme sayfasına yönlendiriliyorsunuz...",
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
      details: "Detaylar",
      removed: "Kaldırıldı",
      cleared: "Temizlendi",
      created: "Oluşturuldu",
      redirecting: "Yönlendiriliyor..."
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
      enterUsername: "Enter your username or email",
      enterPassword: "Enter your password",
      enterEmail: "Enter your email address",
      connectionError: "Connection error occurred",
      loggingIn: "Signing in...",
      joinMessage: "Join AdeGloba Starlink System",
      createNewAccount: "Create New Account",
      systemAccess: "Fill in the required information for system access",
      fullName: "Full Name",
      phoneNumber: "Phone Number",
      selectShip: "Select Ship",
      address: "Address",
      chooseShip: "Choose your ship",
      loadingShips: "Loading ships...",
      passwordMinLength: "Enter your password (minimum 6 characters)",
      registering: "Registering...",
      loginNow: "Sign In Now",
      usernameOrEmail: "Username / Email",
      usernameOnly: "Username",
      emailLabel: "Email"
    },
    profile: {
      fullName: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      address: "Address",
      confirmPassword: "Confirm Password"
    },
    
    dashboard: {
      title: "AdeGloba Starlink System - Control Panel",
      welcome: "Welcome",
      systemNotice: "This system is exclusive to AdeGloba Starlink System customers.",
      managementDescription: "Manage your account and view purchase history",
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
        purchaseHistory: "Purchase History",
        packagesShort: "Packages",
        historyShort: "History",
        expiredShort: "Expired"
      },
      stats: {
        activePlans: "Active Plans",
        totalSpent: "Total Spent",
        shipsConnected: "Ships Connected"
      },
      purchase: {
        buyDataPackage: "Buy Data Package",
        createOrder: "Creating...",
        buyAgain: "Buy Again",
        noOrdersYet: "No orders yet",
        startBrowsing: "Start by browsing our data packages",
        browsePlans: "Browse Plans"
      },
      status: {
        active: "Active",
        expired: "Expired",
        pending: "Pending",
        paid: "Paid",
        completed: "Completed",
        failed: "Failed",
        refunded: "Refunded",
        cancelled: "Cancelled",
        daysLeft: "days left"
      },
      texts: {
        loadingPackages: "Loading packages...",
        noActivePackages: "No Active Packages Yet",
        noActivePackagesDesc: "Purchase your first data package in AdeGloba Starlink System and start uninterrupted internet.",
        buyFirstPackage: "Buy Your First Package",
        noPurchaseHistory: "You don't have any purchase history yet.",
        ship: "Ship:",
        expiredPackagesTitle: "My Expired Packages",
        loadingExpiredPackages: "Loading expired packages...",
        noExpiredPackages: "No Expired Packages",
        noExpiredPackagesDesc: "You don't have any expired packages yet. When your active packages expire, they will appear here.",
        paginationText: "Total {total} packages • Page {current} / {totalPages}"
      }
    },

    packages: {
      title: "AdeGloba Starlink System - Data Packages",
      subtitle: "Discover Starlink data packages specially designed for your vessel",
      shipId: "Ship ID:",
      unspecified: "Unspecified",
      dataPackages: "Data Packages",
      loadingPackages: "Loading packages...",
      highSpeedData: "High Speed Data",
      available: "Available",
      monthEndValidity: "Month-End Validity",
      monthEndValidityDesc: "Package active until end of month",
      starlinkTech: "Starlink Technology",
      starlinkTechDesc: "Low latency, high speed",
      internetData: "Internet",
      internetDataDesc: "High-speed maritime internet",
      addToCart: "Add to Cart",
      adding: "Adding...",
      addedToCart: "Added to Cart",
      addedToCartDesc: "Package successfully added to cart",
      error: "Error",
      noPackagesTitle: "No Packages Found Yet",
      noPackagesDesc: "No active packages found for the selected vessel.",
      contactAdmin: "Please contact admin.",
      highSpeedTitle: "High Speed",
      highSpeedDesc: "High-speed internet access at sea with Starlink satellite technology",
      flexiblePackagesTitle: "Flexible Packages",
      flexiblePackagesDesc: "Different GB options and validity periods according to your needs",
      shipSpecificTitle: "Vessel Specific",
      shipSpecificDesc: "Customized package options for each vessel"
    },

    profile: {
      title: "AdeGloba Starlink System - Profile",
      personalInfo: "Profile Information",
      editProfile: "Edit Profile",
      saveChanges: "Save Changes",
      cancel: "Cancel",
      username: "Username",
      email: "Email",
      fullName: "Full Name",
      phoneNumber: "Phone Number",
      selectShip: "Select Ship",
      address: "Address",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      registrationDate: "Registration Date",
      changePassword: "Change Password (Optional)",
      cannotChange: "This field cannot be changed"
    },

    cart: {
      title: "My Cart",
      description: "Review your packages and proceed to checkout",
      loading: "Loading cart...",
      empty: "Your Cart is Empty",
      emptyDescription: "Visit packages page to add packages.",
      browsePackages: "Browse Packages",
      clearCart: "Clear Cart",
      clearCartConfirm: "Are you sure you want to remove all items from your cart?",
      quantity: "Quantity",
      remove: "Remove",
      removeSuccess: "Item removed from cart",
      clearSuccess: "Cart cleared",
      checkoutProcessing: "Preparing checkout...",
      securityNotice: "Secure 256-bit SSL encryption",
      monthEndExpiry: "Month-end expiry",
      couponHint: "Have a coupon code?",
      couponDescription: "You can enter your coupon code on the checkout page"
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
      secure3D: "3D Secure secure payment",
      description: "Complete your order and start your Starlink connection",
      orderDetails: "Order Details",
      couponPlaceholder: "Enter coupon code",
      applyCoupon: "Apply",
      couponDiscount: "discount",
      totalDiscount: "total discount",
      couponApplied: "Coupon Applied",
      paymentSuccess: "Payment Successful",
      paymentFailed: "Payment Failed",
      secureSsl: "Secure 256-bit SSL encryption",
      loading: "Payment page loading...",
      proceedToPayment: "Proceed to Payment",
      cardPayment: "Pay with Card",
      processing: "Processing...",
      proceedToPayment: "Proceed to Payment",
      
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
      couponApplied: "✅ Coupon Applied Successfully!",
      couponDiscount: "coupon provided",
      totalDiscount: "discount. Total discount",
      couponError: "❌ Coupon Error",
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
      ticketList: "Ticket List",
      title: "Support Ticket Management",
      description: "View and create user support tickets",
      createTicket: "New Support Ticket",
      ticketId: "Ticket ID",
      goBack: "Go Back",
      ticketNotFound: "Ticket Not Found",
      ticketInfo: "Ticket Information",
      status: "Status",
      createdAt: "Created At",
      conversationHistory: "Conversation History",
      replyPlaceholder: "Write your reply here...",
      replySent: "Your reply has been sent.",
      replyError: "Error occurred while sending reply.",
      ticketClosed: "This ticket is closed. No new replies can be sent.",
      subjectLabel: "Subject",
      priorityLevel: "Priority Level",
      messageLabel: "Message",
      messageRequired: "Message cannot be empty",
      you: "You",
      supportTeam: "Support Team",
      open: "Open",
      closed: "Closed",
      totalTickets: "Total Tickets",
      noTicketsYet: "You haven't created any support tickets yet...",
      createFirstTicket: "Create First Ticket"
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
      removed: "Removed",
      cleared: "Cleared",
      created: "Order Created",
      copied: "Copied",
      copiedDescription: "copied to clipboard",
      redirecting: "Redirecting to payment page...",
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
      details: "Details",
      removed: "Removed",
      cleared: "Cleared",
      created: "Created",
      redirecting: "Redirecting..."
    }
  },

  ru: {
    landing: {
      heroTitle1: "В ОТКРЫТОМ МОРЕ",
      heroTitle2: "НЕТ ГРАНИЦ",
      heroDescription: "Система морского интернета AdeGloba Starlink обеспечивает бесперебойную связь на любой широте мирового океана",
      features: {
        starlink: "Технология Starlink",
        maritime: "Морской Интернет",
        instant: "Мгновенная Активация",
        global: "Глобальное Покрытие"
      },
      buttons: {
        register: "Регистрация",
        login: "Вход"
      },
      trustBadges: {
        securePayment: "Безопасная Оплата",
        instantActivation: "Мгновенная Активация",
        globalCoverage: "Глобальное Покрытие"
      }
    },

    auth: {
      systemLogin: "Вход в систему AdeGloba Starlink",
      welcomeMessage: "Добро пожаловать в систему управления морским интернетом",
      accountLogin: "Вход в аккаунт",
      username: "Имя пользователя",
      password: "Пароль",
      loginButton: "Войти",
      registerButton: "Зарегистрироваться",
      notRegistered: "Еще не зарегистрированы?",
      alreadyHaveAccount: "Уже есть аккаунт?",
      systemRegistration: "Регистрация в системе AdeGloba Starlink",
      noAccount: "Нет аккаунта?",
      loginProcessing: "Выполняется вход...",
      invalidCredentials: "Неверные учетные данные",
      loginFailed: "Ошибка входа",
      registerSuccess: "Регистрация успешна",
      fullName: "Полное имя",
      email: "Электронная почта",
      phone: "Телефон",
      address: "Адрес",
      confirmPassword: "Подтвердите пароль",
      usernameOrEmail: "Имя пользователя или email",
      usernameOnly: "Имя пользователя",
      emailLabel: "Электронная почта",
      phoneNumber: "Телефон",
      selectShip: "Выбор судна",
      chooseShip: "Выберите судно",
      loadingShips: "Загрузка судов...",
      loginNow: "Войти сейчас",
      joinMessage: "Присоединяйтесь к системе для надёжного интернет-соединения на море",
      createNewAccount: "Создать аккаунт",
      systemAccess: "Для доступа к системе заполните данные",
      registrationProcessing: "Регистрация...",
      privateSystemNotice: "Эта система предназначена только для клиентов AdeGloba Starlink System.",
      emailPlaceholder: "Введите адрес эл. почты",
      passwordPlaceholder: "Введите пароль (не менее 6 символов)",
      phonePlaceholder: "900 123 45 67"
    },

    dashboard: {
      title: "Система AdeGloba Starlink - Панель управления",
      welcome: "Добро пожаловать в панель управления",
      systemNotice: "Система морского интернета для клиентов AdeGloba",
      managementDescription: "Управляйте своими пакетами данных Starlink и следите за использованием",
      navigation: {
        home: "Главная",
        packages: "Пакеты",
        guide: "Руководство",
        support: "Поддержка",
        profile: "Профиль",
        cart: "Корзина",
        logout: "Выход",
        admin: "Администратор"
      },
      sections: {
        activePackages: "Активные пакеты",
        expired: "Истекшие",
        purchaseHistory: "История покупок",
        packagesShort: "Пакеты",
        historyShort: "История",
        expiredShort: "Истекшие"
      },
      stats: {
        activePlans: "Активных планов",
        totalSpent: "Общие расходы",
        shipsConnected: "Подключенных судов"
      },
      purchase: {
        buyDataPackage: "Купить пакет данных",
        createOrder: "Создать заказ",
        noActivePackages: "Пока нет активных пакетов",
        noOrdersYet: "У вас пока нет истории заказов.",
        startBrowsing: "Начните просматривать наши пакеты данных",
        browsePlans: "Просмотреть планы"
      },
      status: {
        active: "Активный",
        expired: "Истекший",
        pending: "Ожидание",
        processing: "Обработка",
        completed: "Завершен",
        refunded: "Возвращен",
        cancelled: "Отменен",
        daysLeft: "дней осталось"
      },
      texts: {
        loadingPackages: "Загрузка пакетов...",
        noActivePackages: "Пока нет активных пакетов",
        noActivePackagesDesc: "Купите свой первый пакет данных в системе AdeGloba Starlink и начните пользоваться бесперебойным интернетом.",
        buyFirstPackage: "Купить первый пакет",
        noPurchaseHistory: "У вас пока нет истории покупок.",
        ship: "Судно:",
        expiredPackagesTitle: "Мои истекшие пакеты",
        loadingExpiredPackages: "Загрузка истекших пакетов...",
        noExpiredPackages: "Нет истекших пакетов",
        noExpiredPackagesDesc: "У вас пока нет истекших пакетов. Когда ваши активные пакеты истекут, они появятся здесь.",
        paginationText: "Всего {total} пакетов • Страница {current} / {totalPages}"
      }
    },

    packages: {
      title: "Система AdeGloba Starlink - Пакеты данных",
      subtitle: "Откройте для себя пакеты данных Starlink, специально разработанные для вашего судна",
      shipId: "ID судна:",
      unspecified: "Не указано",
      dataPackages: "Пакеты данных",
      loadingPackages: "Загрузка пакетов...",
      highSpeedData: "Высокоскоростные данные",
      available: "Доступно",
      monthEndValidity: "Действительность до конца месяца",
      monthEndValidityDesc: "Пакет активен до конца месяца",
      starlinkTech: "Технология Starlink",
      starlinkTechDesc: "Низкая задержка, высокая скорость",
      internetData: "Интернет",
      internetDataDesc: "Высокоскоростной морской интернет",
      addToCart: "Добавить в корзину",
      adding: "Добавление...",
      addedToCart: "Добавлено в корзину",
      addedToCartDesc: "Пакет успешно добавлен в корзину",
      error: "Ошибка",
      noPackagesTitle: "Пакеты пока не найдены",
      noPackagesDesc: "Для выбранного судна пока нет активных пакетов.",
      contactAdmin: "Пожалуйста, свяжитесь с администратором.",
      highSpeedTitle: "Высокая скорость",
      highSpeedDesc: "Высокоскоростной интернет в море с использованием спутниковой технологии Starlink",
      flexiblePackagesTitle: "Гибкие пакеты",
      flexiblePackagesDesc: "Различные варианты ГБ и сроки действия в соответствии с вашими потребностями",
      shipSpecificTitle: "Специально для судна",
      shipSpecificDesc: "Индивидуальные варианты пакетов для каждого судна"
    },

    profile: {
      title: "Система AdeGloba Starlink - Профиль",
      personalInfo: "Информация о профиле",
      editProfile: "Редактировать профиль",
      saveChanges: "Сохранить изменения",
      username: "Имя пользователя",
      fullName: "Полное имя",
      email: "Электронная почта",
      phone: "Телефон",
      address: "Адрес",
      shipId: "ID судна",
      profileUpdated: "Профиль обновлен",
      profileUpdateSuccess: "Ваш профиль был успешно обновлен",
      profileUpdateError: "Ошибка при обновлении профиля",
      registrationDate: "Дата регистрации",
      changePassword: "Изменить пароль",
      cannotChange: "Невозможно изменить"
    },

    guide: {
      title: "Руководство пользователя AdeGloba Starlink",
      subtitle: "Изучите, как эффективно использовать вашу систему морского интернета",
      sections: "Разделы"
    },

    cart: {
      title: "Система AdeGloba Starlink - Корзина покупок",
      yourCart: "Ваша корзина",
      emptyCart: "Ваша корзина пуста",
      emptyCartDesc: "Начните добавлять пакеты данных в корзину для покупки",
      browsePlans: "Просмотреть планы",
      removeFromCart: "Удалить из корзины",
      quantity: "Количество",
      price: "Цена",
      total: "Итого",
      checkout: "Оформить заказ",
      updating: "Обновление...",
      couponCode: "Код купона",
      applyCoupon: "Применить купон",
      couponApplied: "Купон применен",
      invalidCoupon: "Неверный или истекший купон",
      discount: "Скидка",
      subtotal: "Промежуточная сумма",
      validUntil: "Действительно до",
      monthEndExpiry: "Срок действия до конца месяца",
      couponHint: "У вас есть код скидки?",
      couponDescription: "Введите код купона для получения скидки на ваш заказ"
    },

    checkout: {
      title: "Система AdeGloba Starlink - Оформление заказа",
      orderSummary: "Сводка заказа",
      paymentMethod: "Способ оплаты",
      payWithPayPal: "Оплатить через PayPal",
      payWithCard: "Оплатить кредитной картой",
      processing: "Обработка...",
      secureCheckout: "Безопасная оплата",
      subtotal: "Подитог",
      total: "Итог",
      proceedToPayment: "Перейти к оплате",
      description: "Завершите ваш заказ и начните Starlink соединение",
      orderDetails: "Детали заказа",
      couponCode: "Код купона",
      couponPlaceholder: "Введите код купона",
      applyCoupon: "Применить",
      couponDiscount: "скидка",
      totalDiscount: "общая скидка",
      couponApplied: "Купон применён",
      paymentSuccess: "Оплата успешна",
      paymentFailed: "Ошибка оплаты",
      secureSsl: "Безопасное 256-бит SSL шифрование",
      loading: "Страница оплаты загружается...",
      secure3D: "Безопасная оплата 3D Secure",
      cardPayment: "Оплата картой",
      orderTotal: "Итого по заказу",
      taxes: "Налоги",
      discount: "Скидка",
      finalTotal: "Итоговая сумма",
      billingInfo: "Платежная информация",
      firstName: "Имя",
      lastName: "Фамилия",
      email: "Электронная почта",
      phone: "Телефон",
      address: "Адрес",
      city: "Город",
      country: "Страна",
      postalCode: "Почтовый индекс",
      cardNumber: "Номер карты",
      expiryDate: "Срок действия",
      cvv: "CVV",
      completeOrder: "Завершить заказ",
      paymentProcessing: "Обработка платежа...",
      orderSuccess: "Заказ успешно создан",
      orderError: "Ошибка при создании заказа",
      invalidPayment: "Неверная платежная информация",
      paymentFailed: "Ошибка платежа",
      redirecting: "Перенаправление...",
      orderCreated: "Заказ создан",
      orderCreatedDesc: "Ваш заказ был успешно создан и отправлен на обработку",
      backToDashboard: "Вернуться на панель управления",
      orderCancelled: "Заказ отменен",
      orderCancelledDesc: "Ваш заказ был отменен. Вы можете попробовать еще раз.",
      amount: "Сумма",
      status: "Статус",
      paid: "Оплачено"
    },

    admin: {
      title: "Панель администратора",
      navigation: {
        dashboard: "Панель управления",
        users: "Пользователи",
        ships: "Суда",
        plans: "Планы",
        orders: "Заказы",
        coupons: "Купоны",
        settings: "Настройки",
        emailMarketing: "Email-маркетинг",
        reports: "Отчеты",
        logs: "Логи"
      },
      actions: {
        add: "Добавить",
        edit: "Редактировать",
        delete: "Удалить",
        save: "Сохранить",
        cancel: "Отменить",
        view: "Просмотреть",
        export: "Экспорт",
        import: "Импорт",
        refresh: "Обновить",
        search: "Поиск",
        filter: "Фильтр",
        activate: "Активировать",
        deactivate: "Деактивировать",
        send: "Отправить",
        test: "Тест"
      },
      status: {
        active: "Активный",
        inactive: "Неактивный",
        pending: "Ожидание",
        completed: "Завершен",
        failed: "Ошибка",
        cancelled: "Отменен"
      }
    },

    support: {
      title: "Поддержка AdeGloba Starlink",
      subtitle: "Мы здесь, чтобы помочь вам с вашей системой морского интернета",
      contactUs: "Свяжитесь с нами",
      whatsapp: "WhatsApp",
      email: "Электронная почта",
      subject: "Тема",
      message: "Сообщение",
      sendReply: "Отправить ответ",
      ticketList: "Список заявок"
    },

    common: {
      loading: "Загрузка...",
      save: "Сохранить",
      cancel: "Отменить",
      delete: "Удалить",
      edit: "Редактировать",
      add: "Добавить",
      search: "Поиск",
      filter: "Фильтр",
      export: "Экспорт",
      import: "Импорт",
      refresh: "Обновить",
      yes: "Да",
      no: "Нет",
      ok: "ОК",
      error: "Ошибка",
      success: "Успех",
      warning: "Предупреждение",
      info: "Информация",
      close: "Закрыть",
      open: "Открыть",
      select: "Выбрать",
      confirm: "Подтвердить",
      submit: "Отправить",
      reset: "Сбросить",
      clear: "Очистить",
      all: "Все",
      none: "Ничего",
      other: "Другое",
      date: "Дата",
      time: "Время",
      name: "Имя",
      description: "Описание",
      price: "Цена",
      quantity: "Количество",
      total: "Итого",
      status: "Статус",
      action: "Действие",
      actions: "Действия",
      category: "Категория",
      type: "Тип",
      details: "Детали",
      removed: "Удалено",
      cleared: "Очищено",
      created: "Создано",
      redirecting: "Перенаправление..."
    }
  }
};