import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";

/**
 * MERKEZI LOADING STATE YÖNETİMİ
 *
 * Tekrarlanan loading states ve spinner kullanımlarını merkezi bir sistem ile yönetir.
 *
 * Özellikler:
 * - Multiple loading states tracking
 * - Automatic spinner management
 * - Loading timeouts
 * - Progress indicators
 * - Loading messages
 * - Async operations wrapping
 * - Loading context tracking
 */

/**
 * Main loading hook
 */
export function useLoading(options = {}) {
  const {
    initialLoading = false,
    showToast = false,
    timeout = 30000, // 30 seconds default timeout
  } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef(null);
  const toastIdRef = useRef(null);

  // Start loading
  const startLoading = useCallback(
    (message = "") => {
      setIsLoading(true);
      setLoadingMessage(message);
      setProgress(0);

      // Show toast if enabled
      if (showToast && message) {
        toastIdRef.current = toast.loading(message);
      }

      // Set timeout
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          stopLoading();
          if (showToast) {
            toast.error("İşlem zaman aşımına uğradı", {
              id: toastIdRef.current,
            });
          }
        }, timeout);
      }
    },
    [showToast, timeout]
  );

  // Stop loading
  const stopLoading = useCallback(
    (successMessage = null) => {
      setIsLoading(false);
      setLoadingMessage("");
      setProgress(0);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Handle toast
      if (showToast && toastIdRef.current) {
        if (successMessage) {
          toast.success(successMessage, { id: toastIdRef.current });
        } else {
          toast.dismiss(toastIdRef.current);
        }
        toastIdRef.current = null;
      }
    },
    [showToast]
  );

  // Update progress
  const updateProgress = useCallback((newProgress) => {
    setProgress(Math.max(0, Math.min(100, newProgress)));
  }, []);

  // Update loading message
  const updateMessage = useCallback(
    (message) => {
      setLoadingMessage(message);

      if (showToast && toastIdRef.current && message) {
        toast.loading(message, { id: toastIdRef.current });
      }
    },
    [showToast]
  );

  // Wrap async function with loading
  const withLoading = useCallback(
    async (asyncFn, message = "", successMessage = null) => {
      try {
        startLoading(message);
        const result = await asyncFn();
        stopLoading(successMessage);
        return result;
      } catch (error) {
        stopLoading();
        throw error;
      }
    },
    [startLoading, stopLoading]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (showToast && toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, [showToast]);

  return {
    isLoading,
    loadingMessage,
    progress,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage,
    withLoading,
  };
}

/**
 * Multi-state loading hook for handling multiple concurrent loading operations
 */
export function useMultiLoading() {
  const [loadingStates, setLoadingStates] = useState({});
  const timeoutsRef = useRef({});

  // Start loading for specific key
  const startLoading = useCallback((key, message = "", timeout = 30000) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: {
        isLoading: true,
        message,
        startTime: Date.now(),
        progress: 0,
      },
    }));

    // Set timeout for this specific loading
    if (timeout > 0) {
      timeoutsRef.current[key] = setTimeout(() => {
        stopLoading(key);
        toast.error(`${message || "İşlem"} zaman aşımına uğradı`);
      }, timeout);
    }
  }, []);

  // Stop loading for specific key
  const stopLoading = useCallback((key, successMessage = null) => {
    setLoadingStates((prev) => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });

    // Clear timeout
    if (timeoutsRef.current[key]) {
      clearTimeout(timeoutsRef.current[key]);
      delete timeoutsRef.current[key];
    }

    // Show success message if provided
    if (successMessage) {
      toast.success(successMessage);
    }
  }, []);

  // Update progress for specific key
  const updateProgress = useCallback((key, progress) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        progress: Math.max(0, Math.min(100, progress)),
      },
    }));
  }, []);

  // Update message for specific key
  const updateMessage = useCallback((key, message) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        message,
      },
    }));
  }, []);

  // Check if any operation is loading
  const isAnyLoading = Object.keys(loadingStates).length > 0;

  // Check if specific key is loading
  const isLoading = useCallback(
    (key) => {
      return !!loadingStates[key]?.isLoading;
    },
    [loadingStates]
  );

  // Get loading info for specific key
  const getLoadingInfo = useCallback(
    (key) => {
      return loadingStates[key] || null;
    },
    [loadingStates]
  );

  // Wrap async function with loading for specific key
  const withLoading = useCallback(
    async (key, asyncFn, message = "", successMessage = null) => {
      try {
        startLoading(key, message);
        const result = await asyncFn();
        stopLoading(key, successMessage);
        return result;
      } catch (error) {
        stopLoading(key);
        throw error;
      }
    },
    [startLoading, stopLoading]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    loadingStates,
    isAnyLoading,
    isLoading,
    getLoadingInfo,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage,
    withLoading,
  };
}

/**
 * Loading hook specifically for API calls
 */
