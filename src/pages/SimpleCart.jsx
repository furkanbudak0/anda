import { useState } from "react";
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

export default function SimpleCart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items: cartItems,
    loading,
    removeFromCart,
    updateQuantity,
    getTotal,
    clearCart,
  } = useCart();
  const [updatingItems, setUpdatingItems] = useState(new Set());

  // Kullanıcı giriş yapmamışsa login'e yönlendir
  if (!user) {
    navigate("/auth");
    return null;
  }

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyState
          icon={<ShoppingBagIcon className="w-12 h-12 text-gray-400" />}
          title="Sepetiniz Boş"
          description="Sepetinizde henüz ürün bulunmuyor. Alışverişe başlamak için ürünlerimize göz atın."
          action={{
            text: "Ürünlere Göz At",
            onClick: () => navigate("/products"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Sepetim</h1>
          <span className="text-sm text-gray-500">
            ({cartItems.length} ürün)
          </span>
        </div>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
        >
          Sepeti Temizle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Sepet Öğeleri
              </h2>
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const product = item.products;
                  const price =
                    product?.discounted_price || product?.price || 0;
                  const isUpdating = updatingItems.has(item.product_id);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg"
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={
                            (Array.isArray(product?.images) &&
                              product.images.length > 0 &&
                              product.images[0]) ||
                            product?.image_url ||
                            "/placeholder-product.jpg"
                          }
                          alt={product?.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {product?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Birim Fiyat: {formatPrice(price)}
                        </p>
                        {product?.stock <= 0 && (
                          <p className="text-sm text-red-600">Stokta yok</p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.product_id,
                              item.quantity - 1
                            )
                          }
                          disabled={isUpdating || item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-sm font-medium">
                          {isUpdating ? "..." : item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.product_id,
                              item.quantity + 1
                            )
                          }
                          disabled={
                            isUpdating || (product?.stock || 0) <= item.quantity
                          }
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(price * item.quantity)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        disabled={isUpdating}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
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

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sipariş Özeti
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ara Toplam</span>
                <span className="font-medium">{formatPrice(getTotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Kargo</span>
                <span className="font-medium text-green-600">Ücretsiz</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Toplam</span>
                <span>{formatPrice(getTotal())}</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full mt-6 bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Ödemeye Geç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
