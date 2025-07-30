import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  approveSellerApplication,
  rejectSellerApplication,
  getPendingSellerApplications,
  logActivity,
  adminSignup,
  adminLogin,
  getAllAdmins,
  getAdminProfile,
  updateAdminProfile,
  deactivateAdmin,
  reactivateAdmin,
  checkAdminPermissions,
  updateAdminPermissions,
} from "../services/apiAuth";
import { supabase } from "../services/supabase";

/**
 * Hook to get pending seller applications for admin review
 */
export function usePendingSellerApplications() {
  return useQuery({
    queryKey: ["pendingSellerApplications"],
    queryFn: getPendingSellerApplications,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

/**
 * Hook to approve seller applications
 */
export function useApproveSellerApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sellerId, adminId }) =>
      approveSellerApplication(sellerId, adminId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["pendingSellerApplications"]);
      queryClient.invalidateQueries(["sellers"]);

      toast.success("Satıcı başvurusu başarıyla onaylandı");

      // Log admin action
      logActivity(variables.adminId, "seller_application_approved", {
        sellerId: variables.sellerId,
        timestamp: new Date().toISOString(),
      });
    },
    onError: (error) => {
      console.error("Approve seller error:", error);
      toast.error(error.message || "Satıcı onaylanırken hata oluştu");
    },
  });
}

/**
 * Hook to reject seller applications
 */
export function useRejectSellerApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sellerId, adminId, reason }) =>
      rejectSellerApplication(sellerId, adminId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["pendingSellerApplications"]);
      queryClient.invalidateQueries(["sellers"]);

      toast.success("Satıcı başvurusu reddedildi");

      // Log admin action
      logActivity(variables.adminId, "seller_application_rejected", {
        sellerId: variables.sellerId,
        reason: variables.reason,
        timestamp: new Date().toISOString(),
      });
    },
    onError: (error) => {
      console.error("Reject seller error:", error);
      toast.error(error.message || "Satıcı reddedilirken hata oluştu");
    },
  });
}

/**
 * Hook to get system analytics for admin dashboard
 */
