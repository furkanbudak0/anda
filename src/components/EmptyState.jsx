/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";

/**
 * Empty state component for when there's no data to display
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
  className = "",
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <div className="mx-auto w-24 h-24 mb-6 text-gray-400">
          <Icon className="w-full h-full" />
        </div>
      )}

      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>

      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      )}

      {actionLabel && (actionLink || onAction) && (
        <div>
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
