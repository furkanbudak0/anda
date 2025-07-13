/* eslint-disable react/prop-types */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster, toast } from "react-hot-toast";
import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { ThemeProvider } from "./ThemeContext";

/**
 * CONSOLIDATED APP PROVIDER
 *
 * Tüm context provider'ları tek bir component içinde birleştirir.
 * Provider nesting hell'i önler ve performance optimization sağlar.
 *
 * Features:
 * - React Query client configuration
 * - All context providers consolidated
 * - Global toast notifications
 * - Development tools integration
 * - Performance monitoring
 */

// React Query client configuration with optimized settings
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Background refetch optimizations
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          // Don't retry on authentication errors
          if (error?.message?.includes("auth") || error?.status === 401) {
            return false;
          }
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Global mutation error handling
        onError: (error) => {
          if (import.meta.env.DEV) {
            console.error("Mutation error:", error);
          }
          // Show user-friendly error messages
          const errorMessage = error?.message || "Bir hata oluştu";
          toast.error(errorMessage);
        },
        // Retry failed mutations once
        retry: 1,
      },
    },
  });

// Global query client instance - created once per app
let queryClientInstance = null;

const getQueryClient = () => {
  if (!queryClientInstance) {
    queryClientInstance = createQueryClient();
  }
  return queryClientInstance;
};

/**
 * Provider composition order matters for performance:
 * 1. QueryClient (outermost - provides React Query context)
 * 2. Theme (affects all UI components)
 * 3. Auth (needed by Cart and other business logic)
 * 4. Cart (depends on Auth for user context)
 * 5. App content (innermost)
 */
export function AppProvider({ children }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            {/* Global Toast Notifications with theme support */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--toast-bg)",
                  color: "var(--toast-color)",
                  border: "1px solid var(--toast-border)",
                  borderRadius: "12px",
                  padding: "16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: "#10B981",
                    secondary: "#FFFFFF",
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: "#EF4444",
                    secondary: "#FFFFFF",
                  },
                },
                loading: {
                  duration: Infinity,
                  iconTheme: {
                    primary: "#3B82F6",
                    secondary: "#FFFFFF",
                  },
                },
              }}
            />

            {/* App Content */}
            {children}

            {/* Development Tools - only in development */}
            {import.meta.env.DEV && (
              <ReactQueryDevtools
                initialIsOpen={false}
                position="bottom-right"
              />
            )}
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * HOC for components that need access to all contexts
 * Provides a convenient wrapper for testing and isolation
 */
export function withAppProvider(Component) {
  const WrappedComponent = (props) => (
    <AppProvider>
      <Component {...props} />
    </AppProvider>
  );

  WrappedComponent.displayName = `withAppProvider(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

/**
 * Utility hook for accessing all global state
 * Useful for debugging and development
 * TODO: Implement proper development-only global state access
 */
export function useGlobalState() {
  if (import.meta.env.DEV) {
    console.warn("useGlobalState: Use individual context hooks instead");
  }

  return null;
}

/**
 * Performance monitoring hook
 * Tracks context re-renders and performance metrics
 */
export function usePerformanceMonitor() {
  if (import.meta.env.DEV) {
    const startTime = performance.now();

    return {
      measureRender: (componentName) => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        if (renderTime > 16) {
          // More than 1 frame (60fps)
          console.warn(
            `Slow render detected in ${componentName}: ${renderTime.toFixed(
              2
            )}ms`
          );
        }

        return renderTime;
      },

      logContextUpdate: (contextName, updatedValues) => {
        console.log(`${contextName} context updated:`, updatedValues);
      },
    };
  }

  return {
    measureRender: () => 0,
    logContextUpdate: () => {},
  };
}

/**
 * State management utilities for common patterns
 */
export const stateUtils = {
  // Debounced state updates
  createDebouncedUpdater: (updateFn, delay = 300) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => updateFn(...args), delay);
    };
  },

  // Optimistic updates helper
  createOptimisticUpdater: (mutationFn, rollbackFn) => {
    return async (optimisticData) => {
      let rollbackFunc = null;

      try {
        // Apply optimistic update and get rollback function
        rollbackFunc = rollbackFn(optimisticData);

        // Execute actual mutation
        const result = await mutationFn(optimisticData);

        return result;
      } catch (error) {
        // Rollback on error if rollback function exists
        if (rollbackFunc && typeof rollbackFunc === "function") {
          rollbackFunc();
        }
        throw error;
      }
    };
  },

  // Local storage sync
  createLocalStorageSync: (key, defaultValue) => {
    const stored = localStorage.getItem(key);
    const initial = stored ? JSON.parse(stored) : defaultValue;

    return {
      get: () => initial,
      set: (value) => {
        localStorage.setItem(key, JSON.stringify(value));
        return value;
      },
      remove: () => localStorage.removeItem(key),
    };
  },
};

export default AppProvider;
