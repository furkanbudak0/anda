import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import LoadingFallback from "../components/LoadingFallback";
import EmptyState from "../components/EmptyState";
import {
  TrashIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    loading,
    cartCount,
    removeFromCart,
    updateQuantity,
    getTotal,
  } = useCart();
  const [updatingItems, setUpdatingItems] = useState(new Set());

  // Kullanıcı giriş yapmamışsa login'e yönlendir
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleQuantityChange = async (productId, newQuantity) => {
    setUpdatingItems((prev) => new Set(prev).add(productId));
    try {
      await updateQuantity(productId, newQuantity);
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (productId) => {
    setUpdatingItems((prev) => new Set(prev).add(productId));
    try {
      await removeFromCart(productId);
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            icon={ShoppingBagIcon}
            title="Sepetiniz Boş"
            description="Henüz sepete ürün eklemediniz."
            actionText="Alışverişe Başla"
            onAction={() => navigate("/")}
          />
        </div>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Geri Dön
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Alışveriş Sepeti ({cartCount} ürün)
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sepet Ürünleri */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sepet Ürünleri
                </h2>
                <div className="space-y-4">
                  {items.map((item) => {
                    const product = item.products;
                    const price =
                      product?.discounted_price || product?.price || 0;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        {/* Ürün Resmi */}
                        <div className="flex-shrink-0">
                          <img
                            src={
                              (Array.isArray(product?.images) &&
                                product.images.length > 0 &&
                                product.images[0]) ||
                              product?.image_url ||
                              "/placeholder-product.jpg"
                            }
                            alt={product?.name || "Ürün"}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        </div>

                        {/* Ürün Bilgileri */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {product?.name || "Ürün adı bulunamadı"}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {product?.seller?.business_name ||
                              "Satıcı bilgisi yok"}
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            ₺{price.toFixed(2)}
                          </p>
                        </div>

                        {/* Miktar Kontrolü */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.product_id,
                                item.quantity - 1
                              )
                            }
                            disabled={updatingItems.has(item.product_id)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="w-12 text-center text-sm font-medium text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.product_id,
                                item.quantity + 1
                              )
                            }
                            disabled={updatingItems.has(item.product_id)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>

                        {/* Toplam Fiyat */}
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            ₺{(price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        {/* Sil Butonu */}
                        <button
                          onClick={() => handleRemoveItem(item.product_id)}
                          disabled={updatingItems.has(item.product_id)}
                          className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sepet Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm sticky top-8">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sepet Özeti
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Ürün Sayısı:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {cartCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Ara Toplam:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₺{total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Kargo:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Ücretsiz
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900 dark:text-white">
                        Toplam:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        ₺{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={items.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Ödemeye Geç
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
