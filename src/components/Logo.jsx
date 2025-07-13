import { Link } from "react-router-dom";

/**
 * ANDA Logo Component
 */
export default function Logo({ className = "", size = "medium" }) {
  const sizeClasses = {
    small: "text-lg",
    medium: "text-2xl",
    large: "text-4xl",
  };

  return (
    <Link to="/" className={`group ${className}`}>
      <div
        className={`font-bold text-blue-600 group-hover:text-blue-700 transition-colors ${sizeClasses[size]}`}
      >
        ANDA
      </div>
    </Link>
  );
}
