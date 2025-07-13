import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HeartIcon,
  TrashIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import NavBar from "../components/NavBar";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import { useWishlists, useRemoveFromWishlist } from "../hooks/useWishlist";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../utils/formatters";
import { toast } from "react-hot-toast";

export default function FavList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedWishlist, setSelectedWishlist] = useState("all");

  const { data: wishlists, isLoading, error } = useWishlists();
  const removeFromWishlist = useRemoveFromWishlist();
  const { addItem } = useCart();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-20 flex justify-center">
          <Spinner size="large" text="Favoriler yükleniyor..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-20 max-w-7xl mx-auto px-4">
          <div className="text-center text-red-600">
            Favoriler yüklenirken hata oluştu: {error.message}
          </div>
        </div>
      </div>
    );
  }

  // Flatten all wishlist items
  const allItems =
    wishlists?.flatMap(
      (wishlist) =>
        wishlist.wishlist_items?.map((item) => ({
          ...item,
          wishlistId: wishlist.id,
          wishlistName: wishlist.name,
        })) || []
    ) || [];

  // Filter items based on search and selected wishlist
  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product?.seller?.business_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesWishlist =
      selectedWishlist === "all" || item.wishlistId === selectedWishlist;

    return matchesSearch && matchesWishlist;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at) - new Date(a.created_at);
      case "oldest":
        return new Date(a.created_at) - new Date(b.created_at);
      case "price-low":
        return (a.product?.price || 0) - (b.product?.price || 0);
      case "price-high":
        return (b.product?.price || 0) - (a.product?.price || 0);
      case "name":
        return (a.product?.name || "").localeCompare(b.product?.name || "");
      default:
        return 0;
    }
  });

  const handleRemoveFromWishlist = async (item) => {
    try {
      await removeFromWishlist.mutateAsync({
        itemId: item.id,
      });
    } catch (error) {
      console.error("Remove from wishlist error:", error);
    }
  };

  const handleAddToCart = (item) => {
    const product = item.product;
    const variant = item.variant;

    if (!product) return;

    addItem({
      id: variant ? variant.id : product.id,
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      price: variant?.price || product.price,
      image: variant?.image_url || product.image_url,
      seller: product.seller?.business_name,
      quantity: 1,
      maxQuantity: variant?.quantity || 999,
    });

    toast.success("Ürün sepete eklendi!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="pt-20 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <HeartIconSolid className="w-8 h-8 text-red-500" />
            Favorilerim
          </h1>
          <p className="text-gray-600 mt-2">
            {allItems.length} ürün favorilerinizde
          </p>
        </div>

        {allItems.length === 0 ? (
          <EmptyState
            icon={HeartIcon}
            title="Henüz favori ürününüz yok"
            description="Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca ulaşabilirsiniz."
            actionLabel="Alışverişe Başla"
            actionLink="/products"
          />
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Favori ürünlerinizde ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Wishlist Filter */}
                {wishlists && wishlists.length > 1 && (
                  <div className="min-w-0 md:w-48">
                    <select
                      value={selectedWishlist}
                      onChange={(e) => setSelectedWishlist(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="all">Tüm Listeler</option>
                      {wishlists.map((wishlist) => (
                        <option key={wishlist.id} value={wishlist.id}>
                          {wishlist.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sort */}
                <div className="min-w-0 md:w-48">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="newest">En Yeni</option>
                    <option value="oldest">En Eski</option>
                    <option value="price-low">Fiyat (Düşük)</option>
                    <option value="price-high">Fiyat (Yüksek)</option>
                    <option value="name">İsim</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results */}
            {sortedItems.length === 0 ? (
              <div className="text-center py-12">
                <AdjustmentsHorizontalIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Arama kriterlerinize uygun ürün bulunamadı.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedItems.map((item) => (
                  <FavoriteProductCard
                    key={item.id}
                    item={item}
                    onRemove={() => handleRemoveFromWishlist(item)}
                    onAddToCart={() => handleAddToCart(item)}
                    isRemoving={removeFromWishlist.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Favorite Product Card Component
function FavoriteProductCard({ item, onRemove, onAddToCart, isRemoving }) {
  const product = item.product;
  const variant = item.variant;

  if (!product) return null;

  const price = variant?.price || product.price;
  const comparePrice = variant?.compare_at_price || product.compare_at_price;
  const image = variant?.image_url || product.image_url;
  const hasDiscount = comparePrice && comparePrice > price;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        <Link to={`/product/${product.slug}`}>
          <img
            src={image || "/api/placeholder/300/300"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            %{Math.round(((comparePrice - price) / comparePrice) * 100)} İndirim
          </div>
        )}

        {/* Actions */}
        <div className="absolute top-2 right-2 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
            title="Favorilerden çıkar"
          >
            <TrashIcon className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-purple-600">
            {product.name}
          </h3>
        </Link>

        {/* Seller */}
        {product.seller && (
          <p className="text-sm text-gray-500 mb-2">
            {product.seller.business_name}
          </p>
        )}

        {/* Variant Info */}
        {variant && (
          <p className="text-sm text-gray-600 mb-2">{variant.title}</p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>

        {/* Wishlist Info */}
        <p className="text-xs text-gray-400 mb-3">
          {item.wishlistName} •{" "}
          {new Date(item.created_at).toLocaleDateString("tr-TR")}
        </p>

        {/* Add to Cart Button */}
        <button
          onClick={onAddToCart}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCartIcon className="w-4 h-4" />
          Sepete Ekle
        </button>
      </div>
    </div>
  );
}
