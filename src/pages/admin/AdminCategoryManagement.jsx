import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../services/supabase";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import LoadingFallback from "../../components/LoadingFallback";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function AdminCategoryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parent_id: null,
    icon: "",
    color: "#3B82F6",
    is_active: true,
    sort_order: 0,
  });

  const queryClient = useQueryClient();

  // Fetch categories from Supabase
  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select(
          `
          *,
          subcategories:categories!parent_id(
            *,
            product_count:products(count)
          ),
          product_count:products(count)
        `
        )
        .is("parent_id", null)
        .order("sort_order");

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }

      return data.map((category) => ({
        ...category,
        product_count: category.product_count?.[0]?.count || 0,
        subcategories:
          category.subcategories?.map((sub) => ({
            ...sub,
            product_count: sub.product_count?.[0]?.count || 0,
          })) || [],
      }));
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (categoryData) => {
      const { data, error } = await supabase
        .from("categories")
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-categories"]);
      toast.success("Kategori başarıyla eklendi!");
      setShowAddModal(false);
      setNewCategory({
        name: "",
        description: "",
        parent_id: null,
        icon: "",
        color: "#3B82F6",
        is_active: true,
        sort_order: 0,
      });
    },
    onError: (error) => {
      console.error("Error adding category:", error);
      toast.error("Kategori eklenirken hata oluştu!");
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from("categories")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-categories"]);
      toast.success("Kategori başarıyla güncellendi!");
      setEditingCategory(null);
    },
    onError: (error) => {
      console.error("Error updating category:", error);
      toast.error("Kategori güncellenirken hata oluştu!");
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId) => {
      // First check if category has products
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("category_id", categoryId);

      if (productCount > 0) {
        throw new Error("Bu kategoride ürünler bulunduğu için silinemez!");
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-categories"]);
      toast.success("Kategori başarıyla silindi!");
    },
    onError: (error) => {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Kategori silinirken hata oluştu!");
    },
  });

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error("Kategori adı gerekli!");
      return;
    }

    // Auto-generate slug from name
    const slug = newCategory.name
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    addCategoryMutation.mutate({
      ...newCategory,
      slug,
      sort_order: categories.length,
    });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description,
      parent_id: category.parent_id,
      icon: category.icon,
      color: category.color,
      is_active: category.is_active,
      sort_order: category.sort_order,
    });
  };

  const handleUpdateCategory = (categoryId, updateData) => {
    updateCategoryMutation.mutate({
      id: categoryId,
      data: updateData,
    });
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleToggleActive = (category) => {
    handleUpdateCategory(category.id, {
      is_active: !category.is_active,
    });
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kategori Yönetimi
          </h1>
          <p className="text-gray-600">
            Ürün kategorilerini yönetin ve düzenleyin
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Kategori Ekle
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Kategori</p>
              <p className="text-xl font-semibold text-gray-900">
                {categories.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <EyeIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aktif Kategori</p>
              <p className="text-xl font-semibold text-gray-900">
                {categories.filter((cat) => cat.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              {/* TagIcon was removed from imports, so using MagnifyingGlassIcon as a placeholder */}
              <MagnifyingGlassIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Alt Kategori</p>
              <p className="text-xl font-semibold text-gray-900">
                {categories.reduce(
                  (sum, cat) => sum + cat.subcategories.length,
                  0
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              {/* FolderOpenIcon was removed from imports, so using MagnifyingGlassIcon as a placeholder */}
              <MagnifyingGlassIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Ürün</p>
              <p className="text-xl font-semibold text-gray-900">
                {categories.reduce((sum, cat) => sum + cat.product_count, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Kategoriler</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {categories.map((category) => (
            <div key={category.id} className="p-4">
              {/* Main Category */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCategoryExpansion(category.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {category.subcategories.length > 0 ? (
                      expandedCategories.has(category.id) ? (
                        <FolderIcon className="w-5 h-5" />
                      ) : (
                        <FolderIcon className="w-5 h-5" />
                      )
                    ) : (
                      <MagnifyingGlassIcon className="w-5 h-5" />
                    )}
                  </button>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: category.color + "20",
                      color: category.color,
                    }}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {category.product_count} ürün
                  </span>
                  <button
                    onClick={() => handleToggleActive(category)}
                    className={`p-1 rounded ${
                      category.is_active
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {category.is_active ? (
                      <EyeIcon className="w-4 h-4" />
                    ) : (
                      <EyeSlashIcon className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteCategory(category)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              {expandedCategories.has(category.id) &&
                category.subcategories.length > 0 && (
                  <div className="ml-8 mt-3 space-y-2">
                    {category.subcategories.map((subcat) => (
                      <div
                        key={subcat.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                            style={{
                              backgroundColor: subcat.color + "20",
                              color: subcat.color,
                            }}
                          >
                            {subcat.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {subcat.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {subcat.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {subcat.product_count} ürün
                          </span>
                          <button
                            onClick={() => handleToggleActive(subcat)}
                            className={`p-1 rounded ${
                              subcat.is_active
                                ? "text-green-600 hover:bg-green-50"
                                : "text-gray-400 hover:bg-gray-50"
                            }`}
                          >
                            {subcat.is_active ? (
                              <EyeIcon className="w-3 h-3" />
                            ) : (
                              <EyeSlashIcon className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditCategory(subcat)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteCategory(subcat)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {(showAddModal || editingCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCategory ? "Kategori Düzenle" : "Yeni Kategori Ekle"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori Adı *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Kategori adı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Kategori açıklaması"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İkon
                  </label>
                  <input
                    type="text"
                    value={newCategory.icon}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, icon: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="🛍️"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Renk
                  </label>
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, color: e.target.value })
                    }
                    className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Üst Kategori
                </label>
                <select
                  value={newCategory.parent_id || ""}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      parent_id: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Ana Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newCategory.is_active}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      is_active: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Aktif kategori
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setNewCategory({
                    name: "",
                    description: "",
                    parent_id: null,
                    icon: "",
                    color: "#3B82F6",
                    is_active: true,
                    sort_order: 0,
                  });
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={
                  editingCategory
                    ? () =>
                        handleUpdateCategory(editingCategory.id, newCategory)
                    : handleAddCategory
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingCategory ? "Güncelle" : "Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCategory && (
        <ConfirmationModal
          isOpen={!!deleteCategory}
          onClose={() => setDeleteCategory(null)}
          onConfirm={() => handleDeleteCategory(deleteCategory.id)}
          title="Kategori Sil"
          message={`"${deleteCategory.name}" kategorisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          cancelText="İptal"
          type="danger"
        />
      )}
    </div>
  );
}
