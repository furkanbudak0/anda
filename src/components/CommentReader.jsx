import { useState } from "react";
import {
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

export default function CommentReader({ product, reviews = [] }) {
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, rating_high, rating_low, helpful
  const [filterRating, setFilterRating] = useState(0); // 0 = all, 1-5 = specific rating
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <ChatBubbleLeftIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Henüz değerlendirme yok
          </h3>
          <p className="text-gray-600 mb-6">
            Bu ürün için ilk değerlendirmeyi siz yazın!
          </p>
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-8 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
          >
            Değerlendirme Yaz
          </button>
        </div>
      </div>
    );
  }

  // Calculate rating distribution
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
    percentage:
      (reviews.filter((review) => review.rating === rating).length /
        reviews.length) *
      100,
  }));

  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  // Filter and sort reviews
  let filteredReviews =
    filterRating === 0
      ? reviews
      : reviews.filter((review) => review.rating === filterRating);

  switch (sortBy) {
    case "oldest":
      filteredReviews.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      break;
    case "rating_high":
      filteredReviews.sort((a, b) => b.rating - a.rating);
      break;
    case "rating_low":
      filteredReviews.sort((a, b) => a.rating - b.rating);
      break;
    case "helpful":
      filteredReviews.sort(
        (a, b) => (b.helpful_count || 0) - (a.helpful_count || 0)
      );
      break;
    default: // newest
      filteredReviews.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
  }

  return (
    <div className="space-y-8">
      {/* Review Summary */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
              <span className="text-5xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
              <div>
                <div className="flex items-center mb-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIconSolid
                      key={i}
                      className={`w-6 h-6 ${
                        i < Math.floor(averageRating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600">{reviews.length} değerlendirme</p>
              </div>
            </div>

            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
            >
              Değerlendirme Yaz
            </button>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-3">
            {ratingDistribution
              .reverse()
              .map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <StarIconSolid className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Sırala:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="rating_high">En Yüksek Puan</option>
              <option value="rating_low">En Düşük Puan</option>
              <option value="helpful">En Faydalı</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Filtrele:
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterRating(0)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterRating === 0
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Tümü
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(rating)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filterRating === rating
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {rating}
                  <StarIconSolid className="w-4 h-4 text-yellow-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {filteredReviews.length === 0 && filterRating > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-500">
            {filterRating} yıldızlı değerlendirme bulunamadı.
          </p>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  const [isHelpful, setIsHelpful] = useState(false);
  const [showImages, setShowImages] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            {review.user?.avatar ? (
              <img
                src={review.user.avatar}
                alt={review.user.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold">
                {review.user?.full_name?.charAt(0) || "?"}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {review.user?.full_name || "Anonim Kullanıcı"}
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString("tr-TR")}
              </span>
            </div>
          </div>
        </div>

        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <FlagIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Review Content */}
      <div className="space-y-3">
        {review.title && (
          <h5 className="font-medium text-gray-900">{review.title}</h5>
        )}
        <p className="text-gray-700 leading-relaxed">{review.content}</p>

        {/* Review Images */}
        {review.images && review.images.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowImages(!showImages)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showImages
                ? "Görselleri Gizle"
                : `${review.images.length} Görsel Göster`}
            </button>

            {showImages && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {review.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Değerlendirme görseli ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsHelpful(!isHelpful)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isHelpful
                ? "bg-green-100 text-green-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <HandThumbUpIcon className="w-4 h-4" />
            Faydalı ({(review.helpful_count || 0) + (isHelpful ? 1 : 0)})
          </button>

          <button className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            <HandThumbDownIcon className="w-4 h-4" />
            Faydalı Değil
          </button>
        </div>

        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Yanıtla
        </button>
      </div>
    </div>
  );
}
