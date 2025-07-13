/* eslint-disable react/prop-types */
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";

/**
 * Modern Star Rating Component
 * Uses Tailwind CSS instead of inline styles
 */
export default function StarRating({
  avgRating,
  maxRating = 5,
  color = "text-yellow-400",
  size = "w-6 h-6",
  showText = true,
  className = "",
}) {
  // avgRating'e göre tam, yarım ve boş yıldız sayısını hesapla
  const fullStars = Math.floor(avgRating); // Tam yıldız sayısı
  const halfStar = avgRating % 1 >= 0.5 ? 1 : 0; // Yarım yıldız var mı?
  const emptyStars = maxRating - fullStars - halfStar; // Boş yıldız sayısı

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center">
        {/* Tam yıldızları render et */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <StarIcon key={`full-${i}`} className={`${size} ${color}`} />
        ))}

        {/* Yarım yıldızı render et */}
        {halfStar > 0 && (
          <div className="relative">
            <StarOutlineIcon className={`${size} ${color}`} />
            <StarIcon
              className={`${size} ${color} absolute top-0 left-0`}
              style={{ clipPath: "inset(0 50% 0 0)" }}
            />
          </div>
        )}

        {/* Boş yıldızları render et */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <StarOutlineIcon
            key={`empty-${i}`}
            className={`${size} text-gray-300`}
          />
        ))}
      </div>

      {showText && (
        <span className={`text-sm font-medium ${color}`}>
          {avgRating.toFixed(1)} / {maxRating}
        </span>
      )}
    </div>
  );
}

/**
 * Interactive Star Rating Component
 * For user ratings/reviews
 */
export function InteractiveStarRating({
  rating = 0,
  onRatingChange,
  maxRating = 5,
  size = "w-8 h-8",
  className = "",
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onRatingChange?.(starValue)}
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 rounded"
          >
            {isFilled ? (
              <StarIcon className={`${size} text-yellow-400`} />
            ) : (
              <StarOutlineIcon
                className={`${size} text-gray-300 hover:text-yellow-400`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
