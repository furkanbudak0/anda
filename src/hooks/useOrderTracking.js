import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

/**
 * COMPREHENSIVE ORDER TRACKING SYSTEM
 *
 * Features:
 * - Real-time order status tracking
 * - Carrier integration (Yurtiçi, MNG, Aras, PTT)
 * - Detailed tracking history
 * - Estimated delivery dates
 * - Customer notifications
 * - Guest tracking with tracking codes
 */

/**
 * Hook for tracking orders by tracking code (public)
 */
export function useTrackOrder(trackingCode) {
  return useQuery({
    queryKey: ["track-order", trackingCode],
    queryFn: async () => {
      if (!trackingCode) return null;

      const { data, error } = await supabase
        .from("order_tracking")
        .select(
          `
          *,
          order:orders(
            id,
            order_number,
            total_amount,
            created_at,
            user:users(full_name, email),
            shipping_address:user_addresses(
              full_name,
              address_line_1,
              city,
              district,
              postal_code,
              phone
            ),
            order_items(
              id,
              quantity,
              price,
              product:products(
                name,
                image_url,
                slug
              )
            )
          )
        `
        )
        .eq("tracking_code", trackingCode.toUpperCase())
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Takip kodu bulunamadı");
        }
        throw new Error("Sipariş takip edilemedi");
      }

      return data;
    },
    enabled: !!trackingCode,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook for user's order tracking list
 */
export function useUserOrderTracking() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-order-tracking", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("order_tracking")
        .select(
          `
          *,
          order:orders!inner(
            id,
            order_number,
            total_amount,
            created_at,
            status as order_status,
            order_items(
              quantity,
              price,
              product:products(name, image_url)
            )
          )
        `
        )
        .eq("order.user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error("Siparişler yüklenemedi");
      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for seller order tracking management
 */
export function useSellerOrderTracking() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-order-tracking", user?.seller_id],
    queryFn: async () => {
      if (!user?.seller_id) return [];

      const { data, error } = await supabase
        .from("order_tracking")
        .select(
          `
          *,
          order:orders!inner(
            id,
            order_number,
            total_amount,
            created_at,
            user:users(full_name, email),
            order_items!inner(
              quantity,
              price,
              product:products(name, image_url)
            )
          )
        `
        )
        .eq("order.order_items.seller_id", user.seller_id)
        .order("created_at", { ascending: false });

      if (error) throw new Error("Satıcı siparişleri yüklenemedi");
      return data || [];
    },
    enabled: !!user?.seller_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for updating order tracking status (seller/admin)
 */
export function useUpdateOrderTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, updates }) => {
      const { data, error } = await supabase
        .from("order_tracking")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .select()
        .single();

      if (error) throw new Error("Takip bilgisi güncellenemedi");

      // Update status history
      if (updates.current_status) {
        const statusHistory = data.status_history || [];
        const newEntry = {
          status: updates.current_status,
          description: updates.status_description || "",
          timestamp: new Date().toISOString(),
          location: updates.current_location || null,
        };

        await supabase
          .from("order_tracking")
          .update({
            status_history: [...statusHistory, newEntry],
          })
          .eq("order_id", orderId);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["user-order-tracking"]);
      queryClient.invalidateQueries(["seller-order-tracking"]);
      queryClient.invalidateQueries(["track-order"]);

      toast.success("Takip bilgisi güncellendi!");

      // Send notification to customer
      if (data.order_id) {
        sendTrackingNotification(data);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Güncelleme başarısız");
    },
  });
}

/**
 * Hook for setting carrier information
 */
export function useSetCarrierInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, carrierInfo }) => {
      const { data, error } = await supabase
        .from("order_tracking")
        .update({
          carrier_company: carrierInfo.company,
          carrier_tracking_number: carrierInfo.trackingNumber,
          current_status: "shipped",
          status_description: `${carrierInfo.company} ile kargoya verildi`,
          shipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .select()
        .single();

      if (error) throw new Error("Kargo bilgisi eklenemedi");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-order-tracking"]);
      queryClient.invalidateQueries(["user-order-tracking"]);
      toast.success("Kargo bilgisi eklendi!");
    },
    onError: (error) => {
      toast.error(error.message || "Kargo bilgisi eklenemedi");
    },
  });
}

/**
 * Hook for generating tracking codes for new orders
 */
