/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import { ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
import useRecentlyViewed from "../hooks/useRecentlyViewed";
import { formatPrice } from "../utils/formatters";

/**
 * Recently Viewed Products Component
 * Displays user's recently viewed products in a horizontal carousel
 */
export default function RecentlyViewedProducts() {
  const { recentlyViewed, clearRecentlyViewed, removeFromRecentlyViewed } =
    useRecentlyViewed();

  // If no recently viewed products, don't render
  if (!recentlyViewed || recentlyViewed.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Son Görüntülenen Ürünler
            </h2>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {recentlyViewed.length}
            </span>
          </div>

          <button
            onClick={clearRecentlyViewed}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Tümünü Temizle
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recentlyViewed.slice(0, 12).map((product) => (
            <RecentlyViewedCard
              key={product.uuid}
              product={product}
              onRemove={() => removeFromRecentlyViewed(product.uuid)}
            />
          ))}
        </div>

        {/* Show More Link */}
        {recentlyViewed.length > 12 && (
          <div className="text-center mt-8">
            <Link
              to="/recently-viewed"
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Tümünü Görüntüle ({recentlyViewed.length})
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Individual recently viewed product card
 */
function RecentlyViewedCard({ product, onRemove }) {
  const discountedPrice = product.discounted_price || product.price;
  const hasDiscount =
    product.discounted_price && product.discounted_price < product.price;

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove();
        }}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 shadow-sm hover:bg-gray-50"
        title="Listeden Çıkar"
      >
        <XMarkIcon className="h-4 w-4 text-gray-500" />
      </button>

      <Link to={`/product/${product.slug || product.uuid}`} className="block">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden">
          <img
            src={
              product.images?.[0] || product.image || "/placeholder-product.jpg"
            }
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Product Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
            {product.name}
          </h3>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-purple-600">
                {product.price ? formatPrice(discountedPrice) : "Fiyat Yok"}
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-500 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Discount Badge */}
            {hasDiscount && product.discount_percentage && (
              <span className="inline-block bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded">
                %{product.discount_percentage} İndirim
              </span>
            )}
          </div>

          {/* Seller */}
          {product.seller?.business_name && (
            <p className="text-xs text-gray-500 mt-2 truncate">
              {product.seller.business_name}
            </p>
          )}

          {/* Viewed Time */}
          <p className="text-xs text-gray-400 mt-1">
            {formatViewTime(product.viewedAt)}
          </p>
        </div>
      </Link>
    </div>
  );
}

/**
 * Format the view time to human readable format
 */
function formatViewTime(viewedAt) {
  if (!viewedAt) return "";

  const now = new Date();
  const viewed = new Date(viewedAt);
  const diffInMinutes = Math.floor((now - viewed) / (1000 * 60));

  if (diffInMinutes < 1) return "Az önce";
  if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} saat önce`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} gün önce`;

  return viewed.toLocaleDateString("tr-TR", {
    month: "short",
    day: "numeric",
  });
}
