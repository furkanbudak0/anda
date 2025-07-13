import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiProducts } from "../services/apiProducts";
import { toast } from "react-hot-toast";
import { categories } from "../constants/categories";
import { supabase } from "../services/supabase";

/**
 * Hook for fetching products with pagination and filters
 */
export function useProducts(options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = "created_at",
    sortOrder = "desc",
    categoryId = null,
    sellerId = null,
    status = "active",
    priceMin = null,
    priceMax = null,
    search = null,
    tags = null,
    featured = null,
    enabled = true,
  } = options;

  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "products",
      {
        page,
        limit,
        sortBy,
        sortOrder,
        categoryId,
        sellerId,
        status,
        priceMin,
        priceMax,
        search,
        tags,
        featured,
      },
    ],
    queryFn: () =>
      apiProducts.getProducts({
        offset,
        limit,
        sortBy,
        sortOrder,
        categoryId,
        sellerId,
        status,
        priceMin,
        priceMax,
        search,
        tags,
        featured,
      }),
    enabled,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for infinite scrolling products
 */
export function useInfiniteProducts(options = {}) {
  const {
    limit = 20,
    sortBy = "created_at",
    sortOrder = "desc",
    categoryId = null,
    sellerId = null,
    status = "active",
    priceMin = null,
    priceMax = null,
    search = null,
    tags = null,
    featured = null,
  } = options;

  return useInfiniteQuery({
    queryKey: [
      "products-infinite",
      {
        limit,
        sortBy,
        sortOrder,
        categoryId,
        sellerId,
        status,
        priceMin,
        priceMax,
        search,
        tags,
        featured,
      },
    ],
    queryFn: ({ pageParam = 0 }) =>
      apiProducts.getProducts({
        offset: pageParam,
        limit,
        sortBy,
        sortOrder,
        categoryId,
        sellerId,
        status,
        priceMin,
        priceMax,
        search,
        tags,
        featured,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * limit;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching a single product
 */
export function useProduct(productId, enabled = true) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => apiProducts.getProduct(productId),
    enabled: enabled && !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching featured products
 */
export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: ["products", "featured", limit],
    queryFn: () => apiProducts.getFeaturedProducts(limit),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook for fetching best selling products
 */
export function useBestSellers(limit = 12) {
  return useQuery({
    queryKey: ["products", "best-sellers", limit],
    queryFn: () => apiProducts.getBestSellers(limit),
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Hook for fetching new arrivals
 */
export function useNewArrivals(limit = 12) {
  return useQuery({
    queryKey: ["products", "new-arrivals", limit],
    queryFn: () => apiProducts.getNewArrivals(limit),
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Hook for fetching products by category
 */
export function useProductsByCategory(categorySlug, options = {}) {
  return useQuery({
    queryKey: ["products", "category", categorySlug, options],
    queryFn: () => apiProducts.getProductsByCategory(categorySlug, options),
    enabled: !!categorySlug,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for searching products
 */
export function useProductSearch(searchTerm, filters = {}) {
  return useQuery({
    queryKey: ["products", "search", searchTerm, filters],
    queryFn: () => apiProducts.searchProducts(searchTerm, filters),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching related products
 */
export function useRelatedProducts(productId, limit = 4) {
  return useQuery({
    queryKey: ["products", "related", productId, limit],
    queryFn: () => apiProducts.getRelatedProducts(productId, limit),
    enabled: !!productId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Hook for fetching seller's products
 */
export function useSellerProducts(sellerId, options = {}) {
  return useQuery({
    queryKey: ["products", "seller", sellerId, options],
    queryFn: () => apiProducts.getSellerProducts(sellerId, options),
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for creating a product (seller only)
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiProducts.createProduct,
    onSuccess: (product) => {
      queryClient.invalidateQueries(["products"]);
      queryClient.setQueryData(["product", product.id], product);
      toast.success("Ürün başarıyla oluşturuldu!");
    },
    onError: (error) => {
      toast.error(`Ürün oluşturulurken hata: ${error.message}`);
    },
  });
}

/**
 * Hook for updating a product (seller only)
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, updates }) =>
      apiProducts.updateProduct(productId, updates),
    onSuccess: (product) => {
      queryClient.invalidateQueries(["products"]);
      queryClient.setQueryData(["product", product.id], product);
      toast.success("Ürün başarıyla güncellendi!");
    },
    onError: (error) => {
      toast.error(`Ürün güncellenirken hata: ${error.message}`);
    },
  });
}

/**
 * Hook for deleting a product (seller only)
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiProducts.deleteProduct,
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries(["products"]);
      queryClient.removeQueries(["product", productId]);
      toast.success("Ürün başarıyla silindi!");
    },
    onError: (error) => {
      toast.error(`Ürün silinirken hata: ${error.message}`);
    },
  });
}

/**
 * Hook for bulk updating products
 */
export function useBulkUpdateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productIds, updates }) =>
      apiProducts.bulkUpdateProducts(productIds, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Ürünler başarıyla güncellendi!");
    },
    onError: (error) => {
      toast.error(`Ürünler güncellenirken hata: ${error.message}`);
    },
  });
}

/**
 * Hook for tracking product views
 */
export function useTrackProductView() {
  return useMutation({
    mutationFn: ({ productId, userId, sessionId }) =>
      apiProducts.trackProductView(productId, userId, sessionId),
    // Silent mutation - don't show success/error messages
  });
}

/**
 * Hook for fetching product analytics (seller only)
 */
export function useProductAnalytics(productId, dateRange = "30d") {
  return useQuery({
    queryKey: ["product-analytics", productId, dateRange],
    queryFn: () => apiProducts.getProductAnalytics(productId, dateRange),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching product reviews
 */
export function useProductReviews(productId, options = {}) {
  return useQuery({
    queryKey: ["product-reviews", productId, options],
    queryFn: () => apiProducts.getProductReviews(productId, options),
    enabled: !!productId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for adding product to wishlist
 */
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, variantId }) =>
      apiProducts.addToWishlist(productId, variantId),
    onSuccess: () => {
      queryClient.invalidateQueries(["wishlist"]);
      toast.success("Ürün favorilere eklendi!");
    },
    onError: (error) => {
      if (error.message.includes("already exists")) {
        toast.error("Ürün zaten favorilerinizde!");
      } else {
        toast.error(`Favorilere eklenirken hata: ${error.message}`);
      }
    },
  });
}

/**
 * Hook for removing product from wishlist
 */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variantId = null }) => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("product_id", productId)
        .eq("variant_id", variantId);

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["wishlist"]);
      toast.success("Favorilerden kaldırıldı");
    },
    onError: (error) => {
      toast.error(error.message || "Favorilerden kaldırılırken hata oluştu");
    },
  });
}
// Category Helper Functions

/**
 * Get category by slug
 */
export function getCategoryBySlug(slug) {
  return categories.find((cat) => cat.slug === slug);
}

/**
 * Get subcategory by slug
 */
export function getSubcategoryBySlug(categorySlug, subcategorySlug) {
  const category = getCategoryBySlug(categorySlug);
  return category?.subcategories?.find((sub) => sub.slug === subcategorySlug);
}

/**
 * Get products by category
 */
export function getCategoryProducts(
  products,
  categorySlug,
  subcategorySlug = null
) {
  if (!products) return [];

  return products.filter((product) => {
    if (subcategorySlug) {
      return (
        product.category?.slug === categorySlug &&
        product.subcategory?.slug === subcategorySlug
      );
    }
    return product.category?.slug === categorySlug;
  });
}

/**
 * Get recommended products using algorithm
 */
export function getRecommendedProducts(products, context = {}) {
  if (!products || products.length === 0) return [];

  // Algorithm scoring weights
  const weights = {
    salesVelocity: 0.25,
    ratingQuality: 0.2,
    engagementRate: 0.15,
    profitMargin: 0.15,
    stockScore: 0.1,
    freshnessScore: 0.1,
    campaignBoost: 0.05,
  };

  const scoredProducts = products.map((product) => {
    const score = calculateAlgorithmScore(product, context, weights);
    return { ...product, algorithmScore: score };
  });

  return scoredProducts
    .sort((a, b) => b.algorithmScore - a.algorithmScore)
    .slice(0, 20);
}

/**
 * Get trending products
 */
export function getTrendingProducts(products, limit = 12) {
  if (!products || products.length === 0) return [];

  return products
    .filter((product) => {
      const views = product.analytics?.views || 0;
      const avgViews =
        products.reduce((sum, p) => sum + (p.analytics?.views || 0), 0) /
        products.length;
      return views > avgViews * 1.5; // 50% above average
    })
    .sort((a, b) => {
      const aEngagement =
        (a.analytics?.views || 0) + (a.analytics?.cart_additions || 0) * 2;
      const bEngagement =
        (b.analytics?.views || 0) + (b.analytics?.cart_additions || 0) * 2;
      return bEngagement - aEngagement;
    })
    .slice(0, limit);
}

/**
 * Calculate algorithm score for a product
 */
function calculateAlgorithmScore(product, context = {}, weights = {}) {
  const analytics = product.analytics || {};

  // Base metrics
  const salesVelocity = calculateSalesVelocity(analytics);
  const ratingQuality = calculateRatingQuality(product);
  const engagementRate = calculateEngagementRate(analytics);
  const profitMargin = calculateProfitMargin(product);
  const stockScore = calculateStockScore(product);
  const freshnessScore = calculateFreshnessScore(product);
  const campaignBoost = product.is_featured ? 1 : 0;

  // Context-based adjustments
  let contextBoost = 0;
  if (context.user && product.seller_id === context.user.id) {
    contextBoost += 0.1; // Boost own products
  }
  if (
    context.type === "category" &&
    product.category?.slug === context.category
  ) {
    contextBoost += 0.05; // Boost category relevance
  }

  // Weighted score calculation
  const score =
    salesVelocity * weights.salesVelocity +
    ratingQuality * weights.ratingQuality +
    engagementRate * weights.engagementRate +
    profitMargin * weights.profitMargin +
    stockScore * weights.stockScore +
    freshnessScore * weights.freshnessScore +
    campaignBoost * weights.campaignBoost +
    contextBoost;

  return Math.round(score * 100) / 100;
}

/**
 * Helper functions for algorithm calculations
 */
function calculateSalesVelocity(analytics) {
  const sales = analytics.sales_count || 0;
  const daysActive = Math.max(
    1,
    (Date.now() - new Date(analytics.created_at || Date.now())) /
      (1000 * 60 * 60 * 24)
  );
  return Math.min(1, (sales / daysActive) * 10);
}

function calculateRatingQuality(product) {
  const rating = product.average_rating || 0;
  const reviewCount = product.review_count || 0;
  const ratingScore = rating / 5;
  const countBonus = Math.min(0.2, reviewCount / 50);
  return Math.min(1, ratingScore + countBonus);
}

function calculateEngagementRate(analytics) {
  const views = analytics.views || 1;
  const cartAdds = analytics.cart_additions || 0;
  const purchases = analytics.purchases || 0;
  return Math.min(1, (cartAdds * 2 + purchases * 5) / views);
}

function calculateProfitMargin(product) {
  const price = product.price || 0;
  const cost = product.cost || price * 0.6;
  return price > 0 ? Math.min(1, (price - cost) / price) : 0;
}

function calculateStockScore(product) {
  const stock = product.stock_quantity || 0;
  const optimalStock = 50;
  if (stock === 0) return 0;
  if (stock < 5) return 0.3;
  if (stock > optimalStock) return 0.7;
  return Math.min(1, stock / optimalStock);
}

function calculateFreshnessScore(product) {
  const createdAt = new Date(product.created_at || Date.now());
  const daysOld = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.min(1, (90 - daysOld) / 90));
}

/**
 * Recommendation Engine
 */
export const recommendationEngine = {
  updateUserProfile: (userId, action) => {
    // Store user behavior for future recommendations
    const key = `user_behavior_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(action);

    // Keep only last 100 actions
    if (existing.length > 100) {
      existing.shift();
    }

    localStorage.setItem(key, JSON.stringify(existing));
  },

  getUserPreferences: (userId) => {
    const key = `user_behavior_${userId}`;
    return JSON.parse(localStorage.getItem(key) || "[]");
  },

  getPersonalizedProducts: (products, userId) => {
    if (!userId || !products) return products;

    const preferences = recommendationEngine.getUserPreferences(userId);
    const categoryPrefs = {};

    // Analyze user preferences
    preferences.forEach((action) => {
      if (action.categorySlug) {
        categoryPrefs[action.categorySlug] =
          (categoryPrefs[action.categorySlug] || 0) + 1;
      }
    });

    // Boost products from preferred categories
    return products
      .map((product) => {
        const categoryBoost = categoryPrefs[product.category?.slug] || 0;
        return {
          ...product,
          personalizedScore:
            (product.algorithmScore || 0) + categoryBoost * 0.1,
        };
      })
      .sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));
  },
};

