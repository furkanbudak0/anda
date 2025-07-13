const statusColors = {
  active: "bg-green-100 text-green-800",
  draft: "bg-yellow-100 text-yellow-800",
  archived: "bg-gray-100 text-gray-800",
  out_of_stock: "bg-red-100 text-red-800",
  pending: "bg-blue-100 text-blue-800",
};

const statusLabels = {
  active: "Aktif",
  draft: "Taslak",
  archived: "Arşiv",
  out_of_stock: "Stokta Yok",
  pending: "Bekliyor",
};

const ProductStatusBadge = ({ status }) => {
  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800";
  const label = statusLabels[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
};

export default ProductStatusBadge;
