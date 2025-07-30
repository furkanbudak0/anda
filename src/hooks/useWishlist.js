import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

/**
 * Favori sistemi için ana hook
 * Favorites tablosunu kullanır
 */
export const useWishlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Favorileri getir
  const {
    data: favorites = [],
    isLoading: favoritesLoading,
    error: favoritesError,
    refetch: refetchFavorites,
  } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select(
          `
          id,
          product_id,
          created_at,
          product:products(
            uuid,
            name,
            slug,
            image_url,
            price,
            discounted_price,
            stock,
            average_rating,
            total_reviews,
            seller:sellers(
              id,
              business_name,
              business_slug,
              logo_url
            )
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Favorites fetch error:", error);
        throw new Error("Favoriler yüklenemedi");
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 dakika
    retry: 2,
  });

  // Favori ekleme mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async (productUuid) => {
      if (!user?.id) {
        throw new Error("Giriş yapmalısınız");
      }

      if (!productUuid) {
        throw new Error("Geçerli bir ürün UUID'si gereklidir");
      }

      const { data, error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          product_id: String(productUuid),
        })
        .select()
        .single();

      if (error) {
        console.error("Add favorite error:", error);
        if (error.code === "23505") {
          throw new Error("Bu ürün zaten favorilerinizde!");
        }
        throw new Error("Favorilere eklenemedi");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["favorites", user?.id]);
      toast.success("Favorilere eklendi");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Favori çıkarma mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (productUuid) => {
      if (!user?.id) {
        throw new Error("Giriş yapmalısınız");
      }

      if (!productUuid) {
        throw new Error("Geçerli bir ürün UUID'si gereklidir");
      }

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", String(productUuid));

      if (error) {
        console.error("Remove favorite error:", error);
        throw new Error("Favorilerden çıkarılamadı");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["favorites", user?.id]);
      toast.success("Favorilerden çıkarıldı");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Bir ürünün favori olup olmadığını kontrol et
  const isFavorite = (productUuid) => {
    if (!user?.id || !productUuid || !favorites) return false;
    return favorites.some((fav) => fav.product_id === String(productUuid));
  };

  // Toggle favori durumu
  const toggleFavorite = async (productUuid) => {
    if (!user?.id) {
      toast.error("Favorilere eklemek için giriş yapmalısınız");
      return;
    }

    if (!productUuid) {
      toast.error("Geçerli bir ürün UUID'si gereklidir");
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite(productUuid)) {
        await removeFromFavoritesMutation.mutateAsync(productUuid);
      } else {
        await addToFavoritesMutation.mutateAsync(productUuid);
      }
    } catch (error) {
      console.error("Toggle favorite error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Favori sayısını al
  const getFavoritesCount = () => {
    return favorites?.length || 0;
  };

  return {
    // Data
    favorites,
    favoritesCount: getFavoritesCount(),

    // Loading states
    isLoading: favoritesLoading || isLoading,
    isAdding: addToFavoritesMutation.isPending,
    isRemoving: removeFromFavoritesMutation.isPending,

    // Error states
    error: favoritesError,

    // Functions
    isFavorite,
    toggleFavorite,
    addToFavorites: addToFavoritesMutation.mutate,
    removeFromFavorites: removeFromFavoritesMutation.mutate,
    refetchFavorites,
  };
};

/**
 * Alias for useWishlist for backward compatibility
 */
export const useFavorites = useWishlist;
