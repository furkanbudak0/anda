/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";

/**
 * OPTIMIZED IMAGE COMPONENT
 *
 * Features:
 * - WebP format support with fallback
 * - Lazy loading with intersection observer
 * - Responsive images with multiple sizes
 * - Loading skeleton
 * - Error handling with fallback image
 * - Progressive loading
 */

const FALLBACK_IMAGE =
  "/images/vecteezy_icon-image-not-found-vector_-qig91xf7c4wrpysav5vum9nk5hzcohkjskkhafgecg.jpg";

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  sizes = "100vw",
  priority = false,
  quality = 85,
  placeholder = "blur",
  onLoad,
  onError,
  ...props
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(priority ? src : null);

  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  const { ref: intersectionRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    skip: priority, // Skip intersection observer if priority is true
  });

  // Set refs to the same element
  const setRefs = (element) => {
    imgRef.current = element;
    intersectionRef(element);
  };

  // Load image when in view or priority
  useEffect(() => {
    if ((inView || priority) && !imageSrc && src) {
      setImageSrc(src);
    }
  }, [inView, priority, src, imageSrc]);

  // Generate WebP and fallback URLs
  const generateImageUrl = (originalSrc, format = null) => {
    if (!originalSrc) return FALLBACK_IMAGE;

    // If it's already a data URL or external URL, return as is
    if (originalSrc.startsWith("data:") || originalSrc.startsWith("http")) {
      return originalSrc;
    }

    // For local images, generate optimized URLs
    const basePath = originalSrc.replace(/\.[^/.]+$/, ""); // Remove extension
    const extension = format || "webp";

    return `${basePath}.${extension}`;
  };

  // Generate responsive image URLs
  const generateSrcSet = (originalSrc) => {
    if (
      !originalSrc ||
      originalSrc.startsWith("data:") ||
      originalSrc.startsWith("http")
    ) {
      return "";
    }

    const widths = [320, 640, 768, 1024, 1280, 1536];
    return widths
      .map((w) => `${generateImageUrl(originalSrc)}?w=${w}&q=${quality} ${w}w`)
      .join(", ");
  };

  const handleImageLoad = (e) => {
    setImageLoaded(true);
    setImageError(false);
    if (onLoad) onLoad(e);
  };

  const handleImageError = (e) => {
    setImageError(true);
    setImageSrc(FALLBACK_IMAGE);
    if (onError) onError(e);
  };

  // Skeleton/placeholder component
  const ImageSkeleton = () => (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 ${className}`}
      style={{ width, height }}
      data-testid="image-skeleton"
    >
      <div className="flex items-center justify-center h-full">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );

  // If image is not in view and not priority, show skeleton
  if (!imageSrc) {
    return <ImageSkeleton />;
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Loading skeleton */}
      {!imageLoaded && !imageError && <ImageSkeleton />}

      {/* Optimized image with WebP support */}
      <picture ref={setRefs}>
        {/* WebP format for modern browsers */}
        <source
          srcSet={generateSrcSet(imageSrc)}
          sizes={sizes}
          type="image/webp"
        />

        {/* Fallback for older browsers */}
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          srcSet={generateSrcSet(imageSrc)}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`
            transition-opacity duration-300 object-cover w-full h-full
            ${imageLoaded ? "opacity-100" : "opacity-0"}
            ${imageError ? "opacity-50" : ""}
          `}
          {...props}
        />
      </picture>

      {/* Error overlay */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs">Resim yüklenemedi</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Specialized image components for different use cases
 */

/**
 * Product Image Component
 */
export function ProductImage({
  src,
  alt,
  className = "",
  priority = false,
  ...props
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={400}
      className={`rounded-lg ${className}`}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
      priority={priority}
      quality={90}
      {...props}
    />
  );
}

/**
 * Avatar Image Component
 */
export function AvatarImage({
  src,
  alt,
  size = "md",
  className = "",
  ...props
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const dimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimensions[size].width}
      height={dimensions[size].height}
      className={`rounded-full ${sizeClasses[size]} ${className}`}
      sizes="100px"
      quality={95}
      {...props}
    />
  );
}

/**
 * Hero/Banner Image Component
 */
export function HeroImage({
  src,
  alt,
  className = "",
  priority = true,
  ...props
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={800}
      className={`w-full h-auto ${className}`}
      sizes="100vw"
      priority={priority}
      quality={85}
      {...props}
    />
  );
}

/**
 * Thumbnail Image Component
 */
export function ThumbnailImage({ src, alt, className = "", ...props }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={100}
      height={100}
      className={`rounded ${className}`}
      sizes="100px"
      quality={80}
      {...props}
    />
  );
}

/**
 * Category Image Component
 */
export function CategoryImage({ src, alt, className = "", ...props }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={200}
      className={`rounded-lg ${className}`}
      sizes="(max-width: 768px) 100vw, 300px"
      quality={85}
      {...props}
    />
  );
}