export function useGenerateTrackingCode() {
  return useMutation({
    mutationFn: async (orderId) => {
      // Generate unique tracking code
      const trackingCode = generateTrackingCode();

      const { data, error } = await supabase
        .from("order_tracking")
        .insert({
          order_id: orderId,
          tracking_code: trackingCode,
          current_status: "pending",
          status_description: "Sipariş alındı, hazırlanıyor",
          status_history: [
            {
              status: "pending",
              description: "Sipariş alındı",
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .select()
        .single();

      if (error) throw new Error("Takip kodu oluşturulamadı");
      return data;
    },
  });
}

/**
 * Hook for estimated delivery calculation
 */
export function useEstimatedDelivery(
  shippingMethod,
  sellerLocation,
  customerAddress
) {
  return useQuery({
    queryKey: [
      "estimated-delivery",
      shippingMethod,
      sellerLocation,
      customerAddress,
    ],
    queryFn: async () => {
      // Business logic for delivery estimation
      const baseDeliveryDays = {
        standard: 3,
        express: 1,
        premium: 0, // Same day
      };

      const baseDays = baseDeliveryDays[shippingMethod] || 3;

      // Add extra days based on distance (simplified)
      let extraDays = 0;
      if (sellerLocation && customerAddress) {
        // Simple distance calculation - in real app use proper geocoding
        if (sellerLocation.city !== customerAddress.city) {
          extraDays += 1;
        }
      }

      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + baseDays + extraDays);

      return {
        estimatedDate,
        businessDays: baseDays + extraDays,
        shippingMethod,
      };
    },
    enabled: !!shippingMethod,
  });
}

/**
 * Utility functions
 */

// Generate unique tracking code
function generateTrackingCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "AND"; // ANDA prefix

  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

// Send tracking notification to customer
async function sendTrackingNotification(trackingData) {
  try {
    // Get customer info from order
    const { data: order } = await supabase
      .from("orders")
      .select("user_id")
      .eq("id", trackingData.order_id)
      .single();

    if (order) {
      await supabase.from("notifications").insert({
        user_id: order.user_id,
        notification_type: "order_update",
        title: "Sipariş Durumu Güncellendi",
        message: `Siparişiniz: ${trackingData.status_description}`,
        channels: ["app", "email"],
        action_url: `/track/${trackingData.tracking_code}`,
        action_data: {
          tracking_code: trackingData.tracking_code,
          status: trackingData.current_status,
        },
      });
    }
  } catch (error) {
    console.error("Notification send error:", error);
  }
}

/**
 * Order status configurations
 */
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: "Sipariş Alındı",
    color: "yellow",
    description: "Siparişiniz alındı ve işleme konuldu",
    icon: "📋",
  },
  confirmed: {
    label: "Onaylandı",
    color: "blue",
    description: "Siparişiniz onaylandı ve hazırlanıyor",
    icon: "✅",
  },
  preparing: {
    label: "Hazırlanıyor",
    color: "purple",
    description: "Siparişiniz paketleniyor",
    icon: "📦",
  },
  shipped: {
    label: "Kargoda",
    color: "orange",
    description: "Siparişiniz kargo firmasına teslim edildi",
    icon: "🚚",
  },
  in_transit: {
    label: "Yolda",
    color: "indigo",
    description: "Siparişiniz size doğru yolda",
    icon: "🛣️",
  },
  out_for_delivery: {
    label: "Dağıtımda",
    color: "green",
    description: "Siparişiniz bugün teslim edilecek",
    icon: "🏃‍♂️",
  },
  delivered: {
    label: "Teslim Edildi",
    color: "green",
    description: "Siparişiniz başarıyla teslim edildi",
    icon: "🎉",
  },
  cancelled: {
    label: "İptal Edildi",
    color: "red",
    description: "Sipariş iptal edildi",
    icon: "❌",
  },
  returned: {
    label: "İade Edildi",
    color: "gray",
    description: "Sipariş iade işlemi tamamlandı",
    icon: "↩️",
  },
};

/**
 * Carrier companies configuration
 */
export const CARRIER_COMPANIES = [
  {
    id: "yurtici",
    name: "Yurtiçi Kargo",
    trackingUrl:
      "https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula",
    estimatedDays: 2,
  },
  {
    id: "mng",
    name: "MNG Kargo",
    trackingUrl: "https://www.mngkargo.com.tr/takip",
    estimatedDays: 2,
  },
  {
    id: "aras",
    name: "Aras Kargo",
    trackingUrl: "https://www.araskargo.com.tr/takip",
    estimatedDays: 3,
  },
  {
    id: "ptt",
    name: "PTT Kargo",
    trackingUrl: "https://www.pttlojistik.com.tr/takip",
    estimatedDays: 4,
  },
  {
    id: "ups",
    name: "UPS",
    trackingUrl: "https://www.ups.com/track",
    estimatedDays: 1,
  },
];

/**
 * Hook for carrier tracking integration
 */
export function useCarrierTracking(carrierCompany, carrierTrackingNumber) {
  return useQuery({
    queryKey: ["carrier-tracking", carrierCompany, carrierTrackingNumber],
    queryFn: async () => {
      if (!carrierCompany || !carrierTrackingNumber) return null;

      // This would integrate with actual carrier APIs
      // For now, return mock data
      return {
        status: "in_transit",
        location: "Ankara Dağıtım Merkezi",
        lastUpdate: new Date().toISOString(),
        estimatedDelivery: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(),
      };
    },
    enabled: !!carrierCompany && !!carrierTrackingNumber,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });
}
