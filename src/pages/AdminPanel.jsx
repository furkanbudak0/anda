import { useNavigate } from "react-router-dom";
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
import NavBar from "../components/NavBar";
import Spinner from "../components/Spinner";
import {
  useAlgorithmBoost,
  useAlgorithmAnalytics,
} from "../hooks/useAnalytics";
import { formatPrice, formatDate } from "../utils/formatters";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTimeRange, setSelectedTimeRange] = useState("week");
  const [quickActionLoading, setQuickActionLoading] = useState(false);

  // Algorithm boost hooks
  const { boostProduct, boostSeller } = useAlgorithmBoost();
  const { data: algorithmAnalytics } = useAlgorithmAnalytics();

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
          user:profiles(full_name, email),
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
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          suspension:user_suspensions(
            id,
            reason,
            end_date,
            is_active
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  // Seller Management
  const { data: sellers = [] } = useQuery({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select(
          `
          *,
          user:profiles(full_name, email),
          products_count:products(count),
          total_orders:orders(count),
          algorithm_score:seller_algorithm_scores(total_score, admin_boost)
        `
        )
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
          user:users(full_name)
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
    { id: "algorithm", name: "Algoritma", icon: ArrowTrendingUpIcon },
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
      <NavBar />

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
                algorithmAnalytics={algorithmAnalytics}
              />
            )}

            {activeTab === "users" && <UsersTab users={users} />}

            {activeTab === "sellers" && (
              <SellersTab sellers={sellers} boostSeller={boostSeller} />
            )}

            {activeTab === "campaigns" && (
              <CampaignsTab campaigns={campaigns} />
            )}

            {activeTab === "algorithm" && (
              <AlgorithmTab
                analytics={algorithmAnalytics}
                boostProduct={boostProduct}
                boostSeller={boostSeller}
              />
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
function DashboardTab({
  stats,
  loading,
  recentActivities,
  algorithmAnalytics,
}) {
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
function UsersTab({ users }) {
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

// Continue with other tab components...
