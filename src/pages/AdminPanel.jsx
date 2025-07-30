import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import {
  DocumentTextIcon,
  CogIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  GiftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  EyeIcon,
  NoSymbolIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
// NavBar kaldırıldı - Layout component'inde yönetiliyor
import Spinner from "../components/Spinner";

import { formatPrice, formatDate } from "../utils/formatters";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
// SellerAnalytics import removed - component doesn't exist

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTimeRange, setSelectedTimeRange] = useState("week");
  const [quickActionLoading, setQuickActionLoading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Dashboard Statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats", selectedTimeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats", {
        time_range: selectedTimeRange,
      });

      if (error) throw error;
      return data || {};
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Recent Activities
  const { data: recentActivities = [] } = useQuery({
    queryKey: ["admin-recent-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_activities")
        .select(
          `
          *,
          user:users(full_name, email),
          seller:sellers(business_name)
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  // Campaigns Management
  const { data: campaigns = [] } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // User Management
  const { data: users, error: usersError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "*, suspension:user_suspensions(is_active, reason, suspension_type, end_date)"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Admin Management
  const { data: admins, error: adminsError } = useQuery({
    queryKey: ["admin-admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "*, suspension:user_suspensions(is_active, reason, suspension_type, end_date)"
        )
        .eq("role", "admin")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Seller Management
  const { data: sellers, error: sellersError } = useQuery({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select("*, user:profiles(full_name, email, role)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Site Settings
  const { data: siteSettings } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || {};
    },
  });

  // Pending Reviews/Reports
  const { data: pendingReviews = [] } = useQuery({
    queryKey: ["admin-pending-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          product:products(name, slug),
          user:profiles(full_name)
        `
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Navigation tabs
  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: ChartBarIcon },
    { id: "users", name: "Kullanıcılar", icon: UserGroupIcon },
    { id: "sellers", name: "Satıcılar", icon: BuildingStorefrontIcon },
    { id: "campaigns", name: "Kampanyalar", icon: GiftIcon },

    { id: "content", name: "İçerik", icon: DocumentTextIcon },
    { id: "messages", name: "Mesajlar", icon: SpeakerWaveIcon },
    { id: "settings", name: "Ayarlar", icon: CogIcon },
  ];

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Admin Panel
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                ANDA platformunun tüm yönetim işlemlerini buradan
                gerçekleştirebilirsiniz.
              </p>
            </div>
            <div className="hidden md:flex gap-3">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="day">Bugün</option>
                <option value="week">Bu Hafta</option>
                <option value="month">Bu Ay</option>
                <option value="year">Bu Yıl</option>
              </select>

              <button
                onClick={() => navigate("/admin/campaigns/new")}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 inline mr-2" />
                Yeni Kampanya
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-4">
            <div className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-brand-500 text-brand-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            {activeTab === "dashboard" && (
              <DashboardTab
                stats={dashboardStats}
                loading={statsLoading}
                recentActivities={recentActivities}
              />
            )}

            {activeTab === "users" && <UsersTab users={users} user={user} />}

            {activeTab === "sellers" && <SellersTab sellers={sellers} />}

            {activeTab === "campaigns" && (
              <CampaignsTab campaigns={campaigns} />
            )}

            {activeTab === "content" && (
              <ContentTab pendingReviews={pendingReviews} />
            )}

            {activeTab === "messages" && <MessagesTab />}

            {activeTab === "settings" && (
              <SettingsTab siteSettings={siteSettings} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({ stats, loading, recentActivities }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Toplam Kullanıcı",
      value: stats?.total_users || 0,
      change: stats?.users_change || 0,
      icon: UserGroupIcon,
      color: "blue",
    },
    {
      title: "Aktif Satıcı",
      value: stats?.active_sellers || 0,
      change: stats?.sellers_change || 0,
      icon: BuildingStorefrontIcon,
      color: "green",
    },
    {
      title: "Toplam Ürün",
      value: stats?.total_products || 0,
      change: stats?.products_change || 0,
      icon: ShoppingBagIcon,
      color: "purple",
    },
    {
      title: "Aylık Ciro",
      value: formatPrice(stats?.monthly_revenue || 0),
      change: stats?.revenue_change || 0,
      icon: CurrencyDollarIcon,
      color: "orange",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>

            <div className="flex items-center mt-4">
              {stat.change >= 0 ? (
                <ArrowUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm ml-1 ${
                  stat.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {Math.abs(stat.change)}%
              </span>
              <span className="text-sm text-gray-600 ml-1">
                geçen döneme göre
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Son Aktiviteler
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Algorithm Performance */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Algoritma Performansı
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Ürün Ortalama</span>
              <span className="font-medium">
                {algorithmAnalytics?.avg_product_score?.toFixed(1) || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Satıcı Ortalama</span>
              <span className="font-medium">
                {algorithmAnalytics?.avg_seller_score?.toFixed(1) || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Verimlilik</span>
              <span className="font-medium text-green-600">
                {algorithmAnalytics?.algorithm_efficiency?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sistem Durumu</p>
              <div className="flex items-center mt-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="ml-2 text-sm font-medium text-green-600">
                  Çevrimiçi
                </span>
              </div>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bekleyen İncelemeler</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.pending_reviews || 0}
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bildirilen İçerik</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.reported_content || 0}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Users Tab Component
function UsersTab({ users, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionType, setSuspensionType] = useState("temporary");
  const [suspensionEndDate, setSuspensionEndDate] = useState("");

  const queryClient = useQueryClient();

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "suspended" && user.suspension?.is_active) ||
      (statusFilter === "active" && !user.suspension?.is_active);

    return matchesSearch && matchesStatus;
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, reason, type, endDate }) => {
      const { data, error } = await supabase.from("user_suspensions").insert({
        user_id: userId,
        suspended_by: user.id,
        reason,
        suspension_type: type,
        end_date: endDate || null,
        is_active: true,
      });

      if (error) throw error;

      // Log admin activity
      await supabase.rpc("log_admin_activity", {
        p_admin_id: user.id,
        p_action_type: "suspend_user",
        p_target_type: "user",
        p_target_id: userId,
        p_description: `Kullanıcı askıya alındı: ${reason}`,
        p_metadata: { suspension_type: type, end_date: endDate },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Kullanıcı başarıyla askıya alındı!");
      setIsSuspendModalOpen(false);
      setSuspensionReason("");
      setSuspensionType("temporary");
      setSuspensionEndDate("");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Unsuspend user mutation
  const unsuspendUserMutation = useMutation({
    mutationFn: async (userId) => {
      const { error } = await supabase
        .from("user_suspensions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc("log_admin_activity", {
        p_admin_id: user.id,
        p_action_type: "unsuspend_user",
        p_target_type: "user",
        p_target_id: userId,
        p_description: "Kullanıcı askıdan çıkarıldı",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Kullanıcı başarıyla askıdan çıkarıldı!");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleSuspendUser = (selectedUser) => {
    setSelectedUser(selectedUser);
    setIsSuspendModalOpen(true);
  };

  const handleConfirmSuspension = () => {
    if (!suspensionReason.trim()) {
      toast.error("Askıya alma sebebi zorunludur!");
      return;
    }

    if (suspensionType === "temporary" && !suspensionEndDate) {
      toast.error("Geçici askıya alma için bitiş tarihi zorunludur!");
      return;
    }

    suspendUserMutation.mutate({
      userId: selectedUser.id,
      reason: suspensionReason,
      type: suspensionType,
      endDate: suspensionType === "temporary" ? suspensionEndDate : null,
    });
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="suspended">Askıya Alınmış</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Son Giriş
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.full_name?.charAt(0) || "?"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || "İsimsiz"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.suspension?.is_active
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.suspension?.is_active ? "Askıya Alınmış" : "Aktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.last_sign_in_at
                      ? formatDate(user.last_sign_in_at)
                      : "Hiç giriş yapmamış"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Görüntüle
                      </button>
                      {user.suspension?.is_active ? (
                        <button
                          onClick={() => unsuspendUserMutation.mutate(user.id)}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          Askıdan Çıkar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspendUser(user)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        >
                          <NoSymbolIcon className="w-4 h-4" />
                          Askıya Al
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Kullanıcı Detayları</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Ad Soyad</p>
                <p className="font-medium">
                  {selectedUser.full_name || "Belirtilmemiş"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kayıt Tarihi</p>
                <p className="font-medium">
                  {formatDate(selectedUser.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Son Giriş</p>
                <p className="font-medium">
                  {selectedUser.last_sign_in_at
                    ? formatDate(selectedUser.last_sign_in_at)
                    : "Hiç giriş yapmamış"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durum</p>
                <p className="font-medium">
                  {selectedUser.suspension?.is_active
                    ? "Askıya Alınmış"
                    : "Aktif"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rol</p>
                <p className="font-medium">{selectedUser.role || "user"}</p>
              </div>
            </div>

            {selectedUser.suspension?.is_active && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">
                  Askıya Alma Bilgileri
                </h4>
                <p className="text-sm text-red-700">
                  <strong>Sebep:</strong> {selectedUser.suspension.reason}
                </p>
                <p className="text-sm text-red-700">
                  <strong>Tür:</strong>{" "}
                  {selectedUser.suspension.suspension_type}
                </p>
                {selectedUser.suspension.end_date && (
                  <p className="text-sm text-red-700">
                    <strong>Bitiş Tarihi:</strong>{" "}
                    {formatDate(selectedUser.suspension.end_date)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      {isSuspendModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Kullanıcıyı Askıya Al</h3>
              <button
                onClick={() => setIsSuspendModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Askıya Alma Sebebi
                </label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  rows="3"
                  placeholder="Neden bu kullanıcıyı askıya alıyorsunuz?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Askıya Alma Türü
                </label>
                <select
                  value={suspensionType}
                  onChange={(e) => setSuspensionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="temporary">Geçici</option>
                  <option value="permanent">Kalıcı</option>
                  <option value="warning">Uyarı</option>
                </select>
              </div>

              {suspensionType === "temporary" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={suspensionEndDate}
                    onChange={(e) => setSuspensionEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsSuspendModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmSuspension}
                  disabled={suspendUserMutation.isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {suspendUserMutation.isLoading ? "İşleniyor..." : "Askıya Al"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sellers Tab Component
function SellersTab({ sellers }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [boostType, setBoostType] = useState("product");
  const [boostProductId, setBoostProductId] = useState("");
  const [boostSellerId, setBoostSellerId] = useState("");
  const [boostDuration, setBoostDuration] = useState("week");
  const [boostPrice, setBoostPrice] = useState("");
  const [boostReason, setBoostReason] = useState("");

  const queryClient = useQueryClient();

  const filteredSellers = sellers.filter((seller) => {
    if (!searchTerm) return true;
    return (
      (seller.business_name &&
        seller.business_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (seller.user?.full_name &&
        seller.user.full_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (seller.user?.email &&
        seller.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const sortedSellers = [...filteredSellers].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue < bValue) {
      return sortOrder === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Boost seller mutation
  const boostSellerMutation = useMutation({
    mutationFn: async ({ sellerId, type, duration, price, reason }) => {
      const { data, error } = await supabase.rpc("boost_seller", {
        p_seller_id: sellerId,
        p_boost_type: type,
        p_boost_duration: duration,
        p_boost_price: price,
        p_boost_reason: reason,
      });

      if (error) throw error;

      // Log admin activity
      await supabase.rpc("log_admin_activity", {
        p_admin_id: user.id,
        p_action_type: "boost_seller",
        p_target_type: "seller",
        p_target_id: sellerId,
        p_description: `Satıcıya ${type} yapıldı: ${reason}`,
        p_metadata: { boost_type: type, boost_duration: duration },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-sellers"]);
      toast.success("Satıcı başarıyla yükseltildi!");
      setIsBoostModalOpen(false);
      setBoostType("product");
      setBoostProductId("");
      setBoostSellerId("");
      setBoostDuration("week");
      setBoostPrice("");
      setBoostReason("");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleBoostSeller = (seller) => {
    setSelectedSeller(seller);
    setIsBoostModalOpen(true);
  };

  const handleConfirmBoost = () => {
    if (!boostReason.trim()) {
      toast.error("Yükseltme sebebi zorunludur!");
      return;
    }

    boostSellerMutation.mutate({
      sellerId: selectedSeller.id,
      type: boostType,
      duration: boostDuration,
      price: boostPrice,
      reason: boostReason,
    });
  };

  const handleViewSeller = (seller) => {
    setSelectedSeller(seller);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Satıcı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="created_at">Kayıt Tarihi</option>
            <option value="business_name">İş Adı</option>
            <option value="total_orders">Toplam Sipariş</option>
            <option value="algorithm_score">Algoritma Puanı</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="desc">Azalan</option>
            <option value="asc">Artan</option>
          </select>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürünler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Siparişler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puan
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {seller.business_name?.charAt(0) || "?"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {seller.business_name || "İsimsiz Satıcı"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {seller.user?.full_name || seller.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {seller.user?.full_name || "Belirtilmemiş"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {seller.products_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {seller.total_orders || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {seller.algorithm_score?.total_score?.toFixed(1) || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleViewSeller(seller)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Detaylar
                      </button>
                      <button
                        onClick={() => handleBoostSeller(seller)}
                        className="text-green-600 hover:text-green-900 flex items-center gap-1"
                      >
                        <ArrowTrendingUpIcon className="w-4 h-4" />
                        Yükselt
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seller Detail Modal */}
      {isDetailModalOpen && selectedSeller && (
        <SellerDetailModal
          seller={selectedSeller}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}

      {/* Boost Seller Modal */}
      {isBoostModalOpen && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Satıcıyı Yükselt</h3>
              <button
                onClick={() => setIsBoostModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yükseltme Türü
                </label>
                <select
                  value={boostType}
                  onChange={(e) => setBoostType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="product">Ürün</option>
                  <option value="seller">Satıcı</option>
                </select>
              </div>

              {boostType === "product" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yükseltilecek Ürün
                  </label>
                  <select
                    value={boostProductId}
                    onChange={(e) => setBoostProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="">Ürün Seçin</option>
                    {sellers
                      .find((s) => s.id === selectedSeller.id)
                      ?.products_count?.map((product) => (
                        <option key={product.uuid} value={product.uuid}>
                          {product.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {boostType === "seller" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yükseltilecek Satıcı
                  </label>
                  <select
                    value={boostSellerId}
                    onChange={(e) => setBoostSellerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="">Satıcı Seçin</option>
                    {sellers
                      .find((s) => s.id === selectedSeller.id)
                      ?.products_count?.map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {seller.business_name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yükseltme Süresi
                </label>
                <select
                  value={boostDuration}
                  onChange={(e) => setBoostDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="week">1 Hafta</option>
                  <option value="month">1 Ay</option>
                  <option value="year">1 Yıl</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yükseltme Fiyatı (TL)
                </label>
                <input
                  type="number"
                  value={boostPrice}
                  onChange={(e) => setBoostPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Yükseltme fiyatı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yükseltme Sebebi
                </label>
                <textarea
                  value={boostReason}
                  onChange={(e) => setBoostReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  rows="3"
                  placeholder="Satıcıyı yükseltme sebebi"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsBoostModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmBoost}
                  disabled={boostSellerMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {boostSellerMutation.isLoading ? "İşleniyor..." : "Yükselt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Satıcı detayına tıklanınca açılacak modal veya sayfa
function SellerDetailModal({ seller, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
        >
          Kapat
        </button>
        <h2 className="text-2xl font-bold mb-4">
          {seller.business_name} - Ürün Analitiği
        </h2>
        <SellerAnalytics sellerId={seller.id} />
      </div>
    </div>
  );
}

// Campaigns Tab Component
function CampaignsTab({ campaigns }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignStartDate, setCampaignStartDate] = useState("");
  const [campaignEndDate, setCampaignEndDate] = useState("");
  const [campaignBudget, setCampaignBudget] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("active");

  const queryClient = useQueryClient();

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue < bValue) {
      return sortOrder === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async ({ name, startDate, endDate, budget, status }) => {
      const { data, error } = await supabase.rpc("create_admin_campaign", {
        p_name: name,
        p_start_date: startDate,
        p_end_date: endDate,
        p_budget: budget,
        p_status: status,
      });

      if (error) throw error;

      // Log admin activity
      await supabase.rpc("log_admin_activity", {
        p_admin_id: user.id,
        p_action_type: "create_campaign",
        p_target_type: "campaign",
        p_target_id: data.id,
        p_description: `Kampanya oluşturuldu: ${name}`,
        p_metadata: {
          start_date: startDate,
          end_date: endDate,
          budget: budget,
          status: status,
        },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-campaigns"]);
      toast.success("Kampanya başarıyla oluşturuldu!");
      setIsNewCampaignModalOpen(false);
      setCampaignName("");
      setCampaignStartDate("");
      setCampaignEndDate("");
      setCampaignBudget("");
      setCampaignStatus("active");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId) => {
      const { error } = await supabase
        .from("admin_campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc("log_admin_activity", {
        p_admin_id: user.id,
        p_action_type: "delete_campaign",
        p_target_type: "campaign",
        p_target_id: campaignId,
        p_description: "Kampanya silindi",
      });

      return campaignId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-campaigns"]);
      toast.success("Kampanya başarıyla silindi!");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleViewCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setIsDetailModalOpen(true);
  };

  const handleNewCampaign = () => {
    setIsNewCampaignModalOpen(true);
  };

  const handleConfirmNewCampaign = () => {
    if (!campaignName.trim()) {
      toast.error("Kampanya adı zorunludur!");
      return;
    }
    if (!campaignStartDate) {
      toast.error("Kampanya başlangıç tarihi zorunludur!");
      return;
    }
    if (!campaignEndDate) {
      toast.error("Kampanya bitiş tarihi zorunludur!");
      return;
    }
    if (!campaignBudget) {
      toast.error("Kampanya bütçesi zorunludur!");
      return;
    }

    createCampaignMutation.mutate({
      name: campaignName,
      startDate: campaignStartDate,
      endDate: campaignEndDate,
      budget: campaignBudget,
      status: campaignStatus,
    });
  };

  const handleDeleteCampaign = (campaignId) => {
    if (window.confirm("Bu kampanyayı silmek istediğinize emin misiniz?")) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Kampanya ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="created_at">Oluşturulma Tarihi</option>
            <option value="name">Ad</option>
            <option value="start_date">Başlangıç Tarihi</option>
            <option value="end_date">Bitiş Tarihi</option>
            <option value="budget">Bütçe</option>
            <option value="status">Durum</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="desc">Azalan</option>
            <option value="asc">Artan</option>
          </select>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kampanya
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Başlangıç Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bitiş Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bütçe (TL)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {campaign.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(campaign.start_date)} -{" "}
                      {formatDate(campaign.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(campaign.start_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(campaign.end_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(campaign.budget)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleViewCampaign(campaign)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Detaylar
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Campaign Modal */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Yeni Kampanya Oluştur</h3>
              <button
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kampanya Adı
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Kampanya adı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={campaignStartDate}
                  onChange={(e) => setCampaignStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={campaignEndDate}
                  onChange={(e) => setCampaignEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  min={
                    campaignStartDate || new Date().toISOString().split("T")[0]
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bütçe (TL)
                </label>
                <input
                  type="number"
                  value={campaignBudget}
                  onChange={(e) => setCampaignBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Kampanya bütçesi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kampanya Durumu
                </label>
                <select
                  value={campaignStatus}
                  onChange={(e) => setCampaignStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                  <option value="completed">Tamamlandı</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmNewCampaign}
                  disabled={createCampaignMutation.isLoading}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  {createCampaignMutation.isLoading
                    ? "İşleniyor..."
                    : "Oluştur"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {isDetailModalOpen && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Kampanya Detayları</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Ad</p>
                <p className="font-medium">{selectedCampaign.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Başlangıç Tarihi</p>
                <p className="font-medium">
                  {formatDate(selectedCampaign.start_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bitiş Tarihi</p>
                <p className="font-medium">
                  {formatDate(selectedCampaign.end_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bütçe (TL)</p>
                <p className="font-medium">
                  {formatPrice(selectedCampaign.budget)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durum</p>
                <p className="font-medium">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedCampaign.status === "active"
                        ? "bg-green-100 text-green-800"
                        : selectedCampaign.status === "inactive"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {selectedCampaign.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
                <p className="font-medium">
                  {formatDate(selectedCampaign.created_at)}
                </p>
              </div>
            </div>

            {/* Add more campaign details here if needed */}
          </div>
        </div>
      )}
    </div>
  );
}

// Content Tab Component
function ContentTab({ pendingReviews }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedReview, setSelectedReview] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("pending");
  const [reviewReason, setReviewReason] = useState("");

  const queryClient = useQueryClient();

  const filteredReviews = pendingReviews.filter((review) => {
    const matchesSearch =
      review.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue < bValue) {
      return sortOrder === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Approve review mutation
  const approveReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      const { error } = await supabase
        .from("reviews")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc("log_admin_activity", {
        p_admin_id: user.id,
        p_action_type: "approve_review",
        p_target_type: "review",
        p_target_id: reviewId,
        p_description: "İnceleme onaylandı",
      });

      return reviewId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-pending-reviews"]);
      toast.success("İnceleme başarıyla onaylandı!");
      setIsApproveModalOpen(false);
      setReviewStatus("pending");
      setReviewReason("");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Reject review mutation
  const rejectReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      const { error } = await supabase
        .from("reviews")
        .update({
          status: "rejected",
          rejected_by: user.id,
          rejected_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc("log_admin_activity", {
        p_admin_id: user.id,
        p_action_type: "reject_review",
        p_target_type: "review",
        p_target_id: reviewId,
        p_description: "İnceleme reddedildi",
      });

      return reviewId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-pending-reviews"]);
      toast.success("İnceleme başarıyla reddedildi!");
      setIsRejectModalOpen(false);
      setReviewStatus("pending");
      setReviewReason("");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleViewReview = (review) => {
    setSelectedReview(review);
    setIsDetailModalOpen(true);
  };

  const handleApproveReview = (reviewId) => {
    if (window.confirm("Bu incelemi onaylamak istediğinize emin misiniz?")) {
      approveReviewMutation.mutate(reviewId);
    }
  };

  const handleRejectReview = (reviewId) => {
    if (window.confirm("Bu incelemi reddetmek istediğinize emin misiniz?")) {
      rejectReviewMutation.mutate(reviewId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="İnceleme ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="created_at">Oluşturulma Tarihi</option>
            <option value="product_name">Ürün Adı</option>
            <option value="user_full_name">Kullanıcı Adı</option>
            <option value="status">Durum</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="desc">Azalan</option>
            <option value="asc">Artan</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İnceleme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedReviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {review.product?.name || "Bilinmiyor"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(review.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {review.product?.name || "Bilinmiyor"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {review.user?.full_name || review.user?.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        review.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : review.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleViewReview(review)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Detaylar
                      </button>
                      {review.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveReview(review.id)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Onayla
                          </button>
                          <button
                            onClick={() => handleRejectReview(review.id)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            Reddet
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Detail Modal */}
      {isDetailModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">İnceleme Detayları</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Ürün Adı</p>
                <p className="font-medium">
                  {selectedReview.product?.name || "Bilinmiyor"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kullanıcı Adı</p>
                <p className="font-medium">
                  {selectedReview.user?.full_name || selectedReview.user?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">İnceleme Tarihi</p>
                <p className="font-medium">
                  {formatDate(selectedReview.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durum</p>
                <p className="font-medium">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedReview.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedReview.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedReview.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">İnceleme Nedeni</p>
                <p className="font-medium">
                  {selectedReview.reason || "Belirtilmemiş"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Onaylayan</p>
                <p className="font-medium">
                  {selectedReview.approved_by_full_name ||
                    selectedReview.approved_by_email ||
                    "Bilinmiyor"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Onaylama Tarihi</p>
                <p className="font-medium">
                  {selectedReview.approved_at
                    ? formatDate(selectedReview.approved_at)
                    : "Onaylanmadı"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reddeden</p>
                <p className="font-medium">
                  {selectedReview.rejected_by_full_name ||
                    selectedReview.rejected_by_email ||
                    "Bilinmiyor"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reddetme Tarihi</p>
                <p className="font-medium">
                  {selectedReview.rejected_at
                    ? formatDate(selectedReview.rejected_at)
                    : "Reddedilmedi"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Review Modal */}
      {isApproveModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">İncelemeyi Onayla</h3>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Onaylama Nedeni
                </label>
                <textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  rows="3"
                  placeholder="İncelemeyi onaylama sebebi"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  İptal
                </button>
                <button
                  onClick={() =>
                    approveReviewMutation.mutate(selectedReview.id)
                  }
                  disabled={approveReviewMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {approveReviewMutation.isLoading ? "İşleniyor..." : "Onayla"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Review Modal */}
      {isRejectModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">İncelemeyi Reddet</h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reddetme Nedeni
                </label>
                <textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  rows="3"
                  placeholder="İncelemeyi reddetme sebebi"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  İptal
                </button>
                <button
                  onClick={() => rejectReviewMutation.mutate(selectedReview.id)}
                  disabled={rejectReviewMutation.isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {rejectReviewMutation.isLoading ? "İşleniyor..." : "Reddet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Messages Tab Component
function MessagesTab() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        setError(err);
        toast.error(`Mesajlar yüklenirken hata oluştu: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender_email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const sortedMessages = [...filteredMessages].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue < bValue) {
      return sortOrder === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Reply message mutation
  const replyMessageMutation = useMutation({
    mutationFn: async ({ messageId, reply }) => {
      const { data, error } = await supabase
        .from("messages")
        .update({ reply, replied_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc("log_admin_activity", {
        p_admin_id: user.id,
        p_action_type: "reply_message",
        p_target_type: "message",
        p_target_id: messageId,
        p_description: `Mesaj yanıtlandı: ${reply}`,
        p_metadata: { reply: reply },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["messages"]);
      toast.success("Mesaj başarıyla yanıtlandı!");
      setIsReplyModalOpen(false);
      setReplyMessage("");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setIsDetailModalOpen(true);
  };

  const handleReplyMessage = (messageId) => {
    setIsReplyModalOpen(true);
    // In a real app, you might pre-fill replyMessage with a template or previous replies
    // For now, it's empty
  };

  const handleConfirmReply = () => {
    if (!replyMessage.trim()) {
      toast.error("Yanıt mesajı zorunludur!");
      return;
    }
    replyMessageMutation.mutate({
      messageId: selectedMessage.id,
      reply: replyMessage,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Mesaj ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="created_at">Oluşturulma Tarihi</option>
            <option value="subject">Konu</option>
            <option value="sender_name">Gönderen Adı</option>
            <option value="status">Durum</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="desc">Azalan</option>
            <option value="asc">Artan</option>
          </select>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mesaj
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Konu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gönderen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Mesajlar yükleniyor...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-red-500"
                  >
                    {error.message}
                  </td>
                </tr>
              ) : sortedMessages.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Aradığınız kriterlere uygun mesaj bulunamadı.
                  </td>
                </tr>
              ) : (
                sortedMessages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.sender_name || message.sender_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          message.status === "unread"
                            ? "bg-blue-100 text-blue-800"
                            : message.status === "read"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {message.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewMessage(message)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Detaylar
                        </button>
                        {message.status === "unread" && (
                          <button
                            onClick={() => handleReplyMessage(message.id)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Yanıtla
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Detail Modal */}
      {isDetailModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Mesaj Detayları</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Konu</p>
                <p className="font-medium">{selectedMessage.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gönderen</p>
                <p className="font-medium">
                  {selectedMessage.sender_name || selectedMessage.sender_email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mesaj</p>
                <p className="font-medium">{selectedMessage.message}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durum</p>
                <p className="font-medium">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedMessage.status === "unread"
                        ? "bg-blue-100 text-blue-800"
                        : selectedMessage.status === "read"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedMessage.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gönderme Tarihi</p>
                <p className="font-medium">
                  {formatDate(selectedMessage.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Yanıt</p>
                <p className="font-medium">
                  {selectedMessage.reply || "Henüz yanıtlanmadı"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Yanıt Tarihi</p>
                <p className="font-medium">
                  {selectedMessage.replied_at
                    ? formatDate(selectedMessage.replied_at)
                    : "Henüz yanıtlanmadı"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Message Modal */}
      {isReplyModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Mesajı Yanıtla</h3>
              <button
                onClick={() => setIsReplyModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yanıt Mesajı
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  rows="5"
                  placeholder="Yanıt mesajınız"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsReplyModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmReply}
                  disabled={replyMessageMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {replyMessageMutation.isLoading ? "İşleniyor..." : "Yanıtla"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ siteSettings }) {
  const [settingName, setSettingName] = useState("");
  const [settingValue, setSettingValue] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);

  const queryClient = useQueryClient();

  const handleEditSetting = (setting) => {
    setSelectedSetting(setting);
    setSettingName(setting.name);
    setSettingValue(setting.value);
    setIsEditModalOpen(true);
  };

  const handleAddSetting = () => {
    setSelectedSetting(null);
    setSettingName("");
    setSettingValue("");
    setIsAddModalOpen(true);
  };

  const handleDeleteSetting = (setting) => {
    setSelectedSetting(setting);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!settingName.trim() || !settingValue.trim()) {
      toast.error("Ayar adı ve değeri zorunludur!");
      return;
    }

    const { error } = await supabase
      .from("site_settings")
      .update({ name: settingName, value: settingValue })
      .eq("id", selectedSetting.id);

    if (error) throw error;

    queryClient.invalidateQueries(["admin-site-settings"]);
    toast.success("Ayar başarıyla güncellendi!");
    setIsEditModalOpen(false);
  };

  const handleConfirmAdd = async () => {
    if (!settingName.trim() || !settingValue.trim()) {
      toast.error("Ayar adı ve değeri zorunludur!");
      return;
    }

    const { error } = await supabase
      .from("site_settings")
      .insert({ name: settingName, value: settingValue });

    if (error) throw error;

    queryClient.invalidateQueries(["admin-site-settings"]);
    toast.success("Ayar başarıyla eklendi!");
    setIsAddModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (window.confirm("Bu ayarı silmek istediğinize emin misiniz?")) {
      const { error } = await supabase
        .from("site_settings")
        .delete()
        .eq("id", selectedSetting.id);

      if (error) throw error;

      queryClient.invalidateQueries(["admin-site-settings"]);
      toast.success("Ayar başarıyla silindi!");
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Site Ayarları
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {siteSettings &&
            Object.entries(siteSettings).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700">{key}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
                <button
                  onClick={() => handleEditSetting({ name: key, value: value })}
                  className="mt-2 text-blue-600 hover:text-blue-900 text-sm"
                >
                  Düzenle
                </button>
                <button
                  onClick={() =>
                    handleDeleteSetting({ name: key, value: value })
                  }
                  className="mt-2 ml-2 text-red-600 hover:text-red-900 text-sm"
                >
                  Sil
                </button>
              </div>
            ))}
        </div>
        <button
          onClick={handleAddSetting}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          <PlusIcon className="w-4 h-4 inline mr-2" />
          Yeni Ayar Ekle
        </button>
      </div>

      {/* Edit Setting Modal */}
      {isEditModalOpen && selectedSetting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ayarı Düzenle</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ayar Adı
                </label>
                <input
                  type="text"
                  value={settingName}
                  onChange={(e) => setSettingName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Ayar adı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ayar Değeri
                </label>
                <input
                  type="text"
                  value={settingValue}
                  onChange={(e) => setSettingValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Ayar değeri"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmEdit}
                  disabled={
                    settingName.trim() === "" || settingValue.trim() === ""
                  }
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  {settingName.trim() === "" || settingValue.trim() === ""
                    ? "Ayar Adı ve Değeri Zorunlu"
                    : "Güncelle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Setting Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Yeni Ayar Ekle</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ayar Adı
                </label>
                <input
                  type="text"
                  value={settingName}
                  onChange={(e) => setSettingName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Ayar adı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ayar Değeri
                </label>
                <input
                  type="text"
                  value={settingValue}
                  onChange={(e) => setSettingValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Ayar değeri"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmAdd}
                  disabled={
                    settingName.trim() === "" || settingValue.trim() === ""
                  }
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  {settingName.trim() === "" || settingValue.trim() === ""
                    ? "Ayar Adı ve Değeri Zorunlu"
                    : "Ekle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Setting Modal */}
      {isDeleteModalOpen && selectedSetting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ayarı Sil</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm text-gray-700">
              "{selectedSetting.name}" adlı ayarı silmek istediğinize emin
              misiniz? Bu işlem geri alınamaz.
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
