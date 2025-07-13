import { useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

/**
 * PERFORMANCE MONITORING SİSTEMİ
 *
 * Özellikler:
 * - Real-time performans metrikleri
 * - Sayfa yükleme süreleri
 * - API yanıt süreleri
 * - JavaScript hata izleme
 * - Kullanıcı deneyimi metrikleri
 * - Core Web Vitals
 * - Resource timing
 */

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitoring() {
  // Performance metrics collection
  const collectMetrics = useCallback(() => {
    if (!window.performance) return null;

    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");

    return {
      // Navigation timing
      pageLoadTime: navigation?.loadEventEnd - navigation?.navigationStart || 0,
      domContentLoaded:
        navigation?.domContentLoadedEventEnd - navigation?.navigationStart || 0,
      firstContentfulPaint: 0, // Will be set by observer
      largestContentfulPaint: 0, // Will be set by observer
      firstInputDelay: 0, // Will be set by observer
      cumulativeLayoutShift: 0, // Will be set by observer

      // Resource timing
      totalResources: resources.length,
      slowResources: resources.filter((r) => r.duration > 1000).length,
      largestResource: Math.max(...resources.map((r) => r.transferSize || 0)),

      // Memory (if available)
      usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
      totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit || 0,

      // Network
      connectionType: navigator.connection?.effectiveType || "unknown",
      downlink: navigator.connection?.downlink || 0,

      // Timestamp
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }, []);

  // Core Web Vitals observer
  useEffect(() => {
    if (!window.PerformanceObserver) return;

    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.performanceMetrics = {
          ...window.performanceMetrics,
          largestContentfulPaint: entry.startTime,
        };
      }
    });

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.performanceMetrics = {
          ...window.performanceMetrics,
          firstInputDelay: entry.processingStart - entry.startTime,
        };
      }
    });

    // CLS (Cumulative Layout Shift)
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      window.performanceMetrics = {
        ...window.performanceMetrics,
        cumulativeLayoutShift: clsValue,
      };
    });

    // FCP (First Contentful Paint)
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          window.performanceMetrics = {
            ...window.performanceMetrics,
            firstContentfulPaint: entry.startTime,
          };
        }
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      fidObserver.observe({ entryTypes: ["first-input"] });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
      fcpObserver.observe({ entryTypes: ["paint"] });
    } catch (error) {
      console.warn("Performance Observer not supported:", error);
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      fcpObserver.disconnect();
    };
  }, []);

  // Error tracking
  useEffect(() => {
    const handleError = (event) => {
      const errorData = {
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // Send error to monitoring service
      sendErrorReport(errorData);
    };

    const handleUnhandledRejection = (event) => {
      const errorData = {
        type: "unhandledRejection",
        reason: event.reason,
        timestamp: Date.now(),
        url: window.location.href,
      };

      sendErrorReport(errorData);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  // Send performance data
  const sendPerformanceData = useMutation({
    mutationFn: async (metrics) => {
      // In production, send to analytics service (Sentry, DataDog, etc.)
      if (import.meta.env.DEV) {
        console.log("Performance metrics:", metrics);
      }

      // Store locally for development
      const existingData = JSON.parse(
        localStorage.getItem("anda_performance_data") || "[]"
      );
      const updatedData = [...existingData, metrics].slice(-100); // Keep last 100 entries
      localStorage.setItem(
        "anda_performance_data",
        JSON.stringify(updatedData)
      );

      return metrics;
    },
  });

  // Send performance data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = collectMetrics();
      if (metrics) {
        sendPerformanceData.mutate({
          ...metrics,
          ...window.performanceMetrics,
        });
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [collectMetrics, sendPerformanceData]);

  return {
    collectMetrics,
    sendPerformanceData: sendPerformanceData.mutate,
  };
}

/**
 * API Performance tracking hook
 */
export function useAPIPerformance() {
  const trackAPICall = useCallback(
    (url, method, startTime, endTime, status) => {
      const duration = endTime - startTime;
      const metric = {
        type: "api_call",
        url,
        method,
        duration,
        status,
        timestamp: Date.now(),
      };

      // Store API metrics
      const existingData = JSON.parse(
        localStorage.getItem("anda_api_metrics") || "[]"
      );
      const updatedData = [...existingData, metric].slice(-200);
      localStorage.setItem("anda_api_metrics", JSON.stringify(updatedData));

      // Alert on slow APIs
      if (duration > 5000 && import.meta.env.DEV) {
        console.warn(`Slow API detected: ${url} took ${duration}ms`);
      }
    },
    []
  );

  return { trackAPICall };
}

/**
 * Page performance hook
 */
export function usePagePerformance(pageName) {
  const pageStartTime = Date.now();

  useEffect(() => {
    const recordPageVisit = () => {
      const visitDuration = Date.now() - pageStartTime;
      const pageMetric = {
        type: "page_visit",
        pageName,
        duration: visitDuration,
        timestamp: pageStartTime,
        url: window.location.href,
      };

      const existingData = JSON.parse(
        localStorage.getItem("anda_page_metrics") || "[]"
      );
      const updatedData = [...existingData, pageMetric].slice(-100);
      localStorage.setItem("anda_page_metrics", JSON.stringify(updatedData));
    };

    return recordPageVisit;
  }, [pageName, pageStartTime]);

  return { pageStartTime };
}

/**
 * Performance dashboard data hook
 */
export function usePerformanceDashboard() {
  return useQuery({
    queryKey: ["performance-dashboard"],
    queryFn: async () => {
      const performanceData = JSON.parse(
        localStorage.getItem("anda_performance_data") || "[]"
      );
      const apiMetrics = JSON.parse(
        localStorage.getItem("anda_api_metrics") || "[]"
      );
      const pageMetrics = JSON.parse(
        localStorage.getItem("anda_page_metrics") || "[]"
      );

      // Calculate averages and insights
      const avgPageLoadTime = performanceData.length
        ? performanceData.reduce((sum, m) => sum + m.pageLoadTime, 0) /
          performanceData.length
        : 0;

      const avgAPIResponseTime = apiMetrics.length
        ? apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length
        : 0;

      const slowAPIs = apiMetrics.filter((m) => m.duration > 2000);
      const errorRate = apiMetrics.length
        ? (apiMetrics.filter((m) => m.status >= 400).length /
            apiMetrics.length) *
          100
        : 0;

      // Core Web Vitals summary
      const coreWebVitals =
        performanceData.length > 0
          ? {
              lcp:
                performanceData[performanceData.length - 1]
                  ?.largestContentfulPaint || 0,
              fid:
                performanceData[performanceData.length - 1]?.firstInputDelay ||
                0,
              cls:
                performanceData[performanceData.length - 1]
                  ?.cumulativeLayoutShift || 0,
            }
          : { lcp: 0, fid: 0, cls: 0 };

      return {
        overview: {
          avgPageLoadTime,
          avgAPIResponseTime,
          errorRate,
          totalPageViews: pageMetrics.length,
          totalAPIRequests: apiMetrics.length,
        },
        coreWebVitals,
        slowAPIs: slowAPIs.slice(-10),
        recentErrors: [], // Would be populated from error tracking
        performanceTrends: performanceData.slice(-20),
        topPages: getTopPages(pageMetrics),
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Performance alerts hook
 */
export function usePerformanceAlerts() {
  const { data: dashboardData } = usePerformanceDashboard();

  const alerts = [];

  if (dashboardData) {
    // Page load time alert
    if (dashboardData.overview.avgPageLoadTime > 3000) {
      alerts.push({
        type: "warning",
        message: `Ortalama sayfa yükleme süresi yüksek: ${Math.round(
          dashboardData.overview.avgPageLoadTime
        )}ms`,
        metric: "pageLoadTime",
      });
    }

    // API response time alert
    if (dashboardData.overview.avgAPIResponseTime > 1000) {
      alerts.push({
        type: "warning",
        message: `Ortalama API yanıt süresi yüksek: ${Math.round(
          dashboardData.overview.avgAPIResponseTime
        )}ms`,
        metric: "apiResponseTime",
      });
    }

    // Error rate alert
    if (dashboardData.overview.errorRate > 5) {
      alerts.push({
        type: "error",
        message: `Yüksek hata oranı: %${dashboardData.overview.errorRate.toFixed(
          1
        )}`,
        metric: "errorRate",
      });
    }

    // Core Web Vitals alerts
    if (dashboardData.coreWebVitals.lcp > 2500) {
      alerts.push({
        type: "warning",
        message: "LCP (Largest Contentful Paint) çok yüksek",
        metric: "lcp",
      });
    }

    if (dashboardData.coreWebVitals.fid > 100) {
      alerts.push({
        type: "warning",
        message: "FID (First Input Delay) çok yüksek",
        metric: "fid",
      });
    }

    if (dashboardData.coreWebVitals.cls > 0.1) {
      alerts.push({
        type: "warning",
        message: "CLS (Cumulative Layout Shift) çok yüksek",
        metric: "cls",
      });
    }
  }

  return alerts;
}

// Helper functions
function sendErrorReport(errorData) {
  // In production, send to error tracking service (Sentry, Bugsnag, etc.)
  if (import.meta.env.DEV) {
    console.error("Error tracked:", errorData);
  }

  const existingErrors = JSON.parse(
    localStorage.getItem("anda_error_logs") || "[]"
  );
  const updatedErrors = [...existingErrors, errorData].slice(-50);
  localStorage.setItem("anda_error_logs", JSON.stringify(updatedErrors));
}

function getTopPages(pageMetrics) {
  const pageVisits = {};
  pageMetrics.forEach((metric) => {
    const page = metric.pageName || "Unknown";
    pageVisits[page] = (pageVisits[page] || 0) + 1;
  });

  return Object.entries(pageVisits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([page, visits]) => ({ page, visits }));
}
