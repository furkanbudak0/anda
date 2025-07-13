import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingStorefrontIcon,
  StarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import NavBar from "../../components/NavBar";
import Spinner from "../../components/Spinner";
import { formatPrice, formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

export default function AdminSellerManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState("");
  const [approvalReason, setApprovalReason] = useState("");
  const [algorithmBoost, setAlgorithmBoost] = useState(1);

  // Fetch sellers
  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["admin-sellers", searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("sellers")
        .select(
          `
          *,
          user:profiles(full_name, email),
          products_count:products(count),
          orders_count:orders(count),
          total_revenue:orders(total_amount),
          algorithm_score:seller_algorithm_scores(total_score, admin_boost)
        `
        )
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `business_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filteredSellers = sellers.filter((seller) => {
    const matchesStatus =
      statusFilter === "all" || seller.status === statusFilter;

    return matchesStatus;
  });

  // Update seller status mutation
  const updateSellerStatusMutation = useMutation({
    mutationFn: async ({ sellerId, status, reason }) => {
      const { error } = await supabase
        .from("sellers")
        .update({
          status,
          verification_status: status === "approved" ? "verified" : "rejected",
        })
        .eq("id", sellerId);

      if (error) throw error;

      // Log admin activity
      if (import.meta.env.DEV) {
        console.log(`Admin activity logged: ${status}_seller`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-sellers"]);
      toast.success("Satıcı durumu başarıyla güncellendi!");
      setIsApprovalModalOpen(false);
      setApprovalReason("");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Algorithm boost mutation
  const boostSellerMutation = useMutation({
    mutationFn: async ({ sellerId, boost }) => {
      const { error } = await supabase.from("seller_algorithm_scores").upsert({
        seller_id: sellerId,
        admin_boost: boost,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      if (import.meta.env.DEV) {
        console.log("Admin activity logged: boost_seller");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-sellers"]);
      toast.success("Algoritma boost'u başarıyla güncellendi!");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleStatusUpdate = (seller, action) => {
    setSelectedSeller(seller);
    setApprovalAction(action);
    setIsApprovalModalOpen(true);
  };

  const handleConfirmStatusUpdate = () => {
    if (!approvalReason.trim()) {
      toast.error("Sebep açıklaması zorunludur!");
      return;
    }

    updateSellerStatusMutation.mutate({
      sellerId: selectedSeller.id,
      status: approvalAction,
      reason: approvalReason,
    });
  };

  const handleViewSeller = (seller) => {
    setSelectedSeller(seller);
    setAlgorithmBoost(seller.algorithm_score?.[0]?.admin_boost || 1);
    setIsDetailModalOpen(true);
  };

  const handleBoostUpdate = () => {
    boostSellerMutation.mutate({
      sellerId: selectedSeller.id,
      boost: algorithmBoost,
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Beklemede",
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Onaylandı",
      },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Reddedildi" },
      suspended: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Askıya Alındı",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Satıcı Yönetimi
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Platform satıcılarını onaylayın, yönetin ve takip edin.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">
                Filtreler
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arama
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="İşletme adı veya email ile ara..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durum
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onaylandı</option>
                  <option value="rejected">Reddedildi</option>
                  <option value="suspended">Askıya Alındı</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sellers Table */}
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
              <div className="flex justify-center">
                <Spinner size="lg" />
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Satıcı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Başvuru Tarihi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Performans
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSellers.map((seller) => (
                      <tr
                        key={seller.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                <BuildingStorefrontIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {seller.business_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {seller.email}
                              </div>
                              {seller.rating && renderStars(seller.rating)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(seller.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(seller.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CurrencyDollarIcon className="w-4 h-4 text-green-500" />
                              <span>
                                {formatPrice(seller.total_sales || 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>
                                {seller.products_count?.[0]?.count || 0} ürün
                              </span>
                              <span>•</span>
                              <span>
                                {seller.orders_count?.[0]?.count || 0} sipariş
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewSeller(seller)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                              <EyeIcon className="w-4 h-4" />
                              Görüntüle
                            </button>
                            {seller.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(seller, "approved")
                                  }
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                  Onayla
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(seller, "rejected")
                                  }
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                  Reddet
                                </button>
                              </>
                            )}
                            {seller.status === "approved" && (
                              <button
                                onClick={() => handleViewSeller(seller)}
                                className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
                              >
                                <ArrowTrendingUpIcon className="w-4 h-4" />
                                Boost
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredSellers.length === 0 && (
                  <div className="text-center py-12">
                    <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      Satıcı bulunamadı
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Arama kriterlerinize uygun satıcı bulunamadı.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seller Detail Modal */}
          {isDetailModalOpen && selectedSeller && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Satıcı Detayları
                  </h3>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      İşletme Bilgileri
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          İşletme Adı
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSeller.business_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Email
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSeller.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Telefon
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSeller.phone || "Belirtilmemiş"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Vergi No
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSeller.tax_id || "Belirtilmemiş"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Performance & Algorithm */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Performans & Algoritma
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Toplam Satış
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatPrice(selectedSeller.total_sales || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Ürün Sayısı
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSeller.products_count?.[0]?.count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Sipariş Sayısı
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSeller.orders_count?.[0]?.count || 0}
                        </p>
                      </div>
                      {selectedSeller.rating && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Değerlendirme
                          </p>
                          {renderStars(selectedSeller.rating)}
                        </div>
                      )}
                    </div>

                    {/* Algorithm Boost */}
                    {selectedSeller.status === "approved" && (
                      <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-3">
                          Algoritma Boost
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-purple-700 dark:text-purple-300 mb-1">
                              Boost Çarpanı (1.0 - 5.0)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={algorithmBoost}
                              onChange={(e) =>
                                setAlgorithmBoost(parseFloat(e.target.value))
                              }
                              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            onClick={handleBoostUpdate}
                            disabled={boostSellerMutation.isLoading}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                          >
                            {boostSellerMutation.isLoading
                              ? "Güncelleniyor..."
                              : "Boost'u Güncelle"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approval Modal */}
          {isApprovalModalOpen && selectedSeller && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Satıcı {approvalAction === "approved" ? "Onayı" : "Reddi"}
                  </h3>
                  <button
                    onClick={() => setIsApprovalModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {selectedSeller.business_name} satıcısını{" "}
                      {approvalAction === "approved"
                        ? "onaylamak"
                        : "reddetmek"}{" "}
                      istediğinizden emin misiniz?
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sebep Açıklaması
                    </label>
                    <textarea
                      value={approvalReason}
                      onChange={(e) => setApprovalReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder={`${
                        approvalAction === "approved" ? "Onay" : "Red"
                      } sebebinizi açıklayın...`}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsApprovalModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleConfirmStatusUpdate}
                      disabled={updateSellerStatusMutation.isLoading}
                      className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                        approvalAction === "approved"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {updateSellerStatusMutation.isLoading
                        ? "İşleniyor..."
                        : approvalAction === "approved"
                        ? "Onayla"
                        : "Reddet"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
