import { useCallback } from "react";
import { toast } from "react-hot-toast";

/**
 * MERKEZI ERROR HANDLING HOOK
 *
 * Tüm API çağrılarında tekrarlanan try-catch blokları ve error handling mantığını
 * tek bir yerde toplayan merkezi sistem.
 *
 * Özellikler:
 * - Automatic error classification
 * - User-friendly Turkish error messages
 * - Retry functionality
 * - Error logging
 * - Network error handling
 * - Authentication error handling
 */

// Error type classification
const ERROR_TYPES = {
  NETWORK: "network",
  AUTHENTICATION: "authentication",
  VALIDATION: "validation",
  PERMISSION: "permission",
  SERVER: "server",
  UNKNOWN: "unknown",
};

// Error message mapping
const ERROR_MESSAGES = {
  // Network errors
  "Failed to fetch": "İnternet bağlantınızı kontrol edin",
  NetworkError: "Ağ bağlantısı hatası",
  ERR_NETWORK: "Ağ bağlantısı hatası",

  // Authentication errors
  "Invalid login credentials": "E-posta veya şifre hatalı",
  "User not found": "Kullanıcı bulunamadı",
  "Invalid email or password": "E-posta veya şifre hatalı",
  "Email not confirmed": "E-posta adresinizi doğrulayın",
  "Token has expired": "Oturum süreniz dolmuş, lütfen tekrar giriş yapın",
  "Invalid access token": "Oturum süreniz dolmuş, lütfen tekrar giriş yapın",

  // Permission errors
  "Insufficient permissions": "Bu işlem için yetkiniz bulunmuyor",
  "Access denied": "Erişim reddedildi",
  Forbidden: "Bu işlem için yetkiniz bulunmuyor",
  "Row Level Security": "Bu veriye erişim yetkiniz bulunmuyor",

  // Validation errors
  "Invalid input": "Geçersiz veri girişi",
  "Required field missing": "Gerekli alanlar eksik",
  "Email already exists": "Bu e-posta adresi zaten kullanılıyor",
  "Username already exists": "Bu kullanıcı adı zaten kullanılıyor",

  // Server errors
  "Internal server error": "Sunucu hatası, lütfen daha sonra tekrar deneyin",
  "Service unavailable": "Servis şu anda kullanılamıyor",
  "Database error": "Veri tabanı hatası",

  // Supabase specific errors
  "duplicate key value": "Bu veri zaten mevcut",
  "foreign key constraint": "İlişkili veriler mevcut, silme işlemi yapılamaz",
  "check constraint": "Veri doğrulama hatası",
  "not null constraint": "Gerekli alanlar boş bırakılamaz",
};

/**
 * Classify error type based on error message or code
 */
function classifyError(error) {
  const message = error?.message?.toLowerCase() || "";
  const code = error?.code?.toLowerCase() || "";
  const status = error?.status;

  // Network errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    code === "err_network"
  ) {
    return ERROR_TYPES.NETWORK;
  }

  // Authentication errors
  if (
    status === 401 ||
    message.includes("auth") ||
    message.includes("login") ||
    message.includes("token")
  ) {
    return ERROR_TYPES.AUTHENTICATION;
  }

  // Permission errors
  if (
    status === 403 ||
    message.includes("permission") ||
    message.includes("forbidden") ||
    message.includes("access")
  ) {
    return ERROR_TYPES.PERMISSION;
  }

  // Validation errors
  if (
    status === 400 ||
    message.includes("invalid") ||
    message.includes("required") ||
    message.includes("constraint")
  ) {
    return ERROR_TYPES.VALIDATION;
  }

  // Server errors
  if (
    status >= 500 ||
    message.includes("server") ||
    message.includes("database")
  ) {
    return ERROR_TYPES.SERVER;
  }

  return ERROR_TYPES.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(error) {
  const message = error?.message || "";

  // Check exact matches first
  for (const [errorPattern, friendlyMessage] of Object.entries(
    ERROR_MESSAGES
  )) {
    if (message.includes(errorPattern)) {
      return friendlyMessage;
    }
  }

  // Fallback based on error type
  const errorType = classifyError(error);

  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return "İnternet bağlantınızı kontrol edin";
    case ERROR_TYPES.AUTHENTICATION:
      return "Giriş bilgilerinizi kontrol edin";
    case ERROR_TYPES.PERMISSION:
      return "Bu işlem için yetkiniz bulunmuyor";
    case ERROR_TYPES.VALIDATION:
      return "Girdiğiniz bilgileri kontrol edin";
    case ERROR_TYPES.SERVER:
      return "Sunucu hatası, lütfen daha sonra tekrar deneyin";
    default:
      return message || "Beklenmedik bir hata oluştu";
  }
}

