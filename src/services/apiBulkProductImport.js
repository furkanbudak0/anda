import { supabase } from "./supabase";

/**
 * Bulk Product Import API service
 */
const apiBulkProductImport = {
  // Import products in bulk
  importProducts: async (products, sellerId) => {
    const productsWithSeller = products.map((product) => ({
      ...product,
      seller_id: sellerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("products")
      .insert(productsWithSeller)
      .select();

    if (error) throw error;
    return data;
  },

  // Validate product data
  validateProductData: (product) => {
    const errors = [];

    if (!product.name) errors.push("Ürün adı gerekli");
    if (!product.price) errors.push("Ürün fiyatı gerekli");
    if (!product.category_id) errors.push("Kategori seçimi gerekli");

    return errors;
  },

  // Get import template
  getImportTemplate: () => {
    return [
      {
        name: "Ürün Adı",
        price: "Fiyat",
        description: "Açıklama",
        category_id: "Kategori ID",
        stock_quantity: "Stok Miktarı",
        images: "Resim URL'leri (virgülle ayrılmış)",
      },
    ];
  },
};

/**
 * Start bulk import process
 */
export const startBulkImport = async (sellerId, fileName) => {
  const { data, error } = await supabase
    .from("bulk_imports")
    .insert({
      seller_id: sellerId,
      file_name: fileName,
      status: "processing",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get bulk import history for a seller
 */
export const getBulkImportHistory = async (sellerId) => {
  const { data, error } = await supabase
    .from("bulk_imports")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export { apiBulkProductImport };
