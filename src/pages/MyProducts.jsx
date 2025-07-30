import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { notifications } from "../utils/notifications";
import { useAuth } from "../contexts/AuthContext";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

const MyProducts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    discount_percentage: "",
    discounted_price: "",
  });

  // Fetch seller's products
  const { data: products, isLoading } = useQuery({
    queryKey: ["seller-products", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Update product discount mutation
  const updateDiscountMutation = useMutation({
    mutationFn: async ({ productId, discountData }) => {
      const { data, error } = await supabase
        .from("products")
        .update({
          discount_percentage: discountData.discount_percentage,
          discounted_price: discountData.discounted_price,
        })
        .eq("id", productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-products"]);
      notifications.success("İndirim başarıyla güncellendi!");
      setEditingProduct(null);
      setDiscountForm({ discount_percentage: "", discounted_price: "" });
    },
    onError: (error) => {
      notifications.error(`İndirim güncellenirken hata: ${error.message}`);
    },
  });

  // Remove discount mutation
  const removeDiscountMutation = useMutation({
    mutationFn: async (productId) => {
      const { data, error } = await supabase
        .from("products")
        .update({
          discount_percentage: null,
          discounted_price: null,
        })
        .eq("id", productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-products"]);
      notifications.success("İndirim kaldırıldı!");
    },
    onError: (error) => {
      notifications.error(`İndirim kaldırılırken hata: ${error.message}`);
    },
  });

  const handleDiscountSubmit = (productId) => {
    const percentage = parseFloat(discountForm.discount_percentage);
    const discountedPrice = parseFloat(discountForm.discounted_price);

    if (isNaN(percentage) || isNaN(discountedPrice)) {
      notifications.error("Lütfen geçerli sayılar girin!");
      return;
    }

    if (percentage < 0 || percentage > 100) {
      notifications.error("İndirim oranı 0-100 arasında olmalıdır!");
      return;
    }

    updateDiscountMutation.mutate({
      productId,
      discountData: {
        discount_percentage: percentage,
        discounted_price: discountedPrice,
      },
    });
  };

  const handleRemoveDiscount = (productId) => {
    if (confirm("İndirimi kaldırmak istediğinizden emin misiniz?")) {
      removeDiscountMutation.mutate(productId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ürünlerim</h1>
          <p className="text-gray-600">
            Ürünlerinizi yönetin ve indirimler ekleyin
          </p>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.uuid}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <ProductCard product={product} />

                {/* İndirim Yönetimi */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      İndirim Yönetimi
                    </h3>
                    <TagIcon className="w-5 h-5 text-orange-500" />
                  </div>

                  {editingProduct === product.uuid ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          İndirim Oranı (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountForm.discount_percentage}
                          onChange={(e) =>
                            setDiscountForm((prev) => ({
                              ...prev,
                              discount_percentage: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Örn: 25"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          İndirimli Fiyat (₺)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={discountForm.discounted_price}
                          onChange={(e) =>
                            setDiscountForm((prev) => ({
                              ...prev,
                              discounted_price: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Örn: 75.00"
                        />
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDiscountSubmit(product.uuid)}
                          disabled={updateDiscountMutation.isLoading}
                          className="flex-1 bg-orange-500 text-white px-3 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50 transition-colors"
                        >
                          {updateDiscountMutation.isLoading
                            ? "Kaydediliyor..."
                            : "Kaydet"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(null);
                            setDiscountForm({
                              discount_percentage: "",
                              discounted_price: "",
                            });
                          }}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {product.discount_percentage ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                %{product.discount_percentage} İndirim
                              </p>
                              <p className="text-xs text-green-600">
                                {product.price}₺ → {product.discounted_price}₺
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveDiscount(product.uuid)}
                              disabled={removeDiscountMutation.isLoading}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                          <p className="text-sm text-gray-600">
                            Henüz indirim yok
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setEditingProduct(product.uuid);
                          setDiscountForm({
                            discount_percentage:
                              product.discount_percentage?.toString() || "",
                            discounted_price:
                              product.discounted_price?.toString() || "",
                          });
                        }}
                        className="w-full flex items-center justify-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span>
                          {product.discount_percentage
                            ? "İndirimi Düzenle"
                            : "İndirim Ekle"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8">
              <TagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz ürününüz yok
              </h3>
              <p className="text-gray-600 mb-6">
                İndirim ekleyebilmek için önce ürün eklemelisiniz.
              </p>
              <button className="inline-flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 transition-colors">
                <PlusIcon className="w-5 h-5" />
                <span>Ürün Ekle</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProducts;
