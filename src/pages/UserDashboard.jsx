import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAddresses } from "../hooks/useAddresses";
import { useFavorites } from "../contexts/FavoritesContext";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  MapPinIcon,
  CreditCardIcon,
  CogIcon,
  StarIcon,
  TruckIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../services/supabase";
import ReviewForm from "../components/ReviewForm";
import ConfirmationModal from "../components/ConfirmationModal";

const UserDashboard = () => {
  const { user, profile, updateProfile, changePassword } = useAuth();
  const { data: addresses = [] } = useAddresses();
  const {
    favoriteProductIds,
    toggleFavorite,
    refetchFavorites,
    favoritesCount,
  } = useFavorites();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const [activeTab, setActiveTab] = useState("overview");
  const [setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || "",
    email: user?.email || "",
  });
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "" });
  const [notifSettings, setNotifSettings] = useState({
    email: true,
    sms: false,
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const navigate = useNavigate();

  const { data: orders = [] } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items(*)
        `,
          { count: "exact" }
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: myReviews = [], refetch: refetchMyReviews } = useQuery({
    queryKey: ["my-reviews", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("*, product:products(id, name, image_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch favorite products using UUIDs
  const { data: favoriteProducts = [] } = useQuery({
    queryKey: ["favorite-products-dashboard", favoriteProductIds],
    queryFn: async () => {
      if (!favoriteProductIds.length) return [];

      const { data, error } = await supabase
        .from("products")
        .select(
          `
          uuid,
          name,
          slug,
          image_url,
          price,
          discounted_price,
          stock,
          seller:sellers(
            id,
            business_name,
            business_slug,
            logo_url
          )
        `
        )
        .in("uuid", favoriteProductIds);

      if (error) {
        console.error("Favorite products fetch error:", error);
        return [];
      }

      return data || [];
    },
    enabled: favoriteProductIds.length > 0,
  });

  // Profil güncelle
  const handleProfileSave = async () => {
    await updateProfile(profileForm);
    setEditProfile(false);
    toast.success("Profil güncellendi");
  };

  // Şifre değiştir
  const handlePasswordChange = async () => {
    await changePassword(passwordForm.current, passwordForm.new);
    setPasswordForm({ current: "", new: "" });
    toast.success("Şifre değiştirildi");
  };

  // Bildirim ayarları güncelle (dummy, gerçek servis ile entegre edilebilir)
  const handleNotifSave = () => {
    toast.success("Bildirim ayarları kaydedildi");
  };

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
      refetchMyReviews();
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
      refetchMyReviews();
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

  // Ürüne gitme
  const goToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const renderFavorites = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Favori Ürünlerim ({favoritesCount})
        </h3>
      </div>
      <div className="p-6">
        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favoriteProducts.map((product) => (
              <div
                key={product.uuid}
                className="flex items-center gap-4 border p-4 rounded-lg"
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    {product.seller?.business_name}
                  </div>
                </div>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={async () => {
                    if (!product.uuid) {
                      toast.error(
                        "Favoriden çıkarmak için geçerli bir ürün uuid'si gereklidir."
                      );
                      return;
                    }
                    await toggleFavorite(product.uuid);
                    await refetchFavorites();
                  }}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Henüz favori ürününüz yok
          </div>
        )}
      </div>
    </div>
  );

  const renderAddresses = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Adreslerim</h3>
      </div>
      <div className="p-6">
        {addresses.length > 0 ? (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {address.address_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {address.full_name} - {address.city}
                  </div>
                  <div className="text-sm text-gray-500">
                    {address.address_line_1} {address.address_line_2}
                  </div>
                  <div className="text-sm text-gray-500">{address.phone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // setEditAddressId(address.id); // kaldırıldı
                      // setAddressForm(address); // kaldırıldı
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={async () => {
                      // await updateAddress.mutateAsync({ // kaldırıldı
                      //   id: address.id, // kaldırıldı
                      //   data: addressForm, // kaldırıldı
                      // }); // kaldırıldı
                      // await refetchAddresses(); // kaldırıldı
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                // setEditAddressId("new"); // kaldırıldı
                // setAddressForm({}); // kaldırıldı
              }}
              className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <PlusIcon className="w-5 h-5" />
              Yeni Adres Ekle
            </button>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Henüz adres eklenmemiş
          </div>
        )}
        {/* Adres düzenleme/ekleme modalı burada olabilir */}
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Ödeme Yöntemlerim
        </h3>
      </div>
      <div className="p-6">
        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {card.card_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {card.card_number_masked}
                  </div>
                  <div className="text-sm text-gray-500">
                    {card.card_holder_name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // setEditCardId(card.id); // kaldırıldı
                      // setCardForm(card); // kaldırıldı
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={async () => {
                      // await updateCard.mutateAsync({ // kaldırıldı
                      //   id: card.id, // kaldırıldı
                      //   data: cardForm, // kaldırıldı
                      // }); // kaldırıldı
                      // await refetchPayments(); // kaldırıldı
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                // setEditCardId("new"); // kaldırıldı
                // setCardForm({}); // kaldırıldı
              }}
              className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <PlusIcon className="w-5 h-5" />
              Yeni Kart Ekle
            </button>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Henüz ödeme yöntemi eklenmemiş
          </div>
        )}
        {/* Kart düzenleme/ekleme modalı burada olabilir */}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Hesap Ayarları</h3>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <input
            type="text"
            className="border p-2 rounded"
            value={profileForm.full_name}
            onChange={(e) =>
              setProfileForm((f) => ({ ...f, full_name: e.target.value }))
            }
            placeholder="Ad Soyad"
          />
          <input
            type="email"
            className="border p-2 rounded"
            value={profileForm.email}
            onChange={(e) =>
              setProfileForm((f) => ({ ...f, email: e.target.value }))
            }
            placeholder="E-posta"
          />
          <button
            onClick={handleProfileSave}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Kaydet
          </button>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="password"
            className="border p-2 rounded"
            value={passwordForm.current}
            onChange={(e) =>
              setPasswordForm((f) => ({ ...f, current: e.target.value }))
            }
            placeholder="Mevcut Şifre"
          />
          <input
            type="password"
            className="border p-2 rounded"
            value={passwordForm.new}
            onChange={(e) =>
              setPasswordForm((f) => ({ ...f, new: e.target.value }))
            }
            placeholder="Yeni Şifre"
          />
          <button
            onClick={handlePasswordChange}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Şifreyi Değiştir
          </button>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={notifSettings.email}
              onChange={(e) =>
                setNotifSettings((f) => ({ ...f, email: e.target.checked }))
              }
            />{" "}
            E-posta Bildirimi
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={notifSettings.sms}
              onChange={(e) =>
                setNotifSettings((f) => ({ ...f, sms: e.target.checked }))
              }
            />{" "}
            SMS Bildirimi
          </label>
          <button
            onClick={handleNotifSave}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Kullanıcı Bilgileri */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {profile?.full_name || "Kullanıcı"}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-sm text-gray-500">
              Üye olma tarihi:{" "}
              {new Date(user?.created_at).toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>
      </div>

      {/* Hızlı İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingBagIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Toplam Sipariş
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <HeartIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Favori Ürün</p>
              <p className="text-2xl font-semibold text-gray-900">
                {favoritesCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <StarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Yorumlarım</p>
              <p className="text-2xl font-semibold text-gray-900">5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Son Siparişler */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Son Siparişler
          </h3>
        </div>
        <div className="p-6">
          {orders.slice(0, 3).map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">ORD-{order.id}</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString("tr-TR")} •{" "}
                  {order.order_items?.length || 0} ürün
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  ₺{order.total_price}
                </p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800`}
                >
                  Teslim Edildi
                </span>
              </div>
            </div>
          ))}
          <div className="text-center">
            <Link
              to="/orders"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Tüm siparişleri görüntüle
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Sipariş Geçmişi</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">ORD-{order.id}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ₺{order.total_price}
                  </p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800`}
                  >
                    Teslim Edildi
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {order.order_items?.length || 0} ürün
                  </span>
                  {/* order.status === "Kargoda" && ( */}
                  <div className="flex items-center space-x-1 text-blue-600">
                    <TruckIcon className="w-4 h-4" />
                    <span className="text-sm">Kargo takibi</span>
                  </div>
                  {/* ) */}
                </div>
                <Link
                  to={`/order/${order.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Detayları Görüntüle
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMyReviews = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Yorumlarım</h3>
      </div>
      <div className="p-6">
        {myReviews.length > 0 ? (
          <div className="space-y-4">
            {myReviews.map((review) => (
              <div
                key={review.id}
                className="border p-4 rounded-lg flex gap-4 items-start"
              >
                <img
                  src={review.product?.image_url || "/images/placeholder.jpg"}
                  alt={review.product?.name}
                  className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => goToProduct(review.product?.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => goToProduct(review.product?.id)}
                    >
                      {review.product?.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => goToProduct(review.product?.id)}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Ürüne git"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditReview(review)}
                        className="p-1 text-gray-500 hover:text-yellow-600 transition-colors"
                        title="Yorumu düzenle"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review)}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        title="Yorumu sil"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {editingReview?.id === review.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Puan:</span>
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
                          disabled={updateReviewMutation.isPending}
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
                    <>
                      <div className="text-yellow-500 mb-2">
                        {"★".repeat(review.rating)}
                      </div>
                      <div className="text-gray-700 mb-2">{review.comment}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString(
                          "tr-TR"
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Henüz yorumunuz yok
          </div>
        )}
        <button
          onClick={() => setShowReviewForm(true)}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Yorum Yap
        </button>
        {showReviewForm && (
          <ReviewForm
            // product prop'u kaldırıldı
            onSuccess={() => {
              setShowReviewForm(false);
              refetchMyReviews();
            }}
            onCancel={() => setShowReviewForm(false)}
          />
        )}
      </div>

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
          <p>{`"${reviewToDelete.product?.name}" ürünü için yazdığınız yorumu silmek istediğinizden emin misiniz?`}</p>
        </ConfirmationModal>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "orders":
        return renderOrders();
      case "favorites":
        return renderFavorites();
      case "addresses":
        return renderAddresses();
      case "payments":
        return renderPayments();
      case "settings":
        return renderSettings();
      case "myreviews":
        return renderMyReviews();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <nav className="space-y-2">
              {/* dashboardItems.map((item) => { */}
              <button
                key="overview"
                onClick={() => setActiveTab("overview")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === "overview"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <div>
                  <div className="font-medium">Genel Bakış</div>
                  <div className="text-xs text-gray-500">
                    Hesap bilgileriniz ve özet
                  </div>
                </div>
              </button>
              <button
                key="orders"
                onClick={() => setActiveTab("orders")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === "orders"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <ShoppingBagIcon className="w-5 h-5" />
                <div>
                  <div className="font-medium">Siparişlerim</div>
                  <div className="text-xs text-gray-500">
                    Sipariş geçmişi ve takibi
                  </div>
                </div>
              </button>
              <button
                key="favorites"
                onClick={() => setActiveTab("favorites")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === "favorites"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <HeartIcon className="w-5 h-5" />
                <div>
                  <div className="font-medium">Favorilerim</div>
                  <div className="text-xs text-gray-500">
                    Beğendiğiniz ürünler
                  </div>
                </div>
              </button>
              <button
                key="addresses"
                onClick={() => setActiveTab("addresses")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === "addresses"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <MapPinIcon className="w-5 h-5" />
                <div>
                  <div className="font-medium">Adreslerim</div>
                  <div className="text-xs text-gray-500">
                    Teslimat adresleri
                  </div>
                </div>
              </button>
              <button
                key="payments"
                onClick={() => setActiveTab("payments")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === "payments"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <CreditCardIcon className="w-5 h-5" />
                <div>
                  <div className="font-medium">Ödeme Yöntemlerim</div>
                  <div className="text-xs text-gray-500">Kayıtlı kartlar</div>
                </div>
              </button>
              <button
                key="settings"
                onClick={() => setActiveTab("settings")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === "settings"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <CogIcon className="w-5 h-5" />
                <div>
                  <div className="font-medium">Ayarlar</div>
                  <div className="text-xs text-gray-500">Hesap ayarları</div>
                </div>
              </button>
              <button
                key="myreviews"
                onClick={() => setActiveTab("myreviews")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === "myreviews"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <StarIcon className="w-5 h-5" />
                <div>
                  <div className="font-medium">Yorumlarım</div>
                  <div className="text-xs text-gray-500">
                    Yazdığınız değerlendirmeler
                  </div>
                </div>
              </button>
              {/* )} */}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {/* dashboardItems.find((item) => item.id === activeTab)?.title */}
                {activeTab === "overview"
                  ? "Genel Bakış"
                  : activeTab === "orders"
                  ? "Siparişlerim"
                  : activeTab === "favorites"
                  ? "Favorilerim"
                  : activeTab === "addresses"
                  ? "Adreslerim"
                  : activeTab === "payments"
                  ? "Ödeme Yöntemlerim"
                  : activeTab === "settings"
                  ? "Hesap Ayarları"
                  : activeTab === "myreviews"
                  ? "Yorumlarım"
                  : "Siparişlerim"}
              </h1>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
