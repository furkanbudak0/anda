import { useEffect, useState } from "react";

/**
 * SON GÖRÜNTÜLENEN ÜRÜNLER SİSTEMİ
 *
 * Özellikler:
 * - LocalStorage ile ürün takibi
 * - Otomatik temizleme (maksimum 20 ürün)
 * - Zamana dayalı sıralama
 * - React Query entegrasyonu
 * - Performans optimizasyonu
 */

// Constants
const MAX_RECENTLY_VIEWED = 20;
const RECENTLY_VIEWED_KEY = "anda_recently_viewed";

/**
 * Son görüntülenen ürünleri yönetmek için custom hook
 * Local storage kullanarak kalıcı olarak saklar
 */
function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Load recently viewed from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentlyViewed(parsed);
      } catch (error) {
        console.error("Error parsing recently viewed:", error);
        localStorage.removeItem(RECENTLY_VIEWED_KEY);
      }
    }
  }, []);

  // Save to localStorage whenever recently viewed changes
  useEffect(() => {
    if (recentlyViewed.length > 0) {
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
    }
  }, [recentlyViewed]);

  // Add product to recently viewed
  const addToRecentlyViewed = (product) => {
    if (!product || !product.id) return;

    setRecentlyViewed((prev) => {
      // Remove if already exists
      const filtered = prev.filter((item) => item.id !== product.id);

      // Add to beginning
      const updated = [product, ...filtered];

      // Limit to MAX_RECENTLY_VIEWED
      return updated.slice(0, MAX_RECENTLY_VIEWED);
    });
  };

  // Remove product from recently viewed
  const removeFromRecentlyViewed = (productId) => {
    setRecentlyViewed((prev) => prev.filter((item) => item.id !== productId));
  };

  // Clear all recently viewed
  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  };

  return {
    recentlyViewed,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed,
  };
}

// Export as default only
export default useRecentlyViewed;

/**
 * Ürün görüntüleme tracklemesi için hook
 * ProductDetail sayfasında kullanılır
 */
export function useProductViewTracking(productId) {
  const { addToRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    if (productId) {
      // 2 saniye sonra track et (kullanıcının gerçekten ürünü incelediğinden emin olmak için)
      const timer = setTimeout(() => {
        addToRecentlyViewed({
          id: productId,
          viewedAt: new Date().toISOString(),
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [productId, addToRecentlyViewed]);
}

/**
 * Son görüntülenen ürünler hakkında analitik bilgiler
 * Dashboard ve raporlar için kullanılır
 */
export function useRecentlyViewedAnalytics() {
  const { recentlyViewed } = useRecentlyViewed();

  const analytics = {
    totalViewed: recentlyViewed.length,
    categoriesViewed: [
      ...new Set(recentlyViewed.map((p) => p.category?.name)),
    ].filter(Boolean),
    averagePrice:
      recentlyViewed.length > 0
        ? recentlyViewed.reduce(
            (sum, p) => sum + (p.discounted_price || p.price),
            0
          ) / recentlyViewed.length
        : 0,
    sellersViewed: [
      ...new Set(recentlyViewed.map((p) => p.seller?.business_name)),
    ].filter(Boolean),
    mostRecentCategory: recentlyViewed[0]?.category?.name || null,
  };

  return analytics;
}

/**
 * Belirli bir kategoriye ait son görüntülenen ürünleri getir
 * Kategori sayfalarında öneri olarak kullanılır
 */
export function useRecentlyViewedByCategory(categorySlug) {
  const { recentlyViewed } = useRecentlyViewed();

  const categoryProducts = recentlyViewed.filter(
    (product) => product.category?.slug === categorySlug
  );

  return {
    categoryProducts,
    count: categoryProducts.length,
    hasProducts: categoryProducts.length > 0,
  };
}

/**
 * Utility functions
 */

// Check if a product was recently viewed
export function isProductRecentlyViewed(productId) {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!stored) return false;

    const items = JSON.parse(stored);
    return items.some((item) => item.id === productId);
  } catch {
    return false;
  }
}

// Get recently viewed product IDs only
export function getRecentlyViewedIds() {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return stored ? JSON.parse(stored).map((item) => item.id) : [];
  } catch {
    return [];
  }
}

// Export for external usage
export { RECENTLY_VIEWED_KEY, MAX_RECENTLY_VIEWED };
