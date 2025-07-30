import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";

export default function AdminStatsCard({
  title,
  value,
  change,
  changeType = "percentage", // percentage, number
  trend = "up", // up, down, neutral
  icon: Icon,
  color = "blue",
  loading = false,
}) {
  const getColorClasses = () => {
    const colors = {
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-200",
      },
      green: {
        bg: "bg-green-50",
        text: "text-green-600",
        border: "border-green-200",
      },
      red: {
        bg: "bg-red-50",
        text: "text-red-600",
        border: "border-red-200",
      },
      yellow: {
        bg: "bg-yellow-50",
        text: "text-yellow-600",
        border: "border-yellow-200",
      },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-600",
        border: "border-purple-200",
      },
    };
    return colors[color] || colors.blue;
  };

  const getTrendIcon = () => {
    if (trend === "up") {
      return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    } else if (trend === "down") {
      return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getChangeText = () => {
    if (!change) return null;

    const prefix = trend === "up" ? "+" : trend === "down" ? "-" : "";
    const suffix = changeType === "percentage" ? "%" : "";
    return `${prefix}${change}${suffix}`;
  };

  const colorClasses = getColorClasses();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {Icon && (
          <div
            className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.border}`}
          >
            <Icon className={`h-6 w-6 ${colorClasses.text}`} />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center mt-1">
              {getTrendIcon()}
              <span
                className={`text-sm font-medium ml-1 ${
                  trend === "up"
                    ? "text-green-600"
                    : trend === "down"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {getChangeText()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
