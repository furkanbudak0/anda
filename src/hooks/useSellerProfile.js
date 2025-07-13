import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

/**
 * Hook for managing seller profile data and operations
 */
export function useSellerProfile(sellerId) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch seller profile data
  const {
    data: sellerProfile,
    isLoading: profileLoading,
    error,
  } = useQuery({
    queryKey: ["seller-profile", sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select(
          `
          *,
          follower_count:seller_followers(count),
          products:products(
            id,
            name,
            price,
            discounted_price,
            images,
            status,
            reviews:reviews(rating)
          )
        `
        )
        .eq("id", sellerId)
        .single();

      if (error) {
        console.error("Seller profile fetch error:", error);
        throw new Error("Satıcı profili yüklenemedi");
      }

      return data;
    },
    enabled: !!sellerId,
  });

  // Check if current user follows this seller
  const { data: isFollowing, isLoading: followLoading } = useQuery({
    queryKey: ["seller-following", sellerId, user?.id],
    queryFn: async () => {
      if (!user?.id || !sellerId) return false;

      const { data, error } = await supabase
        .from("seller_followers")
        .select("id")
        .eq("user_id", user.id)
        .eq("seller_id", sellerId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Follow check error:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id && !!sellerId,
  });

  return {
    sellerProfile,
    isLoading: profileLoading,
    error,
    isFollowing,
    followLoading,
  };
}

/**
 * Hook for seller avatar upload
 */
export function useAvatarUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file) => {
      if (!file || !user?.seller_id) {
        throw new Error("Dosya ve satıcı ID gerekli");
      }

      // Validate file type and size
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Sadece JPG, PNG veya WebP formatında resim yükleyebilirsiniz"
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        throw new Error("Dosya boyutu 5MB'dan küçük olmalıdır");
      }

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${user.seller_id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("seller-avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        throw new Error("Avatar yükleme başarısız");
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("seller-avatars").getPublicUrl(fileName);

      // Update seller profile
      const { data: updateData, error: updateError } = await supabase
        .from("sellers")
        .update({ avatar_url: publicUrl })
        .eq("id", user.seller_id)
        .select()
        .single();

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw new Error("Profil güncelleme başarısız");
      }

      return updateData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["seller-profile", user?.seller_id]);
      toast.success("Avatar başarıyla güncellendi!");
    },
    onError: (error) => {
      toast.error(error.message || "Avatar yükleme başarısız");
    },
  });
}

/**
 * Hook for updating seller location
 */
export function useLocationUpdate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ location, showPublic }) => {
      if (!user?.seller_id) {
        throw new Error("Satıcı girişi gerekli");
      }

      const { data, error } = await supabase
        .from("sellers")
        .update({
          store_location: location,
          show_location_public: showPublic,
        })
        .eq("id", user.seller_id)
        .select()
        .single();

      if (error) {
        console.error("Location update error:", error);
        throw new Error("Konum güncelleme başarısız");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-profile", user?.seller_id]);
      toast.success("Konum bilgileri güncellendi!");
    },
    onError: (error) => {
      toast.error(error.message || "Konum güncelleme başarısız");
    },
  });
}

/**
 * Hook for toggling seller follow
 */
export function useSellerFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sellerId, isCurrentlyFollowing }) => {
      if (!user?.id) {
        throw new Error("Giriş yapmalısınız");
      }

      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("seller_followers")
          .delete()
          .eq("user_id", user.id)
          .eq("seller_id", sellerId);

        if (error) {
          console.error("Unfollow error:", error);
          throw new Error("Takip iptal etme başarısız");
        }

        return { action: "unfollowed" };
      } else {
        // Follow
        const { error } = await supabase.from("seller_followers").insert({
          user_id: user.id,
          seller_id: sellerId,
        });

        if (error) {
          console.error("Follow error:", error);
          throw new Error("Takip etme başarısız");
        }

        return { action: "followed" };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        "seller-following",
        variables.sellerId,
        user?.id,
      ]);
      queryClient.invalidateQueries(["seller-profile", variables.sellerId]);

      const message =
        data.action === "followed"
          ? "Satıcı takip edildi!"
          : "Satıcı takipten çıkarıldı!";
      toast.success(message);
    },
    onError: (error) => {
      toast.error(error.message || "İşlem başarısız");
    },
  });
}

/**
 * Hook for seller store hours management
 */
export function useStoreHours() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeHours) => {
      if (!user?.seller_id) {
        throw new Error("Satıcı girişi gerekli");
      }

      const { data, error } = await supabase
        .from("sellers")
        .update({ store_hours: storeHours })
        .eq("id", user.seller_id)
        .select()
        .single();

      if (error) {
        console.error("Store hours update error:", error);
        throw new Error("Çalışma saatleri güncelleme başarısız");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-profile", user?.seller_id]);
      toast.success("Çalışma saatleri güncellendi!");
    },
    onError: (error) => {
      toast.error(error.message || "Güncelleme başarısız");
    },
  });
}

/**
 * Hook for seller shipping configuration
 */
export function useShippingConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current shipping config
  const { data: shippingConfig, isLoading } = useQuery({
    queryKey: ["seller-shipping-config", user?.seller_id],
    queryFn: async () => {
      if (!user?.seller_id) return null;

      const { data, error } = await supabase
        .from("seller_shipping_configs")
        .select("*")
        .eq("seller_id", user.seller_id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Shipping config fetch error:", error);
        return null;
      }

      return data;
    },
    enabled: !!user?.seller_id,
  });

  // Update shipping config
  const updateShippingConfig = useMutation({
    mutationFn: async (configData) => {
      if (!user?.seller_id) {
        throw new Error("Satıcı girişi gerekli");
      }

      const { data, error } = await supabase
        .from("seller_shipping_configs")
        .upsert({
          seller_id: user.seller_id,
          ...configData,
        })
        .select()
        .single();

      if (error) {
        console.error("Shipping config update error:", error);
        throw new Error("Kargo ayarları güncelleme başarısız");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([
        "seller-shipping-config",
        user?.seller_id,
      ]);
      toast.success("Kargo ayarları güncellendi!");
    },
    onError: (error) => {
      toast.error(error.message || "Güncelleme başarısız");
    },
  });

  return {
    shippingConfig,
    isLoading,
    updateShippingConfig,
  };
}

/**
 * Hook for seller analytics and ratings visibility
 */
export function useSellerVisibility() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ showRatings, showAnalytics, showLocation }) => {
      if (!user?.seller_id) {
        throw new Error("Satıcı girişi gerekli");
      }

      const { data, error } = await supabase
        .from("sellers")
        .update({
          show_ratings_public: showRatings,
          show_analytics_public: showAnalytics,
          show_location_public: showLocation,
        })
        .eq("id", user.seller_id)
        .select()
        .single();

      if (error) {
        console.error("Visibility update error:", error);
        throw new Error("Görünürlük ayarları güncelleme başarısız");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-profile", user?.seller_id]);
      toast.success("Görünürlük ayarları güncellendi!");
    },
    onError: (error) => {
      toast.error(error.message || "Güncelleme başarısız");
    },
  });
}
