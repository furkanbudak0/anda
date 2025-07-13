/**
 * ADVANCED PRODUCT RECOMMENDATION ALGORITHM
 *
 * Ultra-sophisticated product ranking system for ANDA e-commerce platform.
 * Uses multiple factors including user behavior, sales data, inventory,
 * seller performance, and admin priorities.
 *
 * Features:
 * - Multi-factor scoring system
 * - Real-time trending detection
 * - Seasonal adjustments
 * - Personalization support
 * - A/B testing integration
 * - Performance analytics
 */

// Algorithm configuration weights (can be adjusted by admin)
export const ALGORITHM_WEIGHTS = {
  // Sales performance (40% total weight)
  SALES_VELOCITY: 0.15, // Recent sales trend
  CONVERSION_RATE: 0.12, // Views to purchase ratio
  REVENUE_CONTRIBUTION: 0.08, // Total revenue impact
  AVERAGE_ORDER_VALUE: 0.05, // AOV impact

  // User engagement (25% total weight)
  VIEW_COUNT: 0.08, // Total views
  WISHLIST_ADDITIONS: 0.06, // Favorilere eklenme
  CART_ADDITIONS: 0.05, // Sepete eklenme
  SOCIAL_SIGNALS: 0.03, // Paylaşım, yorum vb.
  CLICK_THROUGH_RATE: 0.03, // CTR from listings

  // Inventory & logistics (15% total weight)
  STOCK_LEVEL: 0.06, // Stock availability
  FULFILLMENT_SPEED: 0.04, // Shipping performance
  RETURN_RATE: 0.03, // Quality indicator (inverse)
  INVENTORY_TURNOVER: 0.02, // Stock movement

  // Seller performance (10% total weight)
  SELLER_RATING: 0.04, // Seller score
  SELLER_RESPONSE_TIME: 0.03, // Customer service
  SELLER_FULFILLMENT: 0.03, // Order processing speed

  // Content quality (5% total weight)
  IMAGE_QUALITY: 0.02, // Product images
  DESCRIPTION_COMPLETENESS: 0.02, // Product info
  REVIEW_QUALITY: 0.01, // Review scores

  // Admin controls (5% total weight)
  ADMIN_BOOST: 0.03, // Manual promotion
  CAMPAIGN_PRIORITY: 0.02, // Campaign participation
};

// Time decay factors for scoring
const TIME_DECAY = {
  HOUR: 1.0,
  DAY: 0.9,
  WEEK: 0.7,
  MONTH: 0.4,
  QUARTER: 0.2,
};

/**
 * Main algorithm class for product recommendations
 */
export class ProductRecommendationEngine {
  constructor() {
    this.weights = { ...ALGORITHM_WEIGHTS };
    this.categories = new Map();
    this.userProfiles = new Map();
    this.seasonalFactors = new Map();
    this.abTestGroups = new Map();
  }

  /**
   * Calculate comprehensive product score
   */
  calculateProductScore(product, context = {}) {
    const scores = {
      sales: this.calculateSalesScore(product, context),
      engagement: this.calculateEngagementScore(product, context),
      inventory: this.calculateInventoryScore(product, context),
      seller: this.calculateSellerScore(product, context),
      content: this.calculateContentScore(product, context),
      admin: this.calculateAdminScore(product, context),
    };

    // Apply time decay
    const timeDecay = this.calculateTimeDecay(product.created_at);

    // Apply seasonal factors
    const seasonalBoost = this.getSeasonalBoost(product, context);

    // Apply personalization
    const personalizationBoost = this.getPersonalizationBoost(
      product,
      context.user
    );

    // Calculate weighted final score
    let finalScore = 0;
    finalScore += scores.sales * 0.4; // 40% sales performance
    finalScore += scores.engagement * 0.25; // 25% user engagement
    finalScore += scores.inventory * 0.15; // 15% inventory factors
    finalScore += scores.seller * 0.1; // 10% seller performance
    finalScore += scores.content * 0.05; // 5% content quality
    finalScore += scores.admin * 0.05; // 5% admin controls

    // Apply multipliers
    finalScore *= timeDecay;
    finalScore *= seasonalBoost;
    finalScore *= personalizationBoost;

    // Normalize to 0-100 range
    finalScore = Math.min(100, Math.max(0, finalScore * 100));

    return {
      score: finalScore,
      breakdown: scores,
      multipliers: {
        timeDecay,
        seasonalBoost,
        personalizationBoost,
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: "2.0",
        context: context.type || "general",
      },
    };
  }

