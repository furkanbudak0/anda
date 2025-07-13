/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  HeartIcon as HeartOutline,
  ShoppingCartIcon,
  EyeIcon,
  StarIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  TrophyIcon,
  ChartBarIcon,
  BoltIcon,
  ClockIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { notifications } from "../utils/notifications";

/**
 * ULTRA-MODERN PRODUCT CARD WITH ALGORITHM INTEGRATION
 *
 * Enhanced with algorithm integration, tier systems, and performance analytics.
 *
 * New Features:
 * - Tier-based visual hierarchy (champion, strong, emerging, ultra-fresh, etc.)
 * - Performance metrics visualization
 * - Freshness indicators for new products
 * - Algorithm score displays
 * - Enhanced badge system
 * - Dynamic color schemes per tier
 */

const ProductCard = ({
  product,
  className = "",
  showCampaignBadge = false,
  campaignInfo = null,
  showRecommendationScore = false,
  recommendationData = null,
  showTrendingBadge = false,
  trendingScore = 0,
  // New algorithm features
  showPerformanceMetrics = false,
  showFreshnessMetrics = false,
  tier = null, // champion, strong, emerging, ultra-fresh, trending-new, promising
  ...props
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  const { user } = useAuth();
  const { addToCart } = useCart();

  // Enhanced 3D hover effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]));
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]));
  const scale = useSpring(1);

  // Intersection Observer for performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Enhanced mouse interaction
  const handleMouseMove = (event) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
  };

  const handleMouseEnter = () => {
    scale.set(
      tier === "champion" ? 1.05 : tier === "ultra-fresh" ? 1.04 : 1.02
    );
  };

  // Wishlist functionality
  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      notifications.warning("Favorilere eklemek için giriş yapmalısınız");
      return;
    }

    try {
      setIsWishlisted(!isWishlisted);
      notifications.ecommerce.addToWishlist(product.name);
    } catch (error) {
      console.error("Wishlist error:", error);
      setIsWishlisted(false);
      notifications.error("Favorilere eklenirken hata oluştu");
    }
  };

  // Add to cart with enhanced feedback
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addToCart(product);
      notifications.ecommerce.addToCart(product.name);

      // Haptic feedback on mobile
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      notifications.error("Sepete eklenirken hata oluştu");
    }
  };

  // Image navigation
  const handleImageNavigation = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  // Enhanced image handling
  const images = product.images || ["/images/placeholder.jpg"];
  const currentImage = images[currentImageIndex] || images[0];

  // Price calculations
  const hasDiscount = product.discount_percentage > 0;
  const discountedPrice = hasDiscount
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  // Enhanced rating display
  const rating = product.avg_rating || 0;
  const reviewCount = product.review_count || 0;
  const filledStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Tier-based styling
  const getTierStyling = (tier) => {
    switch (tier) {
      case "champion":
        return {
          borderColor: "border-yellow-400",
          bgColor: "from-yellow-50 to-orange-50",
          badgeColor: "from-yellow-400 to-orange-500",
          shadowColor: "shadow-yellow-200/50",
          glowColor: "drop-shadow-lg drop-shadow-yellow-200/50",
        };
      case "strong":
        return {
          borderColor: "border-orange-300",
          bgColor: "from-orange-50 to-red-50",
          badgeColor: "from-orange-400 to-red-500",
          shadowColor: "shadow-orange-200/50",
          glowColor: "drop-shadow-lg drop-shadow-orange-200/50",
        };
      case "emerging":
        return {
          borderColor: "border-blue-300",
          bgColor: "from-blue-50 to-purple-50",
          badgeColor: "from-blue-400 to-purple-500",
          shadowColor: "shadow-blue-200/50",
          glowColor: "drop-shadow-lg drop-shadow-blue-200/50",
        };
      case "ultra-fresh":
        return {
          borderColor: "border-green-300",
          bgColor: "from-green-50 to-blue-50",
          badgeColor: "from-green-400 to-blue-500",
          shadowColor: "shadow-green-200/50",
          glowColor: "drop-shadow-lg drop-shadow-green-200/50",
        };
      case "trending-new":
        return {
          borderColor: "border-purple-300",
          bgColor: "from-purple-50 to-pink-50",
          badgeColor: "from-purple-400 to-pink-500",
          shadowColor: "shadow-purple-200/50",
          glowColor: "drop-shadow-lg drop-shadow-purple-200/50",
        };
      case "promising":
        return {
          borderColor: "border-indigo-300",
          bgColor: "from-indigo-50 to-blue-50",
          badgeColor: "from-indigo-400 to-blue-500",
          shadowColor: "shadow-indigo-200/50",
          glowColor: "drop-shadow-lg drop-shadow-indigo-200/50",
        };
      default:
        return {
          borderColor: "border-gray-200",
          bgColor: "from-white to-gray-50",
          badgeColor: "from-gray-400 to-gray-600",
          shadowColor: "shadow-gray-200/50",
          glowColor: "",
        };
    }
  };

  // Tier badge configuration
  const getTierBadge = (tier) => {
    switch (tier) {
      case "champion":
        return { icon: TrophyIcon, text: "Şampiyon", emoji: "🏆" };
      case "strong":
        return { icon: ChartBarIcon, text: "Güçlü", emoji: "🚀" };
      case "emerging":
        return { icon: ArrowTrendingUpIcon, text: "Yükseliyor", emoji: "⭐" };
      case "ultra-fresh":
        return { icon: BoltIcon, text: "Ultra Taze", emoji: "⚡" };
      case "trending-new":
        return { icon: GiftIcon, text: "Trend", emoji: "🔥" };
      case "promising":
        return { icon: StarIcon, text: "Umut Vadeden", emoji: "🌟" };
      default:
        return null;
    }
  };

  const tierStyling = getTierStyling(tier);
  const tierBadge = getTierBadge(tier);

  if (!isVisible) {
    return (
      <div
        ref={cardRef}
        className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
      />
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className={`group relative bg-gradient-to-br ${tierStyling.bgColor} dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl ${tierStyling.shadowColor} border-2 ${tierStyling.borderColor} transition-all duration-300 overflow-hidden ${className}`}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      {...props}
    >
      {/* Tier Badge */}
      {tierBadge && (
        <div
          className={`absolute top-3 left-3 z-20 px-3 py-1 bg-gradient-to-r ${tierStyling.badgeColor} text-white text-xs font-bold rounded-full flex items-center gap-1 ${tierStyling.glowColor}`}
        >
          <tierBadge.icon className="w-3 h-3" />
          <span>{tierBadge.text}</span>
          <span>{tierBadge.emoji}</span>
        </div>
      )}

      {/* Campaign Badge */}
      {showCampaignBadge && campaignInfo && (
        <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
          <SparklesIcon className="w-3 h-3" />
          <span>Kampanya</span>
        </div>
      )}

      {/* Trending Badge */}
      {showTrendingBadge && trendingScore > 50 && (
        <div className="absolute top-12 left-3 z-10 px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
          <FireIcon className="w-3 h-3" />
          <span>Trend</span>
        </div>
      )}

      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-3 right-14 z-10 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
          %{Math.round(product.discount_percentage)} İndirim
        </div>
      )}

      {/* Wishlist Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleWishlist}
        className="absolute top-3 right-3 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200"
        aria-label={isWishlisted ? "Favorilerden çıkar" : "Favorilere ekle"}
      >
        {isWishlisted ? (
          <HeartSolid className="w-5 h-5 text-red-500" />
        ) : (
          <HeartOutline className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors" />
        )}
      </motion.button>

      {/* Enhanced Image Container */}
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-gray-700">
          {/* Main Image */}
          <motion.img
            src={imageError ? "/images/placeholder.jpg" : currentImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
            style={{
              transform: "translateZ(20px)",
            }}
            loading="lazy"
          />

          {/* Image Navigation Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => handleImageNavigation(index, e)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentImageIndex
                      ? "bg-white scale-125"
                      : "bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Image ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200"
                aria-label="Hızlı görünüm"
              >
                <EyeIcon className="w-5 h-5 text-gray-700" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Sepete ekle"
              >
                <ShoppingCartIcon className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Enhanced Product Info */}
        <div className="p-4 space-y-3">
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>

          {/* Seller Info */}
          {product.seller && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Satıcı:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {product.seller.store_name ||
                  product.seller.business_name ||
                  product.seller.name}
              </span>
            </div>
          )}

          {/* Enhanced Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, index) => (
                <StarIcon
                  key={index}
                  className={`w-4 h-4 ${
                    index < filledStars
                      ? "text-yellow-400 fill-current"
                      : index === filledStars && hasHalfStar
                      ? "text-yellow-400 fill-current opacity-50"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {rating > 0
                ? `${rating.toFixed(1)} (${reviewCount})`
                : "Değerlendirme yok"}
            </span>
          </div>

          {/* Enhanced Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {discountedPrice.toLocaleString("tr-TR")} ₺
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {product.price.toLocaleString("tr-TR")} ₺
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {product.price.toLocaleString("tr-TR")} ₺
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="text-sm">
              {product.stock_quantity > 0 ? (
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Stokta
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Tükendi
                </span>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          {showPerformanceMetrics && product.performanceMetrics && (
            <div className="bg-gray-50/80 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                📊 Performans Metrikleri
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Satış:
                  </span>
                  <span className="font-medium">
                    {product.performanceMetrics.salesCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Görüntülenme:
                  </span>
                  <span className="font-medium">
                    {product.performanceMetrics.viewCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Dönüşüm:
                  </span>
                  <span className="font-medium">
                    %
                    {(product.performanceMetrics.conversionRate || 0).toFixed(
                      1
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Etkileşim:
                  </span>
                  <span className="font-medium">
                    %
                    {(product.performanceMetrics.engagementRate || 0).toFixed(
                      1
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Freshness Metrics */}
          {showFreshnessMetrics && product.performanceMetrics && (
            <div className="bg-green-50/80 dark:bg-green-900/20 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                Tazelik Metrikleri
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Yaş:</span>
                  <span className="font-medium">
                    {product.performanceMetrics.ageInDays || 0} gün
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Stok:
                  </span>
                  <span className="font-medium">
                    {product.performanceMetrics.stockLevel || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    İlk Satış:
                  </span>
                  <span className="font-medium">
                    {product.performanceMetrics.salesCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    İndirim:
                  </span>
                  <span className="font-medium">
                    {product.performanceMetrics.hasDiscount ? "✅" : "❌"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Info */}
          {showCampaignBadge && campaignInfo && (
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-purple-50/80 dark:bg-purple-900/20 rounded-lg p-2">
              <div className="flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" />
                Kampanya: {campaignInfo.title}
              </div>
            </div>
          )}

          {/* Recommendation Breakdown (Development) */}
          {showRecommendationScore &&
            recommendationData &&
            import.meta.env.DEV && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">
                  Algorithm Details
                </summary>
                <div className="mt-2 space-y-1 pl-3 border-l-2 border-gray-200">
                  <div>
                    Sales:{" "}
                    {Math.round(
                      recommendationData.breakdown?.sales?.combined * 100
                    ) || 0}
                    %
                  </div>
                  <div>
                    Engagement:{" "}
                    {Math.round(
                      recommendationData.breakdown?.engagement?.combined * 100
                    ) || 0}
                    %
                  </div>
                  <div>
                    Inventory:{" "}
                    {Math.round(
                      recommendationData.breakdown?.inventory?.combined * 100
                    ) || 0}
                    %
                  </div>
                  <div>Final: {Math.round(recommendationData.score)}%</div>
                </div>
              </details>
            )}
        </div>
      </Link>

      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default ProductCard;
