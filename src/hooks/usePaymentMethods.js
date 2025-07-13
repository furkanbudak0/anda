import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { toast } from "react-hot-toast";

// Get user payment methods
export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { data, error } = await supabase
        .from("user_payment_methods")
        .select(
          `
          *,
          billing_address:addresses(*)
        `
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Add new payment method
export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      // If this is set as default, unset other defaults first
      if (paymentData.is_default) {
        await supabase
          .from("user_payment_methods")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      // Create masked card number
      const cardNumber = paymentData.card_number;
      const maskedNumber = `****-****-****-${cardNumber.slice(-4)}`;

      const { data, error } = await supabase
        .from("user_payment_methods")
        .insert({
          user_id: user.id,
          card_name: paymentData.card_name,
          card_type: paymentData.card_type,
          card_number_masked: maskedNumber,
          card_holder_name: paymentData.card_holder_name,
          expiry_month: paymentData.expiry_month,
          expiry_year: paymentData.expiry_year,
          billing_address_id: paymentData.billing_address_id,
          is_default: paymentData.is_default || false,
          // In real implementation, you would tokenize the card number
          card_token: `token_${Math.random().toString(36).substr(2, 9)}`,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-methods"]);
      toast.success("Kart başarıyla eklendi");
    },
    onError: (error) => {
      toast.error(error.message || "Kart eklenirken hata oluştu");
    },
  });
}

// Update payment method
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...paymentData }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      // If this is set as default, unset other defaults first
      if (paymentData.is_default) {
        await supabase
          .from("user_payment_methods")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", id);
      }

      const { data, error } = await supabase
        .from("user_payment_methods")
        .update(paymentData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-methods"]);
      toast.success("Kart bilgileri güncellendi");
    },
    onError: (error) => {
      toast.error(error.message || "Kart güncellenirken hata oluştu");
    },
  });
}

// Delete payment method
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethodId) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { error } = await supabase
        .from("user_payment_methods")
        .update({ is_active: false })
        .eq("id", paymentMethodId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-methods"]);
      toast.success("Kart başarıyla silindi");
    },
    onError: (error) => {
      toast.error(error.message || "Kart silinirken hata oluştu");
    },
  });
}

// Set default payment method
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethodId) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      // First, unset all defaults
      await supabase
        .from("user_payment_methods")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Then set the selected one as default
      const { error } = await supabase
        .from("user_payment_methods")
        .update({ is_default: true })
        .eq("id", paymentMethodId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-methods"]);
      toast.success("Varsayılan kart güncellendi");
    },
    onError: (error) => {
      toast.error(
        error.message || "Varsayılan kart güncellenirken hata oluştu"
      );
    },
  });
}
