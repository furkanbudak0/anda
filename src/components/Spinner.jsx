/* eslint-disable react/prop-types */

/**
 * Loading spinner component
 */
export default function Spinner({
  size = "medium",
  color = "blue",
  text = "Yükleniyor...",
  showText = true,
  className = "",
}) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
    xlarge: "w-16 h-16",
  };

  const colorClasses = {
    blue: "border-blue-600",
    emerald: "border-emerald-600",
    orange: "border-orange-600",
    red: "border-red-600",
    gray: "border-gray-600",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          border-4 border-t-transparent rounded-full animate-spin
        `}
      />
      {showText && (
        <p className="mt-4 text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );
}

/**
 * Full screen loading spinner
 */
export function FullScreenSpinner({ text = "Yükleniyor..." }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="text-center">
        <Spinner size="large" text={text} />
      </div>
    </div>
  );
}

/**
 * Inline spinner for buttons
 */
export function ButtonSpinner({ color = "blue" }) {
  return (
    <Spinner
      size="small"
      color={color}
      showText={false}
      className="inline-flex"
    />
  );
}
