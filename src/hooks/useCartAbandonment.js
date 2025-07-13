import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

/**
 * CART ABANDONMENT TRACKING SYSTEM
 *
 * Features:
 * - Track cart abandonment after 10 minutes
 * - Send recovery notifications
 * - Track recovery rates
 * - Email and push notifications
 * - Guest user support with session tracking
 */

/**
 * Hook for tracking cart abandonment
 */
export function useCartAbandonmentTracking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const trackAbandonment = useMutation({
    mutationFn: async (cartData) => {
      const { data, error } = await supabase
        .from("cart_abandonment")
        .insert({
          user_id: user?.id || null,
          session_id: !user ? generateSessionId() : null,
          cart_data: cartData,
          total_amount: cartData.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),
          abandoned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new Error("Abandonment tracking failed");
      return data;
    },
    onSuccess: () => {
      // Schedule reminder for 10 minutes later
      setTimeout(() => {
        sendAbandonmentReminder();
      }, 10 * 60 * 1000); // 10 minutes
    },
  });

  const markAsRecovered = useMutation({
    mutationFn: async (abandonmentId) => {
      const { error } = await supabase
        .from("cart_abandonment")
        .update({
          is_recovered: true,
          recovered_at: new Date().toISOString(),
        })
        .eq("id", abandonmentId);

      if (error) throw new Error("Recovery tracking failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["cart-abandonment"]);
    },
  });

  const sendAbandonmentReminder = async () => {
    if (!user) return;

    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        notification_type: "cart_abandonment",
        title: "Sepetinizdeki ürünler sizi bekliyor! 🛒",
        message:
          "Sepetinizde bıraktığınız ürünleri satın almak ister misiniz? Stoklar tükenmeden önce alışverişinizi tamamlayın.",
        channels: ["app", "email"],
        action_url: "/cart",
        action_data: {
          source: "cart_abandonment",
          reminder_type: "10_minute",
        },
      });

      toast("Sepetinizdeki ürünler sizi bekliyor!", {
        icon: "🛒",
        duration: 5000,
        position: "top-right",
      });
    } catch (error) {
      console.error("Failed to send abandonment reminder:", error);
    }
  };

  return {
    trackAbandonment,
    markAsRecovered,
  };
}

/**
 * Hook for getting cart abandonment analytics
 */
export function useCartAbandonmentAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cart-abandonment-analytics", user?.seller_id],
    queryFn: async () => {
      if (!user?.seller_id) return null;

      // Get abandonment data for seller's products
      const { data, error } = await supabase
        .from("cart_abandonment")
        .select(
          `
          *,
          cart_data
        `
        )
        .gte(
          "abandoned_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("abandoned_at", { ascending: false });

      if (error) throw new Error("Analytics yüklenemedi");

      // Filter and process data for seller's products
      const sellerAbandonments = data.filter((abandonment) => {
        const cartData = Array.isArray(abandonment.cart_data)
          ? abandonment.cart_data
          : JSON.parse(abandonment.cart_data || "[]");

        return cartData.some((item) => item.seller_id === user.seller_id);
      });

      const totalAbandonments = sellerAbandonments.length;
      const recoveredAbandonments = sellerAbandonments.filter(
        (a) => a.is_recovered
      ).length;
      const recoveryRate =
        totalAbandonments > 0
          ? (recoveredAbandonments / totalAbandonments) * 100
          : 0;

      const totalValue = sellerAbandonments.reduce(
        (sum, a) => sum + (a.total_amount || 0),
        0
      );
      const recoveredValue = sellerAbandonments
        .filter((a) => a.is_recovered)
        .reduce((sum, a) => sum + (a.total_amount || 0), 0);

      return {
        totalAbandonments,
        recoveredAbandonments,
        recoveryRate,
        totalValue,
        recoveredValue,
        lostRevenue: totalValue - recoveredValue,
        averageAbandonmentValue:
          totalAbandonments > 0 ? totalValue / totalAbandonments : 0,
      };
    },
    enabled: !!user?.seller_id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for processing cart abandonment recovery
 */
export function useRecoverAbandonedCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ abandonmentId, cartItems }) => {
      // Mark abandonment as recovered
      const { error: updateError } = await supabase
        .from("cart_abandonment")
        .update({
          is_recovered: true,
          recovered_at: new Date().toISOString(),
        })
        .eq("id", abandonmentId);

      if (updateError) throw new Error("Recovery tracking failed");

      // Process the actual purchase
      // This would integrate with your order creation logic
      return { success: true, abandonmentId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["cart-abandonment"]);
      toast.success("Sepet başarıyla kurtarıldı!");
    },
  });
}

