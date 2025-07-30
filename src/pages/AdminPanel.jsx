import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  ChartBarIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  TagIcon,
  MegaphoneIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

// Admin Components
import AdminDataTable from "../components/admin/AdminDataTable";
import AdminStatsCard from "../components/admin/AdminStatsCard";

// Admin Hooks
import {
  useAdminStats,
  useAdminUsers,
  useAdminProducts,
  useAdminSellers,
  useAdminOrders,
  useAdminReviews,
  useAdminUpdateUser,
  useAdminUpdateProduct,
  useAdminUpdateSeller,
  useAdminUpdateOrder,
  useAdminModerateReview,
} from "../hooks/useAdminData";

// Placeholder Components
import AdminFeaturePlaceholder from "./admin/AdminFeaturePlaceholder";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Data fetching
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: products, isLoading: productsLoading } = useAdminProducts();
  const { data: sellers, isLoading: sellersLoading } = useAdminSellers();
  const { data: orders, isLoading: ordersLoading } = useAdminOrders();
  const { data: reviews, isLoading: reviewsLoading } = useAdminReviews();

  // Mutations
  const updateUser = useAdminUpdateUser();
  const updateProduct = useAdminUpdateProduct();
  const updateSeller = useAdminUpdateSeller();
  const updateOrder = useAdminUpdateOrder();
  const moderateReview = useAdminModerateReview();

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: ChartBarIcon },
    { id: "users", label: "Kullanıcılar", icon: UserGroupIcon },
    { id: "products", label: "Ürünler", icon: ShoppingBagIcon },
    { id: "sellers", label: "Satıcılar", icon: BuildingStorefrontIcon },
    { id: "orders", label: "Siparişler", icon: ClipboardDocumentListIcon },
    { id: "reviews", label: "Yorumlar", icon: ChatBubbleLeftRightIcon },
    {
      id: "notifications",
      label: "Bildirimler",
      icon: BellIcon,
      placeholder: true,
    },
    { id: "coupons", label: "Kuponlar", icon: TagIcon, placeholder: true },
    {
      id: "campaigns",
      label: "Kampanyalar",
      icon: MegaphoneIcon,
      placeholder: true,
    },
    {
      id: "analytics",
      label: "Analitik",
      icon: ChartBarIcon,
      placeholder: true,
    },
    { id: "settings", label: "Ayarlar", icon: CogIcon, placeholder: true },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          title="Toplam Kullanıcı"
          value={stats?.usersCount || 0}
          icon={UserGroupIcon}
          color="blue"
          loading={statsLoading}
        />
        <AdminStatsCard
          title="Toplam Ürün"
          value={stats?.productsCount || 0}
          icon={ShoppingBagIcon}
          color="green"
          loading={statsLoading}
        />
        <AdminStatsCard
          title="Toplam Satıcı"
          value={stats?.sellersCount || 0}
          icon={BuildingStorefrontIcon}
          color="purple"
          loading={statsLoading}
        />
        <AdminStatsCard
          title="Toplam Sipariş"
          value={stats?.ordersCount || 0}
          icon={ClipboardDocumentListIcon}
          color="yellow"
          loading={statsLoading}
        />
            </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Son Aktiviteler
            </h3>
            <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Yeni kullanıcı kaydı</p>
              <p className="text-sm text-gray-500">2 saat önce</p>
              </div>
            <UserGroupIcon className="h-5 w-5 text-blue-500" />
            </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Yeni ürün eklendi</p>
              <p className="text-sm text-gray-500">4 saat önce</p>
            </div>
            <ShoppingBagIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Yeni sipariş alındı</p>
              <p className="text-sm text-gray-500">6 saat önce</p>
            </div>
            <ClipboardDocumentListIcon className="h-5 w-5 text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <AdminDataTable
      data={users || []}
      loading={usersLoading}
      columns={[
        { key: "full_name", label: "Ad Soyad" },
        {
          key: "email",
          label: "E-posta",
          accessor: (user) => user.user?.email,
        },
        {
          key: "created_at",
          label: "Kayıt Tarihi",
          render: (value) => new Date(value).toLocaleDateString("tr-TR"),
        },
        { key: "role", label: "Rol" },
      ]}
      onEdit={(user) => {
        // Handle user edit
        console.log("Edit user:", user);
      }}
      onView={(user) => {
        // Handle user view
        console.log("View user:", user);
      }}
    />
  );

  const renderProducts = () => (
    <AdminDataTable
      data={products || []}
      loading={productsLoading}
      columns={[
        { key: "name", label: "Ürün Adı" },
        { key: "price", label: "Fiyat", render: (value) => `₺${value}` },
        {
          key: "seller",
          label: "Satıcı",
          accessor: (product) => product.seller?.business_name,
        },
        { key: "status", label: "Durum" },
        {
          key: "created_at",
          label: "Eklenme Tarihi",
          render: (value) => new Date(value).toLocaleDateString("tr-TR"),
        },
      ]}
      onEdit={(product) => {
        // Handle product edit
        console.log("Edit product:", product);
      }}
      onView={(product) => {
        // Handle product view
        console.log("View product:", product);
      }}
    />
  );

  const renderSellers = () => (
    <AdminDataTable
      data={sellers || []}
      loading={sellersLoading}
      columns={[
        { key: "business_name", label: "İşletme Adı" },
        {
          key: "user",
          label: "Kullanıcı",
          accessor: (seller) => seller.user?.full_name,
        },
        { key: "status", label: "Durum" },
        {
          key: "created_at",
          label: "Kayıt Tarihi",
          render: (value) => new Date(value).toLocaleDateString("tr-TR"),
        },
      ]}
      onEdit={(seller) => {
        // Handle seller edit
        console.log("Edit seller:", seller);
      }}
      onView={(seller) => {
        // Handle seller view
        console.log("View seller:", seller);
      }}
    />
  );

  const renderOrders = () => (
    <AdminDataTable
      data={orders || []}
      loading={ordersLoading}
      columns={[
        { key: "order_number", label: "Sipariş No" },
        {
          key: "user",
          label: "Müşteri",
          accessor: (order) => order.user?.full_name,
        },
        {
          key: "total_amount",
          label: "Toplam",
          render: (value) => `₺${value}`,
        },
        { key: "status", label: "Durum" },
        {
          key: "created_at",
          label: "Tarih",
          render: (value) => new Date(value).toLocaleDateString("tr-TR"),
        },
      ]}
      onEdit={(order) => {
        // Handle order edit
        console.log("Edit order:", order);
      }}
      onView={(order) => {
        // Handle order view
        console.log("View order:", order);
      }}
    />
  );

  const renderReviews = () => (
    <AdminDataTable
      data={reviews || []}
      loading={reviewsLoading}
      columns={[
        {
          key: "user",
          label: "Kullanıcı",
          accessor: (review) => review.user?.full_name,
        },
        {
          key: "product",
          label: "Ürün",
          accessor: (review) => review.product?.name,
        },
        { key: "rating", label: "Puan", render: (value) => `${value}/5` },
        {
          key: "is_approved",
          label: "Durum",
          render: (value) => (value ? "Onaylı" : "Beklemede"),
        },
        {
          key: "created_at",
          label: "Tarih",
          render: (value) => new Date(value).toLocaleDateString("tr-TR"),
        },
      ]}
      onEdit={(review) => {
        // Handle review edit
        console.log("Edit review:", review);
      }}
      onView={(review) => {
        // Handle review view
        console.log("View review:", review);
      }}
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "users":
        return renderUsers();
      case "products":
        return renderProducts();
      case "sellers":
        return renderSellers();
      case "orders":
        return renderOrders();
      case "reviews":
        return renderReviews();
      default:
  return (
          <AdminFeaturePlaceholder
            title={tabs.find((tab) => tab.id === activeTab)?.label}
          />
        );
    }
  };

  if (loading) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Paneli</h1>
          <p className="mt-2 text-gray-600">
            Sitenin genel yönetimi ve kontrolü
          </p>
      </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm border p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <li key={tab.id}>
              <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {tab.label}
              </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            </div>

          {/* Main Content */}
          <div className="flex-1">{renderContent()}</div>
              </div>
              </div>
    </div>
  );
}
