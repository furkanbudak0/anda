import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import ProductCarousel from "../components/ProductCarousel";
import RecentlyViewedProducts from "../components/RecentlyViewedProducts";
import HomepageSEO from "../components/SEO";
import { useBestSellers } from "../hooks/useProducts";
import {
  ArrowTrendingUpIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

const Homepage = () => {
  const location = useLocation();
  const message = location.state?.message;
  const [currentCampaignIndex, setCampaignIndex] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");

  // Intersection observer for infinite scroll
  const { ref: infiniteRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: "100px",
  });

  // Fetch different product sections
  const {
    data: bestSellers,
    isLoading: bestSellersLoading,
    error: bestSellersError,
  } = useBestSellers(8);

  // Fetch campaigns with priority order
  const { data: campaigns } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("admin_campaigns")
          .select("*")
          .eq("is_active", true)
          .lte("start_date", new Date().toISOString())
          .gte("end_date", new Date().toISOString())
          .order("priority_order", { ascending: true });

        if (error) {
          console.log("Campaigns error:", error);
          return [];
        }
        return data || [];
      } catch (error) {
        console.log("Campaigns fetch failed:", error);
        return [];
      }
    },
  });

  // Fetch popular products based on rating and reviews
  const {
    data: popularProducts,
    isLoading: popularLoading,
    error: popularError,
  } = useQuery({
    queryKey: ["popular-products", selectedSubcategory],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(
          `
          *,
          seller:sellers(business_name, business_slug, logo_url)
        `
        )
        .eq("is_active", true)
        .eq("status", "active")
        .not("average_rating", "is", null)
        .gt("average_rating", 0);

      // Filter by subcategory if selected
      if (selectedSubcategory !== "all") {
        query = query.eq("category_id", selectedSubcategory);
      }

      const { data, error } = await query
        .order("average_rating", { ascending: false })
        .order("total_reviews", { ascending: false })
        .limit(8);

      if (error) throw error;
      console.log("Popular products query result:", {
        data,
        error,
        count: data?.length,
      });
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch discounted products (Fırsat Ürünleri) - En yüksek indirim yüzdesine göre
  const {
    data: discountedProducts,
    isLoading: discountedLoading,
    error: discountedError,
  } = useQuery({
    queryKey: ["discounted-products", selectedSubcategory],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(
          `
          *,
          seller:sellers(business_name, business_slug, logo_url)
        `
        )
        .not("discounted_price", "is", null)
        .gt("discount_percentage", 0)
        .eq("is_active", true)
        .eq("status", "active");

      // Filter by subcategory if selected
      if (selectedSubcategory !== "all") {
        query = query.eq("category_id", selectedSubcategory);
      }

      const { data, error } = await query
        .order("discount_percentage", { ascending: false })
        .limit(8);

      if (error) throw error;
      console.log("Fırsat Ürünleri query result:", {
        data,
        error,
        count: data?.length,
        discountPercentages: data?.map((p) => p.discount_percentage),
      });
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch subcategories for filtering
  const { data: subcategories } = useQuery({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .not("parent_id", "is", null)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
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
        .map((id) => data.find((product) => product.uuid === id))
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
  } = useInfiniteQuery({
    queryKey: ["homepage-infinite-products"],
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
        .eq("status", "active");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <HomepageSEO />

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

        {/* Popular Products Carousel */}
        {popularProducts && popularProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Popüler Ürünler
              </h2>
              <ProductCarousel
                products={popularProducts || []}
                isLoading={popularLoading}
                error={popularError}
                autoSlide={true}
                slideInterval={6000}
                itemsPerSlide={4}
              />
            </div>
          </motion.div>
        )}

        {/* Fırsat Ürünleri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Fırsat Ürünleri
            </h2>
            <ProductCarousel
              products={discountedProducts || []}
              isLoading={discountedLoading}
              error={discountedError}
              autoSlide={true}
              slideInterval={6000}
              itemsPerSlide={4}
            />
          </div>
        </motion.div>

        {/* Categories Quick Access */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="py-12"
        >
          <CategoriesSection />
        </motion.section>

        {/* Best Sellers */}
        {bestSellers && bestSellers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-12"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Çok Satanlar
              </h2>
              <ProductCarousel
                products={bestSellers || []}
                isLoading={bestSellersLoading}
                error={bestSellersError}
                autoSlide={true}
                slideInterval={6000}
                itemsPerSlide={4}
              />
            </div>
          </motion.div>
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

        {/* Hero Section - Moved to bottom */}
        <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-white to-orange-100">
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

        {/* Footer */}
        <footer className="bg-gray-100 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Upper Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
              {/* ANDA */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  ANDA
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Link
                      to="/about"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Biz Kimiz
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/careers"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Kariyer
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/sustainability"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Sürdürülebilirlik
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="hover:text-orange-600 transition-colors"
                    >
                      İletişim
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/security"
                      className="hover:text-orange-600 transition-colors"
                    >
                      ANDA'da Güvenlik
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/recall"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Ürün Geri Çağırma
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Kampanyalar */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Kampanyalar
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Link
                      to="/campaigns"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Kampanyalar
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/credit"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Alışveriş Kredisi
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/elite"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Elit Üyelik
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/gifts"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Hediye Fikirleri
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Satıcı */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Satıcı
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Link
                      to="/seller/signup"
                      className="hover:text-orange-600 transition-colors"
                    >
                      ANDA'da Satış Yap
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/seller/guide"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Temel Kavramlar
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/seller/academy"
                      className="hover:text-orange-600 transition-colors"
                    >
                      ANDA Akademi
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Yardım */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Yardım
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Link
                      to="/faq"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Sıkça Sorulan Sorular
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/help"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Canlı Yardım / Asistan
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/returns"
                      className="hover:text-orange-600 transition-colors"
                    >
                      Nasıl İade Edebilirim
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/guide"
                      className="hover:text-orange-600 transition-colors"
                    >
                      İşlem Rehberi
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Ülke Değiştir */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Ülke Değiştir
                </h3>
                <div className="relative">
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option>Ülke Seç</option>
                    <option value="tr">Türkiye</option>
                    <option value="us">Amerika Birleşik Devletleri</option>
                    <option value="uk">Birleşik Krallık</option>
                    <option value="de">Almanya</option>
                  </select>
                </div>
              </div>

              {/* Sosyal Medya */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Sosyal Medya
                </h3>
                <div className="flex space-x-3">
                  <a
                    href="#"
                    className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                  >
                    <span className="text-sm font-bold">f</span>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white hover:from-pink-600 hover:to-orange-600 transition-colors"
                  >
                    <span className="text-sm">📷</span>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors"
                  >
                    <span className="text-sm">▶</span>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-sm font-bold">X</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Lower Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Güvenlik Sertifikası */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                    Güvenlik Sertifikası
                  </h4>
                  <div className="flex space-x-2">
                    <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                      QR
                    </div>
                    <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-600">
                      TR GO
                    </div>
                    <div className="w-12 h-8 bg-green-100 rounded flex items-center justify-center text-xs text-green-600">
                      PCI
                    </div>
                    <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-600">
                      ISO
                    </div>
                  </div>
                </div>

                {/* Güvenli Alışveriş */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                    Güvenli Alışveriş
                  </h4>
                  <div className="flex space-x-2">
                    <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                      TROY
                    </div>
                    <div className="w-12 h-8 bg-red-100 rounded flex items-center justify-center text-xs text-red-600">
                      MC
                    </div>
                    <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-600">
                      VISA
                    </div>
                    <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-600">
                      AMEX
                    </div>
                  </div>
                </div>

                {/* Mobil Uygulamalar */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                    Mobil Uygulamalar
                  </h4>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors">
                      App Store
                    </button>
                    <button className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors">
                      Google Play
                    </button>
                    <button className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors">
                      AppGallery
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>

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
                <ProductCard key={product.uuid} product={product} />
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
                <ProductCard key={product.uuid} product={product} />
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
                <ProductCard key={product.uuid} product={product} />
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
                key={`${product.uuid}-${Math.random()}`}
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
