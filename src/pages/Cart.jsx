/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../utils/formatters";
import EmptyState from "../components/EmptyState";

export default function Cart() {
  const {
    cartState,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  if (cartState.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <EmptyState
          title="Sepetiniz Boş"
          description="Henüz sepetinize ürün eklemediniz"
          actionLabel="Alışverişe Devam Et"
          actionLink="/"
          icon={ShoppingBagIcon}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sepetim</h1>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Sepeti Temizle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartState.items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <CartSummary
            cartState={cartState}
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={removeCoupon}
          />
        </div>
      </div>
    </div>
  );
}

function CartItem({ item, onUpdateQuantity, onRemove }) {
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      onRemove(item.id);
    } else {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-4">
        {/* Product Image */}
        <Link to={`/product/${item.product.slug}`}>
          <img
            src={item.product.images?.[0] || "/placeholder-product.jpg"}
            alt={item.product.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <Link
            to={`/product/${item.product.slug}`}
            className="text-lg font-medium text-gray-900 hover:text-purple-600"
          >
            {item.product.name}
          </Link>

          {item.variant && (
            <p className="text-sm text-gray-500 mt-1">{item.variant.title}</p>
          )}

          {item.product.seller && (
            <p className="text-sm text-gray-500 mt-1">
              Satıcı: {item.product.seller.business_name}
            </p>
          )}

          <div className="flex items-center justify-between mt-4">
            {/* Quantity Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                className="p-1 rounded-full border border-gray-300 hover:border-purple-500"
              >
                <MinusIcon className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 border border-gray-300 rounded-md min-w-[60px] text-center">
                {item.quantity}
              </span>

              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                className="p-1 rounded-full border border-gray-300 hover:border-purple-500"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Price and Remove */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-lg font-semibold text-purple-600">
                  {formatPrice(item.totalPrice)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatPrice(item.unitPrice)} x {item.quantity}
                </p>
              </div>

              <button
                onClick={() => onRemove(item.id)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                title="Sepetten Çıkar"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartSummary({ cartState, onApplyCoupon, onRemoveCoupon }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Sipariş Özeti
      </h2>

      {/* Order Summary */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span>Ara Toplam ({cartState.itemCount} ürün):</span>
          <span>{formatPrice(cartState.subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>KDV (%18):</span>
          <span>{formatPrice(cartState.taxAmount)}</span>
        </div>

        {cartState.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>İndirim:</span>
            <span>-{formatPrice(cartState.discountAmount)}</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-lg">
          <span>Toplam:</span>
          <span className="text-purple-600">
            {formatPrice(cartState.total)}
          </span>
        </div>
      </div>

      {/* Coupon Section */}
      <div className="mb-6">
        {cartState.coupon ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Kupon Uygulandı: {cartState.coupon.code}
                </p>
                <p className="text-xs text-green-600">
                  %{cartState.coupon.discount_value} indirim
                </p>
              </div>
              <button
                onClick={onRemoveCoupon}
                className="text-green-600 hover:text-green-800"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kupon Kodu
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Kupon kodunuzu girin"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={() => {
                  // This would validate and apply coupon
                  // Apply coupon logic here
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Uygula
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Buttons */}
      <div className="space-y-3">
        <Link
          to="/checkout"
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          Ödemeye Geç
          <ArrowRightIcon className="w-4 h-4" />
        </Link>

        <Link
          to="/"
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center block"
        >
          Alışverişe Devam Et
        </Link>
      </div>

      {/* Security Info */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>🔒 Güvenli ödeme ile korunmaktasınız</p>
      </div>
    </div>
  );
}
