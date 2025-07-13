import React, { useState } from "react";
import { useAdminAnalytics } from "../../hooks/useAnalytics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../services/supabase";
import {
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  CalendarIcon,
  BuildingStorefrontIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import NavBar from "../../components/NavBar";
import Spinner from "../../components/Spinner";

const periodOptions = [
  { value: "daily", label: "Son 7 Gün", days: 7 },
  { value: "weekly", label: "Son 4 Hafta", days: 28 },
  { value: "monthly", label: "Son 3 Ay", days: 90 },
];

export default function AdminAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const selectedPeriodConfig = periodOptions.find(
    (p) => p.value === selectedPeriod
  );

  // Fetch analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } =
    useAdminAnalytics(selectedPeriod, selectedPeriodConfig?.days || 7);

  // Fetch platform stats
  const { data: platformStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      // Get total counts
      const [usersResult, sellersResult, productsResult, ordersResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, role, created_at", { count: "exact" }),
          supabase
            .from("sellers")
            .select("id, status, total_sales, total_revenue, rating", {
              count: "exact",
            }),
          supabase
            .from("products")
            .select("id, status, price", { count: "exact" }),
          supabase
            .from("orders")
            .select("id, total_amount, created_at, payment_status", {
              count: "exact",
            }),
        ]);

      if (usersResult.error) throw new Error(usersResult.error.message);
      if (sellersResult.error) throw new Error(sellersResult.error.message);
      if (productsResult.error) throw new Error(productsResult.error.message);
      if (ordersResult.error) throw new Error(ordersResult.error.message);

      // Calculate stats
      const totalUsers = usersResult.count || 0;
      const totalSellers = sellersResult.count || 0;
      const totalProducts = productsResult.count || 0;
      const totalOrders = ordersResult.count || 0;

      const activeSellers =
        sellersResult.data?.filter((s) => s.status === "approved").length || 0;
      const activeProducts =
        productsResult.data?.filter((p) => p.status === "active").length || 0;

      const totalRevenue =
        ordersResult.data?.reduce((sum, order) => {
          return order.payment_status === "completed"
            ? sum + parseFloat(order.total_amount)
            : sum;
        }, 0) || 0;

      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const averageSellerRating =
        sellersResult.data?.length > 0
          ? sellersResult.data.reduce(
              (sum, seller) => sum + (seller.rating || 0),
              0
            ) / sellersResult.data.length
          : 0;

      // Monthly growth calculations
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newUsersThisMonth =
        usersResult.data?.filter((u) => new Date(u.created_at) >= thirtyDaysAgo)
          .length || 0;

      const revenueThisMonth =
        ordersResult.data
          ?.filter(
            (o) =>
              new Date(o.created_at) >= thirtyDaysAgo &&
              o.payment_status === "completed"
          )
          .reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;

      return {
        totalUsers,
        totalSellers,
        activeSellers,
        totalProducts,
        activeProducts,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        averageSellerRating,
        newUsersThisMonth,
        revenueThisMonth,
      };
    },
  });

  // Fetch top sellers
  const { data: topSellers, isLoading: isLoadingTopSellers } = useQuery({
    queryKey: ["top-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select(
          `
          id,
          business_name,
          total_sales,
          total_revenue,
          rating,
          total_reviews,
          status
        `
        )
        .eq("status", "approved")
        .order("total_revenue", { ascending: false })
        .limit(10);

      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  // Process analytics data
  const processedAnalytics = React.useMemo(() => {
    if (!analyticsData?.analytics) return null;

    const { analytics, orders } = analyticsData;

    // Group analytics by date
    const dailyStats = analytics.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          totalViews: 0,
          uniqueViewers: 0,
          cartAdditions: 0,
          wishlistAdditions: 0,
          purchases: 0,
          revenue: 0,
        };
      }

      acc[date].totalViews += record.total_views || 0;
      acc[date].uniqueViewers += record.unique_viewers || 0;
      acc[date].cartAdditions += record.cart_additions || 0;
      acc[date].wishlistAdditions += record.wishlist_additions || 0;
      acc[date].purchases += record.purchases || 0;
      acc[date].revenue += parseFloat(record.revenue || 0);

      return acc;
    }, {});

    // Convert to array and sort
    const dailyStatsArray = Object.values(dailyStats).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Calculate totals
    const totals = dailyStatsArray.reduce(
      (acc, day) => ({
        totalViews: acc.totalViews + day.totalViews,
        uniqueViewers: acc.uniqueViewers + day.uniqueViewers,
        cartAdditions: acc.cartAdditions + day.cartAdditions,
        wishlistAdditions: acc.wishlistAdditions + day.wishlistAdditions,
        purchases: acc.purchases + day.purchases,
        revenue: acc.revenue + day.revenue,
      }),
      {
        totalViews: 0,
        uniqueViewers: 0,
        cartAdditions: 0,
        wishlistAdditions: 0,
        purchases: 0,
        revenue: 0,
      }
    );

    return {
      dailyStats: dailyStatsArray,
      totals,
      conversionRate:
        totals.totalViews > 0
          ? (totals.purchases / totals.totalViews) * 100
          : 0,
    };
  }, [analyticsData]);

  if (isLoadingAnalytics || isLoadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Platform Analitiği
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tüm platform performansını ve istatistiklerini görüntüleyin
            </p>
          </div>
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
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Kullanıcı
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {platformStats?.totalUsers.toLocaleString() || 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  +{platformStats?.newUsersThisMonth || 0} bu ay
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Aktif Satıcı
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {platformStats?.activeSellers.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  /{platformStats?.totalSellers || 0} toplam
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <BuildingStorefrontIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Aktif Ürün
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {platformStats?.activeProducts.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  /{platformStats?.totalProducts || 0} toplam
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <ShoppingBagIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                  ₺{platformStats?.totalRevenue.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  ₺{platformStats?.revenueThisMonth.toFixed(2) || "0.00"} bu ay
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {processedAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Görüntülenme
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Toplam
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {processedAnalytics.totals.totalViews.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Benzersiz
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {processedAnalytics.totals.uniqueViewers.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Günlük Ort.
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round(
                      processedAnalytics.totals.totalViews /
                        selectedPeriodConfig.days
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Dönüşüm
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Satış Oranı
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    %{processedAnalytics.conversionRate.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Sepet Oranı
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    %
                    {processedAnalytics.totals.totalViews > 0
                      ? (
                          (processedAnalytics.totals.cartAdditions /
                            processedAnalytics.totals.totalViews) *
                          100
                        ).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Favori Oranı
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    %
                    {processedAnalytics.totals.totalViews > 0
                      ? (
                          (processedAnalytics.totals.wishlistAdditions /
                            processedAnalytics.totals.totalViews) *
                          100
                        ).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Satış
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Toplam
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {processedAnalytics.totals.purchases.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Gelir
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ₺{processedAnalytics.totals.revenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Ort. Sipariş
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ₺
                    {processedAnalytics.totals.purchases > 0
                      ? (
                          processedAnalytics.totals.revenue /
                          processedAnalytics.totals.purchases
                        ).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Sellers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              En İyi Satıcılar
            </h3>
          </div>

          {isLoadingTopSellers ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : topSellers && topSellers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Satıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Toplam Satış
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Toplam Gelir
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Puan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Yorumlar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {topSellers.map((seller, index) => (
                    <tr
                      key={seller.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                #{index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {seller.business_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {seller.total_sales?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ₺{(seller.total_revenue || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {(seller.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {seller.total_reviews?.toLocaleString() || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Henüz satıcı yok
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Onaylanan satıcılar burada görünecek.
              </p>
            </div>
          )}
        </div>

        {/* Additional Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sipariş İstatistikleri
              </h3>
              <ShoppingBagIcon className="h-5 w-5 text-purple-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Toplam Sipariş
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {platformStats?.totalOrders.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ort. Sipariş Değeri
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ₺{platformStats?.averageOrderValue.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Satıcı Performansı
              </h3>
              <StarIcon className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ort. Puan
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {platformStats?.averageSellerRating.toFixed(1) || "0.0"}/5.0
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Onay Oranı
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  %
                  {platformStats?.totalSellers > 0
                    ? (
                        (platformStats.activeSellers /
                          platformStats.totalSellers) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Büyüme Oranları
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Aylık Kullanıcı
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  +{platformStats?.newUsersThisMonth || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Aylık Gelir
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  +₺{platformStats?.revenueThisMonth.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
