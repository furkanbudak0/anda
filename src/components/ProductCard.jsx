import PropTypes from "prop-types";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { UserIcon } from "@heroicons/react/24/outline";
import { useTrackProductEventAdvanced } from "../hooks/useTrackProductEvent";
import FavoriteButton from "./ui/FavoriteButton";
import AddToCartButton from "./ui/AddToCartButton";

/**
 * Temel, modern ve fonksiyonel ürün kartı.
 * Ürün görseli, adı, fiyatı, stok durumu, satıcı bilgileri ve butonlar.
 */
export default function ProductCard({ product }) {
  const trackEvent = useTrackProductEventAdvanced();

  // Ürün kartı gösterildiğinde event kaydı (sadece bir kez)
  useEffect(() => {
    if (product?.uuid) {
      // Throttle ile 500ms sonra track et
      const timer = setTimeout(() => {
        trackEvent({
          productId: product.uuid,
          sellerId: product.seller_id,
          eventType: "card_view",
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [product?.uuid]); // trackEvent dependency'sini kaldır

  // Kart tıklama event'i
  const handleCardClick = () => {
    trackEvent({
      productId: product.uuid,
      sellerId: product.seller_id,
      eventType: "card_click",
    });
  };

  // Fiyat hesaplamaları
  const originalPrice = product.price || 0;
  const discountedPrice = product.discounted_price || 0;
  const hasDiscount = discountedPrice > 0 && discountedPrice < originalPrice;

  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    : 0;

  // Custom callback fonksiyonları
  const handleAddToCartSuccess = (product) => {
    trackEvent({
      productId: product.uuid,
      sellerId: product.seller_id,
      eventType: "cart_add",
    });
  };

  const handleFavoriteToggle = (productId, isFavorited) => {
    trackEvent({
      productId: productId,
      sellerId: product.seller_id,
      eventType: isFavorited ? "favorite_add" : "favorite_remove",
    });
  };

  // Satıcı bilgilerini al
  const seller = product.seller || {};
  const sellerName = seller.business_name || "Satıcı";
  const sellerSlug = seller.business_slug || seller.id;
  const sellerLogo = seller.logo_url;

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      {/* İndirim Badge - Sağ Üst Köşe */}
      {hasDiscount && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            %{discountPercentage} İndirim
          </span>
        </div>
      )}

      {/* Stok Durumu Badge - Sol Üst Köşe */}
      {product.stock <= 0 && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Stokta Yok
          </span>
        </div>
      )}

      {/* Ürün Görseli */}
      <Link to={`/product/${product.uuid}`} className="block">
        <div className="w-full h-[300px] aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <img
            src={
              (Array.isArray(product.images) &&
                product.images.length > 0 &&
                product.images[0]) ||
              product.image_url ||
              "/placeholder-product.jpg"
            }
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            style={{
              objectFit: "cover",
              width: "100%",
              height: "100%",
              aspectRatio: "1/1",
            }}
          />
        </div>
      </Link>

      {/* Ürün Bilgileri */}
      <div className="p-4">
        {/* Ürün Adı */}
        <Link to={`/product/${product.uuid}`} className="block">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Satıcı Bilgisi */}
        {sellerSlug && (
          <div className="mb-3">
            <Link
              to={`/seller/${sellerSlug}`}
              className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {sellerLogo ? (
                <img
                  src={sellerLogo}
                  alt={sellerName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <UserIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <span className="truncate">{sellerName}</span>
            </Link>
          </div>
        )}

        {/* Fiyat */}
        <div className="flex items-center gap-2 mb-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ₺{Number(discountedPrice).toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                ₺{Number(originalPrice).toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              ₺{Number(originalPrice).toFixed(2)}
            </span>
          )}
        </div>

        {/* Yıldız Puanları */}
        {product.average_rating > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(product.average_rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {product.average_rating.toFixed(1)}
            </span>
            {product.total_reviews > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                ({product.total_reviews})
              </span>
            )}
          </div>
        )}

        {/* Stok Durumu */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {product.stock > 0 ? (
            <span className="text-green-600 dark:text-green-400">
              Stokta {product.stock} adet
            </span>
          ) : (
            <span className="text-red-600 dark:text-red-400">Stokta yok</span>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex gap-2">
          {/* Sepete Ekle Butonu */}
          <AddToCartButton
            product={product}
            quantity={1}
            size="md"
            showText={true}
            className="flex-1"
            onAdd={handleAddToCartSuccess}
          />

          {/* Favori Butonu */}
          <FavoriteButton
            product={product}
            size="md"
            className="p-2 rounded-lg border border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
            onToggle={handleFavoriteToggle}
          />
        </div>
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    uuid: PropTypes.string,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    discounted_price: PropTypes.number,
    image_url: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    stock: PropTypes.number,
    slug: PropTypes.string,
    seller_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    average_rating: PropTypes.number,
    total_reviews: PropTypes.number,
    seller: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      business_name: PropTypes.string,
      business_slug: PropTypes.string,
      logo_url: PropTypes.string,
    }),
  }).isRequired,
};
