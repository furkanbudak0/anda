// Bu hook, merkezi supabase client ile çalışır. import { supabase } from '../services/supabase' kullanılır.
import React, { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

/**
 * Hook for tracking product interactions
 */
export function useTrackInteraction() {
  return useMutation({
    mutationFn: async ({
      productUuid,
      interactionType,
      variantId = null,
      quantity = 1,
      price = null,
    }) => {
      if (
        !productUuid ||
        typeof productUuid !== "string" ||
        productUuid.length !== 36
      ) {
        throw new Error("Event için geçerli bir ürün uuid'si gereklidir.");
      }
      // Get session info
      const sessionId =
        sessionStorage.getItem("session_id") || "guest_" + Date.now();
      sessionStorage.setItem("session_id", sessionId);

      const { data, error } = await supabase
        .from("product_interactions")
        .insert({
          product_id: productUuid,
          interaction_type: interactionType,
          variant_id: variantId,
          quantity,
          price,
          session_id: sessionId,
          ip_address: null, // This would be filled by the backend
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });

      if (error) throw new Error(error.message);
      return data;
    },
    onError: (error) => {
      console.error("Analytics tracking error:", error);
      // Fail silently for analytics
    },
  });
}

/**
 * Hook for seller analytics data
 */
export function useSellerAnalytics(period = "daily", days = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-analytics", user?.id, period, days],
    queryFn: async () => {
      if (!user) return null;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const { data, error } = await supabase
        .from("product_analytics")
        .select("*")
        .eq("seller_id", user.seller_id)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user?.seller_id,
  });
}

/**
 * Hook for product analytics (individual product stats)
 */
export function useProductAnalytics(productUuid, days = 30) {
  return useQuery({
    queryKey: ["product-analytics", productUuid, days],
    queryFn: async () => {
      if (
        !productUuid ||
        typeof productUuid !== "string" ||
        productUuid.length !== 36
      )
        return null;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const { data, error } = await supabase
        .from("product_analytics")
        .select("*")
        .eq("product_id", productUuid)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!productUuid,
  });
}

/**
 * Hook for seller analytics summary
 */
export function useSellerAnalyticsSummary(periodType = "monthly") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-analytics-summary", user?.id, periodType],
    queryFn: async () => {
      if (!user?.seller_id) return null;

      const { data, error } = await supabase
        .from("seller_analytics")
        .select("*")
        .eq("seller_id", user.seller_id)
        .eq("period_type", periodType)
        .order("period_start", { ascending: false })
        .limit(12); // Last 12 periods

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user?.seller_id,
  });
}

/**
 * Hook for seller analytics settings
 */
export function useSellerAnalyticsSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-analytics-settings", user?.id],
    queryFn: async () => {
      if (!user?.seller_id) return null;

      const { data, error } = await supabase
        .from("seller_analytics_settings")
        .select("*")
        .eq("seller_id", user.seller_id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new Error(error.message);
      }

      return (
        data || {
          show_total_sales: false,
          show_monthly_sales: false,
          show_product_views: false,
          show_rating_details: true,
          show_response_time: true,
          show_member_since: true,
          alert_low_stock: true,
          low_stock_threshold: 10,
          email_notifications: true,
        }
      );
    },
    enabled: !!user?.seller_id,
  });
}

/**
 * Hook for updating seller analytics settings
 */
export function useUpdateSellerAnalyticsSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings) => {
      const { data, error } = await supabase
        .from("seller_analytics_settings")
        .upsert({
          seller_id: user.seller_id,
          ...settings,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-analytics-settings"]);
      toast.success("Ayarlar başarıyla güncellendi");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });
}

/**
 * Hook for admin analytics (all sellers)
 */
export function useAdminAnalytics(period = "daily", days = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-analytics", period, days],
    queryFn: async () => {
      if (!user || user.role !== "admin") return null;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Get aggregated analytics data
      const { data: analytics, error: analyticsError } = await supabase
        .from("product_analytics")
        .select(
          `
          date,
          seller_id,
          total_views,
          unique_viewers,
          cart_additions,
          wishlist_additions,
          purchases,
          revenue,
          seller:sellers(business_name)
        `
        )
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (analyticsError) throw new Error(analyticsError.message);

      // Get order statistics
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total_amount, created_at, fulfillment_status")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (ordersError) throw new Error(ordersError.message);

      return {
        analytics: analytics || [],
        orders: orders || [],
      };
    },
    enabled: user?.role === "admin",
  });
}

/**
 * Helper hook to track page views automatically
 */
