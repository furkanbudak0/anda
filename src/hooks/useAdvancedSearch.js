import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useDebounce } from "./useDebounce";

/**
 * GELİŞMİŞ ARAMA SİSTEMİ
 *
 * Özellikler:
 * - Hashtag tabanlı arama
 * - Otomatik tamamlama
 * - Gelişmiş filtreler
 * - Fuzzy search algoritması
 * - Real-time öneriler
 * - Arama geçmişi
 * - Popüler aramalar
 */

/**
 * Ana gelişmiş arama hook'u
 */
export function useAdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: { min: 0, max: 10000 },
    brands: [],
    sellers: [],
    rating: 0,
    inStock: false,
    onSale: false,
    freeShipping: false,
    tags: [],
  });
  const [sortBy, setSortBy] = useState("relevance");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const queryClient = useQueryClient();
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Arama sonuçları
  const {
    data: searchResults,
    isLoading: searchLoading,
    error,
  } = useQuery({
    queryKey: ["advanced-search", debouncedQuery, filters, sortBy],
    queryFn: async () => {
      if (
        !debouncedQuery &&
        Object.values(filters).every((v) =>
          Array.isArray(v)
            ? v.length === 0
            : !v || (typeof v === "object" && v.min === 0 && v.max === 10000)
        )
      ) {
        return { products: [], total: 0, suggestions: [] };
      }

      return await performAdvancedSearch(debouncedQuery, filters, sortBy);
    },
    enabled: true,
    staleTime: 2 * 60 * 1000,
  });

  // Otomatik tamamlama önerileri
  const { data: autocomplete = [] } = useQuery({
    queryKey: ["autocomplete", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      return await getAutocompleteResults(debouncedQuery);
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  // Popüler hashtag'ler
  const { data: popularTags = [] } = useQuery({
    queryKey: ["popular-hashtags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_hashtags")
        .select("tag, COUNT(*) as count")
        .group("tag")
        .order("count", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });

  // Arama geçmişi kaydetme
  const saveSearchHistory = useMutation({
    mutationFn: async (query) => {
      const history = JSON.parse(
        localStorage.getItem("anda_search_history") || "[]"
      );
      const updated = [
        { query, timestamp: new Date().toISOString() },
        ...history.filter((h) => h.query !== query),
      ].slice(0, 10);

      localStorage.setItem("anda_search_history", JSON.stringify(updated));
      return updated;
    },
  });

  // Filter güncelleme fonksiyonları
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const addTagFilter = useCallback((tag) => {
    setFilters((prev) => ({
      ...prev,
      tags: [...prev.tags.filter((t) => t !== tag), tag],
    }));
  }, []);

  const removeTagFilter = useCallback((tag) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      categories: [],
      priceRange: { min: 0, max: 10000 },
      brands: [],
      sellers: [],
      rating: 0,
      inStock: false,
      onSale: false,
      freeShipping: false,
      tags: [],
    });
  }, []);

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      if (query.trim()) {
        saveSearchHistory.mutate(query.trim());
      }
    },
    [saveSearchHistory]
  );

  // Önerilen aramalar (trending)
  const { data: trendingSearches = [] } = useQuery({
    queryKey: ["trending-searches"],
    queryFn: async () => {
      // Gerçek uygulamada analytics'den alınır
      return [
        "iphone 14",
        "nike ayakkabı",
        "laptop",
        "mont",
        "bluetooth kulaklık",
        "samsung galaxy",
        "adidas spor ayakkabı",
        "elektronik",
      ];
    },
    staleTime: 60 * 60 * 1000,
  });

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem("anda_search_history") || "[]"
    );
    setSearchHistory(savedHistory);
  }, []);

  // Save search query to history
  const saveToHistory = useCallback(
    (searchQuery, searchFilters) => {
      if (searchQuery.length >= 2) {
        const newHistory = [
          { query: searchQuery, filters: searchFilters, timestamp: Date.now() },
          ...searchHistory.filter((item) => item.query !== searchQuery),
        ].slice(0, 10);

        setSearchHistory(newHistory);
        localStorage.setItem("anda_search_history", JSON.stringify(newHistory));
      }
    },
    [searchHistory]
  );

  return {
    // State
    searchQuery,
    filters,
    sortBy,
    isAdvancedOpen,

    // Results
    searchResults: searchResults?.products || [],
    totalResults: searchResults?.total || 0,
    suggestions: searchResults?.suggestions || [],
    autocomplete,
    popularTags,
    trendingSearches,

    // Loading states
    isSearching: searchLoading,
    isAutocompleting: autocomplete.length > 0,

    // Actions
    setSearchQuery: handleSearch,
    updateFilter,
    addTagFilter,
    removeTagFilter,
    clearFilters,
    setSortBy,
    setIsAdvancedOpen,

    // Computed
    hasActiveFilters: Object.values(filters).some((v) =>
      Array.isArray(v)
        ? v.length > 0
        : typeof v === "boolean"
        ? v
        : typeof v === "object"
        ? v.min > 0 || v.max < 10000
        : v > 0
    ),

    error,

    // History
    searchHistory,
    saveToHistory,
  };
}

