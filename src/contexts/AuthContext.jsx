import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, logout as apiLogout } from "../services/apiAuth";

// Authentication states
const AUTH_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
  ERROR: "error",
};

// User roles with hierarchy levels
const ROLES = {
  USER: { name: "user", level: 1 },
  SELLER: { name: "seller", level: 2 },
  ADMIN: { name: "admin", level: 3 },
};

// Permissions for each role
const ROLE_PERMISSIONS = {
  user: [
    "view_products",
    "add_to_cart",
    "place_order",
    "manage_profile",
    "view_orders",
    "add_review",
  ],
  seller: [
    "view_products",
    "manage_products",
    "view_seller_dashboard",
    "manage_seller_profile",
    "view_seller_orders",
    "manage_inventory",
    "view_analytics",
  ],
  admin: [
    "view_admin_dashboard",
    "manage_users",
    "manage_sellers",
    "approve_applications",
    "view_system_analytics",
    "manage_platform_settings",
    "audit_logs",
    "moderate_content",
  ],
};

const AuthContext = createContext();

// Auth reducer for state management
function authReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, status: AUTH_STATES.LOADING };

    case "SET_USER":
      return {
        ...state,
        status: AUTH_STATES.AUTHENTICATED,
        user: action.payload.user,
        profile: action.payload.profile,
        role: action.payload.role,
        permissions: ROLE_PERMISSIONS[action.payload.role] || [],
        error: null,
      };

    case "SET_UNAUTHENTICATED":
      return {
        ...state,
        status: AUTH_STATES.UNAUTHENTICATED,
        user: null,
        profile: null,
        role: null,
        permissions: [],
        error: null,
      };

    case "SET_ERROR":
      return {
        ...state,
        status: AUTH_STATES.ERROR,
        error: action.payload,
      };

    default:
      return state;
  }
}

const initialState = {
  status: AUTH_STATES.IDLE,
  user: null,
  profile: null,
  role: null,
  permissions: [],
  error: null,
};

/**
 * Enhanced authentication provider with JWT token management
 * Handles multi-role authentication for users, sellers, and admins
 */
// eslint-disable-next-line react/prop-types
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  /**
   * Initialize authentication state on app start
   * Checks for existing session and validates JWT token
   */
  useEffect(() => {
    async function initializeAuth() {
      try {
        dispatch({ type: "SET_LOADING" });

        const userData = await getCurrentUser();

        if (userData?.user) {
          const role = userData.user.user_metadata?.role || "user";
          const profile = userData.profile || null;

          // Validate role and set permissions
          if (Object.keys(ROLE_PERMISSIONS).includes(role)) {
            dispatch({
              type: "SET_USER",
              payload: {
                user: userData.user,
                profile,
                role,
              },
            });
          } else {
            throw new Error("Geçersiz kullanıcı rolü");
          }
        } else {
          dispatch({ type: "SET_UNAUTHENTICATED" });
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Auth initialization failed:", error);
        }
        dispatch({
          type: "SET_ERROR",
          payload: error.message || "Kimlik doğrulama başlatılamadı",
        });
      }
    }

    initializeAuth();
  }, []);

  /**
   * Enhanced logout with cleanup
   * Clears all authentication data and query cache
   */
  const logout = useCallback(async () => {
    try {
      await apiLogout();
      dispatch({ type: "SET_UNAUTHENTICATED" });
      queryClient.clear();

      // Clear any stored tokens
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();
    } catch (error) {
      console.error("Logout failed:", error);
      // Force logout even if API call fails
      dispatch({ type: "SET_UNAUTHENTICATED" });
      queryClient.clear();
    }
  }, [queryClient]);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback(
    (permission) => {
      return state.permissions.includes(permission);
    },
    [state.permissions]
  );

  /**
   * Check if user has minimum role level
   */
  const hasRoleLevel = useCallback(
    (requiredRole) => {
      if (!state.role) return false;

      const userLevel = ROLES[state.role.toUpperCase()]?.level || 0;
      const requiredLevel = ROLES[requiredRole.toUpperCase()]?.level || 0;

      return userLevel >= requiredLevel;
    },
    [state.role]
  );

  /**
   * Check if user is authenticated and optionally has required role
   */
  const isAuthorized = useCallback(
    (requiredRole = null, requiredPermission = null) => {
      const isAuthenticated = state.status === AUTH_STATES.AUTHENTICATED;

      if (!isAuthenticated) return false;

      if (requiredRole && !hasRoleLevel(requiredRole)) {
        return false;
      }

      if (requiredPermission && !hasPermission(requiredPermission)) {
        return false;
      }

      return true;
    },
    [state.status, hasRoleLevel, hasPermission]
  );

  /**
   * Get user's role-specific dashboard route
   */
  const getDashboardRoute = useCallback(() => {
    switch (state.role) {
      case "admin":
        return "/admin/dashboard";
      case "seller":
        return "/seller/dashboard";
      case "user":
        return "/dashboard"; // Fixed path
      default:
        return "/dashboard"; // Fixed path
    }
  }, [state.role]);

  /**
   * Refresh user data and profile
   */
  const refreshUser = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING" });
      const userData = await getCurrentUser();

      if (userData?.user) {
        const role = userData.user.user_metadata?.role || "user";
        const profile = userData.profile || null;

        dispatch({
          type: "SET_USER",
          payload: {
            user: userData.user,
            profile,
            role,
          },
        });
      } else {
        dispatch({ type: "SET_UNAUTHENTICATED" });
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "Kullanıcı bilgileri güncellenemedi",
      });
    }
  }, []);

  const value = useMemo(
    () => ({
      // State
      ...state,
      isLoading: state.status === AUTH_STATES.LOADING,
      isAuthenticated: state.status === AUTH_STATES.AUTHENTICATED,
      isError: state.status === AUTH_STATES.ERROR,

      // Methods
      logout,
      hasPermission,
      hasRoleLevel,
      isAuthorized,
      getDashboardRoute,
      refreshUser,

      // Constants
      ROLES: ROLES,
      PERMISSIONS: ROLE_PERMISSIONS,
    }),
    [
      state,
      logout,
      hasPermission,
      hasRoleLevel,
      isAuthorized,
      getDashboardRoute,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 * Throws error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth, AuthProvider içinde kullanılmalıdır");
  }

  return context;
}
