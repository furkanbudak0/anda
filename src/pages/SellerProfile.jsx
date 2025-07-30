import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MapPinIcon,
  GlobeAltIcon,
  CalendarIcon,
  ShoppingBagIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { supabase } from "../services/supabase";
import ProductGrid from "../components/ProductGrid";
import LoadingFallback from "../components/LoadingFallback";
import EmptyState from "../components/EmptyState";

export default function SellerProfile() {
  const { sellerSlug } = useParams();
  const [activeTab, setActiveTab] = useState("products");

  // Seller verilerini getir
  const {
    data: seller,
    isLoading: sellerLoading,
    error: sellerError,
  } = useQuery({
    queryKey: ["seller", sellerSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select(
          `
          *,
          user:profiles(full_name, email, phone)
        `
        )
        .eq("business_slug", sellerSlug)
        .eq("verification_status", "verified");

      if (error) throw new Error("Satıcı bulunamadı");
      if (!data || data.length === 0) return null;
      return data[0];
    },
    enabled: !!sellerSlug,
  });

  // Seller'ın ürünlerini getir
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["seller-products", seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];

      console.log("🔍 Seller ürünleri query başladı, seller.id:", seller.id);

      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:sellers(id, business_name, business_slug, logo_url)
        `
        )
        .eq("seller_id", seller.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Seller ürünleri query hatası:", error);
        throw error;
      }

      console.log(
        "✅ Seller ürünleri query sonucu:",
        data?.length,
        "ürün bulundu"
      );
      return data || [];
    },
    enabled: !!seller?.id,
  });

  // Seller'ın review'larını getir
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["seller-reviews", seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];

      // Önce seller'ın ürünlerini alalım
      const { data: sellerProducts, error: productsError } = await supabase
        .from("products")
        .select("uuid, name")
        .eq("seller_id", seller.id);

      if (productsError) throw productsError;
      if (!sellerProducts || sellerProducts.length === 0) return [];

      const productUuids = sellerProducts.map((p) => p.uuid);
      const productMap = sellerProducts.reduce((acc, p) => {
        acc[p.uuid] = p.name;
        return acc;
      }, {});

      // Sonra bu ürünlerin review'larını alalım
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          user:profiles(full_name, avatar_url)
        `
        )
        .in("product_uuid", productUuids)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Review'lara ürün adını ekleyelim
      const reviewsWithProductNames = (data || []).map((review) => ({
        ...review,
        product_name: productMap[review.product_uuid],
      }));

      return reviewsWithProductNames;
    },
    enabled: !!seller?.id,
  });

  if (sellerLoading) {
    return <LoadingFallback />;
  }

  if (sellerError || !seller) {
    return (
      <EmptyState
        title="Satıcı Bulunamadı"
        description="Aradığınız satıcı mevcut değil."
        actionText="Ana Sayfaya Dön"
        actionTo="/"
      />
    );
  }

  const tabs = [
    { id: "products", label: "Ürünler", count: products?.length || 0 },
    { id: "about", label: "Hakkında" },
    {
      id: "reviews",
      label: "Değerlendirmeler",
      count: seller.total_reviews || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Seller Banner */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Seller Logo */}
            <div className="flex-shrink-0">
              {seller.logo_url ? (
                <img
                  src={seller.logo_url}
                  alt={seller.business_name}
                  className="w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-white shadow-lg">
                  <ShoppingBagIcon className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                      {seller.business_name || "Mağaza"}
                    </h1>
                    {seller.verification_status === "verified" && (
                      <CheckBadgeIcon className="w-6 h-6 text-blue-500" />
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarSolid
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (seller.average_rating || 0)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {seller.average_rating?.toFixed(1) || "0.0"} (
                      {seller.total_reviews || 0} değerlendirme)
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <ShoppingBagIcon className="w-4 h-4" />
                      <span>{seller.total_orders || 0} sipariş</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {seller.created_at
                          ? new Date(seller.created_at).toLocaleDateString(
                              "tr-TR",
                              {
                                year: "numeric",
                                month: "long",
                              }
                            )
                          : "Bilinmiyor"}{" "}
                        tarihinde katıldı
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col gap-2 text-sm">
                  {seller.contact_email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span>Email: {seller.contact_email}</span>
                    </div>
                  )}
                  {seller.contact_phone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span>Telefon: {seller.contact_phone}</span>
                    </div>
                  )}
                  {seller.address && (
                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                      <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{seller.address}</span>
                    </div>
                  )}
                  {seller.website_url && (
                    <div className="flex items-center gap-2">
                      <GlobeAltIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <a
                        href={seller.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                      >
                        Web Sitesi
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-600 dark:text-orange-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "products" && (
          <div>
            {productsLoading ? (
              <LoadingFallback />
            ) : products && products.length > 0 ? (
              <ProductGrid
                products={products}
                isLoading={false}
                showDiscount={true}
              />
            ) : (
              <EmptyState
                title="Henüz Ürün Yok"
                description="Bu satıcının henüz aktif ürünü bulunmuyor."
                showAction={false}
              />
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Hakkımızda
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                {seller.description ||
                  seller.business_description ||
                  "Bu satıcı henüz açıklama eklememmiş."}
              </p>
            </div>

            {/* Social Media Links */}
            {(seller.instagram_url ||
              seller.facebook_url ||
              seller.twitter_url) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Sosyal Medya
                </h3>
                <div className="flex gap-4">
                  {seller.instagram_url && (
                    <a
                      href={seller.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-700"
                    >
                      Instagram
                    </a>
                  )}
                  {seller.facebook_url && (
                    <a
                      href={seller.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Facebook
                    </a>
                  )}
                  {seller.twitter_url && (
                    <a
                      href={seller.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-500"
                    >
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Müşteri Değerlendirmeleri
            </h2>
            {reviewsLoading ? (
              <LoadingFallback />
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          {review.user?.avatar_url ? (
                            <img
                              src={review.user.avatar_url}
                              alt={review.user.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {review.user?.full_name?.charAt(0) || "U"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {review.user?.full_name || "Anonim"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {review.product_name || "Ürün"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarSolid
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {review.comment}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(review.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Henüz Değerlendirme Yok"
                description="Bu satıcı için henüz müşteri değerlendirmesi bulunmuyor."
                showAction={false}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