  /**
   * Sales performance scoring (0-1 scale)
   */
  calculateSalesScore(product, context) {
    const stats = product.analytics || {};

    // Sales velocity (recent vs historical)
    const recentSales = stats.sales_last_7_days || 0;
    const historicalSales = stats.sales_last_30_days || 0;
    const salesVelocity =
      historicalSales > 0
        ? (recentSales * 4.3) / historicalSales // 7*4.3 ≈ 30 days
        : Math.min(recentSales / 10, 1); // New product scoring

    // Conversion rate
    const views = stats.views_last_30_days || 1;
    const purchases = stats.purchases_last_30_days || 0;
    const conversionRate = purchases / views;

    // Revenue contribution
    const totalRevenue = stats.total_revenue || 0;
    const avgMarketRevenue = context.avgMarketRevenue || 1000; // fallback
    const revenueScore = Math.min(totalRevenue / avgMarketRevenue, 1);

    // Average order value impact
    const avgOrderValue = stats.avg_order_value || product.price || 0;
    const marketAvgOrderValue = context.marketAvgOrderValue || 500; // fallback
    const aovScore = Math.min(avgOrderValue / marketAvgOrderValue, 1);

    return {
      velocity: salesVelocity,
      conversion: conversionRate * 100, // Scale up conversion
      revenue: revenueScore,
      aov: aovScore,
      combined:
        salesVelocity * 0.4 +
        conversionRate * 30 * 0.3 +
        revenueScore * 0.2 +
        aovScore * 0.1,
    };
  }

  /**
   * User engagement scoring
   */
  calculateEngagementScore(product, context) {
    const stats = product.analytics || {};

    // View metrics
    const views = stats.views_last_30_days || 0;
    const uniqueViews = stats.unique_views_last_30_days || views;
    const avgMarketViews = context.avgMarketViews || 100;
    const viewScore = Math.min(views / avgMarketViews, 1);

    // Wishlist additions
    const wishlistAdds = stats.wishlist_additions_last_30_days || 0;
    const wishlistRate = views > 0 ? wishlistAdds / views : 0;

    // Cart additions
    const cartAdds = stats.cart_additions_last_30_days || 0;
    const cartRate = views > 0 ? cartAdds / views : 0;

    // Social engagement
    const shares = stats.social_shares || 0;
    const socialScore = Math.min(shares / 10, 1); // Scale to 10 shares max

    // Click-through rate from listings
    const impressions = stats.listing_impressions || 1;
    const clicks = stats.listing_clicks || 0;
    const ctr = clicks / impressions;

    return {
      views: viewScore,
      wishlist: wishlistRate * 10, // Scale up
      cart: cartRate * 5, // Scale up
      social: socialScore,
      ctr: ctr * 20, // Scale up CTR
      combined:
        viewScore * 0.3 +
        wishlistRate * 10 * 0.25 +
        cartRate * 5 * 0.25 +
        socialScore * 0.1 +
        ctr * 20 * 0.1,
    };
  }

  /**
   * Inventory and logistics scoring
   */
  calculateInventoryScore(product, context) {
    // Stock level
    const stockLevel = product.stock_quantity || 0;
    const optimalStock = context.optimalStock || 50;
    const stockScore =
      stockLevel > optimalStock ? 1 : stockLevel / optimalStock;

    // Fulfillment speed
    const avgShippingDays = product.avg_shipping_days || 7;
    const speedScore = Math.max(0, (7 - avgShippingDays) / 7); // Better with faster shipping

    // Return rate (inverse scoring)
    const returnRate = product.return_rate || 0;
    const returnScore = Math.max(0, 1 - returnRate); // Lower returns = higher score

    // Inventory turnover
    const turnoverRate = product.inventory_turnover || 0;
    const turnoverScore = Math.min(turnoverRate / 12, 1); // Monthly turnover

    return {
      stock: stockScore,
      speed: speedScore,
      returns: returnScore,
      turnover: turnoverScore,
      combined:
        stockScore * 0.4 +
        speedScore * 0.3 +
        returnScore * 0.2 +
        turnoverScore * 0.1,
    };
  }

  /**
   * Seller performance scoring
   */
  calculateSellerScore(product, context) {
    const seller = product.seller || {};

    // Seller rating
    const rating = seller.rating || 3;
    const ratingScore = (rating - 1) / 4; // Scale 1-5 to 0-1

    // Response time
    const responseHours = seller.avg_response_time_hours || 24;
    const responseScore = Math.max(0, (24 - responseHours) / 24); // Better with faster response

    // Fulfillment speed
    const fulfillmentHours = seller.avg_fulfillment_hours || 48;
    const fulfillmentScore = Math.max(0, (48 - fulfillmentHours) / 48);

    return {
      rating: ratingScore,
      response: responseScore,
      fulfillment: fulfillmentScore,
      combined:
        ratingScore * 0.5 + responseScore * 0.25 + fulfillmentScore * 0.25,
    };
  }

