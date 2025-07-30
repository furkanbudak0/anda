import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { toast } from "react-hot-toast";

// Admin Users Management
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          user:auth.users(email, created_at, last_sign_in_at)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Kullanıcı başarıyla güncellendi");
    },
    onError: (error) => {
      toast.error(error.message || "Kullanıcı güncellenirken hata oluştu");
    },
  });
}

// Admin Products Management
export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:sellers(business_name),
          category:categories(name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, updates }) => {
      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("uuid", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-products"]);
      toast.success("Ürün başarıyla güncellendi");
    },
    onError: (error) => {
      toast.error(error.message || "Ürün güncellenirken hata oluştu");
    },
  });
}

// Admin Sellers Management
export function useAdminSellers() {
  return useQuery({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select(
          `
          *,
          user:profiles(full_name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminUpdateSeller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sellerId, updates }) => {
      const { error } = await supabase
        .from("sellers")
        .update(updates)
        .eq("id", sellerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-sellers"]);
      toast.success("Satıcı başarıyla güncellendi");
    },
    onError: (error) => {
      toast.error(error.message || "Satıcı güncellenirken hata oluştu");
    },
  });
}

// Admin Orders Management
export function useAdminOrders() {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          user:profiles(full_name, email),
          order_items(
            *,
            product:products(name, image_url)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, updates }) => {
      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-orders"]);
      toast.success("Sipariş başarıyla güncellendi");
    },
    onError: (error) => {
      toast.error(error.message || "Sipariş güncellenirken hata oluştu");
    },
  });
}

// Admin Reviews Management
export function useAdminReviews() {
  return useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          user:profiles(full_name),
          product:products(name, image_url)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminModerateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, action }) => {
      const updates = {
        is_approved: action === "approve",
        moderated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("reviews")
        .update(updates)
        .eq("id", reviewId);

      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries(["admin-reviews"]);
      toast.success(
        `Yorum başarıyla ${action === "approve" ? "onaylandı" : "reddedildi"}`
      );
    },
    onError: (error) => {
      toast.error(error.message || "Yorum moderasyonu sırasında hata oluştu");
    },
  });
}

// Admin Dashboard Statistics
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Get basic counts
      const [
        { count: usersCount },
        { count: productsCount },
        { count: sellersCount },
        { count: ordersCount },
        { count: reviewsCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("sellers").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
      ]);

      // Get recent orders for revenue calculation
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .eq("status", "completed");

      const totalRevenue =
        recentOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      return {
        usersCount: usersCount || 0,
        productsCount: productsCount || 0,
        sellersCount: sellersCount || 0,
        ordersCount: ordersCount || 0,
        reviewsCount: reviewsCount || 0,
        totalRevenue,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