/**
 * Utility function to generate session ID for guest users
 */
function generateSessionId() {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook for cart abandonment prevention
 */
export function useCartAbandonmentPrevention() {
  const { user } = useAuth();

  const preventAbandonment = useMutation({
    mutationFn: async ({ strategy, data }) => {
      const strategies = {
        exit_intent: async () => {
          // Show exit intent popup
          return showExitIntentOffer(data);
        },
        discount_offer: async () => {
          // Offer discount
          return createDiscountOffer(data);
        },
        free_shipping: async () => {
          // Offer free shipping
          return createFreeShippingOffer(data);
        },
        limited_time: async () => {
          // Create urgency with limited time offer
          return createLimitedTimeOffer(data);
        },
      };

      if (strategies[strategy]) {
        return await strategies[strategy]();
      }

      throw new Error("Unknown prevention strategy");
    },
  });

  return { preventAbandonment };
}

/**
 * Prevention strategy implementations
 */
async function showExitIntentOffer(data) {
  // This would show a modal or popup with special offer
  return {
    type: "exit_intent_popup",
    message: "Gitmeden önce! Sepetinizdeki ürünler için özel indirim",
    discount: 10, // 10% discount
    validUntil: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  };
}

async function createDiscountOffer(data) {
  return {
    type: "discount_offer",
    discount: 15,
    message: "Sepetinizi tamamlayın, %15 indirim kazanın!",
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };
}

async function createFreeShippingOffer(data) {
  return {
    type: "free_shipping",
    message: "Bu siparişinizde kargo bizden!",
    validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
  };
}

async function createLimitedTimeOffer(data) {
  return {
    type: "limited_time",
    message: "Son 30 dakika! Bu fiyatlar çok yakında değişecek",
    validUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    urgencyLevel: "high",
  };
}

/**
 * Hook for cart abandonment email campaigns
 */
export function useCartAbandonmentEmailCampaign() {
  return useMutation({
    mutationFn: async ({ abandonmentIds, emailTemplate, delay }) => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .insert({
          type: "cart_abandonment",
          target_abandonments: abandonmentIds,
          template: emailTemplate,
          scheduled_for: new Date(Date.now() + delay).toISOString(),
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw new Error("Email campaign creation failed");
      return data;
    },
    onSuccess: () => {
      toast.success("Email kampanyası oluşturuldu!");
    },
  });
}

/**
 * Cart abandonment email templates
 */
export const CART_ABANDONMENT_EMAIL_TEMPLATES = {
  first_reminder: {
    subject: "Sepetinizdeki ürünleri unutmayın! 🛒",
    delay: 10 * 60 * 1000, // 10 minutes
    content: `
      <h2>Sepetinizdeki ürünler sizi bekliyor!</h2>
      <p>Merhaba,</p>
      <p>Sepetinizde bıraktığınız harika ürünler hala sizin için ayrılmış durumda. Stoklar tükenmeden alışverişinizi tamamlamak ister misiniz?</p>
      <div class="cart-items">
        {{CART_ITEMS}}
      </div>
      <a href="{{CART_URL}}" class="cta-button">Sepetime Dön</a>
    `,
  },
  second_reminder: {
    subject: "Son şans! Sepetinizdeki ürünler için %10 indirim 🎁",
    delay: 24 * 60 * 60 * 1000, // 24 hours
    content: `
      <h2>Özel indirim fırsatı!</h2>
      <p>Sepetinizdeki ürünler için sizlere özel %10 indirim kuponumuz var!</p>
      <div class="discount-code">
        Kupon Kodu: <strong>SEPET10</strong>
      </div>
      <a href="{{CART_URL}}" class="cta-button">İndirimi Kullan</a>
    `,
  },
  final_reminder: {
    subject: "Bu ürünler çok yakında satıştan kalkacak! ⏰",
    delay: 72 * 60 * 60 * 1000, // 72 hours
    content: `
      <h2>Son uyarı!</h2>
      <p>Sepetinizdeki ürünlerden bazıları stoktan tükenmek üzere. Bu fırsatı kaçırmayın!</p>
      <div class="urgency-message">
        ⚡ Sadece birkaç adet kaldı!
      </div>
      <a href="{{CART_URL}}" class="cta-button">Hemen Satın Al</a>
    `,
  },
};
