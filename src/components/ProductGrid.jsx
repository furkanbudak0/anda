/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";

/**
 * Product grid with infinite scroll functionality
 */
export default function ProductGrid({
  filters = {},
  sortBy = "created_at",
  sortOrder = "desc",
  pageSize = 20,
  className = "",
  showFilters = true,
}) {
  const loadMoreRef = useRef();

  // Infinite query for products
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["products", filters, sortBy, sortOrder],
    queryFn: async ({ pageParam = 0 }) => {
      // This would be your actual API call
      const searchParams = new URLSearchParams({
        offset: pageParam * pageSize,
        limit: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters,
      });

      const response = await fetch(`/api/products?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      return response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.products.length < pageSize) {
        return undefined; // No more pages
      }
      return pages.length; // Next page number
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Get all products from all pages
  const allProducts = data?.pages.flatMap((page) => page.products) || [];
  const totalCount = data?.pages[0]?.total || 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Ürünler Yüklenemedi"
        description={error.message || "Ürünler yüklenirken bir hata oluştu"}
        actionLabel="Tekrar Dene"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (allProducts.length === 0) {
    return (
      <EmptyState
        title="Ürün Bulunamadı"
        description="Aradığınız kriterlere uygun ürün bulunmuyor"
        actionLabel="Filtreleri Temizle"
        onAction={() => {
          // Clear filters logic
        }}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          <span className="font-medium">{allProducts.length}</span> ürün
          {totalCount > allProducts.length && (
            <span> (toplam {totalCount})</span>
          )}
        </p>

        {showFilters && (
          <div className="flex items-center gap-4">
            {/* Sort Options */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split("-");
                // Update sort logic would go here
                // Sort changed logic
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="created_at-desc">En Yeni</option>
              <option value="created_at-asc">En Eski</option>
              <option value="price-asc">Fiyat (Düşük → Yüksek)</option>
              <option value="price-desc">Fiyat (Yüksek → Düşük)</option>
              <option value="order_count-desc">En Çok Satan</option>
              <option value="rating-desc">En Yüksek Puan</option>
              <option value="view_count-desc">En Çok Görüntülenen</option>
            </select>
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showQuickActions={true}
            showSellerInfo={true}
          />
        ))}
      </div>

      {/* Loading More Indicator */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-purple-600">
              <Spinner />
              <span>Daha fazla ürün yükleniyor...</span>
            </div>
          ) : (
            <div className="text-gray-500">Scroll down to load more</div>
          )}
        </div>
      )}

      {/* End of Results */}
      {!hasNextPage && allProducts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Tüm ürünler görüntülendi</p>
        </div>
      )}
    </div>
  );
}

/**
 * Product card skeleton for loading state
 */
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200 animate-pulse" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Seller */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        </div>

        {/* Product Name */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>

        {/* Price */}
        <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />

        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
        </div>

        {/* Tags */}
        <div className="flex gap-1">
          <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-full w-12 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
