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
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

// Notification types and configurations
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  LOADING: "loading",
  CUSTOM: "custom",
};

// Duration settings (in milliseconds)
export const DURATIONS = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
  PERSISTENT: Infinity,
  LOADING: Infinity, // Loading toasts don't auto-dismiss
};

// Custom toast configuration
const toastConfig = {
  // Global settings
  position: "top-right",
  reverseOrder: false,
  gutter: 8,

  // Default styling
  style: {
    borderRadius: "12px",
    background: "#ffffff",
    color: "#374151",
    padding: "16px 20px",
    fontSize: "14px",
    fontWeight: "500",
    boxShadow:
      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e5e7eb",
    maxWidth: "420px",
    minWidth: "300px",
  },

  // Icon styling
  iconTheme: {
    primary: "#10b981", // Success green
    secondary: "#ffffff",
  },

  // Success notifications
  success: {
    duration: DURATIONS.MEDIUM,
    style: {
      background: "#ffffff",
      color: "#065f46",
      border: "1px solid #10b981",
      boxShadow:
        "0 10px 25px -5px rgba(16, 185, 129, 0.25), 0 10px 10px -5px rgba(16, 185, 129, 0.1)",
    },
    iconTheme: {
      primary: "#10b981",
      secondary: "#ffffff",
    },
  },

  // Error notifications
  error: {
    duration: DURATIONS.LONG,
    style: {
      background: "#ffffff",
      color: "#991b1b",
      border: "1px solid #ef4444",
      boxShadow:
        "0 10px 25px -5px rgba(239, 68, 68, 0.25), 0 10px 10px -5px rgba(239, 68, 68, 0.1)",
    },
    iconTheme: {
      primary: "#ef4444",
      secondary: "#ffffff",
    },
  },

  // Warning notifications
  warning: {
    duration: DURATIONS.MEDIUM,
    style: {
      background: "#ffffff",
      color: "#92400e",
      border: "1px solid #f59e0b",
      boxShadow:
        "0 10px 25px -5px rgba(245, 158, 11, 0.25), 0 10px 10px -5px rgba(245, 158, 11, 0.1)",
    },
    iconTheme: {
      primary: "#f59e0b",
      secondary: "#ffffff",
    },
  },

  // Info notifications
  loading: {
    duration: DURATIONS.LOADING,
    style: {
      background: "#ffffff",
      color: "#1e40af",
      border: "1px solid #3b82f6",
      boxShadow:
        "0 10px 25px -5px rgba(59, 130, 246, 0.25), 0 10px 10px -5px rgba(59, 130, 246, 0.1)",
    },
  },
};

/**
 * Enhanced notification class with advanced features
 */
class NotificationManager {
  constructor() {
    this.activeToasts = new Map();
    this.navigationCallbacks = new Map();
    this.persistentToasts = new Set();
  }

  /**
   * Success notification with optional navigation
   */
  success(message, options = {}) {
    const config = {
      duration: options.duration || DURATIONS.MEDIUM,
      style: {
        ...toastConfig.success.style,
        ...options.style,
      },
      icon: options.icon || (
        <CheckCircleIcon className="w-5 h-5 text-green-500" />
      ),
      ...options,
    };

    const toastId = toast.success(message, config);

    // Handle navigation after success
    if (options.navigateTo && options.navigate) {
      const navigationTimer = setTimeout(() => {
        if (options.showNavigationToast !== false) {
          this.info(`Yönlendiriliyor...`, { duration: DURATIONS.SHORT });
        }
        setTimeout(() => {
          options.navigate(options.navigateTo);
        }, 500); // Small delay for UX
      }, options.navigationDelay || 2000);

      this.navigationCallbacks.set(toastId, navigationTimer);
    }

    this.activeToasts.set(toastId, { type: "success", message, options });
    return toastId;
  }

