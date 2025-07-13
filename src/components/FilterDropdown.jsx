/* eslint-disable react/prop-types */
import { ChevronDownIcon } from "@heroicons/react/24/outline";

/**
 * Reusable filter dropdown component
 */
export default function FilterDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = "Seçiniz...",
  className = "",
}) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-purple-500 focus:border-purple-500 text-sm"
        >
          {!value && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {selectedOption && selectedOption.description && (
        <p className="text-xs text-gray-500 mt-1">
          {selectedOption.description}
        </p>
      )}
    </div>
  );
}
