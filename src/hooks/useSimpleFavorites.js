import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";

/**
 * Sadeleştirilmiş Favorites Hook
 * Security definer function'ları kullanır
 * Karmaşık context yerine basit state yönetimi
 */
export const useSimpleFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
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
      setFavorites([]);
      setFavoritesCount(0);
    }
  }, [session, fetchFavorites]);

  // İlk yüklemede favorileri getir
  useEffect(() => {
    if (session) {
      fetchFavorites();
    }
  }, []);

  // Favorileri getir
  const fetchFavorites = useCallback(async () => {
    if (!session) {
      setFavorites([]);
      setFavoritesCount(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(
          `
          product_id,
          product:products(
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
        console.error("Favorites fetch error:", error);
        toast.error("Favoriler yüklenirken hata oluştu");
        return;
      }

      setFavorites(data || []);
      setFavoritesCount(data?.length || 0);
    } catch (error) {
      console.error("Favorites fetch error:", error);
      toast.error("Favoriler yüklenirken hata oluştu");
    }
  }, [session]);

  // Favori ekle/çıkar
  const toggleFavorite = useCallback(
    async (productId) => {
      if (!session) {
        toast.error("Favorilere eklemek için giriş yapmalısınız");
        return false;
      }

      try {
        const isFavorited = favorites.some(
          (fav) => fav.product_id === String(productId)
        );

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

          toast.success("Favorilerden çıkarıldı");
        } else {
          // Favoriye ekle
          const { error } = await supabase.from("favorites").insert({
            user_id: session.user.id,
            product_id: String(productId),
          });

          if (error) {
            if (error.code === "23505") {
              toast.error("Bu ürün zaten favorilerinizde");
              return false;
            }
            console.error("Add favorite error:", error);
            toast.error("Favorilere eklenirken hata oluştu");
            return false;
          }

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
    },
    [session, favorites, fetchFavorites]
  );

  // Ürünün favori olup olmadığını kontrol et
  const isFavorite = useCallback(
    (productId) => {
      if (!session) {
        return false;
      }

      const productIdStr = String(productId);
      return favorites.some((fav) => fav.product_id === productIdStr);
    },
    [session, favorites]
  );

  // Favori sayısını getir
  const fetchFavoritesCount = useCallback(() => {
    if (!session) {
      setFavoritesCount(0);
      return;
    }

    setFavoritesCount(favorites.length);
  }, [session, favorites]);

  // Favori ürün ID'lerini al
  const getFavoriteProductIds = useCallback(() => {
    return favorites.map((fav) => fav.product_id);
  }, [favorites]);

  // Favori ürünleri al
  const getFavoriteProducts = useCallback(() => {
    return favorites.map((fav) => fav.product);
  }, [favorites]);

  return {
    favorites,
    favoritesCount,
    toggleFavorite,
    isFavorite,
    fetchFavorites,
    fetchFavoritesCount,
    getFavoriteProductIds,
    getFavoriteProducts,
  };
};