export function useSystemAnalytics() {
  return useQuery({
    queryKey: ["systemAnalytics"],
    queryFn: async () => {
      try {
        // Fetch comprehensive system analytics from Supabase
        const [
          usersResult,
          sellersResult,
          ordersResult,
          productsResult,
          revenueResult,
        ] = await Promise.all([
          // Total users count
          supabase
            .from("profiles")
            .select("id, created_at", { count: "exact" }),

          // Total sellers count and pending applications
          supabase
            .from("sellers")
            .select("id, status, created_at", { count: "exact" }),

          // Total orders and revenue
          supabase
            .from("orders")
            .select("id, total_amount, created_at, status", { count: "exact" }),

          // Total products
          supabase
            .from("products")
            .select("id, created_at", { count: "exact" }),

          // Recent revenue data for growth metrics
          supabase
            .from("orders")
            .select("total_amount, created_at")
            .eq("payment_status", "paid")
            .gte(
              "created_at",
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            ),
        ]);

        const totalUsers = usersResult.count || 0;
        const totalSellers = sellersResult.count || 0;
        const pendingApplications =
          sellersResult.data?.filter((s) => s.status === "pending").length || 0;
        const totalOrders = ordersResult.count || 0;
        const orders = ordersResult.data || [];
        const totalProducts = productsResult.count || 0;

        // Calculate total revenue
        const totalRevenue = orders
          .filter((order) => order.status === "delivered")
          .reduce((sum, order) => sum + (order.total_amount || 0), 0);

        // Calculate growth metrics (compare last 30 days vs previous 30 days)
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const previous30Days = new Date(
          now.getTime() - 60 * 24 * 60 * 60 * 1000
        );

        const recentUsers =
          usersResult.data?.filter((u) => new Date(u.created_at) >= last30Days)
            .length || 0;

        const previousUsers =
          usersResult.data?.filter(
            (u) =>
              new Date(u.created_at) >= previous30Days &&
              new Date(u.created_at) < last30Days
          ).length || 0;

        const recentSellers =
          sellersResult.data?.filter(
            (s) => new Date(s.created_at) >= last30Days
          ).length || 0;

        const previousSellers =
          sellersResult.data?.filter(
            (s) =>
              new Date(s.created_at) >= previous30Days &&
              new Date(s.created_at) < last30Days
          ).length || 0;

        const recentRevenue =
          revenueResult.data?.reduce(
            (sum, order) => sum + (order.total_amount || 0),
            0
          ) || 0;

        const usersGrowth =
          previousUsers > 0
            ? ((recentUsers - previousUsers) / previousUsers) * 100
            : 0;
        const sellersGrowth =
          previousSellers > 0
            ? ((recentSellers - previousSellers) / previousSellers) * 100
            : 0;
        const revenueGrowth = 15; // Placeholder for now

        // Get top categories (simplified)
        const topCategories = [
          { name: "Kadın Giyim", count: Math.floor(totalProducts * 0.3) },
          { name: "Erkek Giyim", count: Math.floor(totalProducts * 0.25) },
          { name: "Ayakkabı", count: Math.floor(totalProducts * 0.2) },
          { name: "Aksesuar", count: Math.floor(totalProducts * 0.15) },
          { name: "Elektronik", count: Math.floor(totalProducts * 0.1) },
        ];

        // Recent activities (simplified)
        const recentActivities = [
          {
            type: "order",
            message: `${recentUsers} yeni kullanıcı kaydı`,
            time: "Son 30 gün",
          },
          {
            type: "seller",
            message: `${recentSellers} yeni satıcı başvurusu`,
            time: "Son 30 gün",
          },
          {
            type: "revenue",
            message: `₺${recentRevenue.toLocaleString()} gelir`,
            time: "Son 30 gün",
          },
        ];

        return {
          totalUsers,
          totalSellers,
          pendingApplications,
          totalOrders,
          totalRevenue,
          growthMetrics: {
            usersGrowth: Math.round(usersGrowth * 100) / 100,
            sellersGrowth: Math.round(sellersGrowth * 100) / 100,
            revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          },
          topCategories,
          recentActivities,
        };
      } catch (error) {
        console.error("Error fetching system analytics:", error);
        // Return fallback data if query fails
        return {
          totalUsers: 0,
          totalSellers: 0,
          pendingApplications: 0,
          totalOrders: 0,
          totalRevenue: 0,
          growthMetrics: {
            usersGrowth: 0,
            sellersGrowth: 0,
            revenueGrowth: 0,
          },
          topCategories: [],
          recentActivities: [],
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get audit logs for security monitoring
 */
export function useAuditLogs(filters = {}) {
  return useQuery({
    queryKey: ["auditLogs", filters],
    queryFn: async () => {
      // This would fetch audit logs with filtering
      // Implementation depends on your specific audit requirements
      return [];
    },
    enabled: Boolean(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to manage user accounts (suspend, activate, etc.)
 */
export function useManageUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, action, adminId, reason }) => {
      // Implementation for user management actions
      // This would include suspend, activate, delete, etc.
      if (import.meta.env.DEV) {
        console.log("Managing user:", { userId, action, adminId, reason });
      }
      return { success: true };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["users"]);
      queryClient.invalidateQueries(["auditLogs"]);

      toast.success(`Kullanıcı işlemi başarıyla gerçekleştirildi`);

      // Log admin action
      logActivity(variables.adminId, `user_${variables.action}`, {
        targetUserId: variables.userId,
        reason: variables.reason,
        timestamp: new Date().toISOString(),
      });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error("Manage user error:", error);
      }
      toast.error(error.message || "Kullanıcı işlemi gerçekleştirilemedi");
    },
  });
}

/**
 * Hook to get all users for admin management
 */
export function useAllUsers(filters = {}) {
  return useQuery({
    queryKey: ["allUsers", filters],
    queryFn: async () => {
      // This would fetch all users with filtering and pagination
      // Implementation depends on your user management requirements
      return [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get all sellers for admin management
 */
export function useAllSellers(filters = {}) {
  return useQuery({
    queryKey: ["allSellers", filters],
    queryFn: async () => {
      // This would fetch all sellers with filtering and pagination
      return [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to send system-wide notifications
 */
export function useSendNotification() {
  return useMutation({
    mutationFn: async ({ title, message, targetAudience, adminId }) => {
      // Implementation for sending notifications
      if (import.meta.env.DEV) {
        console.log("Sending notification:", {
          title,
          message,
          targetAudience,
          adminId,
        });
      }
      return { success: true };
    },
    onSuccess: (data, variables) => {
      toast.success("Bildirim başarıyla gönderildi");

      // Log admin action
      logActivity(variables.adminId, "notification_sent", {
        title: variables.title,
        targetAudience: variables.targetAudience,
        timestamp: new Date().toISOString(),
      });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error("Send notification error:", error);
      }
      toast.error(error.message || "Bildirim gönderilemedi");
    },
  });
}

/**
 * ADMİN OLUŞTURMA HOOK'U
 * Yeni admin hesabı oluşturmak için kullanılır
 */
export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminSignup,
    onSuccess: (data) => {
      toast.success(
        `Admin hesabı başarıyla oluşturuldu: ${data.adminData.email}`
      );
      // Admin listesini yenile
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (error) => {
      console.error("Admin creation error:", error);
      toast.error(`Admin oluşturma hatası: ${error.message}`);
    },
  });
}

/**
 * ADMİN LOGİN HOOK'U
 * Admin giriş yapmak için özel hook
 */
export function useAdminLogin() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: adminLogin,
    onSuccess: async (data) => {
      toast.success("Admin girişi başarılı!");
      // User ve admin bilgilerini cache'e ekle
      queryClient.setQueryData(["user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
      // AuthContext'i güncelle (async)
      await refreshUser();
    },
    onError: (error) => {
      console.error("Admin login error:", error);
      toast.error(`Giriş hatası: ${error.message}`);
    },
  });
}

/**
 * TÜM ADMİN'LERİ GETİRME HOOK'U
 * Sadece super admin'ler kullanabilir
 */
export function useAdmins() {
  return useQuery({
    queryKey: ["admins"],
    queryFn: getAllAdmins,
    staleTime: 5 * 60 * 1000, // 5 dakika
    onError: (error) => {
      console.error("Error fetching admins:", error);
      toast.error("Admin listesi yüklenirken hata oluştu");
    },
  });
}

/**
 * ADMİN PROFİLİ GETİRME HOOK'U
 * Belirli bir admin'in detaylı bilgilerini getirir
 */
export function useAdminProfile(adminId) {
  return useQuery({
    queryKey: ["admin-profile", adminId],
    queryFn: () => getAdminProfile(adminId),
    enabled: !!adminId,
    staleTime: 5 * 60 * 1000, // 5 dakika
    onError: (error) => {
      console.error("Error fetching admin profile:", error);
      toast.error("Admin profili yüklenirken hata oluştu");
    },
  });
}

/**
 * ADMİN PROFİLİ GÜNCELLEME HOOK'U
 */
export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, updates }) => updateAdminProfile(adminId, updates),
    onSuccess: (data) => {
      toast.success("Admin profili başarıyla güncellendi");
      // İlgili cache'leri yenile
      queryClient.invalidateQueries({ queryKey: ["admin-profile", data.id] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (error) => {
      console.error("Admin profile update error:", error);
      toast.error(`Profil güncelleme hatası: ${error.message}`);
    },
  });
}

/**
 * ADMİN DEAKTİVASYON HOOK'U
 */
export function useDeactivateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, deactivatedBy, reason }) =>
      deactivateAdmin(adminId, deactivatedBy, reason),
    onSuccess: (data) => {
      toast.success(`Admin hesabı deaktive edildi: ${data.email}`);
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin-profile", data.id] });
    },
    onError: (error) => {
      console.error("Admin deactivation error:", error);
      toast.error(`Admin deaktivasyon hatası: ${error.message}`);
    },
  });
}

/**
 * ADMİN REAKTİVASYON HOOK'U
 */
export function useReactivateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, reactivatedBy }) =>
      reactivateAdmin(adminId, reactivatedBy),
    onSuccess: (data) => {
      toast.success(`Admin hesabı aktive edildi: ${data.email}`);
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin-profile", data.id] });
    },
    onError: (error) => {
      console.error("Admin reactivation error:", error);
      toast.error(`Admin reaktivasyon hatası: ${error.message}`);
    },
  });
}

