import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAnalytics } from "./useAnalytics";

/**
 * Hook for tracking product-related events
 * Provides functions to track various product interactions
 */
export const useTrackProductEvent = () => {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  /**
   * Track product view event
   */
  const trackProductView = useCallback(
    (product) => {
      if (!product?.uuid) return;

      trackEvent("product_view", {
        product_id: product.uuid,
        product_name: product.name,
        product_category: product.category,
        product_price: product.price,
        seller_id: product.seller_id,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, user?.id]
  );

  /**
   * Track product click event
   */
  const trackProductClick = useCallback(
    (product, source = "unknown") => {
      if (!product?.uuid) return;

      trackEvent("product_click", {
        product_id: product.uuid,
        product_name: product.name,
        product_category: product.category,
        product_price: product.price,
        seller_id: product.seller_id,
        source: source, // 'search', 'category', 'carousel', 'recommendation', etc.
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, user?.id]
  );

  /**
   * Track add to cart event
   */
  const trackAddToCart = useCallback(
    (product, quantity = 1) => {
      if (!product?.uuid) return;

      trackEvent("add_to_cart", {
        product_id: product.uuid,
        product_name: product.name,
        product_category: product.category,
        product_price: product.price,
        seller_id: product.seller_id,
        quantity: quantity,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, user?.id]
  );

  /**
   * Track add to wishlist event
   */
  const trackAddToWishlist = useCallback(
    (product) => {
      if (!product?.uuid) return;

      trackEvent("add_to_wishlist", {
        product_id: product.uuid,
        product_name: product.name,
        product_category: product.category,
        product_price: product.price,
        seller_id: product.seller_id,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, user?.id]
  );

  /**
   * Track product search event
   */
  const trackProductSearch = useCallback(
    (searchTerm, resultsCount = 0) => {
      trackEvent("product_search", {
        search_term: searchTerm,
        results_count: resultsCount,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, user?.id]
  );

  /**
   * Track category view event
   */
  const trackCategoryView = useCallback(
    (category) => {
      if (!category) return;

      trackEvent("category_view", {
        category_id: category.id,
        category_name: category.name,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, user?.id]
  );

  /**
   * Track product review event
   */
  const trackProductReview = useCallback(
    (product, rating, hasComment = false) => {
      if (!product?.uuid) return;

      trackEvent("product_review", {
        product_id: product.uuid,
        product_name: product.name,
        product_category: product.category,
        seller_id: product.seller_id,
        rating: rating,
        has_comment: hasComment,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, user?.id]
  );

  /**
   * Track product share event
   */
  const trackProductShare = useCallback(
    (product, platform) => {
      if (!product?.uuid) return;

      trackEvent("product_share", {
        product_id: product.uuid,
        product_name: product.name,
        product_category: product.category,
        seller_id: product.seller_id,
        platform: platform, // 'facebook', 'twitter', 'whatsapp', etc.
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, user?.id]
  );

  /**
   * Track product comparison event
   */
  const trackProductComparison = useCallback(
    (products) => {
      if (!products || products.length < 2) return;

      trackEvent("product_comparison", {
        product_ids: products.map((p) => p.uuid),
        product_names: products.map((p) => p.name),
        comparison_count: products.length,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, user?.id]
  );

  /**
   * Track product filter usage
   */
  const trackProductFilter = useCallback(
    (filters) => {
      trackEvent("product_filter", {
        filters: filters,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, user?.id]
  );

  /**
   * Track product sort usage
   */
  const trackProductSort = useCallback(
    (sortBy, sortOrder) => {
      trackEvent("product_sort", {
        sort_by: sortBy,
        sort_order: sortOrder,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [trackEvent, user?.id]
  );

  return {
    trackProductView,
    trackProductClick,
    trackAddToCart,
    trackAddToWishlist,
    trackProductSearch,
    trackCategoryView,
    trackProductReview,
    trackProductShare,
    trackProductComparison,
    trackProductFilter,
    trackProductSort,
  };
};

/**
 * Advanced product event tracking hook with simplified interface
 */
export const useTrackProductEventAdvanced = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(
    ({ productId, sellerId, eventType, additionalData = {} }) => {
      // Simple event tracking for MVP
      console.log("Advanced Product Event:", {
        productId,
        sellerId,
        eventType,
        userId: user?.id,
        timestamp: new Date().toISOString(),
        ...additionalData,
      });

      // In a real implementation, this would send to analytics service
      // For now, just log the event
    },
    [user?.id]
  );

  return trackEvent;
};
