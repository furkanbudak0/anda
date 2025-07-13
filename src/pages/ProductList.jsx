/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "../components/NavBar";
import Breadcrumb from "../components/Breadcrumb";
import Carousel from "../components/Carousel";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { useProducts } from "../hooks/useProducts";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import { recommendationEngine } from "../hooks/useProducts";
import {
  getCategoryBySlug,
  getSubcategoryBySlug,
  getCategoryProducts,
  getRecommendedProducts,
  getTrendingProducts,
} from "../hooks/useProducts";
import { notifications } from "../utils/notifications";

const PRODUCTS_PER_CAROUSEL = 8;
const CAROUSELS_PER_LOAD = 3;

export default function ProductList() {
  const { category, subcategory } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const { user } = useAuth();

  // State management
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [carouselSections, setCarouselSections] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [allProducts, setAllProducts] = useState([]);

  // Get products using existing hook
  const {
    products,
    loading: productsLoading,
    error,
  } = useProducts({ category, subcategory, search });

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMoreCarousels();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, loadingMore]);

  // Load campaign data for priority system
  useEffect(() => {
    loadCampaignData();
  }, []);

  // Process products with recommendation algorithm
  useEffect(() => {
    if (products && products.length > 0) {
      processProductsWithAlgorithm();
    }
  }, [products, user, category, subcategory]);

  /**
   * Load active campaigns with priority data
   */
  const loadCampaignData = async () => {
    try {
      // Skip campaigns if table doesn't exist or user has no permissions
      const { data, error } = await supabase
        .from("campaigns")
        .select(
          `
          *,
          campaign_products(
            product:products(
              *,
              analytics(*),
              seller:sellers(*)
            )
          )
        `
        )
        .eq("status", "active")
        .gte("priority_score", 200)
        .order("priority_score", { ascending: false })
        .limit(10);

      if (error) {
        // Log error but don't break the app
        console.warn("Campaigns not available:", error.message);
        setCampaigns([]); // Set empty campaigns array
        return; // Exit gracefully
      }

      setCampaigns(data || []);
    } catch (error) {
      console.warn("Error loading campaigns:", error.message);
      setCampaigns([]); // Ensure campaigns is set to empty array
      // Don't throw error - let the app continue without campaigns
    }
  };

  /**
   * Process products using the recommendation algorithm and create initial carousels
   */
  const processProductsWithAlgorithm = async () => {
    setLoading(true);

    try {
      // Update user behavior tracking
      if (user && category) {
        recommendationEngine.updateUserProfile(user.id, {
          type: "view",
          categorySlug: category,
          subcategory: subcategory,
          timestamp: new Date().toISOString(),
        });
      }

      // Algorithm context for better scoring
      const context = {
        type: subcategory ? "subcategory" : category ? "category" : "general",
        user: user,
        category: category,
        subcategory: subcategory,
        avgMarketViews: calculateAvgMarketViews(products),
        avgMarketRevenue: calculateAvgMarketRevenue(products),
        marketAvgOrderValue: calculateMarketAvgOrderValue(products),
        optimalStock: 50,
        campaigns: campaigns, // Add campaigns to context
      };

      // Store all products for infinite scroll
      setAllProducts(products);

      // Create initial carousel sections
      const initialSections = generateCarouselSections(products, context, 1);
      setCarouselSections(initialSections);
      setPage(1);
      setHasNextPage(
        products.length > PRODUCTS_PER_CAROUSEL * CAROUSELS_PER_LOAD
      );
    } catch (error) {
      console.error("Error processing products with algorithm:", error);
      notifications.error("Ürün önerileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate carousel sections based on products and algorithm
   */
  const generateCarouselSections = (products, context, pageNum) => {
    if (!products || products.length === 0) return [];

    const sectionsToGenerate = CAROUSELS_PER_LOAD;
    const startIndex =
      (pageNum - 1) * PRODUCTS_PER_CAROUSEL * CAROUSELS_PER_LOAD;
    const sections = [];

    // Different carousel types
    const carouselTypes = [
      {
        id: "featured",
        title: "Öne Çıkan Ürünler",
        subtitle: "Algoritma önerisi",
        icon: "🎯",
        bgColor: "from-orange-500 to-red-500",
        products: getRecommendedProducts(products, context),
      },
      {
        id: "trending",
        title: "Trend Ürünler",
        subtitle: "Şu anda popüler",
        icon: "🔥",
        bgColor: "from-purple-500 to-pink-500",
        products: getTrendingProducts(products, 20),
      },
      {
        id: "discounted",
        title: "İndirimli Ürünler",
        subtitle: "Fırsatları kaçırma",
        icon: "💰",
        bgColor: "from-green-500 to-emerald-500",
        products: products
          .filter((product) => product.discount_percentage > 20)
          .map((product) => ({
            ...product,
            recommendation: recommendationEngine.calculateProductScore(
              product,
              context
            ),
          }))
          .sort((a, b) => {
            const discountDiff = b.discount_percentage - a.discount_percentage;
            if (Math.abs(discountDiff) > 5) return discountDiff;
            return b.recommendation.score - a.recommendation.score;
          }),
      },
      {
        id: "new",
        title: "Yeni Eklenenler",
        subtitle: "Fresh arrivals",
        icon: "✨",
        bgColor: "from-blue-500 to-cyan-500",
        products: products.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        ),
      },
      {
        id: "bestseller",
        title: "Çok Satanlar",
        subtitle: "Popüler seçimler",
        icon: "🏆",
        bgColor: "from-yellow-500 to-orange-500",
        products: products
          .filter((product) => product.analytics?.total_sold > 0)
          .sort(
            (a, b) =>
              (b.analytics?.total_sold || 0) - (a.analytics?.total_sold || 0)
          ),
      },
      {
        id: "category_special",
        title: category
          ? `${getCategoryBySlug(category)?.name || category} Özel`
          : "Özel Seçim",
        subtitle: "Kategori önerileri",
        icon: "🎪",
        bgColor: "from-indigo-500 to-purple-500",
        products: category
          ? getCategoryProducts(products, subcategory || category, 20)
          : products,
      },
    ];

    // Shuffle products for variety
    const shuffledProducts = [...products].sort(() => Math.random() - 0.5);

    for (let i = 0; i < sectionsToGenerate; i++) {
      const typeIndex =
        (startIndex / PRODUCTS_PER_CAROUSEL + i) % carouselTypes.length;
      const carouselType = carouselTypes[typeIndex];

      // Get products for this section
      const sectionStartIndex = startIndex + i * PRODUCTS_PER_CAROUSEL;
      let sectionProducts = carouselType.products.slice(
        sectionStartIndex % carouselType.products.length,
        (sectionStartIndex % carouselType.products.length) +
          PRODUCTS_PER_CAROUSEL
      );

      // If not enough products, fill with shuffled products
      if (sectionProducts.length < PRODUCTS_PER_CAROUSEL) {
        const additionalProducts = shuffledProducts
          .filter((p) => !sectionProducts.find((sp) => sp.id === p.id))
          .slice(0, PRODUCTS_PER_CAROUSEL - sectionProducts.length);
        sectionProducts = [...sectionProducts, ...additionalProducts];
      }

      if (sectionProducts.length > 0) {
        sections.push({
          ...carouselType,
          id: `${carouselType.id}_${pageNum}_${i}`,
          products: sectionProducts.slice(0, PRODUCTS_PER_CAROUSEL),
        });
      }
    }

    return sections;
  };

  /**
   * Load more carousel sections for infinite scroll
   */
  const loadMoreCarousels = async () => {
    if (!hasNextPage || loadingMore || loading) return;

    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const context = {
        type: subcategory ? "subcategory" : category ? "category" : "general",
        user: user,
        category: category,
        subcategory: subcategory,
        avgMarketViews: calculateAvgMarketViews(allProducts),
        avgMarketRevenue: calculateAvgMarketRevenue(allProducts),
        marketAvgOrderValue: calculateMarketAvgOrderValue(allProducts),
        optimalStock: 50,
        campaigns: campaigns, // Add campaigns to context
      };

      const newSections = generateCarouselSections(
        allProducts,
        context,
        nextPage
      );

      if (newSections.length > 0) {
        setCarouselSections((prev) => [...prev, ...newSections]);
        setPage(nextPage);

        // Check if we have more data to load
        const totalSectionsLoaded = nextPage * CAROUSELS_PER_LOAD;
        const maxPossibleSections = Math.ceil(
          allProducts.length / PRODUCTS_PER_CAROUSEL
        );
        setHasNextPage(totalSectionsLoaded < maxPossibleSections);
      } else {
        setHasNextPage(false);
      }
    } catch (error) {
      console.error("Error loading more carousels:", error);
      notifications.error("Daha fazla ürün yüklenirken hata oluştu");
    } finally {
      setLoadingMore(false);
    }
  };

  /**
   * Calculate market averages for algorithm context
   */
  const calculateAvgMarketViews = (products) => {
    if (!products || !Array.isArray(products) || products.length === 0)
      return 100;
    const totalViews = products.reduce(
      (sum, product) => sum + (product.analytics?.views_last_30_days || 0),
      0
    );
    return totalViews / products.length;
  };

  const calculateAvgMarketRevenue = (products) => {
    if (!products || !Array.isArray(products) || products.length === 0)
      return 1000;
    const totalRevenue = products.reduce(
      (sum, product) => sum + (product.analytics?.total_revenue || 0),
      0
    );
    return totalRevenue / products.length;
  };

  const calculateMarketAvgOrderValue = (products) => {
    if (!products || !Array.isArray(products) || products.length === 0)
      return 500;
    const totalAOV = products.reduce(
      (sum, product) =>
        sum + (product.analytics?.avg_order_value || product.price || 0),
      0
    );
    return totalAOV / products.length;
  };

  /**
   * Get category/subcategory information for display
   */
  const categoryInfo = useMemo(() => {
    if (subcategory && category) {
      const cat = getCategoryBySlug(category);
      const subcat = getSubcategoryBySlug(category, subcategory);
      return {
        category: cat,
        subcategory: subcat,
        title: subcat?.name || subcategory,
        description:
          subcat?.description ||
          `${subcat?.name || subcategory} kategorisindeki ürünler`,
      };
    } else if (category) {
      const cat = getCategoryBySlug(category);
      return {
        category: cat,
        title: cat?.name || category,
        description:
          cat?.description ||
          `${cat?.name || category} kategorisindeki ürünler`,
      };
    } else if (search) {
      return {
        title: `"${search}" için arama sonuçları`,
        description: `${search} aramanız için bulunan ürünler`,
      };
    } else {
      return {
        title: "Tüm Ürünler",
        description: "Platform genelindeki tüm ürünler",
      };
    }
  }, [category, subcategory, search]);

  /**
   * Breadcrumb items
   */
  const breadcrumbItems = useMemo(() => {
    const items = [{ label: "Ana Sayfa", href: "/" }];

    if (search) {
      items.push({
        label: "Arama Sonuçları",
        href: "/products?search=" + search,
      });
    } else {
      items.push({ label: "Ürünler", href: "/products" });

      if (categoryInfo.category) {
        items.push({
          label: categoryInfo.category.name,
          href: `/category/${categoryInfo.category.slug}`,
        });

        if (categoryInfo.subcategory) {
          items.push({
            label: categoryInfo.subcategory.name,
            href: `/category/${categoryInfo.category.slug}/${categoryInfo.subcategory.slug}`,
          });
        }
      }
    }

    return items;
  }, [categoryInfo, search]);

  // Loading state
  if (loading || productsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <NavBar />
        <div className="pt-24 flex justify-center">
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <NavBar />
        <div className="pt-24 max-w-7xl mx-auto px-4">
          <EmptyState
            title="Hata Oluştu"
            description="Ürünler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin."
            actionLabel="Sayfayı Yenile"
            actionUrl="/products"
          />
        </div>
      </div>
    );
  }

  // No products state
  if (!products || products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <NavBar />
        <div className="pt-24 max-w-7xl mx-auto px-4">
          <Breadcrumb items={breadcrumbItems} />
          <EmptyState
            title="Ürün Bulunamadı"
            description={
              search
                ? `"${search}" aramanız için ürün bulunamadı.`
                : `${categoryInfo.title} kategorisinde henüz ürün bulunmuyor.`
            }
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
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} />

          {/* Category Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="text-center py-12 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {categoryInfo.title}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {categoryInfo.description}
              </p>

              {/* Category Stats */}
              <div className="mt-6 flex justify-center items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                  <span>{products.length} ürün</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                  <span>Algoritma destekli</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>Sınırsız kayma</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Carousel Sections */}
          <div className="space-y-12">
            {carouselSections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Section Header */}
                <div className="mb-6">
                  <div
                    className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r ${section.bgColor} text-white shadow-lg`}
                  >
                    <span className="text-2xl">{section.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold">{section.title}</h2>
                      <p className="text-sm opacity-90">{section.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* Carousel */}
                <Carousel
                  items={section.products}
                  renderItem={(product) => (
                    <ProductCard
                      product={product}
                      tier={product.recommendation?.tier || "regular"}
                    />
                  )}
                  autoplay={true}
                  autoplayInterval={8000 + index * 1000} // Staggered autoplay
                  slidesToShow={{
                    mobile: 1,
                    tablet: 2,
                    desktop: 4,
                    wide: 5,
                  }}
                  className="product-carousel"
                />
              </motion.div>
            ))}
          </div>

          {/* Loading More Indicator */}
          {loadingMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center py-12"
            >
              <div className="flex items-center gap-3 text-gray-600">
                <Spinner />
                <span>Daha fazla ürün yükleniyor...</span>
              </div>
            </motion.div>
          )}

          {/* End of Results */}
          {!hasNextPage && carouselSections.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Tüm ürünler gösterildi!
                </h3>
                <p className="text-gray-600">
                  {categoryInfo.title} kategorisindeki tüm ürünleri gördünüz.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
