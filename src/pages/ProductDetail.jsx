import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import Breadcrumb from "../components/Breadcrumb";
import { ProductSEO } from "../components/SEO";
import ExpressCheckoutButton from "../components/ExpressCheckoutButton";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import ConfirmationModal from "../components/ConfirmationModal";
import { useTrackInteraction } from "../hooks/useAnalytics";
import { useAuth } from "../contexts/AuthContext";
import { useProductViewTracking } from "../hooks/useRecentlyViewed";
import { notifications } from "../utils/notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { toast } from "react-hot-toast";
import { useTrackProductEventAdvanced } from "../hooks/useTrackProductEvent";
import FavoriteButton from "../components/ui/FavoriteButton";
import AddToCartButton from "../components/ui/AddToCartButton";

export default function ProductDetail() {
  const { id: productUuid } = useParams();
  const { user } = useAuth();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const queryClient = useQueryClient();
  const trackEvent = useTrackProductEventAdvanced();

  // Favori sayısını getir
  const [favoriteCount, setFavoriteCount] = useState(0);
  useEffect(() => {
    if (!productUuid) return;
    supabase
      .from("favorites")
      .select("id", { count: "exact" })
      .eq("product_id", productUuid)
      .then(({ count }) => setFavoriteCount(count || 0));
  }, [productUuid]);

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", productUuid],
    queryFn: async () => {
      if (!productUuid) return null;

      let { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:sellers(
            id,
            business_name,
            business_slug,
            logo_url,
            average_rating,
            total_reviews
          ),
          category:categories(
            id,
            name,
            slug
          )
        `
        )
        .eq("uuid", productUuid)
        .maybeSingle();

      // UUID ile bulunamazsa ID ile ara
      if (!data && !error) {
        const idResult = await supabase
          .from("products")
          .select(
            `
            *,
            seller:sellers(
              id,
              business_name,
              business_slug,
              logo_url,
              average_rating,
              total_reviews
            ),
            category:categories(
              id,
              name,
              slug
            )
          `
          )
          .eq("id", productUuid)
          .maybeSingle();

        data = idResult.data;
        error = idResult.error;
      }

      if (error) throw error;
      if (!data) {
        throw new Error(`Ürün bulunamadı: ${productUuid}`);
      }
      return data;
    },
  });

  // Fetch seller's other products
  const { data: sellerProducts } = useQuery({
    queryKey: ["sellerProducts", product?.seller_id],
    queryFn: async () => {
      if (!product?.seller_id) return [];
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:sellers(
            id,
            business_name,
            business_slug,
            logo_url
          )
        `
        )
        .eq("seller_id", product.seller_id)
        .neq("uuid", productUuid)
        .eq("status", "active")
        .limit(8);
      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.seller_id,
  });

  // Fetch product reviews
  const { data: reviews } = useQuery({
    queryKey: ["product-reviews", productUuid],
    queryFn: async () => {
      if (!productUuid) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          user:profiles(full_name, avatar_url)
        `
        )
        .eq("product_uuid", productUuid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!productUuid,
  });

  // Track product view
  useProductViewTracking(product);
  useTrackInteraction("product_view", { productId: productUuid });

  // Yorum düzenleme mutation'ı
  const updateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, rating, comment }) => {
      const { data, error } = await supabase
        .from("reviews")
        .update({ rating, comment, updated_at: new Date().toISOString() })
        .eq("id", reviewId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Yorum başarıyla güncellendi");
      queryClient.invalidateQueries(["product", productUuid]);
      setEditingReview(null);
    },
    onError: (error) => {
      toast.error("Yorum güncellenirken hata oluştu: " + error.message);
    },
  });

  // Yorum silme mutation'ı
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Yorum başarıyla silindi");
      queryClient.invalidateQueries(["product", productUuid]);
      setShowDeleteModal(false);
      setReviewToDelete(null);
    },
    onError: (error) => {
      toast.error("Yorum silinirken hata oluştu: " + error.message);
    },
  });

  // Yorum düzenleme formu
  const handleEditReview = (review) => {
    setEditingReview({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
    });
  };

  // Yorum düzenleme kaydetme
  const handleSaveEdit = () => {
    if (!editingReview) return;

    updateReviewMutation.mutate({
      reviewId: editingReview.id,
      rating: editingReview.rating,
      comment: editingReview.comment,
    });
  };

  // Yorum silme onayı
  const handleDeleteReview = (review) => {
    setReviewToDelete(review);
    setShowDeleteModal(true);
  };

  // Yorum silme işlemi
  const confirmDeleteReview = () => {
    if (!reviewToDelete) return;
    deleteReviewMutation.mutate(reviewToDelete.id);
  };

  // Review submission
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const { data, error } = await supabase.from("reviews").insert([
        {
          ...reviewData,
          product_id: productUuid,
          user_id: user.id,
        },
      ]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["product", productUuid]);
      setNewReview({ rating: 5, comment: "" });
      setShowReviewForm(false);
      notifications.success("Yorumunuz başarıyla eklendi!");
    },
    onError: (error) => {
      notifications.error("Yorum eklenirken hata oluştu: " + error.message);
    },
  });

  // Initialize variants
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const defaultVariant = product.variants[0];
      setSelectedVariant(defaultVariant);
      setSelectedColor(defaultVariant.color);
      setSelectedSize(defaultVariant.size);
    }
  }, [product]);

  // Handle variant selection
  const handleVariantChange = (type, value) => {
    if (type === "color") {
      setSelectedColor(value);
      // Find variant with selected color and current size
      const newVariant =
        product.variants.find(
          (v) => v.color === value && (!selectedSize || v.size === selectedSize)
        ) || product.variants.find((v) => v.color === value);

      if (newVariant) {
        setSelectedVariant(newVariant);
        setSelectedSize(newVariant.size);
        // Update main image to show the selected color
        setSelectedImageIndex(0);
      }
    } else if (type === "size") {
      setSelectedSize(value);
      // Find variant with current color and selected size
      const newVariant =
        product.variants.find(
          (v) =>
            v.size === value && (!selectedColor || v.color === selectedColor)
        ) || product.variants.find((v) => v.size === value);

      if (newVariant) {
        setSelectedVariant(newVariant);
        setSelectedColor(newVariant.color);
      }
    }
  };

  // Ürün adı ile arama sonucu ile gelindiyse event
  useEffect(() => {
    if (product?.uuid && window.location.search.includes("search=")) {
      trackEvent({
        productId: product.uuid,
        sellerId: product.seller_id,
        eventType: "search_result_view",
      });
    }
  }, [product?.uuid]);

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
      sellerId: product?.seller_id,
      eventType: isFavorited ? "favorite_add" : "favorite_remove",
    });
  };

  // Yorum ekleme event'i
  const handleSubmitReview = (e) => {
    e.preventDefault();

    if (!user) {
      notifications.warning("Yorum yapmak için giriş yapmalısınız");
      return;
    }

    if (!newReview.comment.trim()) {
      notifications.warning("Lütfen yorum yazınız");
      return;
    }

    submitReviewMutation.mutate(newReview);
    trackEvent({
      productId: productUuid,
      sellerId: product?.seller_id,
      eventType: "review_add",
    });
  };

  // Get current images based on selected variant/color
  const getCurrentImages = () => {
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    if (selectedColor && product?.color_images?.[selectedColor]) {
      return product.color_images[selectedColor];
    }
    return product?.images || ["/images/placeholder.jpg"];
  };

  const currentImages = getCurrentImages();
  const currentImage = currentImages[selectedImageIndex] || currentImages[0];

  // Get unique colors and sizes
  const availableColors =
    [...new Set(product?.variants?.map((v) => v.color).filter(Boolean))] || [];
  const availableSizes =
    [...new Set(product?.variants?.map((v) => v.size).filter(Boolean))] || [];

  // Calculate price based on selected variant
  const getCurrentPrice = () => {
    if (selectedVariant?.price) return selectedVariant.price;
    return product?.price || 0;
  };

  const getCurrentDiscountedPrice = () => {
    if (selectedVariant?.discounted_price)
      return selectedVariant.discounted_price;
    return product?.discounted_price || getCurrentPrice();
  };

  const currentPrice = getCurrentPrice();
  const currentDiscountedPrice = getCurrentDiscountedPrice();
  const hasDiscount = currentDiscountedPrice < currentPrice;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <div className="pt-24 flex justify-center">
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <div className="pt-24 max-w-7xl mx-auto px-4">
          <EmptyState
            title="Ürün Bulunamadı"
            description={
              error?.message?.includes("invalid input syntax")
                ? "Geçersiz ürün ID'si girdiniz. Lütfen geçerli bir ürün seçin."
                : "Aradığınız ürün mevcut değil veya kaldırılmış olabilir."
            }
            actionLabel="Ana Sayfaya Dön"
            actionUrl="/"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <ProductSEO
        product={product}
        category={product?.category}
        seller={product?.seller}
        reviews={reviews}
      />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Ana Sayfa", href: "/" },
              { label: "Ürünler", href: "/products" },
              {
                label: product?.category?.name || "Kategori",
                href: `/category/${product?.category?.slug}`,
              },
              { label: product?.name, href: "#" },
            ]}
          />

          {/* Product Main Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <motion.div
                className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg"
                whileHover={{ scale: 1.02 }}
              >
                <img
                  src={currentImage}
                  alt={product?.name}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setIsImageZoomed(true)}
                />

                {/* Discount Badge */}
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    %
                    {Math.round(
                      ((currentPrice - currentDiscountedPrice) / currentPrice) *
                        100
                    )}{" "}
                    İndirim
                  </div>
                )}
              </motion.div>

              {/* Thumbnail Images */}
              {currentImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {currentImages.map((image, index) => (
                    <motion.button
                      key={index}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${
                        index === selectedImageIndex
                          ? "border-orange-500"
                          : "border-gray-200"
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <img
                        src={image}
                        alt={`${product?.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title and Basic Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product?.name}
                </h1>

                {/* Seller Info */}
                <Link
                  to={`/seller/${
                    product?.seller?.business_slug || product?.seller?.id
                  }`}
                  className="flex items-center gap-3 p-3 bg-white/80 rounded-xl hover:bg-white transition-colors"
                >
                  <img
                    src={
                      product?.seller?.logo_url || "/images/default-avatar.jpg"
                    }
                    alt={product?.seller?.business_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {product?.seller?.business_name}
                    </p>
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {product?.seller?.average_rating?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIconSolid
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (product.average_rating || 0)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {product.average_rating?.toFixed(1) || "0.0"} (
                    {product.total_reviews || 0} değerlendirme)
                  </span>
                </div>

                {/* Favori Sayısı */}
                {favoriteCount > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {favoriteCount} kişi favorilere ekledi
                    </span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="bg-white/80 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  {hasDiscount ? (
                    <>
                      <span className="text-3xl font-bold text-red-600">
                        {currentDiscountedPrice.toLocaleString("tr-TR")} ₺
                      </span>
                      <span className="text-xl text-gray-500 line-through">
                        {currentPrice.toLocaleString("tr-TR")} ₺
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">
                      {currentPrice.toLocaleString("tr-TR")} ₺
                    </span>
                  )}
                </div>
              </div>

              {/* Color Selection */}
              {availableColors.length > 0 && (
                <div className="bg-white/80 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Renk Seçenekleri
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map((color) => {
                      const isSelected = selectedColor === color;
                      return (
                        <motion.button
                          key={color}
                          className={`px-4 py-2 rounded-lg border-2 ${
                            isSelected
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                          onClick={() => handleVariantChange("color", color)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="font-medium capitalize">
                            {color}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {availableSizes.length > 0 && (
                <div className="bg-white/80 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Beden Seçenekleri
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map((size) => {
                      const isSelected = selectedSize === size;
                      const isAvailable = product.variants.some(
                        (v) =>
                          v.size === size &&
                          (!selectedColor || v.color === selectedColor) &&
                          v.stock_quantity > 0
                      );

                      return (
                        <motion.button
                          key={size}
                          className={`px-4 py-2 rounded-lg border-2 ${
                            isSelected
                              ? "border-orange-500 bg-orange-50"
                              : isAvailable
                              ? "border-gray-200 bg-white hover:border-gray-300"
                              : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                          onClick={() =>
                            isAvailable && handleVariantChange("size", size)
                          }
                          disabled={!isAvailable}
                          whileHover={isAvailable ? { scale: 1.05 } : {}}
                          whileTap={isAvailable ? { scale: 0.95 } : {}}
                        >
                          <span className="font-medium uppercase">{size}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity and Actions */}
              <div className="bg-white/80 rounded-xl p-4 space-y-4">
                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">Adet:</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <AddToCartButton
                    product={product}
                    quantity={quantity}
                    size="lg"
                    showText={true}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-xl font-semibold"
                    onAdd={handleAddToCartSuccess}
                  />

                  <FavoriteButton
                    product={product}
                    size="lg"
                    className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50"
                    onToggle={handleFavoriteToggle}
                  />
                </div>

                {/* Express Checkout */}
                <ExpressCheckoutButton
                  product={product}
                  quantity={quantity}
                  variant={selectedVariant}
                />
              </div>

              {/* Features */}
              <div className="bg-white/80 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <TruckIcon className="w-5 h-5 text-orange-500" />
                    <span className="text-sm text-gray-600">
                      Ücretsiz Kargo
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600">
                      İade Garantisi
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-600">Güvenli Ödeme</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-purple-500" />
                    <span className="text-sm text-gray-600">
                      Hızlı Teslimat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="bg-white/80 rounded-2xl shadow-lg">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <div className="flex">
                {[
                  { id: "description", label: "Açıklama" },
                  { id: "specifications", label: "Özellikler" },
                  {
                    id: "reviews",
                    label: `Yorumlar (${reviews?.length || 0})`,
                  },
                  { id: "shipping", label: "Kargo & İade" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === "description" && (
                  <motion.div
                    key="description"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="prose max-w-none"
                  >
                    <p className="text-gray-700 leading-relaxed">
                      {product?.description ||
                        "Bu ürün için henüz açıklama eklenmemiş."}
                    </p>
                  </motion.div>
                )}

                {activeTab === "specifications" && (
                  <motion.div
                    key="specifications"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {product?.specifications ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(product.specifications).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="font-medium text-gray-900 capitalize">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span className="text-gray-700">{value}</span>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        Bu ürün için henüz özellik bilgisi eklenmemiş.
                      </p>
                    )}
                  </motion.div>
                )}

                {activeTab === "reviews" && (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Review Form */}
                    {user && !showReviewForm && (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        Yorum Yaz
                      </button>
                    )}

                    {showReviewForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        onSubmit={handleSubmitReview}
                        className="bg-gray-50 rounded-xl p-6 space-y-4"
                      >
                        <h3 className="text-lg font-semibold text-gray-900">
                          Yorum Yazın
                        </h3>
                        {/* Anonim gönderim seçeneği */}
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id="anonim"
                            checked={newReview.anonymous || false}
                            onChange={(e) =>
                              setNewReview((prev) => ({
                                ...prev,
                                anonymous: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="anonim"
                            className="text-sm text-gray-700"
                          >
                            Yorumu anonim gönder
                          </label>
                        </div>
                        {/* Rating */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Değerlendirme
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  setNewReview((prev) => ({
                                    ...prev,
                                    rating: star,
                                  }))
                                }
                                className="p-1"
                              >
                                <StarIconSolid
                                  className={`w-6 h-6 ${
                                    star <= newReview.rating
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Comment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Yorumunuz
                          </label>
                          <textarea
                            value={newReview.comment}
                            onChange={(e) =>
                              setNewReview((prev) => ({
                                ...prev,
                                comment: e.target.value,
                              }))
                            }
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Ürün hakkındaki düşüncelerinizi paylaşın..."
                          />
                        </div>
                        {/* Actions */}
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={submitReviewMutation.isLoading}
                            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
                          >
                            {submitReviewMutation.isLoading
                              ? "Gönderiliyor..."
                              : "Gönder"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReviewForm(false)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            İptal
                          </button>
                        </div>
                      </motion.form>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-4">
                      {reviews && reviews.length > 0 ? (
                        <>
                          {(showAllReviews ? reviews : reviews.slice(0, 3)).map(
                            (review) => (
                              <div
                                key={review.id}
                                className="bg-gray-50 rounded-xl p-6"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={
                                        review.user?.avatar_url ||
                                        "/images/default-avatar.jpg"
                                      }
                                      alt={review.user?.name}
                                      className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {review.anonymous
                                          ? "Anonim"
                                          : review.user?.full_name || "Anonim"}
                                      </p>
                                      <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, index) => (
                                          <StarIconSolid
                                            key={index}
                                            className={`w-4 h-4 ${
                                              index < review.rating
                                                ? "text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <time className="text-sm text-gray-500">
                                      {new Date(
                                        review.created_at
                                      ).toLocaleDateString("tr-TR")}
                                    </time>
                                    {user && review.user_id === user.id && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() =>
                                            handleEditReview(review)
                                          }
                                          className="p-1 text-gray-500 hover:text-yellow-600 transition-colors"
                                          title="Yorumu düzenle"
                                        >
                                          <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteReview(review)
                                          }
                                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                          title="Yorumu sil"
                                        >
                                          <TrashIcon className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {editingReview?.id === review.id ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">
                                        Puan:
                                      </span>
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          onClick={() =>
                                            setEditingReview((prev) => ({
                                              ...prev,
                                              rating: star,
                                            }))
                                          }
                                          className={`text-2xl ${
                                            star <= editingReview.rating
                                              ? "text-yellow-400"
                                              : "text-gray-300"
                                          }`}
                                        >
                                          ★
                                        </button>
                                      ))}
                                    </div>
                                    <textarea
                                      value={editingReview.comment}
                                      onChange={(e) =>
                                        setEditingReview((prev) => ({
                                          ...prev,
                                          comment: e.target.value,
                                        }))
                                      }
                                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      rows="3"
                                      placeholder="Yorumunuzu yazın..."
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handleSaveEdit}
                                        disabled={
                                          updateReviewMutation.isPending
                                        }
                                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                      >
                                        {updateReviewMutation.isPending
                                          ? "Kaydediliyor..."
                                          : "Kaydet"}
                                      </button>
                                      <button
                                        onClick={() => setEditingReview(null)}
                                        className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                      >
                                        İptal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-gray-700">
                                    {review.comment}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                          {reviews.length > 3 && !showAllReviews && (
                            <button
                              onClick={() => setShowAllReviews(true)}
                              className="w-full mt-2 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                            >
                              Daha fazla yorum göster
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-600 text-center py-8">
                          Bu ürün için henüz yorum yapılmamış. İlk yorum yapan
                          siz olun!
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "shipping" && (
                  <motion.div
                    key="shipping"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Kargo Bilgileri
                        </h3>
                        <div className="space-y-2">
                          <p className="text-gray-700">
                            ✓ 150 TL ve üzeri alışverişlerde ücretsiz kargo
                          </p>
                          <p className="text-gray-700">
                            ✓ 1-3 iş günü içinde kargoya verilir
                          </p>
                          <p className="text-gray-700">
                            ✓ Kapıda ödeme seçeneği
                          </p>
                          <p className="text-gray-700">
                            ✓ SMS ile kargo takip bilgisi
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          İade ve Değişim
                        </h3>
                        <div className="space-y-2">
                          <p className="text-gray-700">
                            ✓ 14 gün içinde ücretsiz iade
                          </p>
                          <p className="text-gray-700">
                            ✓ Ürün hasarsız ve orijinal ambalajında olmalı
                          </p>
                          <p className="text-gray-700">
                            ✓ İade kargo ücreti tarafımızdan karşılanır
                          </p>
                          <p className="text-gray-700">
                            ✓ 3-5 iş günü içinde paranız iade edilir
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Seller's Other Products */}
          {sellerProducts && sellerProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Satıcının Diğer Ürünleri
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sellerProducts.map((item) => (
                  <Link
                    key={item.uuid}
                    to={`/product/${item.uuid}`}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <img
                      src={item.images?.[0] || "/images/placeholder.jpg"}
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                        {item.name}
                      </h3>
                      {item.average_rating > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-3 h-3 ${
                                star <= Math.round(item.average_rating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="text-xs text-gray-600">
                            {item.average_rating.toFixed(1)} (
                            {item.total_reviews})
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {item.discounted_price &&
                        item.discounted_price < item.price ? (
                          <>
                            <span className="text-lg font-bold text-orange-600">
                              {item.discounted_price.toLocaleString("tr-TR")} ₺
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              {item.price.toLocaleString("tr-TR")} ₺
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-orange-600">
                            {item.price.toLocaleString("tr-TR")} ₺
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {isImageZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setIsImageZoomed(false)}
          >
            <motion.img
              src={currentImage}
              alt={product?.name}
              className="max-w-full max-h-full object-contain"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Silme Onay Modalı */}
      {showDeleteModal && reviewToDelete && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setReviewToDelete(null);
          }}
          onConfirm={confirmDeleteReview}
          title="Yorumu Sil"
          danger={true}
          confirmText="Evet, Sil"
          cancelText="İptal"
        >
          <p>{`"${
            reviewToDelete.product?.name || "Bu ürün"
          }" için yazdığınız yorumu silmek istediğinizden emin misiniz?`}</p>
        </ConfirmationModal>
      )}
    </div>
  );
}
