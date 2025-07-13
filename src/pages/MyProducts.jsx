import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Spinner from "../components/Spinner";
import ProductForm from "../components/ProductForm";
import MyProductCard from "../components/MyProductCard";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import FilterDropdown from "../components/FilterDropdown";
import ConfirmationModal from "../components/ConfirmationModal";
import { toast } from "react-hot-toast";
import ProductStatusBadge from "../components/ProductStatusBadge";

const MyProducts = () => {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    sort: "newest",
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const productsPerPage = 12;

  // Ürünleri getirme sorgusu
  const {
    isLoading,
    error,
    data: productsData,
    refetch,
  } = useQuery({
    queryKey: ["my-products", filters, searchTerm, currentPage],
    queryFn: () =>
      getProducts({
        onlyOwn: true,
        status: filters.status !== "all" ? filters.status : undefined,
        category: filters.category !== "all" ? filters.category : undefined,
        sort: filters.sort,
        search: searchTerm,
        page: currentPage,
        limit: productsPerPage,
      }),
    keepPreviousData: true,
  });

  // Silme mutasyonu
  const deleteMutation = useMutation(deleteProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries(["my-products"]);
      toast.success("Ürün başarıyla silindi");
    },
    onError: (error) => {
      toast.error(`Ürün silinirken hata: ${error.message}`);
    },
  });

  // Toplu işlem mutasyonu
  const bulkActionMutation = useMutation(bulkUpdateProductStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries(["my-products"]);
      setSelectedProducts([]);
      setBulkAction("");
      toast.success("Toplu işlem başarıyla uygulandı");
    },
    onError: (error) => {
      toast.error(`Toplu işlem hatası: ${error.message}`);
    },
  });

  const products = productsData?.data || [];
  const totalProducts = productsData?.meta?.total || 0;
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  // Arama terimi değiştiğinde sayfayı sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(productToDelete.id);
    setShowDeleteModal(false);
  };

  const handleBulkAction = () => {
    if (selectedProducts.length === 0 || !bulkAction) return;

    bulkActionMutation.mutate({
      productIds: selectedProducts,
      status: bulkAction,
    });
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const statusOptions = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "active", label: "Aktif" },
    { value: "draft", label: "Taslak" },
    { value: "archived", label: "Arşivlenmiş" },
    { value: "out_of_stock", label: "Stokta Yok" },
  ];

  const categoryOptions = [
    { value: "all", label: "Tüm Kategoriler" },
    { value: "electronics", label: "Elektronik" },
    { value: "clothing", label: "Giyim" },
    // Diğer kategoriler...
  ];

  const sortOptions = [
    { value: "newest", label: "En Yeniler" },
    { value: "oldest", label: "En Eski" },
    { value: "price_high", label: "Fiyat (Yüksek)" },
    { value: "price_low", label: "Fiyat (Düşük)" },
    { value: "popular", label: "Popüler" },
  ];

  if (isLoading && !productsData) return <Spinner fullPage />;
  if (error)
    return (
      <div className="text-center text-red-600 mt-8">
        Ürünler yüklenirken bir hata oluştu: {error.message}
        <button
          onClick={refetch}
          className="ml-4 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center mx-auto mt-2"
        >
          <ArrowPathIcon className="mr-2 w-4 h-4" /> Yeniden Dene
        </button>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Ürünlerim</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => setEditingProduct({})} // Yeni ürün ekleme modunu aç
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center"
          >
            <PlusIcon className="mr-2 w-4 h-4" /> Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* Filtreleme ve Arama */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="text-gray-400 w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Ürün adı, açıklama veya SKU ile ara..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2.5 bottom-2.5 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Ara
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FilterDropdown
            options={statusOptions}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            label="Durum"
          />
          <FilterDropdown
            options={categoryOptions}
            value={filters.category}
            onChange={(value) => setFilters({ ...filters, category: value })}
            label="Kategori"
          />
          <FilterDropdown
            options={sortOptions}
            value={filters.sort}
            onChange={(value) => setFilters({ ...filters, sort: value })}
            label="Sırala"
          />
        </div>
      </div>

      {/* Toplu İşlemler */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedProducts.length === products.length}
              onChange={selectAllProducts}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              {selectedProducts.length} ürün seçildi
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
            >
              <option value="">Toplu İşlem Seçin</option>
              <option value="active">Aktif Yap</option>
              <option value="draft">Taslak Yap</option>
              <option value="archived">Arşivle</option>
              <option value="delete">Sil</option>
            </select>

            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || bulkActionMutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center"
            >
              {bulkActionMutation.isLoading ? (
                <>
                  <ArrowPathIcon className="animate-spin mr-2 w-4 h-4" />{" "}
                  Uygulanıyor...
                </>
              ) : (
                "Uygula"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Ürün Listesi */}
      {products.length === 0 ? (
        <EmptyState
          title="Ürün Bulunamadı"
          description="Henüz hiç ürün eklemediniz veya filtrelerinize uygun ürün bulunamadı."
          actionText="Yeni Ürün Ekle"
          onAction={() => setEditingProduct({})}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <MyProductCard
              key={product.id}
              product={product}
              onDelete={handleDelete}
              onEdit={setEditingProduct}
              selected={selectedProducts.includes(product.id)}
              onSelect={toggleProductSelection}
            />
          ))}
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Ürün Düzenleme Formu */}
      {editingProduct && (
        <ProductForm
          productToEdit={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            queryClient.invalidateQueries(["my-products"]);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Silme Onay Modalı */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Ürünü Sil"
        confirmText="Sil"
        cancelText="İptal"
        isProcessing={deleteMutation.isLoading}
      >
        <p className="text-gray-700">
          <span className="font-semibold">{productToDelete?.name}</span> adlı
          ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        </p>
        {productToDelete?.status === "active" && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700">
              Bu ürün şu anda aktif durumda. Silerseniz müşterileriniz bu ürünü
              göremeyecek.
            </p>
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
};

export default MyProducts;
