import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FireIcon,
  TrophyIcon,
  ChartBarIcon,
  StarIcon,
  EyeIcon,
  ShoppingBagIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../services/supabase";
import NavBar from "../components/NavBar";
import ProductCard from "../components/ProductCard";
import Carousel from "../components/Carousel";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import { CategorySEO } from "../components/SEO";

/**
 * BEST SELLERS PAGE - Modern Algorithm-Based Design
 *
 * Features:
 * - Multi-criteria algorithm scoring
 * - Real-time trending analysis
 * - Category-based best sellers
 * - Interactive filtering system
 * - Performance metrics visualization
 */

export default function BestSellers() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortMetric, setSortMetric] = useState("sales_score");
  const [timeRange, setTimeRange] = useState("30_days");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Algorithm-based best sellers query
  const {
    data: bestSellersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bestSellers", activeFilter, sortMetric, timeRange, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(
          `
          *,
          category:categories(*),
          seller:sellers(business_name, avatar_url, rating),
          algorithm_score:algorithm_scores(*),
          reviews:reviews(rating),
          _count:order_items(count)
        `
        )
        .eq("status", "active")
        .gte("stock_quantity", 1);

      // Category filtering
      if (activeFilter !== "all") {
        query = query.eq("category.slug", activeFilter);
      }

      // Search filtering
      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,seller.business_name.ilike.%${searchQuery}%`
        );
      }

      // Time range filtering for algorithm scores
      const timeRangeFilter = getTimeRangeFilter(timeRange);
      if (timeRangeFilter) {
        query = query.gte("algorithm_score.last_updated", timeRangeFilter);
      }

      const { data, error } = await query
        .order(getSortColumn(sortMetric), { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate comprehensive best seller scores
      return (
        data
          ?.map((product) => ({
            ...product,
            bestSellerScore: calculateBestSellerScore(product, sortMetric),
            trendingScore: calculateTrendingScore(product),
            performanceMetrics: getPerformanceMetrics(product),
          }))
          .sort((a, b) => b.bestSellerScore - a.bestSellerScore) || []
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get categories for filtering
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("name, slug")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  // Helper functions for algorithm
  const calculateBestSellerScore = (product, metric) => {
    const scores = product.algorithm_score || {};
    const orderCount = product._count || 0;
    const avgRating =
      product.reviews?.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length
        : 0;

    switch (metric) {
      case "sales_score":
        return (
          orderCount * 0.4 + scores.conversion_rate * 0.3 + avgRating * 0.3
        );
      case "rating_score":
        return (
          avgRating * 0.5 + product.reviews?.length * 0.3 + orderCount * 0.2
        );
      case "trending_score":
        return (
          scores.view_count * 0.3 +
          scores.recent_activity * 0.4 +
          orderCount * 0.3
        );
      case "revenue_score":
        return orderCount * product.price * 0.6 + scores.conversion_rate * 0.4;
      default:
        return orderCount;
    }
  };

  const calculateTrendingScore = (product) => {
    const scores = product.algorithm_score || {};
    return (
      (scores.view_velocity || 0) +
      (scores.engagement_rate || 0) +
      (scores.share_count || 0)
    );
  };

  const getPerformanceMetrics = (product) => {
    const scores = product.algorithm_score || {};
    return {
      salesCount: product._count || 0,
      viewCount: scores.view_count || 0,
      conversionRate: scores.conversion_rate || 0,
      engagementRate: scores.engagement_rate || 0,
      trendingVelocity: scores.view_velocity || 0,
    };
  };

  const getTimeRangeFilter = (range) => {
    const now = new Date();
    switch (range) {
      case "7_days":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30_days":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case "90_days":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  };

  const getSortColumn = (metric) => {
    switch (metric) {
      case "sales_score":
        return "_count";
      case "rating_score":
        return "algorithm_score.rating_score";
      case "trending_score":
        return "algorithm_score.trending_score";
      case "revenue_score":
        return "algorithm_score.revenue_score";
      default:
        return "_count";
    }
  };

  // Filter products into tiers for carousel display
  const getProductTiers = () => {
    if (!bestSellersData)
      return { topTier: [], middleTier: [], emergingTier: [] };

    const sortedProducts = [...bestSellersData];

    return {
      topTier: sortedProducts.slice(0, 8), // Top 8 performers
      middleTier: sortedProducts.slice(8, 20), // Next 12 performers
      emergingTier: sortedProducts.slice(20, 32), // Emerging best sellers
    };
  };

  const { topTier, middleTier, emergingTier } = getProductTiers();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-100">
        <NavBar />
        <div className="pt-24 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Spinner size="large" />
            <p className="mt-4 text-orange-600 font-medium">
              En çok satanlar analiz ediliyor...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-100">
        <NavBar />
        <div className="pt-24 max-w-7xl mx-auto px-4">
          <EmptyState
            title="Analiz Hatası"
            description="En çok satanlar listesi yüklenirken bir hata oluştu."
            actionLabel="Tekrar Dene"
            onAction={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-100">
      <CategorySEO
        category={{ name: "En Çok Satanlar", slug: "best-sellers" }}
        products={bestSellersData}
      />
      <NavBar />

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl">
                <TrophyIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              En Çok Satanlar
            </h1>
          </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Algoritma destekli analiz ile belirlenen en popüler ürünler. Satış
              performansı, müşteri memnuniyeti ve trend analizi ile
              sıralanmıştır.
            </p>
          </motion.div>

          {/* Controls Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-lg border border-orange-100"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Search */}
              <div className="relative min-w-64">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                  placeholder="Ürün veya satıcı ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50"
                    />
                  </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
              >
                <FunnelIcon className="w-5 h-5" />
                Filtreler
              </button>
                </div>

            {/* Extended Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Metric Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sıralama Kriteri
                      </label>
                    <select
                        value={sortMetric}
                        onChange={(e) => setSortMetric(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="sales_score">Satış Performansı</option>
                        <option value="rating_score">
                          Müşteri Memnuniyeti
                        </option>
                        <option value="trending_score">Trend Analizi</option>
                        <option value="revenue_score">Gelir Performansı</option>
                    </select>
                  </div>

                    {/* Time Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zaman Aralığı
                      </label>
                  <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="7_days">Son 7 Gün</option>
                        <option value="30_days">Son 30 Gün</option>
                        <option value="90_days">Son 90 Gün</option>
                        <option value="all_time">Tüm Zamanlar</option>
                  </select>
                </div>

                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kategori
                      </label>
                  <select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="all">Tüm Kategoriler</option>
                        {categories?.map((category) => (
                          <option key={category.slug} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Top Performers Section */}
          {topTier.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
                  <TrophyIcon className="w-6 h-6 text-white" />
            </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Şampiyonlar 🏆
                </h2>
                <span className="text-sm text-gray-500">
                  En yüksek performanslı 8 ürün
                </span>
              </div>

              <Carousel
                items={topTier}
                renderItem={(product) => (
                          <ProductCard
                    key={product.id}
                            product={product}
                    showPerformanceMetrics={true}
                    tier="champion"
                  />
                )}
                settings={{
                  slidesToShow: { base: 1, sm: 2, md: 3, lg: 4 },
                  autoplay: true,
                  autoplaySpeed: 8000,
                  showDots: true,
                  showArrows: true,
                }}
              />
            </motion.div>
          )}

          {/* Strong Performers Section */}
          {middleTier.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Güçlü Performans 🚀
                  </h2>
                <span className="text-sm text-gray-500">
                  Yüksek satış performansı gösteren ürünler
                </span>
                        </div>

              <Carousel
                items={middleTier}
                renderItem={(product) => (
                        <ProductCard
                    key={product.id}
                          product={product}
                    showPerformanceMetrics={true}
                    tier="strong"
                  />
                )}
                settings={{
                  slidesToShow: { base: 1, sm: 2, md: 3, lg: 4 },
                  autoplay: true,
                  autoplaySpeed: 10000,
                  showDots: false,
                  showArrows: true,
                }}
              />
            </motion.div>
          )}

          {/* Emerging Stars Section */}
          {emergingTier.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Yükselen Yıldızlar ⭐
                </h2>
                <span className="text-sm text-gray-500">
                  Hızla yükselişe geçen ürünler
                </span>
              </div>

              <Carousel
                items={emergingTier}
                renderItem={(product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showPerformanceMetrics={true}
                    tier="emerging"
                  />
                )}
                settings={{
                  slidesToShow: { base: 1, sm: 2, md: 3, lg: 4 },
                  autoplay: true,
                  autoplaySpeed: 12000,
                  showDots: false,
                  showArrows: true,
                }}
              />
            </motion.div>
          )}

          {/* Empty State */}
          {(!bestSellersData || bestSellersData.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <EmptyState
                title="Henüz En Çok Satan Ürün Bulunamadı"
                description="Seçili kriterlere göre sonuç bulunamadı. Filtreleri değiştirmeyi deneyin."
                actionLabel="Filtreleri Sıfırla"
                onAction={() => {
                  setActiveFilter("all");
                  setSortMetric("sales_score");
                  setTimeRange("30_days");
                  setSearchQuery("");
                }}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
