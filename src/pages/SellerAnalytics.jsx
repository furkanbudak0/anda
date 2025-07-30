import { useState } from "react";
import {
  useSellerAnalytics,
  useSellerAnalyticsSettings,
  useUpdateSellerAnalyticsSettings,
} from "../hooks/useAnalytics";
import { useProducts } from "../hooks/useProducts";
import {
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  Cog6ToothIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import Spinner from "../components/Spinner";

const periodOptions = [
  { value: "daily", label: "Son 7 Gün" },
  { value: "weekly", label: "Son 4 Hafta" },
  { value: "monthly", label: "Son 12 Ay" },
];

export default function SellerAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});

  // Fetch data
  const { data: analytics, isLoading: isLoadingAnalytics } =
    useSellerAnalytics(selectedPeriod);
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const { data: settings, isLoading: isLoadingSettings } =
    useSellerAnalyticsSettings();

  // Mutations
  const updateSettings = useUpdateSellerAnalyticsSettings();

  // Initialize settings form when data loads
  useState(() => {
    if (settings && Object.keys(settingsForm).length === 0) {
      setSettingsForm(settings);
    }
  });

  // Calculate totals
  const totals =
    analytics?.reduce(
      (acc, day) => ({
        views: acc.views + day.total_views,
        uniqueViewers: acc.uniqueViewers + day.unique_viewers,
        cartAdditions: acc.cartAdditions + day.cart_additions,
        wishlistAdditions: acc.wishlistAdditions + day.wishlist_additions,
        purchases: acc.purchases + day.purchases,
        revenue: acc.revenue + parseFloat(day.revenue || 0),
      }),
      {
        views: 0,
        uniqueViewers: 0,
        cartAdditions: 0,
        wishlistAdditions: 0,
        purchases: 0,
        revenue: 0,
      }
    ) || {};

  // Calculate conversion rates
  const conversionRate =
    totals.views > 0 ? (totals.purchases / totals.views) * 100 : 0;

  // Get period days for display
  const days =
    selectedPeriod === "daily" ? 7 : selectedPeriod === "weekly" ? 28 : 365;

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync(settingsForm);
      setShowSettings(false);
    } catch (error) {
      console.error("Settings update error:", error);
    }
  };

  if (isLoadingAnalytics || isLoadingProducts || isLoadingSettings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Satış Analitiği
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Satış performansınızı ve ürün istatistiklerinizi inceleyin
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       dark:bg-gray-700 dark:text-white"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Ayarlar
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Görüntülenme
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(totals?.views ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Son {days} gün
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <EyeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Benzersiz Ziyaretçi
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(totals?.uniqueViewers ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Farklı kullanıcı
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Satış
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(totals?.purchases ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  %{conversionRate.toFixed(1)} dönüşüm
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <ShoppingCartIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Gelir
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₺{(totals?.revenue ?? 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Ortalama: ₺
                  {totals?.purchases > 0
                    ? ((totals?.revenue ?? 0) / totals.purchases).toFixed(2)
                    : "0.00"}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Dönüşüm Hunisi
          </h3>

          <div className="space-y-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Görüntülenme
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {(totals?.views ?? 0).toLocaleString()} (100%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sepete Ekleme
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {(totals?.cartAdditions ?? 0).toLocaleString()} (
                  {(totals?.views ?? 0) > 0
                    ? (
                        ((totals?.cartAdditions ?? 0) / (totals?.views ?? 0)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{
                    width: `${
                      (totals?.views ?? 0) > 0
                        ? ((totals?.cartAdditions ?? 0) /
                            (totals?.views ?? 0)) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Satın Alma
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {(totals?.purchases ?? 0).toLocaleString()} (
                  {conversionRate.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full"
                  style={{ width: `${conversionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Favorilere Ekleme
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {(totals?.wishlistAdditions ?? 0).toLocaleString()} (
                  {(totals?.views ?? 0) > 0
                    ? (
                        ((totals?.wishlistAdditions ?? 0) /
                          (totals?.views ?? 0)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-red-600 h-3 rounded-full"
                  style={{
                    width: `${
                      (totals?.views ?? 0) > 0
                        ? ((totals?.wishlistAdditions ?? 0) /
                            (totals?.views ?? 0)) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ürün Performansı
            </h3>
          </div>

          {products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ürün
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Görüntülenme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sepete Ekleme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Favori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Satış
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Dönüşüm
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((product) => {
                    const productStats = analytics?.reduce(
                      (acc, day) => {
                        const productData = day.analytics?.find(
                          (p) => p.product_id === product.uuid
                        );
                        if (productData) {
                          acc.views += productData.total_views || 0;
                          acc.cartAdditions += productData.cart_additions || 0;
                          acc.wishlistAdditions +=
                            productData.wishlist_additions || 0;
                          acc.purchases += productData.purchases || 0;
                        }
                        return acc;
                      },
                      {
                        views: 0,
                        cartAdditions: 0,
                        wishlistAdditions: 0,
                        purchases: 0,
                      }
                    ) || {
                      views: product.view_count || 0,
                      cartAdditions: 0,
                      wishlistAdditions: product.favorite_count || 0,
                      purchases: product.order_count || 0,
                    };

                    const conversionRate =
                      productStats.views > 0
                        ? (productStats.purchases / productStats.views) * 100
                        : 0;

                    return (
                      <tr
                        key={product.uuid}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={
                                product.images?.[0] ||
                                "/placeholder-product.jpg"
                              }
                              alt={product.name}
                              className="h-10 w-10 object-cover rounded-lg"
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ₺{product.price}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <EyeIcon className="h-4 w-4 text-gray-400 mr-1" />
                            {productStats.views.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <ShoppingCartIcon className="h-4 w-4 text-gray-400 mr-1" />
                            {productStats.cartAdditions.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <HeartIcon className="h-4 w-4 text-gray-400 mr-1" />
                            {productStats.wishlistAdditions.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
                            {productStats.purchases.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {conversionRate > 2 ? (
                              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                            ) : conversionRate > 0 ? (
                              <ArrowTrendingDownIcon className="h-4 w-4 text-yellow-500 mr-1" />
                            ) : (
                              <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                conversionRate > 2
                                  ? "text-green-600"
                                  : conversionRate > 0
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              %{conversionRate.toFixed(1)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Henüz ürün yok
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Ürün ekleyince analitik veriler burada görünecek.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowSettings(false)}
            />

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                  Analitik Ayarları
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      Müşterilere Gösterilecek Bilgiler
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settingsForm.show_total_sales || false}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              show_total_sales: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          Toplam satış sayısı
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settingsForm.show_monthly_sales || false}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              show_monthly_sales: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          Aylık satış grafiği
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settingsForm.show_product_views || false}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              show_product_views: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          Ürün görüntülenme sayıları
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settingsForm.show_rating_details || false}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              show_rating_details: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          Detaylı puan dağılımı
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settingsForm.show_response_time || false}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              show_response_time: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          Ortalama yanıt süresi
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      Stok Uyarıları
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settingsForm.alert_low_stock || false}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              alert_low_stock: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          Düşük stok uyarıları
                        </span>
                      </label>

                      <div className="ml-7">
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                          Uyarı eşiği (adet)
                        </label>
                        <input
                          type="number"
                          value={settingsForm.low_stock_threshold || 10}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              low_stock_threshold:
                                parseInt(e.target.value) || 10,
                            }))
                          }
                          className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md 
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                   dark:bg-gray-700 dark:text-white"
                          min="1"
                        />
                      </div>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settingsForm.email_notifications || false}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              email_notifications: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          E-posta bildirimleri
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSaveSettings}
                  disabled={updateSettings.isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateSettings.isLoading ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
