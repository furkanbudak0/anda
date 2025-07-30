import { useState } from "react";
import PropTypes from "prop-types";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useAuth } from "../../contexts/AuthContext";
import { notifications } from "../../utils/notifications";

/**
 * Modüler Favori Butonu Componenti
 * ProductCard ve ProductDetail sayfalarında kullanılabilir
 */
export default function FavoriteButton({
  product,
  size = "md",
  showText = false,
  className = "",
  onToggle = null,
}) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);

  const productId = product?.uuid || product?.id;
  const isFavorited = isFavorite(productId);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      notifications.auth.loginRequired();
      return;
    }

    if (!productId) {
      notifications.error("Favori için geçerli bir ürün uuid'si gereklidir.");
      return;
    }

    setIsLoading(true);
    try {
      await toggleFavorite(productId);

      // Custom callback varsa çağır
      if (onToggle) {
        onToggle(productId, !isFavorited);
      }
    } catch (error) {
      console.error("❌ Favori toggle hatası:", error);
      notifications.error("Favori işlemi sırasında bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        flex items-center justify-center
        ${
          isFavorited
            ? "text-red-500 hover:text-red-600"
            : "text-gray-400 hover:text-red-500"
        }
        transition-colors duration-200
        ${sizeClasses[size]}
        ${className}
        ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      title={isFavorited ? "Favorilerden çıkar" : "Favorilere ekle"}
    >
      {isFavorited ? (
        <HeartSolidIcon className="w-full h-full" />
      ) : (
        <HeartIcon className="w-full h-full" />
      )}

      {showText && (
        <span className="ml-2 text-sm font-medium">
          {isFavorited ? "Favorilerden Çıkar" : "Favorilere Ekle"}
        </span>
      )}
    </button>
  );
}

FavoriteButton.propTypes = {
  product: PropTypes.shape({
    uuid: PropTypes.string,
    id: PropTypes.string,
  }).isRequired,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  showText: PropTypes.bool,
  className: PropTypes.string,
  onToggle: PropTypes.func,
};
