import { useState } from "react";
import {
  StarIcon,
  EyeIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import {
  useAdminReviews,
  useModerateReview,
  useDeleteReview,
} from "../../hooks/useReviews";
import AdminSidebar from "../AdminSidebar";
import toast from "react-hot-toast";

export default function AdminReviews() {
  const [filters, setFilters] = useState({
    status: "all", // all, pending, approved
    rating: "", // 1-5
    search: "",
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [moderationNotes, setModerationNotes] = useState("");

  const { data: reviews, isLoading } = useAdminReviews(filters);
  const moderateReviewMutation = useModerateReview();
  const deleteReviewMutation = useDeleteReview();

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = (review) => {
    setSelectedReview(review);
    setModerationNotes(review.admin_notes || "");
    setIsDetailModalOpen(true);
  };

  const handleModerate = async (reviewId, action) => {
    moderateReviewMutation.mutate({
      reviewId,
      action,
      adminNotes: moderationNotes,
    });
    setIsDetailModalOpen(false);
    setSelectedReview(null);
    setModerationNotes("");
  };

  const handleDelete = (reviewId) => {
    if (window.confirm("Bu incelemeyi silmek istediğinizden emin misiniz?")) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`w-4 h-4 ${
              i < rating
                ? "text-yellow-400 fill-current"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          ({rating})
        </span>
      </div>
    );
  };

  const getStatusBadge = (isApproved) => {
    if (isApproved) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Onaylandı
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Beklemede
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <AdminSidebar />
      <div className="flex-1 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              İnceleme Yönetimi
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Kullanıcı yorumlarını ve değerlendirmelerini buradan
              yönetebilirsiniz.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">
                Filtreler
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durum
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilter("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tümü</option>
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onaylandı</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Puan
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilter("rating", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tüm Puanlar</option>
                  <option value="5">5 Yıldız</option>
                  <option value="4">4 Yıldız</option>
                  <option value="3">3 Yıldız</option>
                  <option value="2">2 Yıldız</option>
                  <option value="1">1 Yıldız</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arama
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilter("search", e.target.value)}
                  placeholder="Başlık veya yorum içinde ara..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Yükleniyor...
                </p>
              </div>
            ) : reviews?.length === 0 ? (
              <div className="p-8 text-center">
                <StarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">
                  Henüz inceleme bulunmuyor.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        İnceleme
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ürün
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Kullanıcı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Puan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reviews?.map((review) => (
                      <tr
                        key={review.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {review.title || "Başlıksız"}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {review.comment?.substring(0, 100)}...
                            </div>
                            {review.is_verified_purchase && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                                <CheckIcon className="w-3 h-3 mr-1" />
                                Doğrulanmış Alış
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={
                                review.product?.image_url ||
                                "/placeholder-product.jpg"
                              }
                              alt={review.product?.name}
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                {review.product?.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              className="h-8 w-8 rounded-full"
                              src={
                                review.user?.avatar_url || "/default-avatar.png"
                              }
                              alt={review.user?.full_name}
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {review.user?.full_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {review.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStars(review.rating)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(review.is_approved)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(review.created_at).toLocaleDateString(
                            "tr-TR"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewDetails(review)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Detayları Görüntüle"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {!review.is_approved && (
                              <button
                                onClick={() =>
                                  handleModerate(review.id, "approve")
                                }
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                title="Onayla"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                            )}
                            {review.is_approved && (
                              <button
                                onClick={() =>
                                  handleModerate(review.id, "reject")
                                }
                                className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                                title="Reddet"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Sil"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Detail Modal */}
      {isDetailModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  İnceleme Detayları
                </h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <img
                    className="h-12 w-12 rounded-full"
                    src={
                      selectedReview.user?.avatar_url || "/default-avatar.png"
                    }
                    alt={selectedReview.user?.full_name}
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedReview.user?.full_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedReview.user?.email}
                    </p>
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <img
                    className="h-16 w-16 rounded-lg object-cover"
                    src={
                      selectedReview.product?.image_url ||
                      "/placeholder-product.jpg"
                    }
                    alt={selectedReview.product?.name}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {selectedReview.product?.name}
                    </h4>
                  </div>
                </div>

                {/* Review Content */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {renderStars(selectedReview.rating)}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(selectedReview.created_at).toLocaleDateString(
                          "tr-TR"
                        )}
                      </span>
                    </div>
                    {getStatusBadge(selectedReview.is_approved)}
                  </div>

                  {selectedReview.title && (
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedReview.title}
                    </h5>
                  )}

                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedReview.comment}
                  </p>

                  {selectedReview.images &&
                    selectedReview.images.length > 0 && (
                      <div className="mt-4">
                        <h6 className="font-medium text-gray-900 dark:text-white mb-2">
                          Fotoğraflar:
                        </h6>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedReview.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`İnceleme fotoğrafı ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Helpfulness Stats */}
                <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                  <span>👍 {selectedReview.helpful_count} Faydalı</span>
                  <span>
                    👎 {selectedReview.not_helpful_count} Faydalı Değil
                  </span>
                  {selectedReview.is_verified_purchase && (
                    <span className="text-blue-600 dark:text-blue-400">
                      ✓ Doğrulanmış Alış
                    </span>
                  )}
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Admin Notları
                  </label>
                  <textarea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="İnceleme ile ilgili notlarınızı yazın..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    İptal
                  </button>

                  {!selectedReview.is_approved ? (
                    <button
                      onClick={() =>
                        handleModerate(selectedReview.id, "approve")
                      }
                      disabled={moderateReviewMutation.isLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Onayla
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleModerate(selectedReview.id, "reject")
                      }
                      disabled={moderateReviewMutation.isLoading}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Reddet
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(selectedReview.id)}
                    disabled={deleteReviewMutation.isLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
