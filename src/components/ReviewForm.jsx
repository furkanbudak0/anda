import { useState } from "react";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useCreateReview } from "../hooks/useReviews";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

export default function ReviewForm({ product, orderId, onSuccess, onCancel }) {
  const { user } = useAuth();
  const createReviewMutation = useCreateReview();

  const [formData, setFormData] = useState({
    rating: 0,
    title: "",
    comment: "",
    images: [],
  });
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Değerlendirme yapabilmek için giriş yapmalısınız");
      return;
    }

    if (!product) {
      toast.error("Yorum eklemek için bir ürün seçmelisiniz.");
      return;
    }

    if (formData.rating === 0) {
      toast.error("Lütfen bir puan verin");
      return;
    }

    if (!formData.comment.trim()) {
      toast.error("Lütfen yorumunuzu yazın");
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        productUuid: product.uuid,
        orderId: orderId,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment,
        images: formData.images,
      });

      // Reset form
      setFormData({
        rating: 0,
        title: "",
        comment: "",
        images: [],
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 5) {
      toast.error("En fazla 5 fotoğraf yükleyebilirsiniz");
      return;
    }

    // In a real implementation, you would upload these to a storage service
    // For now, we'll just create temporary URLs
    const newImages = files.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));
  };

  const removeImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= (hoveredRating || formData.rating);
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, rating: i }))}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          className="p-1 transition-transform hover:scale-110"
        >
          {isFilled ? (
            <StarIconSolid className="w-8 h-8 text-yellow-400" />
          ) : (
            <StarIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          )}
        </button>
      );
    }
    return stars;
  };

  const getRatingText = (rating) => {
    const texts = {
      1: "Çok Kötü",
      2: "Kötü",
      3: "Orta",
      4: "İyi",
      5: "Mükemmel",
    };
    return texts[rating] || "";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Ürünü Değerlendir
        </h3>

        {/* Product Info */}
        {product ? (
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <img
              src={product.image_url || "/placeholder-product.jpg"}
              alt={product.name || "Ürün"}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {product.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bu ürün hakkında deneyiminizi paylaşın
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <img
              src="/placeholder-product.jpg"
              alt="Ürün"
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Ürün seçilmedi
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lütfen bir ürün seçerek değerlendirme yapın
              </p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Puanınız *
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex">{renderStars()}</div>
            {(hoveredRating || formData.rating) > 0 && (
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-3">
                {getRatingText(hoveredRating || formData.rating)}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Başlık (İsteğe bağlı)
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Değerlendirmeniz için kısa bir başlık"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Yorumunuz *
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, comment: e.target.value }))
            }
            placeholder="Ürün hakkında deneyiminizi detaylı olarak paylaşın..."
            rows={5}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formData.comment.length}/1000
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fotoğraflar (İsteğe bağlı)
          </label>
          <div className="space-y-3">
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Yüklenen fotoğraf ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.images.length < 5 && (
              <div>
                <input
                  type="file"
                  id="review-images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="review-images"
                  className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <div className="text-center">
                    <svg
                      className="w-8 h-8 text-gray-400 mx-auto mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Fotoğraf Ekle
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            En fazla 5 fotoğraf yükleyebilirsiniz (JPG, PNG)
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              İptal
            </button>
          )}
          <button
            type="submit"
            disabled={createReviewMutation.isLoading || formData.rating === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createReviewMutation.isLoading
              ? "Gönderiliyor..."
              : "Değerlendirmeyi Gönder"}
          </button>
        </div>
      </form>
    </div>
  );
}

ReviewForm.propTypes = {
  product: PropTypes.shape({
    uuid: PropTypes.string,
    image_url: PropTypes.string,
    name: PropTypes.string,
  }),
  orderId: PropTypes.string,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};
