import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";

/**
 * Wishlist API functions
 */
const wishlistAPI = {
  /**
   * Get user's wishlists
   */
  async getWishlists(userId) {
    const { data, error } = await supabase
      .from("wishlists")
      .select(
        `
        id,
        name,
        is_default,
        created_at,
        wishlist_items(
          id,
          product:products(
            id,
            name,
            slug,
            image_url,
            price,
            compare_at_price,
            seller:sellers(business_name)
          ),
          variant:product_variants(
            id,
            title,
            price,
            image_url
          ),
          created_at
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  /**
   * Get default wishlist
   */
  async getDefaultWishlist(userId) {
    const { data, error } = await supabase
      .from("wishlists")
      .select(
        `
        id,
        name,
        is_default,
        created_at,
        wishlist_items(
          id,
          product:products(
            id,
            name,
            slug,
            image_url,
            price,
            compare_at_price,
            seller:sellers(business_name)
          ),
          variant:product_variants(
            id,
            title,
            price,
            image_url
          ),
          created_at
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_default", true)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Create a new wishlist
   */
  async createWishlist(userId, name, isDefault = false) {
    const { data, error } = await supabase
      .from("wishlists")
      .insert({
        user_id: userId,
        name,
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Add item to wishlist
   */
  async addToWishlist(wishlistId, productId, variantId = null) {
    // Check if item already exists
    const { data: existing } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("wishlist_id", wishlistId)
      .eq("product_id", productId)
      .eq("variant_id", variantId)
      .single();

    if (existing) {
      throw new Error("Bu ürün zaten favorilerinizde!");
    }

    const { data, error } = await supabase
      .from("wishlist_items")
      .insert({
        wishlist_id: wishlistId,
        product_id: productId,
        variant_id: variantId,
      })
      .select(
        `
        id,
        product:products(
          id,
          name,
          slug,
          image_url,
          price,
          compare_at_price,
          seller:sellers(business_name)
        ),
        variant:product_variants(
          id,
          title,
          price,
          image_url
        ),
        created_at
      `
      )
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Remove item from wishlist
   */
  async removeFromWishlist(wishlistId, productId, variantId = null) {
    let query = supabase
      .from("wishlist_items")
      .delete()
      .eq("wishlist_id", wishlistId)
      .eq("product_id", productId);

    if (variantId) {
      query = query.eq("variant_id", variantId);
    } else {
      query = query.is("variant_id", null);
    }

    const { error } = await query;

    if (error) throw new Error(error.message);
    return { success: true };
  },

  /**
   * Remove wishlist item by ID
   */
  async removeWishlistItem(itemId) {
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", itemId);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  /**
   * Update wishlist
   */
  async updateWishlist(wishlistId, updates) {
    const { data, error } = await supabase
      .from("wishlists")
      .update(updates)
      .eq("id", wishlistId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Delete wishlist
   */
  async deleteWishlist(wishlistId) {
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", wishlistId);

    if (error) throw new Error(error.message);
    return { success: true };
  },

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(userId, productId, variantId = null) {
    let query = supabase
      .from("wishlist_items")
      .select("id, wishlist:wishlists(id)")
      .eq("product_id", productId);

    if (variantId) {
      query = query.eq("variant_id", variantId);
    } else {
      query = query.is("variant_id", null);
    }

    // Filter by user's wishlists
    query = query.eq("wishlist.user_id", userId);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  },

  /**
   * Get wishlist stats
   */
  async getWishlistStats(userId) {
    const { data, error } = await supabase
      .from("wishlists")
      .select(
        `
        id,
        name,
        wishlist_items(count)
      `
      )
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    const totalItems =
      data?.reduce(
        (sum, wishlist) => sum + (wishlist.wishlist_items?.[0]?.count || 0),
        0
      ) || 0;

    return {
      totalWishlists: data?.length || 0,
      totalItems,
      wishlists: data || [],
    };
  },
};

/**
 * Hook for fetching user's wishlists
 */
export function useWishlists() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wishlists", user?.id],
    queryFn: () => wishlistAPI.getWishlists(user.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching default wishlist
 */
export function useDefaultWishlist() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wishlist", "default", user?.id],
    queryFn: () => wishlistAPI.getDefaultWishlist(user.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for creating a wishlist
 */
export function useCreateWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, isDefault = false }) =>
      wishlistAPI.createWishlist(user.id, name, isDefault),
    onSuccess: () => {
      queryClient.invalidateQueries(["wishlists", user.id]);
      toast.success("Favori listesi oluşturuldu!");
    },
    onError: (error) => {
      toast.error(`Liste oluşturulurken hata: ${error.message}`);
    },
  });
}

/**
 * Hook for adding items to wishlist
 */
export function useAddToWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variantId = null, wishlistId = null }) => {
      if (!user?.id) throw new Error("Giriş yapmanız gerekiyor");

      let targetWishlistId = wishlistId;

      // If no specific wishlist provided, use default
      if (!targetWishlistId) {
        const defaultWishlist = await wishlistAPI.getDefaultWishlist(user.id);

        if (!defaultWishlist) {
          // Create default wishlist if it doesn't exist
          const newWishlist = await wishlistAPI.createWishlist(
            user.id,
            "Favorilerim",
            true
          );
          targetWishlistId = newWishlist.id;
        } else {
          targetWishlistId = defaultWishlist.id;
        }
      }

      return wishlistAPI.addToWishlist(targetWishlistId, productId, variantId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["wishlists", user.id]);
      queryClient.invalidateQueries(["wishlist"]);
      toast.success("Ürün favorilere eklendi!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook for removing items from wishlist
 */
export function useRemoveFromWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      wishlistId,
      productId,
      variantId = null,
      itemId = null,
    }) => {
      if (itemId) {
        return wishlistAPI.removeWishlistItem(itemId);
      }
      return wishlistAPI.removeFromWishlist(wishlistId, productId, variantId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["wishlists", user.id]);
      queryClient.invalidateQueries(["wishlist"]);
      toast.success("Ürün favorilerden çıkarıldı!");
    },
    onError: (error) => {
      toast.error(`Favorilerden çıkarılırken hata: ${error.message}`);
    },
  });
}

/**
 * Hook for updating wishlist details
 */
export function useUpdateWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ wishlistId, updates }) =>
      wishlistAPI.updateWishlist(wishlistId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(["wishlists", user.id]);
      toast.success("Liste güncellendi!");
    },
    onError: (error) => {
      toast.error(`Liste güncellenirken hata: ${error.message}`);
    },
  });
}

