import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import ProductCard from "./ProductCard";
import Spinner from "./Spinner";

export default function ProductCarousel({
  products = [],
  isLoading = false,
  error = null,
  autoSlide = false,
  slideInterval = 5000,
  itemsPerSlide = 4,
  showControls = true,
  showDots = true,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Toplam slide sayısını hesapla
  const totalSlides = Math.ceil(products.length / itemsPerSlide);
  const maxIndex = Math.max(0, totalSlides - 1);

  // Auto slide efekti
  useEffect(() => {
    if (!autoSlide || isPaused || totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, slideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, slideInterval, maxIndex, isPaused, totalSlides]);

  // Mouse hover durumunda pause
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Navigation fonksiyonları
  const goToSlide = (index) => {
    setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  // Mevcut slide'daki ürünleri al
  const getCurrentProducts = () => {
    const startIndex = currentIndex * itemsPerSlide;
    return products.slice(startIndex, startIndex + itemsPerSlide);
  };

  // Loading durumu
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  // Error durumu
  if (error) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">
            Ürünler yüklenirken hata oluştu: {error.message}
          </p>
        </div>
      </div>
    );
  }

  // Boş durum
  if (!products || products.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Henüz ürün bulunmuyor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full max-w-6xl mx-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {getCurrentProducts().map((product) => (
              <ProductCard key={product.uuid} product={product} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        {showControls && totalSlides > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 backdrop-blur-sm"
              aria-label="Önceki"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 backdrop-blur-sm"
              aria-label="Sonraki"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {showDots && totalSlides > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalSlides }, (_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "bg-blue-600 dark:bg-blue-400 w-6"
                  : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {totalSlides > 1 && (
        <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
          {currentIndex + 1} / {totalSlides}
        </div>
      )}
    </div>
  );
}

// PropTypes
ProductCarousel.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      uuid: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      discounted_price: PropTypes.number,
      discount_percentage: PropTypes.number,
      image_url: PropTypes.string,
      images: PropTypes.arrayOf(PropTypes.string),
      average_rating: PropTypes.number,
      total_reviews: PropTypes.number,
      stock_quantity: PropTypes.number,
    })
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  autoSlide: PropTypes.bool,
  slideInterval: PropTypes.number,
  itemsPerSlide: PropTypes.number,
  showControls: PropTypes.bool,
  showDots: PropTypes.bool,
};