export function useApiLoading() {
  const multiLoading = useMultiLoading();

  // Execute API call with loading
  const executeApiCall = useCallback(
    async (apiCall, options = {}) => {
      const {
        loadingKey = "api-call",
        loadingMessage = "Yükleniyor...",
        successMessage = null,
        timeout = 30000,
      } = options;

      return multiLoading.withLoading(
        loadingKey,
        apiCall,
        loadingMessage,
        successMessage,
        timeout
      );
    },
    [multiLoading]
  );

  // Execute multiple API calls
  const executeMultipleApiCalls = useCallback(
    async (apiCalls, options = {}) => {
      const { showProgress = true, stopOnError = false } = options;

      const results = [];
      const total = apiCalls.length;

      for (let i = 0; i < apiCalls.length; i++) {
        const {
          call,
          key = `api-call-${i}`,
          message = `İşlem ${i + 1}/${total}`,
        } = apiCalls[i];

        try {
          if (showProgress) {
            multiLoading.updateProgress(`batch-${key}`, (i / total) * 100);
          }

          const result = await multiLoading.withLoading(key, call, message);
          results.push({ success: true, data: result });
        } catch (error) {
          results.push({ success: false, error });

          if (stopOnError) {
            break;
          }
        }
      }

      return results;
    },
    [multiLoading]
  );

  return {
    ...multiLoading,
    executeApiCall,
    executeMultipleApiCalls,
  };
}

/**
 * Loading hook for file uploads with progress
 */
export function useFileUploadLoading() {
  const [uploads, setUploads] = useState({});

  // Start file upload
  const startUpload = useCallback((fileId, fileName) => {
    setUploads((prev) => ({
      ...prev,
      [fileId]: {
        fileName,
        progress: 0,
        isUploading: true,
        uploadedBytes: 0,
        totalBytes: 0,
        speed: 0,
        timeRemaining: 0,
      },
    }));
  }, []);

  // Update upload progress
  const updateUploadProgress = useCallback(
    (fileId, progress, uploadedBytes = 0, totalBytes = 0) => {
      setUploads((prev) => {
        const upload = prev[fileId];
        if (!upload) return prev;

        const now = Date.now();
        const timeDiff = now - (upload.lastUpdate || now);
        const bytesDiff = uploadedBytes - upload.uploadedBytes;
        const speed = timeDiff > 0 ? (bytesDiff / timeDiff) * 1000 : 0; // bytes per second
        const remainingBytes = totalBytes - uploadedBytes;
        const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

        return {
          ...prev,
          [fileId]: {
            ...upload,
            progress: Math.max(0, Math.min(100, progress)),
            uploadedBytes,
            totalBytes,
            speed,
            timeRemaining,
            lastUpdate: now,
          },
        };
      });
    },
    []
  );

  // Complete upload
  const completeUpload = useCallback((fileId, result = null) => {
    setUploads((prev) => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        progress: 100,
        isUploading: false,
        result,
      },
    }));

    // Remove from state after 2 seconds
    setTimeout(() => {
      setUploads((prev) => {
        const newState = { ...prev };
        delete newState[fileId];
        return newState;
      });
    }, 2000);
  }, []);

  // Cancel upload
  const cancelUpload = useCallback((fileId) => {
    setUploads((prev) => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
    });
  }, []);

  // Get upload info
  const getUploadInfo = useCallback(
    (fileId) => {
      return uploads[fileId] || null;
    },
    [uploads]
  );

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // Format speed
  const formatSpeed = useCallback(
    (bytesPerSecond) => {
      return formatFileSize(bytesPerSecond) + "/s";
    },
    [formatFileSize]
  );

  // Format time remaining
  const formatTimeRemaining = useCallback((seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }, []);

  return {
    uploads,
    startUpload,
    updateUploadProgress,
    completeUpload,
    cancelUpload,
    getUploadInfo,
    formatFileSize,
    formatSpeed,
    formatTimeRemaining,
  };
}

/**
 * Loading hook with automatic retry functionality
 */
export function useRetryableLoading(maxRetries = 3, retryDelay = 1000) {
  const loading = useLoading();
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(
    async (asyncFn, message = "") => {
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const loadingMessage =
            attempt > 0
              ? `${message} (Deneme ${attempt + 1}/${maxRetries + 1})`
              : message;

          loading.startLoading(loadingMessage);
          const result = await asyncFn();
          loading.stopLoading();
          setRetryCount(0);
          return result;
        } catch (error) {
          attempt++;
          setRetryCount(attempt);

          if (attempt > maxRetries) {
            loading.stopLoading();
            throw error;
          }

          // Wait before retry
          loading.updateMessage(
            `Yeniden deneniyor... (${attempt}/${maxRetries})`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * attempt)
          );
        }
      }
    },
    [loading, maxRetries, retryDelay]
  );

  return {
    ...loading,
    retryCount,
    executeWithRetry,
  };
}

// Pre-configured loading hooks for common use cases
export function usePageLoading() {
  return useLoading({
    showToast: false,
    timeout: 15000,
  });
}

export function useFormLoading() {
  return useLoading({
    showToast: true,
    timeout: 10000,
  });
}

export function useApiCallLoading() {
  return useApiLoading();
}

export default useLoading;
