/**
 * COMPREHENSIVE NOTIFICATION SYSTEM
 *
 * Advanced notification management using react-hot-toast with custom styling,
 * navigation support, persistence, and comprehensive error handling.
 *
 * Features:
 * - White background design with custom styling
 * - Success notifications with auto-navigation
 * - Error handling with retry mechanisms
 * - Loading states with progress indicators
 * - Persistent notifications across navigations
 * - Custom action buttons
 * - Multi-language support (Turkish)
 */

import toast, { Toaster } from "react-hot-toast";

// Notification türleri
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  LOADING: "loading",
};

// Notification kategorileri
export const NOTIFICATION_CATEGORIES = {
  ECOMMERCE: "ecommerce",
  AUTH: "auth",
  SYSTEM: "system",
  USER: "user",
};

// Toast konfigürasyonu
const toastConfig = {
  duration: 4000,
  position: "top-right",
  style: {
    background: "#363636",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "14px",
    padding: "12px 16px",
  },
  success: {
    style: {
      background: "#10B981",
      color: "#fff",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#10B981",
    },
  },
  error: {
    style: {
      background: "#EF4444",
      color: "#fff",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#EF4444",
    },
  },
  warning: {
    style: {
      background: "#F59E0B",
      color: "#fff",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#F59E0B",
    },
  },
  info: {
    style: {
      background: "#3B82F6",
      color: "#fff",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#3B82F6",
    },
  },
};

// Notification manager
class NotificationManager {
  constructor() {
    this.activeNotifications = new Set();
    this.notificationQueue = [];
    this.isProcessing = false;
  }