/**
 * Gelişmiş arama algoritması
 */
async function performAdvancedSearch(query, filters, sortBy) {
  let searchQuery = supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name, slug),
      seller:sellers(business_name, verified, avatar_url),
      hashtags:product_hashtags(tag),
      reviews:reviews(rating)
    `
    )
    .eq("is_active", true)
    .eq("status", "published");

  // Metin araması (fuzzy search)
  if (query) {
    // PostgreSQL full-text search
    searchQuery = searchQuery.or(`
      name.ilike.%${query}%,
      description.ilike.%${query}%,
      search_keywords.ilike.%${query}%
    `);
  }

  // Kategori filtreleri
  if (filters.categories.length > 0) {
    searchQuery = searchQuery.in("category_id", filters.categories);
  }

  // Fiyat aralığı
  if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) {
    searchQuery = searchQuery
      .gte("price", filters.priceRange.min)
      .lte("price", filters.priceRange.max);
  }

  // Marka filtreleri
  if (filters.brands.length > 0) {
    searchQuery = searchQuery.in("brand", filters.brands);
  }

  // Satıcı filtreleri
  if (filters.sellers.length > 0) {
    searchQuery = searchQuery.in("seller_id", filters.sellers);
  }

  // Rating filtreleri
  if (filters.rating > 0) {
    searchQuery = searchQuery.gte("average_rating", filters.rating);
  }

  // Stok durumu
  if (filters.inStock) {
    searchQuery = searchQuery.gt("stock_quantity", 0);
  }

  // İndirimli ürünler
  if (filters.onSale) {
    searchQuery = searchQuery.not("discounted_price", "is", null);
  }

  // Ücretsiz kargo
  if (filters.freeShipping) {
    searchQuery = searchQuery.gte("price", 150); // 150₺ üzeri ücretsiz kargo
  }

  // Sıralama
  switch (sortBy) {
    case "price_asc":
      searchQuery = searchQuery.order("price", { ascending: true });
      break;
    case "price_desc":
      searchQuery = searchQuery.order("price", { ascending: false });
      break;
    case "rating":
      searchQuery = searchQuery.order("average_rating", { ascending: false });
      break;
    case "newest":
      searchQuery = searchQuery.order("created_at", { ascending: false });
      break;
    case "popularity":
      searchQuery = searchQuery.order("total_sales", { ascending: false });
      break;
    default: // relevance
      if (query) {
        // Text search relevance score
        searchQuery = searchQuery.order("search_rank", { ascending: false });
      } else {
        searchQuery = searchQuery.order("algorithm_score", {
          ascending: false,
        });
      }
  }

  // Sayfa limitlemesi
  searchQuery = searchQuery.range(0, 99); // İlk 100 sonuç

  const { data, error } = await searchQuery;

  if (error) throw error;

  // Hashtag filtreleme (client-side, performans için)
  let filteredData = data || [];

  if (filters.tags.length > 0) {
    filteredData = filteredData.filter((product) =>
      product.hashtags?.some((h) => filters.tags.includes(h.tag))
    );
  }

  // Öneriler oluştur
  const suggestions = await generateSearchSuggestions(query, filteredData);

  return {
    products: filteredData,
    total: filteredData.length,
    suggestions,
  };
}

/**
 * Otomatik tamamlama sonuçları
 */
async function getAutocompleteResults(query) {
  const suggestions = [];

  // Ürün isimleri
  const { data: products } = await supabase
    .from("products")
    .select("name")
    .ilike("name", `%${query}%`)
    .eq("is_active", true)
    .limit(5);

  if (products) {
    suggestions.push(
      ...products.map((p) => ({
        type: "product",
        text: p.name,
        icon: "🛍️",
      }))
    );
  }

  // Kategoriler
  const { data: categories } = await supabase
    .from("categories")
    .select("name")
    .ilike("name", `%${query}%`)
    .eq("is_active", true)
    .limit(3);

  if (categories) {
    suggestions.push(
      ...categories.map((c) => ({
        type: "category",
        text: c.name,
        icon: "📂",
      }))
    );
  }

  // Hashtag'ler
  const { data: hashtags } = await supabase
    .from("product_hashtags")
    .select("tag")
    .ilike("tag", `%${query}%`)
    .limit(3);

  if (hashtags) {
    suggestions.push(
      ...hashtags.map((h) => ({
        type: "hashtag",
        text: `#${h.tag}`,
        icon: "#️⃣",
      }))
    );
  }

  // Marka/Satıcılar
  const { data: sellers } = await supabase
    .from("sellers")
    .select("business_name")
    .ilike("business_name", `%${query}%`)
    .eq("is_active", true)
    .limit(3);

  if (sellers) {
    suggestions.push(
      ...sellers.map((s) => ({
        type: "seller",
        text: s.business_name,
        icon: "🏪",
      }))
    );
  }

  return suggestions.slice(0, 10);
}