/**
 * Log error for monitoring/debugging
 */
function logError(error, context = "", userId = null) {
  const errorInfo = {
    message: error?.message,
    stack: error?.stack,
    code: error?.code,
    status: error?.status,
    context,
    userId,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };

  // In development, log to console
  if (import.meta.env.DEV) {
    console.error(`Error in ${context}:`, errorInfo);
  }

  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    // Replace with your error monitoring service (Sentry, LogRocket, etc.)
    try {
      fetch("/api/errors/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorInfo),
      }).catch(() => {
        // Silently fail if error logging fails
      });
    } catch {
      // Silently fail if error logging fails
    }
  }
}

/**
 * Main error handling hook
 */
export function useErrorHandling() {
  /**
   * Handle API errors with automatic classification and user feedback
   */
  const handleError = useCallback((error, context = "", options = {}) => {
    const {
      showToast = true,
      customMessage = null,
      onRetry = null,
      silent = false,
      logToService = true,
    } = options;

    // Log error for monitoring
    if (logToService) {
      logError(error, context);
    }

    // Get user-friendly message
    const message = customMessage || getUserFriendlyMessage(error);

    // Show toast notification if not silent
    if (showToast && !silent) {
      if (onRetry) {
        toast.error(message, {
          action: {
            label: "Tekrar Dene",
            onClick: onRetry,
          },
          duration: 6000,
        });
      } else {
        toast.error(message);
      }
    }

    // Return error info for component handling
    return {
      type: classifyError(error),
      message,
      originalError: error,
      canRetry: onRetry !== null,
    };
  }, []);

  /**
   * Wrap async function with error handling
   */
  const withErrorHandling = useCallback(
    (asyncFn, context = "", options = {}) => {
      return async (...args) => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          const errorInfo = handleError(error, context, options);

          // Re-throw if component needs to handle it
          if (options.rethrow) {
            throw errorInfo;
          }

          return null;
        }
      };
    },
    [handleError]
  );

  /**
   * React Query error handler
   */
  const queryErrorHandler = useCallback(
    (error, context = "") => {
      return handleError(error, context, { showToast: true });
    },
    [handleError]
  );

  /**
   * Mutation error handler with retry option
   */
  const mutationErrorHandler = useCallback(
    (error, context = "", retryFn = null) => {
      return handleError(error, context, {
        showToast: true,
        onRetry: retryFn,
      });
    },
    [handleError]
  );

  /**
   * Network error handler
   */
  const networkErrorHandler = useCallback(
    (error, context = "", retryFn = null) => {
      return handleError(error, context, {
        showToast: true,
        onRetry: retryFn,
        customMessage: "İnternet bağlantınızı kontrol edin",
      });
    },
    [handleError]
  );

  /**
   * Authentication error handler
   */
  const authErrorHandler = useCallback(
    (error, context = "") => {
      return handleError(error, context, {
        showToast: true,
        customMessage: "Oturum süreniz dolmuş, lütfen tekrar giriş yapın",
      });
    },
    [handleError]
  );

  return {
    handleError,
    withErrorHandling,
    queryErrorHandler,
    mutationErrorHandler,
    networkErrorHandler,
    authErrorHandler,
    ERROR_TYPES,
  };
}

/**
 * High-order function to wrap API calls with error handling
 */
export function withErrorBoundary(apiCall, context = "", options = {}) {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      const { handleError } = useErrorHandling();
      const errorInfo = handleError(error, context, options);

      if (options.rethrow) {
        throw errorInfo;
      }

      return null;
    }
  };
}

/**
 * React Query configuration with centralized error handling
 */
export const getQueryClientConfig = () => {
  return {
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          const errorType = classifyError(error);

          // Don't retry authentication errors
          if (errorType === ERROR_TYPES.AUTHENTICATION) {
            return false;
          }

          // Don't retry permission errors
          if (errorType === ERROR_TYPES.PERMISSION) {
            return false;
          }

          // Retry network and server errors up to 2 times
          if (
            errorType === ERROR_TYPES.NETWORK ||
            errorType === ERROR_TYPES.SERVER
          ) {
            return failureCount < 2;
          }

          return false;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        onError: (error) => {
          const { handleError } = useErrorHandling();
          handleError(error, "React Query", { showToast: false });
        },
      },
      mutations: {
        onError: (error, variables, context) => {
          const { handleError } = useErrorHandling();
          handleError(error, "React Query Mutation", { showToast: true });
        },
        retry: 1,
      },
    },
  };
};
