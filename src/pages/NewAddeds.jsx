import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClockIcon,
  SparklesIcon,
  CalendarDaysIcon,
  BoltIcon,
  TagIcon,
  StarIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../services/supabase";
import NavBar from "../components/NavBar";
import ProductCard from "../components/ProductCard";
import Carousel from "../components/Carousel";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import { CategorySEO } from "../components/SEO";

/**
 * NEW ARRIVALS PAGE - Modern Algorithm-Based Design
 *
 * Features:
 * - Time-based freshness algorithm
 * - Category-specific new arrivals
 * - Trending new products analysis
 * - Stock velocity tracking
 * - Interactive timeline filtering
 */

export default function NewAddeds() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [freshnessPeriod, setFreshnessPeriod] = useState("7_days");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Algorithm-based new arrivals query
  const {
    data: newArrivalsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "newArrivals",
      activeFilter,
      freshnessPeriod,
      sortBy,
      searchQuery,
    ],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(
          `
          *,
          category:categories(id, name, slug),
          seller:sellers(business_name, avatar_url, rating),
          algorithm_score:algorithm_scores(*),
          reviews:reviews(rating),
          _count:order_items(count)
        `
        )
        .eq("status", "active")
        .gte("stock_quantity", 1);

      // Freshness period filtering
      const freshnessFilter = getFreshnessFilter(freshnessPeriod);
      if (freshnessFilter) {
        query = query.gte("created_at", freshnessFilter);
      }

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

      const { data, error } = await query
        .order(getSortColumn(sortBy), { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate comprehensive freshness scores
      return (
        data
          ?.map((product) => ({
            ...product,
            freshnessScore: calculateFreshnessScore(product),
            trendingScore: calculateNewProductTrending(product),
            velocityScore: calculateStockVelocity(product),
            performanceMetrics: getNewProductMetrics(product),
          }))
          .sort((a, b) => {
            if (sortBy === "freshness")
              return b.freshnessScore - a.freshnessScore;
            if (sortBy === "trending") return b.trendingScore - a.trendingScore;
            if (sortBy === "velocity") return b.velocityScore - a.velocityScore;
            return new Date(b.created_at) - new Date(a.created_at);
          }) || []
      );
    },
    staleTime: 1 * 60 * 1000, // 1 minute for fresh data
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
  const calculateFreshnessScore = (product) => {
    const now = new Date();
    const createdAt = new Date(product.created_at);
    const ageInHours = (now - createdAt) / (1000 * 60 * 60);

    // Fresh bonus decreases over time
    const freshBonus = Math.max(0, 100 - (ageInHours / 24) * 10);
    const stockLevel = Math.min(product.stock_quantity / 100, 1) * 20;
    const priceAttractiveness = product.discounted_price ? 25 : 0;

    return freshBonus + stockLevel + priceAttractiveness;
  };

  const calculateNewProductTrending = (product) => {
    const scores = product.algorithm_score || {};
    const daysSinceCreated =
      (new Date() - new Date(product.created_at)) / (1000 * 60 * 60 * 24);

    // Trending score for new products
    const viewVelocity =
      (scores.view_count || 0) / Math.max(daysSinceCreated, 1);
    const engagementRate = scores.engagement_rate || 0;
    const earlyOrders = product._count || 0;

    return viewVelocity * 0.4 + engagementRate * 0.3 + earlyOrders * 0.3;
  };

  const calculateStockVelocity = (product) => {
    const scores = product.algorithm_score || {};
    const daysSinceCreated =
      (new Date() - new Date(product.created_at)) / (1000 * 60 * 60 * 24);

    // How fast is the product selling since launch
    const salesVelocity = (product._count || 0) / Math.max(daysSinceCreated, 1);
    const viewToSaleRatio = scores.conversion_rate || 0;

    return salesVelocity * 0.6 + viewToSaleRatio * 0.4;
  };

  const getNewProductMetrics = (product) => {
    const scores = product.algorithm_score || {};
    const daysSinceCreated =
      (new Date() - new Date(product.created_at)) / (1000 * 60 * 60 * 24);

    return {
      ageInDays: Math.floor(daysSinceCreated),
      viewCount: scores.view_count || 0,
      salesCount: product._count || 0,
      engagementRate: scores.engagement_rate || 0,
      stockLevel: product.stock_quantity,
      hasDiscount: !!product.discounted_price,
    };
  };

  const getFreshnessFilter = (period) => {
    const now = new Date();
    switch (period) {
      case "24_hours":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case "3_days":
        return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      case "7_days":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30_days":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  };

  const getSortColumn = (sort) => {
    switch (sort) {
      case "newest":
        return "created_at";
      case "trending":
        return "algorithm_score.view_velocity";
      case "velocity":
        return "_count";
      case "freshness":
        return "created_at";
      default:
        return "created_at";
    }
  };

  // Filter products into tiers for carousel display
  const getProductTiers = () => {
    if (!newArrivalsData)
      return { ultraFresh: [], trending: [], promising: [] };

    const today = new Date();
    const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

    return {
      ultraFresh: newArrivalsData
        .filter((product) => new Date(product.created_at) >= oneDayAgo)
        .slice(0, 8),
      trending: newArrivalsData
        .filter(
          (product) =>
            new Date(product.created_at) >= threeDaysAgo &&
            product.trendingScore > 10
        )
        .slice(0, 12),
      promising: newArrivalsData
        .filter((product) => product.velocityScore > 5)
        .slice(0, 16),
    };
  };

  const { ultraFresh, trending, promising } = getProductTiers();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100">
        <NavBar />
        <div className="pt-24 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Spinner size="large" />
            <p className="mt-4 text-blue-600 font-medium">
              Yeni ürünler analiz ediliyor...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100">
        <NavBar />
        <div className="pt-24 max-w-7xl mx-auto px-4">
          <EmptyState
            title="Analiz Hatası"
            description="Yeni ürünler listesi yüklenirken bir hata oluştu."
            actionLabel="Tekrar Dene"
            onAction={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100">
      <CategorySEO
        category={{ name: "Yeni Ürünler", slug: "new-arrivals" }}
        products={newArrivalsData}
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
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Yeni Ürünler
              </h1>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              En taze ürünler ve yeni keşifler. Algoritma destekli tazelik
              analizi ile sıralanmış yeni gelenler ve trend olmaya aday ürünler.
            </p>
          </motion.div>

          {/* Controls Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-lg border border-blue-100"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Search */}
              <div className="relative min-w-64">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Yeni ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                />
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
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
                    {/* Freshness Period */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tazelik Süresi
                      </label>
                      <select
                        value={freshnessPeriod}
                        onChange={(e) => setFreshnessPeriod(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="24_hours">Son 24 Saat</option>
                        <option value="3_days">Son 3 Gün</option>
                        <option value="7_days">Son 7 Gün</option>
                        <option value="30_days">Son 30 Gün</option>
                      </select>
                    </div>

                    {/* Sort Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sıralama
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="newest">En Yeni</option>
                        <option value="freshness">Tazelik Skoru</option>
                        <option value="trending">Trend Analizi</option>
                        <option value="velocity">Satış Hızı</option>
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
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Ultra Fresh Section */}
          {ultraFresh.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl">
                  <BoltIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Ultra Taze ⚡
                </h2>
                <span className="text-sm text-gray-500">
                  Son 24 saatte eklenen ürünler
                </span>
              </div>

              <Carousel
                items={ultraFresh}
                renderItem={(product) => (
                  <ProductCard
                    key={product.uuid}
                    product={product}
                    showFreshnessMetrics={true}
                    tier="ultra-fresh"
                  />
                )}
                settings={{
                  slidesToShow: { base: 1, sm: 2, md: 3, lg: 4 },
                  autoplay: true,
                  autoplaySpeed: 6000,
                  showDots: true,
                  showArrows: true,
                }}
              />
            </motion.div>
          )}

          {/* Trending New Products Section */}
          {trending.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl">
                  <GiftIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Trend Olan Yeniler 🔥
                </h2>
                <span className="text-sm text-gray-500">
                  Hızla popülerleşen yeni ürünler
                </span>
              </div>

              <Carousel
                items={trending}
                renderItem={(product) => (
                  <ProductCard
                    key={product.uuid}
                    product={product}
                    showFreshnessMetrics={true}
                    tier="trending-new"
                  />
                )}
                settings={{
                  slidesToShow: { base: 1, sm: 2, md: 3, lg: 4 },
                  autoplay: true,
                  autoplaySpeed: 8000,
                  showDots: false,
                  showArrows: true,
                }}
              />
            </motion.div>
          )}

          {/* Promising Newcomers Section */}
          {promising.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-xl">
                  <StarIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Umut Vadeden Yeniler 🌟
                </h2>
                <span className="text-sm text-gray-500">
                  Güçlü başlangıç yapan ürünler
                </span>
              </div>

              <Carousel
                items={promising}
                renderItem={(product) => (
                  <ProductCard
                    key={product.uuid}
                    product={product}
                    showFreshnessMetrics={true}
                    tier="promising"
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

          {/* Empty State */}
          {(!newArrivalsData || newArrivalsData.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <EmptyState
                title="Henüz Yeni Ürün Bulunamadı"
                description="Seçili kriterlere göre yeni ürün bulunamadı. Zaman aralığını genişletmeyi deneyin."
                actionLabel="Filtreleri Sıfırla"
                onAction={() => {
                  setActiveFilter("all");
                  setSortBy("newest");
                  setFreshnessPeriod("7_days");
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