  /**
   * Error notification with retry functionality
   */
  error(message, options = {}) {
    const config = {
      duration: options.duration || DURATIONS.LONG,
      style: {
        ...toastConfig.error.style,
        ...options.style,
      },
      icon: options.icon || <XCircleIcon className="w-5 h-5 text-red-500" />,
      ...options,
    };

    // Add retry button if retry function provided
    if (options.onRetry) {
      const CustomErrorToast = ({ toastId }) => (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-900 font-medium">{message}</span>
          </div>
          <button
            onClick={() => {
              toast.dismiss(toastId);
              options.onRetry();
            }}
            className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex-shrink-0"
          >
            Tekrar Dene
          </button>
        </div>
      );

      const toastId = toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } bg-white rounded-xl shadow-lg border border-red-200 p-4 max-w-md`}
            style={config.style}
          >
            <CustomErrorToast toastId={t.id} />
          </div>
        ),
        { duration: config.duration }
      );

      this.activeToasts.set(toastId, { type: "error", message, options });
      return toastId;
    }

    const toastId = toast.error(message, config);
    this.activeToasts.set(toastId, { type: "error", message, options });
    return toastId;
  }

  /**
   * Warning notification
   */
  warning(message, options = {}) {
    const config = {
      duration: options.duration || DURATIONS.MEDIUM,
      style: {
        ...toastConfig.warning.style,
        ...options.style,
      },
      icon: options.icon || (
        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
      ),
      ...options,
    };

    const toastId = toast(message, config);
    this.activeToasts.set(toastId, { type: "warning", message, options });
    return toastId;
  }

  /**
   * Info notification
   */
  info(message, options = {}) {
    const config = {
      duration: options.duration || DURATIONS.MEDIUM,
      style: {
        background: "#ffffff",
        color: "#1e40af",
        border: "1px solid #3b82f6",
        boxShadow:
          "0 10px 25px -5px rgba(59, 130, 246, 0.25), 0 10px 10px -5px rgba(59, 130, 246, 0.1)",
        ...options.style,
      },
      icon: options.icon || (
        <InformationCircleIcon className="w-5 h-5 text-blue-500" />
      ),
      ...options,
    };

    const toastId = toast(message, config);
    this.activeToasts.set(toastId, { type: "info", message, options });
    return toastId;
  }

  /**
   * Loading notification with progress
   */
  loading(message, options = {}) {
    const LoadingToast = () => (
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
        <span className="text-blue-900 font-medium">{message}</span>
        {options.showProgress && (
          <div className="ml-auto text-blue-600 text-sm">
            {options.progress || 0}%
          </div>
        )}
      </div>
    );

    const toastId = toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } bg-white rounded-xl shadow-lg border border-blue-200 p-4 max-w-md`}
          style={toastConfig.loading.style}
        >
          <LoadingToast />
        </div>
      ),
      {
        duration: DURATIONS.LOADING,
        ...options,
      }
    );

    this.activeToasts.set(toastId, { type: "loading", message, options });
    return toastId;
  }

  /**
   * Update loading toast progress
   */
  updateProgress(toastId, progress, message) {
    const toastData = this.activeToasts.get(toastId);
    if (toastData && toastData.type === "loading") {
      // Dismiss current toast and create new one with updated progress
      toast.dismiss(toastId);
      return this.loading(message || toastData.message, {
        ...toastData.options,
        progress,
      });
    }
    return toastId;
  }

  /**
   * Success with auto-navigation (for login, form submissions etc.)
   */
  successWithNavigation(message, navigationPath, navigate, options = {}) {
    return this.success(message, {
      navigateTo: navigationPath,
      navigate: navigate,
      navigationDelay: options.delay || 2000,
      showNavigationToast: options.showNavigationToast !== false,
      ...options,
    });
  }

  /**
   * Persistent notification that survives navigation
   */
  persistent(type, message, options = {}) {
    const toastId = this[type](message, {
      duration: DURATIONS.PERSISTENT,
      ...options,
    });

    this.persistentToasts.add(toastId);
    return toastId;
  }

  /**
   * Custom notification with complex content
   */
  custom(content, options = {}) {
    const toastId = toast.custom(content, {
      duration: options.duration || DURATIONS.MEDIUM,
      position: options.position || "top-right",
      ...options,
    });

    this.activeToasts.set(toastId, { type: "custom", content, options });
    return toastId;
  }

  /**
   * Bulk operations notifications
   */
  bulkOperation(operationType, totalCount, options = {}) {
    let completedCount = 0;
    const toastId = this.loading(
      `${operationType} başlıyor... (0/${totalCount})`,
      {
        showProgress: true,
        progress: 0,
      }
    );

    return {
      toastId,
      updateProgress: (completed, message) => {
        completedCount = completed;
        const progress = Math.round((completed / totalCount) * 100);
        return this.updateProgress(
          toastId,
          progress,
          message ||
            `${operationType} devam ediyor... (${completed}/${totalCount})`
        );
      },
      complete: (successMessage) => {
        toast.dismiss(toastId);
        return this.success(
          successMessage ||
            `${operationType} başarıyla tamamlandı! (${totalCount}/${totalCount})`
        );
      },
      error: (errorMessage) => {
        toast.dismiss(toastId);
        return this.error(
          errorMessage ||
            `${operationType} sırasında hata oluştu. (${completedCount}/${totalCount} tamamlandı)`
        );
      },
    };
  }

  /**
   * Form validation errors
   */
  formErrors(errors, options = {}) {
    if (Array.isArray(errors)) {
      errors.forEach((error, index) => {
        setTimeout(() => {
          this.error(error, { duration: DURATIONS.MEDIUM });
        }, index * 100); // Stagger errors
      });
    } else if (typeof errors === "object") {
      Object.entries(errors).forEach(([field, error], index) => {
        setTimeout(() => {
          this.error(`${field}: ${error}`, { duration: DURATIONS.MEDIUM });
        }, index * 100);
      });
    } else {
      this.error(errors, options);
    }
  }

  /**
   * Network error handling
   */
  networkError(error, options = {}) {
    let message = "Bağlantı hatası oluştu";

    if (error.code === "NETWORK_ERROR") {
      message = "İnternet bağlantınızı kontrol edin";
    } else if (error.status === 500) {
      message = "Sunucu hatası, lütfen daha sonra tekrar deneyin";
    } else if (error.status === 404) {
      message = "İstenen kaynak bulunamadı";
    } else if (error.status === 403) {
      message = "Bu işlem için yetkiniz bulunmuyor";
    } else if (error.status === 401) {
      message = "Oturum süreniz dolmuş, lütfen tekrar giriş yapın";
    }

    return this.error(message, {
      onRetry: options.onRetry,
      duration: DURATIONS.LONG,
      ...options,
    });
  }

  /**
   * Authentication notifications
   */
  auth = {
    loginSuccess: (navigate) => {
      return this.successWithNavigation(
        "Başarıyla giriş yapıldı! Yönlendiriliyor...",
        "/dashboard",
        navigate,
        { delay: 1500 }
      );
    },

    logoutSuccess: (navigate) => {
      return this.successWithNavigation(
        "Güvenli çıkış yapıldı",
        "/",
        navigate,
        { delay: 1000 }
      );
    },

    registrationSuccess: (navigate) => {
      return this.successWithNavigation(
        "Kayıt başarılı! Giriş sayfasına yönlendiriliyor...",
        "/auth",
        navigate,
        { delay: 2000 }
      );
    },

    sessionExpired: (navigate) => {
      return this.warning("Oturum süreniz doldu, lütfen tekrar giriş yapın", {
        duration: DURATIONS.LONG,
        onAction: () => navigate("/auth"),
      });
    },
  };

  /**
   * E-commerce specific notifications
   */
  ecommerce = {
    addToCart: (productName) => {
      return this.success(`${productName} sepete eklendi`, {
        duration: DURATIONS.SHORT,
      });
    },

    removeFromCart: (productName) => {
      return this.info(`${productName} sepetten çıkarıldı`);
    },

    addToWishlist: (productName) => {
      return this.success(`${productName} favorilere eklendi`, {
        icon: <span className="text-red-500">❤️</span>,
      });
    },

    orderSuccess: (orderNumber, navigate) => {
      return this.successWithNavigation(
        `Siparişiniz başarıyla oluşturuldu! (Sipariş No: ${orderNumber})`,
        `/orders/${orderNumber}`,
        navigate,
        { delay: 3000 }
      );
    },

    stockWarning: (productName) => {
      return this.warning(
        `${productName} için stok azalmış, hemen sipariş verin!`
      );
    },

    paymentError: (onRetry) => {
      return this.error("Ödeme işlemi başarısız oldu", {
        onRetry: onRetry,
      });
    },
  };

  /**
   * Clear specific types of notifications
   */
  clear(type = null) {
    if (type) {
      this.activeToasts.forEach((toastData, toastId) => {
        if (toastData.type === type && !this.persistentToasts.has(toastId)) {
          toast.dismiss(toastId);
          this.activeToasts.delete(toastId);
        }
      });
    } else {
      // Clear all non-persistent toasts
      this.activeToasts.forEach((toastData, toastId) => {
        if (!this.persistentToasts.has(toastId)) {
          toast.dismiss(toastId);
        }
      });
      this.activeToasts.clear();
    }
  }

  /**
   * Dismiss specific toast
   */
  dismiss(toastId) {
    toast.dismiss(toastId);
    this.activeToasts.delete(toastId);
    this.persistentToasts.delete(toastId);

    // Clear navigation callback if exists
    const navigationTimer = this.navigationCallbacks.get(toastId);
    if (navigationTimer) {
      clearTimeout(navigationTimer);
      this.navigationCallbacks.delete(toastId);
    }
  }

  /**
   * Get active toasts count
   */
  getActiveCount() {
    return this.activeToasts.size;
  }

  /**
   * Get all active toasts
   */
  getActiveToasts() {
    return Array.from(this.activeToasts.entries());
  }
}

// Global notification manager instance
export const notifications = new NotificationManager();

/**
 * React component for toast container with custom styling
 */
export const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{
        top: 80, // Account for navbar
        right: 20,
        zIndex: 9999,
      }}
      toastOptions={{
        // Global default options
        duration: DURATIONS.MEDIUM,
        style: toastConfig.style,

        // Custom animations
        className: "toast-animation",

        // Success styling
        success: toastConfig.success,
        error: toastConfig.error,
        loading: toastConfig.loading,
      }}
    />
  );
};

// Convenience exports
export const showSuccess = notifications.success.bind(notifications);
export const showError = notifications.error.bind(notifications);
export const showWarning = notifications.warning.bind(notifications);
export const showInfo = notifications.info.bind(notifications);
export const showLoading = notifications.loading.bind(notifications);

// Auth exports
export const authNotifications = notifications.auth;
export const ecommerceNotifications = notifications.ecommerce;

// Default export
export default notifications;
