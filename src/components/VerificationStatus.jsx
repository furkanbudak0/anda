import { FiCheck, FiX, FiClock } from "react-icons/fi";

const statusConfig = {
  verified: {
    icon: <FiCheck className="h-4 w-4" />,
    color: "bg-green-100 text-green-800",
    label: "Doğrulanmış",
  },
  unverified: {
    icon: <FiX className="h-4 w-4" />,
    color: "bg-red-100 text-red-800",
    label: "Doğrulanmadı",
  },
  pending: {
    icon: <FiClock className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-800",
    label: "Bekliyor",
  },
};

export default function VerificationStatus({ status }) {
  const config = statusConfig[status] || statusConfig.unverified;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </span>
  );
}
