import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

/**
 * HIZLI ÖDEME (EXPRESS CHECKOUT) SİSTEMİ
 *
 * Özellikler:
 * - Tek tık satın alma
 * - Sepete eklemeden doğrudan ödeme
 * - Varsayılan adres ve ödeme yöntemi kullanımı
 * - Hızlı checkout flow
 * - Misafir kullanıcı desteği
 */

/**
 * Express checkout için ana hook
 */
export function useExpressCheckout() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Kullanıcının varsayılan adres ve ödeme bilgilerini getir
  const { data: defaultOptions, isLoading: optionsLoading } = useQuery({
    queryKey: ["express-checkout-defaults", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Varsayılan adresi al
      const { data: defaultAddress } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single();

      // Varsayılan ödeme yöntemini al
      const { data: defaultPayment } = await supabase
        .from("user_payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single();

      return {
        defaultAddress,
        defaultPayment,
        hasDefaults: defaultAddress && defaultPayment,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Express checkout mutation
  const expressCheckout = useMutation({
    mutationFn: async ({
      productId,
      variantId = null,
      quantity = 1,
      useDefaults = true,
      customAddress = null,
      customPayment = null,
    }) => {
      // Giriş kontrolü
      if (!isAuthenticated) {
        throw new Error("LOGIN_REQUIRED");
      }

      // Ürün bilgilerini al
      const { data: product, error: productError } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:sellers(business_name, id, commission_rate),
          variants:product_variants(*)
        `
        )
        .eq("id", productId)
        .single();

      if (productError || !product) {
        throw new Error("Ürün bulunamadı");
      }

      // Stok kontrolü
      const variant = variantId
        ? product.variants.find((v) => v.id === variantId)
        : null;

      const availableStock = variant?.quantity || product.stock_quantity || 0;

      if (availableStock < quantity) {
        throw new Error("Yeterli stok bulunmuyor");
      }

      // Adres ve ödeme bilgilerini belirle
      let shippingAddress, paymentMethod;

      if (useDefaults && defaultOptions?.hasDefaults) {
        shippingAddress = defaultOptions.defaultAddress;
        paymentMethod = defaultOptions.defaultPayment;
      } else {
        shippingAddress = customAddress;
        paymentMethod = customPayment;
      }

      if (!shippingAddress || !paymentMethod) {
        throw new Error("SETUP_REQUIRED");
      }

      // Fiyat hesaplaması
      const unitPrice = variant?.price || product.price;
      const subtotal = unitPrice * quantity;
      const taxRate = 0.18; // %18 KDV
      const taxAmount = subtotal * taxRate;
      const shippingCost = subtotal >= 150 ? 0 : 29.99; // 150₺ üzeri ücretsiz kargo
      const total = subtotal + taxAmount + shippingCost;

      // Sipariş oluştur
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: generateOrderNumber(),
          status: "pending",

          // Ürün bilgileri
          total_amount: total,
          subtotal_amount: subtotal,
          tax_amount: taxAmount,
          shipping_cost: shippingCost,

          // Adres bilgileri
          shipping_address: shippingAddress,
          billing_address: shippingAddress, // Aynı adres kullan

          // Ödeme bilgileri
          payment_method: paymentMethod.method_type,
          payment_details: {
            cardLastFour: paymentMethod.last_four_digits,
            cardBrand: paymentMethod.card_brand,
          },

          // Express checkout flag
          is_express_checkout: true,

          // Meta bilgiler
          notes: "Hızlı satın alma ile oluşturuldu",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        throw new Error("Sipariş oluşturulamadı");
      }

      // Sipariş öğesi oluştur
      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: productId,
        variant_id: variantId,
        seller_id: product.seller.id,
        quantity,
        unit_price: unitPrice,
        total_price: unitPrice * quantity,
        product_name: product.name,
        product_image: variant?.image_url || product.images?.[0],
        variant_details: variant
          ? {
              title: variant.title,
              attributes: variant.attributes,
            }
          : null,
      });

      if (itemError) {
        throw new Error("Sipariş öğesi oluşturulamadı");
      }

      // Stok güncelle
      if (variant) {
        await supabase
          .from("product_variants")
          .update({ quantity: variant.quantity - quantity })
          .eq("id", variantId);
      } else {
        await supabase
          .from("products")
          .update({ stock_quantity: product.stock_quantity - quantity })
          .eq("id", productId);
      }

      return {
        order,
        product,
        variant,
        total,
        redirectUrl: `/order-success/${order.id}?express=true`,
      };
    },
    onSuccess: (data) => {
      toast.success("Siparişiniz başarıyla oluşturuldu!");

      // Analitik tracking
      trackExpressCheckout(data);

      // Başarı sayfasına yönlendir
      navigate(data.redirectUrl);
    },
    onError: (error) => {
      console.error("Express checkout error:", error);

      if (error.message === "LOGIN_REQUIRED") {
        toast.error("Hızlı satın alma için giriş yapmalısınız");
        navigate("/auth", {
          state: {
            from: location.pathname,
            expressCheckout: true,
          },
        });
      } else if (error.message === "SETUP_REQUIRED") {
        toast.error(
          "Hızlı satın alma için adres ve ödeme bilgilerinizi tamamlayın"
        );
        navigate("/account", {
          state: {
            tab: "addresses",
            expressCheckout: true,
          },
        });
      } else {
        toast.error(error.message || "Sipariş oluşturulamadı");
      }
    },
  });

  // Express checkout uygunluk kontrolü
  const checkExpressEligibility = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      return { eligible: false, reason: "LOGIN_REQUIRED" };
    }

    if (!defaultOptions?.hasDefaults) {
      return { eligible: false, reason: "SETUP_REQUIRED" };
    }

    // Stok kontrolü
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity, is_active, status")
      .eq("id", productId)
      .single();

    if (!product || !product.is_active || product.status !== "published") {
      return { eligible: false, reason: "PRODUCT_UNAVAILABLE" };
    }

    if ((product.stock_quantity || 0) < quantity) {
      return { eligible: false, reason: "INSUFFICIENT_STOCK" };
    }

    return { eligible: true };
  };

  return {
    expressCheckout: expressCheckout.mutate,
    isLoading: expressCheckout.isLoading || optionsLoading,
    error: expressCheckout.error,
    defaultOptions,
    checkExpressEligibility,
    canUseExpress: isAuthenticated && defaultOptions?.hasDefaults,
  };
}

/**
 * Express checkout için setup durumunu kontrol eden hook
 */
export function useExpressCheckoutSetup() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["express-checkout-setup", user?.id],
    queryFn: async () => {
      if (!user?.id) return { isSetup: false };

      // Adres kontrolü
      const { data: addresses, error: addressError } = await supabase
        .from("user_addresses")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      // Ödeme yöntemi kontrolü
      const { data: payments, error: paymentError } = await supabase
        .from("user_payment_methods")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      const hasAddress = !addressError && addresses && addresses.length > 0;
      const hasPayment = !paymentError && payments && payments.length > 0;

      return {
        isSetup: hasAddress && hasPayment,
        hasAddress,
        hasPayment,
        setupSteps: {
          address: hasAddress,
          payment: hasPayment,
        },
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Utility functions
 */

// Sipariş numarası oluştur
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `GNK${timestamp}${random}`;
}

// Express checkout analitik tracking
function trackExpressCheckout(data) {
  try {
    // Google Analytics veya diğer analitik servisler için
    if (typeof gtag !== "undefined") {
      gtag("event", "purchase", {
        transaction_id: data.order.id,
        value: data.total,
        currency: "TRY",
        express_checkout: true,
        items: [
          {
            item_id: data.product.id,
            item_name: data.product.name,
            quantity: 1,
            price: data.product.price,
          },
        ],
      });
    }
  } catch (error) {
    console.error("Analytics tracking error:", error);
  }
}

/**
 * Express checkout buton komponenti için props hesaplama
 */
export function useExpressCheckoutButton(
  product,
  variant = null,
  quantity = 1
) {
  const { canUseExpress, checkExpressEligibility, isLoading } =
    useExpressCheckout();
  const { isAuthenticated } = useAuth();

  const buttonText = !isAuthenticated
    ? "Giriş Yap ve Hızlı Satın Al"
    : canUseExpress
    ? "Hızlı Satın Al"
    : "Bilgileri Tamamla ve Hızlı Satın Al";

  const buttonVariant = canUseExpress ? "primary" : "secondary";

  return {
    buttonText,
    buttonVariant,
    canUseExpress,
    isLoading,
    checkExpressEligibility: () =>
      checkExpressEligibility(product.id, quantity),
  };
}
