import supabase from "./supabase";

export const getSellerById = async (sellerId) => {
  if (!sellerId) throw new Error("Satıcı ID bulunamadı");

  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", sellerId)
    .single();

  if (error) throw new Error("Satıcı bulunamadı: " + error.message);
  return data;
};

export const getSellers = async ({ status, page = 1, pageSize = 10 }) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("sellers")
    .select("*", { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) throw new Error("Satıcılar alınamadı: " + error.message);

  return {
    data,
    totalCount: count,
    page,
    pageSize,
  };
};

export const updateSeller = async (sellerId, updateData) => {
  if (!sellerId) throw new Error("Satıcı ID bulunamadı");

  const { data, error } = await supabase
    .from("sellers")
    .update(updateData)
    .eq("id", sellerId)
    .select()
    .single();

  if (error) throw new Error("Satıcı güncellenemedi: " + error.message);
  return data;
};

export const updateSellerStatus = async ({ sellerId, status }) => {
  if (!sellerId) throw new Error("Satıcı ID bulunamadı");

  const { data, error } = await supabase
    .from("sellers")
    .update({ status })
    .eq("id", sellerId)
    .select()
    .single();

  if (error) throw new Error("Satıcı durumu güncellenemedi: " + error.message);
  return data;
};

// 🔎 Satıcıya ait ürünleri getirme (DÜZELTİLDİ!)
export const getProductsBySeller = async (sellerId) => {
  if (!sellerId) throw new Error("Satıcı ID bulunamadı");

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", sellerId); // ✅ DÜZELTİLDİ: user_id

  if (error) throw new Error("Ürünler alınamadı: " + error.message);
  return data;
};
