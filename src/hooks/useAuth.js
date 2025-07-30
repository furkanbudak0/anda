import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  login as apiLogin,
  userSignup as apiUserSignup,
  sellerSignup as apiSellerSignup,
  updateCurrentUser as apiUpdateUser,
  resetPassword as apiResetPassword,
  updatePassword as apiUpdatePassword,
} from "../services/apiAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext"; // Import from AuthContext

/**
 * Enhanced user authentication hook with improved error handling
 * This hook is now deprecated - use useAuth from AuthContext instead
 * @deprecated Use useAuth from AuthContext
 */
export function useUser() {
  const { user, profile, role, isAuthenticated, isLoading, error } = useAuth();

  return {
    isLoading,
    user,
    profile,
    sellerData: null, // Will be handled by seller-specific hooks
    role,
    isAuthenticated,
    error,
  };
}

/**
 * Login mutation with enhanced error handling and navigation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: ({ email, password }) => apiLogin({ email, password }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["user"], data);

      // Refresh auth context
      await refreshUser();

      // Navigate based on role
      const role =
        data.user.user_metadata?.role || data.profile?.role || "user";

      switch (role) {
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "seller":
          navigate("/seller/dashboard", { replace: true });
          break;
        case "user":
          navigate("/dashboard", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }

      toast.success(
        `Hoş geldiniz, ${data.user.user_metadata?.fullName || "Kullanıcı"}!`
      );
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error("Login error:", error);
      }
      toast.error(error.message || "Giriş yapılırken hata oluştu");
    },
  });
}

/**
 * Logout mutation with cleanup
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logout } = useAuth();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/", { replace: true });
      toast.success("Başarıyla çıkış yaptınız");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      toast.error("Çıkış yapılırken hata oluştu");
    },
  });
}

/**
 * User signup mutation - Enhanced to support additional profile data
 */
export function useUserSignup() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: ({
      email,
      password,
      fullName,
      phone,
      tcId,
      birthDate,
      gender,
    }) =>
      apiUserSignup({
        email,
        password,
        fullName,
        phone,
        tcId,
        birthDate,
        gender,
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["user"], data);

      // Refresh auth context to get updated profile
      await refreshUser();

      navigate("/dashboard", { replace: true });
      toast.success(`Hoş geldiniz ${data.user.user_metadata?.fullName}!`);
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error("User signup error:", error);
      }
      toast.error(error.message || "Hesap oluşturulurken hata oluştu");
    },
  });
}

/**
 * Seller signup mutation with multi-step process
 */
export function useSellerSignup() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ fullName, companyName, taxId, phone, email, password }) =>
      apiSellerSignup({
        fullName,
        companyName,
        taxId,
        phone,
        email,
        password,
      }),
    onSuccess: () => {
      // Don't set user data since seller accounts need approval
      navigate("/seller/application-submitted", { replace: true });
      toast.success(
        "Satıcı başvurunuz alındı! E-postanızı kontrol edin ve onay sürecini takip edin.",
        { duration: 6000 }
      );
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error("Seller signup error:", error);
      }
      toast.error(
        error.message || "Satıcı başvurusu gönderilirken hata oluştu"
      );
    },
  });
}

/**
 * Update user profile mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: apiUpdateUser,
    onSuccess: async () => {
      queryClient.invalidateQueries(["user"]);
      await refreshUser();
      toast.success("Profiliniz başarıyla güncellendi");
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error("Update user error:", error);
      }
      toast.error(error.message || "Profil güncellenirken hata oluştu");
    },
  });
}

/**
 * Password reset mutation
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ email }) => apiResetPassword(email),
    onSuccess: () => {
      toast.success(
        "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.",
        { duration: 6000 }
      );
    },
    onError: (error) => {
      console.error("Reset password error:", error);
      toast.error(error.message || "Şifre sıfırlama e-postası gönderilemedi");
    },
  });
}

/**
 * Update password mutation
 */
export function useUpdatePassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ newPassword }) => apiUpdatePassword(newPassword),
    onSuccess: () => {
      navigate("/user/account", { replace: true });
      toast.success("Şifreniz başarıyla güncellendi");
    },
    onError: (error) => {
      console.error("Update password error:", error);
      toast.error(error.message || "Şifre güncellenirken hata oluştu");
    },
  });
}

/**
 * Check if user has specific permission
 */
export function usePermission(permission) {
  const { hasPermission, isLoading } = useAuth();

  return { hasPermission: hasPermission(permission), isLoading };
}

/**
 * Check if user has minimum role level
 */
export function useRoleCheck(requiredRole) {
  const { hasRoleLevel, role, isLoading } = useAuth();

  return {
    hasRole: hasRoleLevel(requiredRole),
    userRole: role,
    isLoading,
  };
}

/**
 * Authentication status hook
 */
export function useAuthStatus() {
  const { isLoading, isAuthenticated, isError, error } = useAuth();

  return {
    isLoading,
    isAuthenticated,
    isError,
    error,
  };
}

/**
 * Get role-specific dashboard route
 */
export function useDashboardRoute() {
  const { getDashboardRoute } = useAuth();
  return getDashboardRoute();
}
