import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { toast } from "react-hot-toast";

// Adres türleri
export const ADDRESS_TYPES = {
  HOME: "home",
  WORK: "work",
  OTHER: "other",
};

export const ADDRESS_TYPE_LABELS = {
  [ADDRESS_TYPES.HOME]: "Ev Adresi",
  [ADDRESS_TYPES.WORK]: "İş Adresi",
  [ADDRESS_TYPES.OTHER]: "Diğer",
};

// Get user addresses
export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

// Add new address
export function useAddAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressData) => {
      // Önce kullanıcı bilgisini al
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      // Eğer varsayılan olarak ayarlanıyorsa, diğer adresleri varsayılan olmaktan çıkar
      if (addressData.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      // Veritabanı sütunlarıyla uyumlu hale getir
      const addressToInsert = {
        title: addressData.full_name, // Ad soyadı title olarak kullan
        full_name: addressData.full_name,
        phone: addressData.phone,
        city: addressData.city,
        district: addressData.district || "Genel",
        address_line: addressData.address_line,
        postal_code: addressData.postal_code,
        is_default: addressData.is_default || false,
        user_id: user.id,
      };

      // Yeni adresi ekle
      const { data, error } = await supabase
        .from("addresses")
        .insert(addressToInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["addresses"]);
      toast.success("Adres başarıyla eklendi");
    },
    onError: (error) => {
      toast.error(error.message || "Adres eklenirken hata oluştu");
    },
  });
}

// Update address
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...addressData }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      // Eğer varsayılan olarak ayarlanıyorsa, diğer adresleri varsayılan olmaktan çıkar
      if (addressData.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", id);
      }

      const { data, error } = await supabase
        .from("addresses")
        .update(addressData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["addresses"]);
      toast.success("Adres başarıyla güncellendi");
    },
    onError: (error) => {
      toast.error(error.message || "Adres güncellenirken hata oluştu");
    },
  });
}

// Delete address
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["addresses"]);
      toast.success("Adres başarıyla silindi");
    },
    onError: (error) => {
      toast.error(error.message || "Adres silinirken hata oluştu");
    },
  });
}

// Set default address
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      // Tüm adresleri varsayılan olmaktan çıkar
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Belirtilen adresi varsayılan yap
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", addressId)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["addresses"]);
      toast.success("Varsayılan adres güncellendi");
    },
    onError: (error) => {
      toast.error(
        error.message || "Varsayılan adres güncellenirken hata oluştu"
      );
    },
  });
}

// Utility function to get default address
export function getDefaultAddress(addresses) {
  if (!Array.isArray(addresses) || addresses.length === 0) return null;

  const defaultAddr = addresses.find((addr) => addr.is_default);
  return defaultAddr || addresses[0];
}

// Utility function to format address for display
export function formatAddress(address) {
  if (!address) return "";

  const parts = [address.address_line || address.address, address.city].filter(
    Boolean
  );

  return parts.join(", ");
}
