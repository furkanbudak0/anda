/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Breadcrumb from "../components/Breadcrumb";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { useProducts } from "../hooks/useProducts";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";

const SORT_OPTIONS = [
  { id: "created_at", label: "En Yeni", icon: "🆕" },
  { id: "price", label: "Fiyat (Düşük)", icon: "💰" },
  { id: "price_desc", label: "Fiyat (Yüksek)", icon: "💎" },
  { id: "name", label: "İsim A-Z", icon: "📝" },
];

const FILTER_OPTIONS = [
  { id: "all", label: "Tümü" },
  { id: "featured", label: "Öne Çıkan" },
  { id: "discounted", label: "İndirimli" },
];

export default function ProductList() {
  const { category, subcategory } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const { user } = useAuth();

  // State management
  const [sortBy, setSortBy] = useState("created_at");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState(search || "");

  // Get products using existing hook
  const {
    data: productsData,
    isLoading: productsLoading,
    error,
  } = useProducts({
    category,
    subcategory,
    search: searchQuery || search,
    limit: 50,
  });

  const products = productsData?.products || [];

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

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
          case "featured":
            return product.is_featured;
          case "discounted":
            return product.discount_percentage > 0;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return (a.price || 0) - (b.price || 0);
        case "price_desc":
          return (b.price || 0) - (a.price || 0);
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "created_at":
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  }, [products, searchQuery, filterBy, sortBy]);

  // Get category/subcategory information for display
  const categoryInfo = useMemo(() => {
    if (subcategory && category) {
      return {
        title: `${subcategory} - ${category}`,
        description: `${subcategory} kategorisindeki ürünler`,
        breadcrumbs: [
          { name: "Ana Sayfa", href: "/" },
          { name: category, href: `/category/${category}` },
          { name: subcategory, href: `/category/${category}/${subcategory}` },
        ],
      };
    } else if (category) {
      return {
        title: category,
        description: `${category} kategorisindeki ürünler`,
        breadcrumbs: [
          { name: "Ana Sayfa", href: "/" },
          { name: category, href: `/category/${category}` },
        ],
      };
    } else if (search) {
      return {
        title: `"${search}" için arama sonuçları`,
        description: `${search} aramanız için bulunan ürünler`,
        breadcrumbs: [
          { name: "Ana Sayfa", href: "/" },
          { name: `Arama: ${search}`, href: `/products?search=${search}` },
        ],
      };
    } else {
      return {
        title: "Tüm Ürünler",
        description: "Tüm ürünlerimizi keşfedin",
        breadcrumbs: [
          { name: "Ana Sayfa", href: "/" },
          { name: "Ürünler", href: "/products" },
        ],
      };
    }
  }, [category, subcategory, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchQuery);
  };

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            title="Hata Oluştu"
            description="Ürünler yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
            actionLabel="Tekrar Dene"
            onAction={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={categoryInfo.breadcrumbs} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {categoryInfo.title}
          </h1>
          <p className="text-gray-600">{categoryInfo.description}</p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <form onSubmit={handleSearch} className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ürünlerde ara..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </form>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {FILTER_OPTIONS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterBy(filter.id)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    filterBy === filter.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-600"
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-blue-500 text-white"
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
        </div>

        {/* Products Grid */}
        {filteredAndSortedProducts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                : "space-y-4"
            }`}
          >
            {filteredAndSortedProducts.map((product, index) => (
              <motion.div
                key={product.uuid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={
                  viewMode === "list" ? "bg-white rounded-xl shadow-lg" : ""
                }
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState
            title="Ürün Bulunamadı"
            description={
              searchQuery
                ? `"${searchQuery}" için ürün bulunamadı.`
                : "Bu kategoride henüz ürün bulunmuyor."
            }
            actionLabel={searchQuery ? "Aramayı Temizle" : "Ana Sayfaya Dön"}
            actionUrl={searchQuery ? "#" : "/"}
            onAction={searchQuery ? () => setSearchQuery("") : undefined}
          />
        )}
      </div>
    </div>
  );
}
