import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { toast } from "react-hot-toast";

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
      return data;
    },
  });
}

// Add new address
export function useAddAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı girişi yapılmamış");

      // If this is set as default, unset other defaults first
      if (addressData.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { data, error } = await supabase
        .from("addresses")
        .insert({
          ...addressData,
          user_id: user.id,
        })
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

      // If this is set as default, unset other defaults first
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

      // First, unset all defaults
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Then set the selected one as default
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", addressId)
        .eq("user_id", user.id);

      if (error) throw error;
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
