import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiProducts } from "../services/apiProducts";
import { supabase } from "../services/supabase";
import {
  useFeaturedProducts,
  useNewArrivals,
  useBestSellers,
} from "../hooks/useProducts";
import NavBar from "../components/NavBar";
import { HomepageSEO } from "../components/SEO";
import ProductCard from "../components/ProductCard";
import RecentlyViewedProducts from "../components/RecentlyViewedProducts";
import Spinner from "../components/Spinner";
import { useLocation, Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightIcon,
  SparklesIcon,
  FireIcon,
  ClockIcon,
  TagIcon,
  ArrowTrendingUpIcon,
  GiftIcon,
  ShoppingBagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  HeartIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import {
  useAlgorithmProducts,
  useAlgorithmSellers,
  useTrendingProducts,
  usePersonalizedRecommendations,
} from "../hooks/useAnalytics";

const Homepage = () => {
  const location = useLocation();
  const message = location.state?.message;
  const [currentCampaignIndex, setCampaignIndex] = useState(0);
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollContainerRef = useRef();

  // Intersection observer for infinite scroll
  const { ref: infiniteRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: "100px",
  });

  // Fetch different product sections
  const { data: featuredProducts, isLoading: featuredLoading } =
    useFeaturedProducts(8);
  const { data: newProducts, isLoading: newLoading } = useNewArrivals(8);
  const { data: bestSellers, isLoading: bestLoading } = useBestSellers(8);

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_campaigns")
        .select("*")
        .eq("is_active", true)
        .eq("show_on_homepage", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString())
        .order("display_order");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch personalized recommendations
  const { data: personalizedProducts } = usePersonalizedRecommendations();

  // Fetch trending products
  const { data: trendingProducts } = useTrendingProducts("week");

  // Fetch discounted products
  const { data: discountedProducts } = useQuery({
    queryKey: ["discounted-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:sellers(business_name, id),
          reviews:reviews(rating)
        `
        )
        .not("discounted_price", "is", null)
        .lt("discounted_price", "price")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch top sellers
  const { data: topSellers } = useAlgorithmSellers({
    sortBy: "algorithm",
    limit: 8,
  });

  // Recently viewed products from localStorage
  const { data: recentlyViewed } = useQuery({
    queryKey: ["recently-viewed-products"],
    queryFn: async () => {
      const recentIds = JSON.parse(
        localStorage.getItem("recentlyViewed") || "[]"
      );
      if (!recentIds.length) return [];

      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          slug,
          price,
          discounted_price,
          images,
          average_rating,
          total_reviews,
          seller:sellers(business_name, verified)
        `
        )
        .in("id", recentIds.slice(0, 8))
        .eq("is_active", true);

      if (error) throw error;

      // Sort by recently viewed order
      return recentIds
        .map((id) => data.find((product) => product.id === id))
        .filter(Boolean);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Infinite scroll for algorithmic products
  const {
    data: infiniteProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: infiniteLoading,
  } = useInfiniteQuery({
    queryKey: ["homepage-infinite-products", activeCategory],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      const offset = pageParam * limit;

      let query = supabase
        .from("products")
        .select(
          `
          id,
          name,
          slug,
          price,
          discounted_price,
          discount_percentage,
          images,
          average_rating,
          total_reviews,
          category:categories(name, slug),
          seller:sellers(business_name, verified, avatar_url),
          algorithm_score:product_algorithm_scores(total_score)
        `
        )
        .eq("is_active", true)
        .eq("status", "published");

      // Apply category filter
      if (activeCategory !== "all") {
        query = query.eq("category.slug", activeCategory);
      }

      // Order by algorithm score for discovery
      query = query
        .order("algorithm_score.total_score", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 20 ? pages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Handle campaign carousel auto-rotation
  useEffect(() => {
    if (!campaigns || campaigns.length <= 1) return;

    const interval = setInterval(() => {
      setCampaignIndex((prevIndex) =>
        prevIndex === campaigns.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [campaigns]);

  // Handle infinite scroll
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Check scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.offsetHeight;
      setIsAtBottom(scrollPosition >= documentHeight - 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <HomepageSEO />
      <NavBar />

      <main className="pt-20">
        {/* Welcome Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 text-center shadow-lg"
          >
            <p className="text-lg font-medium">{message}</p>
          </motion.div>
        )}

        {/* Hero Section */}
        <section className="relative py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  ANDA
                </span>
                <br />
                <span className="text-2xl md:text-4xl font-medium text-gray-700">
                  Modern E-Ticaret Deneyimi
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
              >
                En sevdiğiniz markaların ve yerel satıcıların ürünlerini
                keşfedin.
                <br />
                Güvenli alışveriş, hızlı teslimat ve benzersiz fırsatlar burada!
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold rounded-full hover:from-orange-700 hover:to-orange-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <ShoppingBagIcon className="w-6 h-6" />
                  Alışverişe Başla
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>

                <Link
                  to="/seller/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-orange-600 text-orange-600 font-bold rounded-full hover:bg-orange-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  <BuildingStorefrontIcon className="w-6 h-6" />
                  Satıcı Ol
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
            >
              {[
                { icon: ShoppingBagIcon, value: "10,000+", label: "Ürün" },
                { icon: UserGroupIcon, value: "50,000+", label: "Müşteri" },
                {
                  icon: BuildingStorefrontIcon,
                  value: "1,000+",
                  label: "Satıcı",
                },
                { icon: HeartIcon, value: "99%", label: "Memnuniyet" },
              ].map(({ icon: Icon, value, label }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
                >
                  <Icon className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-gray-900">
                    {value}
                  </div>
                  <div className="text-gray-600">{label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Campaign Carousel */}
        {campaigns && campaigns.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="py-8"
          >
            <CampaignCarousel
              campaigns={campaigns}
              currentIndex={currentCampaignIndex}
              onIndexChange={setCampaignIndex}
            />
          </motion.section>
        )}

        {/* Categories Quick Access */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="py-12"
        >
          <CategoriesSection />
        </motion.section>

        {/* Featured Products */}
        {featuredProducts && featuredProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="py-8"
          >
            <ProductCarousel
              title="Öne Çıkan Ürünler"
              icon={SparklesIcon}
              products={featuredProducts}
              viewAllLink="/products?featured=true"
              iconColor="text-orange-600"
            />
          </motion.section>
        )}

        {/* Discounted Products */}
        {discountedProducts && discountedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="py-8"
          >
            <ProductCarousel
              title="Büyük İndirimler"
              icon={TagIcon}
              products={discountedProducts}
              viewAllLink="/products?discounted=true"
              iconColor="text-red-600"
              showDiscount={true}
            />
          </motion.section>
        )}

        {/* Trending Products */}
        {trendingProducts && trendingProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="py-8"
          >
            <ProductCarousel
              title="Trend Ürünler"
              icon={FireIcon}
              products={trendingProducts}
              viewAllLink="/products?trending=true"
              iconColor="text-purple-600"
            />
          </motion.section>
        )}

        {/* New Arrivals */}
        {newProducts && newProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="py-8"
          >
            <ProductCarousel
              title="Yeni Ürünler"
              icon={ClockIcon}
              products={newProducts}
              viewAllLink="/products?new=true"
              iconColor="text-green-600"
            />
          </motion.section>
        )}

        {/* Best Sellers */}
        {bestSellers && bestSellers.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="py-8"
          >
            <ProductCarousel
              title="Çok Satanlar"
              icon={ArrowTrendingUpIcon}
              products={bestSellers}
              viewAllLink="/products?bestsellers=true"
              iconColor="text-blue-600"
            />
          </motion.section>
        )}

        {/* Personalized Recommendations */}
        {user && personalizedProducts && personalizedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="py-8"
          >
            <ProductCarousel
              title="Size Özel Öneriler"
              icon={StarIcon}
              products={personalizedProducts}
              viewAllLink="/products?personalized=true"
              iconColor="text-orange-600"
            />
          </motion.section>
        )}

        {/* Recently Viewed */}
        {recentlyViewed && recentlyViewed.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="py-8"
          >
            <RecentlyViewedProducts />
          </motion.section>
        )}

        {/* Top Sellers */}
        {topSellers && topSellers.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="py-8"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <UserGroupIcon className="w-8 h-8 text-orange-600" />
                    En İyi Satıcılar
                  </h2>
                  <Link
                    to="/sellers"
                    className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-2 transition-colors"
                  >
                    Tümünü Gör
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {topSellers.map((seller, index) => (
                    <motion.div
                      key={seller.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-center group"
                    >
                      <Link
                        to={`/seller/${seller.slug}`}
                        className="block p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                          {seller.business_name?.[0] || seller.name?.[0] || "S"}
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {seller.business_name || seller.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {seller.total_sales || 0} satış
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Infinite Products Discovery */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="py-12"
        >
          <InfiniteProductsSection
            infiniteProducts={infiniteProducts}
            isFetchingNextPage={isFetchingNextPage}
            infiniteRef={infiniteRef}
          />
        </motion.section>

        {/* Back to Top Button */}
        <AnimatePresence>
          {isAtBottom && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 z-40"
            >
              <ArrowRightIcon className="w-6 h-6 rotate-[-90deg]" />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// Campaign Carousel Component
function CampaignCarousel({ campaigns, currentIndex, onIndexChange }) {
  const nextSlide = () => {
    onIndexChange((currentIndex + 1) % campaigns.length);
  };

  const prevSlide = () => {
    onIndexChange(currentIndex === 0 ? campaigns.length - 1 : currentIndex - 1);
  };

  return (
    <section className="py-8 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {campaigns.map((campaign, index) => (
              <div key={campaign.id} className="w-full flex-shrink-0">
                <div
                  className="relative h-64 md:h-80 flex items-center justify-center text-white rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: campaign.background_color || "#f59e0b",
                    backgroundImage: campaign.banner_image_url
                      ? `url(${campaign.banner_image_url})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-black/30"></div>
                  <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
                    <h2
                      className="text-3xl md:text-5xl font-bold mb-4"
                      style={{ color: campaign.text_color || "white" }}
                    >
                      {campaign.title}
                    </h2>
                    {campaign.description && (
                      <p className="text-lg md:text-xl mb-6 opacity-90">
                        {campaign.description}
                      </p>
                    )}
                    {campaign.button_text && (
                      <button
                        className="bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          if (campaign.action_type === "url") {
                            window.open(campaign.action_value, "_blank");
                          } else if (campaign.action_type === "category") {
                            window.location.href = `/category/${campaign.action_value}`;
                          }
                        }}
                      >
                        {campaign.button_text}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          {campaigns.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {campaigns.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => onIndexChange(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// Enhanced Product Carousel Component
function ProductCarousel({
  title,
  icon: Icon,
  products,
  viewAllLink,
  iconColor = "text-brand-600",
  showDiscount = false,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 4;
  const maxIndex = Math.max(0, products.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Icon className={`w-8 h-8 ${iconColor}`} />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {products.length > itemsPerView && (
              <div className="flex gap-2">
                <button
                  onClick={prevSlide}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  disabled={currentIndex >= maxIndex}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
            <Link
              to={viewAllLink}
              className="flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-medium group"
            >
              Tümünü Gör
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            }}
          >
            {products.map((product) => (
              <div key={product.id} className="w-1/4 flex-shrink-0 px-2">
                <ProductCard
                  product={product}
                  showDiscount={showDiscount}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Categories Section with Enhanced Design
function CategoriesSection() {
  const categories = [
    {
      name: "Giyim",
      slug: "giyim",
      color: "from-blue-500 to-blue-600",
      icon: "👔",
      subcategories: ["T-Shirt", "Gömlek", "Pantolon", "Elbise"],
    },
    {
      name: "Ayakkabı",
      slug: "ayakkabi",
      color: "from-emerald-500 to-emerald-600",
      icon: "👟",
      subcategories: ["Spor", "Klasik", "Bot", "Sandalet"],
    },
    {
      name: "Aksesuar",
      slug: "aksesuar",
      color: "from-purple-500 to-purple-600",
      icon: "👜",
      subcategories: ["Çanta", "Saat", "Takı", "Gözlük"],
    },
    {
      name: "Elektronik",
      slug: "elektronik",
      color: "from-orange-500 to-orange-600",
      icon: "📱",
      subcategories: ["Telefon", "Bilgisayar", "Kulaklık", "Kamera"],
    },
    {
      name: "Ev & Yaşam",
      slug: "ev-yasam",
      color: "from-red-500 to-red-600",
      icon: "🏠",
      subcategories: ["Mobilya", "Dekorasyon", "Mutfak", "Bahçe"],
    },
    {
      name: "Spor & Outdoor",
      slug: "spor-outdoor",
      color: "from-green-500 to-green-600",
      icon: "⚽",
      subcategories: ["Fitness", "Outdoor", "Su Sporları", "Takım Sporları"],
    },
    {
      name: "Kitap & Hobi",
      slug: "kitap-hobi",
      color: "from-indigo-500 to-indigo-600",
      icon: "📚",
      subcategories: ["Kitap", "Müzik", "Oyun", "Sanat"],
    },
    {
      name: "Kozmetik",
      slug: "kozmetik",
      color: "from-pink-500 to-pink-600",
      icon: "💄",
      subcategories: ["Makyaj", "Cilt Bakımı", "Parfüm", "Saç Bakımı"],
    },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Kategoriler
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            İhtiyacınız olan her şey burada
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className="group"
            >
              <div className="relative overflow-hidden">
                <div
                  className={`bg-gradient-to-br ${category.color} rounded-2xl p-6 mb-4 group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-xl`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold text-white text-lg mb-2">
                      {category.name}
                    </h3>
                    <div className="text-xs text-white/80 space-y-1">
                      {category.subcategories.slice(0, 2).map((sub, index) => (
                        <div key={index}>{sub}</div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Infinite Products Section
function InfiniteProductsSection({
  infiniteProducts,
  isFetchingNextPage,
  infiniteRef,
}) {
  const allProducts = infiniteProducts?.pages?.flatMap((page) => page) || [];

  // Group products by type for variety
  const algorithmProducts = allProducts.filter(
    (p) => p.algorithm_score?.[0]?.total_score > 50
  );
  const campaignProducts = allProducts.filter((p) => p.discounted_price);
  const recentProducts = allProducts.filter((p) => {
    const createdAt = new Date(p.created_at);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return createdAt > oneWeekAgo;
  });

  return (
    <div className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Algorithm Recommended Products */}
        {algorithmProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <ArrowTrendingUpIcon className="w-8 h-8 text-purple-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Sizin İçin Önerilen
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {algorithmProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* High Discount Products */}
        {campaignProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <GiftIcon className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Yüksek İndirimli Ürünler
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {campaignProducts.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showDiscount={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Products */}
        {recentProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <ClockIcon className="w-8 h-8 text-emerald-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bu Hafta Eklenen
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* All Products (Endless Scroll) */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <ShoppingBagIcon className="w-8 h-8 text-brand-600" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Keşfetmeye Devam Et
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allProducts.map((product) => (
              <ProductCard
                key={`${product.id}-${Math.random()}`}
                product={product}
              />
            ))}
          </div>
        </div>

        {/* Loading indicator and infinite scroll trigger */}
        <div ref={infiniteRef} className="flex justify-center py-8">
          {isFetchingNextPage && <Spinner />}
        </div>
      </div>
    </div>
  );
}

export default Homepage;