/**
 * Arama önerileri oluştur
 */
async function generateSearchSuggestions(query, results) {
  const suggestions = [];

  if (!query || results.length === 0) return suggestions;

  // Benzer kategoriler
  const categories = [...new Set(results.map((p) => p.category?.name))].filter(
    Boolean
  );
  if (categories.length > 0) {
    suggestions.push({
      type: "category_suggestion",
      title: "İlgili Kategoriler",
      items: categories.slice(0, 3),
    });
  }

  // Benzer markalar
  const brands = [...new Set(results.map((p) => p.brand))].filter(Boolean);
  if (brands.length > 0) {
    suggestions.push({
      type: "brand_suggestion",
      title: "İlgili Markalar",
      items: brands.slice(0, 3),
    });
  }

  // Fiyat önerileri
  const prices = results.map((p) => p.price).sort((a, b) => a - b);
  if (prices.length > 0) {
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    const medianPrice = prices[Math.floor(prices.length / 2)];

    suggestions.push({
      type: "price_suggestion",
      title: "Fiyat Aralıkları",
      items: [
        `${minPrice}₺ - ${medianPrice}₺`,
        `${medianPrice}₺ - ${maxPrice}₺`,
        `${maxPrice}₺ altı`,
      ],
    });
  }

  return suggestions;
}

/**
 * Arama geçmişi hook'u
 */
export function useSearchHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("anda_search_history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem("anda_search_history");
    setHistory([]);
  }, []);

  const removeFromHistory = useCallback(
    (query) => {
      const updated = history.filter((h) => h.query !== query);
      localStorage.setItem("anda_search_history", JSON.stringify(updated));
      setHistory(updated);
    },
    [history]
  );

  return {
    history,
    clearHistory,
    removeFromHistory,
    hasHistory: history.length > 0,
  };
}

/**
 * Filter seçenekleri hook'u
 */
export function useSearchFilters() {
  // Kategoriler
  const { data: categories = [] } = useQuery({
    queryKey: ["filter-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Markalar
  const { data: brands = [] } = useQuery({
    queryKey: ["filter-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("brand")
        .not("brand", "is", null)
        .order("brand");

      if (error) throw error;
      return [...new Set(data?.map((p) => p.brand))].filter(Boolean);
    },
    staleTime: 15 * 60 * 1000,
  });

  // Satıcılar
  const { data: sellers = [] } = useQuery({
    queryKey: ["filter-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select("id, business_name, verified")
        .eq("is_active", true)
        .order("business_name");

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    categories,
    brands,
    sellers,
  };
}

/**
 * Utility functions
 */

// Similarity score calculator (fuzzy search)
export function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(
    longer.toLowerCase(),
    shorter.toLowerCase()
  );
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance algorithm
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
