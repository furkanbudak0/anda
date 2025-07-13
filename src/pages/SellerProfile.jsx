import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  StarIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ShoppingBagIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import NavBar from "../components/NavBar";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { recommendationEngine } from "../hooks/useProducts";

const SORT_OPTIONS = [
  { id: "algorithm", label: "Öne Çıkanlar", icon: "🎯" },
  { id: "newest", label: "En Yeni", icon: "🆕" },
  { id: "price_low", label: "Fiyat (Düşük)", icon: "💰" },
  { id: "price_high", label: "Fiyat (Yüksek)", icon: "💎" },
  { id: "rating", label: "En Beğenilen", icon: "⭐" },
  { id: "sold", label: "Çok Satan", icon: "🔥" },
];

const FILTER_OPTIONS = [
  { id: "all", label: "Tümü" },
  { id: "discounted", label: "İndirimli" },
  { id: "featured", label: "Öne Çıkan" },
  { id: "new", label: "Yeni Eklenen" },
];

export default function SellerProfile() {
  const { sellerId } = useParams();
  const [sortBy, setSortBy] = useState("algorithm");
  const [filterBy, setFilterBy] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [allProducts, setAllProducts] = useState([]);

  // Fetch seller data
  const {
    data: seller,
    isLoading: sellerLoading,
    error: sellerError,
  } = useQuery({
    queryKey: ["seller", sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select(
          `
          *,
          user:users(name, email, avatar_url)
        `
        )
        .eq("id", sellerId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch seller's products with algorithm scoring
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["sellerProducts", sellerId, page],
    queryFn: async () => {
      const PRODUCTS_PER_PAGE = 20;
      const offset = (page - 1) * PRODUCTS_PER_PAGE;

      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(*),
          analytics(*),
          reviews(rating, comment)
        `
        )
        .eq("seller_id", sellerId)
        .eq("status", "active")
        .range(offset, offset + PRODUCTS_PER_PAGE - 1)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Apply algorithm scoring to products
      const scoredProducts = data.map((product) => {
        const algorithmContext = {
          type: "seller_profile",
          avgMarketViews: 1000,
          avgMarketRevenue: 5000,
          marketAvgOrderValue: 300,
          optimalStock: 50,
        };

        const recommendation = recommendationEngine.calculateProductScore(
          product,
          algorithmContext
        );

        return {
          ...product,
          recommendation,
          algorithmScore: recommendation.score,
        };
      });

      return scoredProducts;
    },
    enabled: !!sellerId,
  });

  // Combine products for infinite scroll
  useEffect(() => {
    if (products) {
      if (page === 1) {
        setAllProducts(products);
      } else {
        setAllProducts((prev) => [...prev, ...products]);
      }
      setHasNextPage(products.length === 20);
    }
  }, [products, page]);

  // Load more products
  const loadMore = () => {
    if (hasNextPage && !productsLoading) {
      setPage((prev) => prev + 1);
    }
  };

  // Filter and sort products
  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = [...allProducts];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filterBy !== "all") {
      filtered = filtered.filter((product) => {
        switch (filterBy) {
          case "discounted":
            return product.discount_percentage > 0;
          case "featured":
            return product.is_featured;
          case "new":
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(product.created_at) > weekAgo;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "algorithm":
          return (b.algorithmScore || 0) - (a.algorithmScore || 0);
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "price_low":
          return (
            (a.discounted_price || a.price) - (b.discounted_price || b.price)
          );
        case "price_high":
          return (
            (b.discounted_price || b.price) - (a.discounted_price || a.price)
          );
        case "rating":
          const avgRatingA =
            a.reviews?.length > 0
              ? a.reviews.reduce((sum, r) => sum + r.rating, 0) /
                a.reviews.length
              : 0;
          const avgRatingB =
            b.reviews?.length > 0
              ? b.reviews.reduce((sum, r) => sum + r.rating, 0) /
                b.reviews.length
              : 0;
          return avgRatingB - avgRatingA;
        case "sold":
          return (
            (b.analytics?.total_sold || 0) - (a.analytics?.total_sold || 0)
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [allProducts, sortBy, filterBy, searchQuery]);

  // Calculate seller stats
  const sellerStats = React.useMemo(() => {
    if (!allProducts.length) return {};

    const totalProducts = allProducts.length;
    const avgRating =
      allProducts.reduce((sum, product) => {
        const productRating =
          product.reviews?.length > 0
            ? product.reviews.reduce((rSum, r) => rSum + r.rating, 0) /
              product.reviews.length
            : 0;
        return sum + productRating;
      }, 0) / totalProducts;

    const totalSold = allProducts.reduce(
      (sum, product) => sum + (product.analytics?.total_sold || 0),
      0
    );

    const totalReviews = allProducts.reduce(
      (sum, product) => sum + (product.reviews?.length || 0),
      0
    );

    return {
      totalProducts,
      avgRating: avgRating || 0,
      totalSold,
      totalReviews,
    };
  }, [allProducts]);

  if (sellerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <NavBar />
        <div className="pt-24 flex justify-center">
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  if (sellerError || !seller) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <NavBar />
        <div className="pt-24 max-w-7xl mx-auto px-4">
          <EmptyState
            title="Satıcı Bulunamadı"
            description="Aradığınız satıcı mevcut değil veya hesabı kapatılmış olabilir."
            actionLabel="Ana Sayfaya Dön"
            actionUrl="/"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <NavBar />

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Seller Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8"
          >
            <div className="flex flex-col md:flex-row gap-8">
              {/* Seller Avatar */}
              <div className="flex-shrink-0">
                <img
                  src={
                    seller.avatar_url ||
                    seller.user?.avatar_url ||
                    "/images/default-avatar.jpg"
                  }
                  alt={seller.business_name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              </div>

              {/* Seller Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {seller.business_name}
                    </h1>
                    {seller.is_verified && (
                      <CheckBadgeIcon className="w-8 h-8 text-blue-500" />
                    )}
                  </div>
                  <p className="text-gray-600 text-lg">{seller.description}</p>
                </div>

                {/* Seller Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {sellerStats.totalProducts || 0}
                    </div>
                    <div className="text-sm text-gray-600">Ürün</div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <StarIconSolid className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold text-yellow-600">
                        {sellerStats.avgRating?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Ortalama Puan</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {sellerStats.totalSold || 0}
                    </div>
                    <div className="text-sm text-gray-600">Satış</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {sellerStats.totalReviews || 0}
                    </div>
                    <div className="text-sm text-gray-600">Yorum</div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {seller.location && (
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{seller.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>
                      Üye:{" "}
                      {new Date(seller.created_at).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters and Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ürünlerde ara..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                {FILTER_OPTIONS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setFilterBy(filter.id)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      filterBy === filter.id
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>

                {/* View Mode */}
                <div className="flex gap-1 border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${
                      viewMode === "grid"
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-600"
                    }`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${
                      viewMode === "list"
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-600"
                    }`}
                  >
                    <ListBulletIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Info */}
            <div className="mt-4 text-sm text-gray-600">
              {filteredAndSortedProducts.length} ürün bulundu
              {searchQuery && ` "${searchQuery}" için`}
              {filterBy !== "all" &&
                ` (${FILTER_OPTIONS.find((f) => f.id === filterBy)?.label})`}
            </div>
          </motion.div>

          {/* Products Grid */}
          {productsLoading && page === 1 ? (
            <div className="flex justify-center py-12">
              <Spinner size="large" />
            </div>
          ) : filteredAndSortedProducts.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`${
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                  : "space-y-4"
              }`}
            >
              {filteredAndSortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={
                    viewMode === "list" ? "bg-white rounded-xl shadow-lg" : ""
                  }
                >
                  <ProductCard
                    product={product}
                    showSeller={false}
                    viewMode={viewMode}
                    tier={product.recommendation?.tier || "regular"}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState
              title="Ürün Bulunamadı"
              description={
                searchQuery
                  ? `"${searchQuery}" için ürün bulunamadı.`
                  : "Bu satıcının henüz ürünü bulunmuyor."
              }
              actionLabel={searchQuery ? "Aramayı Temizle" : "Ana Sayfaya Dön"}
              actionUrl={searchQuery ? "#" : "/"}
              onAction={searchQuery ? () => setSearchQuery("") : undefined}
            />
          )}

          {/* Load More Button */}
          {hasNextPage &&
            !productsLoading &&
            filteredAndSortedProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-12"
              >
                <button
                  onClick={loadMore}
                  className="px-8 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-lg"
                >
                  Daha Fazla Ürün Yükle
                </button>
              </motion.div>
            )}

          {/* Loading More */}
          {productsLoading && page > 1 && (
            <div className="flex justify-center mt-8">
              <Spinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Products Tab Component
function ProductsTab({
  sellerProfile,
  products,
  productFilters,
  onFiltersChange,
}) {
  const filteredProducts = products.filter((product) => {
    if (productFilters.category === "all") return true;
    return product.category?.slug === productFilters.category;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (productFilters.sortBy) {
      case "price_low":
        return a.price - b.price;
      case "price_high":
        return b.price - a.price;
      case "rating":
        return (b.average_rating || 0) - (a.average_rating || 0);
      case "newest":
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={productFilters.category}
            onChange={(e) =>
              onFiltersChange({ ...productFilters, category: e.target.value })
            }
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={productFilters.sortBy}
            onChange={(e) =>
              onFiltersChange({ ...productFilters, sortBy: e.target.value })
            }
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="newest">En Yeni</option>
            <option value="price_low">Fiyat (Düşük → Yüksek)</option>
            <option value="price_high">Fiyat (Yüksek → Düşük)</option>
            <option value="rating">En Yüksek Puan</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          {sortedProducts.length} ürün bulundu
        </div>
      </div>

      {/* Products Grid */}
      {sortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Ürün Bulunamadı"
          description="Bu satıcının henüz ürünü bulunmuyor"
          icon={ShoppingBagIcon}
        />
      )}
    </div>
  );
}

// About Tab Component
function AboutTab({ sellerProfile }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Satıcı Hakkında
          </h3>
          <div className="prose prose-gray max-w-none">
            <p>{sellerProfile.description || "Henüz açıklama eklenmemiş."}</p>
          </div>
        </div>

        {/* Store Hours */}
        {sellerProfile.store_hours && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              Çalışma Saatleri
            </h3>
            <div className="space-y-2">
              {formatStoreHours(sellerProfile.store_hours)}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Info */}
      <div className="space-y-6">
        {/* Contact Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            İletişim Bilgileri
          </h3>
          <div className="space-y-3">
            {sellerProfile.phone && (
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{sellerProfile.phone}</span>
              </div>
            )}

            {sellerProfile.email && (
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{sellerProfile.email}</span>
              </div>
            )}

            {sellerProfile.store_location &&
              sellerProfile.show_location_public && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <span className="text-gray-600">
                    {sellerProfile.store_location.address}
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* Certificates */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sertifikalar & Güvenlik
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckBadgeIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Kimlik Doğrulandı</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckBadgeIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">İşletme Kayıtlı</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckBadgeIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Güvenli Ödeme</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shipping Tab Component
function ShippingTab({ sellerProfile }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TruckIcon className="w-5 h-5" />
          Kargo Bilgileri
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Ücretsiz Kargo:</span>
            <span className="font-medium">
              {sellerProfile.free_shipping_threshold
                ? `${sellerProfile.free_shipping_threshold}₺ ve üzeri`
                : "150₺ ve üzeri"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ortalama Kargo Süresi:</span>
            <span className="font-medium">
              {sellerProfile.avg_shipping_time || 2} gün
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Kargo Firmaları:</span>
            <span className="font-medium">MNG, Yurtiçi, Aras</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          İade & Değişim
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">İade Süresi:</span>
            <span className="font-medium">14 gün</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Değişim:</span>
            <span className="font-medium">Mümkün</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">İade Ücreti:</span>
            <span className="font-medium">Satıcı karşılar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
