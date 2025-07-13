// services/getProductById.js
import supabase from "./supabase";

const getProductById = async (id) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single(); // bu kısmı anla.

  if (error) throw new Error("Ürün bulunamadı");
  return data;
};

export default getProductById;