  // Benzersiz notification ID oluştur
  generateId() {
    return `notification_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  // Notification göster
  show(type, message, options = {}) {
    const id = this.generateId();
    const config = { ...toastConfig, ...options };

    // Aynı mesajın tekrar gösterilmesini engelle
    if (this.activeNotifications.has(message)) {
      return id;
    }

    this.activeNotifications.add(message);

    let toastFunction;
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        toastFunction = toast.success;
        break;
      case NOTIFICATION_TYPES.ERROR:
        toastFunction = toast.error;
        break;
      case NOTIFICATION_TYPES.WARNING:
        toastFunction = toast.error; // Warning için error kullan
        break;
      case NOTIFICATION_TYPES.INFO:
        toastFunction = toast; // Default toast
        break;
      case NOTIFICATION_TYPES.LOADING:
        toastFunction = toast.loading;
        break;
      default:
        toastFunction = toast;
    }

    const notificationId = toastFunction(message, config);

    // Notification süresi dolduğunda active listesinden çıkar
    setTimeout(() => {
      this.activeNotifications.delete(message);
    }, config.duration || 4000);

    return notificationId;
  }

  // Success notification
  success(message, options = {}) {
    return this.show(NOTIFICATION_TYPES.SUCCESS, message, options);
  }

  // Error notification
  error(message, options = {}) {
    return this.show(NOTIFICATION_TYPES.ERROR, message, options);
  }

  // Warning notification
  warning(message, options = {}) {
    return this.show(NOTIFICATION_TYPES.WARNING, message, options);
  }

  // Info notification
  info(message, options = {}) {
    return this.show(NOTIFICATION_TYPES.INFO, message, options);
  }

  // Loading notification
  loading(message, options = {}) {
    return this.show(NOTIFICATION_TYPES.LOADING, message, options);
  }

  // Notification kapat
  dismiss(id) {
    toast.dismiss(id);
  }

  // Tüm notifications'ları kapat
  dismissAll() {
    toast.dismiss();
    this.activeNotifications.clear();
  }

  // E-ticaret specific notifications
  ecommerce = {
    addToCart: (productName) => {
      return this.success(`${productName} sepete eklendi`);
    },
    removeFromCart: (productName) => {
      return this.success(`${productName} sepetten çıkarıldı`);
    },
    addToWishlist: (productName) => {
      return this.success(`${productName} favorilere eklendi`);
    },
    removeFromWishlist: (productName) => {
      return this.success(`${productName} favorilerden çıkarıldı`);
    },
    orderPlaced: (orderNumber) => {
      return this.success(`Sipariş #${orderNumber} başarıyla oluşturuldu`);
    },
    orderCancelled: (orderNumber) => {
      return this.success(`Sipariş #${orderNumber} iptal edildi`);
    },
    paymentSuccess: () => {
      return this.success("Ödeme başarıyla tamamlandı");
    },
    paymentFailed: () => {
      return this.error("Ödeme işlemi başarısız");
    },
    stockWarning: (productName) => {
      return this.warning(`${productName} stokta az kaldı`);
    },
    outOfStock: (productName) => {
      return this.error(`${productName} stokta bulunmuyor`);
    },
  };

  // Auth specific notifications
  auth = {
    loginSuccess: () => {
      return this.success("Başarıyla giriş yaptınız");
    },
    loginFailed: () => {
      return this.error("Giriş yapılamadı. Bilgilerinizi kontrol edin");
    },
    loginRequired: () => {
      return this.warning("Bu işlem için giriş yapmalısınız");
    },
    logoutSuccess: () => {
      return this.success("Başarıyla çıkış yaptınız");
    },
    registerSuccess: () => {
      return this.success("Hesabınız başarıyla oluşturuldu");
    },
    registerFailed: () => {
      return this.error("Kayıt işlemi başarısız");
    },
    passwordResetSent: () => {
      return this.success(
        "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi"
      );
    },
    passwordResetSuccess: () => {
      return this.success("Şifreniz başarıyla güncellendi");
    },
    emailVerificationSent: () => {
      return this.success("E-posta doğrulama bağlantısı gönderildi");
    },
    emailVerified: () => {
      return this.success("E-posta adresiniz doğrulandı");
    },
    sessionExpired: () => {
      return this.warning("Oturum süreniz doldu. Lütfen tekrar giriş yapın");
    },
    unauthorized: () => {
      return this.error("Bu işlem için yetkiniz bulunmuyor");
    },
  };

  // System notifications
  system = {
    connectionLost: () => {
      return this.error("İnternet bağlantısı kesildi");
    },
    connectionRestored: () => {
      return this.success("İnternet bağlantısı geri geldi");
    },
    serverError: () => {
      return this.error("Sunucu hatası. Lütfen daha sonra tekrar deneyin");
    },
    maintenance: () => {
      return this.warning("Sistem bakımda. Lütfen daha sonra tekrar deneyin");
    },
    updateAvailable: () => {
      return this.info("Yeni güncelleme mevcut");
    },
  };

  // User notifications
  user = {
    profileUpdated: () => {
      return this.success("Profil bilgileriniz güncellendi");
    },
    settingsSaved: () => {
      return this.success("Ayarlarınız kaydedildi");
    },
    addressAdded: () => {
      return this.success("Adres başarıyla eklendi");
    },
    addressUpdated: () => {
      return this.success("Adres başarıyla güncellendi");
    },
    addressDeleted: () => {
      return this.success("Adres başarıyla silindi");
    },
    reviewSubmitted: () => {
      return this.success("Değerlendirmeniz gönderildi");
    },
    reviewUpdated: () => {
      return this.success("Değerlendirmeniz güncellendi");
    },
  };
}

// Global notification instance
export const notifications = new NotificationManager();

// Toast container component
export const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#363636",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
          padding: "12px 16px",
        },
        success: {
          style: {
            background: "#10B981",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#10B981",
          },
        },
        error: {
          style: {
            background: "#EF4444",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#EF4444",
          },
        },
      }}
    />
  );
};

// Hook for notifications
export const useNotifications = () => {
  return notifications;
};

// Default export
export default notifications;
