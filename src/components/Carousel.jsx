import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function ImageCarousel({ product, selectedVariant }) {
  // Get images from product or selectedVariant
  const images = selectedVariant?.image_url
    ? [selectedVariant.image_url]
    : product?.images || [];

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    if (images.length === 0 || isPaused || images.length === 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images, isPaused]);

  // Reset index when variant changes
  useEffect(() => {
    setIndex(0);
  }, [selectedVariant]);

  if (images.length === 0) {
    return (
      <div className="relative w-full h-[500px] bg-gray-200 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500 font-medium">Görsel mevcut değil</p>
        </div>
      </div>
    );
  }

  // Touch event handlers for mobile swipe
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStartX) return;
    const touchEndX = e.changedTouches[0].clientX;
    if (touchStartX - touchEndX > 50) {
      // Swipe left (Next)
      setIndex((index + 1) % images.length);
    } else if (touchStartX - touchEndX < -50) {
      // Swipe right (Previous)
      setIndex((index - 1 + images.length) % images.length);
    }
    setTouchStartX(null);
  };

  const goToPrevious = () => {
    setIndex((index - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setIndex((index + 1) % images.length);
  };

  const goToSlide = (slideIndex) => {
    setIndex(slideIndex);
  };

  return (
    <div
      className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Image Container */}
      <div className="relative w-full h-[500px] bg-gray-100">
        <img
          src={images[index]}
          alt={`${product?.name || "Ürün"} - ${index + 1}`}
          className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
          onError={(e) => {
            e.target.src =
              "https://placehold.co/600x400?text=Görsel+Yüklenemedi";
          }}
        />

        {/* Image Overlay with Product Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Loading indicator for image transitions */}
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
          {index + 1} / {images.length}
        </div>
      </div>

      {/* Navigation Buttons - Only show if more than one image */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Önceki görsel"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Sonraki görsel"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Thumbnail Navigation - Only show if more than one image */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                i === index
                  ? "bg-white scale-125 shadow-lg"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`${i + 1}. görsele git`}
            />
          ))}
        </div>
      )}

      {/* Keyboard Navigation Hint */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          ← → Görsel değiştir
        </div>
      )}
    </div>
  );
}
