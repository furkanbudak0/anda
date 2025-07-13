/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  CubeIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  TruckIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { formatPrice, formatNumber, formatDate } from "../utils/formatters";
import StatsCard from "../components/StatsCard";
import NavBar from "../components/NavBar";

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch seller data
  const { data: sellerStats, isLoading } = useQuery({
    queryKey: ["seller-stats"],
    queryFn: () => fetch("/api/seller/stats").then((res) => res.json()),
  });

  const { data: products } = useQuery({
    queryKey: ["seller-products"],
    queryFn: () => fetch("/api/seller/products").then((res) => res.json()),
  });

  const { data: orders } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: () => fetch("/api/seller/orders").then((res) => res.json()),
  });

  const tabs = [
    { id: "overview", name: "Genel Bakış", icon: ChartBarIcon },
    { id: "products", name: "Ürünlerim", icon: CubeIcon },
    { id: "orders", name: "Siparişler", icon: ShoppingBagIcon },
    { id: "analytics", name: "Analitik", icon: ChartBarIcon },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
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
                <ArchiveBoxIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
            to="/seller/orders"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <TruckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sipariş Takibi
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
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <OverviewTab stats={sellerStats} />}
        {activeTab === "products" && <ProductsTab products={products} />}
        {activeTab === "orders" && <OrdersTab orders={orders} />}
        {activeTab === "analytics" && <AnalyticsTab stats={sellerStats} />}
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
          icon={CurrencyDollarIcon}
          change="+12%"
          changeType="positive"
        />
        <StatsCard
          title="Toplam Sipariş"
          value={formatNumber(stats?.total_orders || 0)}
          icon={ShoppingBagIcon}
          change="+8%"
          changeType="positive"
        />
        <StatsCard
          title="Aktif Ürün"
          value={formatNumber(stats?.active_products || 0)}
          icon={CubeIcon}
          change="+2"
          changeType="positive"
        />
        <StatsCard
          title="Müşteri Sayısı"
          value={formatNumber(stats?.unique_customers || 0)}
          icon={EyeIcon}
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
                {formatDate(activity.created_at, { relative: true })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsTab({ products }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Ürünlerim</h2>
        <Link
          to="/seller/products/new"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
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
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products?.map((product) => (
              <tr key={product.id}>
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
                  {formatPrice(product.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.status === "active"
                        ? "bg-green-100 text-green-800"
                        : product.status === "draft"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button className="text-purple-600 hover:text-purple-900">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button className="text-blue-600 hover:text-blue-900">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <TrashIcon className="w-4 h-4" />
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
                  {formatDate(order.created_at)}
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
