/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChartBarIcon,
  CubeIcon,
  ShoppingBagIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { formatPrice, formatNumber } from "../utils/formatters";
import StatsCard from "../components/StatsCard";
import SellerBulkImportPanel from "../components/seller/SellerBulkImportPanel";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import { useUpdateProduct, useDeleteProduct } from "../hooks/useProducts";

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch seller data
  const { data: sellerStats, isLoading } = useQuery({
    queryKey: ["seller-stats"],
    queryFn: () => fetch("/api/seller/stats").then((res) => res.json()),
  });

  const { user } = useAuth();
  // Tüm ürünler (aktif/pasif) gelsin
  const { data: products } = useQuery({
    queryKey: ["seller-products-panel", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: orders } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: () => fetch("/api/seller/orders").then((res) => res.json()),
  });

  // Tekrarsız tablar
  const tabs = [
    { id: "overview", name: "Genel Bakış", icon: ChartBarIcon },
    { id: "products", name: "Ürünlerim", icon: CubeIcon },
    { id: "bulk-import", name: "Toplu İçe Aktarma", icon: DocumentArrowUpIcon },
    { id: "orders", name: "Siparişler", icon: ShoppingBagIcon },
    { id: "analytics", name: "Analitik", icon: ChartBarIcon },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <nav className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors font-medium text-base
                  ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Satıcı Paneli
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Mağazanızı yönetin ve satışlarınızı takip edin
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link
              to="/seller/inventory"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <svg
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v4a1 1 0 001 1h3m10-5v4a1 1 0 01-1 1h-3m-4 0v4a1 1 0 001 1h3m10-5v4a1 1 0 01-1 1h-3"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Stok Yönetimi
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stokları takip edin ve güncelleyin
                  </p>
                </div>
              </div>
            </Link>
            <Link
              to="/seller/order-management"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Sipariş Yönetimi
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Siparişleri yönetin ve kargo güncelleyin
                  </p>
                </div>
              </div>
            </Link>
            <Link
              to="/seller/analytics"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <svg
                    className="h-6 w-6 text-purple-600 dark:text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 17a4 4 0 01-4-4V7a4 4 0 018 0v6a4 4 0 01-4 4z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Satış Analitiği
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Detaylı satış raporları görüntüleyin
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && <OverviewTab stats={sellerStats} />}
          {activeTab === "products" && <ProductsTab />}
          {activeTab === "bulk-import" && <SellerBulkImportPanel />}
          {activeTab === "orders" && <OrdersTab orders={orders} />}
          {activeTab === "analytics" && <AnalyticsTab stats={sellerStats} />}
        </main>
      </div>
    </div>
  );
}

function OverviewTab({ stats }) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Toplam Gelir"
          value={formatPrice(stats?.total_revenue || 0)}
          icon={null}
          change="+12%"
          changeType="positive"
        />
        <StatsCard
          title="Toplam Sipariş"
          value={formatNumber(stats?.total_orders || 0)}
          icon={null}
          change="+8%"
          changeType="positive"
        />
        <StatsCard
          title="Aktif Ürün"
          value={formatNumber(stats?.active_products || 0)}
          icon={null}
          change="+2"
          changeType="positive"
        />
        <StatsCard
          title="Müşteri Sayısı"
          value={formatNumber(stats?.unique_customers || 0)}
          icon={null}
          change="+15%"
          changeType="positive"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Son Aktiviteler
        </h3>
        <div className="space-y-3">
          {stats?.recent_activities?.map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500">{activity.description}</p>
              </div>
              <span className="text-sm text-gray-500">
                {/* Assuming activity.created_at is available */}
                {/* {formatDate(activity.created_at, { relative: true })} */}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsTab() {
  const { user } = useAuth();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // ProductCard ile aynı mantıkta fetch
  const { data: products, isLoading } = useQuery({
    queryKey: ["seller-products-panel", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleToggleActive = (product) => {
    updateProduct.mutate({
      productId: product.uuid,
      updates: { is_active: !product.is_active },
    });
  };

  const handleDelete = (product) => {
    if (window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
      deleteProduct.mutate(product.uuid);
    }
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Ürünlerim</h2>
        <Link
          to="/seller/products/new"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Yeni Ürün Ekle
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ürün
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fiyat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stok
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Listelenme Tarihi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products?.map((product) => (
              <tr
                key={product.uuid}
                className={!product.is_active ? "opacity-60" : ""}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={product.images?.[0] || "/placeholder-product.jpg"}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.created_at
                    ? new Date(product.created_at).toLocaleDateString("tr-TR")
                    : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-900"
                    onClick={() => handleToggleActive(product)}
                  >
                    {product.is_active ? "Deaktif Et" : "Aktif Et"}
                  </button>
                  <Link
                    to={`/seller/products/edit/${product.uuid}`}
                    className="text-purple-600 hover:text-purple-900"
                  >
                    Düzenle
                  </Link>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDelete(product)}
                  >
                    Kaldır
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersTab({ orders }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Siparişler</h2>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sipariş No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Müşteri
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tutar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tarih
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders?.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.order_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.customer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(order.total_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {/* Assuming order.created_at is available */}
                  {/* {formatDate(order.created_at)} */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsTab({ stats }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Satış Analitiği</h2>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Bu Ay</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Toplam Satış</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatPrice(stats?.monthly_sales || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sipariş Sayısı</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatNumber(stats?.monthly_orders || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