  /**
   * Content quality scoring
   */
  calculateContentScore(product, context) {
    // Image quality (based on count and resolution data)
    const imageCount = product.images?.length || 0;
    const imageScore = Math.min(imageCount / 5, 1); // Optimal at 5+ images

    // Description completeness
    const description = product.description || "";
    const descriptionScore = Math.min(description.length / 500, 1); // 500 chars optimal

    // Review quality
    const avgReviewRating = product.avg_rating || 3;
    const reviewScore = (avgReviewRating - 1) / 4; // Scale 1-5 to 0-1

    return {
      images: imageScore,
      description: descriptionScore,
      reviews: reviewScore,
      combined: imageScore * 0.4 + descriptionScore * 0.4 + reviewScore * 0.2,
    };
  }

  /**
   * Admin controls scoring
   */
  calculateAdminScore(product, context) {
    // Manual admin boost
    const adminBoost = product.admin_boost || 0; // 0-1 scale set by admin

    // Campaign participation
    const isInCampaign = product.campaigns?.length > 0;
    const campaignPriority = isInCampaign
      ? Math.max(...product.campaigns.map((c) => c.priority || 0)) / 10
      : 0; // Scale 0-10 to 0-1

    return {
      boost: adminBoost,
      campaign: campaignPriority,
      combined: adminBoost * 0.6 + campaignPriority * 0.4,
    };
  }

  /**
   * Time-based decay calculation
   */
  calculateTimeDecay(createdAt) {
    if (!createdAt) return TIME_DECAY.MONTH;

    const now = new Date();
    const created = new Date(createdAt);
    const ageInDays = (now - created) / (1000 * 60 * 60 * 24);

    if (ageInDays <= 1) return TIME_DECAY.DAY;
    if (ageInDays <= 7) return TIME_DECAY.WEEK;
    if (ageInDays <= 30) return TIME_DECAY.MONTH;
    if (ageInDays <= 90) return TIME_DECAY.QUARTER;

    return TIME_DECAY.QUARTER * 0.5; // Very old products get lower boost
  }

  /**
   * Seasonal boost calculation
   */
  getSeasonalBoost(product, context) {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const category = product.category_slug || "";

    // Seasonal mappings
    const seasonalBoosts = {
      // Winter products (Dec, Jan, Feb)
      "giyim-mont-kaban": currentMonth >= 12 || currentMonth <= 2 ? 1.3 : 0.8,
      "ayakkabi-bot": currentMonth >= 12 || currentMonth <= 2 ? 1.2 : 0.9,

      // Summer products (Jun, Jul, Aug)
      "giyim-mayo-bikini": currentMonth >= 6 && currentMonth <= 8 ? 1.4 : 0.7,
      "giyim-sort": currentMonth >= 6 && currentMonth <= 8 ? 1.2 : 0.9,

      // Back to school (Aug, Sep)
      "elektronik-bilgisayar":
        currentMonth >= 8 && currentMonth <= 9 ? 1.2 : 1.0,
      "kitap-kirtasiye": currentMonth >= 8 && currentMonth <= 9 ? 1.3 : 1.0,

      // Holiday season (Nov, Dec)
      hediye: currentMonth >= 11 ? 1.4 : 1.0,
      elektronik: currentMonth >= 11 ? 1.2 : 1.0,
    };

    return seasonalBoosts[category] || 1.0;
  }

  /**
   * Personalization boost based on user behavior
   */
  getPersonalizationBoost(product, user) {
    if (!user) return 1.0;

    const userProfile = this.userProfiles.get(user.id) || {};
    const boost = 1.0;

    // Category preference boost
    const viewedCategories = userProfile.viewedCategories || {};
    const categoryViews = viewedCategories[product.category_slug] || 0;
    const totalViews = Object.values(viewedCategories).reduce(
      (a, b) => a + b,
      1
    );
    const categoryPreference = categoryViews / totalViews;

    // Price range preference
    const userAvgPrice = userProfile.avgPriceRange || 500;
    const productPrice = product.price || 0;
    const priceDistance = Math.abs(productPrice - userAvgPrice) / userAvgPrice;
    const pricePreference = Math.max(0.5, 1 - priceDistance); // Min 0.5x boost

    // Brand preference
    const viewedBrands = userProfile.viewedBrands || {};
    const brandViews = viewedBrands[product.brand] || 0;
    const brandPreference = brandViews > 0 ? 1.1 : 1.0;

    return (
      boost * (1 + categoryPreference * 0.3) * pricePreference * brandPreference
    );
  }

