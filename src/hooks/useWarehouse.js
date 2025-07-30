import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { toast } from "react-hot-toast";

/**
 * Hook for warehouse/inventory management
 */
export const useWarehouse = () => {
  const queryClient = useQueryClient();

  // Get warehouse products
  const getWarehouseProducts = useQuery({
    queryKey: ["warehouse-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Create stock movement
  const createStockMovement = useMutation({
    mutationFn: async (movementData) => {
      const { data, error } = await supabase
        .from("stock_movements")
        .insert([
          {
            ...movementData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["warehouse-products"]);
      toast.success("Stok hareketi kaydedildi");
    },
    onError: (error) => {
      toast.error(error.message || "Stok hareketi kaydedilemedi");
    },
  });

  // Get stock movements
  const getStockMovements = useQuery({
    queryKey: ["stock-movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select(
          `
          *,
          product:products(name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  return {
    getWarehouseProducts,
    createStockMovement,
    getStockMovements,
  };
};

// Individual hooks for specific functionality
export const useSellerStockMovements = () => {
  return useQuery({
    queryKey: ["seller-stock-movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select(
          `
          *,
          product:products(name, price)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateStockMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movementData) => {
      const { data, error } = await supabase
        .from("stock_movements")
        .insert([
          {
            ...movementData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-stock-movements"]);
      toast.success("Stok hareketi kaydedildi");
    },
    onError: (error) => {
      toast.error(error.message || "Stok hareketi kaydedilemedi");
    },
  });
};

/**
 * Hook for product-specific stock movements
 */
export const useProductStockMovements = (productId) => {
  return useQuery({
    queryKey: ["product-stock-movements", productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from("stock_movements")
        .select(
          `
          *,
          product:products(name, price)
        `
        )
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });
};
