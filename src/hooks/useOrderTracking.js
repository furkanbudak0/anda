import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";

// Sipariş takip bilgilerini getir
export function useOrderTracking(orderId) {
  return useQuery({
    queryKey: ["order-tracking", orderId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { data, error } = await supabase
        .from("order_tracking")
        .select(
          `
          *,
          shipping_tracking_details(*)
        `
        )
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!orderId,
  });
}

// Sipariş durumu geçmişini getir
export function useOrderStatusHistory(orderId) {
  return useQuery({
    queryKey: ["order-status-history", orderId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!orderId,
  });
}

// Kargo firmalarını getir
export function useShippingCompanies() {
  return useQuery({
    queryKey: ["shipping-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_companies")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });
}

// Satıcı için sipariş takip bilgilerini getir
export function useSellerOrderTracking(sellerId) {
  return useQuery({
    queryKey: ["seller-order-tracking", sellerId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { data, error } = await supabase
        .from("order_tracking")
        .select(
          `
          *,
          order:orders(
            id,
            order_number,
            total_amount,
            status,
            created_at,
            user:users(email, full_name)
          ),
          shipping_tracking_details(*)
        `
        )
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!sellerId,
  });
}

// Satıcı için siparişleri getir (order_items tablosundan)
export function useSellerOrders(sellerId) {
  return useQuery({
    queryKey: ["seller-orders", sellerId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { data, error } = await supabase
        .from("order_items")
        .select(
          `
          *,
          order:orders(
            id,
            order_number,
            total_amount,
            status,
            payment_status,
            fulfillment_status,
            created_at,
            shipping_address,
            billing_address,
            notes,
            user:users(email, full_name)
          ),
          product:products(
            name,
            image_url,
            uuid,
            price,
            discounted_price
          )
        `
        )
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!sellerId,
  });
}

// Sipariş takip bilgisi ekle/güncelle (satıcı için)
export function useUpdateOrderTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderTrackingId, trackingData }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { data, error } = await supabase
        .from("order_tracking")
        .update({
          ...trackingData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderTrackingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["order-tracking"]);
      queryClient.invalidateQueries(["seller-order-tracking"]);
      toast.success("Kargo bilgileri güncellendi");
    },
    onError: (error) => {
      toast.error(
        error.message || "Kargo bilgileri güncellenirken hata oluştu"
      );
    },
  });
}

// Kargo takip detayı ekle
export function useAddShippingTrackingDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderTrackingId, trackingDetail }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { data, error } = await supabase
        .from("shipping_tracking_details")
        .insert({
          order_tracking_id: orderTrackingId,
          ...trackingDetail,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["order-tracking"]);
      queryClient.invalidateQueries(["seller-order-tracking"]);
      toast.success("Kargo takip detayı eklendi");
    },
    onError: (error) => {
      toast.error(error.message || "Kargo takip detayı eklenirken hata oluştu");
    },
  });
}

// Sipariş durumunu güncelle
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { data, error } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["order-status-history"]);
      toast.success("Sipariş durumu güncellendi");
    },
    onError: (error) => {
      toast.error(error.message || "Sipariş durumu güncellenirken hata oluştu");
    },
  });
}
