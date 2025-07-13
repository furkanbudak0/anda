import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import ProductStatusBadge from "./ProductStatusBadge";

const MyProductCard = ({ product, onEdit, onDelete, selected, onSelect }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow overflow-hidden border ${
        selected
          ? "border-purple-500 ring-2 ring-purple-200"
          : "border-gray-200"
      }`}
    >
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center">
          {onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(product.id)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-3"
            />
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
              {product.name}
            </h3>
            <div className="flex items-center mt-1">
              <ProductStatusBadge status={product.status} />
              <span className="ml-2 text-sm text-gray-500">
                SKU: {product.sku}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(product)}
            className="text-gray-400 hover:text-purple-600"
            aria-label="Edit product"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="text-gray-400 hover:text-red-600"
            aria-label="Delete product"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Product Image */}
      <div className="h-48 bg-gray-200 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">
            ₺{product.price}
          </span>
          {product.compare_at_price && (
            <span className="text-sm text-gray-500 line-through">
              ₺{product.compare_at_price}
            </span>
          )}
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>Stok: {product.inventory_quantity || 0}</p>
          {product.category && <p>Kategori: {product.category}</p>}
        </div>
      </div>
    </div>
  );
};

export default MyProductCard;
