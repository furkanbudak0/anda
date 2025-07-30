import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
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

    // Auth state değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Session değiştiğinde sepeti getir
  useEffect(() => {
    if (session) {
      syncCart();
    } else {
      setItems([]);
    }
  }, [session]);

  // Sepeti getir (database'den)
  const fetchCart = async () => {
    if (!session) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          quantity,
          product_id,
          products (
            uuid,
            name,
            price,
            discounted_price,
            image_url,
            images,
            stock,
            seller_id,
            seller:sellers(business_name, business_slug, logo_url)
          )
        `
        )
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Cart fetch error:", error);
        toast.error("Sepet yüklenirken hata oluştu");
        return;
      }

      setItems(data || []);
    } catch (error) {
      console.error("Cart fetch error:", error);
      toast.error("Sepet yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Sepeti senkronize et
  const syncCart = async () => {
    await fetchCart();
  };

  // Ürünün sepette olup olmadığını kontrol et
  const isInCart = (productId) => {
    if (!items || items.length === 0) return 0;
    const cartItem = items.find(
      (item) => item.product_id === String(productId)
    );
    return cartItem ? cartItem.quantity : 0;
  };

  // Ürünün sepette olup olmadığını kontrol et (boolean)
  const isProductInCart = (productId) => {
    if (!items || items.length === 0) return false;
    return items.some((item) => item.product_id === String(productId));
  };

  // Sepete ürün ekle
  const addToCart = async (product, quantity = 1) => {
    if (!session) {
      toast.error("Sepete eklemek için giriş yapmalısınız");
      return false;
    }

    try {
      const { error } = await supabase.from("cart_items").upsert(
        {
          user_id: session.user.id,
          product_id: String(product.uuid),
          quantity: quantity,
        },
        { onConflict: "user_id,product_id" }
      );

      if (error) {
        console.error("Add to cart error:", error);
        toast.error("Sepete eklenirken hata oluştu");
        return false;
      }

      await syncCart(); // Sepeti yenile
      toast.success("Sepete eklendi");
      return true;
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Sepete eklenirken hata oluştu");
      return false;
    }
  };

  // Sepetten ürün çıkar
  const removeFromCart = async (productId) => {
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

      await syncCart(); // Sepeti yenile
      toast.success("Sepetten çıkarıldı");
      return true;
    } catch (error) {
      console.error("Remove from cart error:", error);
      toast.error("Sepetten çıkarılırken hata oluştu");
      return false;
    }
  };

  // Sepet miktarını güncelle
  const updateQuantity = async (productId, quantity) => {
    if (!session) {
      toast.error("Miktar güncellemek için giriş yapmalısınız");
      return false;
    }

    try {
      if (quantity <= 0) {
        return await removeFromCart(productId);
      }

      const { error } = await supabase
        .from("cart_items")
        .update({
          quantity: quantity,
        })
        .eq("user_id", session.user.id)
        .eq("product_id", String(productId));

      if (error) {
        console.error("Update quantity error:", error);
        toast.error("Miktar güncellenirken hata oluştu");
        return false;
      }

      await syncCart(); // Sepeti yenile
      toast.success("Miktar güncellendi");
      return true;
    } catch (error) {
      console.error("Update quantity error:", error);
      toast.error("Miktar güncellenirken hata oluştu");
      return false;
    }
  };

  // Sepeti temizle
  const clearCart = async () => {
    try {
      setItems([]);

      if (session) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", session.user.id);

        if (error) {
          console.error("Clear cart error:", error);
          toast.error("Sepet temizlenirken hata oluştu");
          return false;
        }
      }

      toast.success("Sepet temizlendi");
      return true;
    } catch (error) {
      console.error("Clear cart error:", error);
      toast.error("Sepet temizlenirken hata oluştu");
      return false;
    }
  };

  // Toplam fiyat hesapla
  const getTotal = () => {
    return items.reduce((total, item) => {
      const price =
        item.products?.discounted_price || item.products?.price || 0;
      return total + price * item.quantity;
    }, 0);
  };

  // Toplam ürün sayısı
  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Sepet sayısını getir
  const getCartCount = async () => {
    if (!session) return 0;

    try {
      const { count, error } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Cart count error:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Cart count error:", error);
      return 0;
    }
  };

  const value = {
    items,
    loading,
    cartCount: getItemCount(), // NavBar için cart count
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    getCartCount,
    syncCart,
    isInCart,
    isProductInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