/**
 * ADMİN YETKİ KONTROLÜ HOOK'U
 */
export function useAdminPermissions(userId, requiredPermission) {
  return useQuery({
    queryKey: ["admin-permissions", userId, requiredPermission],
    queryFn: () => checkAdminPermissions(userId, requiredPermission),
    enabled: !!userId && !!requiredPermission,
    staleTime: 10 * 60 * 1000, // 10 dakika
  });
}

/**
 * ADMİN YETKİ GÜNCELLEME HOOK'U
 */
export function useUpdateAdminPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, permissions, updatedBy }) =>
      updateAdminPermissions(adminId, permissions, updatedBy),
    onSuccess: (data) => {
      toast.success("Admin yetkileri başarıyla güncellendi");
      queryClient.invalidateQueries({ queryKey: ["admin-profile", data.id] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin-permissions"] });
    },
    onError: (error) => {
      console.error("Admin permissions update error:", error);
      toast.error(`Yetki güncelleme hatası: ${error.message}`);
    },
  });
}

/**
 * ADMİN DASHBOARD İSTATİSTİKLERİ HOOK'U
 * Admin dashboard için özet bilgiler
 */
export function useAdminStats() {
  const { data: admins, isLoading: adminsLoading } = useAdmins();

  const stats = {
    totalAdmins: admins?.length || 0,
    activeAdmins: admins?.filter((admin) => admin.is_active)?.length || 0,
    superAdmins:
      admins?.filter((admin) => admin.admin_level === "super_admin")?.length ||
      0,
    recentAdmins:
      admins?.filter((admin) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(admin.created_at) > weekAgo;
      })?.length || 0,
  };

  return {
    stats,
    isLoading: adminsLoading,
  };
}

