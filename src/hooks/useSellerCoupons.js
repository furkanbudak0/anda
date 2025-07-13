import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

/**
 * SELLER COUPON CREATION SİSTEMİ
 *
 * Özellikler:
 * - Kupon oluşturma ve yönetimi
 * - Farklı kupon tipleri (yüzde, sabit tutar, bedava kargo)
 * - Kullanım sınırları ve koşulları
 * - Otomatik kod üretimi
 * - Performans analitikleri
 * - Zamanlı kampanyalar
 * - Müşteri segmentasyonu
 */

/**
 * Seller coupons hook
 */
export function useSellerCoupons() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Satıcının kuponlarını getir
  const {
    data: coupons = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["seller-coupons", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("seller_coupons")
        .select(
          `
          *,
          usage_stats:coupon_usage(count)
        `
        )
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Kupon oluşturma
  const createCoupon = useMutation({
    mutationFn: async (couponData) => {
      if (!user?.id) throw new Error("Satıcı girişi gerekli");

      // Generate unique coupon code if not provided
      const couponCode = couponData.code || generateCouponCode();

      // Validate coupon code uniqueness
      const { data: existingCoupon } = await supabase
        .from("seller_coupons")
        .select("id")
        .eq("code", couponCode)
        .single();

      if (existingCoupon) {
        throw new Error("Bu kupon kodu zaten kullanılıyor");
      }

      const { data, error } = await supabase
        .from("seller_coupons")
        .insert({
          seller_id: user.id,
          code: couponCode,
          name: couponData.name,
          description: couponData.description,
          type: couponData.type, // percentage, fixed_amount, free_shipping, buy_x_get_y
          value: couponData.value,
          minimum_order_amount: couponData.minimumOrderAmount || 0,
          maximum_discount_amount: couponData.maximumDiscountAmount || null,
          usage_limit: couponData.usageLimit || null,
          usage_limit_per_customer: couponData.usageLimitPerCustomer || 1,
          start_date: couponData.startDate,
          end_date: couponData.endDate,
          is_active: couponData.isActive !== false,
          applicable_products: couponData.applicableProducts || null,
          applicable_categories: couponData.applicableCategories || null,
          customer_segments: couponData.customerSegments || null,
          special_conditions: couponData.specialConditions || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-coupons"]);
      toast.success("Kupon başarıyla oluşturuldu!");
    },
    onError: (error) => {
      toast.error(error.message || "Kupon oluşturulurken hata oluştu");
    },
  });

  // Kupon güncelleme
  const updateCoupon = useMutation({
    mutationFn: async ({ couponId, updates }) => {
      const { data, error } = await supabase
        .from("seller_coupons")
        .update(updates)
        .eq("id", couponId)
        .eq("seller_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-coupons"]);
      toast.success("Kupon güncellendi!");
    },
    onError: (error) => {
      toast.error(error.message || "Kupon güncellenirken hata oluştu");
    },
  });

  // Kupon silme
  const deleteCoupon = useMutation({
    mutationFn: async (couponId) => {
      const { error } = await supabase
        .from("seller_coupons")
        .delete()
        .eq("id", couponId)
        .eq("seller_id", user.id);

      if (error) throw error;
      return couponId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-coupons"]);
      toast.success("Kupon silindi!");
    },
    onError: (error) => {
      toast.error(error.message || "Kupon silinirken hata oluştu");
    },
  });

  // Kupon durumu değiştirme
  const toggleCouponStatus = useMutation({
    mutationFn: async ({ couponId, isActive }) => {
      const { data, error } = await supabase
        .from("seller_coupons")
        .update({ is_active: isActive })
        .eq("id", couponId)
        .eq("seller_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["seller-coupons"]);
      toast.success(
        data.is_active
          ? "Kupon aktifleştirildi!"
          : "Kupon devre dışı bırakıldı!"
      );
    },
  });

  return {
    coupons,
    isLoading,
    error,
    createCoupon: createCoupon.mutate,
    updateCoupon: updateCoupon.mutate,
    deleteCoupon: deleteCoupon.mutate,
    toggleCouponStatus: toggleCouponStatus.mutate,
    isCreating: createCoupon.isPending,
    isUpdating: updateCoupon.isPending,
    isDeleting: deleteCoupon.isPending,
  };
}

/**
 * Kupon analitikleri hook'u
 */
export function useCouponAnalytics(couponId) {
  return useQuery({
    queryKey: ["coupon-analytics", couponId],
    queryFn: async () => {
      if (!couponId) return null;

      // Kupon kullanım istatistikleri
      const { data: usageStats, error: usageError } = await supabase
        .from("coupon_usage")
        .select(
          `
          id,
          used_at,
          order_value,
          discount_amount,
          user_id,
          order:orders(id, total_amount)
        `
        )
        .eq("coupon_id", couponId);

      if (usageError) throw usageError;

      // Analitik hesaplamaları
      const totalUsages = usageStats?.length || 0;
      const totalDiscount =
        usageStats?.reduce(
          (sum, usage) => sum + (usage.discount_amount || 0),
          0
        ) || 0;
      const totalOrderValue =
        usageStats?.reduce((sum, usage) => sum + (usage.order_value || 0), 0) ||
        0;
      const averageOrderValue =
        totalUsages > 0 ? totalOrderValue / totalUsages : 0;
      const averageDiscount = totalUsages > 0 ? totalDiscount / totalUsages : 0;

      // Günlük kullanım trendi
      const dailyUsage =
        usageStats?.reduce((acc, usage) => {
          const date = new Date(usage.used_at).toISOString().split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {}) || {};

      // Unique kullanıcılar
      const uniqueUsers = new Set(usageStats?.map((usage) => usage.user_id))
        .size;

      return {
        totalUsages,
        totalDiscount,
        totalOrderValue,
        averageOrderValue,
        averageDiscount,
        uniqueUsers,
        dailyUsage,
        conversionRate: totalUsages > 0 ? (totalUsages / 100) * 100 : 0, // This would be calculated differently in real app
        roi:
          totalOrderValue > 0
            ? ((totalOrderValue - totalDiscount) / totalDiscount) * 100
            : 0,
      };
    },
    enabled: !!couponId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Kupon şablonları hook'u
 */
export function useCouponTemplates() {
  const templates = [
    {
      id: "welcome",
      name: "Hoş Geldin Kuponu",
      description: "Yeni müşteriler için %15 indirim",
      type: "percentage",
      value: 15,
      minimumOrderAmount: 100,
      usageLimitPerCustomer: 1,
      customerSegments: ["new_customers"],
    },
    {
      id: "flash_sale",
      name: "Flaş İndirim",
      description: "24 saat süreyle %25 indirim",
      type: "percentage",
      value: 25,
      minimumOrderAmount: 200,
      usageLimit: 100,
    },
    {
      id: "free_shipping",
      name: "Bedava Kargo",
      description: "150₺ üzeri alışverişlerde bedava kargo",
      type: "free_shipping",
      value: 0,
      minimumOrderAmount: 150,
    },
    {
      id: "loyalty",
      name: "Sadakat Kuponu",
      description: "Eski müşteriler için 50₺ indirim",
      type: "fixed_amount",
      value: 50,
      minimumOrderAmount: 300,
      customerSegments: ["returning_customers"],
    },
    {
      id: "bulk_discount",
      name: "Toplu Alım İndirimi",
      description: "3 ürün alana %20 indirim",
      type: "percentage",
      value: 20,
      specialConditions: { minimumItemCount: 3 },
    },
  ];

  return { templates };
}

/**
 * Kupon validasyonu hook'u
 */
export function useCouponValidation() {
  const validateCoupon = async (couponCode, orderDetails) => {
    try {
      const { data: coupon, error } = await supabase
        .from("seller_coupons")
        .select(
          `
          *,
          seller:sellers(business_name, id),
          usage_count:coupon_usage(count)
        `
        )
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !coupon) {
        return { valid: false, error: "Geçersiz kupon kodu" };
      }

      // Date validations
      const now = new Date();
      const startDate = coupon.start_date ? new Date(coupon.start_date) : null;
      const endDate = coupon.end_date ? new Date(coupon.end_date) : null;

      if (startDate && now < startDate) {
        return { valid: false, error: "Kupon henüz aktif değil" };
      }

      if (endDate && now > endDate) {
        return { valid: false, error: "Kupon süresi dolmuş" };
      }

      // Usage limit validation
      const currentUsage = coupon.usage_count?.[0]?.count || 0;
      if (coupon.usage_limit && currentUsage >= coupon.usage_limit) {
        return { valid: false, error: "Kupon kullanım limiti dolmuş" };
      }

      // Minimum order amount validation
      if (
        coupon.minimum_order_amount &&
        orderDetails.total < coupon.minimum_order_amount
      ) {
        return {
          valid: false,
          error: `Minimum ${coupon.minimum_order_amount}₺ alışveriş gerekli`,
        };
      }

      // Calculate discount
      let discountAmount = 0;
      switch (coupon.type) {
        case "percentage":
          discountAmount = (orderDetails.total * coupon.value) / 100;
          if (coupon.maximum_discount_amount) {
            discountAmount = Math.min(
              discountAmount,
              coupon.maximum_discount_amount
            );
          }
          break;
        case "fixed_amount":
          discountAmount = Math.min(coupon.value, orderDetails.total);
          break;
        case "free_shipping":
          discountAmount = orderDetails.shippingCost || 0;
          break;
        default:
          discountAmount = 0;
      }

      return {
        valid: true,
        coupon,
        discountAmount,
        finalTotal: Math.max(0, orderDetails.total - discountAmount),
      };
    } catch (error) {
      return { valid: false, error: "Kupon doğrulanırken hata oluştu" };
    }
  };

  return { validateCoupon };
}

/**
 * Otomatik kupon kampanyaları hook'u
 */
export function useAutomatedCampaigns() {
  const { user } = useAuth();

  const createAutomatedCampaign = useMutation({
    mutationFn: async (campaignData) => {
      const { data, error } = await supabase
        .from("automated_campaigns")
        .insert({
          seller_id: user.id,
          name: campaignData.name,
          trigger_type: campaignData.triggerType, // cart_abandonment, first_purchase, birthday, etc.
          trigger_conditions: campaignData.triggerConditions,
          coupon_template: campaignData.couponTemplate,
          is_active: campaignData.isActive !== false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Otomatik kampanya oluşturuldu!");
    },
  });

  return {
    createAutomatedCampaign: createAutomatedCampaign.mutate,
  };
}

// Helper functions
function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export { generateCouponCode };
