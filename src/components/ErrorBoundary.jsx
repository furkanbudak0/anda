/* eslint-disable react/prop-types */
import React from "react";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

/**
 * ENHANCED ERROR BOUNDARY & ERROR HANDLING
 * Better error messages, retry mechanisms, fallback states
 */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error in development
    if (import.meta.env.DEV) {
      console.error("Error Boundary caught an error:", error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service in production
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo);
    }
  }

  reportError = async (error, errorInfo) => {
    try {
      // Replace with your error reporting service
      await fetch("/api/errors/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (reportingError) {
      if (import.meta.env.DEV) {
        console.error("Failed to report error:", reportingError);
      }
    }
  };

  handleRetry = () => {
    this.setState({ isRetrying: true });

    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false,
      });
    }, 1000);
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleContactSupport = () => {
    window.location.href = "/contact";
  };

  render() {
    const { hasError, error, retryCount, isRetrying } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback component
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Default error UI
      return (
        <ErrorFallback
          error={error}
          retryCount={retryCount}
          isRetrying={isRetrying}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onContactSupport={this.handleContactSupport}
        />
      );
    }

    return children;
  }
}

/**
 * Error Fallback Component
 */
function ErrorFallback({
  error,
  retryCount,
  isRetrying,
  onRetry,
  onGoHome,
  onContactSupport,
}) {
  const maxRetries = 3;
  const canRetry = retryCount < maxRetries;

  // Determine error type and message
  const getErrorInfo = (error) => {
    if (!error) {
      return {
        title: "Beklenmedik Hata",
        message: "Bir şeyler yanlış gitti. Lütfen tekrar deneyin.",
        type: "unknown",
      };
    }

    // Network errors
    if (
      error.message?.includes("fetch") ||
      error.message?.includes("network")
    ) {
      return {
        title: "Bağlantı Hatası",
        message: "İnternet bağlantınızı kontrol edin ve tekrar deneyin.",
        type: "network",
      };
    }

    // Chunk load errors (code splitting)
    if (error.message?.includes("Loading chunk")) {
      return {
        title: "Sayfa Yükleme Hatası",
        message: "Sayfa güncellenirken bir hata oluştu. Sayfayı yenileyin.",
        type: "chunk",
      };
    }

    // Permission errors
    if (
      error.message?.includes("permission") ||
      error.message?.includes("unauthorized")
    ) {
      return {
        title: "Yetki Hatası",
        message: "Bu işlem için yetkiniz bulunmuyor.",
        type: "permission",
      };
    }

    // Generic error
    return {
      title: "Beklenmedik Hata",
      message: error.message || "Bir şeyler yanlış gitti.",
      type: "generic",
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
        </div>

        {/* Error Title */}
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {errorInfo.title}
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {errorInfo.message}
        </p>

        {/* Retry Information */}
        {retryCount > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Deneme sayısı: {retryCount}/3
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Retry Button */}
          {canRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon
                className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`}
              />
              {isRetrying ? "Yeniden Deneniyor..." : "Tekrar Dene"}
            </button>
          )}

          {/* Go Home Button */}
          <button
            onClick={onGoHome}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <HomeIcon className="w-4 h-4" />
            Ana Sayfaya Dön
          </button>

          {/* Contact Support */}
          {!canRetry && (
            <button
              onClick={onContactSupport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Destek ile İletişime Geç
            </button>
          )}
        </div>

        {/* Error Details for Development */}
        {import.meta.env.DEV && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              Hata Detayları (Geliştirici Modu)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32 text-gray-800 dark:text-gray-200">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Network Error Component
 */
export function NetworkError({ onRetry, className = "" }) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-orange-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Bağlantı Hatası
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        İnternet bağlantınızı kontrol edin
      </p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Tekrar Dene
      </button>
    </div>
  );
}

/**
 * Empty State with Error Handling
 */
export function EmptyStateWithError({
  title,
  message,
  actionLabel,
  onAction,
  onRetry,
  className = "",
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
        <ExclamationTriangleIcon />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onAction && (
          <button
            onClick={onAction}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {actionLabel}
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Tekrar Dene
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for handling async errors in functional components
 */
export function useErrorHandler() {
  const handleError = (error, context = "") => {
    console.error(`Error in ${context}:`, error);

    // Show user-friendly toast message
    import("react-hot-toast").then(({ toast }) => {
      toast.error(`Bir hata oluştu: ${error.message || "Bilinmeyen hata"}`);
    });

    // Log to monitoring service in production
    if (import.meta.env.PROD) {
      // Replace with your error monitoring service
      fetch("/api/errors/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
      }).catch((err) => {
        console.error("Failed to report error:", err);
      });
    }
  };

  return { handleError };
}

export default ErrorBoundary;
