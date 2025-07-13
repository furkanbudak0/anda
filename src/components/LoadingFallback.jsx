import Logo from "./Logo";

/**
 * Loading Fallback Component for Code Splitting
 * Modern skeleton loader with brand colors - Pure Tailwind CSS
 */
export default function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="mb-8">
        <Logo size="large" />
      </div>

      {/* Loading Animation - Pure Tailwind */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:100ms]"></div>
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:200ms]"></div>
      </div>

      {/* Loading Text */}
      <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
        Yükleniyor...
      </p>

      {/* Progress Bar */}
      <div className="mt-6 w-64 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}

/**
 * Skeleton Component for Content Loading
 */
export function ContentSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>

      {/* Card Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3"
          >
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Page Loading Skeleton
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Skeleton */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex space-x-4">
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="pt-16">
        <ContentSkeleton />
      </div>
    </div>
  );
}