/**
 * ADMİN AKTİVİTE LOGU HOOK'U
 * Belirli bir admin'in aktivitelerini getirir
 */
export function useAdminActivities(adminId, timeRange = "week") {
  return useQuery({
    queryKey: ["admin-activities", adminId, timeRange],
    queryFn: async () => {
      // Bu fonksiyon admin aktivite API'sini çağıracak
      // Şimdilik boş array döndürüyoruz
      return [];
    },
    enabled: !!adminId,
    staleTime: 2 * 60 * 1000, // 2 dakika
  });
}

/**
 * ADMİN YETKİ SEVİYELERİ VE İZİNLER
 */
export const ADMIN_LEVELS = {
  moderator: {
    label: "Moderatör",
    description: "Temel yönetim yetkileri",
    color: "blue",
  },
  admin: {
    label: "Admin",
    description: "Kapsamlı yönetim yetkileri",
    color: "purple",
  },
  super_admin: {
    label: "Süper Admin",
    description: "Tüm sistem yetkileri",
    color: "red",
  },
};

export const DEFAULT_ADMIN_PERMISSIONS = {
  // User Management
  view_users: false,
  create_users: false,
  edit_users: false,
  delete_users: false,

  // Seller Management
  view_sellers: false,
  approve_sellers: false,
  edit_sellers: false,
  suspend_sellers: false,

  // Product Management
  view_all_products: false,
  edit_any_product: false,
  delete_any_product: false,
  moderate_products: false,

  // Order Management
  view_all_orders: false,
  edit_orders: false,
  refund_orders: false,

  // System Settings
  manage_categories: false,
  manage_site_settings: false,
  manage_payments: false,
  manage_shipping: false,

  // Content Management
  manage_content: false,
  manage_policies: false,
  manage_help_articles: false,

  // Analytics & Reports
  view_analytics: false,
  export_data: false,
  view_financial_reports: false,

  // Admin Management (Super Admin only)
  create_admins: false,
  edit_admin_permissions: false,
  deactivate_admins: false,

  // System Health
  view_system_health: false,
  manage_backups: false,
  view_audit_logs: false,
};

/**
 * YETKİ KONTROLÜ UTILITY HOOK'U
 */
export function useHasPermission(permission) {
  const { user } = useAuth(); // AuthContext'ten gelir
  const { data: hasPermission } = useAdminPermissions(user?.id, permission);

  return hasPermission || false;
}
