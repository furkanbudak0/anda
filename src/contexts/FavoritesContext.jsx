import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favoriteProductIds, setFavoriteProductIds] = useState([]);
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

  // Session değiştiğinde favorileri getir
  useEffect(() => {
    if (session) {
      fetchFavorites();
    } else {
      setFavoriteProductIds([]);
    }
  }, [session]);

  // Favorileri getir
  const fetchFavorites = async () => {
    if (!session) {
      setFavoriteProductIds([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Favorites fetch error:", error);
        toast.error("Favoriler yüklenirken hata oluştu");
        return;
      }

      const productIds = data?.map((item) => item.product_id) || [];
      setFavoriteProductIds(productIds);
    } catch (error) {
      console.error("Favorites fetch error:", error);
      toast.error("Favoriler yüklenirken hata oluştu");
    }
  };

  // Favori ekle/çıkar
  const toggleFavorite = async (productId) => {
    if (!session) {
      toast.error("Favorilere eklemek için giriş yapmalısınız");
      return false;
    }

    try {
      const isFavorited = favoriteProductIds.includes(String(productId));

      if (isFavorited) {
        // Favoriden çıkar
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", session.user.id)
          .eq("product_id", String(productId));

        if (error) {
          console.error("Remove favorite error:", error);
          toast.error("Favorilerden çıkarılırken hata oluştu");
          return false;
        }

        // Local state'i güncelle
        setFavoriteProductIds((prev) =>
          prev.filter((id) => id !== String(productId))
        );

        toast.success("Favorilerden çıkarıldı");
      } else {
        // Favoriye ekle
        const { error } = await supabase.from("favorites").insert({
          user_id: session.user.id,
          product_id: String(productId),
        });

        if (error) {
          if (error.code === "23505") {
            // Zaten favorilerde
            toast.error("Bu ürün zaten favorilerinizde");
            return false;
          }
          console.error("Add favorite error:", error);
          toast.error("Favorilere eklenirken hata oluştu");
          return false;
        }

        // Local state'i güncelle
        setFavoriteProductIds((prev) => [...prev, String(productId)]);

        toast.success("Favorilere eklendi");
      }

      // Favorileri yeniden yükle (invalidate queries)
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error("Toggle favorite error:", error);
      toast.error("Favori işlemi sırasında hata oluştu");
      return false;
    }
  };

  // Favori ekle
  const addFavorite = async (productId) => {
    if (!session) {
      toast.error("Favori eklemek için giriş yapmalısınız");
      return false;
    }

    try {
      const { error } = await supabase.from("favorites").insert({
        user_id: session.user.id,
        product_id: String(productId),
      });

      if (error) {
        console.error("Add favorite error:", error);
        if (error.code === "23505") {
          toast.error("Bu ürün zaten favorilerinizde!");
          return false;
        }
        toast.error("Favori eklenirken hata oluştu");
        return false;
      }

      setFavoriteProductIds((prev) => [...prev, String(productId)]);
      toast.success("Favorilere eklendi");
      return true;
    } catch (error) {
      console.error("Add favorite error:", error);
      toast.error("Favori eklenirken hata oluştu");
      return false;
    }
  };

  // Favori çıkar
  const removeFavorite = async (productId) => {
    if (!session) {
      toast.error("Favori çıkarmak için giriş yapmalısınız");
      return false;
    }

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", session.user.id)
        .eq("product_id", String(productId));

      if (error) {
        console.error("Remove favorite error:", error);
        toast.error("Favori çıkarılırken hata oluştu");
        return false;
      }

      setFavoriteProductIds((prev) =>
        prev.filter((id) => id !== String(productId))
      );
      toast.success("Favorilerden çıkarıldı");
      return true;
    } catch (error) {
      console.error("Remove favorite error:", error);
      toast.error("Favori çıkarılırken hata oluştu");
      return false;
    }
  };

  // Favori mi?
  const isFavorite = (productId) =>
    favoriteProductIds.includes(String(productId));

  // Favori ürünleri getir (detaylı)
  const getFavoriteProducts = async () => {
    if (!session) return [];

    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(
          `
          products (
            uuid,
            name,
            price,
            discounted_price,
            image_url,
            images,
            stock,
            average_rating,
            total_reviews,
            seller_id,
            seller:sellers(business_name, business_slug, logo_url)
          )
        `
        )
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Get favorite products error:", error);
        return [];
      }

      return data.map((item) => item.products).filter(Boolean);
    } catch (error) {
      console.error("Get favorite products error:", error);
      return [];
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteProductIds,
        favoritesCount: favoriteProductIds.length,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        getFavoriteProducts,
        fetchFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

FavoritesProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context)
    throw new Error("useFavorites must be used within a FavoritesProvider");
  return context;
};
