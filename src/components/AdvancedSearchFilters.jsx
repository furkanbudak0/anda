/* eslint-disable react/prop-types */
import { Fragment, useState, useId } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { useBringToFrontAndCenter } from "../utils/bringToFrontAndCenter";

// Mock data - categories, popular tags, etc.
const categories = [
  { id: "erkek", name: "Erkek Giyim" },
  { id: "kadin", name: "Kadın Giyim" },
  { id: "ayakkabi", name: "Ayakkabı" },
  { id: "aksesuar", name: "Aksesuar" },
  { id: "elektronik", name: "Elektronik" },
];

export default function AdvancedSearchFilters({ isOpen, onClose }) {
  const modalId = useId();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [localFilters, setLocalFilters] = useState({
    categories: [],
    brands: [],
    priceRange: [0, 10000],
    colors: [],
    sizes: [],
    rating: 0,
    inStock: false,
  });

  // Bring to front and center hook
  const { elementRef } = useBringToFrontAndCenter(`${modalId}-modal`, {
    isOpen,
    type: "MODAL",
    onClose,
    center: true,
    trapFocus: true,
    preventBodyScroll: true,
    restoreFocus: true,
  });

  const handleApplyFilters = () => {
    // Apply filters logic here
    console.log("Filters applied:", localFilters);
    onClose();
  };

  const handleClearAll = () => {
    setLocalFilters({
      categories: [],
      brands: [],
      priceRange: [0, 10000],
      colors: [],
      sizes: [],
      rating: 0,
      inStock: false,
    });
    setSelectedTags([]);
    setSearchQuery("");
  };

  const updateLocalFilter = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Popular tags mock data
  const popularTags = [
    { tag: "yazlık", count: 156 },
    { tag: "spor", count: 243 },
    { tag: "günlük", count: 189 },
    { tag: "elegant", count: 97 },
    { tag: "rahat", count: 312 },
    { tag: "trend", count: 78 },
    { tag: "klasik", count: 134 },
    { tag: "modern", count: 201 },
  ];

  const brands = [
    { id: "nike", name: "Nike" },
    { id: "adidas", name: "Adidas" },
    { id: "zara", name: "Zara" },
    { id: "h&m", name: "H&M" },
    { id: "lcw", name: "LC Waikiki" },
  ];

  const colors = [
    { name: "Siyah", hex: "#000000" },
    { name: "Beyaz", hex: "#FFFFFF" },
    { name: "Kırmızı", hex: "#FF0000" },
    { name: "Mavi", hex: "#0000FF" },
    { name: "Yeşil", hex: "#00FF00" },
    { name: "Sarı", hex: "#FFFF00" },
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[1200]"
        onClose={onClose}
        aria-labelledby={`${modalId}-title`}
        aria-describedby={`${modalId}-description`}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                ref={elementRef}
                className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-2xl transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    id={`${modalId}-title`}
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center gap-2"
                  >
                    <FunnelIcon className="w-5 h-5" />
                    Gelişmiş Arama & Filtreler
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 p-1"
                    aria-label="Kapat"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div
                  id={`${modalId}-description`}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Left Column - Search & Categories */}
                  <div className="space-y-6">
                    {/* Search Query */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Arama Terimi
                      </label>
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Ürün, marka veya kategori ara..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Popular Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Popüler Etiketler
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.slice(0, 10).map((tag) => (
                          <button
                            key={tag.tag}
                            onClick={() => toggleTag(tag.tag)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                              selectedTags.includes(tag.tag)
                                ? "bg-brand-600 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            <TagIcon className="w-3 h-3" />#{tag.tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Categories */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Kategoriler
                      </label>
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <label
                            key={category.id}
                            className="flex items-center"
                          >
                            <input
                              type="checkbox"
                              checked={localFilters.categories.includes(
                                category.id
                              )}
                              onChange={(e) => {
                                const newCategories = e.target.checked
                                  ? [...localFilters.categories, category.id]
                                  : localFilters.categories.filter(
                                      (c) => c !== category.id
                                    );
                                updateLocalFilter("categories", newCategories);
                              }}
                              className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {category.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Brands & Colors */}
                  <div className="space-y-6">
                    {/* Brands */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Markalar
                      </label>
                      <div className="space-y-2">
                        {brands.map((brand) => (
                          <label key={brand.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={localFilters.brands.includes(brand.id)}
                              onChange={(e) => {
                                const newBrands = e.target.checked
                                  ? [...localFilters.brands, brand.id]
                                  : localFilters.brands.filter(
                                      (b) => b !== brand.id
                                    );
                                updateLocalFilter("brands", newBrands);
                              }}
                              className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {brand.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Renkler
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {colors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => {
                              const newColors = localFilters.colors?.includes(
                                color.name
                              )
                                ? localFilters.colors.filter(
                                    (c) => c !== color.name
                                  )
                                : [...(localFilters.colors || []), color.name];
                              updateLocalFilter("colors", newColors);
                            }}
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                              localFilters.colors?.includes(color.name)
                                ? "border-brand-600 bg-brand-50 dark:bg-brand-900/20"
                                : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                            }`}
                          >
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300">
                              {color.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sizes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bedenler
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              const newSizes = localFilters.sizes?.includes(
                                size
                              )
                                ? localFilters.sizes.filter((s) => s !== size)
                                : [...(localFilters.sizes || []), size];
                              updateLocalFilter("sizes", newSizes);
                            }}
                            className={`p-2 text-sm rounded-lg border transition-colors ${
                              localFilters.sizes?.includes(size)
                                ? "border-brand-600 bg-brand-600 text-white"
                                : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Price & Additional Filters */}
                  <div className="space-y-6">
                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fiyat Aralığı
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            placeholder="Min"
                            value={localFilters.priceRange[0]}
                            onChange={(e) =>
                              updateLocalFilter("priceRange", [
                                parseInt(e.target.value) || 0,
                                localFilters.priceRange[1],
                              ])
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                          />
                          <span className="text-gray-500 dark:text-gray-400">
                            -
                          </span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Max"
                            value={localFilters.priceRange[1]}
                            onChange={(e) =>
                              updateLocalFilter("priceRange", [
                                localFilters.priceRange[0],
                                parseInt(e.target.value) || 10000,
                              ])
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localFilters.inStock}
                          onChange={(e) =>
                            updateLocalFilter("inStock", e.target.checked)
                          }
                          className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Sadece stokta olanlar
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                  >
                    Temizle
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleApplyFilters}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
                  >
                    Filtreleri Uygula
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
