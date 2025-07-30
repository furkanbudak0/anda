import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

/**
 * Hook for fetching product reviews
 */
export function useProductReviews(productUuid, options = {}) {
  return useQuery({
    queryKey: ["product-reviews", productUuid],
    queryFn: async () => {
      if (!productUuid) return [];

      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          id,
          rating,
          title,
          comment,
          images,
          is_verified_purchase,
          helpful_count,
          not_helpful_count,
          created_at,
          user:profiles(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("product_id", productUuid)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!productUuid,
    ...options,
  });
}

/**
 * Hook for creating a new review
 */
export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      productUuid,
      orderId,
      rating,
      title,
      comment,
      images = [],
    }) => {
      if (!user) throw new Error("Kullanıcı girişi gerekli");

      // Check if user has already reviewed this product for this order
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("product_id", productUuid)
        .eq("user_id", user.id)
        .eq("order_id", orderId)
        .single();

      if (existingReview) {
        throw new Error("Bu ürün için zaten bir değerlendirme yapmışsınız");
      }

      // Verify user has purchased this product
      const { data: orderItem } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", orderId)
        .eq("product_id", productUuid)
        .single();

      if (!orderItem) {
        throw new Error(
          "Bu ürünü satın almadığınız için değerlendirme yapamazsınız"
        );
      }

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          product_id: productUuid,
          user_id: user.id,
          order_id: orderId,
          rating,
          title: title || "",
          comment: comment || "",
          images: images || [],
          is_verified_purchase: true,
          is_approved: true, // Auto-approve for now, admin can moderate later
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["product-reviews", data.product_id]);
      queryClient.invalidateQueries(["user-orders"]);
      toast.success("Değerlendirmeniz başarıyla eklendi!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook for voting on review helpfulness
 */
export function useVoteReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reviewId, isHelpful }) => {
      if (!user) throw new Error("Kullanıcı girişi gerekli");

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from("review_votes")
        .select("id, is_helpful")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .single();

      if (existingVote) {
        // Update existing vote
        const { error } = await supabase
          .from("review_votes")
          .update({ is_helpful: isHelpful })
          .eq("id", existingVote.id);

        if (error) throw new Error(error.message);

        // Update review counters
        if (existingVote.is_helpful !== isHelpful) {
          const incrementField = isHelpful
            ? "helpful_count"
            : "not_helpful_count";
          const decrementField = isHelpful
            ? "not_helpful_count"
            : "helpful_count";

          await supabase.rpc("update_review_vote_counts", {
            review_id: reviewId,
            increment_field: incrementField,
            decrement_field: decrementField,
          });
        }
      } else {
        // Create new vote
        const { error } = await supabase.from("review_votes").insert({
          review_id: reviewId,
          user_id: user.id,
          is_helpful: isHelpful,
        });

        if (error) throw new Error(error.message);

        // Update review counters
        const incrementField = isHelpful
          ? "helpful_count"
          : "not_helpful_count";
        const { error: updateError } = await supabase
          .from("product_reviews")
          .update({
            [incrementField]: supabase.raw(`${incrementField} + 1`),
          })
          .eq("id", reviewId);

        if (updateError) throw new Error(updateError.message);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["product-reviews"]);
      toast.success("Oyunuz kaydedildi!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook for admin review management
 */
export function useAdminReviews(filters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-reviews", filters],
    queryFn: async () => {
      if (!user || user.role !== "admin") {
        throw new Error("Yetkiniz yok");
      }

      let query = supabase
        .from("reviews")
        .select(
          `
          id,
          rating,
          title,
          comment,
          images,
          is_verified_purchase,
          is_approved,
          helpful_count,
          not_helpful_count,
          admin_notes,
          created_at,
          user:profiles(
            id,
            full_name,
            email,
            avatar_url
          ),
          product:products(
            id,
            name,
            slug,
            image_url
          )
        `
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.status === "pending") {
        query = query.eq("is_approved", false);
      } else if (filters.status === "approved") {
        query = query.eq("is_approved", true);
      }

      if (filters.rating) {
        query = query.eq("rating", filters.rating);
      }

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,comment.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: user?.role === "admin",
  });
}

/**
 * Hook for admin review moderation
 */
export function useModerateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reviewId, action, adminNotes = "" }) => {
      if (!user || user.role !== "admin") {
        throw new Error("Yetkiniz yok");
      }

      const updates = {
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      };

      if (action === "approve") {
        updates.is_approved = true;
      } else if (action === "reject") {
        updates.is_approved = false;
      }

      const { data, error } = await supabase
        .from("reviews")
        .update(updates)
        .eq("id", reviewId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["admin-reviews"]);
      queryClient.invalidateQueries(["product-reviews", data.product_id]);

      const actionText =
        variables.action === "approve" ? "onaylandı" : "reddedildi";
      toast.success(`İnceleme ${actionText}!`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook for deleting reviews (admin only)
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reviewId) => {
      if (!user || user.role !== "admin") {
        throw new Error("Yetkiniz yok");
      }

      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw new Error(error.message);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-reviews"]);
      queryClient.invalidateQueries(["product-reviews"]);
      toast.success("İnceleme silindi!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook for getting user's reviewable orders
 */
export function useReviewableOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reviewable-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("order_items")
        .select(
          `
          id,
          order_id,
          product_id,
          quantity,
          order:orders(
            id,
            status,
            created_at
          ),
          product:products(
            id,
            name,
            slug,
            image_url
          )
        `
        )
        .eq("orders.user_id", user.id)
        .eq("orders.status", "delivered")
        .order("order.created_at", { ascending: false });

      if (error) throw new Error(error.message);

      // Filter out items that already have reviews
      const itemsWithoutReviews = [];
      for (const item of data || []) {
        const { data: existingReview } = await supabase
          .from("product_reviews")
          .select("id")
          .eq("product_id", item.product_id)
          .eq("user_id", user.id)
          .eq("order_id", item.order_id)
          .single();

        if (!existingReview) {
          itemsWithoutReviews.push(item);
        }
      }

      return itemsWithoutReviews;
    },
    enabled: !!user,
  });
}
