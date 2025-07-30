import { useState, useEffect } from "react";
import { useSimpleFavorites } from "../hooks/useSimpleFavorites";
import { supabase } from "../services/supabase";
import ProductCard from "../components/ProductCard";
import LoadingFallback from "../components/LoadingFallback";
import EmptyState from "../components/EmptyState";
import { HeartIcon } from "@heroicons/react/24/outline";

export default function SimpleFavorites() {
  const { favorites, loading } = useSimpleFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Favori ürünlerin detaylarını getir
  const fetchFavoriteProducts = async () => {
    if (!favorites.length) {
      setFavoriteProducts([]);
      return;
    }

    setProductsLoading(true);
    try {
      const productIds = favorites.map((fav) => fav.product_id);

      const { data, error } = await supabase
        .from("products")
        .select(
          `
          uuid,
          name,
          price,
          discounted_price,
          image_url,
          images,
          average_rating,
          total_reviews,
          stock,
          seller_id,
          seller:sellers(business_name, business_slug, logo_url)
        `
        )
        .in("uuid", productIds);

      if (error) {
        console.error("Favorite products fetch error:", error);
        return;
      }

      // Favori sırasını koru
      const sortedProducts = productIds
        .map((id) => data.find((product) => product.uuid === id))
        .filter(Boolean);

      setFavoriteProducts(sortedProducts);
    } catch (error) {
      console.error("Favorite products fetch error:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Favoriler değiştiğinde ürünleri yenile
  useEffect(() => {
    fetchFavoriteProducts();
  }, [favorites]);

  if (loading || productsLoading) {
    return <LoadingFallback />;
  }

  if (favorites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Favorilerim</h1>
          <p className="text-gray-600">
            Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca
            bulabilirsiniz.
          </p>
        </div>

        <EmptyState
          icon={<HeartIcon className="w-12 h-12 text-gray-400" />}
          title="Henüz Favori Ürününüz Yok"
          description="Beğendiğiniz ürünleri favorilere ekleyerek burada görebilirsiniz."
          action={{
            text: "Ürünlere Göz At",
            onClick: () => (window.location.href = "/products"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Favorilerim</h1>
        <p className="text-gray-600">{favorites.length} ürün favorilerinizde</p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favoriteProducts.map((product) => (
          <ProductCard key={product.uuid} product={product} />
        ))}
      </div>
    </div>
  );
}