  /**
   * Get trending products using velocity analysis
   */
  getTrendingProducts(products, limit = 20) {
    return products
      .map((product) => ({
        ...product,
        trendingScore: this.calculateTrendingScore(product),
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  }

  /**
   * Calculate trending score for velocity detection
   */
  calculateTrendingScore(product) {
    const stats = product.analytics || {};

    // Recent activity vs historical
    const recent7Days = stats.views_last_7_days || 0;
    const previous7Days = stats.views_previous_7_days || 1;
    const viewsVelocity = recent7Days / previous7Days;

    const recentSales = stats.sales_last_7_days || 0;
    const previousSales = stats.sales_previous_7_days || 1;
    const salesVelocity = recentSales / previousSales;

    const recentWishlists = stats.wishlist_additions_last_7_days || 0;
    const previousWishlists = stats.wishlist_additions_previous_7_days || 1;
    const wishlistVelocity = recentWishlists / previousWishlists;

    // Combined trending score
    return viewsVelocity * 0.4 + salesVelocity * 0.4 + wishlistVelocity * 0.2;
  }

  /**
   * Get personalized recommendations for a user
   */
  getPersonalizedRecommendations(products, user, limit = 20) {
    const context = {
      type: "personalized",
      user,
      avgMarketViews: 100,
      avgMarketRevenue: 1000,
      marketAvgOrderValue: 500,
      optimalStock: 50,
    };

    return products
      .map((product) => ({
        ...product,
        recommendation: this.calculateProductScore(product, context),
      }))
      .sort((a, b) => b.recommendation.score - a.recommendation.score)
      .slice(0, limit);
  }

  /**
   * Get category-specific recommendations
   */
  getCategoryRecommendations(products, categorySlug, limit = 20) {
    const categoryProducts = products.filter(
      (p) =>
        p.category_slug === categorySlug || p.subcategory_slug === categorySlug
    );

    const context = {
      type: "category",
      category: categorySlug,
      avgMarketViews: 80,
      avgMarketRevenue: 800,
      marketAvgOrderValue: 400,
      optimalStock: 30,
    };

    return categoryProducts
      .map((product) => ({
        ...product,
        recommendation: this.calculateProductScore(product, context),
      }))
      .sort((a, b) => b.recommendation.score - a.recommendation.score)
      .slice(0, limit);
  }

  /**
   * Update user profile based on behavior
   */
  updateUserProfile(userId, behavior) {
    const profile = this.userProfiles.get(userId) || {
      viewedCategories: {},
      viewedBrands: {},
      purchaseHistory: [],
      avgPriceRange: 500,
      lastActivity: new Date(),
    };

    // Update based on behavior type
    switch (behavior.type) {
      case "view":
        profile.viewedCategories[behavior.categorySlug] =
          (profile.viewedCategories[behavior.categorySlug] || 0) + 1;
        if (behavior.brand) {
          profile.viewedBrands[behavior.brand] =
            (profile.viewedBrands[behavior.brand] || 0) + 1;
        }
        break;

      case "purchase":
        profile.purchaseHistory.push(behavior);
        // Recalculate average price range
        const prices = profile.purchaseHistory.map((p) => p.price || 0);
        profile.avgPriceRange =
          prices.reduce((a, b) => a + b, 0) / prices.length;
        break;
    }

    profile.lastActivity = new Date();
    this.userProfiles.set(userId, profile);
  }

  /**
   * A/B testing support
   */
  getABTestVariant(userId, testName) {
    const hash = this.simpleHash(userId + testName);
    return hash % 2 === 0 ? "A" : "B";
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Global algorithm instance
export const recommendationEngine = new ProductRecommendationEngine();

// Utility functions for easy integration
export const getRecommendedProducts = (products, context = {}) => {
  return recommendationEngine.getPersonalizedRecommendations(
    products,
    context.user
  );
};

export const getTrendingProducts = (products, limit = 20) => {
  return recommendationEngine.getTrendingProducts(products, limit);
};

export const getCategoryProducts = (products, categorySlug, limit = 20) => {
  return recommendationEngine.getCategoryRecommendations(
    products,
    categorySlug,
    limit
  );
};

export const updateUserBehavior = (userId, behavior) => {
  return recommendationEngine.updateUserProfile(userId, behavior);
};

// Algorithm performance analytics
export const getAlgorithmAnalytics = () => {
  return {
    weights: recommendationEngine.weights,
    activeUsers: recommendationEngine.userProfiles.size,
    seasonalFactors: Object.fromEntries(recommendationEngine.seasonalFactors),
    version: "2.0",
    lastUpdated: new Date().toISOString(),
  };
};

export default recommendationEngine;
