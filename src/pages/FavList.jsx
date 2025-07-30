import { useState, useEffect } from "react";
import { useFavorites } from "../contexts/FavoritesContext";
import ProductGrid from "../components/ProductGrid";
import LoadingFallback from "../components/LoadingFallback";
import EmptyState from "../components/EmptyState";
import { HeartIcon } from "@heroicons/react/24/outline";

export default function FavList() {
  const { getFavoriteProducts, loading, favoritesCount } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState([]);

  useEffect(() => {
    (async () => {
      const products = await getFavoriteProducts();
      setFavoriteProducts(products);
    })();
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return <LoadingFallback />;
  }

  if (!favoriteProducts.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            title="Favori Ürününüz Yok"
            description="Henüz favori ürününüz bulunmuyor. Beğendiğiniz ürünleri favorilere ekleyerek burada görüntüleyebilirsiniz."
            icon={HeartIcon}
            actionLabel="Ürünlere Göz At"
            actionLink="/"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Favori Ürünlerim
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {favoritesCount} ürün favorilerinizde
          </p>
        </div>
        <ProductGrid
          products={favoriteProducts}
          isLoading={false}
          showDiscount={true}
        />
      </div>
    </div>
  );
}
