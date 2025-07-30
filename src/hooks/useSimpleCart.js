import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";

/**
 * Sadeleştirilmiş Cart Hook
 * Security definer function'ları kullanır
 * Karmaşık context yerine basit state yönetimi
 */
export const useSimpleCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [session, setSession] = useState(null);

  // Session kontrolü
  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session) {
        setSession(data.session);
      }
    };
    fetchSession();
  }, []);

  // Sepeti getir
  const fetchCart = useCallback(async () => {
    if (!session) {
      setCartItems([]);
      setCartCount(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          product_id,
          quantity,
          created_at,
          updated_at,
          product:products(
            uuid,
            name,
            price,
            discounted_price,
            image_url,
            stock_quantity
          )
        `
        )
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Cart fetch error:", error);
        toast.error("Sepet yüklenirken hata oluştu");
        return;
      }

      setCartItems(data || []);
      setCartCount(data?.reduce((sum, item) => sum + item.quantity, 0) || 0);
    } catch (error) {
      console.error("Cart fetch error:", error);
      toast.error("Sepet yüklenirken hata oluştu");
    }
  }, [session]);

  // Sepete ürün ekle
  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!session) {
        toast.error("Sepete eklemek için giriş yapmalısınız");
        return false;
      }

      try {
        const { error } = await supabase.from("cart_items").upsert(
          {
            user_id: session.user.id,
            product_id: String(productId),
            quantity: quantity,
          },
          { onConflict: "user_id,product_id" }
        );

        if (error) {
          console.error("Add to cart error:", error);
          toast.error("Sepete eklenirken hata oluştu");
          return false;
        }

        toast.success("Sepete eklendi");
        await fetchCart(); // Sepeti yenile
        return true;
      } catch (error) {
        console.error("Add to cart error:", error);
        toast.error("Sepete eklenirken hata oluştu");
        return false;
      }
    },
    [session, fetchCart]
  );

  // Sepetten ürün çıkar
  const removeFromCart = useCallback(
    async (productId) => {
      if (!session) {
        toast.error("Sepetten çıkarmak için giriş yapmalısınız");
        return false;
      }

      try {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", session.user.id)
          .eq("product_id", String(productId));

        if (error) {
          console.error("Remove from cart error:", error);
          toast.error("Sepetten çıkarılırken hata oluştu");
          return false;
        }

        toast.success("Sepetten çıkarıldı");
        await fetchCart(); // Sepeti yenile
        return true;
      } catch (error) {
        console.error("Remove from cart error:", error);
        toast.error("Sepetten çıkarılırken hata oluştu");
        return false;
      }
    },
    [session, fetchCart]
  );

  // Sepet miktarını güncelle
  const updateQuantity = useCallback(
    async (productId, quantity) => {
      if (!session) {
        toast.error("Miktar güncellemek için giriş yapmalısınız");
        return false;
      }

      try {
        const { data, error } = await supabase.rpc(
          "update_cart_quantity_simple",
          {
            p_product_id: String(productId),
            p_quantity: quantity,
          }
        );

        if (error) {
          console.error("Update quantity error:", error);
          toast.error("Miktar güncellenirken hata oluştu");
          return false;
        }

        if (data.success) {
          toast.success(data.message || "Miktar güncellendi");
          await fetchCart(); // Sepeti yenile
          return true;
        } else {
          toast.error(data.error || "Miktar güncellenirken hata oluştu");
          return false;
        }
      } catch (error) {
        console.error("Update quantity error:", error);
        toast.error("Miktar güncellenirken hata oluştu");
        return false;
      }
    },
    [session, fetchCart]
  );

  // Sepet toplamını hesapla
  const getTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const price = item.product.discounted_price || item.product.price;
      return total + price * item.quantity;
    }, 0);
  }, [cartItems]);

  // Sepet öğe sayısını al
  const getItemCount = useCallback(() => {
    return cartCount;
  }, [cartCount]);

  // Sepet sayısını getir
  const fetchCartCount = useCallback(async () => {
    if (!session) {
      setCartCount(0);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("get_cart_count_simple");

      if (error) {
        console.error("Cart count error:", error);
        return;
      }

      if (data.success) {
        setCartCount(data.count || 0);
      }
    } catch (error) {
      console.error("Cart count error:", error);
    }
  }, [session]);

  // Sepeti temizle
  const clearCart = useCallback(async () => {
    if (!session) {
      toast.error("İşlem için giriş yapmalısınız");
      return false;
    }

    try {
      // Tüm sepet öğelerini sil
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Clear cart error:", error);
        toast.error("Sepet temizlenirken hata oluştu");
        return false;
      }

      toast.success("Sepet temizlendi");
      setCartItems([]);
      setCartCount(0);
      return true;
    } catch (error) {
      console.error("Clear cart error:", error);
      toast.error("Sepet temizlenirken hata oluştu");
      return false;
    }
  }, [session]);

  // Session değiştiğinde sepeti yenile
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Session değiştiğinde sepet sayısını yenile
  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  return {
    cartItems,
    loading,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotal,
    getItemCount,
    clearCart,
    fetchCart,
    fetchCartCount,
  };
};
