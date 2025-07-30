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
        .order("last_used_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Ödeme yöntemleri getirme hatası:", error);
        throw new Error(
          error.message || "Ödeme yöntemleri yüklenirken hata oluştu"
        );
      }
      return data || [];
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

      // Kart numarasını temizle ve maskele
      const cleanCardNumber = paymentData.card_number.replace(/\s/g, "");
      const maskedNumber = `****-****-****-${cleanCardNumber.slice(-4)}`;

      // Eğer varsayılan olarak ayarlanıyorsa, diğer kartları varsayılan olmaktan çıkar
      if (paymentData.is_default) {
        await supabase
          .from("user_payment_methods")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      // Güvenli kart token'ı oluştur (gerçek uygulamada PCI DSS uyumlu olmalı)
      const cardToken = `token_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

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
          card_token: cardToken,
          last_used_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Kart ekleme hatası:", error);
        throw new Error(error.message || "Kart eklenirken hata oluştu");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-methods"]);
      toast.success("Kart başarıyla eklendi");
    },
    onError: (error) => {
      console.error("Kart ekleme hatası:", error);
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

      // Eğer varsayılan olarak ayarlanıyorsa, diğer kartları varsayılan olmaktan çıkar
      if (paymentData.is_default) {
        await supabase
          .from("user_payment_methods")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", id);
      }

      // Güncelleme verilerini hazırla
      const updateData = {
        ...paymentData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_payment_methods")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Kart güncelleme hatası:", error);
        throw new Error(error.message || "Kart güncellenirken hata oluştu");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-methods"]);
      toast.success("Kart bilgileri güncellendi");
    },
    onError: (error) => {
      console.error("Kart güncelleme hatası:", error);
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
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentMethodId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Kart silme hatası:", error);
        throw new Error(error.message || "Kart silinirken hata oluştu");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-methods"]);
      toast.success("Kart başarıyla silindi");
    },
    onError: (error) => {
      console.error("Kart silme hatası:", error);
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

      // Önce tüm varsayılan kartları kaldır
      await supabase
        .from("user_payment_methods")
        .update({
          is_default: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      // Sonra seçilen kartı varsayılan yap
      const { error } = await supabase
        .from("user_payment_methods")
        .update({
          is_default: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentMethodId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Varsayılan kart ayarlama hatası:", error);
        throw new Error(
          error.message || "Varsayılan kart güncellenirken hata oluştu"
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-methods"]);
      toast.success("Varsayılan kart güncellendi");
    },
    onError: (error) => {
      console.error("Varsayılan kart ayarlama hatası:", error);
      toast.error(
        error.message || "Varsayılan kart güncellenirken hata oluştu"
      );
    },
  });
}