export function useTrackPageView(productUuid) {
  const trackInteraction = useTrackInteraction();

  // Track page view when component mounts
  React.useEffect(() => {
    if (productUuid) {
      trackInteraction.mutate({
        productUuid,
        interactionType: "view",
      });
    }
  }, [productUuid]);
}

/**
 * COMPREHENSIVE PRODUCT & SELLER ALGORITHM SYSTEM
 *
 * This system calculates algorithm scores based on multiple factors:
 * - Sales volume and conversion rates
 * - User interactions (views, cart additions, favorites)
 * - Seller performance metrics
 * - Social signals (reviews, ratings)
 * - Recency and trend factors
 * - Admin boost/penalty settings
 */

/**
 * Hook for fetching algorithm-based product recommendations
 */
export function useAlgorithmProducts(filters = {}) {
  return useQuery({
    queryKey: ["algorithm-products", filters],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(
          `
          id,
          name,
          slug,
          description,
          price,
          discounted_price,
          discount_percentage,
          images,
          stock_quantity,
          average_rating,
          total_reviews,
          created_at,
          updated_at,
          category:categories(id, name, slug),
          seller:sellers(
            id,
            business_name,
            verified,
            avatar_url,
            rating,
            total_sales
          ),
          algorithm_score:product_algorithm_scores(
            total_score,
            sales_score,
            interaction_score,
            social_score,
            recency_score,
            admin_boost,
            calculated_at
          )
        `
        )
        .eq("is_active", true)
        .eq("status", "published");

      // Apply category filter
      if (filters.category) {
        query = query.eq("category.slug", filters.category);
      }

      // Apply price range filter
      if (filters.minPrice) {
        query = query.gte("price", filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte("price", filters.maxPrice);
      }

      // Apply rating filter
      if (filters.minRating) {
        query = query.gte("average_rating", filters.minRating);
      }

      // Apply stock filter
      if (filters.inStock) {
        query = query.gt("stock_quantity", 0);
      }

      // Apply seller filter
      if (filters.sellerId) {
        query = query.eq("seller_id", filters.sellerId);
      }

      // Apply sorting based on algorithm or user preference
      switch (filters.sortBy) {
        case "algorithm":
          query = query.order("algorithm_score.total_score", {
            ascending: false,
          });
          break;
        case "sales":
          query = query.order("algorithm_score.sales_score", {
            ascending: false,
          });
          break;
        case "popularity":
          query = query.order("algorithm_score.interaction_score", {
            ascending: false,
          });
          break;
        case "rating":
          query = query.order("average_rating", { ascending: false });
          break;
        case "price_low":
          query = query.order("price", { ascending: true });
          break;
        case "price_high":
          query = query.order("price", { ascending: false });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        default:
          // Default: Algorithm-based with recency boost
          query = query.order("algorithm_score.total_score", {
            ascending: false,
          });
      }

      // Apply limit
      const limit = filters.limit || 20;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error("Algorithm products fetch error:", error);
        throw new Error("Ürünler yüklenemedi");
      }

      // Post-process to calculate final scores with real-time factors
      return (
        data?.map((product) => ({
          ...product,
          final_algorithm_score: calculateFinalAlgorithmScore(product),
        })) || []
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for recording user interactions (for algorithm)
 */
export function useRecordInteraction() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ type, productUuid, sellerId, metadata = {} }) => {
      if (!user?.id) return; // Anonymous interactions not recorded
      if (
        !productUuid ||
        typeof productUuid !== "string" ||
        productUuid.length !== 36
      )
        return;

      const interactionData = {
        user_id: user.id,
        interaction_type: type, // 'view', 'cart_add', 'favorite', 'purchase', 'review'
        product_id: productUuid,
        seller_id: sellerId || null,
        metadata: metadata,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("product_interactions")
        .insert(interactionData);

      if (error) {
        console.error("Interaction recording error:", error);
        // Don't throw error for interactions, just log
        return;
      }

      // Trigger algorithm score recalculation
      if (productUuid) {
        await supabase.rpc("calculate_product_algorithm_score", {
          product_uuid: productUuid,
        });
      }

      if (sellerId) {
        await supabase.rpc("calculate_seller_algorithm_score", {
          seller_uuid: sellerId,
        });
      }
    },
  });
}

/**
 * Hook for algorithm analytics and insights
 */
