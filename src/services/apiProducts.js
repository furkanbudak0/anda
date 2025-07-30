import { getCurrentUser } from "./apiAuth";
import supabase, { supabaseUrl } from "./supabase";

// Yardımcı fonksiyonlar
const cleanFileName = (fileName) => {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const validateProductData = (product) => {
  if (!product.name || product.name.length < 3) {
    throw new Error("Ürün adı en az 3 karakter olmalıdır");
  }
  if (product.regularPrice < 0) {
    throw new Error("Ürün fiyatı negatif olamaz");
  }
  if (product.discount < 0 || product.discount > 100) {
    throw new Error("İndirim oranı 0-100 arasında olmalıdır");
  }
};

/**
 * Enhanced product API service with full e-commerce functionality
 */
export const apiProducts = {
  /**
   * Get products with filters, pagination, and sorting
   */
  async getProducts({
    offset = 0,
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
  } = {}) {
    let query = supabase
      .from("products")
      .select(
        `
        *,
        seller:sellers(
          id,
          business_name,
          logo_url,
          average_rating,
          total_reviews
        ),
        category:categories(
          id,
          name,
          slug
        )
      `
      )
      .eq("status", "active");

    // Apply filters
    if (categoryId) query = query.eq("category_id", categoryId);
    if (sellerId) query = query.eq("seller_id", sellerId);
    if (priceMin) query = query.gte("price", priceMin);
    if (priceMax) query = query.lte("price", priceMax);
    if (featured !== null) query = query.eq("is_featured", featured);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`
      );
    }

    if (tags && tags.length > 0) {
      query = query.overlaps("tags", tags);
    }

    // Apply pagination and sorting
    query = query
      .range(offset, offset + limit - 1)
      .order(sortBy, { ascending: sortOrder === "asc" });

    const { data: products, error, count } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      throw new Error(error.message);
    }

    // Sepet sayılarını al
    const productIds = products?.map((p) => p.uuid) || [];
    let cartCounts = {};

    if (productIds.length > 0) {
      const { data: cartData, error: cartError } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .in("product_id", productIds);

      if (!cartError && cartData) {
        cartCounts = cartData.reduce((acc, item) => {
          acc[item.product_id] = (acc[item.product_id] || 0) + item.quantity;
          return acc;
        }, {});
      }
    }

    // Ürünlere sepet sayısını ekle
    const productsWithCartCount =
      products?.map((product) => ({
        ...product,
        cart_count: cartCounts[product.uuid] || 0,
      })) || [];

    return {
      products: productsWithCartCount,
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    };
  },

  /**
   * Get a single product by ID or slug
   */
  async getProduct(productUuid) {
    if (
      !productUuid ||
      typeof productUuid !== "string" ||
      productUuid.length !== 36
    ) {
      throw new Error("Geçersiz ürün uuid'si");
    }
    let query = supabase
      .from("products")
      .select(
        `
        *,
        seller:sellers(
          id,
          business_name,
          logo_url,
          cover_image_url,
          average_rating,
          total_reviews,
          business_description
        ),
        category:categories(
          id,
          name,
          slug,
          parent_id
        )
      `
      )
      .eq("uuid", productUuid)
      .single();
    const { data: product, error } = await query;
    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Product not found");
      }
      throw new Error(error.message);
    }
    return product;
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 8) {
    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        *,
        seller:sellers(business_name, logo_url),
        category:categories(name, slug)
      `
      )
      .eq("status", "active")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return products || [];
  },

  /**
   * Get best selling products
   */
  async getBestSellers(limit = 12) {
    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        *,
        seller:sellers(business_name, logo_url),
        category:categories(name, slug)
      `
      )
      .eq("status", "active")
      .order("order_count", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return products || [];
  },

  /**
   * Get new arrivals
   */
  async getNewArrivals(limit = 12) {
    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        *,
        seller:sellers(business_name, logo_url),
        category:categories(name, slug)
      `
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return products || [];
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(categorySlug, options = {}) {
    const { limit = 20, offset = 0 } = options;

    // First try join on categories
    let { data: products, error } = await supabase
      .from("products")
      .select(
        `
        *,
        seller:sellers(business_name, logo_url),
        category:categories(id, name, slug)
      `
      )
      .eq("status", "active")
      .eq("category.slug", categorySlug)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    // If no products found, fallback to category_slug column
    if ((!products || products.length === 0) && !error) {
      const fallback = await supabase
        .from("products")
        .select(
          `*, seller:sellers(business_name, logo_url), category_id, category, category_slug`
        )
        .eq("status", "active")
        .eq("category_slug", categorySlug)
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });
      products = fallback.data;
      error = fallback.error;
    }

    if (error) throw new Error(error.message);
    return products || [];
  },

  /**
   * Search products
   */
  async searchProducts(searchTerm, filters = {}) {
    const { limit = 20, offset = 0, categoryId, priceMin, priceMax } = filters;

    let query = supabase
      .from("products")
      .select(
        `
        *,
        seller:sellers(business_name, logo_url),
        category:categories(name, slug)
      `
      )
      .eq("status", "published")
      .textSearch("name", searchTerm)
      .range(offset, offset + limit - 1);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (priceMin) query = query.gte("price", priceMin);
    if (priceMax) query = query.lte("price", priceMax);

    const { data: products, error } = await query;

    if (error) throw new Error(error.message);
    return products || [];
  },

  /**
   * Get related products
   */
  async getRelatedProducts(productUuid, limit = 4) {
    const { data: currentProduct } = await supabase
      .from("products")
      .select("category_id, tags")
      .eq("uuid", productUuid)
      .single();

    if (!currentProduct) return [];

    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        *,
        seller:sellers(business_name, logo_url),
        category:categories(name, slug)
      `
      )
      .eq("status", "published")
      .eq("category_id", currentProduct.category_id)
      .neq("uuid", productUuid)
      .limit(limit);

    if (error) throw new Error(error.message);
    return products || [];
  },

  /**
   * Get seller's products
   */
  async getSellerProducts(sellerId, options = {}) {
    const { limit = 20, offset = 0, status = null } = options;

    let query = supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name, slug),
        variants:product_variants(count)
      `
      )
      .eq("seller_id", sellerId)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data: products, error } = await query;

    if (error) throw new Error(error.message);
    return products || [];
  },

  /**
   * Create a new product (seller only)
   */
  async createProduct(productData) {
    const { data: product, error } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return product;
  },

  /**
   * Update a product (seller only)
   */
  async updateProduct(productUuid, updates) {
    const { data: product, error } = await supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("uuid", productUuid)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return product;
  },

  /**
   * Delete a product (seller only)
   */
  async deleteProduct(productUuid) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("uuid", productUuid);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  /**
   * Track product view
   */
  async trackProductView(productUuid, userId = null, sessionId = null) {
    const { error } = await supabase.from("view_history").insert({
      product_id: productUuid,
      user_id: userId,
      session_id: sessionId,
      viewed_at: new Date().toISOString(),
    });

    if (error && error.code !== "23505" && import.meta.env.DEV) {
      // Ignore unique constraint violations
      console.error("Error tracking view:", error);
    }

    return { success: true };
  },

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(productUuids, updates) {
    const { data: products, error } = await supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in("uuid", productUuids)
      .select();

    if (error) throw new Error(error.message);
    return products || [];
  },

  /**
   * Get product analytics for seller
   */
  async getProductAnalytics(productUuid, dateRange = "30d") {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    const { data: analytics, error } = await supabase
      .from("view_history")
      .select("viewed_at")
      .eq("product_id", productUuid)
      .gte("viewed_at", startDate.toISOString());

    if (error) throw new Error(error.message);

    // Process analytics data
    const viewsByDate = {};
    analytics?.forEach((view) => {
      const date = new Date(view.viewed_at).toISOString().split("T")[0];
      viewsByDate[date] = (viewsByDate[date] || 0) + 1;
    });

    return {
      totalViews: analytics?.length || 0,
      viewsByDate,
      averageViewsPerDay: Math.round(
        (analytics?.length || 0) / parseInt(dateRange)
      ),
    };
  },

  /**
   * Get product reviews
   */
  async getProductReviews(
    productUuid,
    { limit = 10, offset = 0, status = "approved" } = {}
  ) {
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        user:profiles(full_name, avatar)
      `
      )
      .eq("product_id", productUuid)
      .eq("status", status)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return reviews || [];
  },
};

// ✅ Ürün oluştur/güncelle
export async function createEditProduct(newProduct, id) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Giriş yapmalısınız");

  validateProductData(newProduct);

  // Satıcı kimliği zorunlu
  if (!user.seller_id) throw new Error("Sadece satıcılar ürün ekleyebilir");

  await Promise.all([
    uploadThumbnail(newProduct.thumbnail, user.id),
    uploadOtherImages(newProduct.otherImages, user.id),
  ]);

  const productData = {
    name: newProduct.name,
    description: newProduct.description,
    price: parseFloat(newProduct.regularPrice),
    discounted_price: newProduct.discounted_price
      ? parseFloat(newProduct.discounted_price)
      : null,
    stock_quantity: parseInt(newProduct.stock_quantity),
    category_id: newProduct.category_id,
    images: Array.isArray(newProduct.images) ? newProduct.images : [],
    brand: newProduct.brand,
    tags: Array.isArray(newProduct.tags) ? newProduct.tags : [],
    status: "active",
    delivery_time: newProduct.delivery_time || null,
    free_shipping: !!newProduct.free_shipping,
    // diğer opsiyonel alanlar
  };

  let query;
  if (!id) {
    query = supabase.from("products").insert([productData]);
  } else {
    const { data: existing } = await supabase
      .from("products")
      .select("user_id, seller_id")
      .eq("uuid", id)
      .single();

    if (
      !existing ||
      existing.user_id !== user.id ||
      existing.seller_id !== user.seller_id
    )
      throw new Error("Bu işlem için yetkiniz yok");

    query = supabase.from("products").update(productData).eq("uuid", id);
  }

  const { data, error } = await query.select().single();
  if (error) throw new Error("Kayıt hatası: " + error.message);

  return data;
}

// ❌ Ürün sil
export async function deleteProduct(id) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Giriş yapılmamış");

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("user_id, seller_id, thumbnail, otherImages")
    .eq("uuid", id)
    .single();

  if (fetchError) throw new Error("Ürün bulunamadı");
  if (product.user_id !== user.id || product.seller_id !== user.seller_id)
    throw new Error("Bu işlem için yetkiniz yok");

  await deleteProductImages(product);

  const { error } = await supabase.from("products").delete().eq("uuid", id);
  if (error) throw new Error("Silme hatası: " + error.message);

  return true;
}

// 🔁 Toplu durum güncelle
export async function bulkUpdateProductStatus({ productUuids, status }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Giriş yapılmamış");

  const { error } = await supabase
    .from("products")
    .update({ status })
    .in("uuid", productUuids)
    .eq("user_id", user.id);

  if (error) throw new Error("Toplu işlem hatası: " + error.message);

  return true;
}

// ✅ Thumbnail yükle
async function uploadThumbnail(file, userId) {
  if (!file || typeof file === "string") return file;

  const fileExt = file.name.split(".").pop();
  const fileName = `thumb-${userId}-${Date.now()}.${fileExt}`;
  const safeName = cleanFileName(fileName);

  const { error } = await supabase.storage
    .from("product-thumbnail")
    .upload(safeName, file, {
      contentType: file.type,
      cacheControl: "3600",
    });

  if (error) throw new Error(`Kapak resmi yüklenemedi: ${error.message}`);

  return `${supabaseUrl}/storage/v1/object/public/product-thumbnail/${safeName}`;
}

// ✅ Diğer görselleri yükle
async function uploadOtherImages(files = [], userId) {
  if (!files.length) return [];

  const uploadPromises = files.map(async (file) => {
    if (typeof file === "string") return file;

    const fileExt = file.name.split(".").pop();
    const fileName = `img-${userId}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileExt}`;
    const safeName = cleanFileName(fileName);

    const { error } = await supabase.storage
      .from("product-images")
      .upload(safeName, file, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (error) throw new Error(`Resim yüklenemedi: ${error.message}`);

    return `${supabaseUrl}/storage/v1/object/public/product-images/${safeName}`;
  });

  return Promise.all(uploadPromises);
}

// ✅ Resimleri sil
async function deleteProductImages(product) {
  const filesToDelete = [];

  if (product.thumbnail) {
    const thumbName = product.thumbnail.split("/").pop();
    filesToDelete.push(`product-thumbnail/${thumbName}`);
  }

  if (product.otherImages) {
    try {
      const otherImages = JSON.parse(product.otherImages);
      otherImages.forEach((img) => {
        const imgName = img.split("/").pop();
        filesToDelete.push(`product-images/${imgName}`);
      });
    } catch (err) {
      console.warn("Resimler parse edilemedi", err);
    }
  }

  if (filesToDelete.length > 0) {
    // 💥 HATA düzeltildi: Burada bucket adını boş vermemelisin
    const { error } = await supabase.storage
      .from("product-thumbnail")
      .remove(filesToDelete.filter((f) => f.startsWith("product-thumbnail/")));
    if (error) console.error("Thumbnail silinemedi", error);

    const { error: imgError } = await supabase.storage
      .from("product-images")
      .remove(filesToDelete.filter((f) => f.startsWith("product-images/")));
    if (imgError) console.error("Diğer görseller silinemedi", imgError);
  }
}

// Backward compatibility - export individual functions
export const getProducts = apiProducts.getProducts;
export const getProduct = apiProducts.getProduct;
export const getFeaturedProducts = apiProducts.getFeaturedProducts;
export const getBestSellers = apiProducts.getBestSellers;
export const getNewArrivals = apiProducts.getNewArrivals;

export async function getSellerById(sellerId) {
  const { data, error } = await supabase
    .from("sellers")
    .select("*", { count: "exact" })
    .eq("id", sellerId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}
