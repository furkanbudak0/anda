/* eslint-disable react/prop-types */

/**
 * Stats card component for displaying key metrics
 */
export default function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = "neutral",
  description,
  className = "",
}) {
  const changeColors = {
    positive: "text-green-600 bg-green-100",
    negative: "text-red-600 bg-red-100",
    neutral: "text-gray-600 bg-gray-100",
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>

          {change && (
            <div className="flex items-center mt-2">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${changeColors[changeType]}`}
              >
                {change}
              </span>
              {description && (
                <span className="text-sm text-gray-500 ml-2">
                  {description}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className="ml-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