/**
 * Hook for deleting a wishlist
 */
export function useDeleteWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: wishlistAPI.deleteWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries(["wishlists", user.id]);
      toast.success("Liste silindi!");
    },
    onError: (error) => {
      toast.error(`Liste silinirken hata: ${error.message}`);
    },
  });
}

/**
 * Hook for checking if product is in wishlist
 */
export function useIsInWishlist(productId, variantId = null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wishlist-check", user?.id, productId, variantId],
    queryFn: () => wishlistAPI.isInWishlist(user.id, productId, variantId),
    enabled: !!user?.id && !!productId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for wishlist statistics
 */
export function useWishlistStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wishlist-stats", user?.id],
    queryFn: () => wishlistAPI.getWishlistStats(user.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Custom hook for wishlist toggle functionality
 */
export function useWishlistToggle() {
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { user } = useAuth();

  const toggleWishlist = async ({
    productId,
    variantId = null,
    isInWishlist = false,
  }) => {
    if (!user?.id) {
      toast.error("Favorilere eklemek için giriş yapmalısınız");
      return;
    }

    try {
      if (isInWishlist) {
        await removeFromWishlist.mutateAsync({ productId, variantId });
      } else {
        await addToWishlist.mutateAsync({ productId, variantId });
      }
    } catch (error) {
      // Error handling is done in the individual hooks
    }
  };

  return {
    toggleWishlist,
    isLoading: addToWishlist.isPending || removeFromWishlist.isPending,
  };
}
