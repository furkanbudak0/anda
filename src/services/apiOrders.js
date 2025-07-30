import { supabase } from "./supabase";

/**
 * Orders API service
 */
const apiOrders = {
  // Create new order with items using SECURITY DEFINER function
  createOrder: async (orderData) => {
    console.log("apiOrders.createOrder called with:", orderData);

    // Güvenlik kontrolleri
    if (!orderData || !orderData.user_id) {
      throw new Error("Geçersiz sipariş verisi");
    }

    if (
      !orderData.items ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0
    ) {
      throw new Error("Sipariş ürünleri bulunamadı");
    }

    try {
      // Önce RPC fonksiyonunu dene
      const { data, error } = await supabase.rpc("create_order_with_items_v2", {
        p_user_id: orderData.user_id,
        p_total_amount: orderData.total_amount,
        p_address_id: orderData.address_id,
        p_shipping_address: orderData.shipping_address,
        p_billing_address: orderData.billing_address,
        p_items: orderData.items,
        p_shipping_amount: orderData.shipping_amount || 0,
        p_payment_method: orderData.payment_method || "credit_card",
        p_notes: orderData.notes || null,
      });

      console.log("Supabase RPC response:", { data, error });

      if (error) throw error;
      return data;
    } catch (rpcError) {
      console.log("RPC failed, trying direct insert:", rpcError);

      // RPC başarısız olursa direkt insert dene
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: orderData.user_id,
          total_amount: orderData.total_amount,
          shipping_amount: orderData.shipping_amount || 0,
          payment_method: orderData.payment_method || "credit_card",
          address_id: orderData.address_id,
          shipping_address: orderData.shipping_address,
          billing_address: orderData.billing_address,
          notes: orderData.notes || null,
          // Bu alanlar otomatik oluşturuluyor, manuel vermeye gerek yok
          // status: "pending",
          // payment_status: "pending",
          // fulfillment_status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Order items'ları ekle
      const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        seller_id: item.seller_id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        status: "pending",
        variant: item.variant,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    }
  },

  // Get user orders
  getUserOrders: async (userId) => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items(*)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items(*)
      `
      )
      .eq("id", orderId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    const { data, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export { apiOrders };