export function useAlgorithmAnalytics() {
  return useQuery({
    queryKey: ["algorithm-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_algorithm_analytics");

      if (error) {
        console.error("Algorithm analytics error:", error);
        throw new Error("Algoritma analizi yüklenemedi");
      }

      return (
        data || {
          total_products: 0,
          total_sellers: 0,
          avg_product_score: 0,
          avg_seller_score: 0,
          top_performing_categories: [],
          algorithm_efficiency: 0,
        }
      );
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Algoritmik satıcı öneri sistemi
 * Satıcıları algoritmik olarak sıralar ve döndürür
 */
export function useAlgorithmSellers(filters = {}) {
  return useQuery({
    queryKey: ["algorithm-sellers", filters],
    queryFn: async () => {
      let query = supabase
        .from("sellers")
        .select(
          `
          id,
          business_name,
          verified,
          avatar_url,
          rating,
          total_sales,
          algorithm_score:seller_algorithm_scores(
            total_score,
            sales_score,
            interaction_score,
            social_score,
            recency_score,
            admin_boost,
            calculated_at
          )
        `
        )
        .eq("is_active", true)
        .eq("status", "approved");

      // Filtreler
      if (filters.verified) query = query.eq("verified", true);
      if (filters.minRating) query = query.gte("rating", filters.minRating);
      if (filters.sortBy === "algorithm") {
        query = query.order("algorithm_score.total_score", {
          ascending: false,
        });
      } else if (filters.sortBy === "sales") {
        query = query.order("total_sales", { ascending: false });
      } else if (filters.sortBy === "rating") {
        query = query.order("rating", { ascending: false });
      } else {
        query = query.order("algorithm_score.total_score", {
          ascending: false,
        });
      }
      const limit = filters.limit || 12;
      query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Utility Functions for Real-time Score Calculation

function calculateFinalAlgorithmScore(product) {
  const algorithmScore = product.algorithm_score || {};

  // Base scores
  let salesScore = algorithmScore.sales_score || 0;
  let interactionScore = algorithmScore.interaction_score || 0;
  let socialScore = algorithmScore.social_score || 0;
  let recencyScore = algorithmScore.recency_score || 0;
  let adminBoost = algorithmScore.admin_boost || 0;

  // Real-time adjustments

  // Stock penalty
  let stockPenalty = 0;
  if (product.stock_quantity === 0) {
    stockPenalty = -50; // Heavy penalty for out of stock
  } else if (product.stock_quantity < 5) {
    stockPenalty = -10; // Light penalty for low stock
  }

  // Discount boost
  let discountBoost = 0;
  if (product.discount_percentage > 0) {
    discountBoost = Math.min(product.discount_percentage * 0.5, 25); // Max 25 points
  }

  // Rating boost
  let ratingBoost = 0;
  if (product.average_rating >= 4.5) {
    ratingBoost = 15;
  } else if (product.average_rating >= 4.0) {
    ratingBoost = 10;
  } else if (product.average_rating >= 3.5) {
    ratingBoost = 5;
  }

  // Review count boost
  let reviewBoost = 0;
  if (product.total_reviews >= 100) {
    reviewBoost = 20;
  } else if (product.total_reviews >= 50) {
    reviewBoost = 15;
  } else if (product.total_reviews >= 20) {
    reviewBoost = 10;
  } else if (product.total_reviews >= 5) {
    reviewBoost = 5;
  }

  // Seller verification boost
  let sellerBoost = 0;
  if (product.seller?.verified) {
    sellerBoost = 10;
  }

  // Calculate final score
  const finalScore =
    salesScore * 0.3 + // 30% weight
    interactionScore * 0.25 + // 25% weight
    socialScore * 0.2 + // 20% weight
    recencyScore * 0.15 + // 15% weight
    adminBoost * 0.1 + // 10% weight
    stockPenalty +
    discountBoost +
    ratingBoost +
    reviewBoost +
    sellerBoost;

  return Math.max(0, Math.min(1000, finalScore)); // Clamp between 0-1000
}

/**
 * Main analytics hook that provides tracking functionality
 */
export function useAnalytics() {
  const trackEvent = useCallback((eventType, eventData) => {
    // Simple event tracking - can be enhanced later
    console.log("Analytics Event:", eventType, eventData);

    // In a real implementation, this would send to analytics service
    // For now, just log the event
  }, []);

  return {
    trackEvent,
    trackInteraction: useTrackInteraction(),
    sellerAnalytics: useSellerAnalytics(),
    productAnalytics: useProductAnalytics,
    adminAnalytics: useAdminAnalytics,
    algorithmProducts: useAlgorithmProducts,
    algorithmSellers: useAlgorithmSellers,
  };
}
