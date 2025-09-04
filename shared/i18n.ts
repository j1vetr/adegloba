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
        purchaseHistory: "Geçmiş Satın Alımlar"
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
      }
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
        purchaseHistory: "Purchase History"
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
      }
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
      details: "Details"
    }
  }
};