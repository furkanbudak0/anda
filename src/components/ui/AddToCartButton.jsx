import { useState } from "react";
import PropTypes from "prop-types";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { notifications } from "../../utils/notifications";

/**
 * Modüler Sepete Ekleme Butonu Componenti
 * ProductCard ve ProductDetail sayfalarında kullanılabilir
 */
export default function AddToCartButton({
  product,
  quantity = 1,
  size = "md",
  showText = false,
  className = "",
  onAdd = null,
  disabled = false,
}) {
  const { user } = useAuth();
  const { addToCart, isInCart, isProductInCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: "w-6 h-6 text-sm",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  // Product kontrolü
  if (!product || !product.uuid) {
    return (
      <button
        disabled={true}
        className={`
          flex items-center justify-center gap-2
          bg-gray-300 text-gray-500 cursor-not-allowed
          transition-colors duration-200
          rounded-lg font-medium
          ${sizeClasses[size]}
          ${className}
        `}
        title="Ürün bilgisi eksik"
      >
        <ShoppingCartIcon className="w-5 h-5" />
        {showText && <span className="font-medium">Ürün Yok</span>}
      </button>
    );
  }

  // Ürünün sepetteki miktarını kontrol et
  const cartQuantity = isInCart(product.uuid);
  const isInCartBoolean = isProductInCart(product.uuid);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product?.uuid) {
      notifications.error("Ürün bilgisi eksik");
      return;
    }

    if ((product.stock ?? 0) <= 0) {
      notifications.ecommerce.outOfStock(product.name);
      return;
    }

    if (!user) {
      notifications.auth.loginRequired();
      return;
    }

    // Eğer ürün zaten sepette varsa, kullanıcıya bilgi ver
    if (isInCartBoolean) {
      const shouldAdd = window.confirm(
        `Bu ürün zaten sepetinizde ${cartQuantity} adet var. Sepete gidip miktarı artırmak ister misiniz?`
      );

      if (shouldAdd) {
        // Sepet sayfasına yönlendir
        window.location.href = "/cart";
        return;
      }
      return;
    }

    setIsLoading(true);
    try {
      const success = await addToCart(product, quantity);

      if (success && onAdd) {
        onAdd(product, quantity);
      }
    } catch (error) {
      console.error("Sepete ekleme hatası:", error);
      notifications.error("Sepete eklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const isOutOfStock = (product.stock ?? 0) <= 0;

  // Buton metni ve durumu
  let buttonText = "Sepete Ekle";
  let buttonClass =
    "bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white";

  if (isOutOfStock) {
    buttonText = "Stokta Yok";
    buttonClass = "bg-gray-300 text-gray-500 cursor-not-allowed";
  } else if (isInCartBoolean) {
    buttonText = `Sepette ${cartQuantity} adet`;
    buttonClass = "bg-green-500 hover:bg-green-600 text-white";
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isLoading || disabled || isOutOfStock}
      className={`
        flex items-center justify-center gap-2
        ${buttonClass}
        transition-colors duration-200
        rounded-lg font-medium
        ${sizeClasses[size]}
        ${className}
        ${isLoading ? "opacity-50" : ""}
      `}
      title={
        isOutOfStock
          ? "Stokta yok"
          : isInCartBoolean
          ? "Sepete git"
          : "Sepete ekle"
      }
    >
      <ShoppingCartIcon className="w-5 h-5" />

      {showText && <span className="font-medium">{buttonText}</span>}
    </button>
  );
}

AddToCartButton.propTypes = {
  product: PropTypes.shape({
    uuid: PropTypes.string,
    name: PropTypes.string,
    stock: PropTypes.number,
  }).isRequired,
  quantity: PropTypes.number,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  showText: PropTypes.bool,
  className: PropTypes.string,
  onAdd: PropTypes.func,
  disabled: PropTypes.bool,
};
